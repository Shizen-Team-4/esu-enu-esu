import { decodeCursor, parseLimit } from '../../shared/domain/cursor'

export function pageQuery(input: { cursor?: string; limit?: unknown }) {
	return {
		cursor: input.cursor ? decodeCursor(input.cursor) : undefined,
		limit: parseLimit(input.limit),
	}
}
