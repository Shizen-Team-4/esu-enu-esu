import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { toActionFailure } from '$lib/server/shared/http/error-response'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => {
	if (requireUser(locals).username) redirect(303, '/')
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const form = await request.formData()
		const username = form.get('username')
		try {
			await services.users.updateMe(optionalViewer(user), {
				username: typeof username === 'string' ? username : '',
			})
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/')
	},
}
