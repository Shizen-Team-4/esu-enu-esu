import type { ErrorCode, ErrorEnvelope } from '$lib/contract'
import type { ClientErrorCode } from '$lib/errors/error-message'

export class ApiError extends Error {
	readonly code: ClientErrorCode
	readonly fields?: Record<string, string>
	readonly retryAfterSec?: number

	constructor(
		code: ClientErrorCode,
		options: { message?: string; fields?: Record<string, string>; retryAfterSec?: number } = {},
	) {
		super(options.message ?? code)
		this.name = 'ApiError'
		this.code = code
		this.fields = options.fields
		this.retryAfterSec = options.retryAfterSec
	}
}

function isEnvelope(body: unknown): body is ErrorEnvelope {
	if (typeof body !== 'object' || body === null) return false
	const error = (body as { error?: unknown }).error
	return (
		typeof error === 'object' &&
		error !== null &&
		typeof (error as { code?: unknown }).code === 'string'
	)
}

export async function readApiError(response: Response): Promise<ApiError> {
	try {
		const body: unknown = await response.json()
		if (!isEnvelope(body)) return new ApiError('INTERNAL')
		const { code, message, fields, retryAfterSec } = body.error
		return new ApiError(code as ErrorCode, { message, fields, retryAfterSec })
	} catch {
		return new ApiError('INTERNAL')
	}
}
