/** Video time as m:ss, or h:mm:ss from one hour. Invalid or negative values show 0:00. */
export function formatDuration(totalSeconds: number): string {
	const seconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const rest = String(seconds % 60).padStart(2, '0')
	return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}
