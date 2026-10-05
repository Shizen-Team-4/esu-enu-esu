import { describe, expect, it } from 'vitest'
import type { NotificationEvent } from '../../shared/application/notifier'
import { createBackgroundNotifier } from './background-notifier'

const event: NotificationEvent = {
	type: 'follow',
	actorId: 'usr_1',
	recipientId: 'usr_2',
	createdAt: new Date(0),
}
describe('createBackgroundNotifier', () => {
	it('schedules delivery and returns before background work completes', async () => {
		const tasks: Promise<unknown>[] = []
		const events: NotificationEvent[] = []
		const notifier = createBackgroundNotifier({
			deliver: async (value) => {
				events.push(value)
			},
			tasks: {
				run: (task) => {
					tasks.push(task)
				},
			},
			report: () => {
				throw new Error('unexpected failure')
			},
		})
		expect(notifier.notify(event)).toBeUndefined()
		expect(events).toEqual([])
		await Promise.all(tasks)
		expect(events).toEqual([event])
	})
	it.each([false, true])(
		'reports asynchronous or synchronous delivery failure (%s) without rejecting the action',
		async (synchronous) => {
			const failure = new Error('offline')
			const reports: unknown[] = []
			const tasks: Promise<unknown>[] = []
			const deliver = synchronous
				? () => {
						throw failure
					}
				: async () => {
						throw failure
					}
			const notifier = createBackgroundNotifier({
				deliver,
				tasks: {
					run: (task) => {
						tasks.push(task)
					},
				},
				report: (cause) => {
					reports.push(cause)
				},
			})
			expect(() => notifier.notify(event)).not.toThrow()
			await Promise.all(tasks)
			expect(reports).toEqual([failure])
		},
	)
})
