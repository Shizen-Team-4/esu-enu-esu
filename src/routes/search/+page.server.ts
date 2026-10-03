import { error } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = url.searchParams.get('q') ?? ''
	if (!q) return { q, results: { items: [], nextCursor: null }, invalid: false }
	if (!locals.services) error(503)
	try {
		return {
			q,
			results: await locals.services.users.searchUsers(optionalViewer(locals.user), {
				q,
				cursor: url.searchParams.get('cursor') ?? undefined,
			}),
			invalid: false,
		}
	} catch (cause) {
		if (cause instanceof AppError)
			return { q, results: { items: [], nextCursor: null }, invalid: true }
		error(500)
	}
}
