import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema.ts',
	// Must match `migrations_dir` in wrangler.jsonc.
	out: './drizzle',
	// Only needed for `db:studio` / remote access; `db:generate` works without it.
	driver: 'd1-http',
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
		databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
		token: process.env.CLOUDFLARE_D1_TOKEN!
	}
});
