import type { Clock, IdGenerator } from '../../shared/application/ports'
import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { mimeTypes, validateUpload, type Upload } from '../domain/upload'
import type { MediaRepository, MediaStorage } from './ports'

export const createUpload =
	(deps: { repository: MediaRepository; storage: MediaStorage; clock: Clock; ids: IdGenerator }) =>
	async (viewer: Viewer | null, input: unknown) => {
		const actor = requireViewer(viewer),
			value = validateUpload(input),
			now = deps.clock.now()
		const id = deps.ids.generate('med'),
			key = `${actor.id}/${id}.${mimeTypes[value.mimeType]}`
		const thumbnailKey = value.type === 'video' ? `${actor.id}/${id}.poster.webp` : null
		const expiresAt = new Date(now.getTime() + 900000)
		const uploadUrl = await deps.storage.sign(
			key,
			value.mimeType,
			value.sizeBytes,
			expiresAt,
			value.purpose,
		)
		// The exact thumbnail length is declared by the browser and signed too.
		const thumbnailSize =
			input && typeof input === 'object' && 'thumbnailSizeBytes' in input
				? Number(input.thumbnailSizeBytes)
				: 0
		let thumbnailUploadUrl: string | null = null
		if (thumbnailKey) {
			const thumbnail = validateUpload({
				purpose: 'post',
				mimeType: 'image/webp',
				sizeBytes: thumbnailSize,
			})
			if (thumbnail.sizeBytes > 1024 * 1024) throw new AppError('PAYLOAD_TOO_LARGE')
			thumbnailUploadUrl = await deps.storage.sign(
				thumbnailKey,
				'image/webp',
				thumbnail.sizeBytes,
				expiresAt,
				'post',
			)
		}
		const upload: Upload = {
			...value,
			id,
			ownerId: actor.id,
			key,
			thumbnailKey,
			status: 'pending',
			width: null,
			height: null,
			durationSec: null,
			createdAt: now.toISOString(),
		}
		await deps.repository.create(upload)
		return {
			mediaId: id,
			uploadUrl,
			method: 'PUT' as const,
			headers: { 'Content-Type': value.mimeType, 'If-None-Match': '*' },
			expiresAt: expiresAt.toISOString(),
			thumbnailUploadUrl,
		}
	}
