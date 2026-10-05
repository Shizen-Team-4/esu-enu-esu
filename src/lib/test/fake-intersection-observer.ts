type Callback = (entries: Pick<IntersectionObserverEntry, 'isIntersecting' | 'target'>[]) => void

/** Hand-written stand-in for IntersectionObserver (jsdom has none). */
export class FakeIntersectionObserver {
	static instances: FakeIntersectionObserver[] = []
	readonly targets = new Set<Element>()

	constructor(private readonly callback: Callback) {
		FakeIntersectionObserver.instances.push(this)
	}

	observe(target: Element) {
		this.targets.add(target)
	}

	unobserve(target: Element) {
		this.targets.delete(target)
	}

	disconnect() {
		this.targets.clear()
	}

	trigger(isIntersecting: boolean) {
		this.callback([...this.targets].map((target) => ({ isIntersecting, target })))
	}

	static reset() {
		FakeIntersectionObserver.instances = []
	}
}
