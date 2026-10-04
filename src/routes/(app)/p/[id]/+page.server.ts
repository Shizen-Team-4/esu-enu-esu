import { fail, redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { like, save } from '$lib/server/shared/http/post-actions'
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
	like,
	save,
	edit: async ({ locals, params, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			const post = await services.posts.updatePost(
				optionalViewer(user),
				params.id,
				data.get('caption'),
			)
			return { post }
		} catch (cause) {
			return toActionFailure(cause)
		}
	},
	delete: async ({ locals, params }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		try {
			await services.posts.deletePost(optionalViewer(user), params.id)
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/profile')
	},
	comment: async ({ locals, params, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			const comment = await services.comments.createComment(optionalViewer(user), {
				postId: params.id,
				body: data.get('body'),
				parentId: data.get('parentId'),
			})
			return { commented: true, comment }
		} catch (cause) {
			const failure = toActionFailure(cause)
			return fail(failure.status, {
				...failure.data,
				body: String(data.get('body') ?? ''),
				parentId: String(data.get('parentId') ?? ''),
			})
		}
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
