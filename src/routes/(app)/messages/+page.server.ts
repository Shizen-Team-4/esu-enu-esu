import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { requireUser, requireServices } from '$lib/server/shared/http/guards'
import { toActionFailure, toHttpError } from '$lib/server/shared/http/error-response'
import type { Actions, PageServerLoad } from './$types'
export const load: PageServerLoad = async ({ locals, url }) => {
	const viewer = optionalViewer(requireUser(locals))
	const q = (url.searchParams.get('q') ?? url.searchParams.get('to') ?? '').trim()
	try {
		return {
			q,
			results: q ? await requireServices(locals).users.searchUsers(viewer, { q, limit: 20 }) : null,
		}
	} catch (cause) {
		toHttpError(cause)
	}
}
export const actions: Actions = {
	start: async ({ locals, request }) => {
		const viewer = optionalViewer(requireUser(locals))
		const form = await request.formData()
		let id: string
		try {
			;({ id } = await requireServices(locals).messages.startConversation(
				viewer,
				form.get('recipientId'),
			))
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/messages/' + id)
	},
}
