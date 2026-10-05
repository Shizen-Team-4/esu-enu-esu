export const STICKERS = ['heart', 'wave', 'celebrate', 'star'] as const
export type Sticker = (typeof STICKERS)[number]

export function stickerToken(sticker: Sticker): string {
	return `[gif:${sticker}]`
}

export function stickerFromMessage(body: string): Sticker | null {
	const match = /^\[gif:(heart|wave|celebrate|star)\]$/.exec(body)
	return match ? (match[1] as Sticker) : null
}
