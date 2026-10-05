import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { StoryRepository } from './ports'

export const markStorySeen =
	(deps: { stories: StoryRepository; clock: Clock }) =>
	async (viewer: Viewer | null, id: string) => {
		const actor = requireViewer(viewer),
			now = deps.clock.now()
		if (!(await deps.stories.find(id, actor.id, now))) throw new AppError('NOT_FOUND')
		await deps.stories.seen(id, actor.id, now)
	}
