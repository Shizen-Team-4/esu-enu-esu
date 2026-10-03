const MAX_LETTERS = 2

/** Initials for the default avatar: first letter of the first two words, uppercased. */
export const initials = (name: string): string => {
	const letters = name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, MAX_LETTERS)
		.map((word) => Array.from(word)[0].toUpperCase())
	return letters.length > 0 ? letters.join('') : '?'
}
