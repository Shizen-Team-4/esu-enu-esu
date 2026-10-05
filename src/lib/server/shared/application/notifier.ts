import type { NotificationEvent } from '../domain/notification-event'

export type { NotificationEvent } from '../domain/notification-event'

/** Schedules delivery after a successful write, without changing its result. */
export interface Notifier {
	notify(event: NotificationEvent): void
}
