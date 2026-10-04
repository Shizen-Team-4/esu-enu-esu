import { readApiError } from '$lib/api/api-error'
import type { Comment, Page } from '$lib/contract'

export async function fetchComments(
	postId: string,
	parentId: string | null,
	cursor?: string | null,
	fetchFn: typeof fetch = fetch,
): Promise<Page<Comment>> {
	const path = parentId
		? `/api/comments/${encodeURIComponent(parentId)}/replies`
		: `/api/posts/${encodeURIComponent(postId)}/comments`
	const params = new URLSearchParams()
	if (cursor) params.set('cursor', cursor)
	const response = await fetchFn(`${path}?${params}`)
	if (!response.ok) throw await readApiError(response)
	return (await response.json()) as Page<Comment>
}
