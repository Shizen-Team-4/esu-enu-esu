import { describe, expect, it } from 'vitest'
import { getPreferences } from './get-preferences'
import { updatePreferences } from './update-preferences'
import type { PreferencesCache, PreferencesRepository } from './ports'
import type { Preferences } from '../domain/preferences'

function setup() {
	const rows = new Map<string, Preferences>()
	const cached = new Map<string, Preferences>()
	const tasks: Promise<unknown>[] = []
	const repository: PreferencesRepository = {
		find: async (id) => rows.get(id) ?? null,
		save: async (id, value) => {
			rows.set(id, value)
			return value
		},
	}
	const cache: PreferencesCache = {
		get: async (id) => cached.get(id) ?? null,
		set: async (id, value) => {
			cached.set(id, value)
		},
	}
	const deps = {
		repository,
		cache,
		clock: { now: () => new Date('2026-10-03T00:00:00Z') },
		tasks: {
			run: (task: Promise<unknown>) => {
				tasks.push(task)
			},
		},
	}
	return {
		...deps,
		rows,
		cached,
		tasks,
		get: getPreferences(deps),
		update: updatePreferences(deps),
	}
}

describe('preferences use cases', () => {
	it('requires authentication for reads and writes', async () => {
		const deps = setup()
		await expect(deps.get(null)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
		await expect(deps.update(null, {})).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})
	it('creates defaults with the detected language and caches them', async () => {
		const deps = setup()
		const value = await deps.get('usr_1', 'ja')
		await Promise.all(deps.tasks)
		expect(value).toEqual({
			theme: 'system',
			language: 'ja',
			updatedAt: '2026-10-03T00:00:00.000Z',
		})
		expect(deps.rows.get('usr_1')).toEqual(value)
		expect(deps.cached.get('usr_1')).toEqual(value)
	})
	it('returns cached preferences without creating a database row', async () => {
		const deps = setup()
		deps.cached.set('usr_1', { theme: 'dark', language: 'km', updatedAt: '2026-10-01T00:00:00Z' })
		expect((await deps.get('usr_1')).theme).toBe('dark')
		expect(deps.rows.size).toBe(0)
	})
	it('reads the database when the cache is unavailable', async () => {
		const deps = setup()
		deps.cache.get = async () => {
			throw new Error('Unavailable')
		}
		deps.cache.set = async () => {
			throw new Error('Unavailable')
		}
		expect((await deps.get('usr_1')).language).toBe('en')
		await expect(Promise.all(deps.tasks)).resolves.toEqual([undefined])
	})
	it('preserves fields omitted from a partial update and overwrites the cache', async () => {
		const deps = setup()
		await deps.update('usr_1', { language: 'km' })
		const value = await deps.update('usr_1', { theme: 'dark' })
		expect(value.language).toBe('km')
		expect(value.theme).toBe('dark')
		expect(deps.cached.get('usr_1')).toEqual(value)
	})
	it('persists a change even if the cache write fails', async () => {
		const deps = setup()
		deps.cache.set = async () => {
			throw new Error('Unavailable')
		}
		await expect(deps.update('usr_1', { theme: 'light' })).resolves.toMatchObject({
			theme: 'light',
		})
	})
	it.each([null, [], 'dark', { theme: 'invalid' }, { language: 'fr' }, { notifications: true }])(
		'rejects invalid input %j without writing',
		async (input) => {
			const deps = setup()
			await expect(deps.update('usr_1', input)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
			expect(deps.rows.size).toBe(0)
		},
	)
})
