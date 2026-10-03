export interface UserSummary {
	id: string
	username: string
	displayName: string
	avatarUrl: string | null
}
export interface Profile extends UserSummary {
	bio: string
	counts: { posts: number; followers: number; following: number }
	viewer: { isMe: boolean; following: boolean }
	createdAt: string
}
export interface Me extends Profile {
	email: string
	emailVerified: boolean
}
