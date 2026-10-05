import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { UserRepository } from './ports'

export const getMe = (users: UserRepository) => async (viewer: Viewer | null) => {
	const user = await users.find({ id: requireViewer(viewer).id }, viewer?.id ?? null)
	if (!user) throw new AppError('NOT_FOUND')
	return user
}
