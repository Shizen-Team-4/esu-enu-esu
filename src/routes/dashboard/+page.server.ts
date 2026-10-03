import { error, fail, redirect } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import { optionalViewer } from '$lib/server/auth/viewer'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login')
	}
	if (!locals.services) error(503, 'Service unavailable')
	return {
		user: locals.user,
		preferences: await locals.services.preferences.getPreferences(locals.user.id, locals.lang),
		feed: await locals.services.posts.listFeed(optionalViewer(locals.user)),
		stories: await locals.services.stories.listStoryTray(optionalViewer(locals.user)),
	}
}

export const actions: Actions = {
	story: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login')
		if (!locals.services) error(503)
		const form = await request.formData()
		try {
			await locals.services.stories.createStory(optionalViewer(locals.user), {
				mediaId: form.get('mediaId'),
			})
		} catch (cause) {
			if (cause instanceof AppError) return fail(400, { code: cause.code })
			error(500)
		}
		redirect(303, '/dashboard')
	},
	post: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login')
		if (!locals.services) error(503, 'Service unavailable')
		const data = await request.formData()
		try {
			await locals.services.posts.createPost(optionalViewer(locals.user), {
				type: data.get('type') ?? 'post',
				caption: data.get('caption'),
				mediaIds: data.getAll('mediaId'),
			})
		} catch (cause) {
			if (cause instanceof AppError) return fail(422, { code: cause.code })
			error(500, 'Unable to create post')
		}
		redirect(303, '/dashboard')
	},
	like: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login')
		if (!locals.services) error(503, 'Service unavailable')
		const data = await request.formData()
		try {
			await locals.services.posts.reactToPost(
				optionalViewer(locals.user),
				String(data.get('id')),
				'like',
				data.get('active') === 'true',
			)
		} catch (cause) {
			if (cause instanceof AppError) return fail(422, { code: cause.code })
			error(500, 'Unable to like post')
		}
		redirect(303, '/dashboard')
	},
	preferences: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login')
		if (!locals.services) error(503, 'Service unavailable')
		const form = await request.formData()
		try {
			await locals.services.preferences.updatePreferences(locals.user.id, {
				theme: form.get('theme'),
				language: form.get('language'),
			})
		} catch (cause) {
			if (cause instanceof AppError) return fail(422, { code: cause.code })
			error(500, 'Unable to save preferences')
		}
		redirect(303, '/dashboard')
	},
}
