import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import { like, save } from '$lib/server/shared/http/post-actions'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const viewer = optionalViewer(requireUser(locals))
	const services = requireServices(locals)
	const profile = await services.users.getMe(viewer)
	const type = url.searchParams.get('type') === 'reel' ? 'reel' : 'post'
	// OAuth users have no username until onboarding, so they have no public posts yet.
	const posts = profile.username
		? await services.posts.listUserPosts(viewer, {
				username: profile.username,
				type,
				cursor: url.searchParams.get('cursor') ?? undefined,
			})
		: { items: [], nextCursor: null }
	return { profile, posts, type }
}

export const actions: Actions = { like, save }
