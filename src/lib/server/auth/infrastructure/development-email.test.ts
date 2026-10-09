import { describe, expect, it, vi } from 'vitest'
import { createDevelopmentEmailSender } from './development-email'

describe('createDevelopmentEmailSender', () => {
	it('logs the message so local verification links can be opened manually', async () => {
		const info = vi.fn()
		const message = {
			to: 'user@example.com',
			subject: 'Verify your SNS email',
			text: 'Open http://localhost:5173/verify?token=abc',
		}

		await createDevelopmentEmailSender({ info }).send(message)

		expect(info).toHaveBeenCalledWith('[local development email]', message)
	})
})
