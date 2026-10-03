import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	return {
		feed: locals.services
			? await locals.services.posts.listFeed(null)
			: { items: [], nextCursor: null },
	}
}
