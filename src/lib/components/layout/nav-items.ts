import type { LucideIcon } from '@lucide/svelte'
import Clapperboard from '@lucide/svelte/icons/clapperboard'
import House from '@lucide/svelte/icons/house'
import Search from '@lucide/svelte/icons/search'
import SquarePlus from '@lucide/svelte/icons/square-plus'
import User from '@lucide/svelte/icons/user'

export type NavItem = {
	id: string
	href: string
	/** svelte-i18n key for the item's label. */
	labelKey: string
	icon: LucideIcon
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
	{ id: 'home', href: '/', labelKey: 'nav.home', icon: House },
	{ id: 'search', href: '/search', labelKey: 'nav.search', icon: Search },
	{ id: 'create', href: '/create', labelKey: 'nav.create', icon: SquarePlus },
	{ id: 'reels', href: '/reels', labelKey: 'nav.reels', icon: Clapperboard },
	{ id: 'profile', href: '/me', labelKey: 'nav.profile', icon: User },
]

/** Home matches only `/`; other items match their path and anything nested below it. */
export const isActive = (item: Pick<NavItem, 'href'>, pathname: string): boolean => {
	if (item.href === '/') return pathname === '/'
	return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
