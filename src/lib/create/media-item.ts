import type { ApiError } from '$lib/api/api-error'

export type MediaStatus = 'uploading' | 'ready' | 'failed'

export interface MediaItem {
	key: string
	file: File
	url: string
	status: MediaStatus
	id?: string
	error?: ApiError
}
