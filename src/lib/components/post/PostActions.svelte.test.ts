import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PostActions from './PostActions.svelte'

const base = {
	counts: { likes: 1234, comments: 5 },
	viewer: { liked: false, saved: false, isAuthor: false },
}

describe('PostActions', () => {
	it('shows short counts for likes and comments', () => {
		render(PostActions, { props: base })
		expect(screen.getByText('1.2K')).toBeInTheDocument()
		expect(screen.getByText('5')).toBeInTheDocument()
	})

	it('has a button for each action', () => {
		render(PostActions, { props: base })
		for (const name of ['Like', 'Comment', 'Repost to feed', 'Save']) {
			expect(screen.getByRole('button', { name })).toBeInTheDocument()
		}
	})

	it('marks like and save as not pressed by default', () => {
		render(PostActions, { props: base })
		expect(screen.getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'false')
		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'false')
	})

	it('marks like and save as pressed when the viewer did them', () => {
		render(PostActions, {
			props: { ...base, viewer: { liked: true, saved: true, isAuthor: false } },
		})
		expect(screen.getByRole('button', { name: 'Like', pressed: true })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Save', pressed: true })).toBeInTheDocument()
	})

	it('calls each callback', async () => {
		const user = userEvent.setup()
		const handlers = { onLike: vi.fn(), onComment: vi.fn(), onShare: vi.fn(), onSave: vi.fn() }
		render(PostActions, { props: { ...base, ...handlers } })
		await user.click(screen.getByRole('button', { name: 'Like' }))
		await user.click(screen.getByRole('button', { name: 'Comment' }))
		await user.click(screen.getByRole('button', { name: 'Repost to feed' }))
		await user.click(screen.getByRole('button', { name: 'Save' }))
		for (const handler of Object.values(handlers)) expect(handler).toHaveBeenCalledTimes(1)
	})
})
