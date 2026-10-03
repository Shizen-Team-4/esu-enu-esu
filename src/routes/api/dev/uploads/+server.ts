import { dev } from '$app/environment'
import { error, json } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import { requireApiServices } from '$lib/server/shared/http/guards'
import { toJsonError } from '$lib/server/shared/http/error-response'
import { optionalViewer } from '$lib/server/auth/viewer'
import type { RequestHandler } from './$types'

export const PUT: RequestHandler = async ({ locals, request, url }) => {
	if (!dev) error(404)
	try {
		const services = requireApiServices(locals)
		if (request.headers.get('origin') !== url.origin) throw new AppError('FORBIDDEN')
		return json(
			await services.media.uploadLocalFile(
				optionalViewer(locals.user),
				url.searchParams.get('token') ?? '',
				request,
			),
		)
	} catch (cause) {
		return toJsonError(cause)
	}
}
