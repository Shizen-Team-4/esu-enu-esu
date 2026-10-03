import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { profileFormInput } from '$lib/server/shared/http/profile-form'
import { toActionFailure } from '$lib/server/shared/http/error-response'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user
		? await locals.services?.users.getMe(optionalViewer(locals.user)).catch(() => null)
		: null
	return {
		preferences: locals.preferences ?? { theme: locals.theme, language: locals.lang },
		profile: me ? { username: me.username, displayName: me.displayName, bio: me.bio } : null,
	}
}

export const actions: Actions = {
	profile: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		try {
			await services.users.updateMe(
				optionalViewer(user),
				profileFormInput(await request.formData()),
			)
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/settings')
	},
	preferences: async ({ locals, request, cookies, url }) => {
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
