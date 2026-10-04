import { get } from 'svelte/store'
import { describe, expect, it } from 'vitest'
import { dismissToast, showToast, toasts } from './toast-state'

describe('toast state', () => {
	it('exposes shown toasts as a readable store and lets them be dismissed', () => {
		const id = showToast('Hello')
		expect(get(toasts).some((toast) => toast.id === id)).toBe(true)
		dismissToast(id)
		expect(get(toasts).some((toast) => toast.id === id)).toBe(false)
	})
})
