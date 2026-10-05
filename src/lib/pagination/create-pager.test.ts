import { describe, expect, it } from 'vitest'
import type { Page } from '$lib/contract'
import { createPager } from './create-pager'

type Item = { id: string }
const page = (ids: string[], nextCursor: string | null): Page<Item> => ({
	items: ids.map((id) => ({ id })),
	nextCursor,
})
const ids = (items: Item[]) => items.map((item) => item.id)

describe('createPager', () => {
	it('starts idle with the initial page', () => {
		const pager = createPager(page(['a'], 'c1'), async () => page([], null))
		expect(ids(pager.items)).toEqual(['a'])
		expect(pager.nextCursor).toBe('c1')
		expect(pager.status).toBe('idle')
	})

	it('appends the next page using the cursor', async () => {
		const cursors: string[] = []
		const pager = createPager(page(['a'], 'c1'), async (cursor) => {
			cursors.push(cursor)
			return page(['b'], null)
		})
		await pager.loadMore()
		expect(ids(pager.items)).toEqual(['a', 'b'])
		expect(pager.nextCursor).toBeNull()
		expect(cursors).toEqual(['c1'])
	})

	it('preserves existing item identity while loading and appending pages', async () => {
		const initial = page(['a'], 'c1')
		const snapshots: Item[] = []
		const pager = createPager(
			initial,
			async () => page(['b'], null),
			() => {
				snapshots.push(pager.items[0])
			},
		)
		await pager.loadMore()
		expect(snapshots).toHaveLength(2)
		for (const item of snapshots) expect(item).toBe(initial.items[0])
	})

	it('dedupes items by id', async () => {
		const pager = createPager(page(['a', 'b'], 'c1'), async () => page(['b', 'c'], null))
		await pager.loadMore()
		expect(ids(pager.items)).toEqual(['a', 'b', 'c'])
	})

	it('does nothing when there is no next cursor', async () => {
		let calls = 0
		const pager = createPager(page(['a'], null), async () => {
			calls += 1
			return page([], null)
		})
		await pager.loadMore()
		expect(calls).toBe(0)
	})

	it('ignores loadMore while a load is in flight', async () => {
		let calls = 0
		const pager = createPager(page(['a'], 'c1'), async () => {
			calls += 1
			return page(['b'], null)
		})
		await Promise.all([pager.loadMore(), pager.loadMore()])
		expect(calls).toBe(1)
	})

	it('reports loading while the request is pending', async () => {
		const seen: string[] = []
		let release: (value: Page<Item>) => void = () => {}
		const pager = createPager(
			page(['a'], 'c1'),
			() => new Promise((resolve) => (release = resolve)),
			() => {},
		)
		const pending = pager.loadMore()
		seen.push(pager.status)
		release(page([], null))
		await pending
		seen.push(pager.status)
		expect(seen).toEqual(['loading', 'idle'])
	})

	it('keeps items on error and succeeds on retry', async () => {
		let fail = true
		const pager = createPager(page(['a'], 'c1'), async () => {
			if (fail) throw new Error('offline')
			return page(['b'], null)
		})
		await pager.loadMore()
		expect(pager.status).toBe('error')
		expect(pager.error).toBeInstanceOf(Error)
		expect(ids(pager.items)).toEqual(['a'])
		fail = false
		await pager.retry()
		expect(pager.status).toBe('idle')
		expect(pager.error).toBeNull()
		expect(ids(pager.items)).toEqual(['a', 'b'])
	})

	it('replaces everything on reset and drops stale results', async () => {
		let release: (value: Page<Item>) => void = () => {}
		let changes = 0
		const pager = createPager(
			page(['a'], 'c1'),
			() => new Promise((resolve) => (release = resolve)),
			() => (changes += 1),
		)
		const pending = pager.loadMore()
		pager.reset(page(['x'], 'c9'))
		release(page(['stale'], null))
		await pending
		expect(ids(pager.items)).toEqual(['x'])
		expect(pager.nextCursor).toBe('c9')
		expect(pager.status).toBe('idle')
		expect(changes).toBeGreaterThan(0)
	})

	it('drops a stale failure after reset', async () => {
		let reject: (cause: unknown) => void = () => {}
		const pager = createPager(
			page(['a'], 'c1'),
			() => new Promise((_resolve, rej) => (reject = rej)),
		)
		const pending = pager.loadMore()
		pager.reset(page(['x'], null))
		reject(new Error('late'))
		await pending
		expect(pager.status).toBe('idle')
		expect(pager.error).toBeNull()
	})
})
