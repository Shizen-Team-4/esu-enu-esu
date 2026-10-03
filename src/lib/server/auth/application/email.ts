export interface EmailMessage {
	to: string
	subject: string
	text: string
}
export interface EmailSender {
	send(message: EmailMessage): Promise<void>
}

export const sendVerification = (sender: EmailSender) => (email: string, url: string) =>
	sender.send({
		to: email,
		subject: 'Verify your SNS email',
		text: `Verify your email address by opening this link:\n\n${url}`,
	})

export const sendPasswordReset = (sender: EmailSender) => (email: string, url: string) =>
	sender.send({
		to: email,
		subject: 'Reset your SNS password',
		text: `Reset your password by opening this link:\n\n${url}\n\nThis link expires in one hour.`,
	})
