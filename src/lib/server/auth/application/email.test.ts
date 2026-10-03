import { describe, expect, it } from 'vitest'
import { sendVerification, sendPasswordReset, type EmailMessage, type EmailSender } from './email'

describe('account email', () => {
	it('sends a verification link to the account email', async () => {
		const messages: EmailMessage[] = []
		const sender: EmailSender = {
			send: async (message) => {
				messages.push(message)
			},
		}
		await sendVerification(sender)('user@example.com', 'https://example.com/verify?token=abc')
		expect(messages[0].to).toBe('user@example.com')
		expect(messages[0].text).toContain('https://example.com/verify?token=abc')
	})
	it('sends a password reset link and expiry notice', async () => {
		const messages: EmailMessage[] = []
		await sendPasswordReset({
			send: async (message) => {
				messages.push(message)
			},
		})('user@example.com', 'https://example.com/reset')
		expect(messages[0].text).toContain('https://example.com/reset')
		expect(messages[0].text).toContain('one hour')
	})
	it('propagates delivery failure instead of reporting success', async () => {
		await expect(
			sendVerification({
				send: async () => {
					throw new Error('Delivery failed')
				},
			})('user@example.com', 'https://example.com'),
		).rejects.toThrow('Delivery failed')
	})
})
