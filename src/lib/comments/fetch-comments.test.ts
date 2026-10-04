import { describe, expect, it } from 'vitest'
import { ApiError } from '$lib/api/api-error'
import { fetchComments } from './fetch-comments'

describe('fetchComments', () => {
	it('fetches top-level comments with an encoded id and cursor', async () => {
		let url = ''
		const fake = (async (input) => {
			url = String(input)
			return Response.json({ items: [], nextCursor: null })
		}) as typeof fetch
		expect(await fetchComments('post/id', null, 'next&one', fake)).toEqual({
			items: [],
			nextCursor: null,
		})
		expect(url).toBe('/api/posts/post%2Fid/comments?cursor=next%26one')
	})
	it('fetches replies without a cursor for the first page', async () => {
		let url = ''
		const fake = (async (input) => {
			url = String(input)
			return Response.json({ items: [], nextCursor: null })
		}) as typeof fetch
		await fetchComments('post', 'comment/id', null, fake)
		expect(url).toBe('/api/comments/comment%2Fid/replies?')
	})
	it('returns typed API errors', async () => {
		const fake = (async () =>
			Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })) as typeof fetch
		await expect(fetchComments('post', null, undefined, fake)).rejects.toEqual(
			new ApiError('NOT_FOUND'),
		)
	})
	it('propagates transport errors for retry', async () => {
		const fake = (async () => {
			throw new Error('offline')
		}) as typeof fetch
		await expect(fetchComments('post', null, undefined, fake)).rejects.toThrow('offline')
	})
})
