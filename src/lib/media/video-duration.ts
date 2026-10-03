type DurationVideo = Pick<
	HTMLMediaElement,
	'duration' | 'currentTime' | 'addEventListener' | 'removeEventListener'
>

// Resolves once the element fires `seeked`, or rejects on timeout.
function seekTo(video: DurationVideo, time: number, timeoutMs: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const finish = (error?: Error) => {
			clearTimeout(timer)
			video.removeEventListener('seeked', onSeeked)
			if (error) reject(error)
			else resolve()
		}
		const onSeeked = () => finish()
		const timer = setTimeout(() => finish(new Error('Video duration unavailable')), timeoutMs)
		video.addEventListener('seeked', onSeeked)
		video.currentTime = time
	})
}

// Waits for `duration` to become finite after forcing a seek to the end.
function waitForFiniteDuration(video: DurationVideo, timeoutMs: number): Promise<number> {
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			clearTimeout(timer)
			video.removeEventListener('durationchange', onChange)
			video.removeEventListener('timeupdate', onChange)
		}
		const onChange = () => {
			if (!Number.isFinite(video.duration)) return
			cleanup()
			resolve(video.duration)
		}
		const timer = setTimeout(() => {
			cleanup()
			reject(new Error('Video duration unavailable'))
		}, timeoutMs)
		video.addEventListener('durationchange', onChange)
		video.addEventListener('timeupdate', onChange)
		video.currentTime = Number.MAX_SAFE_INTEGER
	})
}

// MediaRecorder WebM files report Infinity until the browser has seeked to the end.
export async function readFiniteDuration(video: DurationVideo, timeoutMs = 15000): Promise<number> {
	if (Number.isFinite(video.duration)) return video.duration
	const duration = await waitForFiniteDuration(video, timeoutMs)
	await seekTo(video, 0, timeoutMs)
	return duration
}
