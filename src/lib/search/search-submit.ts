import { normalizeQuery } from './search-dropdown'

type SearchSubmitAction =
	{ type: 'none' } | { type: 'search'; query: string } | { type: 'profile'; username: string }

export function searchSubmitAction(
	rawQuery: string,
	selectedUsername: string | undefined,
): SearchSubmitAction {
	const query = normalizeQuery(rawQuery)
	if (query === null) return { type: 'none' }
	if (selectedUsername) return { type: 'profile', username: selectedUsername }
	return { type: 'search', query }
}
