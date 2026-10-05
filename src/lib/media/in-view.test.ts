import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeIntersectionObserver } from '$lib/test/fake-intersection-observer'
import { inView } from './in-view'

beforeEach(() => {
	FakeIntersectionObserver.reset()
	vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
	vi.unstubAllGlobals()
})

const attach = (options: Parameters<typeof inView>[0]) => {
	const element = {} as Element
	const cleanup = inView(options)(element) as () => void
	return { observer: FakeIntersectionObserver.instances[0], cleanup }
}

describe('inView', () => {
	it('observes the element', () => {
		const { observer } = attach({})
		expect(observer.targets.size).toBe(1)
	})

	it('calls onEnter when the element becomes visible', () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()
		const { observer } = attach({ onEnter, onLeave })
		observer.trigger(true)
		expect(onEnter).toHaveBeenCalledTimes(1)
		expect(onLeave).not.toHaveBeenCalled()
	})

	it('calls onLeave when the element leaves the viewport', () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()
		const { observer } = attach({ onEnter, onLeave })
		observer.trigger(false)
		expect(onLeave).toHaveBeenCalledTimes(1)
		expect(onEnter).not.toHaveBeenCalled()
	})

	it('works without callbacks', () => {
		const { observer } = attach({})
		expect(() => {
			observer.trigger(true)
			observer.trigger(false)
		}).not.toThrow()
	})

	it('stops observing on cleanup', () => {
		const { observer, cleanup } = attach({})
		cleanup()
		expect(observer.targets.size).toBe(0)
	})
})
