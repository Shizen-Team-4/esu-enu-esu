import { AppError } from '../../shared/domain/app-error'
import type { Viewer } from '../../shared/domain/viewer'
import { validateUpload, type Purpose } from '../domain/upload'

interface Capability {
	key: string
	purpose: Purpose
	mimeType: string
	sizeBytes: number
	expiresAt: number
}
const encode = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '')
const decode = (value: string) =>
	Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (char) =>
		char.charCodeAt(0),
	)
const hmacKey = (secret: string) =>
	crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify'],
	)

export async function signLocalUpload(secret: string, capability: Capability): Promise<string> {
	const payload = encode(new TextEncoder().encode(JSON.stringify(capability)))
	const signature = await crypto.subtle.sign(
		'HMAC',
		await hmacKey(secret),
		new TextEncoder().encode(payload),
	)
	return `${payload}.${encode(new Uint8Array(signature))}`
}

export async function verifyLocalUpload(
	secret: string,
	token: string,
	now: number,
): Promise<Capability> {
	try {
		if (token.length > 2048) throw new Error()
		const [payload, signature, extra] = token.split('.')
		if (
			!payload ||
			!signature ||
			extra ||
			!(await crypto.subtle.verify(
				'HMAC',
				await hmacKey(secret),
				decode(signature),
				new TextEncoder().encode(payload),
			))
		)
			throw new Error()
		const value = JSON.parse(new TextDecoder().decode(decode(payload))) as Capability
		validateUpload({ purpose: value.purpose, mimeType: value.mimeType, sizeBytes: value.sizeBytes })
		if (
			!Number.isSafeInteger(value.expiresAt) ||
			value.expiresAt <= now ||
			!/^usr_[A-Za-z0-9_-]+\/med_[A-Za-z0-9_-]+\.(?:jpg|png|webp|mp4|webm|poster\.webp)$/.test(
				value.key,
			)
		)
			throw new Error()
		return value
	} catch {
		throw new AppError('FORBIDDEN')
	}
}

export const createLocalUploadReceiver =
	(config: { bucket?: R2Bucket; secret?: string; enabled: boolean }) =>
	async (viewer: Viewer | null, token: string, request: Request) => {
		if (!config.enabled) throw new AppError('NOT_FOUND')
		if (!viewer) throw new AppError('UNAUTHENTICATED')
		if (!config.secret || !config.bucket) throw new AppError('INTERNAL')
		const value = await verifyLocalUpload(config.secret, token, Date.now())
		if (!value.key.startsWith(`${viewer.id}/`)) throw new AppError('FORBIDDEN')
		if (
			request.headers.get('content-type') !== value.mimeType ||
			request.headers.get('if-none-match') !== '*'
		)
			throw new AppError('VALIDATION_FAILED')
		if (Number(request.headers.get('content-length')) !== value.sizeBytes)
			throw new AppError('VALIDATION_FAILED')
		const bytes = await request.arrayBuffer()
		if (bytes.byteLength !== value.sizeBytes) throw new AppError('VALIDATION_FAILED')
		const object = await config.bucket.put(value.key, bytes, {
			onlyIf: { etagDoesNotMatch: '*' },
			httpMetadata: { contentType: value.mimeType },
		})
		if (!object) throw new AppError('CONFLICT')
		return { ok: true as const }
	}
