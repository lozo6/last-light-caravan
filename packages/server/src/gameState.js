'use strict';

const {
  Phase, Team, CardType, ContributionAction,
  DEFAULT_SETTINGS, STARTING_RESOURCES,
  RESOURCE_MIN, RESOURCE_MAX,
} = require('../../shared/src/types');

const ALL_CARDS = require('../data/cards.json');
const CARD_MAP  = new Map(ALL_CARDS.map(c => [c.id, c]));

const DAWN_EVENT_IDS = ALL_CARDS
  .filter(c => c.type === CardType.EVENT && c.id !== 'EVENT_CALM_MORNING')
  .map(c => c.id);

const NEUTRAL_EVENT_ID = 'EVENT_CALM_MORNING'; // Day 1 always neutral

const CREW_CARD_IDS  = ALL_CARDS.filter(c => c.type === CardType.CREW).map(c => c.id);
const SAB_CARD_IDS   = ALL_CARDS.filter(c => c.type === CardType.SABOTEUR).map(c => c.id);
const CURSE_CARD_IDS = ALL_CARDS.filter(c => c.type === CardType.CURSE).map(c => c.id);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampResource(resources, key, delta) {
  resources[key] = Math.max(RESOURCE_MIN, Math.min(RESOURCE_MAX, resources[key] + delta));
}

function makeCardInstance(cardId, ownerPlayerId = null, source = 'player') {
  return {
    instanceId: uuidv4(),
    cardId,
    ownerPlayerId,
    source,
    revealed: false,
    position: null,
  };
}

function addLog(state, message) {
  state.log.push({
    id:        uuidv4(),
    day:       state.day,
    phase:     state.phase,
    message,
    timestamp: Date.now(),
  });
}

function getLivingPlayers(state) {
  return state.players.filter(p => p.alive);
}

function getSaboteurCount(playerCount) {
  return Math.max(1, Math.floor(playerCount / 4));
}

function dealCards(cardIdPool, count) {
  const shuffled = shuffle(cardIdPool);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

// Weighted draw — 20% curse chance for all, 30% saboteur chance for Wretches
// Uses shuffled pools to avoid duplicate cards in the same hand
function dealCardsWeighted(role, count) {
  const crewPool   = shuffle([...CREW_CARD_IDS]);
  const cursePool  = shuffle([...CURSE_CARD_IDS]);
  const sabPool    = shuffle([...SAB_CARD_IDS]);
  let crewIdx = 0, curseIdx = 0, sabIdx = 0;

  const result = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let cardId;
    if (role === Team.SABOTEUR) {
      if (roll < 0.30) {
        cardId = sabPool[sabIdx % sabPool.length]; sabIdx++;
      } else if (roll < 0.50) {
        cardId = cursePool[curseIdx % cursePool.length]; curseIdx++;
      } else {
        cardId = crewPool[crewIdx % crewPool.length]; crewIdx++;
      }
    } else {
      if (roll < 0.20) {
        cardId = cursePool[curseIdx % cursePool.length]; curseIdx++;
      } else {
        cardId = crewPool[crewIdx % crewPool.length]; crewIdx++;
      }
    }
    result.push(cardId);
  }
  return result;
}

function checkWinConditions(state) {
  const { resources, players } = state;

  const collapsed = Object.entries(resources).find(([, v]) => v <= 0);
  if (collapsed) {
    state.winner         = Team.SABOTEUR;
    state.gameOverReason = 'resource_zero';
    state.phase          = Phase.GAME_OVER;
    addLog(state, `CARAVAN LOST — ${collapsed[0]} reached zero. The Wretches win.`);
    return true;
  }

  const livingSaboteurs = players.filter(p => p.alive && p.role === Team.SABOTEUR);
  if (livingSaboteurs.length === 0) {
    state.winner         = Team.CREW;
    state.gameOverReason = 'all_saboteurs_exiled';
    state.phase          = Phase.GAME_OVER;
    addLog(state, 'CARAVAN SAVED — All Wretches have been exiled. The Crew wins!');
    return true;
  }

  return false;
}

