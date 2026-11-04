// Breaker checks for the v2 Spirit Lab. Run: node breaker-test.js   (about 1-2 minutes)
// Adversarial checks the Maker's lab-test.js does not make.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const src = html.split('// ENGINE START')[1].split('// SOLVER END')[0];
const E = {}; vm.createContext(E); vm.runInContext(src, E);
let fails = 0, passes = 0;
function ok(cond, name) { if (cond) passes++; else { fails++; console.log('FAIL', name); } }
const arg = process.argv[2] || 'all';

// 1. Turn limit from the engine's pouch: how many turns does a game last when the board never ends it?
if (arg === 'all' || arg === 'turns') {
  const s = E.newGame('A', E.labRng(9), false);
  let turns = 1;
  while (!s.over) { E.finishTurn(s); if (!s.over) turns++; }
  console.log('engine pouch: game lasts', turns, 'turns, ends on', s.over);
  ok(turns === E.LAB_MAX_TURNS, 'LAB_MAX_TURNS (' + E.LAB_MAX_TURNS + ') = engine turns (' + turns + ')');
  ok(turns === 13, 'BRIEF v2 (amended): at most 13 turns / 39 tokens (engine gives ' + turns + ')');
}

// 2. Edge stacks: fast scorer = engine on boards built only from awkward stacks.
if (arg === 'all' || arg === 'edge') {
  const EDGE = ['', 'B', 'BB', 'R', 'RR', 'KR', 'BR', 'K', 'KK', 'KKK', 'W', 'Y', 'G', 'BG'];
  ['A', 'B'].forEach(side => {
    const P = E.labPrep(side), rnd = E.labRng(side === 'A' ? 77 : 78);
    let bad = 0;
    for (let n = 0; n < 3000; n++) {
      const st = P.L.map(() => EDGE[Math.floor(rnd() * EDGE.length)]), cs = E.labCodes(st);
      const s = E.newGame(side, E.labRng(1), false);
      P.L.forEach((h, i) => { s.cells[h.id].stack = st[i] ? st[i].split('') : []; });
      const sc = E.score(s), land = E.labLand(P, cs);
      if (land.total !== sc.land || land.buildings !== sc.buildings || land.mountains !== sc.mountains) bad++;
      E.SPIRITS.forEach(sp => { if (E.labSpirit(P, cs, sp.id) !== E.spiritPoints(s, sp.id)) bad++; });
      if (n % 10 === 0) E.CARDS.concat(E.SPIRITS).forEach(c => {
        const f = E.labFits(P, cs, c.id), g = P.L.map((h, i) => i).filter(i => E.cubeFits(s, c.id, P.L[i].id));
        if (f.join() !== g.join()) bad++;
      });
    }
    ok(bad === 0, side + ' edge-stack boards: fast scorer = engine (' + bad + ' mismatches)');
  });
}

// 3. Every result (not only the top 3) has claimed = engine score, and its turn log obeys the card rules.
if (arg === 'all' || arg === 'claims') {
  [['A', 103], ['B', 106], ['A', 108], ['B', 110]].forEach(([side, id]) => {
    const r = E.labSolve(side, id, { restarts: 3, iters: 6000, seed: 42 });
    r.list.forEach((b, bi) => {
      const tag = side + ' ' + E.CARD_BY_ID[id].name + ' result ' + bi;
      ok(b.claimed === b.score.total, tag + ' claimed ' + b.claimed + ' = engine ' + b.score.total);
      // open cards never above 4 (spirit counts until its cube is down)
      let open = new Set([id]), maxOpen = 1, cubesLeft = {}; cubesLeft[id] = 1;
      b.picks.forEach(p => { cubesLeft[p.id] = p.cells.length; });
      b.turns.forEach(t => {
        if (t.card) { open.add(t.card); maxOpen = Math.max(maxOpen, open.size); }
        t.cubes.forEach(c => { if (--cubesLeft[c[0]] === 0) open.delete(c[0]); });
      });
      ok(maxOpen <= 4, tag + ' max open cards ' + maxOpen);
      ok(b.picks.every(p => p.cells.length >= 1 && p.cells.length <= E.CARD_BY_ID[p.id].ladder.length), tag + ' cube counts within ladder');
      const pts = b.picks.reduce((a, p) => a + p.pts, 0);
      ok(pts === b.score.animals, tag + ' card points ' + pts + ' = engine animals ' + b.score.animals);
    });
  });
}

// 4. The worker source: what the page hands to the Web Worker must run on its own (no DOM, no UI globals).
if (arg === 'all' || arg === 'worker') {
  const mainText = html.split('<script id="main">')[1].split('</script>')[0];
  const wsrc = mainText.split('// ' + 'ENGINE START')[1].split('// ' + 'SOLVER END')[0] +
    '\nonmessage = function (e) { var d = e.data, r = labSolve(d.side, d.spirit, d.opts, function (p, b) { postMessage({ p: p, b: b }); }); postMessage({ done: r.list }); };';
  const msgs = [], W = { postMessage: m => msgs.push(JSON.parse(JSON.stringify(m))) };
  vm.createContext(W); vm.runInContext(wsrc, W);
  let threw = null;
  try { W.onmessage({ data: { side: 'B', spirit: 105, opts: { restarts: 1, iters: 3000, seed: 3 } } }); } catch (e) { threw = e.message; }
  ok(!threw, 'worker source runs alone (' + threw + ')');
  const done = msgs.find(m => m.done);
  ok(done && Array.isArray(done.done), 'worker posts a done list');
  ok(msgs.filter(m => m.p !== undefined).every(m => m.p >= 0 && m.p <= 1), 'worker progress within 0..1');
}

// 5. Timing: one worker's job at the app's settings (6 restarts x 20,000 steps). The phone runs 4 of these in parallel.
if (arg === 'timing') {
  const t0 = Date.now();
  const r = E.labSolve('A', 101, { restarts: 6, iters: 20000, seed: 7 });
  console.log('one worker job (A Lion, 6 x 20000):', ((Date.now() - t0) / 1000).toFixed(1) + 's, best', r.boards[0] && r.boards[0].score.total);
  const t1 = Date.now();
  E.labSolve('A', 101, { restarts: 1, iters: 8000, seed: 8 });
  console.log('one fallback step on the page (1 x 8000):', ((Date.now() - t1) / 1000).toFixed(1) + 's (x10 steps, blocks the page each step)');
}

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
