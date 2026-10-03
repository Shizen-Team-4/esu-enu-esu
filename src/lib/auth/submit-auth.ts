export type AuthOperation = 'login' | 'register' | 'request-reset' | 'reset'

export async function submitAuth(
	operation: AuthOperation,
	input: Record<string, string>,
	origin: string,
): Promise<{ ok: boolean; code: string }> {
	const paths: Record<AuthOperation, string> = {
		login: 'sign-in/email',
		register: 'sign-up/email',
		'request-reset': 'request-password-reset',
		reset: 'reset-password',
	}
	const body =
		operation === 'register'
			? { ...input, callbackURL: `${origin}/login` }
			: operation === 'request-reset'
				? { email: input.email, redirectTo: `${origin}/reset-password` }
				: operation === 'reset'
					? { token: input.token, newPassword: input.password }
					: input
	try {
		const response = await fetch(`/api/auth/${paths[operation]}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		})
		if (response.ok) return { ok: true, code: '' }
		const result = (await response.json()) as { code?: string }
		return {
			ok: false,
			code: result.code === 'EMAIL_NOT_VERIFIED' ? 'EMAIL_NOT_VERIFIED' : 'FAILED',
		}
	} catch {
		return { ok: false, code: 'FAILED' }
	}
}
