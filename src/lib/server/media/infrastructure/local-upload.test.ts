import { describe, expect, it } from 'vitest'
import { viewer } from '../../shared/testing/viewer'
import { createLocalUploadReceiver, signLocalUpload, verifyLocalUpload } from './local-upload'

const secret = 'test-secret'
const bytes = new Uint8Array([1, 2, 3, 4])
const farFuture = Date.now() + 60 * 60 * 1000
const capability = {
	key: `${viewer.id}/med_1.jpg`,
	purpose: 'post' as const,
	mimeType: 'image/jpeg',
	sizeBytes: bytes.byteLength,
	expiresAt: farFuture,
}

class FakeBucket {
	objects = new Map<string, { body: ArrayBuffer; options: unknown }>()
	put = async (key: string, body: ArrayBuffer, options: unknown) => {
		if (this.objects.has(key)) return null
		this.objects.set(key, { body, options })
		return {}
	}
}

const asBucket = (bucket: FakeBucket) => bucket as unknown as R2Bucket

const upload = (headers: Record<string, string> = {}, body: Uint8Array = bytes) =>
	new Request('http://localhost/upload', {
		method: 'PUT',
		body: body as BodyInit,
		headers: {
			'content-type': 'image/jpeg',
			'if-none-match': '*',
			'content-length': String(body.byteLength),
			...headers,
		},
	})

const setup = (overrides: Partial<Parameters<typeof createLocalUploadReceiver>[0]> = {}) => {
	const bucket = new FakeBucket()
	const receive = createLocalUploadReceiver({
		bucket: asBucket(bucket),
		secret,
		enabled: true,
		...overrides,
	})
	return { bucket, receive }
}

describe('verifyLocalUpload', () => {
	it('returns the signed capability', async () => {
		const token = await signLocalUpload(secret, capability)

		expect(await verifyLocalUpload(secret, token, Date.now())).toEqual(capability)
	})

	it('rejects a token signed with another secret', async () => {
		const token = await signLocalUpload('other', capability)

		await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('rejects an expired token', async () => {
		const token = await signLocalUpload(secret, { ...capability, expiresAt: 1000 })

		await expect(verifyLocalUpload(secret, token, 1000)).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('rejects a key that is not a media key', async () => {
		const token = await signLocalUpload(secret, { ...capability, key: '../etc/passwd' })

		await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('rejects an unsupported media type', async () => {
		const token = await signLocalUpload(secret, { ...capability, mimeType: 'text/html' })

		await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('validates the capability with its own purpose', async () => {
		const story = { ...capability, purpose: 'story' as const }
		const token = await signLocalUpload(secret, story)

		expect(await verifyLocalUpload(secret, token, Date.now())).toEqual(story)
	})

	it('applies the purpose rules: an avatar must be an image', async () => {
		const token = await signLocalUpload(secret, {
			...capability,
			key: `${viewer.id}/med_1.mp4`,
			mimeType: 'video/mp4',
			purpose: 'avatar',
		})

		await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('applies the purpose rules: a reel must be a video', async () => {
		const token = await signLocalUpload(secret, { ...capability, purpose: 'reel' })

		await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('rejects a capability with an unknown purpose', async () => {
		const token = await signLocalUpload(secret, { ...capability, purpose: 'admin' as never })

		await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('rejects a capability without a purpose', async () => {
		const { purpose: _purpose, ...legacy } = capability
		const token = await signLocalUpload(secret, legacy as never)

		await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it.each(['', 'abc', 'a.b.c', `${'a'.repeat(2049)}`])(
		'rejects a malformed token (%#)',
		async (token) => {
			await expect(verifyLocalUpload(secret, token, Date.now())).rejects.toMatchObject({
				code: 'FORBIDDEN',
			})
		},
	)
})

describe('createLocalUploadReceiver', () => {
	it('stores the bytes in the bucket under the signed key', async () => {
		const { bucket, receive } = setup()
		const token = await signLocalUpload(secret, capability)

		expect(await receive(viewer, token, upload())).toEqual({ ok: true })
		expect(bucket.objects.get(capability.key)?.options).toMatchObject({
			onlyIf: { etagDoesNotMatch: '*' },
			httpMetadata: { contentType: 'image/jpeg' },
		})
	})

	it('is not found when local uploads are disabled', async () => {
		const { receive } = setup({ enabled: false })

		await expect(receive(viewer, 'token', upload())).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})

	it('requires a viewer', async () => {
		const { receive } = setup()

		await expect(receive(null, 'token', upload())).rejects.toMatchObject({
			code: 'UNAUTHENTICATED',
		})
	})

	it.each([{ secret: undefined }, { bucket: undefined }])(
		'reports an internal error when configuration is missing (%j)',
		async (override) => {
			const { receive } = setup(override)

			await expect(receive(viewer, 'token', upload())).rejects.toMatchObject({ code: 'INTERNAL' })
		},
	)

	it('rejects an invalid token', async () => {
		const { receive } = setup()

		await expect(receive(viewer, 'garbage', upload())).rejects.toMatchObject({ code: 'FORBIDDEN' })
	})

	it('forbids uploading to a key owned by another user', async () => {
		const { receive } = setup()
		const token = await signLocalUpload(secret, { ...capability, key: 'usr_2/med_1.jpg' })

		await expect(receive(viewer, token, upload())).rejects.toMatchObject({ code: 'FORBIDDEN' })
	})

	it('rejects a wrong If-None-Match header', async () => {
		const { receive } = setup()
		const token = await signLocalUpload(secret, capability)

		await expect(receive(viewer, token, upload({ 'if-none-match': 'abc' }))).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('rejects a content type that differs from the signed one', async () => {
		const { receive } = setup()
		const token = await signLocalUpload(secret, capability)

		await expect(
			receive(viewer, token, upload({ 'content-type': 'image/png' })),
		).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('rejects a content length that differs from the signed size', async () => {
		const { receive } = setup()
		const token = await signLocalUpload(secret, capability)

		await expect(receive(viewer, token, upload({ 'content-length': '99' }))).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('rejects a body whose real size differs from the signed size', async () => {
		const { receive } = setup()
		const token = await signLocalUpload(secret, capability)
		const request = upload({ 'content-length': String(bytes.byteLength) }, new Uint8Array([1, 2]))

		await expect(receive(viewer, token, request)).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('conflicts when the key was already written', async () => {
		const { receive } = setup()
		const token = await signLocalUpload(secret, capability)
		await receive(viewer, token, upload())

		await expect(receive(viewer, token, upload())).rejects.toMatchObject({ code: 'CONFLICT' })
	})
})
