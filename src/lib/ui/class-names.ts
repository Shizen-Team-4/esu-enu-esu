export type ClassValue = string | false | null | undefined

/** Joins the truthy class strings with a space. */
export const cn = (...values: ClassValue[]): string => values.filter(Boolean).join(' ')
