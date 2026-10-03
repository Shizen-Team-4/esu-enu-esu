import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFiniteDuration } from './video-duration'

class FakeVideo extends EventTarget {
	duration: number
	seeks: number[] = []
	emitSeeked = true
	constructor(duration: number) {
		super()
		this.duration = duration
	}
	set currentTime(value: number) {
		this.seeks.push(value)
		if (value === 0 && this.emitSeeked)
			queueMicrotask(() => this.dispatchEvent(new Event('seeked')))
	}
	get currentTime() {
		return this.seeks.at(-1) ?? 0
	}
}

describe('readFiniteDuration', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('returns a finite duration without seeking', async () => {
		const video = new FakeVideo(12.5)

		const result = await readFiniteDuration(video)

		expect(result).toBe(12.5)
		expect(video.seeks).toEqual([])
	})

	it('resolves after durationchange makes the duration finite and seeks back to 0', async () => {
		const video = new FakeVideo(Infinity)

		const promise = readFiniteDuration(video)
		video.duration = 7
		video.dispatchEvent(new Event('durationchange'))
		const result = await promise

		expect(result).toBe(7)
		expect(video.seeks).toEqual([Number.MAX_SAFE_INTEGER, 0])
	})

	it('resolves after timeupdate makes the duration finite', async () => {
		const video = new FakeVideo(Infinity)

		const promise = readFiniteDuration(video)
		video.duration = 3
		video.dispatchEvent(new Event('timeupdate'))

		await expect(promise).resolves.toBe(3)
	})

	it('ignores events that fire while the duration is still Infinity', async () => {
		const video = new FakeVideo(Infinity)
		let settled = false

		const promise = readFiniteDuration(video).then((value) => {
			settled = true
			return value
		})
		video.dispatchEvent(new Event('durationchange'))
		await Promise.resolve()
		const settledAfterIgnoredEvent = settled
		video.duration = 9
		video.dispatchEvent(new Event('timeupdate'))

		expect(settledAfterIgnoredEvent).toBe(false)
		await expect(promise).resolves.toBe(9)
	})

	it('rejects when the duration never becomes finite', async () => {
		vi.useFakeTimers()
		const video = new FakeVideo(Infinity)

		const promise = readFiniteDuration(video, 1000)
		const assertion = expect(promise).rejects.toThrow('Video duration unavailable')
		await vi.advanceTimersByTimeAsync(1000)

		await assertion
	})

	it('rejects when the seek back to 0 never completes', async () => {
		vi.useFakeTimers()
		const video = new FakeVideo(Infinity)
		video.emitSeeked = false

		const promise = readFiniteDuration(video, 1000)
		const assertion = expect(promise).rejects.toThrow('Video duration unavailable')
		video.duration = 5
		video.dispatchEvent(new Event('durationchange'))
		await vi.advanceTimersByTimeAsync(1000)

		await assertion
	})
})
