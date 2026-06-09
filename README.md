<p align="center">
  <img src="https://raw.githubusercontent.com/vdutts7/squircle/main/webp/chatgpt.webp" alt="chatgpt" width="80" height="80" />
</p>
<h1 align="center">gptcapture</h1>
<p align="center">Export your ChatGPT chat data from <a href="https://chatgpt.com">chatgpt.com</a></p>

---

## Which tool

| | scope | run from | output |
|---|---|---|---|
| `gptcanonical.sh` | one chat | terminal | copies canonical API URL to clipboard |
| `gptcapture.js` | one chat | DevTools console | gzipped React Router fidelity dump |

`gptcanonical` hits the server-side conversation API - full message tree, metadata, hidden system turns, tool payloads. `gptcapture` rips the live page's React Router stream table - different data source, preserves loader hydration state.

Canonical API URL:
```
https://chatgpt.com/backend-api/conversation/{CONVERSATION_ID}
```

## Why not naive copy/paste?

Browser extensions and "save as markdown" flows usually DOM-scrape the visible page. That baseline is weak:

- sidebar, nav, chat history, and profile chrome get mixed into the export
- code fences break (`Bash` label instead of a proper fence)
- only rendered text survives - no message tree, metadata, or hidden turns
- virtualized scroll means off-screen messages may be missing entirely

See `examples/naive-dom-rip.stub.md` for a redacted sample of what that looks like.

`gptcanonical` and `gptcapture` bypass the rendered DOM and pull structured data from ChatGPT's own loaders/API.

## Setup

```bash
chmod +x gptcanonical.sh
```

Optional shell helper (source or add to your shell rc):

```bash
source ./gptcanonical.sh   # defines gptcanonical()
```

No API keys or org UUIDs required. You must be logged into chatgpt.com in the browser; session cookies gate the canonical URL.

## Usage

**`gptcanonical.sh`** - copies canonical URL to clipboard. Paste in address bar while logged in.
```bash
./gptcanonical.sh <chat-id-or-url>
./gptcanonical.sh                    # reads clipboard via pbpaste
```

**`gptcapture.js`** - paste in DevTools console on a chat page (`https://chatgpt.com/c/...`). Downloads `{title}.fidelity.json.gz`.

```js
// DevTools → Console → paste contents of gptcapture.js
// result also available as window.__GPTCAPTURE
```

Decompress:
```bash
gunzip -k conversation.fidelity.json.gz
```

## Output shapes

Stub schemas (values redacted with `****`):

| method | example schema |
|---|---|
| naive DOM rip | `examples/naive-dom-rip.stub.md` |
| gptcanonical | `examples/gptcanonical.schema.json` |
| gptcapture | `examples/gptcapture-fidelity.schema.json` |

**gptcanonical** returns the conversation object directly: `title`, timestamps, `conversation_id`, and a `mapping` tree of message nodes with `author`, `content.parts`, `metadata`, parent/child links.

**gptcapture** wraps the React Router dehydrated table plus hydrated `loaderData`. When the conversation route resolves, `serverResponseData` mirrors the canonical mapping. The `table` array is the raw stream indices - useful for debugging loader hydration, not for reading messages directly.

## Gotchas

- **Session cookies expire.** Refresh chatgpt.com if the canonical URL returns 401.
- **Paste the canonical URL in the same browser session** where you are logged in. It is not a public API endpoint.
- **Fidelity export depends on the stream script.** If ChatGPT changes their React Router bootstrap, `gptcapture.js` may need an update.
- **`_mapping_nodes: 0`** in a fidelity file usually means the conversation loader had not hydrated mapping yet - reload the chat and re-run.

## Contact

<a href="https://vd7.io"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910810/readme-badges/readme-badge-vd7.png" alt="vd7.io" height="40" /></a> &nbsp; <a href="https://x.com/vdutts7"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910817/readme-badges/readme-badge-x.png" alt="/vdutts7" height="40" /></a>
