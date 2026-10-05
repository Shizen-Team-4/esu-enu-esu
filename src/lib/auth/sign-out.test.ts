import { describe, expect, it } from 'vitest'
import { ApiError } from '$lib/api/api-error'
import { signOut } from './sign-out'

describe('signOut', () => {
	it('posts an empty JSON body to the sign-out endpoint', async () => {
		let captured: { url: string; init?: RequestInit } | undefined
		const fakeFetch = (async (url: string, init?: RequestInit) => {
			captured = { url, init }
			return new Response('{}', { status: 200 })
		}) as typeof fetch

		await signOut(fakeFetch)

		expect(captured?.url).toBe('/api/auth/sign-out')
		expect(captured?.init?.method).toBe('POST')
		expect(captured?.init?.body).toBe('{}')
	})

	it('throws the API error from a failed response', async () => {
		const fakeFetch = (async () =>
			new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'slow down' } }), {
				status: 429,
			})) as unknown as typeof fetch

		await expect(signOut(fakeFetch)).rejects.toMatchObject({ code: 'RATE_LIMITED' })
	})

	it('throws an INTERNAL ApiError when the failure body is not an envelope', async () => {
		const fakeFetch = (async () => new Response('nope', { status: 500 })) as typeof fetch

		const error = await signOut(fakeFetch).catch((caught: unknown) => caught)

		expect(error).toBeInstanceOf(ApiError)
		expect((error as ApiError).code).toBe('INTERNAL')
	})
})
