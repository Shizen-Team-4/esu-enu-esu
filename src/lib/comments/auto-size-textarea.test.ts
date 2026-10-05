import { describe, expect, it } from 'vitest'
import { autoSizeTextarea } from './auto-size-textarea'

function setup() {
	const listeners = new Map<string, () => void>()
	const field = {
		style: { height: '' },
		scrollHeight: 64,
		offsetHeight: 66,
		clientHeight: 64,
		clientWidth: 240,
		addEventListener: (name: string, callback: () => void) => listeners.set(name, callback),
		removeEventListener: (name: string) => listeners.delete(name),
	}
	let onResize = () => {}
	let disconnected = false
	const action = autoSizeTextarea(field as unknown as HTMLTextAreaElement, '', (callback) => {
		onResize = callback
		return { observe() {}, disconnect: () => (disconnected = true) }
	})
	return { field, action, listeners, resized: () => onResize(), disconnected: () => disconnected }
}

describe('autoSizeTextarea', () => {
	it('fits the initial content including the border', () => {
		expect(setup().field.style.height).toBe('66px')
	})
	it('grows as content is typed and shrinks when it is removed', () => {
		const { field, listeners } = setup()
		field.scrollHeight = 376
		listeners.get('input')!()
		expect(field.style.height).toBe('378px')
		field.scrollHeight = 64
		listeners.get('input')!()
		expect(field.style.height).toBe('66px')
	})
	it('fits restored drafts and clears after programmatic updates', () => {
		const { field, action } = setup()
		field.scrollHeight = 200
		action.update()
		expect(field.style.height).toBe('202px')
		field.scrollHeight = 64
		action.update()
		expect(field.style.height).toBe('66px')
	})
	it('refits wrapped text when the available width changes', () => {
		const { field, resized } = setup()
		field.clientWidth = 160
		field.scrollHeight = 300
		resized()
		expect(field.style.height).toBe('302px')
	})
	it('ignores height-only observations to avoid a resize loop', () => {
		const { field, resized } = setup()
		field.scrollHeight = 300
		resized()
		expect(field.style.height).toBe('66px')
	})
	it('removes its input listener and observer when destroyed', () => {
		const { action, listeners, disconnected } = setup()
		action.destroy()
		expect(listeners.size).toBe(0)
		expect(disconnected()).toBe(true)
	})
})
