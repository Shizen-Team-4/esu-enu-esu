import { hashPassword } from 'better-auth/crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Local D1 only. Never used by migrations, deploys, or production auth.
const password = 'SnsDemo!2026'
const hash = await hashPassword(password)
const now = Date.now()
const sql = `
INSERT INTO user (id, name, email, email_verified, username, display_username, created_at, updated_at)
VALUES ('usr_sns_demo', 'SNS Demo', 'demo@sns.example', 1, 'sns_demo', 'sns_demo', ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET email_verified = 1;
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('account_sns_demo', 'usr_sns_demo', 'credential', 'usr_sns_demo', '${hash}', ${now}, ${now})
ON CONFLICT(id) DO UPDATE SET password = excluded.password, updated_at = excluded.updated_at;
INSERT OR IGNORE INTO preferences (user_id, theme, language, updated_at) VALUES ('usr_sns_demo', 'system', 'en', ${now});
`
mkdirSync('.wrangler', { recursive: true })
writeFileSync('.wrangler/demo-account.sql', sql)
const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url))
execFileSync(process.execPath, [cli, 'd1', 'migrations', 'apply', 'DB', '--local'], {
	stdio: 'inherit',
})
execFileSync(
	process.execPath,
	[cli, 'd1', 'execute', 'DB', '--local', '--file', '.wrangler/demo-account.sql'],
	{ stdio: 'inherit' },
)
console.log('Local demo account created: demo@sns.example / SnsDemo!2026')
