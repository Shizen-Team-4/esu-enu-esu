const INVALID_LINK_ERRORS = ['invalid_token', 'token_expired']

export function verifyLinkErrorKey(error: string | null): string | null {
	return error !== null && INVALID_LINK_ERRORS.includes(error) ? 'auth.verifyLinkInvalid' : null
}
