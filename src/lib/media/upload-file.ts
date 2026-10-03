import { ApiError, readApiError } from '$lib/api/api-error'
import { readMetadata, type FileMetadata } from './read-metadata'

export interface UploadResult {
	id: string
	type: 'image' | 'video'
	url: string
	width: number
	height: number
	thumbnailUrl: string | null
	durationSec: number | null
}

type Fetch = typeof globalThis.fetch

export interface UploadDeps {
	fetch?: Fetch
	readMetadata?: (file: File) => Promise<FileMetadata>
}

interface UploadTicket {
	mediaId: string
	uploadUrl: string
	thumbnailUploadUrl: string | null
	headers: Record<string, string>
}

async function send(fetchFn: Fetch, url: string, init: RequestInit): Promise<Response> {
	try {
		return await fetchFn(url, init)
	} catch {
		throw new ApiError('INTERNAL')
	}
}

async function sendJson(fetchFn: Fetch, url: string, body: unknown): Promise<Response> {
	const response = await send(fetchFn, url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!response.ok) throw await readApiError(response)
	return response
}

async function putObject(
	fetchFn: Fetch,
	url: string,
	headers: Record<string, string>,
	body: Blob,
): Promise<void> {
	const response = await send(fetchFn, url, { method: 'PUT', headers, body })
	if (response.status === 403) throw new ApiError('UPLOAD_EXPIRED')
	if (!response.ok) throw new ApiError('INTERNAL')
}

export async function uploadFile(
	file: File,
	purpose: 'post' | 'reel' | 'avatar' | 'story' = 'post',
	deps: UploadDeps = {},
): Promise<UploadResult> {
	const fetchFn = deps.fetch ?? globalThis.fetch.bind(globalThis)
	const metadata = await (deps.readMetadata ?? readMetadata)(file)
	const started = await sendJson(fetchFn, '/api/uploads', {
		purpose,
		mimeType: file.type,
		sizeBytes: file.size,
		...(metadata.poster ? { thumbnailSizeBytes: metadata.poster.size } : {}),
	})
	const ticket = (await started.json()) as UploadTicket
	await putObject(fetchFn, ticket.uploadUrl, ticket.headers, file)
	if (ticket.thumbnailUploadUrl && metadata.poster) {
		await putObject(
			fetchFn,
			ticket.thumbnailUploadUrl,
			{ 'Content-Type': 'image/webp', 'If-None-Match': '*' },
			metadata.poster,
		)
	}
	const complete = await sendJson(fetchFn, `/api/uploads/${ticket.mediaId}/complete`, {
		width: metadata.width,
		height: metadata.height,
		durationSec: metadata.durationSec,
	})
	return (await complete.json()) as UploadResult
}
