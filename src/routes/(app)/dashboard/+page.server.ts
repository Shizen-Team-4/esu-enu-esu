import { optionalViewer } from '$lib/server/auth/viewer'
import { like, save } from '$lib/server/shared/http/post-actions'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals)
	const services = requireServices(locals)
	const viewer = optionalViewer(user)
	return {
		user,
		feed: await services.posts.listFeed(viewer),
		stories: await services.stories.listStoryTray(viewer),
	}
}

export const actions: Actions = { like, save }
