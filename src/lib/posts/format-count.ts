/** Short number for like and comment counts, for example 1.2K in English. */
export function formatCount(count: number, locale: string): string {
	return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
		count,
	)
}
