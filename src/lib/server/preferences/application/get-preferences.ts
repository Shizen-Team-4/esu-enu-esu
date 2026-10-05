import type { Lang } from '$lib/i18n/config'
import type { Clock, TaskRunner } from '../../shared/application/ports'
import { defaultPreferences } from '../domain/preferences'
import { AppError } from '../../shared/domain/app-error'
import type { PreferencesCache, PreferencesRepository } from './ports'

export const getPreferences =
	(deps: {
		repository: PreferencesRepository
		cache: PreferencesCache
		clock: Clock
		tasks: TaskRunner
	}) =>
	async (userId: string | null, language?: Lang) => {
		if (!userId) throw new AppError('UNAUTHENTICATED')
		const cached = await deps.cache.get(userId).catch(() => null)
		if (cached) return cached
		const stored = await deps.repository.find(userId)
		const value =
			stored ?? (await deps.repository.save(userId, defaultPreferences(deps.clock.now(), language)))
		deps.tasks.run(deps.cache.set(userId, value).catch(() => undefined))
		return value
	}
