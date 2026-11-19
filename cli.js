#!/usr/bin/env node
// explore-board build | instructions | init, run in a checkout of a project's board branch.
// README.md says what each is for.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fill, inOrder, page, parseRequest } from './board.js'

const here = (file) => new URL(file, import.meta.url)
const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i

const files = (dir, pattern) =>
  existsSync(dir) ? readdirSync(dir).filter((name) => pattern.test(name)).sort() : []

function config() {
  if (!existsSync('board.json')) throw new Error('No board.json here. Run this in the board branch, or `explore-board init` to start one.')
  return { branch: 'gallery', reference: 'main', ...JSON.parse(readFileSync('board.json', 'utf8')) }
}

const instructions = () => fill(readFileSync(here('INSTRUCTIONS.md'), 'utf8'), config())

function build() {
  const explorations = inOrder(
    config(),
    files('explorations', /^[^.]/)
      .filter((slug) => existsSync(`explorations/${slug}/meta.json`))
      .map((slug) => {
        const dir = `explorations/${slug}`
        return {
          slug,
          dir,
          ...JSON.parse(readFileSync(`${dir}/meta.json`, 'utf8')),
          images: files(dir, IMAGE),
          icons: files(`${dir}/icons`, /\.svg$/i),
        }
      }),
  )
  const slugs = explorations.map((e) => e.slug)
  const requests = files('requests', /\.md$/)
    .reverse()
    .map((name) => parseRequest(name, readFileSync(`requests/${name}`, 'utf8'), slugs))

  rmSync('dist', { recursive: true, force: true })
  mkdirSync('dist')
  if (existsSync('explorations')) cpSync('explorations', 'dist/explorations', { recursive: true })
  for (const script of ['compare.js', 'pick.js']) cpSync(here(`client/${script}`), `dist/${script}`)
  writeFileSync('dist/instructions.md', instructions())
  writeFileSync('dist/index.html', page(config(), explorations, requests))
  console.log(`${explorations.length} explorations, ${requests.length} requests`)
}

// A new board's files: never over one that's there.
function init() {
  for (const name of readdirSync(here('template'))) {
    const to = name.replace(/^_/, '.') // npm leaves .gitignore out of a package, so it's kept as _gitignore
    if (existsSync(to)) console.log(`${to}: already here, left alone`)
    else cpSync(here(`template/${name}`), to)
  }
  console.log('Now fill in board.json and README.md. Setting up the hosting is in explore-board\'s README.')
}

const commands = { build, init, instructions: () => console.log(instructions()) }
const command = commands[process.argv[2]]
if (!command) {
  console.error('Usage: explore-board build | instructions | init')
  process.exit(1)
}
try {
  command()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
