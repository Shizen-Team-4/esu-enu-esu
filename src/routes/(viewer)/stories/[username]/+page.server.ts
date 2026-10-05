import { redirect } from '@sveltejs/kit'
import { optionalViewer } from '$lib/server/auth/viewer'
import { toActionFailure, toHttpError } from '$lib/server/shared/http/error-response'
import { requireServices, requireUser } from '$lib/server/shared/http/guards'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const user = requireUser(locals)
	const services = requireServices(locals)
	try {
		return {
			...(await services.stories.listUserStories(optionalViewer(user), params.username)),
			viewerId: user.id,
			latest: url.searchParams.has('latest'),
		}
	} catch (cause) {
		return toHttpError(cause)
	}
}

export const actions: Actions = {
	reply: async ({ locals, request }) => {
		const user = requireUser(locals)
		const input = await request.formData()
		let threadId: string
		try {
			;({ threadId } = await requireServices(locals).stories.replyToStory(optionalViewer(user), {
				storyId: input.get('storyId'),
				id: input.get('id'),
				body: input.get('body'),
			}))
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, `/messages/${threadId}`)
	},
	love: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const input = await request.formData()
		try {
			await services.stories.likeStory(
				optionalViewer(user),
				String(input.get('id')),
				input.get('active') === 'true',
			)
		} catch (cause) {
			return toActionFailure(cause)
		}
		return { error: null }
	},
	seen: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const input = await request.formData()
		try {
			await services.stories.markStorySeen(optionalViewer(user), String(input.get('id')))
		} catch (cause) {
			return toActionFailure(cause)
		}
		return { error: null }
	},
	delete: async ({ locals, request }) => {
		const user = requireUser(locals)
		const services = requireServices(locals)
		const input = await request.formData()
		try {
			await services.stories.deleteStory(optionalViewer(user), String(input.get('id')))
		} catch (cause) {
			return toActionFailure(cause)
		}
		redirect(303, '/')
	},
}
