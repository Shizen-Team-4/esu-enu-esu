import { eq } from 'drizzle-orm'
import type { getDb } from '../../db'
import { preferences } from '../../db/schema'
import type { PreferencesRepository } from '../application/ports'
import type { Preferences } from '../domain/preferences'

export function createPreferencesRepository(db: ReturnType<typeof getDb>): PreferencesRepository {
	return {
		async find(userId) {
			const row = await db.select().from(preferences).where(eq(preferences.userId, userId)).get()
			return row
				? { theme: row.theme, language: row.language, updatedAt: row.updatedAt.toISOString() }
				: null
		},
		async save(userId, value) {
			const row = { userId, ...value, updatedAt: new Date(value.updatedAt) }
			await db
				.insert(preferences)
				.values(row)
				.onConflictDoUpdate({ target: preferences.userId, set: row })
			return value
		},
	}
}
