import { describe, expect, it } from 'vitest'
import type { Post } from '$lib/contract'
import { createFeedPager } from './feed-pager'

describe('createFeedPager', () => {
	it('uses the shared pager to append posts', async () => {
		const pager = createFeedPager(
			{ items: [{ id: 'pst_1' } as Post], nextCursor: 'next' },
			async () => ({ items: [{ id: 'pst_2' } as Post], nextCursor: null }),
		)
		await pager.loadMore()
		expect(pager.items.map((post) => post.id)).toEqual(['pst_1', 'pst_2'])
	})
})
