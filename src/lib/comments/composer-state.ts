import { COMMENT_BODY_MAX, type Comment } from '$lib/contract'
import { charCount } from '$lib/format/char-count'

export function canSubmitComment(body: string, pending: boolean): boolean {
	const count = charCount(body.trim())
	return !pending && count > 0 && count <= COMMENT_BODY_MAX
}

export interface ComposerTarget {
	target: Comment | null
	fallbackParentId: string
	pending: boolean
}

export function selectReplyTarget(state: ComposerTarget, comment: Comment): ComposerTarget {
	if (state.pending) return state
	return { ...state, target: comment, fallbackParentId: '' }
}

export function cancelReplyTarget(state: ComposerTarget): ComposerTarget {
	if (state.pending) return state
	return { ...state, target: null, fallbackParentId: '' }
}

export function submittedParentId(
	state: Pick<ComposerTarget, 'target' | 'fallbackParentId'>,
): string {
	return state.target?.id ?? state.fallbackParentId
}
