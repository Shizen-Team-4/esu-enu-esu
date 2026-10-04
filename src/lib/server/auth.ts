import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { getDb } from './db'
import * as schema from './db/schema'
import { username, admin } from 'better-auth/plugins'
import { sendVerification, sendPasswordReset, type EmailSender } from './auth/application/email'
import { resendIfUnverified } from './auth/application/resend-if-unverified'
import type { SmtpConfig } from './auth/infrastructure/smtp-email'
import { USERNAME_MAX, USERNAME_MIN, USERNAME_PATTERN } from './users/domain/profile'
import type { Lang } from '$lib/i18n/config'

// Secrets come from `.env` / `wrangler secret`, so `pnpm types` only sees them when `.env` exists.
export interface AuthSecrets {
	BETTER_AUTH_SECRET: string
	GOOGLE_CLIENT_ID?: string
	GOOGLE_CLIENT_SECRET?: string
}

export function createAuth(
	db: ReturnType<typeof getDb>,
	env: Omit<Env, 'BETTER_AUTH_URL'> & { BETTER_AUTH_URL?: string } & SmtpConfig & AuthSecrets,
	email: EmailSender,
	language: Lang,
	development = false,
) {
	const resendVerification = (address: string) =>
		auth.api
			.sendVerificationEmail({ body: { email: address, callbackURL: '/login' } })
			.then(() => undefined)
	const auth = betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		trustedOrigins: development
			? ['http://localhost:5173', 'http://127.0.0.1:5173']
			: env.BETTER_AUTH_URL
				? [env.BETTER_AUTH_URL]
				: [],
		plugins: [
			username({
				minUsernameLength: USERNAME_MIN,
				maxUsernameLength: USERNAME_MAX,
				usernameValidator: (value) => USERNAME_PATTERN.test(value),
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
			onExistingUserSignUp: async ({ user }) => {
				await resendIfUnverified({ send: resendVerification })(user)
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true,
			autoSignInAfterVerification: true,
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
				'/sign-up/email': { window: 3600, max: 3 },
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
	return auth
}
