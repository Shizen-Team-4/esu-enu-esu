import { error, redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login')
	if (!locals.services) error(503)
	const profile = await locals.services.users.getMe(optionalViewer(locals.user))
	const type = url.searchParams.get('type') === 'reel' ? 'reel' : 'post'
	const posts = await locals.services.posts.listFeed(optionalViewer(locals.user), {
		authorId: profile.id,
		...(type === 'reel' ? { type } : {}),
	})
	return { profile, posts, type }
}
