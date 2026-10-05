import { readApiError } from '$lib/api/api-error'
import type { FollowListItem, Page } from '$lib/contract'

export type FollowListKind = 'followers' | 'following'

export async function fetchFollows(
	username: string,
	kind: FollowListKind,
	cursor: string,
	fetchFn: typeof fetch = fetch,
): Promise<Page<FollowListItem>> {
	const params = new URLSearchParams({ cursor })
	const response = await fetchFn(`/api/users/${encodeURIComponent(username)}/${kind}?${params}`)
	if (!response.ok) throw await readApiError(response)
	return (await response.json()) as Page<FollowListItem>
}
