import { describe, expect, it } from 'vitest'
import { createMailtrapSender, parseAddress } from './mailtrap-email'

const message = { to: 'user@example.com', subject: 'Hello', text: 'Body' }

function recordingFetch(response: Response) {
	const calls: { url: string; init: RequestInit }[] = []
	const send = (async (url: string, init: RequestInit) => {
		calls.push({ url, init })
		return response
	}) as typeof fetch
	return { calls, send }
}

describe('parseAddress', () => {
	it('reads a bare email address', () => {
		expect(parseAddress(' no-reply@example.com ')).toEqual({ email: 'no-reply@example.com' })
	})

	it('reads a display name and address', () => {
		expect(parseAddress('"SNS" <no-reply@example.com>')).toEqual({
			email: 'no-reply@example.com',
			name: 'SNS',
		})
	})

	it('reads an address in angle brackets without a name', () => {
		expect(parseAddress('<no-reply@example.com>')).toEqual({ email: 'no-reply@example.com' })
	})
})

describe('createMailtrapSender', () => {
	it('posts the message to the Mailtrap send API with the token', async () => {
		const { calls, send } = recordingFetch(new Response('{"success":true}'))
		const sender = createMailtrapSender(
			{ SMTP_TOKEN: 'token', SMTP_FROM: 'SNS <no-reply@example.com>' },
			send,
		)

		await sender.send(message)

		expect(calls).toHaveLength(1)
		expect(calls[0].url).toBe('https://send.api.mailtrap.io/api/send')
		expect(calls[0].init.headers).toMatchObject({ Authorization: 'Bearer token' })
		expect(JSON.parse(calls[0].init.body as string)).toEqual({
			from: { email: 'no-reply@example.com', name: 'SNS' },
			to: [{ email: 'user@example.com' }],
			subject: 'Hello',
			text: 'Body',
		})
	})

	it('throws when the token or sender is missing', async () => {
		const { calls, send } = recordingFetch(new Response('{}'))
		const sender = createMailtrapSender({ SMTP_FROM: 'no-reply@example.com' }, send)

		await expect(sender.send(message)).rejects.toThrow('SMTP_TOKEN and SMTP_FROM are required')
		expect(calls).toHaveLength(0)
	})

	it('aborts the request when Mailtrap does not respond in time', async () => {
		const hanging = ((_url: string, init: RequestInit) =>
			new Promise((_resolve, reject) => {
				init.signal?.addEventListener('abort', () => reject(init.signal?.reason))
			})) as typeof fetch
		const sender = createMailtrapSender(
			{ SMTP_TOKEN: 'token', SMTP_FROM: 'no-reply@example.com' },
			hanging,
			1,
		)

		await expect(sender.send(message)).rejects.toThrow()
	})

	it('throws with the status and body when Mailtrap rejects the message', async () => {
		const { send } = recordingFetch(new Response('{"errors":["Unauthorized"]}', { status: 401 }))
		const sender = createMailtrapSender(
			{ SMTP_TOKEN: 'bad', SMTP_FROM: 'no-reply@example.com' },
			send,
		)

		await expect(sender.send(message)).rejects.toThrow(
			'Mailtrap send failed (401): {"errors":["Unauthorized"]}',
		)
	})
})
