import { json } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import { requireApiServices } from '$lib/server/shared/http/guards'
import { toJsonError } from '$lib/server/shared/http/error-response'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const services = requireApiServices(locals)
		return json(await services.preferences.getPreferences(locals.user?.id ?? null, locals.lang))
	} catch (cause) {
		return toJsonError(cause)
	}
}

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		if (request.headers.get('origin') !== new URL(request.url).origin)
			throw new AppError('FORBIDDEN')
		const services = requireApiServices(locals)
		const input: unknown = await request.json().catch(() => {
			throw new AppError('VALIDATION_FAILED')
		})
		return json(await services.preferences.updatePreferences(locals.user?.id ?? null, input))
	} catch (cause) {
		return toJsonError(cause)
	}
}
