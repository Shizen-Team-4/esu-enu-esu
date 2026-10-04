import { describe, expect, it } from 'vitest'
import { submitAuth } from './submit-auth'

function fakeFetch(response: Response | Error) {
	const calls: { url: string; body: unknown }[] = []
	const fetch = (async (url: string, init: RequestInit) => {
		calls.push({ url, body: JSON.parse(String(init.body)) })
		if (response instanceof Error) throw response
		return response
	}) as typeof globalThis.fetch
	return { fetch, calls }
}
const failure = (status: number, code?: string) =>
	new Response(JSON.stringify(code ? { code, message: 'x' } : {}), { status })

describe('submitAuth', () => {
	it('succeeds on an OK response', async () => {
		const { fetch, calls } = fakeFetch(new Response('{}', { status: 200 }))

		const result = await submitAuth('login', { email: 'a@b.c', password: 'pw' }, 'https://x', {
			fetch,
		})

		expect(result).toEqual({ ok: true })
		expect(calls[0].url).toBe('/api/auth/sign-in/email')
	})

	it.each([
		['login', 'sign-in/email', { email: 'a@b.c', callbackURL: 'https://x/login' }],
		['register', 'sign-up/email', { callbackURL: 'https://x/login' }],
		[
			'resend-verification',
			'send-verification-email',
			{ email: 'a@b.c', callbackURL: 'https://x/login' },
		],
		['request-reset', 'request-password-reset', { redirectTo: 'https://x/reset-password' }],
		['reset', 'reset-password', { newPassword: 'pw', token: 't' }],
	] as const)('sends the %s request to its endpoint', async (operation, path, expected) => {
		const { fetch, calls } = fakeFetch(new Response('{}'))

		await submitAuth(operation, { email: 'a@b.c', password: 'pw', token: 't' }, 'https://x', {
			fetch,
		})

		expect(calls[0].url).toBe(`/api/auth/${path}`)
		expect(calls[0].body).toMatchObject(expected)
	})

	it.each(['USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'])(
		'maps %s to CONFLICT with a taken email',
		async (code) => {
			const { fetch } = fakeFetch(failure(422, code))

			expect(await submitAuth('register', {}, 'https://x', { fetch })).toEqual({
				ok: false,
				code: 'CONFLICT',
				fields: { email: 'TAKEN' },
			})
		},
	)

	it.each([
		[401, 'INVALID_EMAIL_OR_PASSWORD', 'INVALID_CREDENTIALS'],
		[403, 'EMAIL_NOT_VERIFIED', 'EMAIL_NOT_VERIFIED'],
		[400, 'INVALID_TOKEN', 'VALIDATION_FAILED'],
		[429, undefined, 'RATE_LIMITED'],
		[500, 'SOMETHING', 'INTERNAL'],
		[500, undefined, 'INTERNAL'],
	])('maps status %i code %s to %s', async (status, code, expected) => {
		const { fetch } = fakeFetch(failure(status, code))

		expect(await submitAuth('login', {}, 'https://x', { fetch })).toEqual({
			ok: false,
			code: expected,
		})
	})

	it('maps a non-JSON failure to INTERNAL', async () => {
		const { fetch } = fakeFetch(new Response('oops', { status: 502 }))

		expect(await submitAuth('login', {}, 'https://x', { fetch })).toEqual({
			ok: false,
			code: 'INTERNAL',
		})
	})

	it('maps a network error to INTERNAL', async () => {
		const { fetch } = fakeFetch(new TypeError('offline'))

		expect(await submitAuth('login', {}, 'https://x', { fetch })).toEqual({
			ok: false,
			code: 'INTERNAL',
		})
	})
})
