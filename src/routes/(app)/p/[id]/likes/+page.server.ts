import { optionalViewer } from '$lib/server/auth/viewer'
import { pageQuery } from '$lib/server/shared/domain/page-query'
import { toHttpError } from '$lib/server/shared/http/error-response'
import { requireServices } from '$lib/server/shared/http/guards'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const services = requireServices(locals)
	try {
		const post = await services.posts.getPost(optionalViewer(locals.user), params.id)
		const query = pageQuery({ cursor: url.searchParams.get('cursor') ?? undefined })
		return { post, likers: await services.posts.listLikers(post.id, query.cursor, query.limit) }
	} catch (cause) {
		return toHttpError(cause)
	}
}
