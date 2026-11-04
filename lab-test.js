// Spirit Lab tests. Run: node lab-test.js            (about 1 minute)
//                       node lab-test.js --stability  (adds rerun spread, about 10 minutes)
// Loads the ENGINE and SOLVER blocks from index.html.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const src = html.split('// ENGINE START')[1].split('// SOLVER END')[0];
const E = {}; vm.createContext(E); vm.runInContext(src, E);
let fails = 0, passes = 0;
function ok(cond, name) { if (cond) passes++; else { fails++; console.log('FAIL', name); } }

// 1. The fast scorer agrees with the engine on random boards.
['A', 'B'].forEach(side => {
  const P = E.labPrep(side), rnd = E.labRng(side === 'A' ? 11 : 12);
  for (let n = 0; n < 1500; n++) {
    const cs = P.L.map(() => Math.floor(rnd() * E.LAB_STACKS.length)), st = E.labStrings(cs);
    const s = E.newGame(side, E.labRng(1), false);
    P.L.forEach((h, i) => { s.cells[h.id].stack = st[i] ? st[i].split('') : []; });
    const sc = E.score(s), land = E.labLand(P, cs);
    ok(land.total === sc.land && land.trees === sc.trees && land.mountains === sc.mountains && land.fields === sc.fields && land.buildings === sc.buildings && land.water === sc.water, side + ' land board ' + n);
    E.SPIRITS.forEach(sp => ok(E.labSpirit(P, cs, sp.id) === E.spiritPoints(s, sp.id), side + ' spirit ' + sp.name + ' board ' + n));
    if (n % 5 === 0) E.CARDS.concat(E.SPIRITS).forEach(c => {
      const f = E.labFits(P, cs, c.id), g = P.L.map((h, i) => i).filter(i => E.cubeFits(s, c.id, P.L[i].id));
      ok(f.join() === g.join(), side + ' fits card ' + c.id + ' board ' + n);
    });
  }
});

// 2. Independent replay: rebuild each solver board from its turn log with the engine, without solver code.
function replay(side, spiritId, board) {
  const turns = board.turns, labels = E.labPrep(side).L.map(h => h.id);
  const placed = { W: 0, K: 0, B: 0, G: 0, Y: 0, R: 0 };
  turns.forEach(t => t.tokens.forEach(k => placed[k[1]]++));
  const pool = []; Object.keys(E.POUCH).forEach(c => { for (let i = 0; i < E.POUCH[c] - placed[c]; i++) pool.push(c); });
  if (pool.length !== 120 - Object.values(placed).reduce((a, b) => a + b, 0)) return 'colour over pouch';
  const pouch = [];
  turns.forEach(t => { t.tokens.forEach(k => pouch.push(k[1])); for (let i = 0; i < 6; i++) pouch.push(pool.pop()); });
  const s = E.newGame(side, E.labRng(3), true);
  s.spiritOffer = [spiritId, spiritId === 101 ? 102 : 101]; E.chooseSpirit(s, 0);
  s.pouch = pouch.concat(pool); s.central = [s.pouch.splice(0, 3), s.pouch.splice(0, 3), s.pouch.splice(0, 3)];
  const want = turns.filter(t => t.card).map(t => t.card);
  s.deck = want.concat(E.CARDS.map(c => c.id).filter(id => !want.includes(id))); s.row = s.deck.splice(0, 3);
  const cube = (c) => { const a = s.active.findIndex(x => x.id === c[0]); return a < 0 ? 'card not open' : E.placeCube(s, a, labels[c[1]]); };
  for (const t of turns) {
    if (s.over) return 'ended before turn ' + t.n;
    let err;
    if (t.card && (err = E.takeCard(s, s.row.indexOf(t.card)))) return 'turn ' + t.n + ' ' + err;
    if ((err = E.takeSpace(s, 0))) return err;
    // Cubes may go down as soon as their habitat is there: try them after every token.
    const pending = t.cubes.slice();
    const tryCubes = () => { for (let i = 0; i < pending.length; i++) if (!cube(pending[i])) { pending.splice(i, 1); i = -1; } };
    tryCubes();
    for (const k of t.tokens) { if ((err = E.placeToken(s, s.turn.hand.indexOf(k[1]), labels[k[0]]))) return 'turn ' + t.n + ' ' + err; tryCubes(); }
    if (pending.length) return 'turn ' + t.n + ' cube refused';
    E.endTurn(s); if (s.turn.phase === 'swap') E.swapCard(s, null);
  }
  if (!s.over) return 'game not over after the last turn';
  return { s, sc: E.score(s) };
}

