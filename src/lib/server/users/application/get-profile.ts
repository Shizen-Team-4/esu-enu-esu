import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import type { Profile, UserRepository } from './ports'

export const getProfile =
	(users: UserRepository) =>
	async (viewer: Viewer | null, username: string): Promise<Profile> => {
		const user = await users.find({ username }, viewer?.id ?? null)
		if (!user || !user.username) throw new AppError('NOT_FOUND')
		const { email: _email, emailVerified: _verified, ...profile } = user
		return profile
	}
