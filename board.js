// The board's page and the agents' instructions, as text. Nothing here touches the disk: cli.js does.

const esc = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// Where a branch's own preview is: the reference branch is the live site, and any other goes into
// the config's pattern the way Cloudflare names branch previews (lowercase; anything else a "-").
export const previewUrl = (config, branch) =>
  branch === config.reference
    ? config.production
    : config.preview.replace('{branch}', branch.toLowerCase().replace(/[^a-z0-9-]/g, '-'))

// The reference first; then the newest.
export const inOrder = (config, explorations) =>
  explorations.toSorted(
    (a, b) =>
      (b.branch === config.reference) - (a.branch === config.reference) ||
      String(b.updated).localeCompare(String(a.updated)),
  )

// A request's file: "To: all", or folder names with commas, then the request.
export function parseRequest(name, text, slugs) {
  const [to, ...body] = text.split('\n')
  const names = to.replace(/^to:/i, '').split(',').map((slug) => slug.trim()).filter(Boolean)
  return { id: name.replace(/\.md$/, ''), to: names.includes('all') ? slugs : names, body: body.join('\n').trim() }
}

// INSTRUCTIONS.md with the board's own names in place of {{title}}, {{owner}} and the rest.
export const fill = (template, config) => template.replace(/\{\{(\w+)\}\}/g, (_, key) => config[key])

// explorations: each its meta.json, with slug, dir, images and icons (file names). requests: parsed.
export function page(config, explorations, requests) {
  const files = `${config.repo}/tree/${config.branch}`

  const answer = (id, slug) => {
    const e = explorations.find((e) => e.slug === slug)
    if (!e) return `<li>? <code>${esc(slug)}</code>: no such folder</li>`
    const said = e.answered?.[id]
    return `<li>${said ? '✓' : '…'} <a href="#${esc(slug)}">${esc(e.title)}</a>: ${said ? esc(said) : '<em>waiting</em>'}</li>`
  }

  // What's been asked for, newest first, each with who it's to and what they've said.
  const requestList = requests.length
    ? `
<section id="requests">
  <h2>Requests</h2>
  ${requests.map((r) => `<article>
    <p class="meta"><code>${esc(r.id)}</code></p>
    <p class="ask">${esc(r.body).replace(/https?:\/\/[^\s<]+/g, '<a href="$&">$&</a>')}</p>
    <ul>${r.to.map((slug) => answer(r.id, slug)).join('')}</ul>
  </article>`).join('\n  ')}
</section>`
    : ''

  // A box to tick, for copying a pointer to this file (client/pick.js).
  const pick = (path, label) => `<input type="checkbox" name="pick" value="${esc(path)}" data-label="${esc(label)}">`

  const section = (e) => `
<section id="${esc(e.slug)}" data-slug="${esc(e.slug)}">
  <h2>${esc(e.title)}</h2>
  <p class="meta">
    <code>${esc(e.branch)}</code> · ${esc(e.updated)} ·
    <a href="${esc(previewUrl(config, e.branch))}">Open preview</a> ·
    <a href="${esc(`${files}/${e.dir}`)}">Files</a>${e.session ? ` ·
    <a href="${esc(e.session)}">Session</a>` : ''}
  </p>
  <p>${esc(e.summary)}</p>
  <div class="shots">
    ${e.images.map((name) => `<figure><a href="${esc(`${e.dir}/${name}`)}"><img loading="lazy" src="${esc(`${e.dir}/${name}`)}" alt="${esc(name)}"></a><figcaption><label>${pick(`${e.dir}/${name}`, `Screenshot "${name}" from "${e.title}"`)} ${esc(name)}</label></figcaption></figure>`).join('\n    ')}
  </div>
</section>`

  // One row per icon name, one column per exploration, so the same control's icons sit side by side.
  const withIcons = explorations.filter((e) => e.icons.length)
  const iconNames = [...new Set(withIcons.flatMap((e) => e.icons))].sort()
  const iconTable = iconNames.length
    ? `
<section id="icons">
  <h2>Icons side by side</h2>
  <div class="scroll"><table>
    <tr><th></th>${withIcons.map((e) => `<th data-slug="${esc(e.slug)}"><a href="#${esc(e.slug)}">${esc(e.title)}</a></th>`).join('')}</tr>
    ${iconNames.map((name) => `<tr><th>${esc(name.replace(/\.svg$/i, ''))}</th>${withIcons.map((e) => `<td data-slug="${esc(e.slug)}">${e.icons.includes(name) ? `<label><img loading="lazy" src="${esc(`${e.dir}/icons/${name}`)}" alt="${esc(name)}">${pick(`${e.dir}/icons/${name}`, `Icon "${name.replace(/\.svg$/i, '')}" from "${e.title}"`)}</label>` : ''}</td>`).join('')}</tr>`).join('\n    ')}
  </table></div>
</section>`
    : ''

  // Each exploration's link, with a box to tick for comparing it (client/compare.js).
  const nav = `
<nav>
  ${explorations.map((e) => `<span><input type="checkbox" name="compare" value="${esc(e.slug)}" aria-label="Compare ${esc(e.title)}"> <a href="#${esc(e.slug)}">${esc(e.title)}</a></span>`).join('\n  ')}
  ${iconTable && '<a href="#icons">Icons side by side</a>'}
  ${requestList && '<a href="#requests">Requests</a>'}
</nav>
<p class="meta"><span id="compareHint"></span> <button id="showAll" hidden>Show all</button></p>`

  const source = `From ${config.title} (each path is a file on the \`${config.branch}\` branch of ${config.repo})`

  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(config.title)}</title>
