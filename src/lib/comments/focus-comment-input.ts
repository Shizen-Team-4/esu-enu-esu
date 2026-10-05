interface CommentDocument {
	getElementById: (id: string) => Pick<HTMLElement, 'focus'> | null
}

export function focusCommentInput(document: CommentDocument): void {
	document.getElementById('comment-body')?.focus({ preventScroll: true })
}
