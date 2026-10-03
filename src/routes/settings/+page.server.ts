import { error, fail, redirect } from '@sveltejs/kit'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, parent }) => {
	const data = await parent()
	return {
		preferences:
			locals.user && locals.services
				? await locals.services.preferences.getPreferences(locals.user.id, locals.lang)
				: { theme: data.theme, language: locals.lang },
	}
}
export const actions: Actions = {
	default: async ({ locals, request, cookies, url }) => {
		if (!locals.services) error(503)
		const form = await request.formData(),
			input = { theme: form.get('theme'), language: form.get('language') }
		try {
			const value = locals.services.preferences.validateGuestPreferences(input)
			if (locals.user) await locals.services.preferences.updatePreferences(locals.user.id, value)
			const options = {
				path: '/',
				httpOnly: true,
				sameSite: 'lax' as const,
				secure: url.protocol === 'https:',
				maxAge: 31536000,
			}
			if (value.theme) cookies.set('sns-theme', value.theme, options)
			if (value.language) cookies.set('sns-language', value.language, options)
		} catch (cause) {
			if (cause instanceof AppError) return fail(400, { code: cause.code })
			error(500)
		}
		redirect(303, '/settings')
	},
}
