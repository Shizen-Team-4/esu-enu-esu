import { json } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { requireApiServices } from '$lib/server/shared/http/guards'
import { toJsonError } from '$lib/server/shared/http/error-response'
import type { RequestHandler } from './$types'
export const GET: RequestHandler = async ({ locals, params, url, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' })
	try {
		return json(
			await requireApiServices(locals).stories.getStoryAudience(
				optionalViewer(locals.user),
				params.id,
				{ cursor: url.searchParams.get('cursor') ?? undefined },
			),
		)
	} catch (cause) {
		return toJsonError(cause)
	}
}
