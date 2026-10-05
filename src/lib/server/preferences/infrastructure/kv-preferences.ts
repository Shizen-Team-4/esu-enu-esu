import type { PreferencesCache } from '../application/ports'
import { validatePreferences, type Preferences } from '../domain/preferences'

export function createPreferencesCache(kv: KVNamespace): PreferencesCache {
	return {
		async get(userId) {
			const value = await kv.get<Preferences>(`pref:${userId}`, 'json')
			if (!value) return null
			validatePreferences({ theme: value.theme, language: value.language })
			if (!Number.isFinite(Date.parse(value.updatedAt))) return null
			return value
		},
		async set(userId, value) {
			await kv.put(`pref:${userId}`, JSON.stringify(value), { expirationTtl: 86400 })
		},
	}
}
