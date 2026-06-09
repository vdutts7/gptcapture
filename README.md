<div align="center">

<img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/vd7.webp" alt="logo" width="80" height="80" />

<h1>gh-template</h1>
<p><i><b>Agent-first GitHub repo template with extensive AI agent configs, agent-traversable template files (machine-readable "machreadified", non-prose), git hooks, automation scripts, asset management, metadata sanitzation</b></i></p>

<a href="https://github.com/vdutts7/gh-template"><img src="./assets/badges/github.badge.svg" alt="GitHub" height="34" /></a> &nbsp; 


</div>

<br/>


## Structure

```
.hooks/
├── pre-commit              ← em-dash policy + metadata strip
├── pre-push                ← Touch ID gate (shelllock) + health check (large files, embedded repos)
├── post-checkout           ← `.gitconfig` include (hooks path)
└── scripts/
    ├── setup.sh            ← one-time setup after clone
    ├── set-remote.sh       ← set origin from repo.config.json (remote.prefer / origin_url)
    ├── clearmeta.sh
    ├── gen-social.sh
    ├── health-check.sh
    └── upload-cloudinary.sh
.github/
└── templates/
    ├── README.template.md 
    ├── TODOs.template.md       ← copy to root → TODOs.md
    ├── _0/                     ← copy to root (cp -r) → gitignored working dir (_archive, _artifacts, _plans)
    ├── .gitignore.template     ← mega gitignore (set & forget)
    ├── timeline.template.json  ← project timeline/milestones
    └── [agent configs]/        ← aider, claude, codex, cursor, etc.
.gitconfig                  ← repo-level git config (core.hooksPath)
git-template/               ← optional: Git init template (post-checkout reminder after clone)
├── hooks/
│   └── post-checkout       ← prints "Run .hooks/scripts/setup.sh" until setup is run
assets/
├── icons/
│   └── agents/                 
└── social-preview-blank.png    ← social preview (1280x640)
repo.config.json 
```

`.github/` is almost entirely **templates** you copy out (no Actions/workflows here). Forge-agnostic; GitHub-only where a tool expects it (e.g. Copilot → `.github/copilot-instructions.md`).

<br/>

## Setup

```bash
# create repo from template in GitHub UI
# clone + activate hooks
git clone <your-repo-url> && cd <path-to-your-repo>
.hooks/scripts/setup.sh

# edit repo.config.json (project details)
cp ".github/templates/.gitignore.template" ".gitignore"
cp ".github/templates/timeline.template.json" "timeline.json" # agents auto-extend this
cp ".github/templates/TODOs.template.md" "TODOs.md"
cp -r ".github/templates/_0" .


# replace this README with your project README (run only when done with setup)
cp .github/templates/README.template.md README.md  
# then replace placeholders (see "Template copy & placeholders" below)
```

> **Step 2 is mandatory** - hooks don't activate until you run `setup.sh`.

### Remote (SSH vs HTTPS)

In `repo.config.json`, set **`remote`** to control `origin`:

| Key | Values | Effect |
|-----|--------|--------|
| `prefer` | `"ssh"` | Set origin to `git@host:slug.git` (default; use when SSH is set globally). |
| `prefer` | `"auto"` | Leave current URL as-is. |
| `prefer` | `"https"` | Set origin to `https://host/slug.git`. |
| `origin_url` | `"git@github.com:user/repo.git"` or any URL | Overrides; use this to pin exact URL. |

Default is **`ssh`** so repos created from this template match a global SSH preference (e.g. `git config --global url.git@github.com:.insteadOf https://github.com/`). After editing, run **`.hooks/scripts/set-remote.sh`** (or re-run `setup.sh`).

<br/>

## Included

### Agent configs

