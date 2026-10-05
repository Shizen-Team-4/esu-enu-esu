export const resendIfUnverified =
	(deps: { send: (email: string) => Promise<void> }) =>
	async (user: { email: string; emailVerified: boolean }): Promise<void> => {
		if (user.emailVerified) return
		await deps.send(user.email)
	}
