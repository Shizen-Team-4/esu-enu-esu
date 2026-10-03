import { error, fail, redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/login')
	if (!locals.services) error(503)
	try {
		return {
			...(await locals.services.stories.listUserStories(
				optionalViewer(locals.user),
				params.username,
			)),
			viewerId: locals.user.id,
		}
	} catch (cause) {
		if (cause instanceof AppError && cause.code === 'NOT_FOUND') error(404)
		error(500)
	}
}
export const actions: Actions = {
	love: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login')
		if (!locals.services) error(503)
		const input = await request.formData()
		try {
			await locals.services.stories.likeStory(
				optionalViewer(locals.user),
				String(input.get('id')),
				input.get('active') === 'true',
			)
		} catch (cause) {
			if (cause instanceof AppError) return fail(400, { code: cause.code })
			error(500)
		}
		return { code: null }
	},
	seen: async ({ locals, request }) => {
		if (!locals.services) error(503)
		const input = await request.formData()
		try {
			await locals.services.stories.markStorySeen(
				optionalViewer(locals.user),
				String(input.get('id')),
			)
		} catch (cause) {
			if (cause instanceof AppError) return fail(400, { code: cause.code })
			error(500)
		}
		return { code: null }
	},
	delete: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login')
		if (!locals.services) error(503)
		const input = await request.formData()
		try {
			await locals.services.stories.deleteStory(
				optionalViewer(locals.user),
				String(input.get('id')),
			)
		} catch (cause) {
			if (cause instanceof AppError) return fail(400, { code: cause.code })
			error(500)
		}
		redirect(303, '/dashboard')
	},
}
