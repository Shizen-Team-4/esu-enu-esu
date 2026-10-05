import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { ScriptedD1 } from './scripted-d1'
/** In-memory SQLite adapter exercises real SQL constraints without Cloudflare or network access. */
export class SqliteD1 extends ScriptedD1 {
	readonly sqlite = new DatabaseSync(':memory:')
	constructor() {
		super()
		this.sqlite.exec('PRAGMA foreign_keys = ON')
	}
	override execute<T>(sql: string, values: unknown[]): D1Result<T> {
		const statement = this.sqlite.prepare(sql)
		const parameters = values as SQLInputValue[]
		const rows = statement.columns().length ? statement.all(...parameters) : []
		const changes = statement.columns().length ? 0 : Number(statement.run(...parameters).changes)
		return {
			success: true,
			results: rows as T[],
			meta: {
				duration: 0,
				size_after: 0,
				rows_read: rows.length,
				rows_written: changes,
				last_row_id: 0,
				changed_db: changes > 0,
				changes,
			},
		}
	}
	override async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
		this.sqlite.exec('BEGIN')
		try {
			const results = []
			for (const statement of statements) results.push(await statement.run<T>())
			this.sqlite.exec('COMMIT')
			return results
		} catch (cause) {
			this.sqlite.exec('ROLLBACK')
			throw cause
		}
	}
}
