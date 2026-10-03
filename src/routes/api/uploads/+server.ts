import { json } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import { errorResponse } from '$lib/server/shared/http/error-response'
import { optionalViewer } from '$lib/server/auth/viewer'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals, url }) => {
	try {
		if (request.headers.get('origin') !== url.origin) throw new AppError('FORBIDDEN')
		if (!locals.services) throw new AppError('INTERNAL')
		const input: unknown = await request.json().catch(() => {
			throw new AppError('VALIDATION_FAILED')
		})
		return json(await locals.services.media.createUpload(optionalViewer(locals.user), input))
	} catch (cause) {
		return errorResponse(cause)
	}
}
