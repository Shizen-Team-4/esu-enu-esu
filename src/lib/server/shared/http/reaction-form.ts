export interface ReactionInput {
	id: string
	active: boolean
}

/** Maps a like/save form (`id`, `active` = 'true' | 'false') to a use case input. */
export function reactionFormInput(form: FormData): ReactionInput {
	const id = form.get('id')
	return { id: typeof id === 'string' ? id : '', active: form.get('active') === 'true' }
}
