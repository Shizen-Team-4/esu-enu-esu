import { dev } from '$app/environment'
import { error, json } from '@sveltejs/kit'
import { requireServices } from '$lib/server/shared/http/guards'
import type { RequestHandler } from './$types'

// GET /api/debug — checks the KV and D1 bindings. Dev only.
export const GET: RequestHandler = async ({ locals }) => {
	if (!dev) error(404)
	const report = await requireServices(locals).health.check()
	return json(report, { status: report.ok ? 200 : 500 })
}
