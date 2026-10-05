import { SEARCH_QUERY_MAX } from '$lib/contract/limits'
import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { parseLimit, decodeCursor } from '../../shared/domain/cursor'
import type { UserRepository } from './ports'

export const searchUsers =
	(users: UserRepository) =>
	async (viewer: Viewer | null, input: { q: unknown; limit?: unknown; cursor?: string }) => {
		if (typeof input.q !== 'string')
			throw new AppError('VALIDATION_FAILED', { q: 'INVALID_FORMAT' })
		const q = input.q.trim().toLowerCase()
		if ([...q].length < 1 || [...q].length > SEARCH_QUERY_MAX)
			throw new AppError('VALIDATION_FAILED', { q: 'INVALID_FORMAT' })
		return users.search(
			q,
			viewer?.id ?? null,
			parseLimit(input.limit),
			input.cursor ? decodeCursor(input.cursor) : undefined,
		)
	}
