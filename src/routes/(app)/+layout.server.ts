import { optionalViewer } from '$lib/server/auth/viewer'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, depends, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' })
	depends('app:notifications')
	if (!locals.user) return { unreadCount: 0 }
	if (!locals.services) return { unreadCount: null }
	try {
		return await locals.services.notifications.getUnreadCount(optionalViewer(locals.user))
	} catch (cause) {
		console.error('Notification count load failed', cause)
		return { unreadCount: null }
	}
}
