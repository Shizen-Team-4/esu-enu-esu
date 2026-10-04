import { AppError } from '../../shared/domain/app-error'
import type { Comment } from '$lib/contract'

export type { Comment }
/** A comment as stored: everything except the viewer-specific part. */
export type StoredComment = Omit<Comment, 'viewer'>

export const COMMENT_BODY_MAX = 500

export function validateCommentBody(value: unknown): string {
	if (typeof value !== 'string') throw new AppError('VALIDATION_FAILED', { body: 'INVALID_FORMAT' })
	const body = value.trim()
	if (!body) throw new AppError('VALIDATION_FAILED', { body: 'REQUIRED' })
	if ([...body].length > COMMENT_BODY_MAX)
		throw new AppError('VALIDATION_FAILED', { body: 'TOO_LONG' })
	return body
}

/** Missing, null or empty means a top-level comment. */
export function validateParentId(value: unknown): string | null {
	if (value === undefined || value === null || value === '') return null
	if (typeof value !== 'string' || !value.startsWith('cmt_'))
		throw new AppError('VALIDATION_FAILED', { parentId: 'INVALID_FORMAT' })
	return value
}

export interface ResolvedParent {
	parentId: string | null
	replyToUserId: string | null
}

/**
 * Applies the flatten rule to a requested parent (null when it was not found).
 * A reply is flattened to its top-level comment and the new comment points at the reply's author;
 * a top-level parent is used as is with no replyToUser.
 */
export function resolveParent(
	postId: string,
	parent: Pick<StoredComment, 'id' | 'postId' | 'parentId' | 'author'> | null,
): ResolvedParent {
	if (!parent || parent.postId !== postId) throw new AppError('NOT_FOUND')
	if (parent.parentId === null) return { parentId: parent.id, replyToUserId: null }
	return { parentId: parent.parentId, replyToUserId: parent.author.id }
}

export function canDeleteComment(viewerId: string, commentAuthorId: string, postAuthorId: string) {
	return viewerId === commentAuthorId || viewerId === postAuthorId
}

export function withViewer(
	comment: StoredComment,
	viewerId: string | null,
	postAuthorId: string,
): Comment {
	return {
		...comment,
		viewer: {
			canDelete: viewerId !== null && canDeleteComment(viewerId, comment.author.id, postAuthorId),
		},
	}
}
