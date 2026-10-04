import { optionalViewer } from '../../auth/viewer'
import { toActionFailure } from './error-response'
import { requireServices, requireUser } from './guards'

export const follow = async ({ locals, request }: { locals: App.Locals; request: Request }) => {
	const user = requireUser(locals)
	const { users } = requireServices(locals)
	const data = await request.formData()
	try {
		return await users.followUser(
			optionalViewer(user),
			String(data.get('username') ?? ''),
			data.get('active') === 'true',
		)
	} catch (cause) {
		return toActionFailure(cause)
	}
}
