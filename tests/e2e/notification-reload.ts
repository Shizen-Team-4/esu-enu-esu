import { expect, type Route } from '@playwright/test'

/** Return the page loader's recoverable error shape after the real action succeeds. */
export async function failNotificationReload(route: Route) {
	const response = await route.fetch()
	const body: {
		nodes: ({ type: string; data?: [Record<string, number>, ...unknown[]] } | null)[]
	} = await response.json()
	const node = body.nodes.find(
		(node) => node?.type === 'data' && node.data?.[0].initial !== undefined,
	)
	expect(node?.data).toBeDefined()
	const data = node!.data!
	data[0].initial = data.push(null) - 1
	data[0].errorCode = data.push('INTERNAL') - 1
	await route.fulfill({ response, json: body })
}
