import { readApiError } from '$lib/api/api-error'
import type { Page, Post } from '$lib/contract'

export interface FeedQuery {
	scope: 'all' | 'following'
	cursor?: string | null
}

export async function fetchFeed(
	{ scope, cursor }: FeedQuery,
	fetchFn: typeof fetch = fetch,
): Promise<Page<Post>> {
	const params = new URLSearchParams({ scope })
	if (cursor) params.set('cursor', cursor)
	const response = await fetchFn(`/api/feed?${params}`)
	if (!response.ok) throw await readApiError(response)
	return (await response.json()) as Page<Post>
}
