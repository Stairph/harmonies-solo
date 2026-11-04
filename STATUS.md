# STATUS - harmonies-solo

> Live state. The single source of where this project stands. Every agent reads it,
> does its part, updates it, and hands back to the orchestrator (Steph).
> This holds TECHNICAL phase state only. External obligations (deadlines, who's waiting)
> belong in `Work/task-tracker/`, not here. Don't let this grow into a second tracker.

## Phase

`review` (small path, relay skipped). v1 published as a private artifact; v1.1 (spirits) republished 2026-11-02 to the same link with Steph's approval (version 2).

> State machine: intake -> scoped -> building -> testing -> (fail -> building) -> review -> done
> `review` is the governance gate (see PREFLIGHT.md). Nothing leaves the machine before it passes.
> Small-path escape hatch: for trivial work the orchestrator may skip the relay and do it
> directly. Note it here if so: "small path, relay skipped". The gate is NOT skippable for any push.

## Gate (filled at review, before any push)

- v1 (2026-11-01): SCAN pass with warnings (no lockfile, expected). REVIEW pass: no secrets, no work content, no network calls, no card art. Published as a PRIVATE claude.ai artifact with Steph's approval: https://claude.ai/artifact/1WvkPoec4H4DDvR3RBm5ar. No git remote.

- v1.1 (2026-11-02): SCAN pass with warnings (no lockfile, expected). REVIEW pass: no secrets, no network calls, no card art (spirits drawn as hex patterns plus a text rule). Republished with Steph's approval (version 2).

> A push is a Tattoo. Both halves must pass, then Steph approves. See PREFLIGHT.md.

- SCAN: <pass | warn | fail>  (output of `./preflight.sh <project>`, pasted or summarized)
- REVIEW: <pass | fail>  (judgment checklist in PREFLIGHT.md)
- one-line why: <...>

## Open defects

> The Breaker fills this on a FAIL. Each defect: what I did / what happened / what I expected / where.
> The Maker clears them on fix. Empty when phase is testing-clean or beyond.

- none yet

## Decisions log

> Append-only. Date each entry. Why a thing was done the way it was.

- 2026-11-01: project created with new-project.sh. Sources: rule book PDF (text via PDFKit; scoring tables read from a high-res render of p.8-9), `Animal Cards.pdf` (32 photos, transcribed to `cards.md`; cards 6, 8, 9, 21 verified by Steph), board photos for sides A and B (Steph, in chat). Spirit cards (`Spirit Cards.pdf`) not read yet: v1.1. Source PDFs stay in ~/Downloads, never in the repo.
- 2026-11-01: BRIEF approved by Steph. Built v1: `index.html` (engine between ENGINE START/END markers, UI below) and `test.js` (`node test.js`). 10,988 checks pass: 23/25 spaces, all 32 cards connected and fitting in all 6 rotations and refusing a broken habitat or an occupied target, building on any base, every legal/illegal stack, river 5/6/7 with a branch and a shortcut, 4 islands = 20, min 1 island, trees/mountains/fields/buildings, animal ladder, suns (130/A = 8), 200 random full games end on a rule with cubes on board = cubes off cards.
- 2026-11-01: Chrome test. A full UI game ran to the end with no JS errors; the result sheet and log saved. Cube placement by tap works; a wrong spot is refused with a message; undo reverts it. 360 px: no sideways scroll, 4 open cards in a 2x2 grid. Fixed: a global named `history` shadowed `window.history` and stopped every redraw (renamed `undoStack`). Not tested: real phone, light mode.
- Rule reading: the pouch end triggers when a refill can't fill all 3 spaces (from 111 after setup, 9 per turn, that is after turn 12). The board usually ends the game first.
- 2026-11-02: Steph tested v1 on the phone: "looks good". Built v1.1 Nature's Spirit cards: 10 spirits (table in `cards.md`), setup deals 2 and you keep 1 (or play without), spirit counts toward the 4 open cards until its cube is placed, scores only if placed (live panel shows what it would score), suns +2/+1/+0. 11,227 checks pass, incl. the rule book Lion example (14) and Pauline's suns (130, A, Lion = 7). Chrome 360 px: choose spirit, full game to the result sheet, log records the spirit, no errors. Open: Turtle habitat and rule are medium confidence.
- Rotations only, no mirrors (none of the 32 shapes is chiral).

## Handoff notes

- 2026-11-04: v2 Spirit Lab scoped in BRIEF.md (perfect draws, Steph's choice). BRIEF approved by Steph; v1.1 pushed to private repo Stairph/harmonies-solo. Push: private GitHub repo (Steph's choice). Preflight scan 2026-11-04: PASS with warnings (no lockfile).

> The current holder leaves the next role what they need. Overwrite each handoff.

- To Steph: play v1.1 with spirits; check the Turtle card (S3) against the physical card.
