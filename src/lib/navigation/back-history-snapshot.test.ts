import { describe, expect, it } from 'vitest'
import { readBackSnapshot, saveBackSnapshot } from './back-history-snapshot'

function memoryStorage(initial: string | null = null) {
	let value = initial
	return { getItem: () => value, setItem: (_key: string, next: string) => (value = next) }
}

describe('back history snapshot', () => {
	it('saves and restores the current page and its predecessor', () => {
		const storage = memoryStorage()
		const snapshot = { href: 'https://sns.example/u/alice', backHref: '/search?q=alice' }
		saveBackSnapshot(() => storage, snapshot)
		expect(readBackSnapshot(() => storage)).toEqual(snapshot)
	})

	it('restores a first-level page with no predecessor', () => {
		const storage = memoryStorage(JSON.stringify({ href: 'https://sns.example/', backHref: null }))
		expect(readBackSnapshot(() => storage)?.backHref).toBeNull()
	})

	it('returns no snapshot when nothing is saved', () => {
		expect(readBackSnapshot(() => memoryStorage())).toBeNull()
	})

	it('ignores malformed JSON', () => {
		expect(readBackSnapshot(() => memoryStorage('{'))).toBeNull()
	})

	it('ignores invalid snapshot shapes', () => {
		for (const value of [false, [], {}, { href: 1 }, { href: '/' }, { href: '/', backHref: 1 }]) {
			expect(readBackSnapshot(() => memoryStorage(JSON.stringify(value)))).toBeNull()
		}
	})

	it('handles storage access being blocked', () => {
		const blocked = () => {
			throw new Error('Storage blocked')
		}
		expect(readBackSnapshot(blocked)).toBeNull()
		expect(() => saveBackSnapshot(blocked, { href: '/', backHref: null })).not.toThrow()
	})

	it('handles storage being full', () => {
		const storage = {
			getItem: () => null,
			setItem: () => {
				throw new Error('Storage full')
			},
		}
		expect(() => saveBackSnapshot(() => storage, { href: '/', backHref: null })).not.toThrow()
	})
})
