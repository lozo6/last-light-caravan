const Phase = {
  LOBBY: 'lobby',
  DAWN_EVENT: 'dawnEvent',
  CONTRIBUTION: 'contribution',
  DRAW: 'draw',
  RESOLUTION: 'resolution',
  DISCUSSION: 'discussion',
  VOTE: 'vote',
  GAME_OVER: 'gameOver',
};

const Team = {
  CREW: 'crew',
  SABOTEUR: 'saboteur',
};

const CardType = {
  CREW: 'crew',
  SABOTEUR: 'saboteur',
  ENCOUNTER: 'encounter',
  EVENT: 'event',
};

const DEFAULT_SETTINGS = {
  maxPlayers: 10,
  numSaboteurs: null,
  numDays: 7,
  cardsPerDayDraw: 4,
  initialHandSize: 5,
  drawPerDay: 2,
  maxHandSize: 7,
  discussionTimerSeconds: 120,
  voteTimerSeconds: 60,
  revealExiledRole: true,
};

const STARTING_RESOURCES = {
  food: 6,
  water: 6,
  morale: 5,
  integrity: 4,
};

const RESOURCE_MIN = 0;
const RESOURCE_MAX = 10;

module.exports = {
  Phase,
  Team,
  CardType,
  DEFAULT_SETTINGS,
  STARTING_RESOURCES,
  RESOURCE_MIN,
  RESOURCE_MAX,
};
