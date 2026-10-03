import { like, save } from '$lib/server/shared/http/post-actions'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	return {
		feed: locals.services
			? await locals.services.posts.listFeed(null)
			: { items: [], nextCursor: null },
	}
}

export const actions: Actions = { like, save }
