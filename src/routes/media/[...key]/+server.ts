import { error } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.services) error(503)
	try {
		const file = await locals.services.media.getMediaFile(params.key)
		return new Response(file.body, {
			headers: {
				'content-type': file.contentType,
				etag: file.etag,
				'x-content-type-options': 'nosniff',
				'content-length': String(file.size),
			},
		})
	} catch (cause) {
		if (cause instanceof AppError && cause.code === 'NOT_FOUND') error(404)
		error(500)
	}
}
