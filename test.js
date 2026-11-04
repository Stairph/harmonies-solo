// Engine tests. Run: node test.js   (extracts the ENGINE block from index.html)
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const src = html.split('// ENGINE START')[1].split('// ENGINE END')[0];
const E = {}; vm.createContext(E); vm.runInContext(src, E);
let fails = 0, passes = 0;
function ok(cond, name) { if (cond) passes++; else { fails++; console.log('FAIL', name); } }

function blank(side) { return E.newGame(side, mulberry(1)); }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function set(s, q, r, stack) { s.cells[E.key(q, r)].stack = stack.split(''); }

// Boards
ok(E.boardLayout('A').length === 23, 'side A has 23 spaces');
ok(E.boardLayout('B').length === 25, 'side B has 25 spaces');

// Cards: 32, every pattern connected, target valid, ladder 2-3 long
ok(E.CARDS.length === 32, '32 cards');
E.CARDS.forEach(c => {
  ok(c.target >= 0 && c.ladder.length >= 2 && c.ladder.length <= 3, 'card ' + c.id + ' target/ladder');
  const ks = c.cells.map(x => E.key(x.q, x.r));
  ok(new Set(ks).size === ks.length, 'card ' + c.id + ' distinct cells');
  // connected
  const seen = new Set([ks[0]]), q = [c.cells[0]];
  while (q.length) { const x = q.shift(); E.DIRS.forEach(d => { const k = E.key(x.q + d[0], x.r + d[1]); if (ks.includes(k) && !seen.has(k)) { seen.add(k); q.push({ q: x.q + d[0], r: x.r + d[1] }); } }); }
  ok(seen.size === ks.length, 'card ' + c.id + ' connected');
});

// Spirits: 10, connected, one cube each
ok(E.SPIRITS.length === 10, '10 spirits');
E.SPIRITS.forEach(c => {
  ok(c.target >= 0 && c.ladder.length === 1 && ['group', 'count'].includes(c.kind), 'spirit ' + c.name + ' target/kind');
  const ks = c.cells.map(x => E.key(x.q, x.r));
  const seen = new Set([ks[0]]), q = [c.cells[0]];
  while (q.length) { const x = q.shift(); E.DIRS.forEach(d => { const k = E.key(x.q + d[0], x.r + d[1]); if (ks.includes(k) && !seen.has(k)) { seen.add(k); q.push({ q: x.q + d[0], r: x.r + d[1] }); } }); }
  ok(seen.size === ks.length && new Set(ks).size === ks.length, 'spirit ' + c.name + ' connected');
});

// Each card fits its own pattern in every rotation, at a spot on side B, and fails if one height is wrong
E.CARDS.concat(E.SPIRITS).forEach(c => {
  for (let n = 0; n < 6; n++) {
    const s = blank('B');
    const placed = c.cells.map(x => E.rot([x.q, x.r], n));
    const tq = placed[c.target];
    // shift so the target lands at (3,0) (middle of side B)
    const dq = 3 - tq[0], dr = 0 - tq[1];
    let fitsBoard = placed.every(p => s.cells[E.key(p[0] + dq, p[1] + dr)]);
    if (!fitsBoard) continue;
    c.cells.forEach((x, j) => { const st = E.reqStack(x.req).map(t => t === 'X' ? 'K' : t); s.cells[E.key(placed[j][0] + dq, placed[j][1] + dr)].stack = st; });
    ok(E.cubeFits(s, c.id, '3,0'), 'card ' + c.id + ' fits rotation ' + n);
    // break one non-target token: change its top
    const j = c.target === 0 ? 1 : 0, k = E.key(placed[j][0] + dq, placed[j][1] + dr);
    const orig = s.cells[k].stack.slice();
    s.cells[k].stack = orig.concat(orig[orig.length - 1] === 'K' && orig.length < 3 ? ['K'] : []).length !== orig.length ? orig.concat(['K']) : ['Y', 'W'].includes(orig[0]) ? [orig[0] === 'Y' ? 'W' : 'Y'] : ['W'];
    ok(!E.cubeFits(s, c.id, '3,0'), 'card ' + c.id + ' refuses broken habitat rot ' + n);
    s.cells[k].stack = orig;
    s.cells['3,0'].cube = 99;
    ok(!E.cubeFits(s, c.id, '3,0'), 'card ' + c.id + ' refuses occupied target');
  }
});

// Building base: any of brown/gray/red
(() => { const s = blank('A'); const c = E.CARD_BY_ID[15]; // BLD + W*
  ['BR', 'KR', 'RR'].forEach(b => { set(s, 0, 0, b); set(s, 1, 0, 'W'); ok(E.cubeFits(s, 15, '1,0'), 'building base ' + b); });
  set(s, 0, 0, 'R'); ok(!E.cubeFits(s, 15, '1,0'), 'single red is not a building'); })();

