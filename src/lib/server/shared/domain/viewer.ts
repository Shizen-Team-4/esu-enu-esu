import { AppError } from './app-error'

export interface Viewer {
	id: string
	role: 'user' | 'moderator' | 'admin'
}

export function requireViewer(viewer: Viewer | null): Viewer {
	if (!viewer) throw new AppError('UNAUTHENTICATED')
	return viewer
}
