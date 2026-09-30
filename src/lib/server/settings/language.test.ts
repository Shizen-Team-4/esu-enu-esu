import { describe, it, expect } from 'vitest';
import { validateLanguageInput } from './language';

describe('validateLanguageInput', () => {
	it('accepts a supported language code', () => {
		expect(validateLanguageInput({ language: 'km' })).toEqual({ ok: true, lang: 'km' });
	});

	it('rejects an unsupported language code', () => {
		expect(validateLanguageInput({ language: 'fr' }).ok).toBe(false);
	});

	it('rejects a missing language field', () => {
		expect(validateLanguageInput({}).ok).toBe(false);
	});

	it('rejects non-object bodies', () => {
		expect(validateLanguageInput(null).ok).toBe(false);
		expect(validateLanguageInput('km').ok).toBe(false);
		expect(validateLanguageInput(undefined).ok).toBe(false);
	});

	it('rejects a wrong-type language value', () => {
		expect(validateLanguageInput({ language: 123 }).ok).toBe(false);
	});
});