<style>
  :root { color-scheme: light dark; --line: color-mix(in srgb, currentColor 18%, transparent); }
  body { font: 16px/1.5 system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { margin: 0 0 4px; }
  section { border-top: 1px solid var(--line); margin-top: 32px; padding-top: 8px; }
  .ask { white-space: pre-wrap; overflow-wrap: anywhere; }
  article + article { border-top: 1px dashed var(--line); }
  .meta { opacity: 0.75; font-size: 14px; margin: -12px 0 0; }
  /* Columns, so a tall phone shot doesn't leave a gap beside the wide ones. */
  .shots { columns: 320px; column-gap: 12px; }
  .shots figure { break-inside: avoid; margin: 0 0 12px; font-size: 13px; }
  .shots img { display: block; width: 100%; border: 1px solid var(--line); border-radius: 6px; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid var(--line); padding: 8px 12px; text-align: center; font-size: 14px; }
  /* Icons drawn in currentColor come out black in an <img>, so their cells stay light. */
  td { background: #f4f1ec; }
  nav { display: flex; flex-wrap: wrap; gap: 4px 20px; margin-bottom: 20px; }
  /* Comparing: the ticked explorations in a column each, their screenshots one under another. */
  body.comparing { max-width: none; }
  .comparing main { display: grid; grid-template-columns: repeat(var(--picked), minmax(260px, 1fr)); gap: 0 24px; overflow-x: auto; }
  .comparing .shots { columns: 1; }
  td img { display: block; width: 48px; height: 48px; margin: 0 auto 4px; }
  td label { display: block; cursor: pointer; }
  td:has(:checked), figure:has(:checked) img { outline: 3px solid #1c3fb7; outline-offset: -3px; }
  /* What's been ticked, and the button that copies pointers to it all. */
  #picks { position: fixed; bottom: 12px; left: 50%; translate: -50%; display: flex; gap: 12px; align-items: center; white-space: nowrap;
    padding: 8px 14px; border: 1px solid var(--line); border-radius: 8px; background: Canvas; box-shadow: 0 4px 16px #0003; }
  #picks[hidden] { display: none; }
</style>
<h1>${esc(config.title)}</h1>
<p>Design directions from each branch. Tick screenshots and icons to copy pointers to them. To add one, see the
<a href="${esc(files)}#readme">README on the <code>${esc(config.branch)}</code> branch</a> and the
<a href="instructions.md">instructions for agents</a>.</p>
${explorations.length ? nav : '<p><em>Nothing posted yet.</em></p>'}
${requestList}
<main>${explorations.map(section).join('\n')}
</main>
${iconTable}
${explorations.length ? `<div id="picks" data-source="${esc(source)}" hidden><span id="pickCount"></span> <button id="copyPicks"></button> <button id="clearPicks">Clear</button></div>
<script type="module" src="compare.js"></script>
<script type="module" src="pick.js"></script>` : ''}
</html>
`
}
