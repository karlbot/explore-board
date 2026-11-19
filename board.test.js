import test from 'node:test'
import assert from 'node:assert/strict'
import { fill, inOrder, page, parseRequest, previewUrl } from './board.js'

const config = {
  title: 'Demo <board>',
  owner: 'Sam',
  repo: 'https://github.com/sam/demo',
  branch: 'gallery',
  reference: 'main',
  board: 'https://gallery-demo.example.dev',
  production: 'https://demo.example.dev',
  preview: 'https://{branch}-demo.example.dev',
}
const exploration = (slug, more = {}) => ({
  slug, dir: `explorations/${slug}`, title: slug, branch: slug, summary: '', updated: '2026-01-01', images: [], icons: [], ...more,
})

test('a branch previews at its name made safe for a host; the reference at the live site', () => {
  assert.equal(previewUrl(config, 'claude/Foo_bar'), 'https://claude-foo-bar-demo.example.dev')
  assert.equal(previewUrl(config, 'main'), 'https://demo.example.dev')
})

test('the reference comes first, then the newest', () => {
  const sorted = inOrder(config, [
    exploration('old', { updated: '2026-01-01' }),
    exploration('new', { updated: '2026-02-01' }),
    exploration('main', { updated: '2025-01-01' }),
  ])
  assert.deepEqual(sorted.map((e) => e.slug), ['main', 'new', 'old'])
})

test('a request is to all, or to the folders its first line names', () => {
  assert.deepEqual(parseRequest('2026-01-31-x.md', 'To: all\n\nDo it.\nNow.\n', ['a', 'b']), {
    id: '2026-01-31-x', to: ['a', 'b'], body: 'Do it.\nNow.',
  })
  assert.deepEqual(parseRequest('y.md', 'to: a , nobody\n\nHi', ['a', 'b']).to, ['a', 'nobody'])
})

test('instructions take the board\'s own names', () => {
  assert.equal(fill('{{owner}} at {{board}}, `{{branch}}`', config), 'Sam at https://gallery-demo.example.dev, `gallery`')
})

test('the page shows who has answered a request, and escapes what agents wrote', () => {
  const html = page(
    config,
    [
      exploration('a', { title: 'A <b>', answered: { ask: 'Done & pushed' }, images: ['01.webp'], icons: ['undo.svg'] }),
      exploration('b', { session: 'https://claude.ai/code/session_1' }),
    ],
    [{ id: 'ask', to: ['a', 'b', 'gone'], body: 'See https://example.com/x <now>' }],
  )
  assert.match(html, /<title>Demo &lt;board&gt;<\/title>/)
  assert.match(html, /✓ <a href="#a">A &lt;b&gt;<\/a>: Done &amp; pushed/)
  assert.match(html, /… <a href="#b">b<\/a>: <em>waiting<\/em>/)
  assert.match(html, /\? <code>gone<\/code>: no such folder/)
  assert.match(html, /<a href="https:\/\/example.com\/x">https:\/\/example.com\/x<\/a> &lt;now&gt;/)
  assert.match(html, /value="explorations\/a\/icons\/undo.svg" data-label="Icon &quot;undo&quot; from &quot;A &lt;b&gt;&quot;"/)
  assert.match(html, /href="https:\/\/claude.ai\/code\/session_1">Session/)
  assert.match(html, /href="https:\/\/github.com\/sam\/demo\/tree\/gallery\/explorations\/a">Files/)
  assert.doesNotMatch(html, /A <b>/)
})

test('an empty board says so, and loads no scripts', () => {
  const html = page(config, [], [])
  assert.match(html, /Nothing posted yet/)
  assert.doesNotMatch(html, /<script/)
})
