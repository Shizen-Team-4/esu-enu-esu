export interface NavItem {
	key: string
	href: string
	path: string
}

const home: NavItem = { key: 'home', href: '/', path: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z' }
const search: NavItem = {
	key: 'search',
	href: '/search',
	path: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
}
const create: NavItem = { key: 'create', href: '/create', path: 'M12 4v16 M4 12h16' }
const notifications: NavItem = {
	key: 'notifications',
	href: '/notifications',
	path: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
}
const bookmarks: NavItem = {
	key: 'bookmarks',
	href: '/bookmarks',
	path: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
}

export const mobileNavItems: NavItem[] = [home, search, create, notifications, bookmarks]
export const sidebarNavItems: NavItem[] = [home, notifications, bookmarks]

export function isActive(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/'
	return pathname === href || pathname.startsWith(`${href}/`)
}
