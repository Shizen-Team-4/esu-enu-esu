import type { Preferences } from '../domain/preferences'

export interface PreferencesRepository {
	find(userId: string): Promise<Preferences | null>
	save(userId: string, preferences: Preferences): Promise<Preferences>
}

export interface PreferencesCache {
	get(userId: string): Promise<Preferences | null>
	set(userId: string, preferences: Preferences): Promise<void>
}
