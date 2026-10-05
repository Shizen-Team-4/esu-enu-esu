import { AppError } from '../../shared/domain/app-error'
import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { matchesMagic, validateDimensions } from '../domain/upload'
import type { MediaRepository, MediaStorage } from './ports'

export const completeUpload =
	(deps: { repository: MediaRepository; storage: MediaStorage; publicUrl: string }) =>
	async (viewer: Viewer | null, input: Record<string, unknown>) => {
		const actor = requireViewer(viewer)
		const upload = await deps.repository.find(String(input.mediaId))
		if (!upload || upload.ownerId !== actor.id || upload.status !== 'pending')
			throw new AppError('NOT_FOUND')
		const metadata = validateDimensions(input, upload)
		const object = await deps.storage.head(upload.key)
		if (!object || object.size !== upload.sizeBytes)
			throw new AppError('VALIDATION_FAILED', { mediaId: 'INVALID_FORMAT' })
		if (!matchesMagic(await deps.storage.read(upload.key), upload.mimeType)) {
			await deps.storage.delete(upload.key)
			throw new AppError('UNSUPPORTED_MEDIA_TYPE')
		}
		if (upload.thumbnailKey) {
			const poster = await deps.storage.head(upload.thumbnailKey)
			if (
				!poster ||
				poster.size < 1 ||
				poster.size > 1024 * 1024 ||
				!matchesMagic(await deps.storage.read(upload.thumbnailKey), 'image/webp')
			)
				throw new AppError('VALIDATION_FAILED', { thumbnail: 'INVALID_FORMAT' })
		}
		if (!(await deps.repository.complete(upload.id, actor.id, metadata)))
			throw new AppError('CONFLICT')
		return {
			id: upload.id,
			type: upload.type,
			url: `${deps.publicUrl}/${upload.key}`,
			thumbnailUrl: upload.thumbnailKey ? `${deps.publicUrl}/${upload.thumbnailKey}` : null,
			...metadata,
		}
	}
