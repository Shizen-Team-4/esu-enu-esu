import type { Page, Post } from '$lib/contract'
import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import type { Profile } from './ports'

export interface ProfileContentSources {
	getProfile(viewer: Viewer | null, username: string): Promise<Profile>
	listUserPosts(
		viewer: Viewer | null,
		input: { username: string; type: 'post' | 'reel'; cursor?: string },
	): Promise<Page<Post>>
	listSavedPosts(viewer: Viewer | null, input: { cursor?: string }): Promise<Page<Post>>
}

export const getProfileContent =
	(sources: ProfileContentSources) =>
	async (viewer: Viewer | null, input: { username: string; type?: string; cursor?: string }) => {
		const profile = await sources.getProfile(viewer, input.username)
		const type = input.type === 'bookmarks' || input.type === 'reel' ? input.type : 'post'
		if (type === 'bookmarks' && !profile.viewer.isMe) throw new AppError('NOT_FOUND')
		const posts =
			type === 'bookmarks'
				? await sources.listSavedPosts(viewer, { cursor: input.cursor })
				: await sources.listUserPosts(viewer, {
						username: input.username,
						type,
						cursor: input.cursor,
					})
		return { profile, posts, type }
	}
