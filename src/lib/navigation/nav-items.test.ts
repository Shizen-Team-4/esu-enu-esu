import { describe, expect, it } from 'vitest'
import { isActive, mobileNavItems, sidebarNavItems } from './nav-items'

describe('nav items', () => {
	it('lists the five mobile destinations in order', () => {
		expect(mobileNavItems.map((item) => item.href)).toEqual([
			'/',
			'/search',
			'/create',
			'/notifications',
			'/profile',
		])
	})

	it('lists the sidebar destinations', () => {
		expect(sidebarNavItems.map((item) => item.key)).toEqual(['home', 'notifications', 'profile'])
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

	it('matches profile pages', () => {
		expect(isActive('/u/test_user', '/profile')).toBe(true)
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
