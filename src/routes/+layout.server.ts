import type { LayoutServerLoad } from './$types'
import type { UserSummary } from '$lib/contract'
import { optionalViewer } from '$lib/server/auth/viewer'

async function loadViewer(locals: App.Locals): Promise<UserSummary | null> {
	if (!locals.user || !locals.services) return null
	try {
		const { id, username, displayName, avatarUrl } = await locals.services.users.getMe(
			optionalViewer(locals.user),
		)
		return { id, username, displayName, avatarUrl }
	} catch {
		return null
	}
}

export const load: LayoutServerLoad = async ({ locals }) => {
	return { lang: locals.lang || 'en', theme: locals.theme, me: await loadViewer(locals) }
}
