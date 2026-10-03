export type SwipeDirection = 'next' | 'prev' | null

/** Next index, stopping at the last item. */
export const nextIndex = (index: number, total: number): number =>
	Math.min(index + 1, Math.max(total - 1, 0))

/** Previous index, stopping at the first item. */
export const prevIndex = (index: number): number => Math.max(index - 1, 0)

/**
 * Turns a pointer movement into a slide direction. A swipe left shows the next item.
 * Vertical movements (page scroll) and short movements are ignored.
 */
export function swipeDirection(dx: number, dy: number, threshold: number): SwipeDirection {
	if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return null
	return dx < 0 ? 'next' : 'prev'
}
