import { error } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.services) error(503, 'Service unavailable')
	try {
		return { post: await locals.services.posts.getPost(optionalViewer(locals.user), params.id) }
	} catch (cause) {
		if (cause instanceof AppError && cause.code === 'NOT_FOUND') error(404)
		error(500)
	}
}
