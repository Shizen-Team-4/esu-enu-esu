import { dev } from '$app/environment'
import { error, json } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import { errorResponse } from '$lib/server/shared/http/error-response'
import { optionalViewer } from '$lib/server/auth/viewer'
import type { RequestHandler } from './$types'

export const PUT: RequestHandler = async ({ locals, request, url }) => {
	if (!dev) error(404)
	try {
		if (!locals.services) throw new AppError('INTERNAL')
		if (request.headers.get('origin') !== url.origin) throw new AppError('FORBIDDEN')
		return json(
			await locals.services.media.uploadLocalFile(
				optionalViewer(locals.user),
				url.searchParams.get('token') ?? '',
				request,
			),
		)
	} catch (cause) {
		return errorResponse(cause)
	}
}
