import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const handler: RequestHandler = ({ request, locals }) => {
	if (!locals.services) error(503, 'Service unavailable')
	return locals.services.auth.handler(request)
}

export const GET = handler
export const POST = handler
