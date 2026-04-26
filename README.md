# Last Light Caravan

A real-time multiplayer social deduction game for 4–10 players, built with React, Node.js, and Socket.io.

Play it here: [last-light-caravan-client.vercel.app](https://last-light-caravan-client.vercel.app)

---

## What is it

Last Light Caravan is a deck-building social deduction game set in a harsh desert world. Players travel together in a caravan toward a distant sanctuary, managing shared resources across a 7-day journey. Hidden among the crew are Wretches — saboteurs who secretly contribute harmful cards to the shared deck, drain resources, and steer the group toward collapse.

Every day, players contribute cards to a shared deck. A subset of those cards is drawn and resolved, affecting the caravan's Food, Water, Morale, and Wagon Integrity. Players then discuss what happened and vote to exile anyone they suspect.

For full rules and gameplay, see [RULES.md](./RULES.md).

---

## Stack

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Frontend   | React 19, Vite, Tailwind CSS, shadcn/ui, Zustand |
| Backend    | Node.js, Express, Socket.io                      |
| Deployment | Vercel (client), Render (server)                 |
| Monorepo   | npm workspaces                                   |

---

## Project Structure

```
last-light-caravan/
├── packages/
│   ├── client/          # React frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Game.jsx       # Main game UI
│   │       │   └── Lobby.jsx      # Room creation and joining
│   │       ├── store/
│   │       │   └── gameStore.js   # Zustand state store
│   │       └── lib/
│   │           └── socket.js      # Socket.io client
│   ├── server/          # Node.js backend
│   │   ├── src/
│   │   │   ├── server.js          # Express + Socket.io server
│   │   │   └── gameState.js       # All game logic
│   │   ├── data/
│   │   │   └── cards.json         # Card definitions
│   │   └── tests/
│   │       └── gameState.test.js  # Test suite (49 tests)
│   └── shared/          # Shared types and constants
│       └── src/
│           └── types.js
├── README.md
└── RULES.md
```

---

## Getting Started

Install dependencies from the repo root:

```bash
npm install
```

Run both client and server in development:

```bash
npm run dev
```

This starts the server on `http://localhost:3000` and the client on `http://localhost:5173`.

To test with multiple players locally, open multiple browser windows at `http://localhost:5173`.

---

## Running Tests

```bash
cd packages/server
npm test
```

The test suite covers role assignment, hand dealing, phase transitions, contribution mechanics, curse injection, voting, privacy/view system, day progression, and discard/reshuffle behaviour.

---

## Deployment

### Server (Render)

1. Connect your GitHub repo to [render.com](https://render.com)
2. Create a new Web Service with:
   - Root Directory: _(leave blank)_
   - Build Command: `cd packages/server && npm install`
   - Start Command: `node packages/server/src/server.js`
   - Instance Type: Free

### Client (Vercel)

1. Connect your GitHub repo to [vercel.com](https://vercel.com)
2. Set Root Directory to `packages/client`
3. Add environment variable:
   - `VITE_SERVER_URL` = your Render server URL
4. Redeploy

The client reads `VITE_SERVER_URL` at build time to point the Socket.io connection at the correct server. Locally it falls back to `http://localhost:3000`.

---

## Environment Variables

| Variable          | Location        | Description                                     |
| ----------------- | --------------- | ----------------------------------------------- |
| `VITE_SERVER_URL` | Client (Vercel) | Render server URL for Socket.io                 |
| `PORT`            | Server (Render) | Port to listen on — set automatically by Render |

---

## Key Design Decisions

**Mandatory contribution** — every player must contribute or discard a card each round. Holding is not allowed. This keeps the deck populated and every day meaningful.

**Scaled draw count** — cards drawn per day scales with player count to maintain roughly 50% draw rate regardless of game size. Prevents deck starvation at high player counts.

**Deck resets each day** — undrawn cards are cleared to a reshuffle pile after each draw phase. Prevents carry-over accumulation that would dilute surface probability at larger player counts.

**Curse cards as world events** — curse cards are never dealt to players. The server injects them directly into the Caravan Deck each day, scaling from 0 on Day 1 to 3 on Days 6–7. This creates natural resource pressure without player agency.

**Saboteur discard reveal** — if a Wretch discards a Saboteur card, the card name is publicly logged. This makes discarding a high-stakes decision with real social consequences.

**Index-based card removal** — cards are removed from hand by index, not by card ID, to correctly handle duplicate cards in a hand.

**Draw phase pause** — resolution does not happen automatically after drawing. The host clicks Resolve Cards to give everyone time to see what was drawn before effects apply.

---

## Branch Naming

```
feature/   — new features
bug/       — bug fixes
chore/     — maintenance, refactoring, tooling
```

---

## Current Known Issues / Next Session

- Player disconnect mid-game should end or pause the game
- Reconnect flow needs client-side UI
- Rules link in lobby screen
- Player name alignment in sidebar (in-game)
