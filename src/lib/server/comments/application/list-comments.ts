import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { pageQuery } from '../../shared/domain/page-query'
import { withViewer } from '../domain/comment'
import type { CommentRepository, PostLookup } from './ports'

export const listComments =
	(deps: { comments: CommentRepository; posts: PostLookup }) =>
	async (viewer: Viewer | null, input: { postId: string; cursor?: string; limit?: unknown }) => {
		const page = pageQuery(input)
		const post = await deps.posts.find(input.postId)
		if (!post) throw new AppError('NOT_FOUND')
		const result = await deps.comments.listTopLevel(input.postId, page)
		return {
			items: result.items.map((comment) => withViewer(comment, viewer?.id ?? null, post.authorId)),
			nextCursor: result.nextCursor,
		}
	}
