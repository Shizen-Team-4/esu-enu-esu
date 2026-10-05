import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import EmptyState from './EmptyState.svelte'

describe('EmptyState', () => {
	it('shows the title', () => {
		render(EmptyState, { props: { title: 'No posts yet' } })
		expect(screen.getByText('No posts yet')).toBeInTheDocument()
	})

	it('shows the description when given', () => {
		render(EmptyState, { props: { title: 'No posts yet', description: 'Follow someone' } })
		expect(screen.getByText('Follow someone')).toBeInTheDocument()
	})

	it('omits the description when not given', () => {
		const { container } = render(EmptyState, { props: { title: 'No posts yet' } })
		expect(container.querySelectorAll('p')).toHaveLength(1)
	})
})
