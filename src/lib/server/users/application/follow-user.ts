import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { UserRepository } from './ports'
import type { Notifier } from '../../shared/application/notifier'

export const followUser =
	(deps: { users: UserRepository; clock: Clock; notifier: Notifier }) =>
	async (viewer: Viewer | null, username: string, active = true) => {
		const actor = requireViewer(viewer)
		const target = await deps.users.find({ username }, actor.id)
		if (!target) throw new AppError('NOT_FOUND')
		if (target.id === actor.id) throw new AppError('VALIDATION_FAILED', { username: 'NOT_ALLOWED' })
		const now = deps.clock.now()
		const { followers, created } = await deps.users.follow(actor.id, target.id, active, now)
		if (created)
			deps.notifier.notify({
				type: 'follow',
				actorId: actor.id,
				recipientId: target.id,
				createdAt: now,
			})
		return { following: active, followers }
	}
