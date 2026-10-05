const protectedRoots = [
	'/dashboard',
	'/profile',
	'/stories',
	'/create',
	'/bookmarks',
	'/notifications',
	'/messages',
]

export function isProtectedPath(pathname: string): boolean {
	return (
		pathname === '/' ||
		protectedRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))
	)
}
