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
const profile: NavItem = {
	key: 'profile',
	href: '/profile',
	path: 'M20 21v-2a8 8 0 0 0-16 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
}

export const mobileNavItems: NavItem[] = [home, search, create, notifications, profile]
export const sidebarNavItems: NavItem[] = [home, notifications, profile]

export function withProfileHref(items: NavItem[], username?: string): NavItem[] {
	return items.map((item) =>
		item.key === 'profile' && username ? { ...item, href: `/u/${username}` } : item,
	)
}

export function isActive(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/'
	return pathname === href || pathname.startsWith(`${href}/`)
}
