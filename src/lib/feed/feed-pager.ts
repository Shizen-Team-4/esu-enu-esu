import type { Post } from '$lib/contract'
import { createPager, type LoadPage as PageLoader, type Pager } from '$lib/pagination/create-pager'

export type { PagerStatus } from '$lib/pagination/create-pager'
export type FeedPager = Pager<Post>
export type LoadPage = PageLoader<Post>
export const createFeedPager = createPager<Post>
