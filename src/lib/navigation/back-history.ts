export const BACK_HISTORY_CONTEXT = Symbol('back-history')

export interface BackHistoryEntry {
	backHref: string | null
}

export interface BackHistorySnapshot extends BackHistoryEntry {
	href: string
}

interface NavigationInput {
	type: 'enter' | 'link' | 'goto' | 'form' | 'popstate' | 'leave'
	href: string
	fromHref?: string | null
	previousHref?: string | null
	replaceState?: boolean
	restored?: BackHistoryEntry
	reloaded?: boolean
	snapshot?: BackHistorySnapshot | null
}

export function resolveBackHref(input: NavigationInput): string | null {
	if (input.type === 'popstate') return input.restored?.backHref ?? null
	if (input.type === 'enter') {
		return input.reloaded && input.snapshot?.href === input.href ? input.snapshot.backHref : null
	}
	const sameEntry =
		(input.type === 'link' || input.type === 'form') && input.href === input.fromHref
	if (input.replaceState ?? sameEntry) return input.previousHref ?? null
	return input.fromHref ?? null
}

type BackClick = Pick<MouseEvent, 'button' | 'preventDefault'> &
	Partial<Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>>

export function followHistoryBack(event: BackClick, back: () => void): void {
	if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
	event.preventDefault()
	back()
}
