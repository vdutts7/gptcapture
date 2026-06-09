#!/usr/bin/env bash
# Block commits that *increase* U+2014 em-dash count vs HEAD (index vs parent).
# Already-committed text is grandfathered; no per-line hash whitelist.
set -eo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DEFAULT_FIXER="/Users/vdog/.cursor/tools/parsing/fix-em-dashes.sh"
FIXER="${EM_DASH_FIXER:-$DEFAULT_FIXER}"

cd "$ROOT" || exit 1

git rev-parse --verify HEAD >/dev/null 2>&1 || exit 0

if [[ "${EM_DASH_APPROVE:-}" == "1" ]]; then
  echo "[pre-commit] em-dash check skipped (EM_DASH_APPROVE=1)"
  exit 0
fi

should_skip_path() {
  case "$1" in
    node_modules/* | .git/* | .cursor/tools/* | */fix-em-dashes*.sh | .hooks/em-dash-whitelist.txt) return 0 ;;
  esac
  return 1
}

count_em_dashes_stdin() {
  LC_ALL=C python3 -c "import sys; print(sys.stdin.buffer.read().decode('utf-8', errors='replace').count('\u2014'))"
}

count_em_in_object() {
  # HEAD:path may not exist (new file); git show would exit 128 and break the pipeline under pipefail.
  { git show "$1" 2>/dev/null || true; } | count_em_dashes_stdin
}

# If $1 is the new path of a cached rename/copy, print old path; else print nothing.
rename_old_path() {
  local new_path="$1"
  python3 -c '
import subprocess, sys
want = sys.argv[1]
raw = subprocess.check_output(["git", "diff", "--cached", "--name-status", "-z"])
parts = raw.split(b"\0")
i = 0
n = len(parts)
while i < n:
    while i < n and parts[i] == b"":
        i += 1
    if i >= n:
        break
    st = parts[i].decode(errors="replace")
    i += 1
    if i >= n:
        break
    p1 = parts[i]
    i += 1
    if st[:1] in ("R", "C"):
        if i >= n:
            break
        p2 = parts[i]
        i += 1
        if p2.decode("utf-8", errors="replace") == want:
            sys.stdout.write(p1.decode("utf-8", errors="replace"))
            sys.exit(0)
sys.exit(1)
' "$new_path" 2>/dev/null || true
}

run_autofix() {
  local file="$1"
  local tmp="${file}.emdashfix.$$"
  [[ -x "$FIXER" ]] || return 1
  "$FIXER" "$file" > "$tmp"
  if ! cmp -s "$file" "$tmp"; then
    mv "$tmp" "$file"
    git add -- "$file" 2>/dev/null || true
  else
    rm -f "$tmp"
  fi
}

is_binary_in_cached_diff() {
  local path="$1"
  local line
  line=$(git diff --cached --numstat -- "$path" 2>/dev/null | head -n 1)
  [[ "$line" == $'-\t-\t'* ]]
}

declare -a violators=()
declare -a violator_files=()

while IFS= read -r -d '' path; do
  [[ -z "$path" ]] && continue
  should_skip_path "$path" && continue

  [[ "$(git cat-file -t ":$path" 2>/dev/null)" == blob ]] || continue
  is_binary_in_cached_diff "$path" && continue

  new_count=$(count_em_in_object ":$path")
  old_path=$(rename_old_path "$path")
  if [[ -n "$old_path" ]]; then
    old_count=$(count_em_in_object "HEAD:$old_path")
  else
    old_count=$(count_em_in_object "HEAD:$path")
  fi

  if [[ "$new_count" -gt "$old_count" ]]; then
    violators+=("$path (em dashes: $old_count -> $new_count)")
    violator_files+=("$path")
  fi
done < <(git diff --cached -z --name-only --diff-filter=ACM 2>/dev/null || true)

if [[ ${#violators[@]} -eq 0 ]]; then
  exit 0
fi

echo ""
echo "[pre-commit] BLOCKED - staged changes add em dashes (U+2014) vs HEAD"
echo "Rule: do not increase em-dash count in touched files; use hyphen '-' instead."
echo ""
printf '%s\n' "${violators[@]}"
echo ""

if [[ "${EM_DASH_AUTOFIX:-}" == "1" && -x "$FIXER" ]]; then
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    run_autofix "$f" || true
  done < <(printf '%s\n' "${violator_files[@]}" | awk '!seen[$0]++')
  exec "$0"
fi

if [[ -t 0 && -x "$FIXER" ]]; then
  read -r -p "Run autofix on affected files now? [y/N]: " autofix_answer
  case "$autofix_answer" in
    y | Y | yes | YES)
      while IFS= read -r f; do
        [[ -z "$f" ]] && continue
        run_autofix "$f" || true
      done < <(printf '%s\n' "${violator_files[@]}" | awk '!seen[$0]++')
      exec "$0"
      ;;
  esac
fi

echo "Remove extra em dashes from the staged diff, or commit with EM_DASH_APPROVE=1 to bypass once."
exit 1
