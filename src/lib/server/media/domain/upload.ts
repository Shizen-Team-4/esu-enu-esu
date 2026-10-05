import { AppError } from '../../shared/domain/app-error'

export const mimeTypes = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'video/mp4': 'mp4',
	'video/webm': 'webm',
} as const
export type MimeType = keyof typeof mimeTypes
export type Purpose = 'post' | 'reel' | 'story' | 'avatar'
export interface Upload {
	id: string
	ownerId: string
	purpose: Purpose
	type: 'image' | 'video'
	mimeType: MimeType
	sizeBytes: number
	key: string
	thumbnailKey: string | null
	status: 'pending' | 'ready' | 'attached'
	width: number | null
	height: number | null
	durationSec: number | null
	createdAt: string
}

export function validateUpload(input: unknown): {
	purpose: Purpose
	mimeType: MimeType
	sizeBytes: number
	type: 'image' | 'video'
} {
	if (!input || typeof input !== 'object') throw new AppError('VALIDATION_FAILED')
	const value = input as Record<string, unknown>
	if (!['post', 'reel', 'story', 'avatar'].includes(String(value.purpose)))
		throw new AppError('VALIDATION_FAILED', { purpose: 'INVALID_FORMAT' })
	if (typeof value.mimeType !== 'string' || !Object.hasOwn(mimeTypes, value.mimeType))
		throw new AppError('UNSUPPORTED_MEDIA_TYPE')
	const type = value.mimeType.startsWith('image/') ? 'image' : 'video'
	if (
		(value.purpose === 'reel' && type !== 'video') ||
		(value.purpose === 'avatar' && type !== 'image')
	)
		throw new AppError('UNSUPPORTED_MEDIA_TYPE')
	if (
		typeof value.sizeBytes !== 'number' ||
		!Number.isSafeInteger(value.sizeBytes) ||
		value.sizeBytes < 1
	)
		throw new AppError('VALIDATION_FAILED', { sizeBytes: 'INVALID_FORMAT' })
	if (value.sizeBytes > (type === 'image' ? 10 : 100) * 1024 * 1024)
		throw new AppError('PAYLOAD_TOO_LARGE')
	return {
		purpose: value.purpose as Purpose,
		mimeType: value.mimeType as MimeType,
		sizeBytes: value.sizeBytes,
		type,
	}
}

export function validateDimensions(input: Record<string, unknown>, upload: Upload) {
	for (const key of ['width', 'height']) {
		const value = input[key]
		if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 10000)
			throw new AppError('VALIDATION_FAILED', { [key]: 'INVALID_FORMAT' })
	}
	const duration = input.durationSec
	if (
		upload.type === 'video' &&
		(typeof duration !== 'number' ||
			!Number.isFinite(duration) ||
			duration <= 0 ||
			((upload.purpose === 'reel' || upload.purpose === 'story') && duration > 90))
	)
		throw new AppError('VALIDATION_FAILED', { durationSec: 'INVALID_FORMAT' })
	if (upload.type === 'image' && duration !== null)
		throw new AppError('VALIDATION_FAILED', { durationSec: 'INVALID_FORMAT' })
	return {
		width: input.width as number,
		height: input.height as number,
		durationSec: duration as number | null,
	}
}

export function matchesMagic(bytes: Uint8Array, mime: MimeType): boolean {
	const starts = (values: number[]) => values.every((value, index) => bytes[index] === value)
	const text = (offset: number, value: string) =>
		[...value].every((char, index) => bytes[offset + index] === char.charCodeAt(0))
	switch (mime) {
		case 'image/jpeg':
			return starts([0xff, 0xd8, 0xff])
		case 'image/png':
			return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
		case 'image/webp':
			return text(0, 'RIFF') && text(8, 'WEBP')
		case 'video/mp4':
			return bytes.length >= 12 && text(4, 'ftyp')
		case 'video/webm':
			return starts([0x1a, 0x45, 0xdf, 0xa3])
	}
}
