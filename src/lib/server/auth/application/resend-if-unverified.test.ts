import { describe, expect, it } from 'vitest'
import { resendIfUnverified } from './resend-if-unverified'

describe('resendIfUnverified', () => {
	it('sends a verification email when the account is unverified', async () => {
		const sent: string[] = []
		await resendIfUnverified({ send: async (email) => void sent.push(email) })({
			email: 'user@example.com',
			emailVerified: false,
		})
		expect(sent).toEqual(['user@example.com'])
	})
	it('does nothing when the account is already verified', async () => {
		const sent: string[] = []
		await resendIfUnverified({ send: async (email) => void sent.push(email) })({
			email: 'user@example.com',
			emailVerified: true,
		})
		expect(sent).toEqual([])
	})
	it('propagates a delivery failure', async () => {
		await expect(
			resendIfUnverified({
				send: async () => {
					throw new Error('Delivery failed')
				},
			})({ email: 'user@example.com', emailVerified: false }),
		).rejects.toThrow('Delivery failed')
	})
})
