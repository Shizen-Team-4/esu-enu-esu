import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices } from '$lib/server/shared/http/guards'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const services = requireServices(locals)
	return {
		reels: await services.posts.listReels(optionalViewer(locals.user), {
			cursor: url.searchParams.get('cursor') ?? undefined,
		}),
	}
}
