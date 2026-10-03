export const POST_RATE_LIMIT = 30
export const POST_RATE_WINDOW_MS = 60 * 60 * 1000

/** Seconds until the oldest post in the window leaves it (at least 1). */
export function retryAfterSec(oldest: Date | null, now: Date): number {
	if (!oldest) return Math.ceil(POST_RATE_WINDOW_MS / 1000)
	const remainingMs = oldest.getTime() + POST_RATE_WINDOW_MS - now.getTime()
	return Math.max(1, Math.ceil(remainingMs / 1000))
}
