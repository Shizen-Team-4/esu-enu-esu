import { sql } from 'drizzle-orm'
import type { Db } from '../../db'

export interface CheckResult {
	ok: boolean
	ms: number
	detail?: unknown
	error?: string
}

export interface HealthReport {
	ok: boolean
	kv: CheckResult
	d1: CheckResult
	drizzle: CheckResult
}

async function timed(fn: () => Promise<unknown>): Promise<CheckResult> {
	const start = performance.now()
	try {
		const detail = await fn()
		return { ok: true, ms: Math.round(performance.now() - start), detail }
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : String(cause)
		return { ok: false, ms: Math.round(performance.now() - start), error: message }
	}
}

async function pingKv(kv: KVNamespace) {
	const key = `debug:${crypto.randomUUID()}`
	const value = `ping-${Date.now()}`
	await kv.put(key, value, { expirationTtl: 60 })
	const read = await kv.get(key)
	await kv.delete(key)
	if (read !== value) throw new Error(`read back ${JSON.stringify(read)}, expected ${value}`)
	return { key, value }
}

export function createHealthCheck(deps: { kv: KVNamespace; d1: D1Database; db: Db }) {
	return {
		async check(): Promise<HealthReport> {
			const kv = await timed(() => pingKv(deps.kv))
			const d1 = await timed(() =>
				deps.d1.prepare("SELECT 1 AS ok, datetime('now') AS now").first(),
			)
			const drizzle = await timed(async () =>
				deps.db.get<{ tables: number }>(
					sql`SELECT count(*) AS tables FROM sqlite_master WHERE type = 'table'`,
				),
			)
			return { ok: kv.ok && d1.ok && drizzle.ok, kv, d1, drizzle }
		},
	}
}
