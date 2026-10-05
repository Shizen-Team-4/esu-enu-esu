import type { ErrorCode } from '$lib/contract'

export type AuthOperation = 'login' | 'register' | 'request-reset' | 'reset' | 'resend-verification'

export type AuthResult =
	{ ok: true } | { ok: false; code: ErrorCode; fields?: Record<string, string> }

const paths: Record<AuthOperation, string> = {
	login: 'sign-in/email',
	register: 'sign-up/email',
	'request-reset': 'request-password-reset',
	reset: 'reset-password',
	'resend-verification': 'send-verification-email',
}

function buildBody(operation: AuthOperation, input: Record<string, string>, origin: string) {
	if (operation === 'register') return { ...input, callbackURL: `${origin}/login` }
	if (operation === 'request-reset')
		return { email: input.email, redirectTo: `${origin}/reset-password` }
	if (operation === 'reset') return { token: input.token, newPassword: input.password }
	if (operation === 'resend-verification')
		return { email: input.email, callbackURL: `${origin}/login` }
	return { ...input, callbackURL: `${origin}/login` }
}

function failureFor(status: number, betterAuthCode: string | undefined): AuthResult {
	if (status === 429) return { ok: false, code: 'RATE_LIMITED' }
	switch (betterAuthCode) {
		case 'USER_ALREADY_EXISTS':
		case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
			return { ok: false, code: 'CONFLICT', fields: { email: 'TAKEN' } }
		case 'INVALID_EMAIL_OR_PASSWORD':
			return { ok: false, code: 'INVALID_CREDENTIALS' }
		case 'EMAIL_NOT_VERIFIED':
			return { ok: false, code: 'EMAIL_NOT_VERIFIED' }
		case 'INVALID_TOKEN':
			return { ok: false, code: 'VALIDATION_FAILED' }
		default:
			return { ok: false, code: 'INTERNAL' }
	}
}

async function readBetterAuthCode(response: Response): Promise<string | undefined> {
	try {
		const body = (await response.json()) as { code?: unknown }
		return typeof body.code === 'string' ? body.code : undefined
	} catch {
		return undefined
	}
}

export async function submitAuth(
	operation: AuthOperation,
	input: Record<string, string>,
	origin: string,
	deps: { fetch?: typeof globalThis.fetch } = {},
): Promise<AuthResult> {
	const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis)
	try {
		const response = await fetchFn(`/api/auth/${paths[operation]}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(buildBody(operation, input, origin)),
		})
		if (response.ok) return { ok: true }
		return failureFor(response.status, await readBetterAuthCode(response))
	} catch {
		return { ok: false, code: 'INTERNAL' }
	}
}
