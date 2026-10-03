import nodemailer from 'nodemailer'
import type { EmailSender } from '../application/email'

export interface SmtpConfig {
	GOOGLE_CLIENT_ID?: string
	GOOGLE_CLIENT_SECRET?: string
	BETTER_AUTH_SECRET?: string
	SMTP_HOST?: string
	SMTP_PORT?: string
	SMTP_USER?: string
	SMTP_TOKEN?: string
	SMTP_FROM?: string
	BETTER_AUTH_URL?: string
	MEDIA_PUBLIC_URL?: string
}

export function createSmtpSender(config: SmtpConfig): EmailSender {
	return {
		async send(message) {
			if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_TOKEN || !config.SMTP_FROM) {
				throw new Error('SMTP_HOST, SMTP_USER, SMTP_TOKEN and SMTP_FROM are required')
			}
			const port = Number(config.SMTP_PORT ?? '587')
			if (port !== 465 && port !== 587) throw new Error('SMTP_PORT must be 465 or 587')
			const transport = nodemailer.createTransport({
				host: config.SMTP_HOST,
				port,
				secure: port === 465,
				requireTLS: true,
				auth: { user: config.SMTP_USER, pass: config.SMTP_TOKEN },
				connectionTimeout: 10000,
				greetingTimeout: 10000,
				socketTimeout: 20000,
			})
			try {
				await transport.sendMail({ from: config.SMTP_FROM, ...message })
			} finally {
				transport.close()
			}
		},
	}
}
