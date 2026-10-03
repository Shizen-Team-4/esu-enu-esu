import { error, fail, redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.services) error(503)
	try {
		const profile = await locals.services.users.getProfile(
			optionalViewer(locals.user),
			params.username,
		)
		const type = url.searchParams.get('type') === 'reel' ? 'reel' : 'post'
		const posts = await locals.services.posts.listFeed(optionalViewer(locals.user), {
			authorId: profile.id,
			...(type === 'reel' ? { type } : {}),
		})
		return { profile, posts, type }
	} catch (cause) {
		if (cause instanceof AppError && cause.code === 'NOT_FOUND') error(404)
		error(500)
	}
}
export const actions: Actions = {
	follow: async ({ locals, params, request }) => {
		if (!locals.user) redirect(303, '/login')
		if (!locals.services) error(503)
		const data = await request.formData()
		try {
			await locals.services.users.followUser(
				optionalViewer(locals.user),
				params.username,
				data.get('active') === 'true',
			)
		} catch (cause) {
			if (cause instanceof AppError) return fail(422, { code: cause.code })
			error(500)
		}
		redirect(303, `/u/${params.username}`)
	},
}
