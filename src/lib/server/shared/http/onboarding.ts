const exemptRoots = ['/onboard', '/api', '/auth', '/logout', '/media', '/_app']

/** Paths that must stay reachable before onboarding: the form itself, APIs, sign-out and assets. */
export function isOnboardingExempt(pathname: string): boolean {
	if (exemptRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))) return true
	return /\.[A-Za-z0-9]+$/.test(pathname)
}

/** A logged-in user without a username (e.g. new Google sign-in) must pick one first. */
export function needsOnboarding(
	user: { username?: string | null } | null,
	pathname: string,
): boolean {
	return user !== null && !user.username && !isOnboardingExempt(pathname)
}