function startGame(state) {
  if (state.phase !== Phase.LOBBY) throw new Error('Game already started');
  if (state.players.length < 4) throw new Error('Need at least 4 players');

  const settings    = state.settings;
  const playerCount = state.players.length;
  const numSaboteurs = settings.numSaboteurs ?? getSaboteurCount(playerCount);

  // Guard: saboteurs must be fewer than crew, and at least 1 Crew must exist
  if (numSaboteurs >= playerCount) throw new Error('Too many Saboteurs — must be fewer than total players');
  if (playerCount - numSaboteurs < 2) throw new Error('Need at least 2 Crew members to start');

  const roles = shuffle([
    ...Array(numSaboteurs).fill(Team.SABOTEUR),
    ...Array(playerCount - numSaboteurs).fill(Team.CREW),
  ]);
  state.players.forEach((p, i) => { p.role = roles[i]; });

  state.resources = { ...STARTING_RESOURCES };

  state.players.forEach(p => {
    if (p.role === Team.SABOTEUR) {
      // Guarantee 1 saboteur card, rest weighted without replacement
      const sabPool   = shuffle([...SAB_CARD_IDS]);
      const crewPool  = shuffle([...CREW_CARD_IDS]);
      const cursePool = shuffle([...CURSE_CARD_IDS]);
      let crewIdx = 0, curseIdx = 0;
      const hand = [sabPool[0]]; // guaranteed 1 sab card
      for (let i = 0; i < settings.initialHandSize - 1; i++) {
        const roll = Math.random();
        if (roll < 0.20) { hand.push(cursePool[curseIdx % cursePool.length]); curseIdx++; }
        else             { hand.push(crewPool[crewIdx % crewPool.length]);  crewIdx++;  }
      }
      p.hand = shuffle(hand);
    } else {
      // Crew: 80% crew, 20% curse — without replacement
      const crewPool  = shuffle([...CREW_CARD_IDS]);
      const cursePool = shuffle([...CURSE_CARD_IDS]);
      let crewIdx = 0, curseIdx = 0;
      const hand = [];
      for (let i = 0; i < settings.initialHandSize; i++) {
        const roll = Math.random();
        if (roll < 0.20) { hand.push(cursePool[curseIdx % cursePool.length]); curseIdx++; }
        else             { hand.push(crewPool[crewIdx % crewPool.length]);  crewIdx++;  }
      }
      p.hand = hand;
    }
  });

  state.day = 1;
  addLog(state, `Day 1 begins. The caravan departs.`);
  enterDawnEvent(state, true);
}

function enterDawnEvent(state, skipDailyDraw = false) {
  state.phase = Phase.DAWN_EVENT;

  // Apply and tick persistent effects
  const expiredIds = [];
  for (const effect of state.persistentEffects) {
    if (effect.resource && effect.change !== undefined) {
      clampResource(state.resources, effect.resource, effect.change);
      addLog(state, `[Persistent] ${effect.name ?? effect.sourceCardId}: ${effect.resource} ${effect.change > 0 ? '+' : ''}${effect.change}`);
    }
    effect.remainingDays--;
    if (effect.remainingDays <= 0) expiredIds.push(effect.id);
  }
  state.persistentEffects = state.persistentEffects.filter(e => !expiredIds.includes(e.id));

  if (checkWinConditions(state)) return;

  // Pick dawn event
  if (state.day === 1) {
    // Day 1 is always a calm, neutral start — no modifiers
    state.currentEventId = NEUTRAL_EVENT_ID;
  } else if (state.nextEventId) {
    state.currentEventId = state.nextEventId;
    state.nextEventId    = null;
  } else {
    state.currentEventId = DAWN_EVENT_IDS[Math.floor(Math.random() * DAWN_EVENT_IDS.length)];
  }

  const event = CARD_MAP.get(state.currentEventId);
  addLog(state, `Dawn Event — Day ${state.day}: ${event.name}. ${event.flavour}`);

  // Reset contributions for all living players
  state.contributions = {};
  getLivingPlayers(state).forEach(p => {
    state.contributions[p.id] = { locked: false };
  });

  // Deal daily cards
  if (!skipDailyDraw) {
    state.players.forEach(p => {
      if (!p.alive) return;
      const drawCount = Math.min(
        state.settings.drawPerDay,
        state.settings.maxHandSize - p.hand.length
      );
      if (drawCount > 0) {
        const drawn = dealCardsWeighted(p.role, drawCount);
        p.hand.push(...drawn);
      }
    });
  }
}

function enterContribution(state) {
  state.phase = Phase.CONTRIBUTION;
  addLog(state, `Day ${state.day} — Contribution Phase. Players secretly choose their cards.`);
}

