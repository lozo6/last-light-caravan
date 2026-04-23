import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // Connection
  connected: false,

  // Game state (public view from server)
  phase: null,
  day: 0,
  resources: { food: 6, water: 6, morale: 5, integrity: 4 },
  players: [],
  currentEventId: null,
  nextEventId: null,
  todayDrawnCards: [],
  persistentEffects: [],
  caravanDeckCount: 0,
  discardPileCount: 0,
  voteState: null,
  contributionStatus: {},
  log: [],
  winner: null,
  gameOverReason: null,
  lobby: null,
  settings: null,

  // Self view (private)
  self: null,

  // Local UI state
  roomId: null,
  playerName: '',
  chatMessages: [],
  reconnectToken: null,

  // Cards data (loaded from server via state)
  cardMap: {},

  // Actions
  setGameState: (game) => set({
    phase: game.phase,
    day: game.day,
    resources: game.resources,
    players: game.players,
    currentEventId: game.currentEventId,
    nextEventId: game.nextEventId,
    todayDrawnCards: game.todayDrawnCards,
    persistentEffects: game.persistentEffects,
    caravanDeckCount: game.caravanDeckCount,
    discardPileCount: game.discardPileCount,
    voteState: game.voteState,
    contributionStatus: game.contributionStatus,
    log: game.log,
    winner: game.winner,
    gameOverReason: game.gameOverReason,
    lobby: game.lobby,
    settings: game.settings,
  }),

  setSelfState: (self) => set({ self }),

  setConnected: (connected) => set({ connected }),

  setRoomId: (roomId) => set({ roomId }),

  setPlayerName: (playerName) => set({ playerName }),

  setReconnectToken: (token) => set({ reconnectToken: token }),

  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-99), msg],
  })),

  clearChat: () => set({ chatMessages: [] }),
}))
