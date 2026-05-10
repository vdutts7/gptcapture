<p align="center">
  <img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/chatgpt.webp" alt="chatgpt" width="80" height="80" />
</p>
<h1 align="center">gptcapture</h1>
<p align="center">Export ChatGPT chat data from <a href="https://chatgpt.com">chatgpt.com</a></p>

---

## Issue

**Basic ChatGPT settings export my data is broken ❌**:

- settings export broken (`ChatGPT` > `Settings` > `Data controls` > `Export data`)
  - minimal, missing fields
  - artificially diluted
  - basically useless

**"Just copy-paste from browser bro"**:

- no; multiple failure modes of `Cmd+A`, `Cmd+C`:
  - ❌ format broken immediately:
    - LLM messages canonical markdown- stored with ` ```markdown ` fence; copy-paste -> plaintext i.e. ` ```text `
    - bold/italic/special formatting (like **example** / *example*) -> plaintext
    - user + ai messages blob into one garbled monologue, not a conversation
    - HTML/JS noise- headers, footers, ui components, labels in output
    - code present -> critical detail loss i.e. missing backticks, newline chars
      - reformatting waste -> error surface expands
  - ❌ react SPA dynamic rendering = page hiding what you copy:
    - DOM is react paint over loader/api `mapping` tree, not conversation store
      - copy-paste reads mounted snapshot only- no tree, metadata, hidden turns
    - hydration async; still streaming
      - grab too early -> partial thread; mid-token answer in clipboard
    - virtualized scroll- off-screen messages unmounted from DOM (the "hiding")
      - thread longer than 4 messages -> immediate message loss
  - ❌ semantic payload missing = rendered transcript only:
    - clipboard is painted chat text- not canonical `mapping` json (see `examples/gptcanonical.schema.json`)
    - thread-level fields gone
      - `moderation_results`, `safe_urls`, `default_model_slug`
      - `is_archived`, `is_temporary_chat`, timestamps, `conversation_id`
    - tree structure gone
      - `parent`/`children` links- branch edits, regeneration siblings, alternate paths
      - system/tool turns that never render as user-visible bubbles
    - per-message fields gone
      - `content_type` + `parts[]` beyond final markdown i.e. code, tool payloads, non-text blocks
      - `status`, `end_turn`, `author.role`, `author.metadata`
      - `metadata.message_type`, `request_id`, other node metadata
    - thinking/reasoning/collapsed blocks
      - UI may hide entirely; copy-paste never sees them even when canonical json has the turn
    - moderation/safety state
      - flagged, restricted, censored signals live in json metadata- not in plaintext rip

> see `examples/naive-dom-rip.stub.md` for sample

> `gptcanonical` + `gptcapture` bypass DOM- pull from loaders/API

## Two options

| | scope | purpose | output | details |
|---|---|---|---|---|
| `gptcanonical.sh` | one chat | canonical url helper | chat url -> API url -> browser paste -> json | `https://chatgpt.com/backend-api/conversation/{CONVERSATION_ID}` |
| `gptcapture.js` | one chat | browserscript | gzipped React Router download | |

## Setup

```bash
chmod +x gptcanonical.sh
```

Prereqs:

- logged into chatgpt.com in same browser where you enter new link
> session cookies gate canonical url
> API keys do NOT work

## Usage

**`gptcanonical.sh`**- copies canonical URL to clipboard; paste in address bar while logged in
```bash
./gptcanonical.sh <chat-id-or-url>
./gptcanonical.sh                    # clipboard via pbpaste
```

**`gptcapture.js`**- paste in DevTools on chat page (`https://chatgpt.com/c/...`); downloads `{title}.fidelity.json.gz`

```js
// DevTools → Console → paste gptcapture.js
// also on window.__GPTCAPTURE
```

```bash
gunzip -k conversation.fidelity.json.gz
```

## Output shapes

stub schemas (`****` redacted):

| method | example schema |
|---|---|
| naive DOM rip | `examples/naive-dom-rip.stub.md` |
| gptcanonical | `examples/gptcanonical.schema.json` |
| gptcapture | `examples/gptcapture-fidelity.schema.json` |

**`gptcanonical`**- Conversation object:
  - `title`, timestamps, `conversation_id`
  - `mapping` tree- `author`, `content.parts`, `metadata`, parent/child links

**`gptcapture`**- Router dump:
  - dehydrated table + hydrated `loaderData`
  - `serverResponseData` mirrors canonical `mapping` when route resolves
  - `table` = raw stream indices- debug hydration only, not for reading messages

## Gotchas

- runtime traps:
  - session cookies expire- refresh chatgpt.com on 401
  - paste canonical URL same logged-in browser- not public API
  - fidelity export depends on stream script- may break if ChatGPT changes bootstrap
  - `_mapping_nodes: 0`- mapping not hydrated yet; reload and re-run

## Next steps

- [ ] browser extension- native canonical url access via host permissions + cookies
  - skips hydration + manual copy-paste dance

## Contact

<a href="https://vd7.io"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910810/readme-badges/readme-badge-vd7.png" alt="vd7.io" height="40" /></a>
<a href="https://x.com/vdutts7"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910817/readme-badges/readme-badge-x.png" alt="/vdutts7" height="40" /></a>
