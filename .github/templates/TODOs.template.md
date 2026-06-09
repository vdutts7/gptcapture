---
lifecycle:
  on_complete:
    action: move
    from: TODOs.md
    to: _0/_archive/TODOS.completed.md
    rule: |
      when: checkbox marked [x] or [X]
      do:
        1. remove line(s) from this file
        2. append to same heading section in _0/_archive/TODOS.completed.md
        3. preserve indentation and sub-items
---

# TODOs

**Local working dir** (gitignored): `_0/` with subdirs:
- `_0/_archive` — completed items moved from this file; runbooks, timelines, etc.
- `_0/_artifacts` — build/output artifacts, generated files
- `_0/_plans` — machine-readable plans, checklists, structure (e.g. machreadify-compliant YAML)

---

- **section-name**
   - [ ] first item
   - [ ] second item

---

**chores**:

- [ ] ...
- [ ] ...

---

**queue** (ideas / backlog):

- [ ] ...
- [ ] ...
