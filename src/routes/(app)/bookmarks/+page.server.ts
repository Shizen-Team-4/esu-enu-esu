import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const viewer = optionalViewer(requireUser(locals))
	const services = requireServices(locals)
	const profile = await services.users.getMe(viewer)
	if (!profile.username) redirect(303, '/onboard')
	const query = new URLSearchParams({ type: 'bookmarks' })
	const cursor = url.searchParams.get('cursor')
	if (cursor) query.set('cursor', cursor)
	redirect(303, `/u/${profile.username}?${query}`)
}