function submitContribution(state, playerId, cardId, action = ContributionAction.CONTRIBUTE, cardIndex = null) {
  if (state.phase !== Phase.CONTRIBUTION) throw new Error('Not in contribution phase');

  const player = state.players.find(p => p.id === playerId);
  if (!player || !player.alive) throw new Error('Player not found or not alive');

  const contrib = state.contributions[playerId];
  if (!contrib) throw new Error('No contribution record for player');
  if (contrib.locked) throw new Error('Already submitted');

  // Remove exactly one card from hand by index if valid, else fall back to indexOf
  function removeOneFromHand(hand, id, idx) {
    const removeAt = (idx !== null && idx >= 0 && hand[idx] === id) ? idx : hand.indexOf(id);
    if (removeAt === -1) throw new Error('Card not in hand');
    return [...hand.slice(0, removeAt), ...hand.slice(removeAt + 1)];
  }

  if (action === ContributionAction.CONTRIBUTE && cardId) {
    // Contribute — card enters the Caravan Deck
    if (!player.hand.includes(cardId)) throw new Error('Card not in hand');
    player.hand = removeOneFromHand(player.hand, cardId, cardIndex);
    const instance = makeCardInstance(cardId, playerId, 'player');
    state.caravanDeck.push(instance);
    contrib.contributedCardId      = cardId;
    contrib.contributedInstanceId  = instance.instanceId;
    contrib.action                 = ContributionAction.CONTRIBUTE;
    addLog(state, `${player.name} contributed a card.`);

  } else if (action === ContributionAction.DISCARD && cardId) {
    // Discard — removed from hand
    // Saboteur cards permanently gone, everything else goes to reshuffle pile
    if (!player.hand.includes(cardId)) throw new Error('Card not in hand');
    player.hand = removeOneFromHand(player.hand, cardId, cardIndex);
    const def = CARD_MAP.get(cardId);
    if (def?.type === CardType.SABOTEUR) {
      // Permanent removal — goes to discard pile, never returns
      state.discardPile.push(makeCardInstance(cardId, playerId, 'discarded'));
    } else {
      // Crew or curse card — goes to reshuffle pile, returns when deck empties
      state.reshufflePile.push(makeCardInstance(cardId, playerId, 'discarded'));
    }
    contrib.action = ContributionAction.DISCARD;
    addLog(state, `${player.name} discarded a card.`);

  } else {
    // Hold — contribute nothing, hand unchanged
    contrib.action = ContributionAction.HOLD;
    addLog(state, `${player.name} held.`);
  }

  contrib.locked = true;

  const allLocked = getLivingPlayers(state).every(p => state.contributions[p.id]?.locked);
  if (allLocked) {
    enterDraw(state);
  }
}

function enterDraw(state) {
  state.phase = Phase.DRAW;

  let drawCount = state.settings.cardsPerDayDraw;
  const event = CARD_MAP.get(state.currentEventId);
  if (event?.effect?.draw_count_modifier) {
    drawCount = Math.max(1, drawCount + event.effect.draw_count_modifier);
  }

  // Only reshuffle when deck is completely empty — never mid-day
  // This prevents same-day discards from being immediately drawn
  if (state.caravanDeck.length === 0 && state.reshufflePile.length > 0) {
    addLog(state, `The Caravan Deck is empty — discarded cards return to the pile.`);
    state.caravanDeck.push(...state.reshufflePile);
    state.reshufflePile = [];
  }

  state.caravanDeck = shuffle(state.caravanDeck);

  const actualDraw      = Math.min(drawCount, state.caravanDeck.length);
  state.todayDrawnCards = [];
  for (let i = 0; i < actualDraw; i++) {
    const card    = state.caravanDeck.shift();
    card.position = i;
    state.todayDrawnCards.push(card);
  }

  addLog(state, `Draw Phase — ${actualDraw} card(s) drawn from the Caravan Deck.`);
  // Resolution is triggered manually by host via advance_resolution socket event
}

