import { describe, it, expect } from 'vitest'
import { parseAcceptLanguage } from './accept-language'

const SUPPORTED = ['en', 'km', 'ja'] as const

describe('parseAcceptLanguage', () => {
	it.each([
		['km,en;q=0.8', 'km'],
		['ja-JP,ja;q=0.9,en;q=0.8', 'ja'],
		['fr-FR,fr;q=0.9,en;q=0.5', 'en'],
		['en;q=0.5,km;q=0.9', 'km'],
		['KM-kh', 'km'],
		['fr,de', null],
		['km;q=0', null],
		['*', null],
		['zzz;;;,,', null],
		['', null],
		[null, null],
		[undefined, null],
	])('%s -> %s', (header, expected) => {
		expect(parseAcceptLanguage(header, SUPPORTED)).toBe(expected)
	})
})
