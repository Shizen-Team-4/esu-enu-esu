import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { toActionFailure } from '$lib/server/shared/http/error-response'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => ({ user: requireUser(locals) })

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
		redirect(303, `/stories/${encodeURIComponent(user.username || user.id)}?latest=1`)
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
		redirect(303, '/')
	},
}