// Stacking
const legal = [['', 'G'], ['B', 'G'], ['BB', 'G'], ['K', 'K'], ['KK', 'K'], ['B', 'R'], ['K', 'R'], ['R', 'R'], ['', 'W'], ['', 'Y'], ['B', 'B']];
const illegal = [['K', 'G'], ['KK', 'R'], ['W', 'W'], ['Y', 'G'], ['G', 'G'], ['KKK', 'K'], ['BB', 'B'], ['BR', 'R'], ['R', 'K'], ['B', 'K'], ['B', 'W'], ['BG', 'R'], ['RR', 'R']];
legal.forEach(p => ok(E.canStack(p[0] ? p[0].split('') : [], p[1]), 'legal ' + p.join('+')));
illegal.forEach(p => ok(!E.canStack(p[0].split(''), p[1]), 'illegal ' + p.join('+')));
(() => { const s = blank('A'); s.cells['0,0'].cube = 1; ok(!E.canPlaceToken(s, '0,0', 'W'), 'no token on a cube'); })();

// River (side A): shortest path end to end, branches don't count
(() => { const s = blank('A');
  // straight run of 5 across the board: (0,2)..(4,2)
  for (let q = 0; q < 5; q++) set(s, q, 2, 'W');
  ok(E.score(s).water === 11, 'river 5 = 11');
  set(s, 0, 1, 'W'); // 60-degree bend, no shortcut -> 6
  ok(E.longestRiver(s) === 6 && E.score(s).water === 15, 'river 6 = 15');
  set(s, 2, 1, 'W'); // side branch touching (1,2) and (2,2) -> still 6
  ok(E.longestRiver(s) === 6, 'branch does not lengthen river');
  set(s, 0, 0, 'W'); // -> 7
  ok(E.longestRiver(s) === 7 && E.score(s).water === 19, 'river 7 = 19 (+4)');
  const t = blank('A'); for (let r = 0; r < 5; r++) set(t, 0, r, 'W'); set(t, 1, 3, 'W');
  ok(E.longestRiver(t) === 5, 'shortcut: tail touching 2 river tokens adds nothing');
})();

// Islands (side B): blue odd columns split the board into 4 islands
(() => { const s = blank('B');
  E.boardLayout('B').forEach(h => { if (h.q % 2 === 1) s.cells[h.id].stack = ['W']; });
  ok(E.score(s).water === 20, '4 islands = 20');
  const s2 = blank('B'); ok(E.score(s2).water === 5, 'always at least 1 island');
})();

// Trees, mountains, fields, buildings
(() => { const s = blank('A');
  set(s, 0, 0, 'G'); set(s, 0, 1, 'BG'); set(s, 0, 2, 'BBG'); set(s, 0, 3, 'BB');
  ok(E.score(s).trees === 11, 'trees 1+3+7, brown-only stack 0');
  const m = blank('A'); set(m, 2, 0, 'KKK'); ok(E.score(m).mountains === 0, 'lone mountain 0');
  set(m, 2, 1, 'K'); ok(E.score(m).mountains === 8, 'adjacent mountains 7+1');
  set(m, 4, -2, 'KK'); ok(E.score(m).mountains === 8, 'far mountain still 0');
  const f = blank('A'); set(f, 0, 0, 'Y'); ok(E.score(f).fields === 0, 'single yellow 0');
  set(f, 0, 1, 'Y'); set(f, 0, 2, 'Y'); set(f, 0, 3, 'Y'); ok(E.score(f).fields === 5, '4 in a row = one field');
  set(f, 4, 0, 'Y'); set(f, 4, 1, 'Y'); ok(E.score(f).fields === 10, 'two fields = 10');
  const b = blank('A'); set(b, 2, 0, 'BR');
  set(b, 2, 1, 'W'); set(b, 1, 0, 'Y'); ok(E.score(b).buildings === 0, 'building 2 colours = 0');
  set(b, 3, 0, 'KR'); ok(E.score(b).buildings === 5, 'building 3 colours incl red = 5 (the other building has 1 colour)');
})();

// Animals ladder
(() => { const s = blank('A'); s.active = [{ id: 1, placed: 1 }]; ok(E.score(s).animals === 4, '1 cube placed = bottom value');
  s.active = []; s.done = [{ id: 1, placed: 3 }]; ok(E.score(s).animals === 16, 'complete = top value');
  s.done = [{ id: 1, placed: 0 }]; ok(E.score(s).animals === 0, 'none placed = 0'); })();

