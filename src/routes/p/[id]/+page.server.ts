import { optionalViewer } from '$lib/server/auth/viewer'
import { toActionFailure, toHttpError } from '$lib/server/shared/http/error-response'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	const services = requireServices(locals)
	const viewer = optionalViewer(locals.user)
	try {
		return {
			post: await services.posts.getPost(viewer, params.id),
			comments: await services.comments.listComments(viewer, { postId: params.id }),
		}
	} catch (cause) {
		return toHttpError(cause)
	}
}

export const actions: Actions = {
	comment: async ({ locals, params, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			await services.comments.createComment(optionalViewer(user), {
				postId: params.id,
				body: data.get('body'),
				parentId: data.get('parentId'),
			})
		} catch (cause) {
			return toActionFailure(cause)
		}
		return { commented: true }
	},
	deleteComment: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			await services.comments.deleteComment(optionalViewer(user), String(data.get('id') ?? ''))
		} catch (cause) {
			return toActionFailure(cause)
		}
		return { deleted: true }
	},
}
