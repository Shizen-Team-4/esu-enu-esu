import { describe, expect, it } from 'vitest'
import {
	validateAvatarMediaId,
	validateBio,
	validateDisplayName,
	validateProfileUpdate,
	validateUsername,
} from './profile'

const fieldsOf = (run: () => unknown) => {
	try {
		run()
	} catch (cause) {
		return (cause as { fields?: Record<string, string> }).fields
	}
	return undefined
}

describe('validateUsername', () => {
	it('accepts and trims a valid username', () => {
		expect(validateUsername(' alice_01 ')).toBe('alice_01')
	})
	it.each([
		[undefined, 'INVALID_FORMAT'],
		['   ', 'REQUIRED'],
		['ab', 'TOO_SHORT'],
		['a'.repeat(31), 'TOO_LONG'],
		['Alice', 'INVALID_FORMAT'],
		['al ice', 'INVALID_FORMAT'],
	])('rejects %j with %s', (value, code) => {
		expect(fieldsOf(() => validateUsername(value))).toEqual({ username: code })
	})
	it('accepts the boundary lengths', () => {
		expect(validateUsername('abc')).toBe('abc')
		expect(validateUsername('a'.repeat(30))).toHaveLength(30)
	})
})

describe('validateDisplayName', () => {
	it('trims and accepts Unicode names', () => {
		expect(validateDisplayName('  山田 太郎 ')).toBe('山田 太郎')
	})
	it('counts characters, not code units', () => {
		expect(validateDisplayName('😀'.repeat(50))).toHaveLength(100)
	})
	it.each([
		[7, 'INVALID_FORMAT'],
		['  ', 'REQUIRED'],
		['x'.repeat(51), 'TOO_LONG'],
	])('rejects %j with %s', (value, code) => {
		expect(fieldsOf(() => validateDisplayName(value))).toEqual({ displayName: code })
	})
})

describe('validateBio', () => {
	it('allows an empty bio', () => {
		expect(validateBio('  ')).toBe('')
	})
	it('accepts exactly 160 characters', () => {
		expect(validateBio('b'.repeat(160))).toHaveLength(160)
	})
	it.each([
		[null, 'INVALID_FORMAT'],
		['b'.repeat(161), 'TOO_LONG'],
	])('rejects %j with %s', (value, code) => {
		expect(fieldsOf(() => validateBio(value))).toEqual({ bio: code })
	})
})

describe('validateAvatarMediaId', () => {
	it('accepts a media id and null', () => {
		expect(validateAvatarMediaId('med_1')).toBe('med_1')
		expect(validateAvatarMediaId(null)).toBeNull()
	})
	it.each([5, '', 'pst_1'])('rejects %j', (value) => {
		expect(fieldsOf(() => validateAvatarMediaId(value))).toEqual({
			avatarMediaId: 'INVALID_FORMAT',
		})
	})
})

describe('validateProfileUpdate', () => {
	it('returns only the provided keys', () => {
		expect(validateProfileUpdate({ bio: ' hi ', extra: 1, displayName: undefined })).toEqual({
			bio: 'hi',
		})
	})
	it('keeps avatarMediaId null to clear the avatar', () => {
		expect(validateProfileUpdate({ avatarMediaId: null })).toEqual({ avatarMediaId: null })
	})
	it('accepts an empty patch', () => {
		expect(validateProfileUpdate({})).toEqual({})
	})
	it('reports every invalid field together', () => {
		expect(fieldsOf(() => validateProfileUpdate({ username: 'A', bio: 'x'.repeat(200) }))).toEqual({
			username: 'TOO_SHORT',
			bio: 'TOO_LONG',
		})
	})
	it.each([null, 'text', ['a']])('rejects a non-object body %j', (value) => {
		expect(() => validateProfileUpdate(value)).toThrow(
			expect.objectContaining({ code: 'VALIDATION_FAILED' }),
		)
	})
})
