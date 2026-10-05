import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { canDeleteComment } from '../domain/comment'
import type { CommentRepository, PostLookup } from './ports'

export const deleteComment =
	(deps: { comments: CommentRepository; posts: PostLookup }) =>
	async (viewer: Viewer | null, id: string) => {
		const user = requireViewer(viewer)
		const comment = await deps.comments.find(id)
		if (!comment) throw new AppError('NOT_FOUND')
		const post = await deps.posts.find(comment.postId)
		if (!post) throw new AppError('NOT_FOUND')
		if (!canDeleteComment(user.id, comment.author.id, post.authorId))
			throw new AppError('FORBIDDEN')
		await deps.comments.delete(comment)
	}
