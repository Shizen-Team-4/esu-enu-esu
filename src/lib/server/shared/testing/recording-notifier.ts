import type { NotificationEvent, Notifier } from '../application/notifier'

export class RecordingNotifier implements Notifier {
	events: NotificationEvent[] = []
	notify(event: NotificationEvent) {
		this.events.push(event)
	}
}
