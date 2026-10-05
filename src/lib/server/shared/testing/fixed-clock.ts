import type { Clock } from '../application/ports'

export function fixedClock(iso = '2026-10-03T00:00:00Z'): Clock {
	return { now: () => new Date(iso) }
}
