import type { Clock } from '../../shared/application/ports'
import { AppError } from '../../shared/domain/app-error'
import { defaultPreferences, validatePreferences } from '../domain/preferences'
import type { PreferencesCache, PreferencesRepository } from './ports'

export const updatePreferences =
	(deps: { repository: PreferencesRepository; cache: PreferencesCache; clock: Clock }) =>
	async (userId: string | null, input: unknown) => {
		if (!userId) throw new AppError('UNAUTHENTICATED')
		const patch = validatePreferences(input)
		const now = deps.clock.now()
		const previous = (await deps.repository.find(userId)) ?? defaultPreferences(now)
		const value = await deps.repository.save(userId, {
			...previous,
			...patch,
			updatedAt: now.toISOString(),
		})
		await deps.cache.set(userId, value).catch(() => undefined)
		return value
	}
