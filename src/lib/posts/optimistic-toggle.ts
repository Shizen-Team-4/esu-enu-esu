export interface LikeState {
	liked: boolean
	likes: number
}

export interface SaveState {
	saved: boolean
}

export function toggleLike(state: LikeState): LikeState {
	const liked = !state.liked
	return { liked, likes: Math.max(0, state.likes + (liked ? 1 : -1)) }
}

export function reconcileLike(_state: LikeState, result: LikeState): LikeState {
	return { liked: result.liked, likes: result.likes }
}

export function toggleSave(state: SaveState): SaveState {
	return { saved: !state.saved }
}

export function reconcileSave(_state: SaveState, result: SaveState): SaveState {
	return { saved: result.saved }
}

/** Returns a copy of the snapshot taken before an optimistic update. */
export function revert<T extends object>(snapshot: T): T {
	return { ...snapshot }
}
