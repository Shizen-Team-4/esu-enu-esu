import { describe, expect, it } from 'vitest'
import { DEFAULT_NAV_ITEMS, isActive } from './nav-items'

const item = (href: string) => ({ href })

describe('isActive', () => {
	it('matches home only on the exact root path', () => {
		expect(isActive(item('/'), '/')).toBe(true)
		expect(isActive(item('/'), '/reels')).toBe(false)
	})

	it('matches the exact path', () => {
		expect(isActive(item('/reels'), '/reels')).toBe(true)
	})

	it('matches nested paths', () => {
		expect(isActive(item('/reels'), '/reels/abc')).toBe(true)
	})

	it('does not match a path that only shares a prefix', () => {
		expect(isActive(item('/reels'), '/reels' + 'x')).toBe(false)
	})

	it('does not match an unrelated path', () => {
		expect(isActive(item('/search'), '/me')).toBe(false)
	})
})

describe('DEFAULT_NAV_ITEMS', () => {
	it('lists home, search, create, reels and profile in order', () => {
		expect(DEFAULT_NAV_ITEMS.map((i) => [i.id, i.href])).toEqual([
			['home', '/'],
			['search', '/search'],
			['create', '/create'],
			['reels', '/reels'],
			['profile', '/me'],
		])
	})

	it('gives every item a label key and an icon', () => {
		for (const i of DEFAULT_NAV_ITEMS) {
			expect(i.labelKey).toBe(`nav.${i.id}`)
			expect(i.icon).toBeTruthy()
		}
	})
})
