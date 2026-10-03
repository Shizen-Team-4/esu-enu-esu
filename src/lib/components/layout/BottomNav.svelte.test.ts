import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import BottomNav from './BottomNav.svelte'
import { DEFAULT_NAV_ITEMS } from './nav-items'

const renderNav = (pathname: string) =>
	render(BottomNav, { props: { items: DEFAULT_NAV_ITEMS, pathname } })

describe('BottomNav', () => {
	it('is a labelled navigation landmark', () => {
		renderNav('/')
		expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
	})

	it('renders five links with translated names', () => {
		renderNav('/')
		const names = screen.getAllByRole('link').map((link) => link.getAttribute('aria-label'))
		expect(names).toEqual(['Home', 'Search', 'Create', 'Reels', 'Profile'])
	})

	it('marks only the current item with aria-current', () => {
		renderNav('/search')
		expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('aria-current', 'page')
		expect(screen.getAllByRole('link', { current: 'page' })).toHaveLength(1)
	})

	it('marks the item for a nested path as current', () => {
		renderNav('/reels/abc')
		expect(screen.getByRole('link', { name: 'Reels' })).toHaveAttribute('aria-current', 'page')
		expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
	})
})
