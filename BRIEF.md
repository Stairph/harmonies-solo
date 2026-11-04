# BRIEF - harmonies-solo

## Need

A phone web app to practise Harmonies solo: the real solo rules, all 32 animal cards, scoring and suns done for me, so I can play a full game in the browser and learn which choices score.

## In scope (v1)

- One self-contained `index.html`, no build, no external scripts. Same pattern as `harmonies-score`.
- **Solo setup (rule book p.11).** Pouch of 120 tokens (23 blue, 23 gray, 21 brown, 19 green, 19 yellow, 15 red). Central board with 3 spaces of 3 tokens. 3 animal cards face up.
- **Turn.** Take 1 space (3 tokens) and place all 3; between placements I may take 1 animal card (once per turn, max 4 open cards) and place any number of cubes. End of turn: the other 6 tokens leave the game, the 3 spaces refill from the pouch, and if I took no card I may swap 1 face-up card for the top of the deck. Card row refills to 3.
- **Stacking rules enforced.** Tree = green on 0-2 brown. Mountain = 1-3 gray. Building = red on exactly 1 brown, gray or red. Blue and yellow only on empty spaces. Nothing under a token, nothing on a cube.
- **Cube placement checked by the app.** I tap a card, then the target space; the app checks the habitat in all 6 rotations, exact tree and mountain heights, any building base, target free of cubes. Bottom cube goes first. Placement is final.
- **Both board sides** from Steph's photos: side A = 5 columns of 5-4-5-4-5 hexes (23); side B = 7 columns of 4-3-4-3-4-3-4 (25).
- **End of game.** Pouch can't refill the board, or 2 or fewer empty spaces at end of turn.
- **Scoring (rule book p.8-9).** Trees 1/3/7. Mountains 1/3/7, 0 if no adjacent mountain. Fields 5 per yellow group of 2+. Buildings 5 if the neighbours' top tokens show 3+ colours. Side A river: longest shortest path through one blue group, 0/2/5/8/11/15 for 1-6, +4 per token after 6. Side B: 5 per island (non-blue groups, minimum 1). Animals: topmost empty ladder space.
- **Suns** with the same table as `harmonies-score` (40/70/90/110/130/140/150/160, +1 side A, +2 no spirit).
- Live score panel during play, so I can see what a move is worth. Undo within the current turn.
- Autosave the game in progress; a log of finished games with best score per side.

## Out of scope (v1)

- Nature's Spirit cards. They come in v1.1, once the base game is right.
- Multiplayer, AI hints, offline service worker.
- Card art. Cards are drawn as small hex diagrams, so no Libellud artwork goes in the repo.

## Acceptance criteria

- [ ] All 32 cards match `cards.md` (Steph-verified), checked by a test that renders each pattern.
- [ ] Every illegal stack is refused (green on gray, red on a 2-high stack, anything on blue, yellow or green, a 4th gray).
- [ ] A habitat is found in any rotation; a wrong height is refused; a used target space is refused.
- [ ] Scoring reproduces the rule book examples: river example = 15, islands example = 4 islands = 20, and the sun table gives 130 points, side A, no spirit = 5 + 1 + 2 = 8 suns.
- [ ] Game ends on either condition; the final score breakdown matches a hand count of the same board.
- [ ] Refresh mid-turn keeps the game.
- [ ] Playable one-handed at 360 px width, no sideways scroll; hexes big enough to tap.

## Key trade-offs and decisions

- Rotations only, no mirrored patterns. None of the 32 shapes is chiral, so this choice never changes a result.
- The app checks cube placement rather than trusting me. It's slower to build but it is the point of practising.

## Task breakdown

1. `cards.md` and card data, board geometry for A and B.
2. Rules engine: pouch, stacking, habitat match, end conditions.
3. Scoring and suns, with the rule book examples as tests.
4. Phone UI: central board, card row, my board, score panel.
5. Save, log, test on Chrome at 360 px, then on Steph's phone.

## Open questions

- none

---

# v2 - Spirit Lab (best-case simulator) - approved by Steph 2026-11-04

## Need

Pick a spirit card and a board side, and see the highest-scoring board I could build for it, which animal cards fit it best, and the turn-by-turn order that gets there. A study tool: it shows the ceiling, not a strategy for a random game.

## Model: perfect draws

The solver assumes every draw goes my way, inside the hard limits:
- **Tokens:** 3 per turn. Pouch caps per colour (23 blue, 23 gray, 21 brown, 19 green, 19 yellow, 15 red).
- **Turns:** at most 13 (111 tokens after setup cover 12 refills of 9; the refill after turn 13 fails). Corrected 2026-11-05 from 12, which was an arithmetic slip; the engine runs 13.
- **End trigger:** the game ends at the end of the first turn with 2 or fewer empty spaces. The solver must find an order where this happens only on the last turn.
- **Cards:** 1 animal card per turn, at most 4 open at once (spirit included until its cube is on), any card available when I want it. Cubes need the habitat to exist when placed, and nothing goes on a cube afterwards.
- **Spirit:** its cube must be placed to score; suns use its +0/+1.

## In scope

- A **Lab** screen in the same `index.html`: pick spirit (S1-S10), pick side A or B, Run.
- **Solver** (runs in a Web Worker so the screen stays usable): searches boards by simulated annealing, scored with the existing `score()` function. Picks the best animal cards for each board.
- **Output:** top 3 boards, each with total score, breakdown (terrain, animals, spirit), the animal cards used with points per card, suns, and the build order turn by turn (3 tokens + any card taken + cubes placed).
- **Card ranking per spirit:** which animal cards appear most in the top boards, with average points each.
- Results cached per spirit and side, so a rerun is instant until I press Rerun.

## Out of scope

- Random draws, bots, expected scores (the realistic mode). Possible v2.1.
- Hints during a live game.
- Proof of the true maximum. The solver finds very good boards, not a guaranteed best.

## Acceptance criteria

- [ ] Every board the solver shows is **replayed through the real game engine** with forced draws, turn by turn, and ends legally with exactly the score shown. A test checks this for all 10 spirits on both sides.
- [ ] No board uses more of any colour than the pouch holds, more than 39 tokens, or more than 13 turns.
- [ ] No turn before the last ends with 2 or fewer empty spaces.
- [ ] Rerunning the same spirit lands within 5% of the best score (the search is stable).
- [ ] A run finishes in under 30 seconds on Steph's phone, with a progress bar and Stop.
- [ ] Each spirit's best board beats a hand-built reference board I check by hand (one per spirit kind: group and count).
- [ ] 360 px, no sideways scroll; the base game is untouched (existing 11,227 checks still pass).

## Trade-offs

- Annealing over exact search: an exact search over 23-25 spaces x stacks x cards is far too large for a phone. Annealing gets close in seconds; the replay test keeps it honest.
- Same file, not a new project: it reuses the engine and the scoring that is already tested.

## Open questions

- S3 Turtle is still medium confidence. Its results are only as right as that transcription.
