export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

export interface ShareNavigator {
	share?: (data: { url: string; title: string }) => Promise<void>
	clipboard?: { writeText: (text: string) => Promise<void> }
}

const isAbort = (cause: unknown) => cause instanceof Error && cause.name === 'AbortError'

async function copy(url: string, clipboard: ShareNavigator['clipboard']): Promise<ShareOutcome> {
	if (!clipboard) return 'failed'
	try {
		await clipboard.writeText(url)
		return 'copied'
	} catch {
		return 'failed'
	}
}

/** Uses the Web Share API when present, otherwise copies the link. */
export async function sharePost(
	url: string,
	title: string,
	nav: ShareNavigator,
): Promise<ShareOutcome> {
	if (!nav.share) return copy(url, nav.clipboard)
	try {
		await nav.share({ url, title })
		return 'shared'
	} catch (cause) {
		return isAbort(cause) ? 'cancelled' : 'failed'
	}
}
