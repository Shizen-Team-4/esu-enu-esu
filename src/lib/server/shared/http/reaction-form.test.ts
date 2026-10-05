import { describe, expect, it } from 'vitest'
import { reactionFormInput } from './reaction-form'

const form = (entries: Record<string, string>) => {
	const data = new FormData()
	for (const [key, value] of Object.entries(entries)) data.set(key, value)
	return data
}

describe('reactionFormInput', () => {
	it('reads the id and an active flag of "true"', () => {
		expect(reactionFormInput(form({ id: 'pst_1', active: 'true' }))).toEqual({
			id: 'pst_1',
			active: true,
		})
	})

	it('treats "false" as inactive', () => {
		expect(reactionFormInput(form({ id: 'pst_1', active: 'false' })).active).toBe(false)
	})

	it('treats a missing active flag as inactive', () => {
		expect(reactionFormInput(form({ id: 'pst_1' })).active).toBe(false)
	})

	it('falls back to an empty id when it is missing', () => {
		expect(reactionFormInput(form({ active: 'true' })).id).toBe('')
	})
})
