import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce } from './debounce'

describe('debounce', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('does not call before the delay has elapsed', () => {
		const fn = vi.fn()
		debounce(fn, 200)('a')
		vi.advanceTimersByTime(199)
		expect(fn).not.toHaveBeenCalled()
	})

	it('calls once after the delay with the given args', () => {
		const fn = vi.fn()
		debounce(fn, 200)('a', 1)
		vi.advanceTimersByTime(200)
		expect(fn).toHaveBeenCalledTimes(1)
		expect(fn).toHaveBeenCalledWith('a', 1)
	})

	it('collapses rapid calls into one using the last args', () => {
		const fn = vi.fn()
		const debounced = debounce(fn, 200)
		debounced('a')
		vi.advanceTimersByTime(100)
		debounced('b')
		vi.advanceTimersByTime(100)
		debounced('c')
		vi.advanceTimersByTime(200)
		expect(fn).toHaveBeenCalledTimes(1)
		expect(fn).toHaveBeenCalledWith('c')
	})

	it('does not call after cancel', () => {
		const fn = vi.fn()
		const debounced = debounce(fn, 200)
		debounced('a')
		debounced.cancel()
		vi.advanceTimersByTime(500)
		expect(fn).not.toHaveBeenCalled()
	})

	it('works again after cancel', () => {
		const fn = vi.fn()
		const debounced = debounce(fn, 200)
		debounced('a')
		debounced.cancel()
		debounced('b')
		vi.advanceTimersByTime(200)
		expect(fn).toHaveBeenCalledTimes(1)
		expect(fn).toHaveBeenCalledWith('b')
	})
})
