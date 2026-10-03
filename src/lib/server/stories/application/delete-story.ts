import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { StoryRepository } from './ports'

export const deleteStory =
	(deps: { stories: StoryRepository; clock: Clock }) =>
	async (viewer: Viewer | null, id: string) => {
		const actor = requireViewer(viewer),
			story = await deps.stories.find(id, actor.id, deps.clock.now())
		if (!story) throw new AppError('NOT_FOUND')
		if (story.author.id !== actor.id) throw new AppError('FORBIDDEN')
		await deps.stories.delete(id)
	}
