import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { AppError } from '../../shared/domain/app-error'
import type { Clock } from '../../shared/application/ports'
import { pageQuery } from '../../shared/domain/page-query'
import type { StoryRepository } from './ports'
import type { StoryAudienceRepository } from './audience-ports'
export const getStoryAudience =
	(deps: { stories: StoryRepository; audience: StoryAudienceRepository; clock: Clock }) =>
	async (viewer: Viewer | null, id: string, input: { cursor?: string; limit?: unknown } = {}) => {
		const actor = requireViewer(viewer),
			now = deps.clock.now()
		const story = await deps.stories.find(id, actor.id, now)
		if (!story || story.author.id !== actor.id) throw new AppError('NOT_FOUND')
		return deps.audience.list(id, actor.id, now, pageQuery(input))
	}
