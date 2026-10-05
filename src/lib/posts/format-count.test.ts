import { describe, expect, it } from 'vitest'
import { formatCount } from './format-count'

describe('formatCount', () => {
	it('keeps small numbers as they are', () => expect(formatCount(42, 'en')).toBe('42'))
	it('shortens thousands', () => expect(formatCount(1200, 'en')).toBe('1.2K'))
	it('shortens millions', () => expect(formatCount(3_000_000, 'en')).toBe('3M'))
	it('follows the locale', () => expect(formatCount(10_000, 'ja')).toBe('1万'))
})
