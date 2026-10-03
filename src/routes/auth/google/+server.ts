import { error } from '@sveltejs/kit'
import { requireServices } from '$lib/server/shared/http/guards'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const services = requireServices(locals)
	const response = await services.auth.api.signInSocial({
		headers: request.headers,
		body: { provider: 'google', callbackURL: `${url.origin}/dashboard` },
		asResponse: true,
	})
	if (!response.ok) return response
	const result = (await response.json()) as { url?: string }
	if (!result.url) error(500, 'Sign-in unavailable')
	const headers = new Headers(response.headers)
	headers.set('location', result.url)
	headers.delete('content-type')
	return new Response(null, { status: 303, headers })
}
