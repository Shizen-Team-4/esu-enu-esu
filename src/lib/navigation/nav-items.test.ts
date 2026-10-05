import { describe, expect, it } from 'vitest'
import { isActive, mobileNavItems, sidebarNavItems, withProfileHref } from './nav-items'

describe('nav items', () => {
	it('lists the five mobile destinations in order', () => {
		expect(mobileNavItems.map((item) => item.href)).toEqual([
			'/',
			'/reels',
			'/create',
			'/messages',
			'/profile',
		])
	})

	it('lists the sidebar destinations', () => {
		expect(sidebarNavItems.map((item) => item.key)).toEqual([
			'home',
			'reels',
			'messages',
			'search',
			'notifications',
			'create',
			'profile',
		])
	})

	it('links Profile to the signed-in user without changing other destinations', () => {
		const items = withProfileHref(mobileNavItems, 'dara')
		expect(items.at(-1)?.href).toBe('/u/dara')
		expect(items.slice(0, -1)).toEqual(mobileNavItems.slice(0, -1))
		expect(mobileNavItems.at(-1)?.href).toBe('/profile')
		expect(isActive('/u/dara', items.at(-1)!.href)).toBe(true)
		expect(isActive('/u/other', items.at(-1)!.href)).toBe(false)
	})

	it('keeps the profile redirect for guests and users awaiting onboarding', () => {
		expect(withProfileHref(sidebarNavItems).at(-1)?.href).toBe('/profile')
		expect(withProfileHref(sidebarNavItems, '').at(-1)?.href).toBe('/profile')
	})
})

describe('isActive', () => {
	it('matches home only on the exact root path', () => {
		expect(isActive('/', '/')).toBe(true)
		expect(isActive('/search', '/')).toBe(false)
	})

	it('matches an exact path', () => {
		expect(isActive('/bookmarks', '/bookmarks')).toBe(true)
	})

	it('matches nested paths', () => {
		expect(isActive('/create/post', '/create')).toBe(true)
	})

	it('does not match a path that only shares a prefix', () => {
		expect(isActive('/searching', '/search')).toBe(false)
	})

	it('does not match unrelated paths', () => {
		expect(isActive('/notifications', '/bookmarks')).toBe(false)
	})
})
