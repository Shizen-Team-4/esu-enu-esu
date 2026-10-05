import { describe, expect, it } from 'vitest'
import type { ErrorEnvelope } from '$lib/contract'
import { AppError, type ErrorCode } from '../domain/app-error'
import { statusOf } from './error-envelope'
import { toActionFailure, toHttpError, toJsonError } from './error-response'

const expected: Record<ErrorCode, number> = {
	VALIDATION_FAILED: 400,
	UNAUTHENTICATED: 401,
	INVALID_CREDENTIALS: 401,
	FORBIDDEN: 403,
	EMAIL_NOT_VERIFIED: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	RATE_LIMITED: 429,
	INTERNAL: 500,
}

describe('statusOf', () => {
	it.each(Object.entries(expected))('maps %s to %i', (code, status) => {
		expect(statusOf(code as ErrorCode)).toBe(status)
	})
})

describe('toJsonError', () => {
	it('hides the message of unknown errors and reports INTERNAL', async () => {
		const response = toJsonError(new Error('secret db password'))
		const body = (await response.json()) as ErrorEnvelope
		expect(response.status).toBe(500)
		expect(body.error.code).toBe('INTERNAL')
		expect(JSON.stringify(body)).not.toContain('secret')
	})
	it('includes fields when present', async () => {
		const response = toJsonError(new AppError('VALIDATION_FAILED', { caption: 'TOO_LONG' }))
		const body = (await response.json()) as ErrorEnvelope
		expect(response.status).toBe(400)
		expect(body.error.fields).toEqual({ caption: 'TOO_LONG' })
	})
	it('omits fields and retryAfterSec when absent', async () => {
		const body = (await toJsonError(new AppError('NOT_FOUND')).json()) as ErrorEnvelope
		expect(body.error).not.toHaveProperty('fields')
		expect(body.error).not.toHaveProperty('retryAfterSec')
	})
	it('sets retryAfterSec and the Retry-After header', async () => {
		const response = toJsonError(new AppError('RATE_LIMITED', undefined, 42))
		const body = (await response.json()) as ErrorEnvelope
		expect(response.status).toBe(429)
		expect(response.headers.get('Retry-After')).toBe('42')
		expect(body.error.retryAfterSec).toBe(42)
	})
	it('sends no Retry-After header otherwise', () => {
		expect(toJsonError(new AppError('CONFLICT')).headers.has('Retry-After')).toBe(false)
	})
})

describe('toActionFailure', () => {
	it('returns the status and the envelope', () => {
		const result = toActionFailure(new AppError('FORBIDDEN'))
		expect(result.status).toBe(403)
		expect(result.data).toEqual({ error: { code: 'FORBIDDEN', message: 'FORBIDDEN' } })
	})
})

describe('toHttpError', () => {
	it('throws an HttpError with status and code', () => {
		expect.assertions(2)
		try {
			toHttpError(new AppError('NOT_FOUND'))
		} catch (thrown) {
			const httpError = thrown as { status: number; body: { code: string } }
			expect(httpError.status).toBe(404)
			expect(httpError.body.code).toBe('NOT_FOUND')
		}
	})
})
