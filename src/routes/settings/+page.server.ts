import { redirect } from '@sveltejs/kit'
import { toActionFailure } from '$lib/server/shared/http/error-response'
import { requireServices } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => ({
	preferences: locals.preferences ?? { theme: locals.theme, language: locals.lang },
})

export const actions: Actions = {
	default: async ({ locals, request, cookies, url }) => {
		const services = requireServices(locals)
		const form = await request.formData(),
			input = { theme: form.get('theme'), language: form.get('language') }
		try {
			const value = services.preferences.validateGuestPreferences(input)
			if (locals.user) await services.preferences.updatePreferences(locals.user.id, value)
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
			return toActionFailure(cause)
		}
		redirect(303, '/settings')
	},
}
