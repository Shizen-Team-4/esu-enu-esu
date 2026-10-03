import samples from '../../../docs/samples/errors.json'
import type { ErrorCode, ErrorEnvelope } from '$lib/types/error'

export const mockErrors = samples as Record<ErrorCode, ErrorEnvelope>
