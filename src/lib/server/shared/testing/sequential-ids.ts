import type { IdGenerator } from '../application/ports'

export function sequentialIds(): IdGenerator {
	let counter = 0
	return { generate: (prefix) => `${prefix}_${++counter}` }
}
