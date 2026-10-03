import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockPosts } from '$lib/mocks/posts'
import PostMenu from './PostMenu.svelte'

const authorPost = mockPosts.find((post) => post.viewer.isAuthor)!
const otherPost = mockPosts.find((post) => !post.viewer.isAuthor)!

describe('PostMenu', () => {
	it('is closed at first', () => {
		render(PostMenu, { props: { post: authorPost } })
		expect(screen.getByRole('button', { name: 'Post options' })).toBeInTheDocument()
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
	})

	it('offers edit and delete to the author', async () => {
		const user = userEvent.setup()
		render(PostMenu, { props: { post: authorPost } })
		await user.click(screen.getByRole('button', { name: 'Post options' }))
		const items = await screen.findAllByRole('menuitem', { hidden: true })
		expect(items.map((item) => item.textContent?.trim())).toEqual(['Edit', 'Delete'])
	})

	it('offers only report to other users', async () => {
		const user = userEvent.setup()
		render(PostMenu, { props: { post: otherPost } })
		await user.click(screen.getByRole('button', { name: 'Post options' }))
		const items = await screen.findAllByRole('menuitem', { hidden: true })
		expect(items.map((item) => item.textContent?.trim())).toEqual(['Report'])
	})

	it('calls onAction with the chosen action', async () => {
		const user = userEvent.setup()
		const onAction = vi.fn()
		render(PostMenu, { props: { post: authorPost, onAction } })
		await user.click(screen.getByRole('button', { name: 'Post options' }))
		await user.click(await screen.findByText('Delete'))
		expect(onAction).toHaveBeenCalledExactlyOnceWith('delete')
	})

	it('works without a callback', async () => {
		const user = userEvent.setup()
		render(PostMenu, { props: { post: otherPost } })
		await user.click(screen.getByRole('button', { name: 'Post options' }))
		await user.click(await screen.findByText('Report'))
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
	})
})
