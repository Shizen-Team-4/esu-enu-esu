import { json } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { requireApiServices } from '$lib/server/shared/http/guards'
import { toJsonError } from '$lib/server/shared/http/error-response'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, params, url }) => {
	try {
		const services = requireApiServices(locals)
		return json(
			await services.comments.listComments(optionalViewer(locals.user), {
				postId: params.id,
				cursor: url.searchParams.get('cursor') ?? undefined,
				limit: url.searchParams.get('limit') ?? undefined,
			}),
		)
	} catch (cause) {
		return toJsonError(cause)
	}
}
