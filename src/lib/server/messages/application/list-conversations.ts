import { requireViewer, type Viewer } from '../../shared/domain/viewer'
import { pageQuery } from '../../shared/domain/page-query'
import type { MessageRepository } from './ports'
export const listConversations =
	(messages: MessageRepository) =>
	(viewer: Viewer | null, input: { cursor?: string; limit?: unknown } = {}) =>
		messages.list(requireViewer(viewer).id, pageQuery(input))
