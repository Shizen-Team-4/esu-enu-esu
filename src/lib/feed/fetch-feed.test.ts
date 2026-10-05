import { describe, expect, it } from 'vitest'
import { ApiError } from '$lib/api/api-error'
import { fetchFeed } from './fetch-feed'

function fakeFetch(response: Response, urls: string[] = []): typeof fetch {
	return (async (url: string) => {
		urls.push(url)
		return response
	}) as unknown as typeof fetch
}

describe('fetchFeed', () => {
	it('requests the scope and cursor and returns the page', async () => {
		const urls: string[] = []
		const page = { items: [], nextCursor: null }
		const result = await fetchFeed(
			{ scope: 'following', cursor: 'abc' },
			fakeFetch(new Response(JSON.stringify(page)), urls),
		)
		expect(result).toEqual(page)
		expect(urls).toEqual(['/api/feed?scope=following&cursor=abc'])
	})

	it('omits the cursor on the first page', async () => {
		const urls: string[] = []
		await fetchFeed({ scope: 'all' }, fakeFetch(new Response('{"items":[]}'), urls))
		expect(urls).toEqual(['/api/feed?scope=all'])
	})

	it('throws the API error from the envelope', async () => {
		const body = JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'slow' } })
		await expect(
			fetchFeed({ scope: 'all' }, fakeFetch(new Response(body, { status: 429 }))),
		).rejects.toMatchObject({ code: 'RATE_LIMITED' })
	})

	it('throws an ApiError for a malformed failure body', async () => {
		await expect(
			fetchFeed({ scope: 'all' }, fakeFetch(new Response('oops', { status: 500 }))),
		).rejects.toBeInstanceOf(ApiError)
	})
})
