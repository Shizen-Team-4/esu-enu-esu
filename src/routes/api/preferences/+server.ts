import { json } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import { errorResponse } from '$lib/server/shared/http/error-response'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.services) throw new AppError('INTERNAL')
		return json(
			await locals.services.preferences.getPreferences(locals.user?.id ?? null, locals.lang),
		)
	} catch (cause) {
		return errorResponse(cause)
	}
}

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		if (request.headers.get('origin') !== new URL(request.url).origin)
			throw new AppError('FORBIDDEN')
		if (!locals.services) throw new AppError('INTERNAL')
		const input: unknown = await request.json().catch(() => {
			throw new AppError('VALIDATION_FAILED')
		})
		return json(await locals.services.preferences.updatePreferences(locals.user?.id ?? null, input))
	} catch (cause) {
		return errorResponse(cause)
	}
}
