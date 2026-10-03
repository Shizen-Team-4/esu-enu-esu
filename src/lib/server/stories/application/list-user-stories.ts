import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { StoryRepository } from './ports'

export const listUserStories =
	(deps: { stories: StoryRepository; clock: Clock }) =>
	async (viewer: Viewer | null, username: string) => {
		const items = await deps.stories.list(username, requireViewer(viewer).id, deps.clock.now())
		if (!items) throw new AppError('NOT_FOUND')
		return { items }
	}
