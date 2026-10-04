export type ComposerType = 'post' | 'reel' | 'story'

const types: readonly string[] = ['post', 'reel', 'story']

export function initialPostType(value: string | null | undefined): ComposerType {
	return types.includes(value ?? '') ? (value as ComposerType) : 'post'
}
