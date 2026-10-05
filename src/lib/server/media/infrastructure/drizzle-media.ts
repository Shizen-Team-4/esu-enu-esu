import { and, eq, or } from 'drizzle-orm'
import type { getDb } from '../../db'
import { media } from '../../db/schema'
import type { MediaRepository } from '../application/ports'
import type { MimeType } from '../domain/upload'

export function createMediaRepository(db: ReturnType<typeof getDb>): MediaRepository {
	return {
		async find(id) {
			const row = await db.select().from(media).where(eq(media.id, id)).get()
			if (!row) return null
			const { r2Key, thumbnailR2Key, createdAt, ...data } = row
			return {
				...data,
				mimeType: row.mimeType as MimeType,
				key: r2Key,
				thumbnailKey: thumbnailR2Key,
				createdAt: createdAt.toISOString(),
			}
		},
		async create(upload) {
			const { key, thumbnailKey, createdAt, ...data } = upload
			await db.insert(media).values({
				...data,
				r2Key: key,
				thumbnailR2Key: thumbnailKey,
				createdAt: new Date(createdAt),
			})
		},
		async findByKey(key) {
			const row = await db
				.select()
				.from(media)
				.where(or(eq(media.r2Key, key), eq(media.thumbnailR2Key, key)))
				.get()
			if (!row) return null
			const { r2Key, thumbnailR2Key, createdAt, ...data } = row
			return {
				...data,
				mimeType: row.mimeType as MimeType,
				key: r2Key,
				thumbnailKey: thumbnailR2Key,
				createdAt: createdAt.toISOString(),
			}
		},
		async complete(id, ownerId, metadata) {
			const result = await db
				.update(media)
				.set({ ...metadata, status: 'ready' })
				.where(and(eq(media.id, id), eq(media.ownerId, ownerId), eq(media.status, 'pending')))
				.returning({ id: media.id })
			return result.length === 1
		},
	}
}
