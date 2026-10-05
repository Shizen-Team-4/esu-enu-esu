import { validatePreferences } from '../domain/preferences'
export const validateGuestPreferences = (input: unknown) => validatePreferences(input)
