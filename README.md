<p align="center">
  <img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/chatgpt.webp?v=1790340717" alt="chatgpt" width="80" height="80" />
</p>
<h1 align="center">gptcapture</h1>
<p align="center">Export your ChatGPT chat data from <a href="https://chatgpt.com">chatgpt.com</a></p>

<p align="center">Related: <a href="https://github.com/vdutts7/geminicapture">geminicapture</a></p>

---

<table>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/chatgpt.webp?v=1790340717" width="40" height="40" alt="ChatGPT" /></td>
    <td valign="top">
      ❌ <strong>What ChatGPT export your data gives you:</strong><br/>
      <a href="examples/settings-export.schema.json"><code>examples/settings-export.schema.json</code></a><br/>
      <img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1781134527/gh-repos/gptcapture/gptcapture-eyecatcher-settings-export.png?v=1790340717" alt="settings export skeleton" width="100%" />
    </td>
  </tr>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/chrome.webp?v=1790340717" width="40" height="40" alt="browser" /></td>
    <td valign="top">
      ❌ <strong>Copy-paste from browser:</strong><br/>
      <a href="examples/naive-dom-rip.one-turn.txt"><code>examples/naive-dom-rip.one-turn.txt</code></a><br/>
      <img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1781134526/gh-repos/gptcapture/gptcapture-eyecatcher-dom-rip.png?v=1790340717" alt="naive DOM rip skeleton" width="100%" />
    </td>
  </tr>
  <tr>
    <td valign="top"><img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/json.webp?v=1790340717" width="40" height="40" alt="JSON" /></td>
    <td valign="top">
      ✅ <strong>This repo:</strong><br/>
      <a href="examples/gptcanonical.one-turn.json"><code>examples/gptcanonical.one-turn.json</code></a><br/>
      <img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1781134527/gh-repos/gptcapture/gptcapture-eyecatcher-canonical.png?v=1790340717" alt="gptcanonical skeleton" width="100%" />
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

> `gptcapture.js` bypasses DOM- pulls conversation `mapping` from loaders/API

## Solution

Paste `gptcapture.js` in DevTools on an open chat. Downloads `YYYY-MM-DD_gpt_<slug>_<conversation_id>_<YYYYMMDD-HHMMSS>.zip` containing `<stem>/<stem>.json` (backend conversation shape; see `examples/gptcanonical.schema.json`).

## Usage

```js
// on chat page https://chatgpt.com/c/3b8e1f6a-92d4-4c05-8f17-6a2e9d704b51
// auto-downloads 2024-06-10_gpt_summer-roadtrip-notes_3b8e1f6a-92d4-4c05-8f17-6a2e9d704b51_20240610-153012.zip
```

Prereqs: logged into `https://chatgpt.com` on that page. API keys do NOT work here.

## Output shapes

| method | example |
|---|---|
| settings export (one turn) | `examples/settings-export.schema.json` |
| naive DOM rip (one turn) | `examples/naive-dom-rip.one-turn.txt` |
| gptcapture (one turn) | `examples/gptcanonical.one-turn.json` |
| naive DOM rip (full) | `examples/naive-dom-rip.stub.txt` |
| gptcapture (full) | `examples/gptcanonical.schema.json` |

Conversation object: `title`, timestamps, `conversation_id`, `mapping` tree (`author`, `content.parts`, `metadata`, parent/child links).

Filename: `YYYY-MM-DD_gpt_<slug>_<conversation_id>_<YYYYMMDD-HHMMSS>.zip` (inner path `<stem>/<stem>.json`; date from `create_time`). Debug: `window.__GPTCAPTURE`.

## ⚠️ Gotchas

| problem | fix | stability | why |
|---|---|---|---|
| session cookies expire | refresh `chatgpt.com`; retry on 401 | 7/10 | normal session churn; manual refresh works |
| `gptcapture.js` memory scan + network fallback | may break if ChatGPT changes in-memory shape | 6/10 | no stable contract; runtime fingerprint |
| empty / partial `mapping` | reload chat; re-run after hydration | 6/10 | race with async loader; retry usually works |

## Tools Used

<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black&v=1790340717" alt="JavaScript"/>

<br/>

## Contact

<a href="https://vd7.io"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910810/readme-badges/readme-badge-vd7.png?v=1790340717" alt="vd7.io" height="40" /></a>
<a href="https://x.com/vdutts7"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910817/readme-badges/readme-badge-x.png?v=1790340717" alt="/vdutts7" height="40" /></a>

