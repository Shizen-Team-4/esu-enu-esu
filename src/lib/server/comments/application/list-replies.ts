import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { pageQuery } from '../../shared/domain/page-query'
import { withViewer } from '../domain/comment'
import type { CommentRepository, PostLookup } from './ports'

export const listReplies =
	(deps: { comments: CommentRepository; posts: PostLookup }) =>
	async (viewer: Viewer | null, input: { commentId: string; cursor?: string; limit?: unknown }) => {
		const page = pageQuery(input)
		const parent = await deps.comments.find(input.commentId)
		if (!parent || parent.parentId !== null) throw new AppError('NOT_FOUND')
		const post = await deps.posts.find(parent.postId)
		if (!post) throw new AppError('NOT_FOUND')
		const result = await deps.comments.listReplies(parent.id, page)
		return {
			items: result.items.map((comment) => withViewer(comment, viewer?.id ?? null, post.authorId)),
			nextCursor: result.nextCursor,
		}
	}
