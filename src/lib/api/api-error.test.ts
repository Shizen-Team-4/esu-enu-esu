import { describe, expect, it } from 'vitest'
import { ApiError, readApiError } from './api-error'

const json = (body: unknown, status = 400) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('readApiError', () => {
	it('reads code, fields and retry hint from an error envelope', async () => {
		const error = await readApiError(
			json({
				error: { code: 'RATE_LIMITED', message: 'slow', fields: { a: 'TAKEN' }, retryAfterSec: 5 },
			}),
		)

		expect(error).toBeInstanceOf(ApiError)
		expect(error.code).toBe('RATE_LIMITED')
		expect(error.message).toBe('slow')
		expect(error.fields).toEqual({ a: 'TAKEN' })
		expect(error.retryAfterSec).toBe(5)
	})

	it('falls back to INTERNAL for a non-JSON body', async () => {
		const error = await readApiError(new Response('<html>', { status: 502 }))

		expect(error.code).toBe('INTERNAL')
	})

	it.each([[{ message: 'x' }], [{ error: 'x' }], [{ error: { code: 3 } }], [null]])(
		'falls back to INTERNAL for the wrong shape %j',
		async (body) => {
			expect((await readApiError(json(body))).code).toBe('INTERNAL')
		},
	)
})

describe('ApiError', () => {
	it('uses the code as default message', () => {
		expect(new ApiError('UPLOAD_EXPIRED').message).toBe('UPLOAD_EXPIRED')
	})
})
