import { optionalViewer } from '$lib/server/auth/viewer'
import { toHttpError } from '$lib/server/shared/http/error-response'
import { follow } from '$lib/server/shared/http/follow-action'
import { requireServices } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
	try {
		const { users } = requireServices(locals)
		const initial = await users.listFollowers(optionalViewer(locals.user), {
			username: params.username,
			cursor: url.searchParams.get('cursor') ?? undefined,
		})
		return { username: params.username, initial }
	} catch (cause) {
		return toHttpError(cause)
	}
}

export const actions: Actions = { follow }
