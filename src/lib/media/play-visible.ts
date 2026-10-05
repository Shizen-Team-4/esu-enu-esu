/** Only the visible reel plays; leaving it or hiding the tab always pauses it. */
export function playVisible(video: HTMLVideoElement) {
	let visible = false
	let stopped = false
	let pausedByUser = false
	const sync = () => {
		if (!visible || document.hidden || stopped || pausedByUser) video.pause()
		else void video.play().catch(() => {})
	}
	const observer = new IntersectionObserver(
		(entries) => {
			visible = entries[0]?.isIntersecting === true && entries[0].intersectionRatio >= 0.6
			if (!visible) pausedByUser = false
			sync()
		},
		{ threshold: [0, 0.6] },
	)
	const pause = () => {
		if (visible && !document.hidden && !video.ended) pausedByUser = true
	}
	const play = () => {
		pausedByUser = false
	}
	video.addEventListener('pause', pause)
	video.addEventListener('play', play)
	document.addEventListener('visibilitychange', sync)
	observer.observe(video)
	return {
		destroy() {
			stopped = true
			observer.disconnect()
			document.removeEventListener('visibilitychange', sync)
			video.removeEventListener('pause', pause)
			video.removeEventListener('play', play)
			video.pause()
		},
	}
}
