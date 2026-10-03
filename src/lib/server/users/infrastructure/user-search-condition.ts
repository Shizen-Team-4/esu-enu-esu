import { sql } from 'drizzle-orm'

// Prefix match on username or display name, with LIKE wildcards in the query escaped.
export function userSearchCondition(q: string) {
	const escaped = q.replace(/[\\%_]/g, (char) => `\\${char}`) + '%'
	return sql`(u.username LIKE ${escaped} ESCAPE '\\' OR lower(u.name) LIKE ${escaped} ESCAPE '\\')`
}
