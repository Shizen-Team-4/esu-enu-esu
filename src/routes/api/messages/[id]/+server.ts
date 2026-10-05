import { json } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { requireApiServices } from '$lib/server/shared/http/guards'
import { toJsonError } from '$lib/server/shared/http/error-response'
import { AppError } from '$lib/server/shared/domain/app-error'
import type { RequestHandler } from './$types'
export const GET: RequestHandler = async ({ locals, params, url, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' })
	try {
		return json(
			await requireApiServices(locals).messages.getConversation(
				optionalViewer(locals.user),
				params.id,
				url.searchParams.get('before') ?? undefined,
			),
		)
	} catch (cause) {
		return toJsonError(cause)
	}
}
export const POST: RequestHandler = async ({ locals, request, url, params, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' })
	try {
		if (request.headers.get('origin') !== url.origin) throw new AppError('FORBIDDEN')
		const input = (await request.json().catch(() => {
			throw new AppError('VALIDATION_FAILED')
		})) as { sequence?: unknown } | null
		return json(
			await requireApiServices(locals).messages.readConversation(
				optionalViewer(locals.user),
				params.id,
				input?.sequence,
			),
		)
	} catch (cause) {
		return toJsonError(cause)
	}
}