function enterResolution(state) {
  state.phase = Phase.RESOLUTION;

  const event       = CARD_MAP.get(state.currentEventId);
  const eventEffect = event?.effect ?? {};

  let cancelNextHazard          = eventEffect.cancel_first_hazard_today ?? false;
  let firstGainBecomesLoss      = eventEffect.first_gain_becomes_loss_today ?? false;
  let secondCardTriggeredTwice  = eventEffect.second_card_triggers_twice ?? false;
  let preventNextSaboteurEffect = false;
  let invertNextPositiveGain    = false;
  let weakenNextRepair          = false;
  let doubleFirstEncounter      = false;
  let firstGainUsed             = false;

  const orderedCards = [...state.todayDrawnCards].sort((a, b) => a.position - b.position);

  for (let idx = 0; idx < orderedCards.length; idx++) {
    const instance = orderedCards[idx];
    const def      = CARD_MAP.get(instance.cardId);
    if (!def) continue;

    instance.revealed = true;
    const effect   = def.effect;
    const isHazard = def.type === CardType.SABOTEUR || def.type === CardType.ENCOUNTER;

    if (isHazard && cancelNextHazard) {
      addLog(state, `[${def.name}] — CANCELLED by Clear Skies.`);
      cancelNextHazard = false;
      state.discardPile.push(instance);
      continue;
    }

    if (def.type === CardType.SABOTEUR && preventNextSaboteurEffect) {
      addLog(state, `[${def.name}] — Saboteur effect PREVENTED.`);
      preventNextSaboteurEffect = false;
      state.discardPile.push(instance);
      continue;
    }

    const applyTimes = (idx === 1 && secondCardTriggeredTwice) ? 2 : 1;

    for (let t = 0; t < applyTimes; t++) {
      applyCardEffect(state, def, effect, {
        invertNextPositiveGain,
        weakenNextRepair,
        doubleFirstEncounter: doubleFirstEncounter && def.type === CardType.ENCOUNTER,
        firstGainBecomesLoss: firstGainBecomesLoss && !firstGainUsed,
      }, (modifiers) => {
        if (modifiers.usedFirstGain)      { firstGainUsed = true; firstGainBecomesLoss = false; }
        if (modifiers.setPreventSaboteur) preventNextSaboteurEffect = true;
        if (modifiers.setCancelHazard)    cancelNextHazard = true;
        if (modifiers.setInvertNext)      invertNextPositiveGain = true;
        if (modifiers.setWeakenRepair)    weakenNextRepair = true;
        if (modifiers.setDoubleEncounter) doubleFirstEncounter = true;
      });

      if (t === 0 && applyTimes === 2) {
        addLog(state, `[${def.name}] — Mirage Fields: triggers again!`);
      }
    }

    state.discardPile.push(instance);
  }

  state.todayDrawnCards = [];

  if (checkWinConditions(state)) return;

  enterDiscussion(state);
}

function applyCardEffect(state, def, effect, modifiers, updateModifiers) {
  const logParts = [`[${def.name}]`];

  if (effect.resource && effect.change !== undefined) {
    let delta = effect.change;

    if (effect.conditional) {
      if (evaluateCondition(state, effect.conditional.if)) {
        delta += effect.conditional.bonus_change ?? 0;
      }
    }

    if (modifiers.firstGainBecomesLoss && delta > 0) {
      logParts.push(`(Thieves Nearby: gain inverted!)`);
      delta = -1;
      updateModifiers({ usedFirstGain: true });
    }

    if (modifiers.weakenNextRepair && effect.resource === 'integrity' && delta > 0) {
      delta = Math.max(0, delta - 1);
      logParts.push(`(Shoddy prior repair: weakened)`);
    }

    clampResource(state.resources, effect.resource, delta);
    logParts.push(`${effect.resource} ${delta >= 0 ? '+' : ''}${delta} → ${state.resources[effect.resource]}`);
  }

  if (effect.multi_resource) {
    for (const mr of effect.multi_resource) {
      let delta = mr.change;
      if (modifiers.firstGainBecomesLoss && delta > 0) {
        delta = -1;
        updateModifiers({ usedFirstGain: true });
      }
      clampResource(state.resources, mr.resource, delta);
      logParts.push(`${mr.resource} ${delta >= 0 ? '+' : ''}${delta} → ${state.resources[mr.resource]}`);
    }
  }

  if (effect.persistent) {
    const pe = {
      id:            uuidv4(),
      sourceCardId:  def.id,
      remainingDays: effect.persistent.duration,
      resource:      effect.persistent.resource,
      change:        effect.persistent.change,
      name:          def.name,
    };
    state.persistentEffects.push(pe);
    logParts.push(`[Persistent: ${pe.resource} ${pe.change}/day for ${pe.remainingDays} day(s)]`);
  }

  if (effect.add_encounter_tomorrow || effect.add_specific_card_tomorrow) {
    const encId    = effect.add_encounter_tomorrow || effect.add_specific_card_tomorrow;
    const instance = makeCardInstance(encId, null, 'world');
    state.caravanDeck.push(instance);
    logParts.push(`[Encounter "${CARD_MAP.get(encId)?.name}" added to tomorrow's deck]`);
  }

  if (effect.cancel_next_hazard)           updateModifiers({ setCancelHazard: true });
  if (effect.prevent_next_saboteur_effect) updateModifiers({ setPreventSaboteur: true });
  if (effect.invert_next_positive_gain)    updateModifiers({ setInvertNext: true });
  if (effect.weaken_next_repair)           updateModifiers({ setWeakenRepair: true });
  if (effect.double_first_encounter)       updateModifiers({ setDoubleEncounter: true });

  if (effect.reveal_next_dawn_event) {
    const nextId    = DAWN_EVENT_IDS[Math.floor(Math.random() * DAWN_EVENT_IDS.length)];
    state.nextEventId = nextId;
    const nextEvent = CARD_MAP.get(nextId);
    logParts.push(`[Tomorrow's Dawn: ${nextEvent.name}]`);
  }

  if (effect.remove_persistent_effect && state.persistentEffects.length > 0) {
    const removed = state.persistentEffects.shift();
    logParts.push(`[Persistent effect "${removed.name ?? removed.sourceCardId}" removed]`);
  }

  addLog(state, logParts.join(' '));
}

