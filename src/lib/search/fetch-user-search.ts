import { readApiError } from '$lib/api/api-error'
import type { FollowListItem, Page } from '$lib/contract'

export async function fetchUserSearch(
	q: string,
	cursor?: string | null,
	fetchFn: typeof fetch = fetch,
): Promise<Page<FollowListItem>> {
	const params = new URLSearchParams({ q })
	if (cursor) params.set('cursor', cursor)
	const response = await fetchFn(`/api/users/search?${params}`)
	if (!response.ok) throw await readApiError(response)
	return (await response.json()) as Page<FollowListItem>
}
