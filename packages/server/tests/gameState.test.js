'use strict';

const {
  createGameState,
  startGame,
  enterContribution,
  submitContribution,
  enterVote,
  castVote,
  buildPublicGameView,
  buildSelfView,
  Phase, Team,
} = require('../src/gameState');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message ?? `Expected ${b}, got ${a}`);
}

function assertThrows(fn, message) {
  let threw = false;
  try { fn(); } catch (_) { threw = true; }
  if (!threw) throw new Error(message ?? 'Expected function to throw');
}

function makeRoom(playerCount = 4) {
  const state = createGameState('TEST', 'p1', 'Alice');
  const names = ['Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank'];
  for (let i = 2; i <= playerCount; i++) {
    state.players.push({
      id: `p${i}`,
      name: names[i - 2] ?? `Player${i}`,
      role: null, alive: true, isHost: false, hand: [],
      connected: true, votedForPlayerId: null,
      reconnectToken: `tok${i}`,
    });
  }
  return state;
}

function makeStartedGame(playerCount = 4) {
  const state = makeRoom(playerCount);
  startGame(state);
  return state;
}

console.log('\n🏜️  Last Light Caravan — Core Logic Tests\n');

console.log('Room & Lobby:');
test('creates initial game state in lobby phase', () => {
  const state = createGameState('ABCD', 'p1', 'Alice');
  assertEqual(state.phase, Phase.LOBBY);
  assertEqual(state.players.length, 1);
  assertEqual(state.players[0].isHost, true);
});

test('cannot start with only 1 player', () => {
  const state = createGameState('ABCD', 'p1', 'Alice');
  assertThrows(() => startGame(state));
});

console.log('\nRole Assignment:');
test('4 players get exactly 1 saboteur', () => {
  const state = makeStartedGame(4);
  const sabs = state.players.filter(p => p.role === Team.SABOTEUR);
  assertEqual(sabs.length, 1);
});

test('8 players get exactly 2 saboteurs', () => {
  const state = makeStartedGame(8);
  const sabs = state.players.filter(p => p.role === Team.SABOTEUR);
  assertEqual(sabs.length, 2);
});

test('all players have a role after start', () => {
  const state = makeStartedGame(4);
  assert(state.players.every(p => p.role === Team.CREW || p.role === Team.SABOTEUR));
});

console.log('\nStarting Resources:');
test('food starts at 6',      () => assertEqual(makeStartedGame(4).resources.food, 6));
test('water starts at 6',     () => assertEqual(makeStartedGame(4).resources.water, 6));
test('morale starts at 5',    () => assertEqual(makeStartedGame(4).resources.morale, 5));
test('integrity starts at 4', () => assertEqual(makeStartedGame(4).resources.integrity, 4));

console.log('\nHand System:');
test('all players get 5 cards', () => {
  const state = makeStartedGame(4);
  state.players.forEach(p => assertEqual(p.hand.length, 5, `${p.name} has ${p.hand.length} cards`));
});

console.log('\nPhase Transitions:');
test('game starts in dawnEvent phase', () => {
  assertEqual(makeStartedGame(4).phase, Phase.DAWN_EVENT);
});

test('dawn event is set', () => {
  assert(makeStartedGame(4).currentEventId !== null);
});

test('advance to contribution phase', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  assertEqual(state.phase, Phase.CONTRIBUTION);
});

test('contribution map initialized', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  state.players.forEach(p => {
    assert(p.id in state.contributions);
    assertEqual(state.contributions[p.id].locked, false);
  });
});

console.log('\nContribution System:');
test('player can contribute a card', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  const player = state.players[0];
  const card = player.hand[0];
  submitContribution(state, player.id, card);
  assert(!player.hand.includes(card));
  assert(state.contributions[player.id].locked);
});

test('player can hold', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  const player = state.players[0];
  const prevSize = player.hand.length;
  submitContribution(state, player.id, null);
  assertEqual(player.hand.length, prevSize);
  assert(state.contributions[player.id].locked);
});

test('cannot contribute card not in hand', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  assertThrows(() => submitContribution(state, state.players[0].id, 'FAKE_CARD'));
});

test('cannot submit twice', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  submitContribution(state, state.players[0].id, null);
  assertThrows(() => submitContribution(state, state.players[0].id, null));
});

test('all submitting triggers resolution', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  state.players.forEach(p => submitContribution(state, p.id, null));
  assert(state.phase === Phase.DISCUSSION || state.phase === Phase.GAME_OVER);
});

console.log('\nVoting System:');
test('vote phase initializes vote state', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  state.players.forEach(p => submitContribution(state, p.id, null));
  if (state.phase === Phase.GAME_OVER) return;
  enterVote(state);
  assert(state.voteState !== null);
  assert(state.voteState.isActive);
});

test('majority vote exiles a player', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  state.players.forEach(p => submitContribution(state, p.id, null));
  if (state.phase === Phase.GAME_OVER) return;
  enterVote(state);
  const target = state.players[3];
  state.players.slice(0, 3).forEach(p => castVote(state, p.id, target.id));
  if (state.voteState?.isActive) {
    castVote(state, state.players[3].id, null);
  }
  assert(!target.alive);
});

test('tied vote results in no exile', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  state.players.forEach(p => submitContribution(state, p.id, null));
  if (state.phase === Phase.GAME_OVER) return;
  enterVote(state);
  castVote(state, 'p1', 'p2');
  castVote(state, 'p3', 'p2');
  castVote(state, 'p2', 'p3');
  castVote(state, 'p4', 'p3');
  assert(state.players.every(p => p.alive));
});

console.log('\nPrivacy / View System:');
test('public view hides ownerPlayerId', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  state.players.forEach(p => submitContribution(state, p.id, null));
  const view = buildPublicGameView(state);
  for (const card of (view.todayDrawnCards ?? [])) {
    assert(!('ownerPlayerId' in card));
  }
});

test('self view includes role and hand', () => {
  const state = makeStartedGame(4);
  const self = buildSelfView(state, 'p1');
  assert(self.role !== undefined);
  assert(Array.isArray(self.hand));
});

test('public players have no role or hand', () => {
  const state = makeStartedGame(4);
  const pub = buildPublicGameView(state);
  for (const p of pub.players) {
    assert(!('hand' in p));
    assert(!('role' in p));
  }
});

console.log('\nDay Progression:');
test('day increments after vote', () => {
  const state = makeStartedGame(4);
  enterContribution(state);
  state.players.forEach(p => submitContribution(state, p.id, null));
  if (state.phase === Phase.GAME_OVER) return;
  enterVote(state);
  state.players.forEach(p => castVote(state, p.id, null));
  assert(state.day === 2 || state.phase === Phase.GAME_OVER);
});

console.log('\n─────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('✅ All tests passed!\n');
} else {
  console.log(`❌ ${failed} test(s) failed.\n`);
  process.exit(1);
}
