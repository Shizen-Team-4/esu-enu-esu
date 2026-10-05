import { optionalViewer } from '../../auth/viewer'
import { toActionFailure } from './error-response'
import { requireServices, requireUser } from './guards'
import { reactionFormInput } from './reaction-form'

type ActionEvent = { locals: App.Locals; request: Request }

/** Form action: like (active=true) or unlike (active=false). Returns the contract result. */
export const like = async ({ locals, request }: ActionEvent) => {
	const user = requireUser(locals)
	const { posts } = requireServices(locals)
	const { id, active } = reactionFormInput(await request.formData())
	try {
		return await (active ? posts.likePost : posts.unlikePost)(optionalViewer(user), id)
	} catch (cause) {
		return toActionFailure(cause)
	}
}

/** Form action: save (active=true) or unsave (active=false). Returns the contract result. */
export const save = async ({ locals, request }: ActionEvent) => {
	const user = requireUser(locals)
	const { posts } = requireServices(locals)
	const { id, active } = reactionFormInput(await request.formData())
	try {
		return await (active ? posts.savePost : posts.unsavePost)(optionalViewer(user), id)
	} catch (cause) {
		return toActionFailure(cause)
	}
}
