import { json } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { AppError } from '$lib/server/shared/domain/app-error'
import { errorResponse } from '$lib/server/shared/http/error-response'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		if (!locals.services) throw new AppError('INTERNAL')
		return json(
			await locals.services.posts.listFeed(optionalViewer(locals.user), {
				scope: url.searchParams.get('scope') ?? 'all',
				cursor: url.searchParams.get('cursor') ?? undefined,
				limit: url.searchParams.get('limit') ?? undefined,
			}),
		)
	} catch (cause) {
		return errorResponse(cause)
	}
}
