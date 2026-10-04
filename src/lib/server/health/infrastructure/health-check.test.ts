import { describe, expect, it } from 'vitest'
import type { Db } from '../../db'
import { createHealthCheck } from './health-check'

function fakeKv(broken = false) {
	const store = new Map<string, string>()
	return {
		put: async (key: string, value: string) => void store.set(key, value),
		get: async (key: string) => (broken ? 'wrong' : (store.get(key) ?? null)),
		delete: async (key: string) => void store.delete(key),
	} as unknown as KVNamespace
}

const fakeD1 = (fails = false) =>
	({
		prepare: () => ({
			first: async () => {
				if (fails) throw new Error('d1 down')
				return { ok: 1 }
			},
		}),
	}) as unknown as D1Database

const fakeDb = { get: async () => ({ tables: 3 }) } as unknown as Db

describe('createHealthCheck', () => {
	it('reports ok when every binding responds', async () => {
		const report = await createHealthCheck({ kv: fakeKv(), d1: fakeD1(), db: fakeDb }).check()
		expect(report.ok).toBe(true)
		expect(report.drizzle.detail).toEqual({ tables: 3 })
	})
	it('reports a KV read-back mismatch', async () => {
		const report = await createHealthCheck({ kv: fakeKv(true), d1: fakeD1(), db: fakeDb }).check()
		expect(report.ok).toBe(false)
		expect(report.kv.ok).toBe(false)
		expect(report.d1.ok).toBe(true)
	})
	it('reports a D1 failure with its message', async () => {
		const report = await createHealthCheck({ kv: fakeKv(), d1: fakeD1(true), db: fakeDb }).check()
		expect(report.ok).toBe(false)
		expect(report.d1.error).toBe('d1 down')
	})
})
