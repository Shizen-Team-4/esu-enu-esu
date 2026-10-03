import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import type { Clock, IdGenerator } from '../../shared/application/ports'
import {
	CREATION_RATE_LIMIT,
	CREATION_RATE_WINDOW_MS,
	retryAfterSec,
} from '../../shared/domain/creation-rate-limit'
import { validateStory, storyExpiresAt } from '../domain/story'
import type { StoryRepository } from './ports'

export const createStory =
	(deps: { stories: StoryRepository; clock: Clock; ids: IdGenerator }) =>
	async (viewer: Viewer | null, input: unknown) => {
		const actor = requireViewer(viewer),
			mediaId = validateStory(input),
			now = deps.clock.now(),
			id = deps.ids.generate('sty')
		const window = await deps.stories.creationWindow(
			actor.id,
			new Date(now.getTime() - CREATION_RATE_WINDOW_MS),
		)
		if (window.count >= CREATION_RATE_LIMIT)
			throw new AppError('RATE_LIMITED', undefined, retryAfterSec(window.oldest, now))
		if (!(await deps.stories.checkMedia(mediaId, actor.id)))
			throw new AppError('VALIDATION_FAILED', { mediaId: 'INVALID_FORMAT' })
		await deps.stories.create(id, actor.id, mediaId, now, storyExpiresAt(now))
		const story = await deps.stories.find(id, actor.id, now)
		if (!story) throw new AppError('INTERNAL')
		return story
	}
