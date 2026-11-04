# STATUS - harmonies-solo

> Live state. The single source of where this project stands. Every agent reads it,
> does its part, updates it, and hands back to the orchestrator (Steph).
> This holds TECHNICAL phase state only. External obligations (deadlines, who's waiting)
> belong in `Work/task-tracker/`, not here. Don't let this grow into a second tracker.

## Phase

v2 Spirit Lab: `review` (Breaker retest PASS 2026-11-05; phone timing is Steph's check). v1.1: `review` (small path, relay skipped). v1 published as a private artifact; v1.1 (spirits) republished 2026-11-02 to the same link with Steph's approval (version 2).

> State machine: intake -> scoped -> building -> testing -> (fail -> building) -> review -> done
> `review` is the governance gate (see PREFLIGHT.md). Nothing leaves the machine before it passes.
> Small-path escape hatch: for trivial work the orchestrator may skip the relay and do it
> directly. Note it here if so: "small path, relay skipped". The gate is NOT skippable for any push.

## Gate (filled at review, before any push)

- v1 (2026-11-01): SCAN pass with warnings (no lockfile, expected). REVIEW pass: no secrets, no work content, no network calls, no card art. Published as a PRIVATE claude.ai artifact with Steph's approval: https://claude.ai/artifact/1WvkPoec4H4DDvR3RBm5ar. No git remote.

- v1.1 (2026-11-02): SCAN pass with warnings (no lockfile, expected). REVIEW pass: no secrets, no network calls, no card art (spirits drawn as hex patterns plus a text rule). Republished with Steph's approval (version 2).

- v2 Spirit Lab (2026-11-05): SCAN pass with warnings (no lockfile; remote visibility not auto-detected, confirmed private by anonymous API 404 on 2026-11-04). REVIEW pass: no secrets, no network calls (the Web Worker is built from the page's own code via a Blob), no card art, no work content; worst case is a wrong suggested board, low blast radius. Awaiting Steph's approval to push and republish.
- v2 + public (2026-11-05): Steph chose to make the repo public and serve it on GitHub Pages like harmonies-score (accepts card data going public; I flagged takedown risk). Added icon.png and inline manifest. Tests 11,227 / 55 / 58,811 pass. Rescan PASS WITH WARNINGS (no lockfile; visibility check can't auto-detect). Judgment review: no work terms or secrets in files or history; commit email matches the already-public repos. Pushed by Steph's go-ahead; Steph flips visibility and turns on Pages.

> A push is a Tattoo. Both halves must pass, then Steph approves. See PREFLIGHT.md.

- SCAN: <pass | warn | fail>  (output of `./preflight.sh <project>`, pasted or summarized)
- REVIEW: <pass | fail>  (judgment checklist in PREFLIGHT.md)
- one-line why: <...>

## Open defects

> The Breaker fills this on a FAIL. Each defect: what I did / what happened / what I expected / where.
> The Maker clears them on fix. Empty when phase is testing-clean or beyond.

Breaker retest 2026-11-05, v2 Spirit Lab. Verdict: **PASS**. Run: `node test.js` 11,227/0; `node lab-test.js` 58,811/0; `node breaker-test.js` 55/0 (line 18 now checks the amended 13 turns / 39 tokens). D1 closed: BRIEF amended to 13 / 39, engine runs 13. D2 closed: the storage harness with `setItem` throwing now shows the boards after the run (`LAB.mem`); control run also shows them. Results kept in memory are lost on reload when storage fails, which is expected. D3 closed: fallback step 0.8 s on this Mac, x10 = about 8 s, Stop answers between steps. Minor closed: key built from `LAB_VERSION`. Stability within 5% (A Lion 2.0%, B Turtle 3.6%, A Cat 2.5%) and the Chrome 360 px check were reported by the orchestrator; I did not rerun them. One worker job now times at 11.9 s here. Steph's check: a real run on the phone under 30 s.

First pass (kept for the record): **FAIL** (rules, scoring and replay are sound; the defects are in the UI path and the BRIEF).

What passed (all run, not assumed): `node test.js` 11,227/0; `node lab-test.js` 58,811/0 (20 spirit/side runs, every top board replays through the engine, claimed = engine score, pouch caps, 3 tokens a turn, correct end reason, both references beaten). New `node breaker-test.js` 54/1: fast scorer = engine on 6,000 edge-stack boards (B, BB, R, RR, KR, BR, K..KKK) incl. all spirit rules and card fits; every result in the full list (not only the top 3) has claimed = engine score and card points = engine animals; open cards never above 4 with the spirit counted; the worker source runs alone with no DOM. Code review: replay never lets an earlier turn reach 2 or fewer empty spaces (3 empties before the last turn by construction), cubes only go down when the target stack is final, engine enforces the rest.

- D1 (BRIEF conflict, Steph decides). BRIEF v2 says at most 12 turns / 36 tokens; the build uses 13 / 39. `node breaker-test.js turns`: the engine's `finishTurn` runs 13 turns before the pouch fails (111 after setup = 12 refills + 3 left). The build matches the engine; the BRIEF arithmetic is wrong. Expected: Steph amends the AC to 13 / 39, or the Maker caps at 12. Until then that AC is unmet as written.
- D2 (results lost when storage fails). Did: ran the Lab with `localStorage.setItem` throwing for the lab key (scratch vm harness; storage blocked or quota full). Happened: progress ends with "Done in N s" and the panel shows "Not run yet for this spirit and side." Expected: results shown. Where: `labFinish` saves the result and `labSheet`/`labClick board:` read it back only through `labCache()`; `save` swallows the error. Keep the last result in memory (`LAB`) and render from there.
- D3 (fallback path breaks the 30 s AC and freezes the page). Did: `node breaker-test.js timing`. One fallback step (`labSolve` 1 x 20,000) takes 2.7 s on this Mac, run 12 times = about 32 s before any phone slowdown, and each step blocks the main thread for the whole 2.7 s, so Stop does nothing until the step ends. Where: `labRun` else-branch. Expected: under 30 s, Stop responsive (smaller slices, or fewer steps).
- Minor: `LAB_KEY` is fixed at v1, so cached results from an older solver survive a fix with no way to clear them except Rerun. Bump the key when the solver changes.
- Not verified: phone timing (one worker job, 6 x 20,000, takes 16.1 s on this Mac with another test running; a phone at 2-3x slower would land around 30-50 s, so likely over 30 s); rerun stability within 5% (`--stability` left to the other process); 360 px layout (no browser used).

## Decisions log

> Append-only. Date each entry. Why a thing was done the way it was.

- 2026-11-01: project created with new-project.sh. Sources: rule book PDF (text via PDFKit; scoring tables read from a high-res render of p.8-9), `Animal Cards.pdf` (32 photos, transcribed to `cards.md`; cards 6, 8, 9, 21 verified by Steph), board photos for sides A and B (Steph, in chat). Spirit cards (`Spirit Cards.pdf`) not read yet: v1.1. Source PDFs stay in ~/Downloads, never in the repo.
- 2026-11-01: BRIEF approved by Steph. Built v1: `index.html` (engine between ENGINE START/END markers, UI below) and `test.js` (`node test.js`). 10,988 checks pass: 23/25 spaces, all 32 cards connected and fitting in all 6 rotations and refusing a broken habitat or an occupied target, building on any base, every legal/illegal stack, river 5/6/7 with a branch and a shortcut, 4 islands = 20, min 1 island, trees/mountains/fields/buildings, animal ladder, suns (130/A = 8), 200 random full games end on a rule with cubes on board = cubes off cards.
- 2026-11-01: Chrome test. A full UI game ran to the end with no JS errors; the result sheet and log saved. Cube placement by tap works; a wrong spot is refused with a message; undo reverts it. 360 px: no sideways scroll, 4 open cards in a 2x2 grid. Fixed: a global named `history` shadowed `window.history` and stopped every redraw (renamed `undoStack`). Not tested: real phone, light mode.
- Rule reading: the pouch end triggers when a refill can't fill all 3 spaces (from 111 after setup, 9 per turn, that is after turn 12). The board usually ends the game first.
- 2026-11-02: Steph tested v1 on the phone: "looks good". Built v1.1 Nature's Spirit cards: 10 spirits (table in `cards.md`), setup deals 2 and you keep 1 (or play without), spirit counts toward the 4 open cards until its cube is placed, scores only if placed (live panel shows what it would score), suns +2/+1/+0. 11,227 checks pass, incl. the rule book Lion example (14) and Pauline's suns (130, A, Lion = 7). Chrome 360 px: choose spirit, full game to the result sheet, log records the spirit, no errors. Open: Turtle habitat and rule are medium confidence.
- Rotations only, no mirrors (none of the 32 shapes is chiral).

- 2026-11-05: Built v2 Spirit Lab in `index.html` (SOLVER START/END block after the engine; Lab sheet from the menu and the new-game sheet). Model: finished boards searched by simulated annealing (random restarts, then restarts seeded from the best board), cards picked greedily (matched an exhaustive pick on 9 of 9 sampled boards), then a build order is made and replayed through the engine with a rigged pouch and deck. Max 13 turns (39 tokens), not 12: the refill after turn 13 is the one that fails. App runs 4 Web Workers x 6 restarts x 20,000 steps; falls back to 12 restarts on the page if workers are blocked. `lab-test.js`: fast scorer = engine on 3,000 random boards; every solver board for all 10 spirits on both sides replays independently with the same score, token and pouch limits, correct end. Chrome: run, stop, cache across reload, board tabs, 360 px no sideways scroll, no console errors. Not tested: real phone timing.
## Handoff notes

- 2026-11-04: v2 Spirit Lab scoped in BRIEF.md (perfect draws, Steph's choice). BRIEF approved by Steph; v1.1 pushed to private repo Stairph/harmonies-solo. Push: private GitHub repo (Steph's choice). Preflight scan 2026-11-04: PASS with warnings (no lockfile).

> The current holder leaves the next role what they need. Overwrite each handoff.

- To Steph: play v1.1 with spirits; check the Turtle card (S3) against the physical card.
- 2026-11-05 Breaker retest -> orchestrator: v2 PASS, phase `review`. Steph times a phone run. (Earlier: v2 FAIL. Decide D1 (12 vs 13 turns in the BRIEF); route D2, D3 to the Maker; time a real run on the phone. Breaker checks: `node breaker-test.js` (add `turns` / `timing` for single parts).)

- 2026-11-05: Repo goes public on Steph's call ("go public"). Phone link moves from the claude.ai artifact to https://stairph.github.io/harmonies-solo/.