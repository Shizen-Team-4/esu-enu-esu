import type { Comment } from '$lib/contract'

/** Uses exact comment targets; legacy and orphaned replies remain at the root level. */
export function branchReplies(root: Comment, replies: Comment[], parentId: string) {
	const visible = replies.filter((reply) => reply.parentId === root.id)
	const ids = new Set(visible.map((reply) => reply.id))
	return visible.filter((reply) => {
		const target = reply.replyToCommentId
		return parentId === root.id
			? !target || target === root.id || !ids.has(target)
			: target === parentId
	})
}

export function focusBranch(root: Comment, replies: Comment[], selectedId: string | null) {
	const visible = replies.filter((reply) => reply.parentId === root.id)
	const selected = visible.find((reply) => reply.id === selectedId)
	const ancestors: Comment[] = []
	const seen = new Set([root.id, selected?.id])
	let current = selected
	while (current?.replyToCommentId) {
		const parent = visible.find((reply) => reply.id === current?.replyToCommentId)
		if (!parent || seen.has(parent.id)) break
		ancestors.unshift(parent)
		seen.add(parent.id)
		current = parent
	}
	if (selected) ancestors.unshift(root)
	return {
		ancestors,
		parent: selected ?? root,
		replies: branchReplies(root, visible, selected?.id ?? root.id),
	}
}
