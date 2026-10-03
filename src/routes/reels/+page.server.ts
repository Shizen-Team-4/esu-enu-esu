import { error } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.services) error(503)
	return {
		reels: await locals.services.posts.listFeed(optionalViewer(locals.user), {
			type: 'reel',
			cursor: url.searchParams.get('cursor') ?? undefined,
		}),
	}
}
