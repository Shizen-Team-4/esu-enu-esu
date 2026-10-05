import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockPosts } from '$lib/mocks/posts'
import { FakeIntersectionObserver } from '$lib/test/fake-intersection-observer'
import { aspectRatioOf, installFakeMedia } from '$lib/test/fake-media'
import MediaGallery from './MediaGallery.svelte'

const media = mockPosts.find((post) => post.id === 'pst_103')!.media

beforeEach(() => {
	FakeIntersectionObserver.reset()
	vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
	installFakeMedia()
})

afterEach(() => {
	cleanup() // destroy components while the fake play/pause is still installed
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

const setup = () => {
	render(MediaGallery, { props: { media, alt: 'Trip' } })
	return screen.getByRole('group', { name: 'Post media' })
}

const swipe = async (gallery: HTMLElement, from: number, to: number, dy = 0) => {
	await fireEvent.pointerDown(gallery, { clientX: from, clientY: 0 })
	await fireEvent.pointerUp(gallery, { clientX: to, clientY: dy })
}

describe('MediaGallery', () => {
	it('is a carousel that shows the first item and a counter', () => {
		const gallery = setup()
		expect(gallery).toHaveAttribute('aria-roledescription', 'carousel')
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
		expect(screen.getAllByRole('img', { name: 'Trip' })).toHaveLength(1)
	})

	it('keeps the frame ratio of the first item', () => {
		const gallery = setup()
		expect(aspectRatioOf(gallery)).toBe(1)
	})

	it('hides the other slides from assistive technology', () => {
		const gallery = setup()
		const slides = gallery.querySelectorAll('[aria-roledescription="slide"]')
		expect(slides).toHaveLength(10)
		expect(slides[0]).toHaveAttribute('aria-hidden', 'false')
		expect(slides[1]).toHaveAttribute('aria-hidden', 'true')
	})

	it('disables the previous button on the first item', () => {
		setup()
		expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
	})

	it('moves with the next and previous buttons', async () => {
		const user = userEvent.setup()
		setup()
		await user.click(screen.getByRole('button', { name: 'Next' }))
		expect(screen.getByText('2 / 10')).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'Previous' }))
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})

	it('disables the next button on the last item', async () => {
		const gallery = setup()
		for (let step = 0; step < 9; step++) await fireEvent.keyDown(gallery, { key: 'ArrowRight' })
		expect(screen.getByText('10 / 10')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
	})

	it('moves with ArrowRight and ArrowLeft', async () => {
		const gallery = setup()
		await fireEvent.keyDown(gallery, { key: 'ArrowRight' })
		expect(screen.getByText('2 / 10')).toBeInTheDocument()
		await fireEvent.keyDown(gallery, { key: 'ArrowLeft' })
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})

	it('ignores other keys and does not go past the first item', async () => {
		const gallery = setup()
		await fireEvent.keyDown(gallery, { key: 'ArrowLeft' })
		await fireEvent.keyDown(gallery, { key: 'a' })
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})

	it('moves to the next item on a swipe left and back on a swipe right', async () => {
		const gallery = setup()
		await swipe(gallery, 300, 100)
		expect(screen.getByText('2 / 10')).toBeInTheDocument()
		await swipe(gallery, 100, 300)
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})

	it('ignores a short swipe', async () => {
		const gallery = setup()
		await swipe(gallery, 200, 170)
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})

	it('ignores a mostly vertical movement', async () => {
		const gallery = setup()
		await swipe(gallery, 300, 230, 200)
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})

	it('ignores a pointer release without a press and after a cancel', async () => {
		const gallery = setup()
		await fireEvent.pointerUp(gallery, { clientX: 0, clientY: 0 })
		await fireEvent.pointerDown(gallery, { clientX: 300, clientY: 0 })
		await fireEvent.pointerCancel(gallery)
		await fireEvent.pointerUp(gallery, { clientX: 0, clientY: 0 })
		expect(screen.getByText('1 / 10')).toBeInTheDocument()
	})
})
