export const charCount = (text: string): number => [...text].length

export const remaining = (text: string, max: number): number => max - charCount(text)

export const isOver = (text: string, max: number): boolean => charCount(text) > max
