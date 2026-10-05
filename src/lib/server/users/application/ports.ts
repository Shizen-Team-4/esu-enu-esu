import type { Profile, Me, FollowListItem } from '../domain/user'
import type { Cursor } from '../../shared/domain/cursor'
import type { Page } from '$lib/contract'

export type { Profile, Me, FollowListItem } from '../domain/user'

export interface PageRequest {
	cursor?: Cursor
	limit: number
}

/** A validated profile change in the shape the repository stores. */
export interface UserUpdate {
	username?: string
	displayName?: string
	bio?: string
	/** `null` removes the avatar. */
	avatar?: { mediaId: string; url: string } | null
}

export interface UserRepository {
	find(input: { id?: string; username?: string }, viewerId: string | null): Promise<Me | null>
	search(
		q: string,
		viewerId: string | null,
		limit: number,
		cursor?: Cursor,
	): Promise<{
		items: (FollowListItem & { viewer: Profile['viewer'] })[]
		nextCursor: string | null
	}>
	/** `created` is true only for a newly inserted follow, never an unfollow or retry. */
	follow(
		viewerId: string,
		userId: string,
		active: boolean,
		now: Date,
	): Promise<{ followers: number; created: boolean }>
	/** Throws `AppError('CONFLICT', { username: 'TAKEN' })` when the username is taken meanwhile. */
	update(id: string, patch: UserUpdate): Promise<void>
	isUsernameTaken(username: string, exceptUserId: string): Promise<boolean>
	/** Newest follow first. */
	listFollowers(
		userId: string,
		viewerId: string | null,
		page: PageRequest,
	): Promise<Page<FollowListItem>>
	listFollowing(
		userId: string,
		viewerId: string | null,
		page: PageRequest,
	): Promise<Page<FollowListItem>>
}

export interface AvatarMedia {
	/** The public URL of an upload the owner may use as an avatar, or null when it is not usable. */
	findUsable(mediaId: string, ownerId: string): Promise<{ url: string } | null>
}