function evaluateCondition(state, condition) {
  if (!condition) return false;
  const r = state.resources;
  try {
    if (condition === 'morale_is_lowest') {
      const min = Math.min(r.food, r.water, r.morale, r.integrity);
      return r.morale === min;
    }
    if (condition === 'food_lost_yesterday') {
      return state.flags?.foodLostYesterday ?? false;
    }
    if (condition.includes(' and ')) {
      return condition.split(' and ').every(c => evaluateCondition(state, c.trim()));
    }
    const match = condition.match(/^(\w+)\s*([<>=!]+)\s*(\d+)$/);
    if (match) {
      const [, key, op, valStr] = match;
      const val = parseInt(valStr, 10);
      const cur = r[key] ?? 0;
      if (op === '<')        return cur < val;
      if (op === '>')        return cur > val;
      if (op === '<=')       return cur <= val;
      if (op === '>=')       return cur >= val;
      if (op === '==' || op === '=') return cur === val;
    }
  } catch (_) {}
  return false;
}

function enterDiscussion(state) {
  state.phase = Phase.DISCUSSION;
  addLog(state, `Campfire Discussion — Day ${state.day}. What happened today?`);
}

function enterVote(state) {
  state.phase    = Phase.VOTE;
  state.voteState = {
    isActive: true,
    day:      state.day,
    votes:    {},
  };
  addLog(state, `Vote Phase — Day ${state.day}. Who do you suspect?`);
}

function castVote(state, voterId, targetId) {
  if (state.phase !== Phase.VOTE)    throw new Error('Not in vote phase');
  if (!state.voteState?.isActive)    throw new Error('No active vote');

  const voter = state.players.find(p => p.id === voterId);
  if (!voter?.alive) throw new Error('Voter is not alive');

  if (targetId !== null) {
    const target = state.players.find(p => p.id === targetId);
    if (!target?.alive)       throw new Error('Target is not alive');
    if (targetId === voterId) throw new Error('Cannot vote for yourself');
  }

  state.voteState.votes[voterId] = targetId;
  addLog(state, `${voter.name} has voted.`);

  const living   = getLivingPlayers(state);
  const allVoted = living.every(p => p.id in state.voteState.votes);
  if (allVoted) resolveVote(state);
}

