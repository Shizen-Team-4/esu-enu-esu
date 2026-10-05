import type { NotificationEvent, Notifier } from '../../shared/application/notifier'
import type { TaskRunner } from '../../shared/application/ports'

export function createBackgroundNotifier(deps: {
	deliver: (event: NotificationEvent) => Promise<void>
	tasks: TaskRunner
	report: (cause: unknown) => void
}): Notifier {
	return {
		notify(event) {
			deps.tasks.run(
				Promise.resolve()
					.then(() => deps.deliver(event))
					.catch(deps.report),
			)
		},
	}
}