// Suns
ok(E.sunsFor(130, 'A').total === 8, '130 side A no spirit = 8');
ok(E.sunsFor(39, 'B').total === 2, '39 side B = 2');
ok(E.sunsFor(160, 'B').total === 10, '160 side B = 10');

// Spirit scoring
function withSpirit(side, name, placed) {
  const s = blank(side), sp = E.SPIRITS.find(x => x.name === name);
  s.spirit = sp.id; (placed ? s.done : s.active).push({ id: sp.id, placed: placed ? 1 : 0 }); return s;
}
(() => {
  // Rule book example (Lion): yellow groups of 1, 2 and 3+ -> 2 + 2 + 10 = 14
  const s = withSpirit('A', 'Lion', true);
  set(s, 0, 0, 'Y'); set(s, 2, 0, 'Y'); set(s, 2, 1, 'Y'); set(s, 4, 0, 'Y'); set(s, 4, 1, 'Y'); set(s, 4, 2, 'Y');
  ok(E.score(s).spirit === 14, 'Lion example = 14');
  ok(E.score(s).total === E.score(s).land + E.score(s).animals + 14, 'spirit adds to total');
  const u = withSpirit('A', 'Lion', false); u.cells = s.cells;
  ok(E.score(u).spirit === 0 && E.score(u).spiritIf === 14, 'no spirit cube = 0, preview 14');
  // Ram: isolated mountains count
  const r = withSpirit('A', 'Ram', true); set(r, 0, 0, 'KK'); set(r, 4, 0, 'KKK'); set(r, 2, 2, 'K');
  ok(E.score(r).spirit === 8 && E.score(r).mountains === 0, 'Ram 4+4 on isolated mountains, base 0');
  const m = withSpirit('A', 'Marmot', true); set(m, 0, 0, 'K'); set(m, 2, 0, 'KK'); set(m, 4, 0, 'KKK');
  ok(E.score(m).spirit === 7, 'Marmot 3+3+1');
  const d = withSpirit('A', 'Deer', true); set(d, 0, 0, 'G'); set(d, 2, 0, 'BG'); set(d, 4, 0, 'BBG'); set(d, 4, 2, 'BB');
  ok(E.score(d).spirit === 8, 'Deer 0+4+4, brown-only stack is not a tree');
  const o = withSpirit('A', 'Owl', true); o.cells = d.cells; ok(E.score(o).spirit === 7, 'Owl 3+3+1');
  const t = withSpirit('B', 'Turtle', true); set(t, 0, 0, 'W'); set(t, 0, 1, 'W'); set(t, 3, 0, 'W');
  ok(E.score(t).spirit === 6, 'Turtle 2 per blue token');
  const b = withSpirit('A', 'Butterfly', true); set(b, 0, 0, 'Y'); set(b, 0, 1, 'Y'); set(b, 0, 2, 'Y'); set(b, 4, 0, 'Y'); set(b, 2, 2, 'Y'); set(b, 2, 3, 'Y');
  ok(E.score(b).spirit === 10, 'Butterfly 5 per yellow group of 2+, single ignored');
  const f = withSpirit('A', 'Dragonfly', true); set(f, 0, 0, 'W'); set(f, 0, 1, 'W'); set(f, 0, 2, 'W'); set(f, 4, 0, 'W'); set(f, 4, 1, 'W');
  ok(E.score(f).spirit === 7, 'Dragonfly 7 per blue group of 3+, pair ignored');
  const c = withSpirit('A', 'Cat', true); set(c, 0, 0, 'BR'); set(c, 0, 1, 'KR'); set(c, 4, 0, 'RR'); set(c, 2, 2, 'R');
  ok(E.score(c).spirit === 4, 'Cat 4 per group of 2+ buildings; lone red token is not a building');
  const k = withSpirit('A', 'Stork', true); k.cells = c.cells; ok(E.score(k).spirit === 0, 'Stork: group of 2 scores 0');
  set(k, 0, 2, 'RR'); ok(E.score(k).spirit === 6, 'Stork 6 for a group of 3');
})();
ok(E.sunsFor(130, 'A', E.SPIRITS.find(x => x.name === 'Lion').id).total === 7, 'Pauline: 130, side A, Lion = 5+1+1 = 7');
ok(E.sunsFor(130, 'B', E.SPIRITS.find(x => x.name === 'Ram').id).total === 5, '130 side B count spirit = 5');
(() => {
  const s = E.newGame('A', mulberry(3), true);
  ok(s.spiritOffer.length === 2 && s.spiritOffer.every(id => id > 100) && s.spiritOffer[0] !== s.spiritOffer[1], 'deal 2 different spirits');
  ok(E.takeSpace(s, 0) !== null, 'must choose spirit before playing');
  const id = s.spiritOffer[1]; ok(E.chooseSpirit(s, 1) === null && s.spirit === id && !s.spiritOffer && s.active.length === 1, 'choose spirit');
  s.active.push({ id: 1, placed: 0 }, { id: 2, placed: 0 }, { id: 3, placed: 0 });
  ok(E.takeCard(s, 0) !== null, 'spirit counts toward the 4-card limit');
  const sp = E.CARD_BY_ID[id], tgt = '2,0';
  sp.cells.forEach((x, j) => { const st = E.reqStack(x.req).map(t => t === 'X' ? 'K' : t); s.cells[E.key(x.q + 2 - sp.cells[sp.target].q, x.r - sp.cells[sp.target].r)].stack = st; });
  ok(E.placeCube(s, 0, tgt) === null && s.done.some(a => a.id === id) && s.active.length === 3, 'spirit cube placed, card done, slot freed');
})();

