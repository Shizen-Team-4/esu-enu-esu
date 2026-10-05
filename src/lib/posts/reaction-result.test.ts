import { describe, expect, it } from 'vitest'
import { errorCodeFromData, likeFromData, saveFromData } from './reaction-result'

describe('likeFromData', () => {
	it('reads a like result', () => {
		expect(likeFromData({ liked: true, likes: 4 })).toEqual({ liked: true, likes: 4 })
	})
	it.each([undefined, null, 'x', { liked: true }, { liked: 'yes', likes: 1 }])(
		'rejects %j',
		(data) => expect(likeFromData(data)).toBeNull(),
	)
})

describe('saveFromData', () => {
	it('reads a save result', () => {
		expect(saveFromData({ saved: false })).toEqual({ saved: false })
	})
	it.each([undefined, null, {}, { saved: 1 }])('rejects %j', (data) =>
		expect(saveFromData(data)).toBeNull(),
	)
})

describe('errorCodeFromData', () => {
	it('reads the envelope code', () => {
		expect(errorCodeFromData({ error: { code: 'RATE_LIMITED' } })).toBe('RATE_LIMITED')
	})
	it.each([undefined, {}, { error: {} }, { error: { code: 5 } }])('falls back for %j', (data) =>
		expect(errorCodeFromData(data)).toBe('INTERNAL'),
	)
})
