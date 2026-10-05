import { json } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import { requireApiServices } from '$lib/server/shared/http/guards'
import { toJsonError } from '$lib/server/shared/http/error-response'
import { optionalViewer } from '$lib/server/auth/viewer'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals, url }) => {
	try {
		if (request.headers.get('origin') !== url.origin) throw new AppError('FORBIDDEN')
		const services = requireApiServices(locals)
		const input: unknown = await request.json().catch(() => {
			throw new AppError('VALIDATION_FAILED')
		})
		return json(await services.media.createUpload(optionalViewer(locals.user), input))
	} catch (cause) {
		return toJsonError(cause)
	}
}
