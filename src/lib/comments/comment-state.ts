import type { Comment, Page } from '$lib/contract'

export interface CommentPage extends Page<Comment> {
	loaded: boolean
	status: 'idle' | 'loading' | 'error'
	error: unknown
}
export type LoadComments = (
	parentId: string | null,
	cursor: string | null,
) => Promise<Page<Comment>>

const pageState = (page: Page<Comment>, loaded = true): CommentPage => ({
	...page,
	items: [...page.items],
	loaded,
	status: 'idle',
	error: null,
})
const emptyPage = () => pageState({ items: [], nextCursor: null }, false)

/** Appends pages and applies mutations without losing loaded comments or scroll position. */
export function createCommentState(
	initial: Page<Comment>,
	load: LoadComments,
	onChange: () => void = () => {},
) {
	let roots = pageState(initial)
	let replies: Record<string, CommentPage> = {}
	const removed = new Set<string>()

	function getPage(parentId: string | null) {
		return parentId === null ? roots : (replies[parentId] ??= emptyPage())
	}

	async function loadMore(parentId: string | null = null) {
		const target = getPage(parentId)
		if (target.status === 'loading' || (target.loaded && target.nextCursor === null)) return
		target.status = 'loading'
		target.error = null
		onChange()
		try {
			const page = await load(parentId, target.nextCursor)
			if (parentId && removed.has(parentId)) return
			const seen = new Set(target.items.map((item) => item.id))
			target.items = [
				...target.items,
				...page.items.filter((item) => !seen.has(item.id) && !removed.has(item.id)),
			]
			target.items.sort((a, b) => {
				const order = a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
				return parentId ? order : -order
			})
			target.nextCursor = page.nextCursor
			target.loaded = true
			target.status = 'idle'
		} catch (cause) {
			target.error = cause
			target.status = 'error'
		}
		onChange()
	}

	function add(comment: Comment) {
		const target = getPage(comment.parentId)
		if (target.items.some((item) => item.id === comment.id)) return
		target.items = comment.parentId ? [...target.items, comment] : [comment, ...target.items]
		if (comment.parentId) {
			roots.items = roots.items.map((root) =>
				root.id === comment.parentId ? { ...root, replyCount: root.replyCount + 1 } : root,
			)
		}
		onChange()
	}

	function remove(comment: Comment) {
		removed.add(comment.id)
		const clearTarget = (item: Comment) =>
			item.replyToCommentId === comment.id ? { ...item, replyToCommentId: null } : item
		roots.items = roots.items.map(clearTarget)
		for (const page of Object.values(replies)) page.items = page.items.map(clearTarget)
		if (comment.parentId === null) {
			const promoted = (replies[comment.id]?.items ?? []).map((reply) => ({
				...reply,
				parentId: null,
			}))
			roots.items = [...roots.items.filter((root) => root.id !== comment.id), ...promoted]
			roots.items.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
			// Restart pagination so replies that were never expanded can be discovered as roots.
			roots = pageState({ items: roots.items, nextCursor: null }, false)
			delete replies[comment.id]
		} else {
			const target = getPage(comment.parentId)
			target.items = target.items.filter((reply) => reply.id !== comment.id)
			roots.items = roots.items.map((root) =>
				root.id === comment.parentId
					? { ...root, replyCount: Math.max(0, root.replyCount - 1) }
					: root,
			)
		}
		onChange()
	}

	return {
		snapshot: () => ({
			roots: { ...roots, items: [...roots.items] },
			replies: Object.fromEntries(
				Object.entries(replies).map(([id, page]) => [id, { ...page, items: [...page.items] }]),
			),
		}),
		loadMore,
		add,
		remove,
	}
}
