import type { Viewer } from '../shared/domain/viewer'

export function optionalViewer(user: { id: string } | null): Viewer | null {
	return user ? { id: user.id, role: 'user' } : null
}