function resolveVote(state) {
  const { votes } = state.voteState;

  const tally = {};
  for (const targetId of Object.values(votes)) {
    if (targetId === null) continue;
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }

  let exileId    = null;
  const sorted   = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const [topId, topVotes] = sorted[0];
    const tied = sorted.filter(([, v]) => v === topVotes);
    if (tied.length === 1) exileId = topId;
  }

  if (exileId) {
    const exiled  = state.players.find(p => p.id === exileId);
    exiled.alive  = false;
    const roleStr = state.settings.revealExiledRole ? ` They were a ${exiled.role.toUpperCase()}.` : '';
    addLog(state, `${exiled.name} has been exiled!${roleStr}`);
  } else {
    addLog(state, `The vote was tied. No one is exiled.`);
  }

  state.voteState.isActive = false;

  if (checkWinConditions(state)) return;

  if (state.day >= state.settings.numDays) {
    state.winner         = Team.CREW;
    state.gameOverReason = 'days_complete';
    state.phase          = Phase.GAME_OVER;
    addLog(state, `The caravan reaches the Last Light. The Crew survives!`);
  } else {
    state.day++;
    addLog(state, `Day ${state.day} begins.`);
    enterDawnEvent(state);
  }
}

function forceResolveVote(state) {
  if (state.phase !== Phase.VOTE) return;
  getLivingPlayers(state).forEach(p => {
    if (!(p.id in state.voteState.votes)) {
      state.voteState.votes[p.id] = null;
    }
  });
  resolveVote(state);
}

function createGameState(roomId, hostSocketId, hostName) {
  return {
    lobby:            { roomId, hostId: hostSocketId, createdAt: Date.now() },
    settings:         { ...DEFAULT_SETTINGS },
    players: [{
      id:                hostSocketId,
      name:              hostName,
      role:              null,
      alive:             true,
      isHost:            true,
      hand:              [],
      connected:         true,
      votedForPlayerId:  null,
      reconnectToken:    uuidv4(),
    }],
    day:              0,
    phase:            Phase.LOBBY,
    winner:           null,
    gameOverReason:   null,
    resources:        { ...STARTING_RESOURCES },
    persistentEffects: [],
    caravanDeck:      [],
    discardPile:      [],
    reshufflePile:    [],
    todayDrawnCards:  [],
    contributions:    {},
    currentEventId:   null,
    nextEventId:      null,
    voteState:        null,
    flags:            {},
    log:              [],
  };
}

function buildPublicGameView(state) {
  return {
    lobby:    state.lobby,
    settings: state.settings,
    day:      state.day,
    phase:    state.phase,
    resources: state.resources,
    players:  state.players.map(p => ({
      id:        p.id,
      name:      p.name,
      alive:     p.alive,
      isHost:    p.isHost,
      connected: p.connected,
    })),
    currentEventId: state.currentEventId,
    nextEventId:    state.nextEventId,
    todayDrawnCards: state.todayDrawnCards.map(ci => ({
      instanceId: ci.instanceId,
      cardId:     ci.cardId,
      revealed:   ci.revealed,
      position:   ci.position,
      source:     ci.source,
    })),
    persistentEffects: state.persistentEffects.map(e => ({
      id:            e.id,
      name:          e.name,
      remainingDays: e.remainingDays,
      resource:      e.resource,
      change:        e.change,
    })),
    caravanDeckCount:  state.caravanDeck.length,
    discardPileCount:  state.discardPile.length,
    reshufflePileCount: state.reshufflePile.length,
    voteState: state.voteState ? {
      isActive:       state.voteState.isActive,
      day:            state.voteState.day,
      votedPlayerIds: Object.keys(state.voteState.votes),
    } : null,
    log:             state.log,
    winner:          state.winner,
    gameOverReason:  state.gameOverReason,
    contributionStatus: Object.fromEntries(
      Object.entries(state.contributions).map(([id, c]) => [id, { locked: c.locked }])
    ),
  };
}

function buildSelfView(state, playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return null;
  return {
    id:        player.id,
    name:      player.name,
    alive:     player.alive,
    isHost:    player.isHost,
    connected: player.connected,
    role:      player.role,
    hand:      player.hand,
  };
}

function buildGameOverView(state) {
  const view   = buildPublicGameView(state);
  view.players = state.players.map(p => ({
    id:        p.id,
    name:      p.name,
    alive:     p.alive,
    isHost:    p.isHost,
    connected: p.connected,
    role:      p.role,
  }));
  return view;
}

module.exports = {
  createGameState,
  startGame,
  enterContribution,
  enterResolution,
  submitContribution,
  enterVote,
  castVote,
  forceResolveVote,
  buildPublicGameView,
  buildSelfView,
  buildGameOverView,
  CARD_MAP,
  Phase,
  Team,
};
