import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { toActionFailure, toHttpError } from '$lib/server/shared/http/error-response'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import { like, save } from '$lib/server/shared/http/post-actions'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const services = requireServices(locals)
	const viewer = optionalViewer(locals.user)
	try {
		const profile = await services.users.getProfile(viewer, params.username)
		const type = url.searchParams.get('type') === 'reel' ? 'reel' : 'post'
		const posts = await services.posts.listUserPosts(viewer, {
			username: params.username,
			type,
			cursor: url.searchParams.get('cursor') ?? undefined,
		})
		return { profile, posts, type }
	} catch (cause) {
		return toHttpError(cause)
	}
}

export const actions: Actions = {
	like,
	save,
	follow: async ({ locals, params, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const data = await request.formData()
		try {
			await services.users.followUser(
				optionalViewer(user),
				params.username,
				data.get('active') === 'true',
			)
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, `/u/${params.username}`)
	},
}
