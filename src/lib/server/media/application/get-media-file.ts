import { AppError } from '../../shared/domain/app-error'
import type { MediaRepository, MediaStorage } from './ports'

export const getMediaFile =
	(deps: { repository: MediaRepository; storage: MediaStorage }) => async (key: string) => {
		const upload = await deps.repository.findByKey(key)
		if (!upload || upload.status === 'pending') throw new AppError('NOT_FOUND')
		const file = await deps.storage.download(key)
		if (!file) throw new AppError('NOT_FOUND')
		return { ...file, contentType: key === upload.thumbnailKey ? 'image/webp' : upload.mimeType }
	}
