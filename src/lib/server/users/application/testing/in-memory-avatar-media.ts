import type { AvatarMedia } from '../ports'

export interface AvatarUpload {
	id: string
	ownerId: string
	url: string
}

/** Holds only uploads that are usable as avatars (own, purpose avatar, status ready). */
export class InMemoryAvatarMedia implements AvatarMedia {
	constructor(private readonly uploads: AvatarUpload[] = []) {}

	async findUsable(mediaId: string, ownerId: string) {
		const upload = this.uploads.find((item) => item.id === mediaId && item.ownerId === ownerId)
		return upload ? { url: upload.url } : null
	}
}
