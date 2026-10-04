import { COMMENT_BODY_MAX } from '$lib/contract'
import { charCount } from '$lib/format/char-count'

export function canSubmitComment(body: string, pending: boolean): boolean {
	const count = charCount(body.trim())
	return !pending && count > 0 && count <= COMMENT_BODY_MAX
}
