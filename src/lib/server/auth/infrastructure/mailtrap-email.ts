import type { EmailSender } from '../application/email'

// Workers can't upgrade an SMTP socket to TLS, so mail goes through Mailtrap's HTTP API.
const SEND_URL = 'https://send.api.mailtrap.io/api/send'

export interface MailConfig {
	SMTP_TOKEN?: string
	SMTP_FROM?: string
}

interface Address {
	email: string
	name?: string
}

export function parseAddress(value: string): Address {
	const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(value)
	if (!match) return { email: value.trim() }
	const name = match[1].trim()
	return name ? { email: match[2].trim(), name } : { email: match[2].trim() }
}

export function createMailtrapSender(config: MailConfig, send: typeof fetch = fetch): EmailSender {
	return {
		async send(message) {
			if (!config.SMTP_TOKEN || !config.SMTP_FROM) {
				throw new Error('SMTP_TOKEN and SMTP_FROM are required')
			}
			const response = await send(SEND_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${config.SMTP_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					from: parseAddress(config.SMTP_FROM),
					to: [{ email: message.to }],
					subject: message.subject,
					text: message.text,
				}),
			})
			if (!response.ok) {
				throw new Error(`Mailtrap send failed (${response.status}): ${await response.text()}`)
			}
		},
	}
}