| | Agent | Files | Site |
|:---:|-------|-------|------|
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/cursor.webp) | Cursor | `.cursor/rules/*.mdc`, `.cursorignore` | [cursor.com](https://www.cursor.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/copilot.webp) | Copilot | `.github/copilot-instructions.md` | [GitHub Copilot](https://github.com/features/copilot) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/claude.webp) | Claude | `CLAUDE.md` | [anthropic.com](https://www.anthropic.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/gemini.webp) | Gemini | `GEMINI.md` | [ai.google.dev](https://ai.google.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/codex.webp) | Codex | `AGENTS.md` | [openai.com](https://openai.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/codeium.webp) | Windsurf | `.windsurfrules` | [codeium.com](https://codeium.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/mistral.webp) | Mistral | `.vibe/config.toml` | [mistral.ai](https://mistral.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/cline.webp) | Cline | `.clinerules/*.md` | [cline.dev](https://cline.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/aider.webp) | Aider | `.aider.conf.yml`, `CONVENTIONS.md` | [aider.chat](https://aider.chat) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/devin.webp) | Devin | `devin.md` | [devin.ai](https://devin.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/replit.webp) | Replit | `.replit` | [replit.com](https://replit.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/continue.webp) | Continue | `.continue/config.json` | [continue.dev](https://continue.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/tabnine.webp) | Tabnine | `.tabnine/` | [tabnine.com](https://tabnine.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/cody.webp) | Cody | `.sourcegraph/` | [sourcegraph.com](https://sourcegraph.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/jetbrains-ai.webp) | JetBrains AI | `.aiassistant/rules/*.md` | [jetbrains.com/ai](https://www.jetbrains.com/ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/amazonq.webp) | Amazon Q | `.amazonq/rules/*.md` | [AWS Amazon Q](https://aws.amazon.com/q) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/codeium.webp) | Codeium | `.codeiumignore` | [codeium.com](https://codeium.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/geminicli.webp) | Gemini CLI | `GEMINI.md`, `.gemini/settings.json` | [geminicli.com](https://geminicli.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/v0.webp) | v0 | `v0.json` | [v0.dev](https://v0.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/bolt-new.webp) | Bolt | `bolt.json` | [bolt.new](https://bolt.new) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/lovable.webp) | Lovable | `lovable.json` | [lovable.dev](https://lovable.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/coderabbit.webp) | CodeRabbit | `.coderabbit.yaml` | [coderabbit.ai](https://coderabbit.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/codegen.webp) | Codegen | `AGENTS.md` | [codegen.com](https://codegen.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/sweep.webp) | Sweep | `sweep.yaml`, `SWEEP.md` | [sweep.dev](https://sweep.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/roocode.webp) | Roo | `.roomodes` | [roo.codes](https://roo.codes) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/augment.webp) | Augment / Auggie | `.augment/`, `.augment/commands/` | [augmentcode.com](https://www.augmentcode.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/junie.webp) | Junie | `.junie/AGENTS.md`, `.junie/guidelines.md`, `.junie/skills/`, `.junie/mcp/mcp.json` | [junie.jetbrains.com](https://junie.jetbrains.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/supermaven.webp) | Supermaven | `.supermaven/` | [supermaven.com](https://supermaven.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/warp.webp) | Warp | `warp.md` | [warp.dev](https://www.warp.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/zed.webp) | Zed | `.rules` | [zed.dev](https://zed.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/void.webp) | Void | `.voidrules`, `.void/rules/` | [voideditor.com](https://voideditor.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/aide.webp) | Aide | `.aide/` | [aide.dev](https://aide.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/goose.webp) | Goose | `.goosehints` | [goose.ai](https://goose.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/amp.webp) | Amp | `AMP.md` | [useamp.com](https://useamp.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/trae.webp) | Trae | `.trae/project_rules.md`, `.trae/user_rules.md` | [gettrae.com](https://gettrae.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/kiro.webp) | Kiro | `.kiro/steering/` | [kiro.ai](https://kiro.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/graphite.webp) | Graphite | `.graphite/` | [graphite.com](https://graphite.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/greptile.webp) | Greptile | `.greptile/` | [greptile.com](https://greptile.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/swe-agent.webp) | SWE-agent | `.swe-agent.yaml` | [swe-agent.com](https://swe-agent.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/openhands.webp) | OpenHands | `.openhands/`, `.agents/skills/`, `AGENTS.md` | [openhands.dev](https://openhands.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/mentat.webp) | Mentat | `.mentat/` | [mentat.ai](https://mentat.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/pieces.webp) | Pieces | `.pieces/` | [pieces.app](https://pieces.app) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/capy-ai.webp) | Capy | `.capy/` | [capy.ai](https://capy.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/tonkotsu.webp) | Tonkotsu | `.tonkotsu/` | [tonkotsu.ai](https://tonkotsu.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/sourcery.webp) | Sourcery | `.sourcery.yaml` | [sourcery.ai](https://sourcery.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/qodo.webp) | Qodo | `.qodo/` | [qodo.ai](https://www.qodo.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/blackbox.webp) | Blackbox | `.blackbox/` | [blackbox.ai](https://blackbox.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/pearai.webp) | Pear AI | `~/.pearai/config.json` | [pear.ai](https://pear.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/droid.webp) | Droid | `.droid.yaml` | [droid.ai](https://droid.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/opencode.webp) | OpenCode | `opencode.json` | [opencode.ai](https://opencode.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/kilo.webp) | Kilo | `.kilocode/launchConfig.json` | [kilocode.com](https://kilocode.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/qwen.webp) | Qwen CLI | `.env`, `.qwen-ignore` | [qwen.ai](https://qwen.ai) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/kimi.webp) | Kimi CLI | `AGENTS.md` | [moonshot.cn](https://www.moonshot.cn) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/qoder.webp) | Qoder | `.qoder/` | [qoder.com](https://qoder.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/traycer.webp) | Traycer | `.traycer/` | [traycer.com](https://traycer.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/conductor.webp) | Conductor | `conductor.json` | [conductor.com](https://conductor.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/antigravity.webp) | Antigravity | `.antigravity` | [antigravity.dev](https://antigravity.dev) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/superset.webp) | Superset | `.superset/config.json` | [superset.com](https://superset.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/zencoder.webp) | Zencoder | `.zencoder/` | [zencoder.ai](https://zencoder.ai) |

### Git forges

| | Forge | Conventions | Site |
|:---:|-------|-------------|------|
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/github.webp) | GitHub | `.github/` (Actions, templates); Copilot → `.github/copilot-instructions.md` | [github.com](https://github.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/gitlab.webp) | GitLab | `.gitlab-ci.yml`, `.gitlab/` | [gitlab.com](https://gitlab.com) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/codeberg.webp) | Codeberg | Forgejo; same git + `.hooks/` workflow as this template | [codeberg.org](https://codeberg.org) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/gitea.webp) | Gitea | Self-hosted; optional `.gitea/` CI; `origin` is your host | [gitea.io](https://gitea.io) |
| ![](https://raw.githubusercontent.com/vdutts7/squircle/main/webp/bitbucket.webp) | Bitbucket | `bitbucket-pipelines.yml` | [bitbucket.org](https://bitbucket.org) |

### Template copy & placeholders

| | Template | Install to | Notes |
|:---:|----------|------------|-------|
| | `.github/templates/.gitignore.template` | `.gitignore` | |
| | `.github/templates/timeline.template.json` | `timeline.json` | |
| | `.github/templates/TODOs.template.md` | `TODOs.md` | |
| | `.github/templates/_0/` | `./_0/` | `cp -r`; gitignored scratch dirs |
| | `.github/templates/README.template.md` | `README.md` | when project README is ready |
| | `.github/templates/<agent>/` | see [Agent configs](#agent-configs) | e.g. `cp -r .github/templates/cursor/.cursor .` |

| | Token | Replace in | Notes |
|:---:|-------|------------|-------|
| | `PROJECT_NAME` | `repo.config.json` - `repo.name`, `social_preview.title` | |
| | `One-liner description` | `repo.config.json` - `repo.description` | |
| | `project-name`, tagline | `README.md` (from README.template) | same values as `PROJECT_NAME` / description |
| | `<REPO_URL>`, `<REPO_NAME>` | `README.md` - How to build | |
| | `owner.username`, `website`, `twitter` | `repo.config.json` - `owner` | |
| | `$REPO_OWNER`, `$REPO_TOKEN` | `repo.config.json` - `access_control` or `.env` | |
| | `$CLOUDINARY_*` | env or `repo.config.json` - `cloudinary` | |
| | `workflows.main_account` | `repo.config.json` - `workflows` | e.g. primary GitHub handle |

### Git hooks (platform-agnostic)

Hooks live in `.hooks/` (not `.github/hooks/`) - works with any git platform (GitHub, GitLab, Codeberg, Gitea, Bitbucket, self-hosted).

One-time setup after clone: `.hooks/scripts/setup.sh`

**Post-clone reminder (optional):** To see a terminal message after every clone reminding you to run `setup.sh`, set Git's template once per machine (from this repo): `git config --global init.templateDir "$(pwd)/git-template"`. Then every new clone of any repo created from this template will print the reminder until you run `.hooks/scripts/setup.sh`. The template dir can live anywhere; point `init.templateDir` at it.

| Hook | Trigger | What it does |
|------|---------|-------------|
| `pre-commit` | before commit | blocks unapproved em dashes, supports autofix/whitelist approval, strips file metadata |
| `pre-push` | before push | Touch ID gate when [shelllock](https://github.com/vdutts7/shelllock-macos) is installed (blocks AI push); then health check (large files, embedded repos) |
| `post-checkout` | after checkout | ensures repo `.gitconfig` include (hooks path) |

### Scripts

> usage instructions per script at top of file

| Script | Purpose |
|--------|---------|
| `setup.sh` | one-time setup after cloning (activates hooks) |
| `set-remote.sh` | set origin from repo.config.json (remote.prefer or origin_url) |
| `clearmeta.sh` | NUCLEAR metadata strip; note: Apple SIP-protected provenance may persist |
| `gen-social.sh` | generate social preview image |
| `health-check.sh` | pre-push health check |
| `upload-cloudinary.sh` | upload assets to Cloudinary (set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` env vars) |

Em-dash hook quick use:
- autofix flagged files: `EM_DASH_AUTOFIX=1 git commit ...`
- approve current matches to whitelist: `EM_DASH_APPROVE=1 git commit ...`
- optional custom fixer: `EM_DASH_FIXER=/path/to/fixer.sh git commit ...`

### timeline.json

- **Append-only** project memory
- timestamped ledger/makeshift database for full traceability/auditability
- AI agents extend `timeline.json` as you work (or manually invoke via `/timeline` slash command → `.github/templates/cursor/commands/timeline.md`)
> **Why:** Context persists across sessions → when you return to a project, agents can read timeline to understand what happened, what decisions were made, what's blocked


<br/>


## Contact

<a href="https://vd7.io"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910810/readme-badges/readme-badge-vd7.png" alt="vd7.io" height="40" /></a> &nbsp; <a href="https://x.com/vdutts7"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910817/readme-badges/readme-badge-x.png" alt="/vdutts7" height="40" /></a>

