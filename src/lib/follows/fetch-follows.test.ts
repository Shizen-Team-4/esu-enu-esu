import { describe, expect, it } from 'vitest'
import { fetchFollows } from './fetch-follows'

describe('fetchFollows', () => {
	for (const kind of ['followers', 'following'] as const) {
		it(`loads ${kind} with an encoded username and opaque cursor`, async () => {
			const urls: string[] = []
			const page = { items: [], nextCursor: null }
			const fetchFn: typeof fetch = async (url) => {
				urls.push(String(url))
				return Response.json(page)
			}
			expect(await fetchFollows('a/b', kind, 'a+b', fetchFn)).toEqual(page)
			expect(urls).toEqual([`/api/users/a%2Fb/${kind}?cursor=a%2Bb`])
		})
	}
	it('propagates contract errors', async () => {
		const fetchFn: typeof fetch = async () =>
			Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
		await expect(fetchFollows('missing', 'followers', 'cursor', fetchFn)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})
	it('propagates network failures', async () => {
		const fetchFn: typeof fetch = async () => {
			throw new Error('offline')
		}
		await expect(fetchFollows('alice', 'following', 'cursor', fetchFn)).rejects.toThrow('offline')
	})
})
