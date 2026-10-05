export interface UserSummary {
	id: string
	username: string
	displayName: string
	avatarUrl: string | null
}
export interface Profile extends UserSummary {
	bio: string
	counts: { posts: number; followers: number; following: number }
	viewer: { isMe: boolean; following: boolean; followsViewer?: boolean }
	createdAt: string
}
export interface Me extends Profile {
	email: string
	emailVerified: boolean
}
export interface FollowListItem extends UserSummary {
	viewer: { isMe: boolean; following: boolean }
}
