import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockPosts } from '$lib/mocks/posts'
import { FakeIntersectionObserver } from '$lib/test/fake-intersection-observer'
import { installFakeMedia } from '$lib/test/fake-media'
import VideoPlayer from './VideoPlayer.svelte'

const media = mockPosts.find((post) => post.id === 'pst_106')!.media[0]

let play: ReturnType<typeof installFakeMedia>['play']
let pause: ReturnType<typeof installFakeMedia>['pause']

beforeEach(() => {
	FakeIntersectionObserver.reset()
	vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
	;({ play, pause } = installFakeMedia())
})

afterEach(() => {
	cleanup() // destroy components while the fake play/pause is still installed
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

const video = (container: HTMLElement) => container.querySelector('video')!

describe('VideoPlayer', () => {
	it('loads metadata only and uses the thumbnail as poster', () => {
		const { container } = render(VideoPlayer, { props: { media } })
		expect(video(container)).toHaveAttribute('preload', 'metadata')
		expect(video(container)).toHaveAttribute('poster', media.thumbnailUrl)
		expect(video(container)).toHaveAttribute('src', media.url)
	})

	it('has no poster when there is no thumbnail', () => {
		const { container } = render(VideoPlayer, {
			props: { media: { ...media, thumbnailUrl: null } },
		})
		expect(video(container)).not.toHaveAttribute('poster')
	})

	it('toggles between play and pause', async () => {
		const user = userEvent.setup()
		render(VideoPlayer, { props: { media } })

		await user.click(screen.getByRole('button', { name: 'Play video' }))
		expect(play).toHaveBeenCalledTimes(1)

		await user.click(screen.getByRole('button', { name: 'Pause video' }))
		expect(pause).toHaveBeenCalledTimes(1)
		expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument()
	})

	it('goes back to the play state when the video ends', async () => {
		const user = userEvent.setup()
		const { container } = render(VideoPlayer, { props: { media } })
		await user.click(screen.getByRole('button', { name: 'Play video' }))
		await fireEvent.ended(video(container))
		expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument()
	})

	it('stays in the paused state when the browser blocks playback', async () => {
		const user = userEvent.setup()
		play.mockRejectedValue(new Error('NotAllowedError'))
		render(VideoPlayer, { props: { media } })
		await user.click(screen.getByRole('button', { name: 'Play video' }))
		expect(await screen.findByRole('button', { name: 'Play video' })).toBeInTheDocument()
	})

	it('shows the current time and the duration from the data', () => {
		render(VideoPlayer, { props: { media } })
		expect(screen.getByText('0:00 / 0:22')).toBeInTheDocument()
	})

	it('shows the playback time when it changes', async () => {
		const { container } = render(VideoPlayer, { props: { media } })
		Object.defineProperty(video(container), 'currentTime', { value: 7, configurable: true })
		await fireEvent.timeUpdate(video(container))
		expect(screen.getByText('0:07 / 0:22')).toBeInTheDocument()
	})

	it('prefers the duration reported by the file', async () => {
		const { container } = render(VideoPlayer, { props: { media } })
		Object.defineProperty(video(container), 'duration', { value: 65, configurable: true })
		await fireEvent.durationChange(video(container))
		expect(screen.getByText('0:00 / 1:05')).toBeInTheDocument()
	})

	it('pauses when it leaves the viewport', () => {
		render(VideoPlayer, { props: { media } })
		FakeIntersectionObserver.instances[0].trigger(false)
		expect(pause).toHaveBeenCalledTimes(1)
	})

	it('does not pause when it enters the viewport', () => {
		render(VideoPlayer, { props: { media } })
		FakeIntersectionObserver.instances[0].trigger(true)
		expect(pause).not.toHaveBeenCalled()
	})

	it('pauses when it is destroyed', () => {
		const { unmount } = render(VideoPlayer, { props: { media } })
		unmount()
		expect(pause).toHaveBeenCalled()
	})
})
