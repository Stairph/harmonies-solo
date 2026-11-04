# Harmonies Solo

Solo Harmonies with a Spirit Lab that searches for the best board for each spirit card. Served by GitHub Pages like Harmonies Score: open https://stairph.github.io/harmonies-solo/ in Safari, then Share > Add to Home Screen.

Tests: `node test.js`, `node breaker-test.js`, `node lab-test.js` (about 1 minute; `--stability` adds rerun checks).

---

# How to run a Dev project

The Dev workstation is a lean two-person software shop with you as the founder. You are the
orchestrator. You have two "hires", defined as Claude Code subagents in `Dev/.claude/agents/`:

- **Maker** (`maker`): the founder-engineer. Scopes the BRIEF, then builds against it.
- **Breaker** (`breaker`): independent QA and review. Arrives with a fresh context and tries
  to break the build. The split exists for one reason: nobody can reliably check their own work
  inside the same context. Never collapse Maker and Breaker into one.

## Starting a project

1. **Scaffold it** from `Dev/`: `./new-project.sh <project-slug>` (lowercase-hyphen). This copies
   the template, runs `git init`, installs the pre-push governance hook, and seeds a `.gitignore`.
   Don't build in `_project-template/`, it's the master, and don't hand-copy it (you'd skip the
   hook install, which is exactly the rot the script prevents).
2. **Open Claude Code with `Dev/` as the working directory** so the agents in
   `Dev/.claude/agents/` are discoverable. (If you open Claude Code inside the project subfolder
   instead, point it at the Dev-level agents or copy `.claude/agents/` down into the project.)
3. **Tell the orchestrator the need.** It dispatches the Maker to scope `BRIEF.md`.

## The relay (what the orchestrator runs)

The phase in `STATUS.md` is the state machine:

```
intake -> scoped -> building -> testing -> (FAIL -> building) -> review -> done
```

- `intake -> scoped`: Maker writes BRIEF. You review and approve the scope.
- `scoped -> building -> testing`: Maker implements, hands to testing.
- `testing`: Breaker tests against BRIEF acceptance criteria. PASS advances; FAIL routes the
  defect list back to the Maker at `building`. This is the loop.
- `review -> done`: the governance gate (see `PREFLIGHT.md`). A pre-push hook runs the
  deterministic scan automatically and blocks a push on hard fail (override is a deliberate
  `git push --no-verify`). The judgment review and your approval are not mechanized, so anything
  leaving the machine is still a Tattoo, yours to approve, never the agents'.

## The escape hatch

For a 40-line script the full relay is theater. For trivial work, do it directly and write
"small path, relay skipped" in STATUS. Reserve the full relay for projects with real size or
risk. Add a third role (a dedicated Reviewer, or a Scoper split out of the Maker) only when you
can name the recurring bug that role would have caught. Don't pre-staff.

## Boundaries with the rest of the system

- Connectors: none. Dev is Work-grade by default (see `Dev/CLAUDE.md`), even for personal projects.
- Live obligations ("what's due, who's waiting") live in `Work/task-tracker/`, not in STATUS.
- Reusable knowledge a project throws off goes to `Work/ms-monday/` (rare for code).
