import { optionalViewer } from '$lib/server/auth/viewer'
import { toHttpError } from '$lib/server/shared/http/error-response'
import { requireServices } from '$lib/server/shared/http/guards'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = url.searchParams.get('q') ?? ''
	if (!q) return { q, results: { items: [], nextCursor: null }, invalid: false }
	const services = requireServices(locals)
	try {
		return {
			q,
			results: await services.users.searchUsers(optionalViewer(locals.user), {
				q,
				cursor: url.searchParams.get('cursor') ?? undefined,
			}),
			invalid: false,
		}
	} catch (cause) {
		if (cause instanceof AppError && cause.code !== 'INTERNAL')
			return { q, results: { items: [], nextCursor: null }, invalid: true }
		return toHttpError(cause)
	}
}
