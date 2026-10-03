import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const viewer = optionalViewer(requireUser(locals))
	const services = requireServices(locals)
	const profile = await services.users.getMe(viewer)
	const type = url.searchParams.get('type') === 'reel' ? 'reel' : 'post'
	const posts = await services.posts.listFeed(viewer, {
		authorId: profile.id,
		...(type === 'reel' ? { type } : {}),
	})
	return { profile, posts, type }
}
