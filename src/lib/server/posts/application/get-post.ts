import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import type { PostRepository } from './ports'

export const getPost = (posts: PostRepository) => async (viewer: Viewer | null, id: string) => {
	const post = await posts.find(id, viewer?.id ?? null)
	if (!post) throw new AppError('NOT_FOUND')
	return post
}
