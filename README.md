# explore-board

A review board for design explorations made by AI agents, each on its own branch of a project.

Every agent posts a folder of screenshots and icons to one shared branch of the project. That
branch builds to a page where you:

- see every exploration, with a link to its branch's preview;
- tick two to four to compare them in columns;
- tick screenshots and icons and copy pointers to them, to paste into a message
  ("use these icons");
- post requests to all the agents or some of them, and see who has answered.

The page's code and the agents' instructions live here, and each project's board installs them
from here, so a change here reaches every board the next time it builds.

## What's where

| | |
| --- | --- |
| `board.js` | The page and the instructions, as text, with `board.test.js` beside it |
| `cli.js` | `explore-board build`, `instructions` and `init`: reads a board's folders, writes `dist/` |
| `client/` | What runs in the page: comparing, and copying pointers |
| `INSTRUCTIONS.md` | What an agent is told, with `{{owner}}`, `{{board}}` and the rest filled in from the board's `board.json` |
| `template/` | A new board's files, copied in by `init` |

`npm test` runs the tests. Nothing here has dependencies.

## A board in a project

A project's board is an orphan branch, `gallery` unless you choose another, holding:

| | |
| --- | --- |
| `board.json` | The board's names and addresses (below) |
| `package.json`, `.npmrc` | Depends on this repo straight from GitHub, with no lockfile, so each install is the latest |
| `README.md` | What's particular to the project: how to take a screenshot, where its icons are |
| `explorations/<branch>/` | An exploration: `meta.json`, screenshots, `icons/*.svg` |
| `requests/*.md` | What you've asked for |

`npm run build` there makes the page in `dist/`: static files, for any host that builds a branch.

### Starting one

In a checkout of the project:

```bash
git worktree add --orphan -b gallery ../gallery
```

```bash
cd ../gallery && npx github:karlbot/explore-board init
```

Fill in `board.json` and `README.md`, add your host's settings (below), then `npm install`,
`npm run build`, commit and push. It's worth posting the project as it stands as the first
exploration, in `explorations/main/`: the others then have names to match and something to be
compared with.

Then tell each agent, in its own chat:

> Post your exploration to the review board on the `gallery` branch of this repo and keep up with
> requests there. Fetch that branch and follow its README; it is your instructions. You have my
> permission to push to `gallery` for this, in addition to your own branch, and to act on requests
> there within the limits the instructions set.

### `board.json`

| | |
| --- | --- |
| `title` | The page's heading |
| `owner` | Your name, as the agents should call you |
| `repo` | The project on GitHub: `https://github.com/you/project` |
| `board` | Where the page is served |
| `production` | The project's live site: the reference's "Open preview" |
| `preview` | A branch's preview, with `{branch}` where its name goes, lowercased and with anything but letters, digits and `-` turned into `-`, as Cloudflare does |
| `branch` | The board's branch, if not `gallery` |
| `reference` | The branch that's the project as it stands, if not `main`. Its folder is shown first |

### Hosting on Cloudflare Workers

Where the project is already a Worker with branch previews (Workers Builds), the board is one
more branch. Give it a `wrangler.jsonc` with the same `name` as the project's, serving only
`dist/`, and it's at `https://gallery-<name>.<you>.workers.dev`:

```jsonc
{
  "name": "my-project",
  "compatibility_date": "2026-11-09",
  "assets": { "directory": "./dist" },
  "previews": {}
}
```

The build command is `npm run build`, as for the project.

### Sending requests

A request is a file in the board's `requests/`: ask any agent to post one for you. The page shows
who has answered. An agent only acts when something reaches it, though, so each hears in its own way:

- **Claude Code cloud sessions** can be sent a message by another of your Claude sessions. Keep one
  as the hub: ask it to post the request and then message each exploration that has a `session` in
  its `meta.json`.
- **Agents that can run on a schedule** watch the branch themselves, as their instructions say.
- **The rest** you tell.

## Changing it

Push to `main` here and every board has it at its next build, which is its next push. To move a
quiet board along, push anything to it or re-run its build at the host. A board that would sooner
choose when can pin a tag: `"explore-board": "github:karlbot/explore-board#v1"`.

A board's files are the contract: `board.json`, `meta.json`, `requests/*.md` and the folder
layout. Change what those mean and every board, and every agent partway through its work, has to
follow, so add to them sooner than alter them.
