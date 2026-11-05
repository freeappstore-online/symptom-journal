import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const root = new URL('../', import.meta.url)
const read = p => readFileSync(new URL(p, root), 'utf8')
const sdk = new URL('../web/node_modules/@freeappstore/sdk/dist/logger.js', import.meta.url)

test('HTML has no remote executable scripts', () => {
  assert.doesNotMatch(read('web/index.html'), /<script[^>]*src=["']https?:/i)
})

test('SDK logger collects nothing and cannot upload even with a session', async () => {
  // The real patched module is exercised, not a test-only mock logger.
  const { Logger } = await import(sdk.href)
  const previousWindow = globalThis.window
  const previousFetch = globalThis.fetch
  const previousStorage = globalThis.localStorage
  const calls = []
  globalThis.window = { addEventListener: () => calls.push('listener') }
  globalThis.localStorage = {
    getItem: () => { calls.push('read'); return null },
    setItem: () => calls.push('write'),
  }
  globalThis.fetch = async () => { calls.push('network'); throw Error('Unexpected upload') }
  let logger
  try {
    logger = new Logger('symptom-map', 'https://example.invalid', { token: 'test-session' })
    logger.info('private entry')
    logger.error('private error')
    logger._renderError('private render error', { stack: 'private', path: '/' })
    logger._api('POST', '/private', 500, 1, 'private error')
    await logger.flush()
    assert.deepEqual(logger.entries(), [])
    assert.deepEqual(calls, [])
  } finally {
    logger?.destroy()
    globalThis.window = previousWindow
    globalThis.fetch = previousFetch
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})
