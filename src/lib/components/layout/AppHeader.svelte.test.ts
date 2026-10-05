import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { textSnippet } from '$lib/test/snippet'
import AppHeader from './AppHeader.svelte'

describe('AppHeader', () => {
	it('renders the title as a heading', () => {
		render(AppHeader, { props: { title: 'Posts' } })
		expect(screen.getByRole('heading', { name: 'Posts' })).toBeInTheDocument()
	})

	it('has no back button without onBack', () => {
		render(AppHeader, { props: { title: 'Posts' } })
		expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
	})

	it('shows a back button that calls onBack', async () => {
		const onBack = vi.fn()
		render(AppHeader, { props: { title: 'Posts', onBack } })
		await userEvent.click(screen.getByRole('button', { name: 'Back' }))
		expect(onBack).toHaveBeenCalledOnce()
	})

	it('renders the actions snippet', () => {
		render(AppHeader, { props: { title: 'Posts', actions: textSnippet('Action') } })
		expect(screen.getByText('Action')).toBeInTheDocument()
	})
})
