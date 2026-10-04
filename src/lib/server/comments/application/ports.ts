import type { Page } from '$lib/contract'
import type { Cursor } from '../../shared/domain/cursor'
import type { StoredComment } from '../domain/comment'

export type { Page }

export interface NewComment {
	id: string
	postId: string
	authorId: string
	parentId: string | null
	replyToUserId: string | null
	replyToCommentId: string | null
	body: string
}

export interface PageRequest {
	cursor?: Cursor
	limit: number
}

export interface CommentRepository {
	find(id: string): Promise<StoredComment | null>
	/** Top-level comments, newest first. */
	listTopLevel(postId: string, page: PageRequest): Promise<Page<StoredComment>>
	/** Replies of one top-level comment, oldest first. */
	listReplies(commentId: string, page: PageRequest): Promise<Page<StoredComment>>
	/** Inserts the comment and updates reply and post comment counts. */
	create(comment: NewComment, now: Date): Promise<void>
	/** Deletes only the comment, promotes its replies and updates the counts. */
	delete(target: { id: string; postId: string; parentId: string | null }): Promise<void>
	creationWindow(authorId: string, since: Date): Promise<{ count: number; oldest: Date | null }>
}

/** Comments only need to know a visible post exists and who wrote it. */
export interface PostLookup {
	find(postId: string): Promise<{ authorId: string } | null>
}
