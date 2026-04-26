# Last Light Caravan — Rules

> The desert does not forgive. Neither do the Wretches among you.

Last Light Caravan is an online multiplayer social deduction game for 4–10 players. Your caravan is making a desperate 7-day journey across a scorched desert toward a distant sanctuary called the Last Light. Every player shares the same goal — survive. But hidden among the Crew are Wretches: saboteurs quietly poisoning the deck, draining resources, and steering the caravan toward collapse.

Trust no one. Every card is a clue. Every vote could save you — or doom you.

Play here: [last-light-caravan-client.vercel.app](https://last-light-caravan-client.vercel.app)

---

## Before You Start

- You need at least 4 players — the game will not start with fewer
- One player creates the room and shares the 4-letter room code with everyone
- All players must join before the host starts — you cannot join mid-game
- Everyone needs the game open on their own device
- The host controls the pace — they click Continue at each Dawn Event and Resolve Cards during the Draw Phase

---

## How to Win

The Crew wins if the caravan survives all 7 days with every resource above zero, or if all Wretches are identified and exiled before then.

The Wretches win if any single resource — Food, Water, Morale, or Wagon Integrity — reaches zero at any point during the game.

---

## Roles

### Crew Member

You are a loyal member of the caravan. Your hand contains only helpful cards that restore resources, cancel hazards, or provide information. Work together, read the deck, find the Wretches, and exile them before it is too late.

### Wretch (Saboteur)

You are a hidden enemy. You look like a Crew member and hold many of the same cards — but you also receive Saboteur cards that drain resources, spread debuffs, and sow chaos. Your job is to damage the caravan without getting caught, and vote strategically to protect yourself and your fellow Wretches.

**Wretch count by player count:**

| Players | Wretches |
| ------- | -------- |
| 4–5     | 1        |
| 6–7     | 1        |
| 8–10    | 2        |

---

## Resources

The caravan lives and dies by four shared resources, each tracked on a scale from 0 to 10.

| Resource        | Starting Value |
| --------------- | -------------- |
| Food            | 6              |
| Water           | 6              |
| Morale          | 5              |
| Wagon Integrity | 3              |

If any resource reaches zero, the Wretches win immediately — no matter what day it is. Wagon Integrity starts lower than the others and is the most vulnerable resource.

---

## Your Hand

At the start of the game each player receives 5 cards. Each new day you draw 1 more card, up to a maximum of 5 cards in hand.

Crew members draw only Crew cards. Every card in your hand is helpful — there is never a reason to discard unless you are hiding something.

Wretches draw mostly Crew cards but also have a chance of drawing Saboteur cards each day. Their hand looks mostly like a Crew member's, but dangerous cards are mixed in.

---

## A Day in the Caravan

Each of the 7 days follows the same sequence of five phases.

---

### Phase 1 — Dawn Event

A Dawn Event is revealed to all players. It sets a special rule that modifies how this day plays out. Read it carefully.

Any persistent effects from previous days also trigger here before anything else.

The host clicks Continue to move the caravan into the Contribution Phase.

**Dawn Events:**

| Event          | Effect                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Calm Morning   | Day 1 only. No special conditions — the desert gives you one free day. |
| Scorch Day     | Food losses are doubled today.                                         |
| Clear Skies    | The first hazard card resolved today is cancelled.                     |
| Thieves Nearby | The first resource gain today becomes a small loss instead.            |
| Tailwind       | One fewer card is drawn from the deck today.                           |
| Mirage Fields  | The second card resolved today triggers twice.                         |

---

### Phase 2 — Contribution Phase

Every living player must take one of two actions. Holding is not allowed.

**Contribute** — Select one card from your hand and place it face-down into the shared Caravan Deck. It is shuffled in with everyone else's contributions. No one sees what you played.

**Discard** — Select one card from your hand and remove it without contributing it to the deck. All discarded cards go into a reshuffle pile. If you discard a Saboteur card, the card name is revealed to everyone in the log.

A checkmark appears next to each player's name when they have locked in their choice. Once everyone has submitted, the Draw Phase begins automatically.

The game log records every action: "Player X contributed a card." or "Player X discarded a card." or "Player X discarded a Saboteur card: [name]." Every action is visible — only the card itself is hidden, unless it is a Saboteur discard.

---

### Phase 3 — Draw Phase

Before drawing, the server automatically injects curse cards into the Caravan Deck based on the current day. These represent the desert growing more hostile over time. The log will show "The desert stirs — X curse card(s) enter the deck."

The deck is then shuffled and a number of cards are drawn. The draw count scales with player count to keep roughly half the deck drawn each day regardless of game size.

| Players | Typical cards drawn (mid-game) |
| ------- | ------------------------------ |
| 4       | 3                              |
| 6       | 4                              |
| 8       | 5                              |
| 10      | 6                              |

All drawn cards are revealed to every player at once. You can see the card name and type before effects are applied. Any cards not drawn are cleared to the reshuffle pile — the deck resets each day.

The host clicks Resolve Cards to trigger resolution. This gives everyone a moment to see what was drawn before effects apply. Cards are numbered #1, #2, #3 in resolution order — this matters for events like Mirage Fields (second card triggers twice) and Clear Skies (first hazard cancelled).

---

### Phase 4 — Resolution Phase

Each drawn card resolves in order. Effects apply immediately — resource gains and losses, persistent debuffs, encounter spawns, and modifier chains all happen here.

After resolution, the Discussion Phase begins automatically. The resolved cards remain visible with their full effect summaries so players can reference them during discussion.

Watch the game log carefully. Every card effect is recorded. This is your evidence.

---

### Phase 5 — Campfire Discussion

No mechanics. Pure conversation.

You have 2 minutes to talk, argue, accuse, defend, and strategize. Look at the resources. Look at the log. Who contributed what? Who discarded? Does the damage add up given the curse cards that were injected?

The host can begin the Vote Phase early at any time.

---

### Phase 6 — Vote Phase

After discussion, each living player may vote to exile another player, or skip.

If one player has the most votes with no tie, that player is exiled and removed from all future phases. In standard play, their role is revealed on exile.

If there is a tie or everyone skips, no one is exiled.

The game then checks win conditions. If no one has won and it is not Day 7, the caravan advances to the next day.

---

## Card Reference

### Crew Cards

Crew cards support the caravan's survival. Only Crew members can guarantee a helpful contribution — but Wretches hold Crew cards too and may contribute them to stay hidden.

| Card              | Effect                                                |
| ----------------- | ----------------------------------------------------- |
| Water Cache       | Water +2. Bonus +1 if Water is below 5.               |
| Food Forage       | Food +2. Bonus +1 if Food was lost yesterday.         |
| Campfire Story    | Morale +2. Bonus +1 if Morale is the lowest resource. |
| Repair Kit        | Wagon +2. Bonus +2 if Wagon is below 3.               |
| Clear Map         | Cancels the next hazard card resolved today.          |
| Scout's Insight   | Reveals tomorrow's Dawn Event to all players.         |
| Extra Rations     | Food +1, Morale +1.                                   |
| Makeshift Shelter | Blocks the next Saboteur card effect resolved today.  |
| Fresh Tracks      | Allows reordering of the next drawn cards.            |
| Desert Herbs      | Removes one active persistent negative effect.        |

---

### Saboteur Cards

Saboteur cards deal harm to the caravan. Only Wretches have them in their hand — but once contributed to the shared deck, no one knows who played what.

| Card              | Effect                                                  |
| ----------------- | ------------------------------------------------------- |
| Water Leak        | Water -2. Persistent: Water -1 per day for 1 day.       |
| Spoiled Rations   | Food -2. Bonus -1 if Food is above 7.                   |
| False Map         | Adds Feral Nomads encounter to tomorrow's deck.         |
| Broken Axle       | Wagon -2. Weakens the next Repair Kit played.           |
| Dust Cloud        | Shuffles the order of remaining drawn cards.            |
| Panic Whisper     | Morale -2. Bonus -1 if Morale is below 4.               |
| Sand Sickness     | Persistent: Morale -1 per day for 2 days.               |
| Mirage Oasis      | Inverts the next positive resource gain into a loss.    |
| Hidden Trap       | Causes the first Encounter card today to resolve twice. |
| Infested Supplies | Food -1, Water -1.                                      |

---

### Curse Cards

Curse cards are not sabotage — they are the desert itself. They are never dealt to players. The server injects them directly into the Caravan Deck each day before the draw. No one plays them. No one chooses them. The world just gets harder.

| Day | Curses injected                |
| --- | ------------------------------ |
| 1   | 0 — Calm Morning, one free day |
| 2–3 | 1 curse                        |
| 4–5 | 2 curses                       |
| 6–7 | 3 curses                       |

| Card            | Effect                                            |
| --------------- | ------------------------------------------------- |
| Heat Exhaustion | Persistent: Morale -1 per day for 2 days.         |
| Scorpion Sting  | Food -1, Morale -1.                               |
| Cracked Canteen | Water -1. Persistent: Water -1 per day for 1 day. |
| Loose Wheel     | Wagon -1.                                         |
| Desert Wind     | Food -1, Water -1.                                |
| Sunstroke       | Morale -2.                                        |

---

### Encounter Cards

Encounters are world events — not played by any player. They enter the deck through certain card effects and resolve like any other card.

| Card             | Effect                                  |
| ---------------- | --------------------------------------- |
| Wild Jackals     | Food -2.                                |
| Dust Devil       | Redistributes a random card effect.     |
| Merchant Caravan | Food -1, Water +2.                      |
| Canyon Narrow    | Forces one extra card draw today.       |
| Ruined Shrine    | Morale +2, Wagon -1.                    |
| Feral Nomads     | Food -1, Morale -1.                     |
| Desert Bloom     | Food +1, Water +1.                      |
| Sand Wyrm Tracks | Adds a Sandstorm to tomorrow's deck.    |
| Sandstorm        | Morale -1, Wagon -2.                    |
| Oasis (Real)     | Water +3. Bonus +1 if Water is below 4. |

---

## Strategy Tips

### For the Crew

Your hand contains only Crew cards — every card you hold is helpful. Always contribute. If a Crew member discards, that is a strong signal they are a Wretch getting rid of a Saboteur card.

Curse cards are injected by the world — when bad things happen, check the log to see how many curses entered the deck that day. Subtract curse damage from total damage to figure out how much was sabotage.

Persistent debuffs lasting multiple days are a stronger signal of Wretch activity — Sand Sickness and Water Leak are Saboteur cards. Curse debuffs tend to be shorter one-off hits.

Wagon Integrity starts at 3. It does not take many hits before you lose. Prioritise Repair Kit when you have it and protect it with Makeshift Shelter on dangerous days.

Do not exile on Day 1 without strong evidence. A wrong exile removes a Crew member and leaves the Wretches stronger.

Use Scout's Insight and Clear Map strategically — knowing tomorrow's Dawn Event early is a significant advantage.

### For the Wretches

Blend in early. Contribute Crew cards in the first couple of days to build trust before striking.

Use Dawn Events as multipliers. On Thieves Nearby, contributing a Water Cache turns its gain into a loss — you played a helpful card and the event did the damage. On Scorch Day, Spoiled Rations doubles its food loss. On Mirage Fields, a Saboteur card in position 2 triggers twice. Day 1 is always Calm Morning with no modifiers — the safest day to seed the deck early.

Broken Axle is especially dangerous early — Wagon Integrity starts at 3 and a weakened repair can leave it near collapse within a day or two.

Every discard is suspicious. Crew members only hold Crew cards and always contribute them. If you discard, the Crew will know you had a Saboteur card — and if it was a Saboteur card, its name is revealed in the log. Only discard when contributing is more dangerous than the exposure.

Protect fellow Wretches in votes without making it obvious. Vote against your Wretch partner only when they are clearly safe.

Sand Sickness and Water Leak are your most dangerous tools — persistent effects compound across days and are hard to undo with a single Desert Herbs.

Curse cards are world events — you cannot use them as an alibi. The Crew knows exactly how many curses entered the deck each day and will subtract them from the damage total to isolate Saboteur contributions.

---

## How to Play Online

1. One player creates a room at [last-light-caravan-client.vercel.app](https://last-light-caravan-client.vercel.app) and shares the 4-letter room code
2. All other players join using that code — you need at least 4 to start
3. Roles are assigned secretly when the host starts — check the role indicator on your screen
4. The host clicks Continue at each Dawn Event, then Resolve Cards during the Draw Phase
5. During the Contribution Phase, select a card and hit Contribute or Discard — holding is not allowed
6. Hold your finger on any card (mobile) or hover over it (desktop) to see its effect description and flavour text
7. Use the chat during Campfire Discussion to talk, accuse, and defend
8. Vote when the Vote Phase begins — you have 60 seconds

The game runs in real time. All players should be ready before the host starts. If the host disconnects, the game ends.

---

## Settings (Host Only)

| Setting             | Default | Description                                  |
| ------------------- | ------- | -------------------------------------------- |
| Number of Days      | 7       | Length of the journey                        |
| Discussion Timer    | 120s    | Length of the Campfire Discussion            |
| Vote Timer          | 60s     | Length of the Vote Phase                     |
| Reveal Exiled Roles | On      | Whether exiled players have their role shown |
| Max Players         | 10      | Room capacity (minimum 4 to start)           |

---

## Glossary

**Calm Morning** — The fixed Dawn Event for Day 1. No modifiers apply. Every run starts on equal footing before the desert turns hostile.

**Caravan Deck** — The shared deck that all contributed cards go into. Shuffled and drawn from each day. Resets after each draw phase.

**Contribution** — The act of placing a card from your hand into the Caravan Deck during the Contribution Phase.

**Curse Card** — A card representing the random hardships of the desert. Never dealt to players — injected directly into the Caravan Deck by the server each day. The number of curses increases as the days progress.

**Dawn Event** — A daily modifier revealed at the start of each day that changes the rules for that day only.

**Discard** — Removing a card from your hand during the Contribution Phase without contributing it to the deck. Crew members only hold Crew cards so a discard is a strong signal of Wretch activity. If a Saboteur card is discarded, its name is revealed in the log.

**Encounter** — A world event card that enters the deck through card effects, not player contribution.

**Exile** — The result of a successful vote. The exiled player is removed from all future phases.

**Persistent Effect** — A multi-day debuff applied by certain Saboteur or Curse cards. Triggers automatically at each Dawn Phase until it expires.

**Reshuffle Pile** — Discarded cards and undrawn cards go here after each draw phase. When the Caravan Deck runs empty mid-day, the reshuffle pile shuffles back in.

**Wretch** — The hidden saboteur role. Wretches look like Crew members but carry Saboteur cards designed to destroy the caravan from within.

---

_May your Water hold and your reads be true._
