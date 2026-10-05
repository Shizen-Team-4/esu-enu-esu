import { optionalViewer } from '$lib/server/auth/viewer'
import { requireUser, requireServices } from '$lib/server/shared/http/guards'
import { toHttpError } from '$lib/server/shared/http/error-response'
import type { LayoutServerLoad } from './$types'
export const load: LayoutServerLoad = async ({ locals, depends, url, setHeaders }) => {
	depends('app:messages')
	const viewer = optionalViewer(requireUser(locals))
	try {
		return {
			inbox: await requireServices(locals).messages.listConversations(viewer, {
				cursor: url.searchParams.get('cursor') ?? undefined,
				limit: 50,
			}),
		}
	} catch (cause) {
		toHttpError(cause)
	}
}
