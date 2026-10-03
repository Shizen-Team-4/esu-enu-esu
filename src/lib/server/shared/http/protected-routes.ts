const protectedRoots = ['/dashboard', '/profile', '/stories', '/create']

export function isProtectedPath(pathname: string): boolean {
	return protectedRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}
