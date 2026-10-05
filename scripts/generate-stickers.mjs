import { mkdirSync, writeFileSync } from 'node:fs'

const size = 64
const palette = [
	[0, 0, 0],
	[18, 169, 242],
	[28, 77, 226],
	[239, 82, 142],
	[115, 87, 231],
	[255, 191, 60],
	[255, 255, 255],
	[255, 48, 64],
]
const word = (n) => [n & 255, (n >> 8) & 255]
const circle = (x, y, cx, cy, radius) => (x - cx) ** 2 + (y - cy) ** 2 < radius ** 2

function pixel(sticker, x, y, frame) {
	const pulse = Math.sin((frame * Math.PI) / 4)
	if (sticker === 'heart') {
		const scale = 22 + 2 * pulse,
			hx = (x - 32) / scale,
			hy = (32 - y) / scale
		return (hx * hx + hy * hy - 1) ** 3 - hx * hx * hy ** 3 < 0 ? (frame % 2 ? 7 : 3) : 0
	}
	if (sticker === 'wave') {
		const line = 32 + 13 * Math.sin((x - frame * 5) / 10)
		return Math.abs(y - line) < 4 && x > 8 && x < 56 ? (x < 32 ? 1 : 2) : 0
	}
	if (sticker === 'star') {
		const angle = Math.atan2(y - 32, x - 32) + (frame * Math.PI) / 16
		const radius = 13 + 11 * (0.5 + 0.5 * Math.cos(angle * 5)) + pulse
		return circle(x, y, 32, 32, radius) ? (frame % 2 ? 5 : 6) : 0
	}
	const scatter = (x * 53 + y * 97) % 151
	return (scatter + frame * 13) % 151 < 7 && x > 5 && x < 59 && y > 5 && y < 59
		? 1 + (Math.floor(scatter / 17) % 7)
		: 0
}

function makeGif(sticker) {
	const bytes = [
		...Buffer.from('GIF89a'),
		...word(size),
		...word(size),
		0xf2,
		0,
		0,
		...palette.flat(),
		0x21,
		0xff,
		0x0b,
		...Buffer.from('NETSCAPE2.0'),
		3,
		1,
		0,
		0,
		0,
	]
	for (let frame = 0; frame < 8; frame++) {
		bytes.push(0x21, 0xf9, 4, 0x09, 9, 0, 0, 0)
		bytes.push(0x2c, ...word(0), ...word(0), ...word(size), ...word(size), 0)
		bytes.push(3) // 3 bit palette indices, fixed 4 bit LZW codes.
		const data = []
		for (let y = 0; y < size; y++)
			for (let x = 0; x < size; x++) data.push((pixel(sticker, x, y, frame) << 4) | 8) // clear, pixel.
		data.push(9) // End code.
		for (let offset = 0; offset < data.length; offset += 255)
			bytes.push(Math.min(255, data.length - offset), ...data.slice(offset, offset + 255))
		bytes.push(0)
	}
	bytes.push(0x3b)
	return Buffer.from(bytes)
}

mkdirSync('static/stickers', { recursive: true })
for (const sticker of ['heart', 'wave', 'celebrate', 'star'])
	writeFileSync(`static/stickers/${sticker}.gif`, makeGif(sticker))
