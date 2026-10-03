import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES_DIR = 'src/lib/i18n/locales'
const REFERENCE = 'en.json'

function flatten(obj, prefix = '') {
	return Object.entries(obj).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key
		return value && typeof value === 'object' ? flatten(value, path) : [path]
	})
}

function findPlaceholders(obj, prefix = '') {
	return Object.entries(obj).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key
		if (value && typeof value === 'object') return findPlaceholders(value, path)
		return typeof value === 'string' && /^\?{2,}$/.test(value) ? [path] : []
	})
}

let failed = false
const parsed = {}

for (const file of readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'))) {
	try {
		parsed[file] = JSON.parse(readFileSync(join(LOCALES_DIR, file), 'utf8'))
	} catch (err) {
		console.error(`${file}: invalid JSON (${err.message})`)
		failed = true
	}
}

if (!parsed[REFERENCE]) {
	console.error(`Reference file ${REFERENCE} is missing or invalid`)
	process.exit(1)
}

for (const [file, content] of Object.entries(parsed)) {
	const broken = findPlaceholders(content)
	if (broken.length) {
		console.error(`${file}: value(s) made only of "?" (encoding damage): ${broken.join(', ')}`)
		failed = true
	}
}

const refKeys = new Set(flatten(parsed[REFERENCE]))

for (const [file, content] of Object.entries(parsed)) {
	if (file === REFERENCE) continue
	const keys = new Set(flatten(content))

	const missing = [...refKeys].filter((k) => !keys.has(k))
	const extra = [...keys].filter((k) => !refKeys.has(k))

	if (missing.length) {
		console.error(`${file}: missing ${missing.length} key(s):\n  - ${missing.join('\n  - ')}`)
		failed = true
	}
	if (extra.length) {
		console.warn(`${file}: ${extra.length} extra key(s) not in ${REFERENCE}: ${extra.join(', ')}`)
	}
}

if (failed) process.exit(1)
console.log('All translation files are valid and complete.')
