import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { UserRepository } from './ports'

export const followUser =
	(deps: { users: UserRepository; clock: Clock }) =>
	async (viewer: Viewer | null, username: string, active = true) => {
		const actor = requireViewer(viewer)
		const target = await deps.users.find({ username }, actor.id)
		if (!target) throw new AppError('NOT_FOUND')
		if (target.id === actor.id) throw new AppError('VALIDATION_FAILED', { username: 'NOT_ALLOWED' })
		return {
			following: active,
			followers: await deps.users.follow(actor.id, target.id, active, deps.clock.now()),
		}
	}
