import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Usage in a server load/action: `const db = getDb(platform!.env.DB);`
export const getDb = (d1: D1Database) => drizzle(d1, { schema })

export type Db = ReturnType<typeof getDb>
