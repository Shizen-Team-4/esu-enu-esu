type Observer = Pick<IntersectionObserver, 'observe' | 'disconnect'>
type ObserverFactory = (callback: IntersectionObserverCallback) => Observer

/** Observe the list's trailing marker; its owner removes it while loading or after an error. */
export function observeMore(
	node: Element,
	onMore: () => void,
	createObserver: ObserverFactory = (callback) => new IntersectionObserver(callback),
) {
	const observer = createObserver((entries) => {
		if (entries.some((entry) => entry.isIntersecting)) onMore()
	})
	observer.observe(node)
	return { destroy: () => observer.disconnect() }
}
