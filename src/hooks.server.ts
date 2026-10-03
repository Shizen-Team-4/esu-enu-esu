import type { Handle } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { parseAcceptLanguage } from '$lib/i18n/accept-language'
import { DEFAULT_LANG, SUPPORTED_LANGS, isSupported } from '$lib/i18n/config'
import { createContainer } from '$lib/server/container'

export const handle: Handle = async ({ event, resolve }) => {
	const acceptLanguage = event.request.headers.get('accept-language')

	const detectedLang = parseAcceptLanguage(acceptLanguage, SUPPORTED_LANGS)
	let lang = detectedLang ?? DEFAULT_LANG
	let theme: 'system' | 'light' | 'dark' = 'system'
	const savedLanguage = event.cookies.get('sns-language'),
		savedTheme = event.cookies.get('sns-theme')
	if (isSupported(savedLanguage)) lang = savedLanguage
	if (savedTheme === 'dark' || savedTheme === 'light') theme = savedTheme
	event.locals.user = null
	event.locals.session = null
	if (event.platform?.env.DB && event.platform.env.KV) {
		event.locals.services = createContainer(
			event.platform.env,
			event.platform.ctx,
			event.url.origin,
			lang,
			dev,
		)
		const session = await event.locals.services.auth.api.getSession({
			headers: event.request.headers,
		})
		event.locals.user = session?.user ?? null
		event.locals.session = session?.session ?? null
		if (session) {
			const preferences = await event.locals.services.preferences.getPreferences(
				session.user.id,
				lang,
			)
			lang = preferences.language
			theme = preferences.theme
		}
	}

	event.locals.lang = lang
	event.locals.theme = theme

	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html
				.replace('%lang%', lang)
				.replace('%theme%', theme)
				.replace('%theme-class%', theme === 'dark' ? 'dark' : ''),
	})
}
