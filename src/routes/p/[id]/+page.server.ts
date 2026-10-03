import { optionalViewer } from '$lib/server/auth/viewer'
import { toHttpError } from '$lib/server/shared/http/error-response'
import { requireServices } from '$lib/server/shared/http/guards'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	const services = requireServices(locals)
	try {
		return { post: await services.posts.getPost(optionalViewer(locals.user), params.id) }
	} catch (cause) {
		return toHttpError(cause)
	}
}
