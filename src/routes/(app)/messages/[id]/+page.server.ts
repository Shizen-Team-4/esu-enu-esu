import { optionalViewer } from '$lib/server/auth/viewer'
import { requireUser, requireServices } from '$lib/server/shared/http/guards'
import { toActionFailure, toHttpError } from '$lib/server/shared/http/error-response'
import type { Actions, PageServerLoad } from './$types'
export const load: PageServerLoad = async ({ locals, params, depends }) => {
	depends('app:conversation')
	const viewer = optionalViewer(requireUser(locals))
	try {
		return {
			thread: await requireServices(locals).messages.getConversation(viewer, params.id),
			draftId: 'msg_' + crypto.randomUUID().replaceAll('-', ''),
		}
	} catch (cause) {
		toHttpError(cause)
	}
}
export const actions: Actions = {
	send: async ({ locals, request, params }) => {
		const viewer = optionalViewer(requireUser(locals))
		const form = await request.formData()
		try {
			return {
				sent: await requireServices(locals).messages.sendMessage(viewer, {
					threadId: params.id,
					id: form.get('id'),
					body: form.get('body'),
				}),
			}
		} catch (cause) {
			return toActionFailure(cause)
		}
	},
}
