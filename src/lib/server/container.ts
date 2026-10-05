import { getDb } from './db'
import { createAuth, type AuthSecrets } from './auth'
import { getPreferences } from './preferences/application/get-preferences'
import { updatePreferences } from './preferences/application/update-preferences'
import { createPreferencesRepository } from './preferences/infrastructure/drizzle-preferences'
import { createPreferencesCache } from './preferences/infrastructure/kv-preferences'
import { createPostRepository } from './posts/infrastructure/drizzle-posts'
import { createPost } from './posts/application/create-post'
import { getPost } from './posts/application/get-post'
import { updatePost } from './posts/application/update-post'
import { deletePost } from './posts/application/delete-post'
import { listFeed } from './posts/application/list-feed'
import { listReels } from './posts/application/list-reels'
import { listUserPosts } from './posts/application/list-user-posts'
import { listSavedPosts } from './posts/application/list-saved-posts'
import { likePost } from './posts/application/like-post'
import { unlikePost } from './posts/application/unlike-post'
import { savePost } from './posts/application/save-post'
import { unsavePost } from './posts/application/unsave-post'
import type { AuthorDirectory } from './posts/application/ports'
import { createCommentRepository } from './comments/infrastructure/drizzle-comments'
import { listComments } from './comments/application/list-comments'
import { listReplies } from './comments/application/list-replies'
import { createComment } from './comments/application/create-comment'
import { deleteComment } from './comments/application/delete-comment'
import type { PostLookup } from './comments/application/ports'
import { createMailtrapSender, type MailConfig } from './auth/infrastructure/mailtrap-email'
import type { Lang } from '$lib/i18n/config'
import { createUserRepository } from './users/infrastructure/drizzle-users'
import { getMe } from './users/application/get-me'
import { getProfile } from './users/application/get-profile'
import { getProfileContent } from './users/application/get-profile-content'
import { searchUsers } from './users/application/search-users'
import { followUser } from './users/application/follow-user'
import { updateMe } from './users/application/update-me'
import { listFollowers } from './users/application/list-followers'
import { listFollowing } from './users/application/list-following'
import type { AvatarMedia } from './users/application/ports'
import type { MediaRepository } from './media/application/ports'
import { createMediaRepository } from './media/infrastructure/drizzle-media'
import { createR2Storage, type R2Config } from './media/infrastructure/r2-storage'
import { createUpload } from './media/application/create-upload'
import { completeUpload } from './media/application/complete-upload'
import { getMediaFile } from './media/application/get-media-file'
import { createStoryRepository } from './stories/infrastructure/drizzle-stories'
import { createStory } from './stories/application/create-story'
import { listUserStories } from './stories/application/list-user-stories'
import { listStoryTray } from './stories/application/list-story-tray'
import { markStorySeen } from './stories/application/mark-story-seen'
import { likeStory } from './stories/application/like-story'
import { deleteStory } from './stories/application/delete-story'
import { validateGuestPreferences } from './preferences/application/validate-guest-preferences'
import { createLocalUploadReceiver } from './media/infrastructure/local-upload'
import { createHealthCheck } from './health/infrastructure/health-check'
import { normalizeMediaUrl } from './shared/infrastructure/media-public-url'
import { createNotificationRepository } from './notifications/infrastructure/drizzle-notifications'
import { createNotificationFollowers } from './notifications/infrastructure/drizzle-notification-followers'
import { createBackgroundNotifier } from './notifications/infrastructure/background-notifier'
import { createNotifications } from './notifications/application/create-notifications'
import { listNotifications } from './notifications/application/list-notifications'
import { getUnreadCount } from './notifications/application/get-unread-count'
import { markNotificationRead } from './notifications/application/mark-notification-read'
import { markAllNotificationsRead } from './notifications/application/mark-all-notifications-read'

function authorDirectory(users: ReturnType<typeof createUserRepository>): AuthorDirectory {
	return {
		findIdByUsername: async (username) => (await users.find({ username }, null))?.id ?? null,
	}
}

function postLookup(posts: ReturnType<typeof createPostRepository>): PostLookup {
	return {
		find: async (postId) => {
			const post = await posts.find(postId, null)
			return post ? { authorId: post.author.id } : null
		},
	}
}

function avatarMedia(media: MediaRepository, publicUrl: string): AvatarMedia {
	return {
		findUsable: async (mediaId, ownerId) => {
			const upload = await media.find(mediaId)
			const usable =
				upload?.ownerId === ownerId && upload.purpose === 'avatar' && upload.status === 'ready'
			return usable ? { url: `${publicUrl}/${upload.key}` } : null
		},
	}
}

