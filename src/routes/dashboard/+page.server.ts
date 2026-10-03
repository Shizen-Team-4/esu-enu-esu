import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { toActionFailure } from '$lib/server/shared/http/error-response'
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

export const actions: Actions = {
	like: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			const active = data.get('active') === 'true'
			const react = active ? services.posts.likePost : services.posts.unlikePost
			await react(optionalViewer(user), String(data.get('id')))
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/dashboard')
	},
}
