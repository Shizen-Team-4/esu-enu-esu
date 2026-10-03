import { encodeCursor, type Cursor } from '../../../shared/domain/cursor'
import type { StoredComment } from '../../domain/comment'
import type { CommentRepository, NewComment, PageRequest, PostLookup } from '../ports'
import { aUser } from './a-comment'

export class InMemoryCommentRepository implements CommentRepository {
	comments: StoredComment[]
	/** Comment count per post, as posts.commentCount would hold it. */
	postCounts = new Map<string, number>()
	window: { count: number; oldest: Date | null } = { count: 0, oldest: null }

	constructor(comments: StoredComment[] = []) {
		this.comments = [...comments]
		for (const comment of comments)
			this.postCounts.set(comment.postId, (this.postCounts.get(comment.postId) ?? 0) + 1)
	}

	async find(id: string) {
		return this.comments.find((comment) => comment.id === id) ?? null
	}

	async listTopLevel(postId: string, page: PageRequest) {
		const rows = this.comments
			.filter((comment) => comment.postId === postId && comment.parentId === null)
			.sort((a, b) => this.order(b, a))
			.filter((comment) => !page.cursor || this.compare(comment, page.cursor) < 0)
		return this.slice(rows, page.limit)
	}

	async listReplies(commentId: string, page: PageRequest) {
		const rows = this.comments
			.filter((comment) => comment.parentId === commentId)
			.sort((a, b) => this.order(a, b))
			.filter((comment) => !page.cursor || this.compare(comment, page.cursor) > 0)
		return this.slice(rows, page.limit)
	}

	async create(comment: NewComment, now: Date) {
		const parent = comment.parentId ? await this.find(comment.parentId) : null
		this.comments.push({
			id: comment.id,
			postId: comment.postId,
			author: aUser(comment.authorId),
			body: comment.body,
			parentId: comment.parentId,
			replyToUser: comment.replyToUserId ? aUser(comment.replyToUserId) : null,
			replyCount: 0,
			createdAt: now.toISOString(),
		})
		if (parent) parent.replyCount += 1
		this.postCounts.set(comment.postId, (this.postCounts.get(comment.postId) ?? 0) + 1)
	}

	async delete(target: { id: string; postId: string; parentId: string | null }) {
		const before = this.comments.length
		this.comments = this.comments.filter(
			(comment) => comment.id !== target.id && comment.parentId !== target.id,
		)
		const removed = before - this.comments.length
		this.postCounts.set(target.postId, (this.postCounts.get(target.postId) ?? 0) - removed)
		const parent = target.parentId ? await this.find(target.parentId) : null
		if (parent) parent.replyCount -= 1
	}

	async creationWindow() {
		return this.window
	}

	private order(a: StoredComment, b: StoredComment) {
		return Date.parse(a.createdAt) - Date.parse(b.createdAt) || (a.id < b.id ? -1 : 1)
	}

	private compare(comment: StoredComment, cursor: Cursor) {
		return Date.parse(comment.createdAt) - cursor.time || comment.id.localeCompare(cursor.id)
	}

	private slice(rows: StoredComment[], limit: number) {
		const items = rows.slice(0, limit)
		const last = items.at(-1)
		return {
			items,
			nextCursor:
				rows.length > limit && last
					? encodeCursor({ time: Date.parse(last.createdAt), id: last.id })
					: null,
		}
	}
}

export function inMemoryPostLookup(posts: Record<string, string>): PostLookup {
	return { find: async (postId) => (posts[postId] ? { authorId: posts[postId] } : null) }
}