const all = {};
['A', 'B'].forEach(side => E.SPIRITS.forEach(sp => {
  const t0 = Date.now(), r = E.labSolve(side, sp.id, { restarts: 2, iters: 8000, seed: 5 });
  all[side + sp.id] = r;
  ok(r.boards.length >= 1, side + ' ' + sp.name + ' found a board');
  r.boards.forEach((b, bi) => {
    const tag = side + ' ' + sp.name + ' board ' + (bi + 1);
    const tokens = b.turns.reduce((a, t) => a + t.tokens.length, 0), cnt = E.labCounts(E.labCodes(b.st));
    ok(tokens === cnt.n && tokens % 3 === 0 && tokens <= 39, tag + ' token count ' + tokens);
    ok(b.turns.length <= 13 && b.turns.every(t => t.tokens.length === 3), tag + ' 3 tokens a turn, 13 turns max');
    Object.keys(E.POUCH).forEach(c => ok(cnt.col[c] <= E.POUCH[c], tag + ' pouch cap ' + c));
    ok(b.turns.filter(t => t.card).length <= b.turns.length, tag + ' one card per turn');
    ok(b.claimed === b.score.total, tag + ' solver score ' + b.claimed + ' = engine score ' + b.score.total);
    const rep = replay(side, sp.id, b);
    ok(typeof rep === 'object', tag + ' independent replay: ' + rep);
    if (typeof rep === 'object') {
      ok(rep.sc.total === b.score.total, tag + ' replay total ' + rep.sc.total + ' vs ' + b.score.total);
      ok(rep.sc.spiritPlaced, tag + ' spirit cube placed');
      ok(rep.s.cells && Object.keys(rep.s.cells).map(k => rep.s.cells[k].stack.join('')).join('|') === E.labPrep(side).L.map((h, i) => b.st[i]).join('|'), tag + ' replay board matches');
      // Board end: no earlier turn may leave 2 or fewer empty spaces (checked by the engine during replay; restated here).
      ok(rep.s.over === (cnt.empty <= 2 ? 'board' : 'pouch'), tag + ' ends on ' + rep.s.over);
    }
  });
  console.log(side, sp.name.padEnd(9), 'best', r.boards[0] ? r.boards[0].score.total : '-', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}));

// 3. Hand-built reference boards (one per spirit kind). The solver's best must beat each.
// Side A spaces are column letter + row: A1-A5, B1-B4, C1-C5, D1-D4, E1-E5.
function refBoard(spec) {
  const P = E.labPrep('A');
  return P.label.map(l => spec[l] || '');
}
const REFS = [
  // Deer (count: trees h2/h3 = 4): two columns of tall trees, a 5-long river, small fields.
  [107, { A1: 'W', A2: 'W', A3: 'W', A4: 'W', A5: 'W', B1: 'BBG', B2: 'BBG', B3: 'BBG', B4: 'BBG', C1: 'BG', C2: 'BG', C3: 'BG', C4: 'BG', C5: 'BG',
    D1: 'Y', D2: 'Y', D3: 'Y', D4: 'Y', E1: 'BBG', E2: 'BG', E3: 'Y', E4: 'Y', E5: 'Y' }],
  // Lion (group: yellow groups of 3+ = 10): three yellow groups of 3 kept apart.
  [101, { A1: 'Y', A2: 'Y', A3: 'Y', A4: 'W', A5: 'W', B1: 'W', B2: 'W', B3: 'W', B4: 'W', C1: 'Y', C2: 'Y', C3: 'Y', C4: 'BBG', C5: 'BBG',
    D1: 'BBG', D2: 'BBG', D3: 'BBG', D4: 'BBG', E1: 'Y', E2: 'Y', E3: 'Y', E4: 'KKK', E5: 'KKK' }]
];
REFS.forEach(([id, spec]) => {
  const P = E.labPrep('A'), st = refBoard(spec), ev = E.labEval(P, E.labCodes(st), id);
  ev.st = st;
  const v = E.labVerify(P, id, ev), best = all['A' + id].boards[0];
  ok(ev.viol === 0 && v, 'reference ' + E.CARD_BY_ID[id].name + ' is playable');
  const rep = v && replay('A', id, v);
  ok(rep && typeof rep === 'object' && rep.sc.total === v.score.total, 'reference ' + E.CARD_BY_ID[id].name + ' replays');
  const refScore = v ? v.score.total : 0;
  console.log('reference', E.CARD_BY_ID[id].name, refScore, 'vs solver', best.score.total);
  ok(best.score.total > refScore, 'solver beats reference ' + E.CARD_BY_ID[id].name);
});

// 4. Optional: rerun spread at the app's settings (4 parallel searches x 6 restarts x 20000 steps, merged).
if (process.argv.includes('--stability')) {
  [['A', 101], ['B', 103], ['A', 106]].forEach(([side, id]) => {
    const totals = [1, 2, 3].map(run => {
      const lists = [0, 1, 2, 3].map(w => E.labSolve(side, id, { restarts: 6, iters: 20000, seed: run * 100 + w * 1000 }).list);
      return E.labMerge(side, id, lists).boards[0].score.total;
    });
    const spread = (Math.max(...totals) - Math.min(...totals)) / Math.max(...totals);
    console.log('stability', side, E.CARD_BY_ID[id].name, totals.join(' '), (spread * 100).toFixed(1) + '%');
    ok(spread <= 0.05, 'reruns within 5%: ' + side + ' ' + E.CARD_BY_ID[id].name);
  });
}

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
