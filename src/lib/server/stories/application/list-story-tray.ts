import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { decodeCursor, parseLimit } from '../../shared/domain/cursor'
import type { Clock } from '../../shared/application/ports'
import type { StoryRepository } from './ports'

export const listStoryTray =
	(deps: { stories: StoryRepository; clock: Clock }) =>
	async (viewer: Viewer | null, input: { limit?: unknown; cursor?: string } = {}) => {
		const actor = requireViewer(viewer),
			cursor = input.cursor ? decodeCursor(input.cursor) : undefined
		if (cursor && !/^[012]_usr_[A-Za-z0-9_-]+$/.test(cursor.id))
			throw new AppError('VALIDATION_FAILED', { cursor: 'INVALID_FORMAT' })
		return deps.stories.tray(actor.id, deps.clock.now(), parseLimit(input.limit), cursor)
	}
