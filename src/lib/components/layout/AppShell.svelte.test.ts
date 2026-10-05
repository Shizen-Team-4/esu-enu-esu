import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import { textSnippet } from '$lib/test/snippet'
import AppShell from './AppShell.svelte'

describe('AppShell', () => {
	it('renders header, content and nav', () => {
		render(AppShell, {
			props: {
				header: textSnippet('Header'),
				children: textSnippet('Content'),
				nav: textSnippet('Nav'),
			},
		})
		expect(screen.getByText('Header')).toBeInTheDocument()
		expect(screen.getByRole('main')).toHaveTextContent('Content')
		expect(screen.getByText('Nav')).toBeInTheDocument()
	})

	it('reserves space for the fixed nav', () => {
		render(AppShell, { props: { children: textSnippet('Content'), nav: textSnippet('Nav') } })
		expect(screen.getByRole('main').style.paddingBottom).toContain('var(--nav-height)')
	})

	it('adds no bottom padding without a nav', () => {
		render(AppShell, { props: { children: textSnippet('Content') } })
		expect(screen.getByRole('main').style.paddingBottom).toBe('')
	})
})
