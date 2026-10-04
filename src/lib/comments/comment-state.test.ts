import { describe, expect, it } from 'vitest'
import type { Comment, Page } from '$lib/contract'
import { createCommentState, type LoadComments } from './comment-state'

const comment = (
	id: string,
	parentId: string | null = null,
	createdAt = '2026-10-04T00:00:00Z',
): Comment => ({
	id,
	parentId,
	createdAt,
	postId: 'pst_1',
	replyToUser: null,
	replyToCommentId: null,
	body: id,
	replyCount: 0,
	author: { id: 'usr_1', username: 'one', displayName: 'One', avatarUrl: null },
	viewer: { canDelete: true },
})
const page = (items: Comment[] = [], nextCursor: string | null = null): Page<Comment> => ({
	items,
	nextCursor,
})
const deferred = () => {
	let resolve!: (page: Page<Comment>) => void
	const promise = new Promise<Page<Comment>>((done) => (resolve = done))
	return { promise, resolve }
}

describe('createCommentState', () => {
	it('appends top-level pages without duplicates in newest order', async () => {
		const a = comment('a'),
			b = comment('b', null, '2026-10-03T00:00:00Z')
		const state = createCommentState(page([a], 'next'), async () => page([a, b]))
		await state.loadMore()
		expect(state.snapshot().roots.items).toEqual([a, b])
		expect(state.snapshot().roots.nextCursor).toBeNull()
	})
	it('keeps loaded pages and exposes a retryable error', async () => {
		let attempts = 0
		const state = createCommentState(page([comment('a')], 'next'), async () => {
			if (++attempts === 1) throw new Error('offline')
			return page([comment('b')])
		})
		await state.loadMore()
		expect(state.snapshot().roots.status).toBe('error')
		expect(state.snapshot().roots.items).toHaveLength(1)
		await state.loadMore()
		expect(state.snapshot().roots.status).toBe('idle')
		expect(state.snapshot().roots.error).toBeNull()
		expect(state.snapshot().roots.items).toHaveLength(2)
	})
	it('loads replies lazily and preserves oldest-first order after a local creation', async () => {
		const newer = comment('new', 'root', '2026-10-04T01:00:00Z'),
			older = comment('old', 'root')
		const state = createCommentState(page([comment('root')]), async (parentId, cursor) => {
			expect(parentId).toBe('root')
			expect(cursor).toBeNull()
			return page([older, newer])
		})
		state.add(newer)
		await state.loadMore('root')
		expect(state.snapshot().replies.root.items).toEqual([older, newer])
		expect(state.snapshot().roots.items[0].replyCount).toBe(1)
	})
	it('prevents concurrent loads and requests no pages once exhausted', async () => {
		const request = deferred()
		let calls = 0
		const load: LoadComments = async () => {
			calls++
			return request.promise
		}
		const state = createCommentState(page([], 'next'), load)
		const pending = state.loadMore()
		await state.loadMore()
		expect(state.snapshot().roots.status).toBe('loading')
		request.resolve(page())
		await pending
		await state.loadMore()
		expect(calls).toBe(1)
	})
	it('inserts new roots and ignores duplicate mutation results', () => {
		const state = createCommentState(page([comment('old')]), async () => page())
		const created = comment('new')
		state.add(created)
		state.add(created)
		expect(state.snapshot().roots.items.map((item) => item.id)).toEqual(['new', 'old'])
	})
	it('removes a reply and updates its root count without affecting siblings', () => {
		const state = createCommentState(page([comment('root'), comment('other')]), async () => page())
		const reply = comment('reply', 'root')
		state.add(reply)
		state.add(comment('sibling', 'root'))
		state.remove(reply)
		expect(state.snapshot().replies.root.items.map((item) => item.id)).toEqual(['sibling'])
		expect(state.snapshot().roots.items[0].replyCount).toBe(1)
	})
	it('promotes loaded replies when their parent is deleted and reloads unseen replies', async () => {
		const root = comment('root'),
			reply = comment('reply', 'root')
		let calls = 0
		const state = createCommentState(page([root]), async () => {
			calls++
			return page([comment('unseen'), { ...reply, parentId: null }])
		})
		state.add(reply)
		state.remove(root)
		expect(state.snapshot().roots.items).toEqual([{ ...reply, parentId: null }])
		await state.loadMore()
		expect(calls).toBe(1)
		expect(state.snapshot().roots.items.map((item) => item.id)).toEqual(['unseen', 'reply'])
	})
	it('removes root replies and prevents a late request from restoring them', async () => {
		const request = deferred(),
			root = comment('root')
		const state = createCommentState(page([root]), () => request.promise)
		const pending = state.loadMore(root.id)
		state.remove(root)
		request.resolve(page([comment('reply', root.id)]))
		await pending
		expect(state.snapshot().roots.items).toEqual([])
		expect(state.snapshot().replies[root.id]).toBeUndefined()
	})
	it('does not restore a deleted comment from an in-flight page', async () => {
		const request = deferred(),
			root = comment('root')
		const state = createCommentState(page([root], 'next'), () => request.promise)
		const pending = state.loadMore()
		state.remove(root)
		request.resolve(page([root]))
		await pending
		expect(state.snapshot().roots.items).toEqual([])
	})
	it('returns independent snapshots and notifies subscribers of changes', async () => {
		let notifications = 0
		const state = createCommentState(
			page([comment('root')]),
			async () => page(),
			() => notifications++,
		)
		const before = state.snapshot()
		state.add(comment('reply', 'root'))
		const repliesBefore = state.snapshot()
		await state.loadMore('root')
		expect(before.roots.items[0].replyCount).toBe(0)
		expect(repliesBefore.replies.root.loaded).toBe(false)
		expect(notifications).toBe(3)
	})
	it('clamps a reply count at zero', () => {
		const state = createCommentState(page([comment('root')]), async () => page())
		state.remove(comment('reply', 'root'))
		expect(state.snapshot().roots.items[0].replyCount).toBe(0)
	})
})

it('makes replies to a deleted reply visible under the root', () => {
	const root = comment('root'),
		parent = comment('parent', 'root')
	const child = { ...comment('child', 'root'), replyToCommentId: parent.id }
	const state = createCommentState(page([root]), async () => page())
	state.add(parent)
	state.add(child)
	state.remove(parent)
	expect(state.snapshot().replies.root.items).toEqual([{ ...child, replyToCommentId: null }])
})