// Turn flow + random full games: legal play to the end, no crash, ends on a rule
for (let g = 0; g < 200; g++) {
  const rnd = mulberry(g + 7), side = g % 2 ? 'A' : 'B', s = E.newGame(side, rnd, g % 4 < 2);
  ok(s.pouch.length === 111 && s.row.length === 3, 'setup');
  if (s.spiritOffer) E.chooseSpirit(s, g % 2);
  let guard = 0;
  while (!s.over && guard++ < 40) {
    if (rnd() < 0.5 && s.active.length < 4 && s.row.length) ok(E.takeCard(s, 0) === null, 'take card');
    ok(E.takeSpace(s, Math.floor(rnd() * 3)) === null, 'take space');
    while (s.turn.hand.length) {
      const t = s.turn.hand[0], legalCells = Object.keys(s.cells).filter(k => E.canPlaceToken(s, k, t));
      if (!legalCells.length) { s.turn.hand.shift(); continue; } // nowhere legal: drop (test only)
      ok(E.placeToken(s, 0, legalCells[Math.floor(rnd() * legalCells.length)]) === null, 'place token');
      s.active.slice().forEach(a => { Object.keys(s.cells).forEach(k => { const i = s.active.indexOf(a); if (i >= 0 && E.cubeFits(s, a.id, k)) E.placeCube(s, i, k); }); });
    }
    ok(E.endTurn(s) === null, 'end turn');
    if (s.turn.phase === 'swap') E.swapCard(s, rnd() < 0.5 ? 0 : null);
  }
  ok(!!s.over, 'game ' + g + ' ended (' + side + ')');
  const tot = 120 - s.pouch.length;
  ok(s.over === 'board' ? E.emptyCount(s) <= 2 : true, 'board end has <=2 empty');
  const sc = E.score(s); ok(sc.total === sc.land + sc.animals + sc.spirit && sc.total >= 0, 'score sums');
  // every cube on the board belongs to a card we hold
  const cubes = Object.values(s.cells).filter(c => c.cube !== null).length;
  const placed = s.active.concat(s.done).reduce((n, a) => n + a.placed, 0);
  ok(cubes === placed, 'cubes on board = cubes taken off cards');
}

// Rule checks on actions
(() => { const s = blank('A');
  ok(E.endTurn(s) !== null, 'cannot end turn before taking tokens');
  E.takeSpace(s, 0); ok(E.takeSpace(s, 1) !== null, 'only one space per turn');
  ok(E.endTurn(s) !== null, 'cannot end with tokens in hand');
  E.takeCard(s, 0); ok(E.takeCard(s, 0) !== null, 'one card per turn');
  s.turn.cardTaken = false; s.active = [{ id: 1, placed: 0 }, { id: 2, placed: 0 }, { id: 3, placed: 0 }, { id: 4, placed: 0 }];
  ok(E.takeCard(s, 0) !== null, 'max 4 open cards');
})();
(() => { const s = blank('A'); E.takeSpace(s, 0); s.turn.hand = ['W', 'W', 'W'];
  E.placeToken(s, 0, '0,0'); E.placeToken(s, 0, '0,1'); E.placeToken(s, 0, '0,2');
  E.endTurn(s); ok(s.turn.phase === 'swap', 'no card taken -> swap offered');
  const before = s.row.slice(); E.swapCard(s, 1); ok(s.row[1] !== before[1] && s.row[0] === before[0], 'swap replaces one card');
  ok(s.turn.n === 2 && s.central.every(sp => sp.length === 3) && s.pouch.length === 102, 'refill: 9 new tokens, 6 discarded');
})();

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
