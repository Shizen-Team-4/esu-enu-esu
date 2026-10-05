interface ResponseScript {
	rows?: Record<string, unknown>[]
	changes?: number
	error?: Error
}

/** Deterministic D1 port fake: records bound SQL and returns scripted rows, with no I/O. */
export class ScriptedD1 implements D1Database {
	calls: { sql: string; values: unknown[] }[] = []
	batches: number[] = []
	private responses: ResponseScript[] = []
	respond(...responses: ResponseScript[]) {
		this.responses.push(...responses)
	}
	prepare(sql: string): D1PreparedStatement {
		return new ScriptedStatement(this, sql)
	}
	async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
		this.batches.push(statements.length)
		return Promise.all(statements.map((statement) => statement.run<T>()))
	}
	async exec(): Promise<D1ExecResult> {
		throw new Error('exec is not used by these repositories')
	}
	withSession(): D1DatabaseSession {
		throw new Error('sessions are not used by these repositories')
	}
	async dump(): Promise<ArrayBuffer> {
		throw new Error('dump is not used by these repositories')
	}
	execute<T>(sql: string, values: unknown[]): D1Result<T> {
		this.calls.push({ sql, values })
		const response = this.responses.shift()
		if (!response) throw new Error(`Missing response script for ${sql}`)
		if (response.error) throw response.error
		const changes = response.changes ?? 0
		return {
			success: true,
			results: (response.rows ?? []) as T[],
			meta: {
				duration: 0,
				size_after: 0,
				rows_read: response.rows?.length ?? 0,
				rows_written: changes,
				last_row_id: 0,
				changed_db: changes > 0,
				changes,
			},
		}
	}
}

class ScriptedStatement implements D1PreparedStatement {
	private values: unknown[] = []
	constructor(
		private db: ScriptedD1,
		private sql: string,
	) {}
	bind(...values: unknown[]): D1PreparedStatement {
		this.values = values
		return this
	}
	async run<T>(): Promise<D1Result<T>> {
		return this.db.execute<T>(this.sql, this.values)
	}
	async all<T>(): Promise<D1Result<T>> {
		return this.run<T>()
	}
	async first<T>(column?: string): Promise<T | null> {
		const row = (await this.run<Record<string, unknown>>()).results[0]
		return ((column ? row?.[column] : row) as T) ?? null
	}
	raw<T>(options: { columnNames: true }): Promise<[string[], ...T[]]>
	raw<T>(options?: { columnNames?: false }): Promise<T[]>
	async raw<T>(options?: { columnNames?: boolean }): Promise<T[] | [string[], ...T[]]> {
		const rows = (await this.run<Record<string, unknown>>()).results
		const values = rows.map((row) => Object.values(row)) as T[]
		return options?.columnNames ? [Object.keys(rows[0] ?? {}), ...values] : values
	}
}
