import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { PageServerLoad } from './$types'

// OAuth users have no username until onboarding.
export const load: PageServerLoad = async ({ locals }) => {
	const viewer = optionalViewer(requireUser(locals))
	const profile = await requireServices(locals).users.getMe(viewer)
	redirect(303, profile.username ? `/u/${profile.username}` : '/onboard')
}
