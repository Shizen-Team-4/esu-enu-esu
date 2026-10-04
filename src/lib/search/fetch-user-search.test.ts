import { describe, expect, it } from 'vitest'
import { ApiError } from '$lib/api/api-error'
import type { FollowListItem } from '$lib/contract'
import { fetchUserSearch } from './fetch-user-search'

const recordingFetch = (body: unknown = { items: [], nextCursor: null }) => {
	const calls: string[] = []
	const fake = (async (input) => {
		calls.push(String(input))
		return Response.json(body)
	}) as typeof fetch
	return { fake, calls }
}

describe('fetchUserSearch', () => {
	it('encodes spaces and ampersands in the query', async () => {
		const { fake, calls } = recordingFetch()
		await fetchUserSearch('ann & bo', null, fake)
		expect(calls).toEqual(['/api/users/search?q=ann+%26+bo'])
	})
	it('omits the cursor for the first page', async () => {
		const { fake, calls } = recordingFetch()
		await fetchUserSearch('ann', undefined, fake)
		expect(calls[0]).not.toContain('cursor')
	})
	it('includes an encoded cursor when given', async () => {
		const { fake, calls } = recordingFetch()
		await fetchUserSearch('ann', 'next&one', fake)
		expect(calls).toEqual(['/api/users/search?q=ann&cursor=next%26one'])
	})
	it('returns the page from a successful response', async () => {
		const page = { items: [{ username: 'ann' } as FollowListItem], nextCursor: 'c2' }
		const { fake } = recordingFetch(page)
		expect(await fetchUserSearch('ann', null, fake)).toEqual(page)
	})
	it('throws the typed API error for a non-OK response', async () => {
		const fake = (async () =>
			Response.json({ error: { code: 'VALIDATION_FAILED' } }, { status: 400 })) as typeof fetch
		await expect(fetchUserSearch('', null, fake)).rejects.toEqual(new ApiError('VALIDATION_FAILED'))
	})
})
