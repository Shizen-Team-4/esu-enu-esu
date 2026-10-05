import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { validateProfileUpdate } from '../domain/profile'
import type { AvatarMedia, Me, UserRepository, UserUpdate } from './ports'

export const updateMe =
	(deps: { users: UserRepository; avatars: AvatarMedia }) =>
	async (viewer: Viewer | null, input: unknown): Promise<Me> => {
		const actor = requireViewer(viewer)
		const patch = validateProfileUpdate(input)
		if (!(await deps.users.find({ id: actor.id }, actor.id))) throw new AppError('NOT_FOUND')
		const update: UserUpdate = {
			username: patch.username,
			displayName: patch.displayName,
			bio: patch.bio,
		}
		if (patch.username && (await deps.users.isUsernameTaken(patch.username, actor.id)))
			throw new AppError('CONFLICT', { username: 'TAKEN' })
		if (patch.avatarMediaId !== undefined)
			update.avatar = await resolveAvatar(deps, actor.id, patch.avatarMediaId)
		await deps.users.update(actor.id, update)
		const me = await deps.users.find({ id: actor.id }, actor.id)
		if (!me) throw new AppError('NOT_FOUND')
		return me
	}

async function resolveAvatar(
	deps: { avatars: AvatarMedia },
	ownerId: string,
	mediaId: string | null,
) {
	if (mediaId === null) return null
	const usable = await deps.avatars.findUsable(mediaId, ownerId)
	if (!usable) throw new AppError('VALIDATION_FAILED', { avatarMediaId: 'INVALID_FORMAT' })
	return { mediaId, url: usable.url }
}
