import { describe, expect, it } from 'vitest'
import { matchesMagic, validateUpload, validateDimensions, type Upload } from './upload'

const upload: Upload = {
	id: 'med_1',
	ownerId: 'usr_1',
	purpose: 'post',
	type: 'image',
	mimeType: 'image/jpeg',
	sizeBytes: 3,
	key: 'usr_1/med_1.jpg',
	thumbnailKey: null,
	status: 'pending',
	width: null,
	height: null,
	durationSec: null,
	createdAt: '2026-10-03T00:00:00Z',
}
describe('media validation', () => {
	it.each([
		['image/jpeg', [255, 216, 255]],
		['image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
		['image/webp', [...'RIFF0000WEBP'].map((char) => char.charCodeAt(0))],
		['video/mp4', [0, 0, 0, 24, ...[...'ftypisom'].map((char) => char.charCodeAt(0))]],
		['video/webm', [26, 69, 223, 163]],
	] as const)('recognizes %s and rejects empty/spoofed bytes', (mime, bytes) => {
		expect(matchesMagic(Uint8Array.from(bytes), mime)).toBe(true)
		expect(matchesMagic(new Uint8Array(), mime)).toBe(false)
		expect(matchesMagic(new TextEncoder().encode('<html>'), mime)).toBe(false)
	})
	it('accepts exact size boundaries', () => {
		expect(
			validateUpload({ purpose: 'post', mimeType: 'image/jpeg', sizeBytes: 10 * 1024 * 1024 }).type,
		).toBe('image')
		expect(
			validateUpload({ purpose: 'reel', mimeType: 'video/mp4', sizeBytes: 100 * 1024 * 1024 }).type,
		).toBe('video')
	})
	it.each([
		null,
		[],
		{ purpose: 'bad' },
		{ purpose: 'post', mimeType: '__proto__' },
		{ purpose: 'post', mimeType: 'image/svg+xml' },
		{ purpose: 'reel', mimeType: 'image/jpeg' },
		{ purpose: 'avatar', mimeType: 'video/mp4' },
		{ purpose: 'post', mimeType: 'image/png', sizeBytes: 0 },
		{ purpose: 'post', mimeType: 'image/png', sizeBytes: 1.5 },
		{ purpose: 'post', mimeType: 'image/png', sizeBytes: '10' },
		{ purpose: 'post', mimeType: 'image/png', sizeBytes: 10 * 1024 * 1024 + 1 },
	])('rejects invalid upload %j', (input) => {
		expect(() => validateUpload(input)).toThrow()
	})
	it('accepts dimension boundaries and a 90-second story', () => {
		expect(
			validateDimensions({ width: 1, height: 10000, durationSec: null }, upload),
		).toMatchObject({ width: 1, height: 10000 })
		expect(
			validateDimensions(
				{ width: 1080, height: 1920, durationSec: 90 },
				{ ...upload, type: 'video', purpose: 'story' },
			).durationSec,
		).toBe(90)
	})
	it.each([
		{ width: 0, height: 1, durationSec: null },
		{ width: 1, height: 10001, durationSec: null },
		{ width: 1.5, height: 1, durationSec: null },
		{ width: 1, height: 1, durationSec: 1 },
	])('rejects invalid image metadata %j', (metadata) => {
		expect(() => validateDimensions(metadata, upload)).toThrow('VALIDATION_FAILED')
	})
	it.each([null, 0, -1, NaN, Infinity, 90.1])('rejects invalid reel duration %j', (duration) => {
		expect(() =>
			validateDimensions(
				{ width: 1, height: 1, durationSec: duration },
				{ ...upload, type: 'video', purpose: 'reel' },
			),
		).toThrow('VALIDATION_FAILED')
	})
})
