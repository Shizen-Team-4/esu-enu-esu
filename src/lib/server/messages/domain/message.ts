import { AppError } from '../../shared/domain/app-error'
export const MESSAGE_MAX = 2000
export function messageBody(value: unknown): string {
	if (typeof value !== 'string' || !value.trim())
		throw new AppError('VALIDATION_FAILED', { body: 'REQUIRED' })
	const body = value.trim()
	if ([...body].length > MESSAGE_MAX) throw new AppError('VALIDATION_FAILED', { body: 'TOO_LONG' })
	return body
}
export function messageId(value: unknown, prefix: 'dm' | 'msg' | 'usr'): string {
	if (typeof value !== 'string' || !new RegExp('^' + prefix + '_[A-Za-z0-9_-]{1,100}$').test(value))
		throw new AppError('VALIDATION_FAILED', { id: 'INVALID_FORMAT' })
	return value
}
export function messageSequence(value: unknown): number {
	const number =
		typeof value === 'number'
			? value
			: typeof value === 'string' && /^\d+$/.test(value)
				? Number(value)
				: NaN
	if (!Number.isSafeInteger(number) || number < 1)
		throw new AppError('VALIDATION_FAILED', { before: 'INVALID_FORMAT' })
	return number
}
