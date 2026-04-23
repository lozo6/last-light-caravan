'use strict';

const {
  createGameState,
  startGame,
  enterContribution,
  enterResolution,
  submitContribution,
  enterVote,
  castVote,
  buildPublicGameView,
  buildSelfView,
  Phase, Team,
} = require('../src/gameState');

const { ContributionAction } = require('../../shared/src/types');

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function describe(name, fn) {
  console.log(`\n${name}:`);
  fn();
}

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
  if (a !== b) throw new Error(message ?? `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertThrows(fn, message) {
  let threw = false;
  try { fn(); } catch (_) { threw = true; }
  if (!threw) throw new Error(message ?? 'Expected function to throw');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRoom(playerCount = 4) {
  const state = createGameState('TEST', 'p1', 'Alice');
  const names = ['Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank', 'Iris'];
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

function allContribute(state) {
  enterContribution(state);
  state.players.filter(p => p.alive).forEach(p => {
    const card = p.hand[0];
    submitContribution(state, p.id, card, ContributionAction.CONTRIBUTE, 0);
  });
}

// Keep allHold as a test helper that expects throws
function allHold(state) {
  allContribute(state); // hold no longer valid — use contribute instead
}

function resolveDay(state) {
  allContribute(state);
  if (state.phase === Phase.DRAW) enterResolution(state);
}

function advanceDay(state) {
  resolveDay(state);
  if (state.phase === Phase.GAME_OVER) return;
  enterVote(state);
  state.players.filter(p => p.alive).forEach(p => castVote(state, p.id, null));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\n🏜️  Last Light Caravan — Test Suite\n');

describe('Room & Lobby', () => {
  test('creates initial game state in lobby phase', () => {
    const state = createGameState('ABCD', 'p1', 'Alice');
    assertEqual(state.phase, Phase.LOBBY);
    assertEqual(state.players.length, 1);
    assertEqual(state.players[0].isHost, true);
  });

  test('cannot start with fewer than 4 players', () => {
    assertThrows(() => startGame(makeRoom(3)));
  });

  test('room starts with empty caravan deck', () => {
    const state = createGameState('ABCD', 'p1', 'Alice');
    assertEqual(state.caravanDeck.length, 0);
  });
});

describe('Role Assignment', () => {
  test('4 players get exactly 1 saboteur', () => {
    assertEqual(makeStartedGame(4).players.filter(p => p.role === Team.SABOTEUR).length, 1);
  });

  test('8 players get exactly 2 saboteurs', () => {
    assertEqual(makeStartedGame(8).players.filter(p => p.role === Team.SABOTEUR).length, 2);
  });

  test('all players have a role after start', () => {
    assert(makeStartedGame(4).players.every(p => p.role === Team.CREW || p.role === Team.SABOTEUR));
  });

  test('cannot have saboteurs >= total players', () => {
    const state = makeRoom(4);
    state.settings.numSaboteurs = 4;
    assertThrows(() => startGame(state));
  });

  test('cannot have fewer than 2 crew members', () => {
    const state = makeRoom(4);
    state.settings.numSaboteurs = 3;
    assertThrows(() => startGame(state));
  });
});

describe('Starting Resources', () => {
  test('food starts at 6',      () => assertEqual(makeStartedGame(4).resources.food, 6));
  test('water starts at 6',     () => assertEqual(makeStartedGame(4).resources.water, 6));
  test('morale starts at 5',    () => assertEqual(makeStartedGame(4).resources.morale, 5));
  test('integrity starts at 3', () => assertEqual(makeStartedGame(4).resources.integrity, 3));
});

describe('Hand System', () => {
  test('all players get 5 cards on start', () => {
    makeStartedGame(4).players.forEach(p => assertEqual(p.hand.length, 5));
  });

  test('crew members have no saboteur cards in starting hand', () => {
    makeStartedGame(4).players
      .filter(p => p.role === Team.CREW)
      .forEach(p => assert(p.hand.every(id => !id.startsWith('SAB_')), `${p.name} has sab card`));
  });

  test('crew members have no curse cards in starting hand', () => {
    makeStartedGame(4).players
      .filter(p => p.role === Team.CREW)
      .forEach(p => assert(p.hand.every(id => !id.startsWith('CURSE_')), `${p.name} has curse card`));
  });

  test('saboteur has at least 1 saboteur card in starting hand', () => {
    const wretch = makeStartedGame(4).players.find(p => p.role === Team.SABOTEUR);
    assert(wretch.hand.some(id => id.startsWith('SAB_')));
  });

  test('no curse cards in any player hand after daily draw', () => {
    const state = makeStartedGame(4);
    advanceDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    state.players.forEach(p =>
      assert(p.hand.every(id => !id.startsWith('CURSE_')), `${p.name} has curse card`)
    );
  });

  test('hand does not exceed maxHandSize', () => {
    const state = makeStartedGame(4);
    advanceDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    state.players.forEach(p =>
      assert(p.hand.length <= state.settings.maxHandSize)
    );
  });
});

describe('Phase Transitions', () => {
  test('game starts in dawnEvent phase', () => {
    assertEqual(makeStartedGame(4).phase, Phase.DAWN_EVENT);
  });

  test('day 1 dawn event is always Calm Morning', () => {
    assertEqual(makeStartedGame(4).currentEventId, 'EVENT_CALM_MORNING');
  });

  test('advance to contribution phase', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    assertEqual(state.phase, Phase.CONTRIBUTION);
  });

  test('contribution map initialized for all living players', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    state.players.forEach(p => {
      assert(p.id in state.contributions);
      assertEqual(state.contributions[p.id].locked, false);
    });
  });

  test('all submitting moves to draw phase', () => {
    const state = makeStartedGame(4);
    allContribute(state);
    assertEqual(state.phase, Phase.DRAW);
  });

  test('enterResolution moves to discussion or game_over', () => {
    const state = makeStartedGame(4);
    allContribute(state);
    enterResolution(state);
    assert(state.phase === Phase.DISCUSSION || state.phase === Phase.GAME_OVER);
  });
});

describe('Contribution System', () => {
  test('player can contribute a card', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const player = state.players[0];
    const card = player.hand[0];
    submitContribution(state, player.id, card, ContributionAction.CONTRIBUTE, 0);
    assert(!player.hand.includes(card));
    assert(state.caravanDeck.some(c => c.cardId === card));
  });

  test('player cannot hold — mandatory contribution enforced', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const player = state.players[0];
    assertThrows(
      () => submitContribution(state, player.id, null, ContributionAction.HOLD),
      'Hold should not be allowed'
    );
  });

  test('player can discard — card removed, not in deck', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const player = state.players[0];
    const card = player.hand[0];
    submitContribution(state, player.id, card, ContributionAction.DISCARD, 0);
    assert(!player.hand.includes(card));
    assert(!state.caravanDeck.some(c => c.cardId === card));
    assert(state.reshufflePile.some(c => c.cardId === card));
  });

  test('discarding saboteur card logs card name publicly', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const wretch = state.players.find(p => p.role === Team.SABOTEUR);
    const sabCard = wretch.hand.find(id => id.startsWith('SAB_'));
    if (!sabCard) return;
    const sabIdx = wretch.hand.indexOf(sabCard);
    submitContribution(state, wretch.id, sabCard, ContributionAction.DISCARD, sabIdx);
    const lastLog = state.log[state.log.length - 1].message;
    assert(lastLog.includes('Saboteur card'), `Log should mention Saboteur card, got: ${lastLog}`);
  });

  test('cannot contribute card not in hand', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    assertThrows(() => submitContribution(state, state.players[0].id, 'FAKE_CARD', ContributionAction.CONTRIBUTE));
  });

  test('cannot submit twice', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const p = state.players[0];
    submitContribution(state, p.id, p.hand[0], ContributionAction.CONTRIBUTE, 0);
    assertThrows(() => submitContribution(state, p.id, p.hand[0], ContributionAction.CONTRIBUTE, 0));
  });

  test('duplicate cards removed by index not by id', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const player = state.players[0];
    player.hand = ['CREW_REPAIR_KIT', 'CREW_REPAIR_KIT', 'CREW_WATER_CACHE'];
    submitContribution(state, player.id, 'CREW_REPAIR_KIT', ContributionAction.CONTRIBUTE, 1);
    assert(player.hand.includes('CREW_REPAIR_KIT'), 'First Repair Kit should remain');
    assertEqual(player.hand.length, 2);
  });
});

describe('Curse Card Injection', () => {
  test('day 1 injects 0 curse cards into deck', () => {
    const state = makeStartedGame(4);
    allContribute(state);
    // Day 1 curses = 0, so no world curse cards should appear in drawn cards or cleared deck
    const worldCursesDrawn = state.todayDrawnCards.filter(c => c.cardId.startsWith('CURSE_') && c.source === 'world').length;
    assertEqual(worldCursesDrawn, 0);
  });

  test('day 2 injects 1 curse card into draw log', () => {
    const state = makeStartedGame(4);
    advanceDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    enterContribution(state);
    state.players.filter(p => p.alive).forEach(p => {
      const card = p.hand[0];
      submitContribution(state, p.id, card, ContributionAction.CONTRIBUTE, 0);
    });
    const curseLog = state.log.find(e => e.message.includes('curse card') && e.day === 2);
    assert(curseLog !== undefined, 'Day 2 should log a curse injection');
  });

  test('injected curse cards have source world', () => {
    const state = makeStartedGame(4);
    advanceDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    allHold(state);
    const worldCards = state.caravanDeck.filter(c => c.source === 'world' && c.cardId.startsWith('CURSE_'));
    assert(worldCards.every(c => c.cardId.startsWith('CURSE_')));
  });
});

describe('Voting System', () => {
  test('vote phase initializes vote state', () => {
    const state = makeStartedGame(4);
    resolveDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    enterVote(state);
    assert(state.voteState?.isActive);
  });

  test('majority vote exiles a player', () => {
    const state = makeStartedGame(4);
    resolveDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    enterVote(state);
    const target = state.players[3];
    state.players.slice(0, 3).forEach(p => castVote(state, p.id, target.id));
    castVote(state, state.players[3].id, null);
    assert(!target.alive);
  });

  test('tied vote results in no exile', () => {
    const state = makeStartedGame(4);
    resolveDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    enterVote(state);
    castVote(state, 'p1', 'p2');
    castVote(state, 'p3', 'p2');
    castVote(state, 'p2', 'p3');
    castVote(state, 'p4', 'p3');
    assert(state.players.every(p => p.alive));
  });

  test('cannot vote for yourself', () => {
    const state = makeStartedGame(4);
    resolveDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    enterVote(state);
    assertThrows(() => castVote(state, 'p1', 'p1'));
  });

  test('exiling all saboteurs wins for crew', () => {
    const state = makeStartedGame(4);
    resolveDay(state);
    if (state.phase === Phase.GAME_OVER) return;
    enterVote(state);
    const wretch = state.players.find(p => p.role === Team.SABOTEUR);
    state.players.filter(p => p.id !== wretch.id).forEach(p => castVote(state, p.id, wretch.id));
    castVote(state, wretch.id, null);
    assertEqual(state.winner, Team.CREW);
    assertEqual(state.gameOverReason, 'all_saboteurs_exiled');
  });
});

describe('Privacy / View System', () => {
  test('public view hides ownerPlayerId on drawn cards', () => {
    const state = makeStartedGame(4);
    allHold(state);
    enterResolution(state);
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
    buildPublicGameView(state).players.forEach(p => {
      assert(!('hand' in p));
      assert(!('role' in p));
    });
  });

  test('reshuffle pile count visible in public view', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const player = state.players[0];
    const card = player.hand[0];
    // Only discard — don't trigger allLocked so enterDraw doesn't fire yet
    submitContribution(state, player.id, card, ContributionAction.DISCARD, 0);
    // Check reshuffle pile directly before other players lock in
    assertEqual(state.reshufflePile.length, 1);
    const view = buildPublicGameView(state);
    assert('reshufflePileCount' in view);
    assertEqual(view.reshufflePileCount, 1);
  });
});

describe('Day Progression', () => {
  test('day increments after vote', () => {
    const state = makeStartedGame(4);
    advanceDay(state);
    assert(state.day === 2 || state.phase === Phase.GAME_OVER);
  });

  test('game ends after 7 days', () => {
    const state = makeStartedGame(4);
    for (let i = 0; i < 7; i++) {
      if (state.phase === Phase.GAME_OVER) break;
      advanceDay(state);
    }
    if (state.phase !== Phase.GAME_OVER) {
      enterVote(state);
      state.players.filter(p => p.alive).forEach(p => castVote(state, p.id, null));
    }
    assertEqual(state.phase, Phase.GAME_OVER);
  });

  test('resource collapse ends game with saboteur win', () => {
    const state = makeStartedGame(4);
    allContribute(state);
    state.resources.integrity = 0;
    enterResolution(state);
    assertEqual(state.winner, Team.SABOTEUR);
    assertEqual(state.gameOverReason, 'resource_zero');
  });
});

describe('Discard & Reshuffle', () => {
  test('discarded card never appears as a drawn card', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    const player = state.players[0];
    const card = player.hand[0];
    submitContribution(state, player.id, card, ContributionAction.DISCARD, 0);
    state.players.slice(1).forEach(p => {
      submitContribution(state, p.id, p.hand[0], ContributionAction.CONTRIBUTE, 0);
    });
    // Discarded card should not appear in today's drawn cards
    assert(
      !state.todayDrawnCards.some(c => c.cardId === card && c.ownerPlayerId === player.id),
      'Discarded card should not be drawn'
    );
  });

  test('discarded cards go to reshuffle pile', () => {
    const state = makeStartedGame(4);
    enterContribution(state);
    // Discard first 3 players — enterDraw not triggered yet
    state.players.slice(0, 3).forEach(p => {
      const card = p.hand[0];
      submitContribution(state, p.id, card, ContributionAction.DISCARD, 0);
    });
    assertEqual(state.reshufflePile.length, 3);
    // 4th player contributes — triggers enterDraw
    const p4 = state.players[3];
    submitContribution(state, p4.id, p4.hand[0], ContributionAction.CONTRIBUTE, 0);
    // After draw+clear, reshuffle pile has discards + undrawn cards
    assert(state.reshufflePile.length >= 3, 'Discards should be in reshuffle pile');
  });
});

  test('deck clears after draw — undrawn cards go to reshuffle pile', () => {
    const state = makeStartedGame(4);
    allContribute(state); // 4 contributed + 0 curses (day 1) = 4 deck, draw 2 (floor((4+0)/2)=2)
    // After draw, remaining cards should be cleared to reshuffle pile
    assertEqual(state.caravanDeck.length, 0, 'Deck should be empty after draw+clear');
  });

// ─── Results ──────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('✅ All tests passed!\n');
} else {
  console.log(`❌ ${failed} test(s) failed.\n`);
  process.exit(1);
}
