import { describe, expect, it } from 'vitest'
import { observeMore } from './observe-more'

function setup() {
	let callback: IntersectionObserverCallback = () => {}
	let observed: Element | null = null
	let disconnected = false
	let loads = 0
	const observer = {
		observe: (node: Element) => {
			observed = node
		},
		disconnect: () => {
			disconnected = true
		},
	}
	const node = {} as Element
	const action = observeMore(
		node,
		() => {
			loads += 1
		},
		(handler) => {
			callback = handler
			return observer
		},
	)
	return {
		node,
		action,
		get observed() {
			return observed
		},
		get disconnected() {
			return disconnected
		},
		get loads() {
			return loads
		},
		intersect: (visible: boolean[]) =>
			callback(
				visible.map((isIntersecting) => ({ isIntersecting }) as IntersectionObserverEntry),
				observer as IntersectionObserver,
			),
	}
}

describe('observeMore', () => {
	it('observes the trailing marker', () => {
		const state = setup()
		expect(state.observed).toBe(state.node)
	})
	it('does not load when the marker is outside the viewport', () => {
		const state = setup()
		state.intersect([false])
		expect(state.loads).toBe(0)
	})
	it('loads once when an entry becomes visible', () => {
		const state = setup()
		state.intersect([false, true, true])
		expect(state.loads).toBe(1)
	})
	it('disconnects when the marker is removed', () => {
		const state = setup()
		state.action.destroy()
		expect(state.disconnected).toBe(true)
	})
})
