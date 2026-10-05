import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import { toActionFailure } from '$lib/server/shared/http/error-response'
import { loadOrErrorCode } from '$lib/server/shared/http/load-or-error-code'
import { notificationTarget } from '$lib/notifications/notification-target'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	depends('app:notifications')
	const viewer = optionalViewer(requireUser(locals))
	const cursor = url.searchParams.get('cursor')
	const outcome = await loadOrErrorCode(() =>
		requireServices(locals).notifications.listNotifications(viewer, {
			cursor: cursor ?? undefined,
		}),
	)
	return { cursor, initial: outcome.data, errorCode: outcome.errorCode }
}

export const actions: Actions = {
	read: async ({ locals, request }) => {
		const viewer = optionalViewer(requireUser(locals))
		const data = await request.formData()
		let target: string | null
		try {
			const notification = await requireServices(locals).notifications.markNotificationRead(
				viewer,
				data.get('id'),
			)
			target = notificationTarget(notification)
		} catch (cause) {
			return toActionFailure(cause)
		}
		if (target) redirect(303, target)
		return { read: true }
	},
	readAll: async ({ locals }) => {
		const viewer = optionalViewer(requireUser(locals))
		try {
			await requireServices(locals).notifications.markAllNotificationsRead(viewer)
			return { read: true }
		} catch (cause) {
			return toActionFailure(cause)
		}
	},
}
