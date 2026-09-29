import { dev } from '$app/environment';
import { error, json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

type CheckResult = { ok: boolean; ms: number; detail?: unknown; error?: string };

const log = (msg: string, data?: unknown) =>
	console.log(`[debug] ${new Date().toISOString()} ${msg}`, data ?? '');

async function check(name: string, fn: () => Promise<unknown>): Promise<CheckResult> {
	const start = performance.now();
	log(`${name}: start`);
	try {
		const detail = await fn();
		const ms = Math.round(performance.now() - start);
		log(`${name}: OK (${ms}ms)`, detail);
		return { ok: true, ms, detail };
	} catch (e) {
		const ms = Math.round(performance.now() - start);
		const message = e instanceof Error ? e.message : String(e);
		console.error(`[debug] ${name}: FAILED (${ms}ms)`, e);
		return { ok: false, ms, error: message };
	}
}

// GET /api/debug — checks the KV and D1 bindings. Dev only.
export const GET: RequestHandler = async ({ platform }) => {
	if (!dev) error(404);

	const env = platform?.env;
	log('bindings present', { KV: !!env?.KV, DB: !!env?.DB });
	if (!env?.KV || !env?.DB) error(500, 'Bindings missing — check wrangler.jsonc and svelte.config.js');

	const kv = await check('KV put/get/delete', async () => {
		const key = `debug:${crypto.randomUUID()}`;
		const value = `ping-${Date.now()}`;
		await env.KV.put(key, value, { expirationTtl: 60 });
		const read = await env.KV.get(key);
		await env.KV.delete(key);
		if (read !== value) throw new Error(`read back ${JSON.stringify(read)}, expected ${value}`);
		return { key, value };
	});

	const d1 = await check('D1 raw query', () =>
		env.DB.prepare("SELECT 1 AS ok, datetime('now') AS now").first()
	);

	const drizzle = await check('D1 via Drizzle', () =>
		getDb(env.DB).get<{ tables: number }>(
			sql`SELECT count(*) AS tables FROM sqlite_master WHERE type = 'table'`
		)
	);

	const ok = kv.ok && d1.ok && drizzle.ok;
	log(`result: ${ok ? 'ALL OK' : 'FAILED'}`);

	return json({ ok, kv, d1, drizzle }, { status: ok ? 200 : 500 });
};
