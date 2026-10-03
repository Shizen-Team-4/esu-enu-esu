import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { getDb } from './db'
import * as schema from './db/schema'
import { username, admin } from 'better-auth/plugins'
import { sendVerification, sendPasswordReset, type EmailSender } from './auth/application/email'
import type { SmtpConfig } from './auth/infrastructure/smtp-email'
import type { Lang } from '$lib/i18n/config'

export function createAuth(
	db: ReturnType<typeof getDb>,
	env: Env & SmtpConfig,
	email: EmailSender,
	language: Lang,
	development = false,
) {
	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		trustedOrigins: development
			? ['http://localhost:5173', 'http://127.0.0.1:5173']
			: env.BETTER_AUTH_URL
				? [env.BETTER_AUTH_URL]
				: [],
		plugins: [
			username({
				minUsernameLength: 3,
				maxUsernameLength: 30,
				usernameValidator: (value) => /^[a-z0-9_]{3,30}$/.test(value),
			}),
			admin(),
		],
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			minPasswordLength: 8,
			maxPasswordLength: 128,
			resetPasswordTokenExpiresIn: 3600,
			sendResetPassword: async ({ user, url }) => {
				await sendPasswordReset(email)(user.email, url)
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			sendVerificationEmail: async ({ user, url }) => {
				await sendVerification(email)(user.email, url)
			},
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						await db
							.insert(schema.preferences)
							.values({ userId: user.id, language, updatedAt: new Date() })
							.onConflictDoNothing()
					},
				},
			},
		},
		advanced: {
			database: {
				generateId: ({ model }) =>
					`${model === 'user' ? 'usr' : model}_${crypto.randomUUID().replaceAll('-', '')}`,
			},
		},
		rateLimit: {
			enabled: true,
			storage: 'database',
			customRules: {
				'/sign-in/*': { window: 900, max: 10 },
				'/request-password-reset': { window: 3600, max: 3 },
				'/send-verification-email': { window: 3600, max: 3 },
			},
		},
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema,
		}),
		socialProviders: {
			...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: env.GOOGLE_CLIENT_ID,
							clientSecret: env.GOOGLE_CLIENT_SECRET,
						},
					}
				: {}),
		},
	})
}
