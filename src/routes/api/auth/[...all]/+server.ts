import { requireServices } from '$lib/server/shared/http/guards'
import type { RequestHandler } from './$types'

const handler: RequestHandler = ({ request, locals }) => {
	const services = requireServices(locals)
	return services.auth.handler(request)
}

export const GET = handler
export const POST = handler
