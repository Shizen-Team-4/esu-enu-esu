import { error, redirect } from '@sveltejs/kit'
import type { Services } from '../../container'
import { AppError } from '../domain/app-error'

export function requireUser(locals: App.Locals): NonNullable<App.Locals['user']> {
	if (!locals.user) redirect(303, '/login')
	return locals.user
}

export function requireServices(locals: App.Locals): Services {
	if (!locals.services) error(503, { message: 'Service unavailable' })
	return locals.services
}

/** For JSON API endpoints: a missing container becomes an INTERNAL envelope, not an HTML page. */
export function requireApiServices(locals: App.Locals): Services {
	if (!locals.services) throw new AppError('INTERNAL')
	return locals.services
}
