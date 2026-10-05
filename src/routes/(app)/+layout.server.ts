import { optionalViewer } from '$lib/server/auth/viewer'
import type { LayoutServerLoad } from './$types'
export const load: LayoutServerLoad = async ({ locals, depends, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' })
	depends('app:notifications', 'app:messages')
	if (!locals.user) return { unreadCount: 0, messageCount: 0 }
	if (!locals.services) return { unreadCount: null, messageCount: null }
	const viewer = optionalViewer(locals.user)
	const [notifications, messages] = await Promise.allSettled([
		locals.services.notifications.getUnreadCount(viewer),
		locals.services.messages.getMessageCount(viewer),
	])
	return {
		unreadCount: notifications.status === 'fulfilled' ? notifications.value.unreadCount : null,
		messageCount: messages.status === 'fulfilled' ? messages.value.unreadCount : null,
	}
}
