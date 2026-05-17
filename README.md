<p align="center">
  <img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/chatgpt.webp" alt="chatgpt" width="80" height="80" />
</p>
<h1 align="center">gptcapture</h1>
<p align="center">Export your ChatGPT chat data from <a href="https://chatgpt.com">chatgpt.com</a></p>

<p align="center">Related: export your Claude.ai chat data > https://github.com/vdutts7/claudecapture/</p>

---

<table>
  <tr>
    <td valign="top" width="33%">
      ❌ <strong>What ChatGPT export your data gives you:</strong><br/>
      <a href="examples/settings-export.schema.json"><code>examples/settings-export.schema.json</code></a><br/>
      <img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1781134527/gh-repos/gptcapture/gptcapture-eyecatcher-settings-export.png" alt="settings export skeleton" width="100%" />
    </td>
    <td valign="top" width="33%">
      ❌ <strong>Copy-paste from browser:</strong><br/>
      <a href="examples/naive-dom-rip.one-turn.txt"><code>examples/naive-dom-rip.one-turn.txt</code></a><br/>
      <img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1781134526/gh-repos/gptcapture/gptcapture-eyecatcher-dom-rip.png" alt="naive DOM rip skeleton" width="100%" />
    </td>
    <td valign="top" width="33%">
      ✅ <strong>This repo:</strong><br/>
      <a href="examples/gptcanonical.one-turn.json"><code>examples/gptcanonical.one-turn.json</code></a><br/>
      <img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1781134527/gh-repos/gptcapture/gptcapture-eyecatcher-canonical.png" alt="gptcanonical skeleton" width="100%" />
    </td>
  </tr>
</table>

## Issue

**Basic ChatGPT settings export your data is broken ❌**:

- settings export broken (`ChatGPT` > `Settings` > `Data controls` > `Export data`)
  - minimal, missing fields
  - artificially diluted
  - basically useless

**"Just copy-paste from browser bro"**: 
> no
> multiple failure modes of `Cmd+A`, `Cmd+C`

| failure | symptom | detail |
|---|---|---|
| ❌ format broken immediately | LLM markdown fences | stored with ` ```markdown `; copy-paste -> plaintext i.e. ` ```text ` |
| | bold/italic/special formatting | like **example** / *example* -> plaintext |
| | message blob | user + ai messages -> one garbled monologue, not a conversation |
| | HTML/JS noise | headers, footers, ui components, labels in output |
| | code detail loss | missing backticks, newline chars |
| | reformatting waste | error surface expands |
| ❌ react SPA dynamic rendering = page hiding what you copy | DOM vs store | react paint over loader/api `mapping` tree, not conversation store |
| | mounted snapshot only | copy-paste reads DOM paint- no tree, no metadata, no hidden turns |
| | hydration async | still streaming |
| | grab too early | partial thread; mid-token answer in clipboard |
| | virtualized scroll | off-screen messages unmounted from DOM (the "hiding") |
| | long threads | thread longer than 4 messages -> immediate message loss |
| ❌ semantic payload missing = rendered transcript only | clipboard vs canonical | painted chat text- not canonical `mapping` json (see `examples/gptcanonical.schema.json`) |
| | thread-level fields gone | `moderation_results`, `safe_urls`, `default_model_slug` |
| | | `is_archived`, `is_temporary_chat`, timestamps, `conversation_id` |
| | tree structure gone | `parent`/`children` links- branch edits, regeneration siblings, alternate paths |
| | | system/tool turns that never render as user-visible bubbles |
| | per-message fields gone | `content_type` + `parts[]` beyond final markdown i.e. code, tool payloads, non-text blocks |
| | | `status`, `end_turn`, `author.role`, `author.metadata` |
| | | `metadata.message_type`, `request_id`, other node metadata |
| | thinking/reasoning/collapsed blocks | UI may hide entirely; copy-paste never sees them even when canonical json has the turn |
| | moderation/safety state | flagged, restricted, censored signals live in json metadata- not in plaintext rip |

> see `examples/naive-dom-rip.stub.txt` for sample

> `gptcanonical` + `gptcapture` bypass DOM- pull from loaders/API

## Solution

| path | tool | flow | output |
|---|---|---|---|
| A | `gptcanonical.sh` | chat url → backend-api url → paste in logged-in browser | canonical API json (`https://chatgpt.com/backend-api/conversation/7k2m9p4n-a8f3-4c71-b2e6-9d1a5f803c42`) |
| B | `gptcapture.js` | run on open chat page | `summer-roadtrip-notes.fidelity.json.gz` (router dump) |

## Setup

```bash
chmod +x gptcanonical.sh
```

Prereqs:

- [ ] logged into `https://chatgpt.com` in same browser where you enter new url
> why? session cookies gate canonical url

> note: API keys do NOT work here

## Usage

| path | do this | get this |
|---|---|---|
| A | run `gptcanonical.sh` with chat url | json from canonical API (paste backend url in logged-in browser) |
| B | run `gptcapture.js` on chat page | gzipped fidelity export, then gunzip |

### Path A · `gptcanonical.sh`

```bash
# chat url → script prints backend-api url → paste in browser → json
./gptcanonical.sh https://chatgpt.com/c/7k2m9p4n-a8f3-4c71-b2e6-9d1a5f803c42
```

### Path B · `gptcapture.js`

```js
// on chat page https://chatgpt.com/c/3b8e1f6a-92d4-4c05-8f17-6a2e9d704b51
// auto-downloads summer-roadtrip-notes.fidelity.json.gz
```

```bash
gunzip -k summer-roadtrip-notes.fidelity.json.gz
```

## Output shapes

| method | example |
|---|---|
| settings export (one turn) | `examples/settings-export.schema.json` |
| naive DOM rip (one turn) | `examples/naive-dom-rip.one-turn.txt` |
| gptcanonical (one turn) | `examples/gptcanonical.one-turn.json` |
| naive DOM rip (full) | `examples/naive-dom-rip.stub.txt` |
| gptcanonical (full) | `examples/gptcanonical.schema.json` |
| gptcapture (full) | `examples/gptcapture-fidelity.schema.json` |

**`gptcanonical`**- Conversation object:
  - `title`, timestamps, `conversation_id`
  - `mapping` tree- `author`, `content.parts`, `metadata`, parent/child links

**`gptcapture`**- Router dump:
  - `table`:
    - dehydrated export layer
    - key = raw stream indices- debug hydration only; not for reading messages
  - hydrated `loaderData`
  - `serverResponseData` mirrors canonical `mapping` when route resolves

## ⚠️ Gotchas

| problem | fix | stability | why |
|---|---|---|---|
| session cookies expire | refresh `chatgpt.com`; retry on 401 | 7/10 | normal session churn; manual refresh works |
| canonical URL needs auth | paste in same logged-in browser- not public API | 8/10 | by design; fails logged out or wrong profile |
| `gptcapture.js` parses inline stream script | may break if ChatGPT changes bootstrap | 4/10 | scrapes page internals- no stable contract |
| `_mapping_nodes: 0` | reload chat; re-run after hydration | 6/10 | race with async loader; retry usually works |

## Next steps

- [ ] browser extension- native canonical url access via host permissions + cookies
  - skips hydration + manual copy-paste dance

## Contact

<a href="https://vd7.io"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910810/readme-badges/readme-badge-vd7.png" alt="vd7.io" height="40" /></a>
<a href="https://x.com/vdutts7"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910817/readme-badges/readme-badge-x.png" alt="/vdutts7" height="40" /></a>
