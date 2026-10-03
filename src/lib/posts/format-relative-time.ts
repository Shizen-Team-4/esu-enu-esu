const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/** [upper limit in seconds, seconds per unit, unit] */
const UNITS: [number, number, Intl.RelativeTimeFormatUnit][] = [
	[MINUTE, 1, 'second'],
	[HOUR, MINUTE, 'minute'],
	[DAY, HOUR, 'hour'],
	[WEEK, DAY, 'day'],
	[MONTH, WEEK, 'week'],
	[YEAR, MONTH, 'month'],
]

/** "3 hours ago" in the given locale. `now` is passed in so the result is deterministic. */
export function formatRelativeTime(iso: string, now: Date, locale: string): string {
	const seconds = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000))
	const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
	const [, size, unit] = UNITS.find(([limit]) => seconds < limit) ?? [0, YEAR, 'year']
	return formatter.format(-Math.floor(seconds / size), unit)
}