export function createContainer(
	env: Env & MailConfig & R2Config & AuthSecrets,
	ctx: ExecutionContext,
	origin: string,
	language: Lang,
	development = false,
) {
	const mediaPublicUrl = normalizeMediaUrl(env.MEDIA_PUBLIC_URL)
	const db = getDb(env.DB)
	const repository = createPreferencesRepository(db)
	const cache = createPreferencesCache(env.KV)
	const clock = { now: () => new Date() }
	const tasks = { run: (task: Promise<unknown>) => ctx.waitUntil(task) }
	const users = createUserRepository(db)
	const posts = createPostRepository(db, env.DB, {
		origin,
		media: mediaPublicUrl,
	})
	const ids = {
		generate: (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`,
	}
	const mediaRepository = createMediaRepository(db)
	const storage = createR2Storage(
		env,
		development && env.BETTER_AUTH_SECRET ? { origin, secret: env.BETTER_AUTH_SECRET } : undefined,
	)
	const commentRepository = createCommentRepository(db, env.DB)
	const commentPosts = postLookup(posts)
	const stories = createStoryRepository(db, env.DB, mediaPublicUrl)
	const notifications = createNotificationRepository(db, env.DB)
	const notifier = createBackgroundNotifier({
		deliver: createNotifications({
			notifications,
			followers: createNotificationFollowers(db),
			ids,
		}),
		tasks,
		report: (cause) => console.error('Notification delivery failed', cause),
	})
	return {
		notifications: {
			listNotifications: listNotifications(notifications),
			getUnreadCount: getUnreadCount(notifications),
			markNotificationRead: markNotificationRead({ notifications, clock }),
			markAllNotificationsRead: markAllNotificationsRead({ notifications, clock }),
		},
		health: createHealthCheck({ kv: env.KV, d1: env.DB, db }),
		stories: {
			createStory: createStory({ stories, clock, ids }),
			listUserStories: listUserStories({ stories, clock }),
			listStoryTray: listStoryTray({ stories, clock }),
			markStorySeen: markStorySeen({ stories, clock }),
			likeStory: likeStory({ stories, clock }),
			deleteStory: deleteStory({ stories, clock }),
		},
		media: {
			uploadLocalFile: createLocalUploadReceiver({
				bucket: env.MEDIA,
				secret: env.BETTER_AUTH_SECRET,
				enabled: development,
			}),
			createUpload: createUpload({ repository: mediaRepository, storage, clock, ids }),
			completeUpload: completeUpload({
				repository: mediaRepository,
				storage,
				publicUrl: mediaPublicUrl,
			}),
			getMediaFile: getMediaFile({ repository: mediaRepository, storage }),
		},
		auth: createAuth(
			db,
			{
				...env,
				BETTER_AUTH_URL: env.BETTER_AUTH_URL || (development ? 'http://localhost:5173' : undefined),
			},
			createMailtrapSender(env),
			language,
			development,
		),
		users: {
			getMe: getMe(users),
			getProfile: getProfile(users),
			getProfileContent: getProfileContent({
				getProfile: getProfile(users),
				listUserPosts: listUserPosts({ posts, authors: authorDirectory(users) }),
				listSavedPosts: listSavedPosts(posts),
			}),
			searchUsers: searchUsers(users),
			followUser: followUser({ users, clock, notifier }),
			updateMe: updateMe({ users, avatars: avatarMedia(mediaRepository, mediaPublicUrl) }),
			listFollowers: listFollowers(users),
			listFollowing: listFollowing(users),
		},
		posts: {
			createPost: createPost({ posts, clock, ids, notifier }),
			getPost: getPost(posts),
			updatePost: updatePost({ posts, clock }),
			deletePost: deletePost({ posts, clock }),
			listFeed: listFeed(posts),
			listReels: listReels(posts),
			listUserPosts: listUserPosts({ posts, authors: authorDirectory(users) }),
			listSavedPosts: listSavedPosts(posts),
			likePost: likePost({ posts, clock, notifier }),
			unlikePost: unlikePost({ posts, clock }),
			savePost: savePost({ posts, clock }),
			unsavePost: unsavePost({ posts, clock }),
		},
		comments: {
			listComments: listComments({ comments: commentRepository, posts: commentPosts }),
			listReplies: listReplies({ comments: commentRepository, posts: commentPosts }),
			createComment: createComment({
				comments: commentRepository,
				posts: commentPosts,
				clock,
				ids,
				notifier,
			}),
			deleteComment: deleteComment({ comments: commentRepository, posts: commentPosts }),
		},
		preferences: {
			validateGuestPreferences,
			getPreferences: getPreferences({ repository, cache, clock, tasks }),
			updatePreferences: updatePreferences({ repository, cache, clock }),
		},
	}
}

export type Services = ReturnType<typeof createContainer>
