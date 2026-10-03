import { optionalViewer } from '$lib/server/auth/viewer'
import { profileFormInput } from '$lib/server/shared/http/profile-form'
import { toActionFailure } from '$lib/server/shared/http/error-response'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals)
	const me = await requireServices(locals).users.getMe(optionalViewer(user))
	return {
		profile: {
			username: me.username,
			displayName: me.displayName,
			bio: me.bio,
			avatarUrl: me.avatarUrl,
		},
	}
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
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
		return { saved: true }
	},
}
