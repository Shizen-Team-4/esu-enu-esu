import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import { loadOrErrorCode } from '$lib/server/shared/http/load-or-error-code'
import { like, save } from '$lib/server/shared/http/post-actions'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals)
	const services = requireServices(locals)
	const viewer = optionalViewer(user)
	const scope: 'all' | 'following' =
		url.searchParams.get('scope') === 'following' ? 'following' : 'all'
	const [stories, feed] = await Promise.all([
		services.stories.listStoryTray(viewer),
		loadOrErrorCode(() => services.posts.listFeed(viewer, { scope })),
	])
	return { scope, stories, feed: feed.data, feedError: feed.errorCode }
}

export const actions: Actions = { like, save }
