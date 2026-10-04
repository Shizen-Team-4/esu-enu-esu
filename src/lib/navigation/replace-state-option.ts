// cspell:ignore replacestate
interface LinkSource {
	closest: (selector: string) => { getAttribute: (name: string) => string | null } | null
}

export function readReplaceStateOption(source: LinkSource | null): boolean | undefined {
	const attribute = 'data-sveltekit-replacestate'
	const value = source?.closest(`[${attribute}]`)?.getAttribute(attribute)
	if (value === '' || value === 'true') return true
	if (value === 'false' || value === 'off') return false
	return undefined
}
