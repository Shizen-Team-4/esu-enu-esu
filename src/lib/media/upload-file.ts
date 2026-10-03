import { readFiniteDuration } from './video-duration'

interface UploadResult {
	id: string
	type: 'image' | 'video'
	url: string
	width: number
	height: number
	thumbnailUrl: string | null
	durationSec: number | null
}

async function readVideo(file: File) {
	const video = document.createElement('video'),
		objectUrl = URL.createObjectURL(file)
	video.preload = 'auto'
	video.muted = true
	video.src = objectUrl
	try {
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => reject(new Error('Video metadata timed out')), 15000)
			video.onloadeddata = () => {
				clearTimeout(timeout)
				resolve()
			}
			video.onerror = () => {
				clearTimeout(timeout)
				reject(new Error('Video cannot be decoded'))
			}
		})
		const durationSec = await readFiniteDuration(video)
		const canvas = document.createElement('canvas')
		const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
		canvas.width = Math.round(video.videoWidth * scale)
		canvas.height = Math.round(video.videoHeight * scale)
		const context = canvas.getContext('2d')
		if (!context) throw new Error('Poster cannot be created')
		context.drawImage(video, 0, 0, canvas.width, canvas.height)
		const poster = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error('Poster cannot be created'))),
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

export async function uploadFile(
	file: File,
	purpose: 'post' | 'reel' | 'avatar' | 'story' = 'post',
): Promise<UploadResult> {
	const video = file.type.startsWith('video/')
	const metadata = video
		? await readVideo(file)
		: await (async () => {
				const image = await createImageBitmap(file)
				try {
					return { width: image.width, height: image.height, durationSec: null, poster: null }
				} finally {
					image.close()
				}
			})()
	const response = await fetch('/api/uploads', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			purpose,
			mimeType: file.type,
			sizeBytes: file.size,
			...(metadata.poster ? { thumbnailSizeBytes: metadata.poster.size } : {}),
		}),
	})
	if (!response.ok) throw new Error('Upload could not be started')
	const upload = (await response.json()) as {
		mediaId: string
		uploadUrl: string
		thumbnailUploadUrl: string | null
		headers: Record<string, string>
	}
	const transfer = await fetch(upload.uploadUrl, {
		method: 'PUT',
		headers: upload.headers,
		body: file,
	})
	if (!transfer.ok) throw new Error('Upload transfer failed')
	if (upload.thumbnailUploadUrl && metadata.poster) {
		const poster = await fetch(upload.thumbnailUploadUrl, {
			method: 'PUT',
			headers: { 'Content-Type': 'image/webp', 'If-None-Match': '*' },
			body: metadata.poster,
		})
		if (!poster.ok) throw new Error('Poster transfer failed')
	}
	const complete = await fetch(`/api/uploads/${upload.mediaId}/complete`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			width: metadata.width,
			height: metadata.height,
			durationSec: metadata.durationSec,
		}),
	})
	if (!complete.ok) throw new Error('Upload could not be verified')
	return complete.json() as Promise<UploadResult>
}
