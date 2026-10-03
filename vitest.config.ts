import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
	plugins: [sveltekit()],

	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		coverage: {
			include: [
				'src/lib/i18n/**/*.ts',
				'src/lib/server/preferences/{domain,application}/**/*.ts',
				'src/lib/server/shared/domain/**/*.ts',
				'src/lib/server/posts/{domain,application}/**/*.ts',
				'src/lib/server/posts/infrastructure/post-mapper.ts',
				'src/lib/server/comments/{domain,application}/**/*.ts',
				'src/lib/server/comments/infrastructure/comment-mapper.ts',
				'src/lib/server/auth/application/**/*.ts',
				'src/lib/server/users/infrastructure/user-search-condition.ts',
				'src/lib/server/users/infrastructure/unique-violation.ts',
				'src/lib/media/video-duration.ts',
				'src/lib/server/users/{domain,application}/**/*.ts',
				'src/lib/server/stories/{domain,application}/**/*.ts',
				'src/lib/server/media/{domain,application}/**/*.ts',
				'src/lib/server/shared/http/**/*.ts',
				'src/lib/server/shared/infrastructure/media-public-url.ts',
				'src/lib/errors/**/*.ts',
				'src/lib/api/**/*.ts',
				'src/lib/media/upload-file.ts',
				'src/lib/media/carousel-index.ts',
				'src/lib/feed/**/*.ts',
				'src/lib/posts/**/*.ts',
				'src/lib/format/**/*.ts',
				'src/lib/settings/**/*.ts',
				'src/lib/profile/**/*.ts',
				'src/lib/contract/limits.ts',
				'src/lib/create/**/*.ts',
				'src/lib/auth/**/*.ts',
				'src/lib/navigation/**/*.ts',
				'src/lib/toast/**/*.ts',
			],
			exclude: ['**/*.test.ts', '**/ports.ts', '**/testing/**', 'src/lib/i18n/index.ts'],
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: './coverage',
		},
	},
})
