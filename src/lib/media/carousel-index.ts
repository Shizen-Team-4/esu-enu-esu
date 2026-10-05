export const nextIndex = (index: number, total: number): number =>
	Math.min(index + 1, Math.max(total - 1, 0))

export const previousIndex = (index: number): number => Math.max(index - 1, 0)

export const hasNext = (index: number, total: number): boolean => index < total - 1

export const hasPrevious = (index: number): boolean => index > 0

export const counterValues = (index: number, total: number) => ({
	current: index + 1,
	total,
})
