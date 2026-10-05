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
	path: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
}
const profile: NavItem = {
	key: 'profile',
	href: '/profile',
	path: 'M20 21v-2a8 8 0 0 0-16 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
}

const reels: NavItem = {
	key: 'reels',
	href: '/reels',
	path: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M3 8h18 M8 3l3 5 M15 3l3 5 M10 12l6 3-6 3z',
}
const messages: NavItem = {
	key: 'messages',
	href: '/messages',
	path: 'm22 2-7 20-4-9-9-4 20-7z M22 2 11 13',
}
export const mobileNavItems: NavItem[] = [home, reels, create, messages, profile]
export const sidebarNavItems: NavItem[] = [
	home,
	reels,
	messages,
	search,
	notifications,
	create,
	profile,
]

export function withProfileHref(items: NavItem[], username?: string): NavItem[] {
	return items.map((item) =>
		item.key === 'profile' && username ? { ...item, href: `/u/${username}` } : item,
	)
}

export function isActive(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/'
	return pathname === href || pathname.startsWith(`${href}/`)
}
