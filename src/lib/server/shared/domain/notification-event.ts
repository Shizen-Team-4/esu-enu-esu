type Activity = {
	actorId: string
	createdAt: Date
}

export type NotificationEvent = Activity &
	(
		| { type: 'post'; postId: string }
		| { type: 'like'; postId: string; recipientId: string }
		| { type: 'follow'; recipientId: string }
		| {
				type: 'comment'
				postId: string
				commentId: string
				postAuthorId: string
				replyAuthorId: string | null
		  }
	)
