export const IMAGE_STORY_MS = 8000

export function storyProgress(elapsedMs: number, durationMs: number): number {
	if (!Number.isFinite(elapsedMs) || !Number.isFinite(durationMs) || durationMs <= 0) return 0
	return Math.max(0, Math.min(1, elapsedMs / durationMs))
}
