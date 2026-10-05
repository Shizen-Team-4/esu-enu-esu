type WidthObserver = Pick<ResizeObserver, 'observe' | 'disconnect'>

/** Fits the content after input, draft updates and changes in available width. */
export function autoSizeTextarea(
	node: HTMLTextAreaElement,
	_value: string,
	createObserver: (onResize: () => void) => WidthObserver = (onResize) =>
		new ResizeObserver(onResize),
) {
	const resize = () => {
		node.style.height = 'auto'
		node.style.height = `${node.scrollHeight + node.offsetHeight - node.clientHeight}px`
	}
	let width = node.clientWidth
	const observer = createObserver(() => {
		if (node.clientWidth === width) return
		width = node.clientWidth
		resize()
	})
	node.addEventListener('input', resize)
	observer.observe(node)
	resize()
	return {
		update: resize,
		destroy() {
			node.removeEventListener('input', resize)
			observer.disconnect()
		},
	}
}
