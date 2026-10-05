import { describe, expect, it } from 'vitest'
import { normalizeMediaUrl } from './media-public-url'

describe('normalizeMediaUrl', () => {
	it('defaults to /media when undefined', () => {
		expect(normalizeMediaUrl(undefined)).toBe('/media')
	})
	it('defaults to /media when empty', () => {
		expect(normalizeMediaUrl('')).toBe('/media')
	})
	it('strips one trailing slash', () => {
		expect(normalizeMediaUrl('https://cdn.example.com/')).toBe('https://cdn.example.com')
	})
	it('keeps a url without a trailing slash', () => {
		expect(normalizeMediaUrl('https://cdn.example.com')).toBe('https://cdn.example.com')
	})
})
