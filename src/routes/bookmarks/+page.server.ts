import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import { save } from '$lib/server/shared/http/post-actions'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const viewer = optionalViewer(requireUser(locals))
	const services = requireServices(locals)
	return {
		saved: await services.posts.listSavedPosts(viewer, {
			cursor: url.searchParams.get('cursor') ?? undefined,
		}),
	}
}

export const actions: Actions = { save }
