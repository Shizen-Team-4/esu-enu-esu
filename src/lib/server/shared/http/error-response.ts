import { error, fail, json } from '@sveltejs/kit'
import { statusOf, toEnvelope } from './error-envelope'

export { statusOf, toEnvelope }

export function toJsonError(cause: unknown) {
	const envelope = toEnvelope(cause)
	const { code, retryAfterSec } = envelope.error
	return json(envelope, {
		status: statusOf(code),
		headers: retryAfterSec === undefined ? {} : { 'Retry-After': String(retryAfterSec) },
	})
}

export function toActionFailure(cause: unknown) {
	const envelope = toEnvelope(cause)
	return fail(statusOf(envelope.error.code), envelope)
}

export function toHttpError(cause: unknown): never {
	const { code, message } = toEnvelope(cause).error
	error(statusOf(code), { message, code })
}
