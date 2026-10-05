import { describe, expect, it } from 'vitest'
import { STICKERS, stickerFromMessage, stickerToken } from './sticker'

describe('message stickers', () => {
	it('only renders a complete known GIF token', () => {
		for (const sticker of STICKERS) expect(stickerFromMessage(stickerToken(sticker))).toBe(sticker)
		expect(stickerFromMessage('look [gif:heart]')).toBeNull()
		expect(stickerFromMessage('[gif:outside]')).toBeNull()
		expect(stickerFromMessage('<img src=x>')).toBeNull()
	})
})
