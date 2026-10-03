import { json } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { AppError } from '$lib/server/shared/domain/app-error'
import { requireApiServices } from '$lib/server/shared/http/guards'
import { toJsonError } from '$lib/server/shared/http/error-response'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const services = requireApiServices(locals)
		return json(
			await services.posts.listFeed(optionalViewer(locals.user), {
				scope: url.searchParams.get('scope') ?? 'all',
				cursor: url.searchParams.get('cursor') ?? undefined,
				limit: url.searchParams.get('limit') ?? undefined,
			}),
		)
	} catch (cause) {
		return toJsonError(cause)
	}
}
