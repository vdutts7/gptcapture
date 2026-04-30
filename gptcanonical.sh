#!/usr/bin/env zsh

gptcanonical() {
  local raw="${1:-$(pbpaste)}"
  local cid
  cid=$(echo "$raw" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | tail -1)
  [[ -z "$cid" ]] && {
    echo "🔴 usage: gptcanonical <chat-id-or-url>  (or copy one first)"
    return 1
  }
  echo "https://chatgpt.com/backend-api/conversation/${cid}" | pbcopy
  echo "🟢 ${cid} -> copied. paste in address bar."
}

gptcanonical "$@"
