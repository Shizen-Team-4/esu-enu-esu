export function parseAcceptLanguage<T extends string>(
	header: string | null | undefined,
	supported: readonly T[],
): T | null {
	if (!header) return null

	const candidates = header
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';')
			const qParam = params.find((p) => p.trim().startsWith('q='))
			const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1
			return {
				code: tag.trim().toLowerCase().split('-')[0],
				q: Number.isNaN(q) ? 0 : q,
			}
		})
		.filter((c) => c.code && c.code !== '*' && c.q > 0)
		.sort((a, b) => b.q - a.q)

	for (const c of candidates) {
		const match = supported.find((s) => s === c.code)
		if (match) return match
	}
	return null
}
