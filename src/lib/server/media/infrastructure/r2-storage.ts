import { AwsClient } from 'aws4fetch'
import type { MediaStorage } from '../application/ports'
import { signLocalUpload } from './local-upload'

export interface R2Config {
	MEDIA?: R2Bucket
	R2_ACCOUNT_ID?: string
	R2_ACCESS_KEY_ID?: string
	R2_SECRET_ACCESS_KEY?: string
	R2_BUCKET?: string
	MEDIA_PUBLIC_URL?: string
}

export function createR2Storage(
	config: R2Config,
	local?: { origin: string; secret: string },
): MediaStorage {
	const bucket = () => {
		if (!config.MEDIA) throw new Error('MEDIA binding is required')
		return config.MEDIA
	}
	return {
		async sign(key, mimeType, sizeBytes, expiresAt) {
			if (local) {
				const token = await signLocalUpload(local.secret, {
					key,
					mimeType,
					sizeBytes,
					expiresAt: expiresAt.getTime(),
				})
				return `${local.origin}/api/dev/uploads?token=${encodeURIComponent(token)}`
			}
			if (
				!config.R2_ACCOUNT_ID ||
				!config.R2_ACCESS_KEY_ID ||
				!config.R2_SECRET_ACCESS_KEY ||
				!config.R2_BUCKET
			)
				throw new Error('R2 signing credentials are required')
			const client = new AwsClient({
				accessKeyId: config.R2_ACCESS_KEY_ID,
				secretAccessKey: config.R2_SECRET_ACCESS_KEY,
				service: 's3',
				region: 'auto',
			})
			const url = new URL(
				`https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${config.R2_BUCKET}/${key}`,
			)
			url.searchParams.set('X-Amz-Expires', '900')
			const datetime = new Date(expiresAt.getTime() - 900000)
				.toISOString()
				.replace(/[:-]|\.\d{3}/g, '')
			return (
				await client.sign(
					new Request(url, {
						method: 'PUT',
						headers: {
							'Content-Type': mimeType,
							'Content-Length': String(sizeBytes),
							'If-None-Match': '*',
						},
					}),
					{ aws: { signQuery: true, allHeaders: true, datetime } },
				)
			).url
		},
		async head(key) {
			const object = await bucket().head(key)
			return object ? { size: object.size } : null
		},
		async read(key) {
			const object = await bucket().get(key, { range: { offset: 0, length: 32 } })
			return object ? new Uint8Array(await object.arrayBuffer()) : new Uint8Array()
		},
		delete: (key) => bucket().delete(key),
		async download(key) {
			const object = await bucket().get(key)
			return object
				? {
						body: object.body,
						contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
						etag: object.httpEtag,
						size: object.size,
					}
				: null
		},
	}
}
