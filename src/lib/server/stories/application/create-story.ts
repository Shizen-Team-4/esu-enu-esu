import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock } from '../../shared/application/ports'
import type { IdGenerator } from '../../posts/application/ports'
import { validateStory, STORY_LIFETIME_MS } from '../domain/story'
import type { StoryRepository } from './ports'

export const createStory =
	(deps: { stories: StoryRepository; clock: Clock; ids: IdGenerator }) =>
	async (viewer: Viewer | null, input: unknown) => {
		const actor = requireViewer(viewer),
			mediaId = validateStory(input),
			now = deps.clock.now(),
			id = deps.ids.generate('sty')
		await deps.stories.create(
			id,
			actor.id,
			mediaId,
			now,
			new Date(now.getTime() + STORY_LIFETIME_MS),
		)
		const story = await deps.stories.find(id, actor.id, now)
		if (!story) throw new AppError('INTERNAL')
		return story
	}
