import { toHttpError } from '$lib/server/shared/http/error-response'
import { requireServices } from '$lib/server/shared/http/guards'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, params }) => {
	const services = requireServices(locals)
	try {
		const file = await services.media.getMediaFile(params.key)
		return new Response(file.body, {
			headers: {
				'content-type': file.contentType,
				etag: file.etag,
				'x-content-type-options': 'nosniff',
				'content-length': String(file.size),
			},
		})
	} catch (cause) {
		return toHttpError(cause)
	}
}
