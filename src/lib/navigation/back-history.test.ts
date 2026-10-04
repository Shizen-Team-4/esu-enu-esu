import { describe, expect, it } from 'vitest'
import { resolveBackHref, followHistoryBack } from './back-history'

const href = 'https://sns.example/u/alice/followers'

describe('resolveBackHref', () => {
	it('hides Back on a directly opened page even with a saved path', () => {
		expect(
			resolveBackHref({
				type: 'enter',
				href,
				snapshot: { href, backHref: '/u/alice' },
			}),
		).toBeNull()
	})

	it('uses the page actually visited before a new navigation', () => {
		expect(resolveBackHref({ type: 'link', href, fromHref: '/u/alice' })).toBe('/u/alice')
	})

	it('keeps Back hidden when a same-URL link replaces a directly opened page', () => {
		expect(resolveBackHref({ type: 'link', href, fromHref: href, previousHref: null })).toBeNull()
	})

	it('preserves the predecessor when a same-URL link replaces a nested page', () => {
		expect(resolveBackHref({ type: 'link', href, fromHref: href, previousHref: '/u/alice' })).toBe(
			'/u/alice',
		)
	})

	it('preserves the predecessor when a same-URL form replaces the page', () => {
		expect(resolveBackHref({ type: 'form', href, fromHref: href, previousHref: '/search' })).toBe(
			'/search',
		)
	})

	it('does not confuse a same-URL programmatic push with a replacement', () => {
		expect(resolveBackHref({ type: 'goto', href, fromHref: href, previousHref: '/search' })).toBe(
			href,
		)
	})

	it('preserves the predecessor for an explicit replacement of a different URL', () => {
		expect(
			resolveBackHref({
				type: 'link',
				href,
				fromHref: '/search',
				previousHref: '/',
				replaceState: true,
			}),
		).toBe('/')
	})

	it('honors an explicit push even when the link has the same URL', () => {
		expect(
			resolveBackHref({
				type: 'link',
				href,
				fromHref: href,
				previousHref: '/search',
				replaceState: false,
			}),
		).toBe(href)
	})

	it('preserves the profile entry point across repeated content tab replacements', () => {
		let currentHref = 'https://sns.example/u/alice'
		let backHref: string | null = 'https://sns.example/'
		for (const type of ['reel', 'post', 'reel', 'post']) {
			const nextHref = `https://sns.example/u/alice?type=${type}`
			backHref = resolveBackHref({
				type: 'link',
				href: nextHref,
				fromHref: currentHref,
				previousHref: backHref,
				replaceState: true,
			})
			expect(backHref).toBe('https://sns.example/')
			currentHref = nextHref
		}
	})

	it('returns from a post to the selected profile tab as a normal Back step', () => {
		expect(
			resolveBackHref({
				type: 'link',
				href: 'https://sns.example/p/one',
				fromHref: 'https://sns.example/u/alice?type=reel',
				previousHref: 'https://sns.example/',
			}),
		).toBe('https://sns.example/u/alice?type=reel')
	})

	it('tracks programmatic and form navigation', () => {
		for (const type of ['goto', 'form'] as const) {
			expect(resolveBackHref({ type, href, fromHref: '/search?q=alice' })).toBe('/search?q=alice')
		}
	})

	it('does not invent a previous page when navigation has no in-app origin', () => {
		expect(resolveBackHref({ type: 'link', href })).toBeNull()
	})

	it('restores the previous page after refresh', () => {
		expect(
			resolveBackHref({
				type: 'enter',
				href,
				reloaded: true,
				snapshot: { href, backHref: '/u/alice' },
			}),
		).toBe('/u/alice')
	})

	it('keeps Back hidden when refreshing the first page', () => {
		expect(
			resolveBackHref({ type: 'enter', href, reloaded: true, snapshot: { href, backHref: null } }),
		).toBeNull()
	})

	it('ignores a refresh snapshot belonging to another URL', () => {
		expect(
			resolveBackHref({
				type: 'enter',
				href,
				reloaded: true,
				snapshot: { href: 'https://sns.example/settings', backHref: '/' },
			}),
		).toBeNull()
	})

	it('restores each history entry when browsing backward or forward', () => {
		expect(resolveBackHref({ type: 'popstate', href, restored: { backHref: '/u/alice' } })).toBe(
			'/u/alice',
		)
	})

	it('hides Back when returning to the first history entry', () => {
		expect(
			resolveBackHref({
				type: 'popstate',
				href,
				restored: { backHref: null },
				fromHref: '/search',
			}),
		).toBeNull()
	})

	it('hides Back when returning to an untracked entry', () => {
		expect(resolveBackHref({ type: 'popstate', href, fromHref: '/search' })).toBeNull()
	})

	it('ignores carried state during a new navigation', () => {
		expect(
			resolveBackHref({ type: 'goto', href, fromHref: '/search', restored: { backHref: '/' } }),
		).toBe('/search')
	})
})

describe('followHistoryBack', () => {
	it('moves back one browser entry instead of pushing another page', () => {
		let prevented = false
		let steps = 0
		followHistoryBack({ button: 0, preventDefault: () => (prevented = true) }, () => steps++)
		expect(prevented).toBe(true)
		expect(steps).toBe(1)
	})

	it('preserves modified clicks and opening the link in another tab', () => {
		for (const modifier of [
			{ button: 1 },
			{ ctrlKey: true },
			{ metaKey: true },
			{ shiftKey: true },
			{ altKey: true },
		]) {
			let called = false
			followHistoryBack(
				{ button: 0, ...modifier, preventDefault: () => (called = true) },
				() => (called = true),
			)
			expect(called).toBe(false)
		}
	})
})
