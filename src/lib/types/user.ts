export interface UserSummary {
	id: string
	username: string
	displayName: string
	/** null: the UI shows the default avatar */
	avatarUrl: string | null
}
