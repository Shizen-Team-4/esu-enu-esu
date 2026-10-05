import { cleanup, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockPosts } from '$lib/mocks/posts'
import { FakeIntersectionObserver } from '$lib/test/fake-intersection-observer'
import { aspectRatioOf, installFakeMedia } from '$lib/test/fake-media'
import { LONG_CAPTION_CHARS } from '$lib/posts/caption'
import type { Post } from '$lib/types/post'
import PostCard from './PostCard.svelte'

const now = new Date('2026-10-02T12:00:00.000Z')
const byId = (id: string): Post => mockPosts.find((post) => post.id === id)!
const setup = (post: Post, props: Record<string, unknown> = {}) =>
	render(PostCard, { props: { post, now, ...props } })

beforeEach(() => {
	FakeIntersectionObserver.reset()
	vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
	installFakeMedia()
})

afterEach(() => {
	vi.useRealTimers()
	cleanup() // destroy components while the fake play/pause is still installed
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('PostCard layout', () => {
	it.each([
		['pst_101', 'text'],
		['pst_107', 'single'],
		['pst_104', 'single'],
		['pst_103', 'gallery'],
		['pst_106', 'reel'],
		['pst_105', 'reel'],
	])('renders %s with the %s layout', (id, layout) => {
		const { container } = setup(byId(id))
		expect(container.querySelector('article')).toHaveAttribute('data-layout', layout)
	})

	it('shows no media for a text post', () => {
		const { container } = setup(byId('pst_101'))
		expect(container.querySelector('img[loading], video')).toBeNull()
	})

	it('shows a single image in a frame with its ratio', () => {
		const { container } = setup(byId('pst_107'))
		const frame = container.querySelector('img')!.parentElement!
		expect(aspectRatioOf(frame)).toBeCloseTo(0.8)
	})

	it('shows a gallery with a counter for several items', () => {
		setup(byId('pst_103'))
		expect(screen.getByRole('group', { name: 'Post media' })).toHaveAttribute(
			'aria-roledescription',
			'carousel',
		)
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})

	it('shows a reel in a 9:16 frame, also for a wide video', () => {
		const { container } = setup(byId('pst_106'))
		const frame = container.querySelector('video')!.closest<HTMLElement>('[style]')!
		expect(aspectRatioOf(frame)).toBeCloseTo(9 / 16)
		expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument()
	})

	it('shows a 9:16 reel in a 9:16 frame', () => {
		const { container } = setup(byId('pst_105'))
		const frame = container.querySelector('video')!.closest<HTMLElement>('[style]')!
		expect(aspectRatioOf(frame)).toBeCloseTo(9 / 16)
	})
})

describe('PostCard header', () => {
	it('shows the author, the relative time and the counts', () => {
		setup(byId('pst_107'))
		expect(screen.getByText('Sokha')).toBeInTheDocument()
		expect(screen.getByText('12 hours ago')).toHaveAttribute('datetime', '2026-10-01T23:40:00.000Z')
		expect(screen.getByText('4')).toBeInTheDocument()
	})

	it('shows "edited" only for an edited post', () => {
		const { unmount } = setup(byId('pst_107'))
		expect(screen.getByText('· edited')).toBeInTheDocument()
		unmount()
		setup(byId('pst_108'))
		expect(screen.queryByText('· edited')).not.toBeInTheDocument()
	})

	it('uses the current time when no time is given', () => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(now)
		render(PostCard, { props: { post: byId('pst_108') } })
		expect(screen.getByText('9 hours ago')).toBeInTheDocument()
	})
})

describe('PostCard menu', () => {
	it('offers edit and delete to the author', async () => {
		setup(byId('pst_108'))
		await userEvent.click(screen.getByRole('button', { name: 'Post options' }))
		expect(await screen.findByText('Edit')).toBeInTheDocument()
		expect(screen.getByText('Delete')).toBeInTheDocument()
	})

	it('offers report to other users', async () => {
		setup(byId('pst_107'))
		await userEvent.click(screen.getByRole('button', { name: 'Post options' }))
		expect(await screen.findByText('Report')).toBeInTheDocument()
		expect(screen.queryByText('Edit')).not.toBeInTheDocument()
	})

	it('calls onMenuAction', async () => {
		const onMenuAction = vi.fn()
		setup(byId('pst_108'), { onMenuAction })
		await userEvent.click(screen.getByRole('button', { name: 'Post options' }))
		await userEvent.click(await screen.findByText('Edit'))
		expect(onMenuAction).toHaveBeenCalledExactlyOnceWith('edit')
	})
})

describe('PostCard actions', () => {
	it('reflects liked and saved state with aria-pressed', () => {
		setup(byId('pst_103'))
		expect(screen.getByRole('button', { name: 'Like', pressed: true })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Save', pressed: true })).toBeInTheDocument()
	})

	it('shows not pressed for a post the viewer did not like', () => {
		setup(byId('pst_108'))
		expect(screen.getByRole('button', { name: 'Like', pressed: false })).toBeInTheDocument()
	})

	it('fires the callbacks', async () => {
		const user = userEvent.setup()
		const handlers = { onLike: vi.fn(), onComment: vi.fn(), onShare: vi.fn(), onSave: vi.fn() }
		setup(byId('pst_101'), handlers)
		await user.click(screen.getByRole('button', { name: 'Like' }))
		await user.click(screen.getByRole('button', { name: 'Comment' }))
		await user.click(screen.getByRole('button', { name: 'Share' }))
		await user.click(screen.getByRole('button', { name: 'Save' }))
		for (const handler of Object.values(handlers)) expect(handler).toHaveBeenCalledTimes(1)
	})
})

describe('PostCard caption', () => {
	const longPost = { ...byId('pst_101'), caption: 'word '.repeat(LONG_CAPTION_CHARS) }

	it('shows a short caption without a toggle', () => {
		setup(byId('pst_101'))
		expect(screen.getByText(byId('pst_101').caption)).not.toHaveClass('line-clamp-3')
		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument()
	})

	it('shows no caption block when the caption is empty', () => {
		const { container } = setup({ ...byId('pst_101'), caption: '' })
		expect(container.querySelector('p')).toBeNull()
	})

	it('clamps a long caption and expands it with the toggle', async () => {
		const user = userEvent.setup()
		const { container } = setup(longPost)
		const caption = container.querySelector('p')!
		const toggle = screen.getByRole('button', { name: 'More' })
		expect(caption).toHaveClass('line-clamp-3')
		expect(toggle).toHaveAttribute('aria-expanded', 'false')

		await user.click(toggle)
		expect(caption).not.toHaveClass('line-clamp-3')
		expect(screen.getByRole('button', { name: 'Less' })).toHaveAttribute('aria-expanded', 'true')

		await user.click(screen.getByRole('button', { name: 'Less' }))
		expect(caption).toHaveClass('line-clamp-3')
	})

	it('keeps the toggle inside the article', () => {
		const { container } = setup(longPost)
		const article = container.querySelector('article')!
		expect(within(article).getByRole('button', { name: 'More' })).toBeInTheDocument()
	})
})
