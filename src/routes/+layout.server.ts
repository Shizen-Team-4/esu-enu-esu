import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		lang: locals.lang || 'en',
		theme:
			locals.user && locals.services
				? (await locals.services.preferences.getPreferences(locals.user.id, locals.lang)).theme
				: locals.theme,
	}
}
