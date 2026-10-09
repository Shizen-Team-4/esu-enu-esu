import type { EmailSender } from '../application/email'

export function createDevelopmentEmailSender(log: Pick<Console, 'info'> = console): EmailSender {
	return {
		async send(message) {
			log.info('[local development email]', message)
		},
	}
}
