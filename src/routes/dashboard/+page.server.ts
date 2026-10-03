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
		preferences: locals.preferences ?? { theme: locals.theme, language: locals.lang },
		feed: await services.posts.listFeed(viewer),
		stories: await services.stories.listStoryTray(viewer),
	}
}

export const actions: Actions = {
	story: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const form = await request.formData()
		try {
			await services.stories.createStory(optionalViewer(user), { mediaId: form.get('mediaId') })
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/dashboard')
	},
	post: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			await services.posts.createPost(optionalViewer(user), {
				type: data.get('type') ?? 'post',
				caption: data.get('caption'),
				mediaIds: data.getAll('mediaId'),
			})
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/dashboard')
	},
	like: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			await services.posts.reactToPost(
				optionalViewer(user),
				String(data.get('id')),
				'like',
				data.get('active') === 'true',
			)
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/dashboard')
	},
	preferences: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const form = await request.formData()
		try {
			await services.preferences.updatePreferences(user.id, {
				theme: form.get('theme'),
				language: form.get('language'),
			})
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/dashboard')
	},
}
