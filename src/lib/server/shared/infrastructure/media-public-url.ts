const DEFAULT_MEDIA_URL = '/media'

export function normalizeMediaUrl(value: string | undefined): string {
	if (!value) return DEFAULT_MEDIA_URL
	return value.replace(/\/$/, '')
}
