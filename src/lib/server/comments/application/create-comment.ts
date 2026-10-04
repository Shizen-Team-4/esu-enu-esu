import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock, IdGenerator } from '../../shared/application/ports'
import {
	COMMENT_RATE_LIMIT,
	CREATION_RATE_WINDOW_MS,
	retryAfterSec,
} from '../../shared/domain/creation-rate-limit'
import {
	resolveParent,
	validateCommentBody,
	validateParentId,
	withViewer,
	type ResolvedParent,
} from '../domain/comment'
import type { CommentRepository, PostLookup } from './ports'

export const createComment =
	(deps: { comments: CommentRepository; posts: PostLookup; clock: Clock; ids: IdGenerator }) =>
	async (viewer: Viewer | null, input: unknown) => {
		const author = requireViewer(viewer)
		const value = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
		const body = validateCommentBody(value.body)
		const requestedParent = validateParentId(value.parentId)
		const postId = typeof value.postId === 'string' ? value.postId : ''
		const post = await deps.posts.find(postId)
		if (!post) throw new AppError('NOT_FOUND')
		const parent: ResolvedParent =
			requestedParent === null
				? { parentId: null, replyToUserId: null, replyToCommentId: null }
				: resolveParent(postId, await deps.comments.find(requestedParent))
		const now = deps.clock.now()
		const window = await deps.comments.creationWindow(
			author.id,
			new Date(now.getTime() - CREATION_RATE_WINDOW_MS),
		)
		if (window.count >= COMMENT_RATE_LIMIT)
			throw new AppError('RATE_LIMITED', undefined, retryAfterSec(window.oldest, now))
		const id = deps.ids.generate('cmt')
		await deps.comments.create({ id, postId, authorId: author.id, body, ...parent }, now)
		const created = await deps.comments.find(id)
		if (!created) throw new AppError('INTERNAL')
		return withViewer(created, author.id, post.authorId)
	}
