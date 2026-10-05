const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

export function relativeTime(iso: string, now: Date, locale: string): string {
	const then = Date.parse(iso)
	const elapsed = now.getTime() - then
	const rtf = new Intl.RelativeTimeFormat(locale, { style: 'narrow', numeric: 'auto' })
	if (elapsed < MINUTE) return rtf.format(0, 'second')
	if (elapsed < HOUR) return rtf.format(-Math.floor(elapsed / MINUTE), 'minute')
	if (elapsed < DAY) return rtf.format(-Math.floor(elapsed / HOUR), 'hour')
	if (elapsed < WEEK) return rtf.format(-Math.floor(elapsed / DAY), 'day')
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(then)
}
