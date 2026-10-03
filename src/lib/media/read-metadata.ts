import { ApiError } from '$lib/api/api-error'
import { readFiniteDuration } from './video-duration'

export interface FileMetadata {
	width: number
	height: number
	durationSec: number | null
	poster: Blob | null
}

async function readVideo(file: File): Promise<FileMetadata> {
	const video = document.createElement('video'),
		objectUrl = URL.createObjectURL(file)
	video.preload = 'auto'
	video.muted = true
	video.src = objectUrl
	try {
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => reject(new ApiError('VALIDATION_FAILED')), 15000)
			video.onloadeddata = () => {
				clearTimeout(timeout)
				resolve()
			}
			video.onerror = () => {
				clearTimeout(timeout)
				reject(new ApiError('VALIDATION_FAILED'))
			}
		})
		const durationSec = await readFiniteDuration(video)
		const canvas = document.createElement('canvas')
		const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
		canvas.width = Math.round(video.videoWidth * scale)
		canvas.height = Math.round(video.videoHeight * scale)
		const context = canvas.getContext('2d')
		if (!context) throw new ApiError('INTERNAL')
		context.drawImage(video, 0, 0, canvas.width, canvas.height)
		const poster = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new ApiError('INTERNAL'))),
				'image/webp',
				0.8,
			),
		)
		return {
			width: video.videoWidth,
			height: video.videoHeight,
			durationSec,
			poster,
		}
	} finally {
		video.removeAttribute('src')
		video.load()
		URL.revokeObjectURL(objectUrl)
	}
}

async function readImage(file: File): Promise<FileMetadata> {
	let image: ImageBitmap
	try {
		image = await createImageBitmap(file)
	} catch {
		throw new ApiError('VALIDATION_FAILED')
	}
	try {
		return { width: image.width, height: image.height, durationSec: null, poster: null }
	} finally {
		image.close()
	}
}

export function readMetadata(file: File): Promise<FileMetadata> {
	return file.type.startsWith('video/') ? readVideo(file) : readImage(file)
}
