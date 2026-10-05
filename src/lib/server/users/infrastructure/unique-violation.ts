/** True when a database error (or its cause chain) is a SQLite UNIQUE constraint failure. */
export function isUniqueViolation(cause: unknown): boolean {
	for (let current = cause, depth = 0; current && depth < 5; depth++) {
		if (current instanceof Error && /UNIQUE constraint failed/i.test(current.message)) return true
		current = current instanceof Error ? current.cause : undefined
	}
	return false
}
