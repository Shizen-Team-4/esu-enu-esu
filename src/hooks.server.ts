import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { parseAcceptLanguage } from '$lib/i18n/accept-language'
import { DEFAULT_LANG, SUPPORTED_LANGS, isSupported, type Lang } from '$lib/i18n/config'
import type { Preferences } from '$lib/server/preferences/domain/preferences'
import { createContainer } from '$lib/server/container'
import { isProtectedPath } from '$lib/server/shared/http/protected-routes'

type Theme = App.Locals['theme']

function detectAppearance(event: RequestEvent): { lang: Lang; theme: Theme } {
	const detected = parseAcceptLanguage(
		event.request.headers.get('accept-language'),
		SUPPORTED_LANGS,
	)
	const savedLanguage = event.cookies.get('sns-language')
	const savedTheme = event.cookies.get('sns-theme')
	return {
		lang: isSupported(savedLanguage) ? savedLanguage : (detected ?? DEFAULT_LANG),
		theme: savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'system',
	}
}

async function resolveSession(event: RequestEvent, lang: Lang): Promise<Preferences | null> {
	if (!event.platform?.env.DB || !event.platform.env.KV) return null
	const services = createContainer(
		event.platform.env,
		event.platform.ctx,
		event.url.origin,
		lang,
		dev,
	)
	event.locals.services = services
	const session = await services.auth.api.getSession({ headers: event.request.headers })
	event.locals.user = session?.user ?? null
	event.locals.session = session?.session ?? null
	if (!session) return null
	return services.preferences.getPreferences(session.user.id, lang)
}

export const handle: Handle = async ({ event, resolve }) => {
	const appearance = detectAppearance(event)
	event.locals.user = null
	event.locals.session = null
	const preferences = await resolveSession(event, appearance.lang)
	event.locals.preferences = preferences

	if (isProtectedPath(event.url.pathname) && !event.locals.user) redirect(303, '/login')

	const lang = preferences?.language ?? appearance.lang
	const theme = preferences?.theme ?? appearance.theme
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
