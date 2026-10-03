const protectedRoots = ['/dashboard', '/profile', '/stories', '/create', '/bookmarks']

export function isProtectedPath(pathname: string): boolean {
	return protectedRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}
