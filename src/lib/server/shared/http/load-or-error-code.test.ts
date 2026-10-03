import { describe, expect, it } from 'vitest'
import { AppError } from '../domain/app-error'
import { loadOrErrorCode } from './load-or-error-code'

describe('loadOrErrorCode', () => {
	it('returns the data when the loader succeeds', async () => {
		expect(await loadOrErrorCode(async () => 42)).toEqual({ data: 42, errorCode: null })
	})

	it('returns the contract code of an AppError', async () => {
		const outcome = await loadOrErrorCode(async () => {
			throw new AppError('RATE_LIMITED')
		})
		expect(outcome).toEqual({ data: null, errorCode: 'RATE_LIMITED' })
	})

	it('maps an unknown error to INTERNAL', async () => {
		const outcome = await loadOrErrorCode(async () => {
			throw new Error('boom')
		})
		expect(outcome).toEqual({ data: null, errorCode: 'INTERNAL' })
	})
})
