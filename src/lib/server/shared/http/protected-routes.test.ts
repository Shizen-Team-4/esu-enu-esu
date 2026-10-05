import { describe, expect, it } from 'vitest'
import { isProtectedPath } from './protected-routes'

// cspell:ignore storiesx
describe('isProtectedPath', () => {
	it.each([
		'/',
		'/dashboard',
		'/profile',
		'/stories',
		'/stories/alice',
		'/create',
		'/create/post',
		'/bookmarks',
		'/notifications',
	])('protects %s', (path) => expect(isProtectedPath(path)).toBe(true))
	it.each([
		'/storiesx',
		'/profiles',
		'/settings',
		'/search',
		'/u/alice',
		'/p/pst_1',
		'/api/feed',
		'/login',
	])('leaves %s public', (path) => expect(isProtectedPath(path)).toBe(false))
})
