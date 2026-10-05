export interface Clock {
	now(): Date
}

export interface TaskRunner {
	run(task: Promise<unknown>): void
}

export interface IdGenerator {
	generate(prefix: string): string
}
