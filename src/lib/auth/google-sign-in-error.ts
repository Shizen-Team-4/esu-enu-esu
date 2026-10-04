export function googleSignInErrorKey(error: string | null): string | null {
	return error === 'account_not_linked' ? 'auth.googleAccountNotLinked' : null
}
