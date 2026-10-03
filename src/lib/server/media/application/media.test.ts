import { describe, expect, it } from 'vitest'
import { createUpload } from './create-upload'
import { completeUpload } from './complete-upload'
import { getMediaFile } from './get-media-file'
import type { MediaRepository, MediaStorage } from './ports'
import type { Upload } from '../domain/upload'

function setup() {
	let row: Upload | null = {
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
	const repository: MediaRepository = {
		find: async () => row,
		findByKey: async () => row,
		create: async (upload) => {
			row = upload
		},
		complete: async (_id, _owner, metadata) => {
			if (!row) return false
			row = { ...row, ...metadata, status: 'ready' }
			return true
		},
	}
	let deleted = false
	const storage: MediaStorage = {
		sign: async () => 'https://example.com/signed',
		head: async () => ({ size: 3 }),
		read: async () => new Uint8Array([255, 216, 255]),
		delete: async () => {
			deleted = true
		},
		download: async () => ({
			body: new ReadableStream(),
			contentType: 'image/jpeg',
			etag: 'etag',
			size: 3,
		}),
	}
	return {
		repository,
		storage,
		clock: { now: () => new Date('2026-10-03T00:00:00Z') },
		ids: { generate: () => 'med_1' },
		publicUrl: 'https://cdn.example.com',
		setRow: (value: Upload | null) => {
			row = value
		},
		get row() {
			return row
		},
		get deleted() {
			return deleted
		},
	}
}
const viewer = { id: 'usr_1', role: 'user' as const }
const metadata = { mediaId: 'med_1', width: 10, height: 20, durationSec: null }
describe('media operations', () => {
	it('issues a write-once image URL and records pending media', async () => {
		const deps = setup(),
			result = await createUpload(deps)(viewer, {
				purpose: 'post',
				mimeType: 'image/jpeg',
				sizeBytes: 3,
			})
		expect(result.headers['If-None-Match']).toBe('*')
		expect(result.expiresAt).toBe('2026-10-03T00:15:00.000Z')
		expect(deps.row?.status).toBe('pending')
		expect(result.thumbnailUploadUrl).toBe(null)
	})
	it('issues a video and poster URL with a single media row', async () => {
		const deps = setup(),
			result = await createUpload(deps)(viewer, {
				purpose: 'reel',
				mimeType: 'video/mp4',
				sizeBytes: 20,
				thumbnailSizeBytes: 100,
			})
		expect(result.thumbnailUploadUrl).toBe('https://example.com/signed')
		expect(deps.row?.thumbnailKey).toBe('usr_1/med_1.poster.webp')
	})
	it('rejects an oversized poster', async () => {
		await expect(
			createUpload(setup())(viewer, {
				purpose: 'reel',
				mimeType: 'video/mp4',
				sizeBytes: 20,
				thumbnailSizeBytes: 1024 * 1024 + 1,
			}),
		).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' })
	})
	it('verifies uploaded bytes before returning public media', async () => {
		const deps = setup()
		expect(await completeUpload(deps)(viewer, metadata)).toMatchObject({
			id: 'med_1',
			width: 10,
			height: 20,
			url: 'https://cdn.example.com/usr_1/med_1.jpg',
		})
		expect(deps.row?.status).toBe('ready')
	})
	it('rejects missing, foreign and already attached uploads', async () => {
		const deps = setup()
		await expect(completeUpload(deps)({ ...viewer, id: 'usr_2' }, metadata)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
		deps.setRow({ ...deps.row!, status: 'attached' })
		await expect(completeUpload(deps)(viewer, metadata)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
		deps.setRow(null)
		await expect(completeUpload(deps)(viewer, metadata)).rejects.toMatchObject({
			code: 'NOT_FOUND',
		})
	})
	it('rejects missing and mismatched object sizes', async () => {
		const deps = setup()
		deps.storage.head = async () => null
		await expect(completeUpload(deps)(viewer, metadata)).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
		deps.storage.head = async () => ({ size: 4 })
		await expect(completeUpload(deps)(viewer, metadata)).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})
	it('deletes a spoofed object and never marks it ready', async () => {
		const deps = setup()
		deps.storage.read = async () => new TextEncoder().encode('<html>')
		await expect(completeUpload(deps)(viewer, metadata)).rejects.toMatchObject({
			code: 'UNSUPPORTED_MEDIA_TYPE',
		})
		expect(deps.deleted).toBe(true)
		expect(deps.row?.status).toBe('pending')
	})
	it('requires a valid video poster', async () => {
		const deps = setup()
		deps.setRow({ ...deps.row!, type: 'video', mimeType: 'video/mp4', thumbnailKey: 'poster.webp' })
		deps.storage.read = async (key) =>
			key === 'poster.webp'
				? new TextEncoder().encode('RIFF0000WEBP')
				: new TextEncoder().encode('0000ftypisom')
		expect(await completeUpload(deps)(viewer, { ...metadata, durationSec: 1 })).toMatchObject({
			thumbnailUrl: 'https://cdn.example.com/poster.webp',
		})
		deps.setRow({ ...deps.row!, status: 'pending' })
		deps.storage.head = async (key) => (key === 'poster.webp' ? null : { size: 3 })
		await expect(
			completeUpload(deps)(viewer, { ...metadata, durationSec: 1 }),
		).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
	})
	it('reports a conflicting completion', async () => {
		const deps = setup()
		deps.repository.complete = async () => false
		await expect(completeUpload(deps)(viewer, metadata)).rejects.toMatchObject({ code: 'CONFLICT' })
	})
	it('requires login for upload operations', async () => {
		const deps = setup()
		await expect(createUpload(deps)(null, {})).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
		await expect(completeUpload(deps)(null, metadata)).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})
	it('hides unverified media and serves verified images and posters', async () => {
		const deps = setup()
		await expect(getMediaFile(deps)('key')).rejects.toMatchObject({ code: 'NOT_FOUND' })
		deps.setRow({ ...deps.row!, status: 'ready' })
		expect((await getMediaFile(deps)('key')).contentType).toBe('image/jpeg')
		deps.setRow({ ...deps.row!, thumbnailKey: 'poster' })
		expect((await getMediaFile(deps)('poster')).contentType).toBe('image/webp')
		deps.storage.download = async () => null
		await expect(getMediaFile(deps)('key')).rejects.toMatchObject({ code: 'NOT_FOUND' })
		deps.setRow(null)
		await expect(getMediaFile(deps)('key')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})
})
