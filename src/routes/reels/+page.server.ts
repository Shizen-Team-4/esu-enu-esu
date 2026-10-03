import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices } from '$lib/server/shared/http/guards'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const services = requireServices(locals)
	return {
		reels: await services.posts.listFeed(optionalViewer(locals.user), {
			type: 'reel',
			cursor: url.searchParams.get('cursor') ?? undefined,
		}),
	}
}
