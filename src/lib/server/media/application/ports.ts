import type { Purpose, Upload } from '../domain/upload'

export interface MediaRepository {
	find(id: string): Promise<Upload | null>
	findByKey(key: string): Promise<Upload | null>
	create(upload: Upload): Promise<void>
	complete(
		id: string,
		ownerId: string,
		metadata: { width: number; height: number; durationSec: number | null },
	): Promise<boolean>
}
export interface MediaStorage {
	sign(
		key: string,
		mimeType: string,
		sizeBytes: number,
		expiresAt: Date,
		purpose: Purpose,
	): Promise<string>
	head(key: string): Promise<{ size: number } | null>
	read(key: string): Promise<Uint8Array>
	delete(key: string): Promise<void>
	download(key: string): Promise<{
		body: ReadableStream<Uint8Array>
		contentType: string
		etag: string
		size: number
	} | null>
}
