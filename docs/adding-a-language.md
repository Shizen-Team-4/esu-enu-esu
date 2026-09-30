# Adding a New Language

This guide explains how to add a new language to the app. It uses Chinese (`zh`) as the example.

## Overview

| Step | What you do | File |
|---|---|---|
| 1 | Choose the language code | - |
| 2 | Create the translation file | `src/lib/i18n/locales/<code>.json` |
| 3 | Register the language | `config.ts`, `index.ts`, Settings dropdown |
| 4 | Run the translation check | `pnpm check:i18n` |
| 5 | Test in the app | - |

## 1. Choose the language code

Use the two-letter **language** code ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes)), **not** a country code.

| Language | Correct | Wrong |
|---|---|---|
| Khmer | `km` | `kh` |
| Japanese | `ja` | `jp` |
| Chinese | `zh` | `cn` |

Browsers send language codes in the `Accept-Language` header (for example `ja-JP,ja;q=0.9`). The app matches only the base part (`ja`), so a wrong code will never be detected.

> **Regional variants:** the app currently matches only the base language code,
> so variants such as `zh-CN` (Simplified) and `zh-TW` (Traditional) are treated as one language (`zh`).

## 2. Create the translation file

1. Copy `src/lib/i18n/locales/en.json` to `src/lib/i18n/locales/zh.json`.
2. Translate the **values** only. **Never change the keys.**

```json
{
  "auth": {
    "login": "登录"
  }
}
```

`en.json` is the **reference file**. Every other language file must contain exactly the same keys as `en.json`.

## 3. Register the language

1. Add the code to `SUPPORTED_LANGS` in `src/lib/i18n/config.ts`:

```ts
   export const SUPPORTED_LANGS = ['en', 'km', 'ja', 'zh'] as const;
```

2. Register the file in `src/lib/i18n/index.ts`:

```ts
   register('zh', () => import('./locales/zh.json'));
```

3. Add the language's display name, written in that language, to the language dropdown in Settings (for example `中文`).

The language detection uses SUPPORTED_LANGS, so the new language must be added to this list.

## 4. Run the translation check

```bash
pnpm check:i18n
```

The same check runs automatically before every build, so a broken translation cannot be published.

| Result | Meaning | What to do |
|---|---|---|
| `✔ All translation files are valid and complete.` | Everything is fine | Nothing |
| `✖ zh.json: invalid JSON` | Syntax error (a missing or extra comma, for example) | Fix the file named in the message |
| `✖ zh.json: missing N key(s)` | The file lacks keys that `en.json` has | Add the listed keys. The build fails until you do |
| `⚠ zh.json: N extra key(s)` | The file has keys that `en.json` does not | Remove them unless intentional. This is only a warning |

## 5. Test in the app

1. Start the app and switch to the new language in **Settings**.
2. Reload the page and confirm the text is still in the new language.
3. Open your browser's dev tools and check that the page has `<html lang="zh">`.

## Adding a new translation key later

1. Add the key to `en.json` first.
2. Add the same key to **every** other language file.
3. Run `pnpm check:i18n`. It fails until all files contain the new key.

Key naming rules:
- Group keys by feature: `auth.login`, `post.like`, `profile.edit`.
- Use English identifiers as keys, not full sentences.
- Do not rename or delete existing keys without updating every language file and every component that uses them.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| The build fails with a missing-key error | A language file is missing keys that `en.json` has. Read the list in the error output |
| The new language never appears in the dropdown | The code was not added to `SUPPORTED_LANGS` |
| The app always shows English | The language file is not registered in `index.ts`, or the code is wrong (`cn` instead of `zh`) |
| A key shows as `auth.login` on screen | The key is missing from the language file, or the app fell back to the default language |