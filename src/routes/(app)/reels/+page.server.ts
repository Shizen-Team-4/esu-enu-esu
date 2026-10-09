import { optionalViewer } from '$lib/server/auth/viewer'
import { error } from '@sveltejs/kit'
import { requireServices } from '$lib/server/shared/http/guards'
import { toHttpError } from '$lib/server/shared/http/error-response'
import { like, save } from '$lib/server/shared/http/post-actions'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const services = requireServices(locals)
	const viewer = optionalViewer(locals.user)
	const postId = url.searchParams.get('post')
	const [reels, selected] = await Promise.all([
		services.posts.listReels(viewer, {
			cursor: url.searchParams.get('cursor') ?? undefined,
		}),
		postId ? services.posts.getPost(viewer, postId) : Promise.resolve(null),
	]).catch(toHttpError)
	if (selected && selected.type !== 'reel') error(404)
	return {
		reels: selected
			? { ...reels, items: [selected, ...reels.items.filter((post) => post.id !== selected.id)] }
			: reels,
	}
}

export const actions: Actions = { like, save }
