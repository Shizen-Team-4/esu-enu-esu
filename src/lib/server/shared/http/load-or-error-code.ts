import type { ErrorCode } from '$lib/contract'
import { toEnvelope } from './error-envelope'

export type LoadOutcome<T> = { data: T; errorCode: null } | { data: null; errorCode: ErrorCode }

/** Runs a loader; a failure becomes a contract error code instead of a thrown 500. */
export async function loadOrErrorCode<T>(load: () => Promise<T>): Promise<LoadOutcome<T>> {
	try {
		return { data: await load(), errorCode: null }
	} catch (cause) {
		return { data: null, errorCode: toEnvelope(cause).error.code }
	}
}
