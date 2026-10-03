import type { Profile, Me, UserSummary } from '../domain/user'
import type { Cursor } from '../../shared/domain/cursor'

export type { Profile, Me } from '../domain/user'
export interface UserRepository {
	find(input: { id?: string; username?: string }, viewerId: string | null): Promise<Me | null>
	search(
		q: string,
		viewerId: string | null,
		limit: number,
		cursor?: Cursor,
	): Promise<{ items: (UserSummary & { viewer: Profile['viewer'] })[]; nextCursor: string | null }>
	follow(viewerId: string, userId: string, active: boolean, now: Date): Promise<number>
}
