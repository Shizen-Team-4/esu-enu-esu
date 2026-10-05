import type { Attachment } from 'svelte/attachments'

type InViewOptions = {
	onEnter?: () => void
	onLeave?: () => void
}

/** Svelte attachment that reports when the element enters or leaves the viewport. */
export const inView =
	({ onEnter, onLeave }: InViewOptions): Attachment<Element> =>
	(element) => {
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) onEnter?.()
				else onLeave?.()
			}
		})
		observer.observe(element)
		return () => observer.disconnect()
	}
