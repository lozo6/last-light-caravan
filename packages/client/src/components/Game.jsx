import { useGameStore } from '../store/gameStore'
import { socket } from '../lib/socket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

const CARD_DATA = {
  CREW_WATER_CACHE:       { name: 'Water Cache',      color: 'bg-blue-900 border-blue-600' },
  CREW_FOOD_FORAGE:       { name: 'Food Forage',       color: 'bg-green-900 border-green-600' },
  CREW_CAMPFIRE_STORY:    { name: 'Campfire Story',    color: 'bg-orange-900 border-orange-600' },
  CREW_REPAIR_KIT:        { name: 'Repair Kit',        color: 'bg-yellow-900 border-yellow-600' },
  CREW_CLEAR_MAP:         { name: 'Clear Map',         color: 'bg-teal-900 border-teal-600' },
  CREW_SCOUTS_INSIGHT:    { name: "Scout's Insight",   color: 'bg-cyan-900 border-cyan-600' },
  CREW_EXTRA_RATIONS:     { name: 'Extra Rations',     color: 'bg-lime-900 border-lime-600' },
  CREW_MAKESHIFT_SHELTER: { name: 'Makeshift Shelter', color: 'bg-stone-700 border-stone-500' },
  CREW_FRESH_TRACKS:      { name: 'Fresh Tracks',      color: 'bg-emerald-900 border-emerald-600' },
  CREW_DESERT_HERBS:      { name: 'Desert Herbs',      color: 'bg-green-800 border-green-500' },
  SAB_WATER_LEAK:         { name: 'Water Leak',        color: 'bg-red-900 border-red-600' },
  SAB_SPOILED_RATIONS:    { name: 'Spoiled Rations',   color: 'bg-red-900 border-red-600' },
  SAB_FALSE_MAP:          { name: 'False Map',         color: 'bg-red-900 border-red-600' },
  SAB_BROKEN_AXLE:        { name: 'Broken Axle',       color: 'bg-red-900 border-red-600' },
  SAB_DUST_CLOUD:         { name: 'Dust Cloud',        color: 'bg-red-900 border-red-600' },
  SAB_PANIC_WHISPER:      { name: 'Panic Whisper',     color: 'bg-red-900 border-red-600' },
  SAB_SAND_SICKNESS:      { name: 'Sand Sickness',     color: 'bg-red-900 border-red-600' },
  SAB_MIRAGE_OASIS:       { name: 'Mirage Oasis',      color: 'bg-red-900 border-red-600' },
  SAB_HIDDEN_TRAP:        { name: 'Hidden Trap',       color: 'bg-red-900 border-red-600' },
  SAB_INFESTED_SUPPLIES:  { name: 'Infested Supplies', color: 'bg-red-900 border-red-600' },
  ENC_WILD_JACKALS:       { name: 'Wild Jackals',      color: 'bg-amber-900 border-amber-700' },
  ENC_DUST_DEVIL:         { name: 'Dust Devil',        color: 'bg-amber-900 border-amber-700' },
  ENC_MERCHANT_CARAVAN:   { name: 'Merchant Caravan',  color: 'bg-amber-900 border-amber-700' },
  ENC_CANYON_NARROW:      { name: 'Canyon Narrow',     color: 'bg-amber-900 border-amber-700' },
  ENC_RUINED_SHRINE:      { name: 'Ruined Shrine',     color: 'bg-amber-900 border-amber-700' },
  ENC_FERAL_NOMADS:       { name: 'Feral Nomads',      color: 'bg-amber-900 border-amber-700' },
  ENC_DESERT_BLOOM:       { name: 'Desert Bloom',      color: 'bg-amber-900 border-amber-700' },
  ENC_SAND_WYRM_TRACKS:   { name: 'Sand Wyrm Tracks',  color: 'bg-amber-900 border-amber-700' },
  ENC_SANDSTORM:          { name: 'Sandstorm',         color: 'bg-amber-900 border-amber-700' },
  ENC_OASIS_REAL:         { name: 'Oasis (Real)',       color: 'bg-amber-900 border-amber-700' },
  // Curse cards
  CURSE_HEAT_EXHAUSTION:  { name: 'Heat Exhaustion',   color: 'bg-purple-900 border-purple-700' },
  CURSE_SCORPION_STING:   { name: 'Scorpion Sting',    color: 'bg-purple-900 border-purple-700' },
  CURSE_CRACKED_CANTEEN:  { name: 'Cracked Canteen',   color: 'bg-purple-900 border-purple-700' },
  CURSE_LOOSE_WHEEL:      { name: 'Loose Wheel',       color: 'bg-purple-900 border-purple-700' },
  CURSE_DESERT_WIND:      { name: 'Desert Wind',       color: 'bg-purple-900 border-purple-700' },
  CURSE_SUNSTROKE:        { name: 'Sunstroke',         color: 'bg-purple-900 border-purple-700' },
}

const CARD_TOOLTIPS = {
  CREW_WATER_CACHE:       { effect: "Water +2. Bonus +1 if Water is below 5.",                       flavour: "Someone remembered a buried jug from an old trade route." },
  CREW_FOOD_FORAGE:       { effect: "Food +2. Bonus +1 if Food was lost yesterday.",                  flavour: "The scrublands give up their bitter secrets." },
  CREW_CAMPFIRE_STORY:    { effect: "Morale +2. Bonus +1 if Morale is the lowest resource.",          flavour: "An old tune, half-remembered. It still works." },
  CREW_REPAIR_KIT:        { effect: "Wagon +2. Bonus +2 if Wagon is below 3.",                        flavour: "The crack in the axle has been there since Dustveil. Today someone fixed it." },
  CREW_CLEAR_MAP:         { effect: "Cancels the next hazard card resolved today.",                   flavour: "The route is clear. At least for now." },
  CREW_SCOUTS_INSIGHT:    { effect: "Reveals tomorrow's Dawn Event to all players.",                  flavour: "What waits at dawn is no longer a mystery." },
  CREW_EXTRA_RATIONS:     { effect: "Food +1, Morale +1.",                                            flavour: "A hidden cache, shared equally." },
  CREW_MAKESHIFT_SHELTER: { effect: "Blocks the next Saboteur card effect resolved today.",           flavour: "Canvas and rope. It won't hold forever, but it holds." },
  CREW_FRESH_TRACKS:      { effect: "Allows reordering of the next drawn cards.",                     flavour: "The scout reads the dunes like text." },
  CREW_DESERT_HERBS:      { effect: "Removes one active persistent negative effect.",                 flavour: "Bitter medicine. The kind that actually works." },
  SAB_WATER_LEAK:         { effect: "Water -2. Persistent: Water -1/day for 1 day.",                  flavour: "A small hole. Unnoticed until it is too late." },
  SAB_SPOILED_RATIONS:    { effect: "Food -2. Bonus -1 if Food is above 7.",                          flavour: "The smell should have warned them. Nobody checked." },
  SAB_FALSE_MAP:          { effect: "Adds Feral Nomads encounter to tomorrow's deck.",                flavour: "A perfect forgery. The caravan won't realize until they're lost." },
  SAB_BROKEN_AXLE:        { effect: "Wagon -2. Weakens the next Repair Kit played.",                  flavour: "One clean blow to the wood, hidden under mud." },
  SAB_DUST_CLOUD:         { effect: "Shuffles the order of remaining drawn cards.",                   flavour: "The cards fall differently when the wind changes." },
  SAB_PANIC_WHISPER:      { effect: "Morale -2. Bonus -1 if Morale is below 4.",                      flavour: "Did you hear that? In the dark?" },
  SAB_SAND_SICKNESS:      { effect: "Persistent: Morale -1/day for 2 days.",                          flavour: "A fever that moves through the camp like a rumour." },
  SAB_MIRAGE_OASIS:       { effect: "Inverts the next positive resource gain into a loss.",            flavour: "Water on the horizon. The crew chases it for hours." },
  SAB_HIDDEN_TRAP:        { effect: "Causes the first Encounter card today to resolve twice.",         flavour: "Set in the night. Triggered at dawn." },
  SAB_INFESTED_SUPPLIES:  { effect: "Food -1, Water -1.",                                              flavour: "They got into everything." },
  CURSE_HEAT_EXHAUSTION:  { effect: "Persistent: Morale -1/day for 2 days.",                          flavour: "Someone falls behind. The pace suffers." },
  CURSE_SCORPION_STING:   { effect: "Food -1, Morale -1.",                                            flavour: "Found in the bedroll at dawn. A bad omen and a worse morning." },
  CURSE_CRACKED_CANTEEN:  { effect: "Water -1. Persistent: Water -1/day for 1 day.",                  flavour: "The seal gave out overnight. Half a day of water, gone." },
  CURSE_LOOSE_WHEEL:      { effect: "Wagon -1.",                                                       flavour: "The road took its toll. It always does." },
  CURSE_DESERT_WIND:      { effect: "Food -1, Water -1.",                                              flavour: "Stripped supplies in the night. No one's fault. No one's comfort." },
  CURSE_SUNSTROKE:        { effect: "Morale -2.",                                                      flavour: "The heat claims another. The caravan slows." },
  ENC_WILD_JACKALS:       { effect: "Food -2.",                                                        flavour: "They come for the food. They always do." },
  ENC_DUST_DEVIL:         { effect: "Redistributes a random card effect.",                             flavour: "The column of sand twists between the wagons, indifferent." },
  ENC_MERCHANT_CARAVAN:   { effect: "Food -1, Water +2.",                                              flavour: "They have what you need. For a price." },
  ENC_CANYON_NARROW:      { effect: "Forces one extra card draw today.",                               flavour: "The walls close in. The deck grows heavier." },
  ENC_RUINED_SHRINE:      { effect: "Morale +2, Wagon -1.",                                           flavour: "Something was worshipped here. Something still lingers." },
  ENC_FERAL_NOMADS:       { effect: "Food -1, Morale -1.",                                            flavour: "Desperate people do desperate things." },
  ENC_DESERT_BLOOM:       { effect: "Food +1, Water +1.",                                              flavour: "Life where none should be. You take what you can." },
  ENC_SAND_WYRM_TRACKS:   { effect: "Adds a Sandstorm to tomorrow's deck.",                           flavour: "Something enormous passed this way. Recently." },
  ENC_SANDSTORM:          { effect: "Morale -1, Wagon -2.",                                           flavour: "The sky turns orange. You have minutes." },
  ENC_OASIS_REAL:         { effect: "Water +3. Bonus +1 if Water is below 4.",                        flavour: "It is real. The water is cold and clean." },
}


const RESOURCE_ICONS = {
  food:      { icon: '🌾', label: 'Food',   color: 'text-green-400' },
  water:     { icon: '💧', label: 'Water',  color: 'text-blue-400' },
  morale:    { icon: '🔥', label: 'Morale', color: 'text-orange-400' },
  integrity: { icon: '⚙️', label: 'Wagon',  color: 'text-yellow-400' },
}

const PHASE_LABELS = {
  dawnEvent:    'Dawn Event',
  contribution: 'Contribution',
  draw:         'Drawing Cards',
  resolution:   'Resolution',
  discussion:   'Campfire Discussion',
  vote:         'Vote',
  gameOver:     'Game Over',
}

const EVENT_NAMES = {
  EVENT_CALM_MORNING:   { name: 'Calm Morning',    desc: 'The desert is still. No special conditions today.' },
  EVENT_SCORCH_DAY:     { name: 'Scorch Day',      desc: 'Food losses are doubled today.' },
  EVENT_CLEAR_SKIES:    { name: 'Clear Skies',     desc: 'The first hazard today is cancelled.' },
  EVENT_THIEVES_NEARBY: { name: 'Thieves Nearby',  desc: 'The first resource gain becomes a loss.' },
  EVENT_TAILWIND:       { name: 'Tailwind',         desc: 'One fewer card drawn today.' },
  EVENT_MIRAGE_FIELDS:  { name: 'Mirage Fields',   desc: 'The second card resolved triggers twice.' },
}

function ResourceBar({ resource, value, max = 10 }) {
  const { icon, label, color } = RESOURCE_ICONS[resource]
  const pct      = (value / max) * 100
  const barColor = value <= 2 ? 'bg-red-500' : value <= 4 ? 'bg-amber-500' : 'bg-green-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-medium ${color}`}>{icon} {label}</span>
        <span className="text-xs text-stone-400">{value}/{max}</span>
      </div>
      <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CardTooltip({ cardId }) {
  const card    = CARD_DATA[cardId] ?? { name: cardId, color: 'bg-stone-800 border-stone-600' }
  const tip     = CARD_TOOLTIPS[cardId]
  const isSab   = cardId?.startsWith('SAB_')
  const isCurse = cardId?.startsWith('CURSE_')
  const isEnc   = cardId?.startsWith('ENC_')
  const isCrew  = cardId?.startsWith('CREW_')

  const categoryLabel = isSab ? '⚠ Saboteur Card' : isCurse ? '☠ Curse Card' : isEnc ? '⚡ Encounter' : isCrew ? '🛡 Crew Card' : ''
  const categoryColor = isSab ? 'text-red-400' : isCurse ? 'text-purple-400' : isEnc ? 'text-amber-400' : 'text-green-400'

  return (
    <div className="fixed z-[9999] bottom-36 left-1/2 -translate-x-1/2 w-48 bg-stone-950 border border-stone-600 rounded-lg p-3 shadow-lg pointer-events-none">
      <p className="text-xs font-semibold text-stone-100 mb-1">{card.name}</p>
      {categoryLabel && <p className={`text-xs mb-2 ${categoryColor}`}>{categoryLabel}</p>}
      {tip?.effect  && <p className="text-xs text-stone-300 mb-2 leading-relaxed">{tip.effect}</p>}
      {tip?.flavour && <p className="text-xs text-stone-500 italic leading-relaxed border-t border-stone-700 pt-2">"{tip.flavour}"</p>}

    </div>
  )
}

function CardComponent({ cardId, selected, onClick, disabled }) {
  const card    = CARD_DATA[cardId] ?? { name: cardId, color: 'bg-stone-800 border-stone-600' }
  const isSab   = cardId?.startsWith('SAB_')
  const isCurse = cardId?.startsWith('CURSE_')
  const [showTip, setShowTip] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      {showTip && <CardTooltip cardId={cardId} />}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative border-2 rounded-lg p-2 text-left transition-all duration-150 w-20 min-h-16
          ${card.color}
          ${selected ? 'ring-2 ring-amber-400 scale-105' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
        `}
      >
        <p className="text-xs font-semibold text-stone-100 leading-none">{card.name}</p>
        {isSab   && <p className="text-xs text-red-400 mt-0.5">⚠ Wretch</p>}
        {isCurse && <p className="text-xs text-purple-400 mt-0.5">☠ Curse</p>}
      </button>
    </div>
  )
}

export default function Game() {
  const {
    phase, day, resources, players, self,
    currentEventId, todayDrawnCards, persistentEffects,
    voteState, contributionStatus, log, settings,
    winner, gameOverReason, caravanDeckCount, reshufflePileCount,
    chatMessages, lobby,
  } = useGameStore()

  const [selectedCardIdx,  setSelectedCardIdx]  = useState(null)  // track by index to handle duplicate card IDs
  const [chatInput,        setChatInput]         = useState('')
  const [showMobileLog,    setShowMobileLog]     = useState(false)
  const [contributedOnDay, setContributedOnDay] = useState(null)
  const [votedOnDay,       setVotedOnDay]       = useState(null)

  const hasContributed = contributedOnDay === day
  const hasVoted       = votedOnDay === day

  const isHost       = self?.isHost
  const myContrib    = contributionStatus?.[self?.id]
  const iLocked      = myContrib?.locked ?? false
  const currentEvent = EVENT_NAMES[currentEventId]
  const livingPlayers = players.filter(p => p.alive)

  const selectedCard = selectedCardIdx !== null ? self?.hand?.[selectedCardIdx] : null

  function handleContribute() {
    socket.emit('submit_contribution', { cardId: selectedCard, cardIndex: selectedCardIdx, action: 'contribute' })
    setSelectedCardIdx(null)
    setContributedOnDay(day)
  }

  function handleDiscard() {
    socket.emit('submit_contribution', { cardId: selectedCard, cardIndex: selectedCardIdx, action: 'discard' })
    setSelectedCardIdx(null)
    setContributedOnDay(day)
  }

  function handleHold() {
    socket.emit('submit_contribution', { cardId: null, action: 'hold' })
    setContributedOnDay(day)
  }

  function handleAdvance() {
    socket.emit('advance_phase')
  }

  function handleBeginVote() {
    socket.emit('begin_vote')
  }

  function handleVote(targetId) {
    socket.emit('cast_vote', { targetId })
    setVotedOnDay(day)
  }

  function handleChat(e) {
    e.preventDefault()
    if (!chatInput.trim()) return
    socket.emit('send_chat_message', { text: chatInput.trim() })
    setChatInput('')
  }

  // ── Game Over Screen ───────────────────────────────────────────────────────
  if (phase === 'gameOver') {
    const hostLeft = gameOverReason === 'host_left'
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-5xl font-bold">
            {hostLeft ? '🚪' : winner === 'crew' ? '🌅' : '💀'}
          </h1>
          <h2 className="text-3xl font-bold text-amber-400">
            {hostLeft
              ? 'Game Ended'
              : winner === 'crew' ? 'The Crew Survives!' : 'The Caravan Falls'}
          </h2>
          <p className="text-stone-400">
            {hostLeft                                         && 'The host left the game.'}
            {gameOverReason === 'days_complete'               && 'The caravan reached the Last Light.'}
            {gameOverReason === 'all_saboteurs_exiled'        && 'All Wretches were exiled.'}
            {gameOverReason === 'resource_zero'               && 'A resource collapsed. The Wretches win.'}
          </p>
          {!hostLeft && (
            <div className="space-y-2">
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-stone-800 rounded-lg px-4 py-2">
                  <span className="text-stone-200">{p.name}</span>
                  <Badge className={p.role === 'saboteur' ? 'bg-red-700' : 'bg-green-700'}>
                    {p.role === 'saboteur' ? 'Wretch' : 'Crew'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={() => window.location.reload()}
            className="bg-amber-600 hover:bg-amber-500 text-stone-950"
          >
            {isHost ? 'Play Again' : 'Back to Home'}
          </Button>
        </div>
      </div>
    )
  }

  // ── Main Game UI ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">🏜️ Last Light Caravan</span>
          <Badge variant="outline" className="border-stone-600 text-stone-400 font-mono">
            {lobby?.roomId}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-stone-400 text-sm">Day {day}/{settings?.numDays ?? 7}</span>
          <Badge className="bg-amber-800 text-amber-200">
            {PHASE_LABELS[phase] ?? phase}
          </Badge>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left sidebar — players (hidden on mobile) */}
        <div className="hidden md:flex w-48 bg-stone-900 border-r border-stone-700 p-3 flex-col gap-2">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Players</p>
          {players.map(p => {
            const contrib = contributionStatus?.[p.id]
            return (
              <div key={p.id} className={`flex items-center gap-2 ${!p.alive ? 'opacity-40' : ''}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-500' : 'bg-stone-600'}`} />
                <span className="text-sm text-stone-300 truncate flex-1 text-left">{p.name}</span>
                {p.isHost && <span className="text-xs text-amber-500 flex-shrink-0">★</span>}
                {!p.alive  && <span className="text-xs text-stone-600 flex-shrink-0">✗</span>}
                {phase === 'contribution' && contrib?.locked && p.alive && (
                  <span className="text-xs text-green-500 flex-shrink-0">✓</span>
                )}
                {phase === 'vote' && voteState?.votedPlayerIds?.includes(p.id) && p.alive && (
                  <span className="text-xs text-amber-500 flex-shrink-0">✓</span>
                )}
              </div>
            )
          })}

          <Separator className="bg-stone-700 my-2" />

          {persistentEffects.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-stone-500 uppercase tracking-wider">Active Effects</p>
              {persistentEffects.map(e => (
                <div key={e.id} className="text-xs text-red-400 bg-red-950 rounded px-2 py-1">
                  {e.name} ({e.remainingDays}d)
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main board */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Resources — pinned at top */}
          <div className="bg-stone-900 border-b border-stone-700 px-4 py-3 grid grid-cols-4 gap-4 flex-shrink-0">
            {Object.entries(resources).map(([key, val]) => (
              <ResourceBar key={key} resource={key} value={val} />
            ))}
          </div>

          {/* Phase content — scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">

            {/* Dawn Event */}
            {phase === 'dawnEvent' && currentEvent && (
              <div className="bg-amber-950 border border-amber-700 rounded-lg p-3 space-y-1">
                <p className="text-xs text-amber-500 uppercase tracking-wider">Dawn Event</p>
                <p className="text-amber-300 font-semibold">{currentEvent.name}</p>
                <p className="text-amber-200 text-xs">{currentEvent.desc}</p>
                {isHost
                  ? <Button onClick={handleAdvance} className="mt-1 bg-amber-700 hover:bg-amber-600 text-stone-100 text-sm py-1">Continue →</Button>
                  : <p className="text-xs text-amber-600 mt-1">Waiting for host to continue...</p>
                }
              </div>
            )}

            {/* Contribution */}
            {phase === 'contribution' && (
              <div className="space-y-3">
                <div className="bg-stone-800 border border-stone-600 rounded-lg p-4">
                  <p className="text-stone-300 font-medium mb-1">Contribution Phase</p>
                  <p className="text-stone-500 text-sm">
                    {iLocked
                      ? 'Waiting for others...'
                      : 'Contribute a card to the deck, discard one from your hand, or hold.'}
                  </p>
                </div>
                {!iLocked && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleContribute}
                      disabled={!selectedCard}
                      className="bg-amber-600 hover:bg-amber-500 text-stone-950"
                    >
                      Contribute
                    </Button>
                    <Button
                      onClick={handleDiscard}
                      disabled={!selectedCard}
                      variant="outline"
                      className="border-red-800 text-red-400 hover:bg-red-950"
                    >
                      Discard
                    </Button>
                    <Button
                      onClick={handleHold}
                      variant="outline"
                      className="border-stone-600 text-stone-400 hover:bg-stone-800"
                    >
                      Hold
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Draw Phase — cards shown, host advances to resolution */}
            {phase === 'draw' && (
              <div className="space-y-4">
                {currentEvent && currentEvent.name !== 'Calm Morning' && (
                  <div className="bg-amber-950 border border-amber-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-400">
                      <span className="font-semibold">{currentEvent.name}</span>
                      {' — '}{currentEvent.desc}
                    </p>
                  </div>
                )}
                {todayDrawnCards.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-500 uppercase tracking-wider">Cards Drawn</p>
                    <div className="flex flex-wrap gap-3">
                      {[...todayDrawnCards]
                        .sort((a, b) => a.position - b.position)
                        .map(ci => {
                          const cardDef  = CARD_DATA[ci.cardId]
                          const cardName = cardDef?.name ?? ci.cardId
                          const isSab    = ci.cardId?.startsWith('SAB_')
                          const isCurse  = ci.cardId?.startsWith('CURSE_')
                          const isEnc    = ci.cardId?.startsWith('ENC_')
                          const [showDrawTip, setShowDrawTip] = useState(false)
                          return (
                            <div
                              key={ci.instanceId}
                              className="relative"
                              onMouseEnter={() => setShowDrawTip(true)}
                              onMouseLeave={() => setShowDrawTip(false)}
                            >
                              {showDrawTip && <CardTooltip cardId={ci.cardId} />}
                              <div
                                className={`relative border-2 rounded-lg p-3 flex flex-col gap-1 w-36
                                  ${cardDef?.color ?? 'bg-stone-800 border-stone-600'}`}
                              >
                                <span className="absolute top-1 right-1 text-xs text-stone-400 font-mono">
                                  #{ci.position + 1}
                                </span>
                                <p className="text-xs font-semibold text-stone-100 pr-5 leading-tight">
                                  {cardName}
                                </p>
                                {isSab   && <span className="text-xs text-red-400">⚠ Saboteur</span>}
                                {isCurse && <span className="text-xs text-purple-400">☠ Curse</span>}
                                {isEnc   && <span className="text-xs text-amber-400">⚡ Encounter</span>}
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                )}
                {isHost
                  ? <Button onClick={handleAdvance} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                      Resolve Cards →
                    </Button>
                  : <p className="text-xs text-amber-600">Waiting for host to resolve cards...</p>
                }
              </div>
            )}

            {/* Discussion — cards with effects shown, then discussion panel */}
            {phase === 'discussion' && (
              <div className="space-y-4">
                {currentEvent && currentEvent.name !== 'Calm Morning' && (
                  <div className="bg-amber-950 border border-amber-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-400">
                      <span className="font-semibold">{currentEvent.name}</span>
                      {' — '}{currentEvent.desc}
                    </p>
                  </div>
                )}
                {todayDrawnCards.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-500 uppercase tracking-wider">Cards Resolved Today</p>
                    <div className="flex flex-wrap gap-3">
                      {[...todayDrawnCards]
                        .sort((a, b) => a.position - b.position)
                        .map(ci => {
                          const cardDef  = CARD_DATA[ci.cardId]
                          const cardName = cardDef?.name ?? ci.cardId
                          const isSab    = ci.cardId?.startsWith('SAB_')
                          const isCurse  = ci.cardId?.startsWith('CURSE_')
                          const isEnc    = ci.cardId?.startsWith('ENC_')
                          const cardLog  = [...log].reverse().find(e =>
                            e.message.includes(`[${cardName}]`)
                          )
                          const effectText = cardLog
                            ? cardLog.message.replace(`[${cardName}]`, '').trim()
                            : null
                          const [showDiscTip, setShowDiscTip] = useState(false)
                          return (
                            <div
                              key={ci.instanceId}
                              className="relative"
                              onMouseEnter={() => setShowDiscTip(true)}
                              onMouseLeave={() => setShowDiscTip(false)}
                            >
                              {showDiscTip && <CardTooltip cardId={ci.cardId} />}
                              <div
                                className={`relative border-2 rounded-lg p-3 flex flex-col gap-1 w-36
                                  ${cardDef?.color ?? 'bg-stone-800 border-stone-600'}`}
                              >
                                <span className="absolute top-1 right-1 text-xs text-stone-400 font-mono">
                                  #{ci.position + 1}
                                </span>
                                <p className="text-xs font-semibold text-stone-100 pr-5 leading-tight">
                                  {cardName}
                                </p>
                                {isSab   && <span className="text-xs text-red-400">⚠ Saboteur</span>}
                                {isCurse && <span className="text-xs text-purple-400">☠ Curse</span>}
                                {isEnc   && <span className="text-xs text-amber-400">⚡ Encounter</span>}
                                {effectText && (
                                  <p className="text-xs text-stone-300 leading-tight mt-1 border-t border-stone-600 pt-1">
                                    {effectText}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                )}
                <div className="bg-stone-800 border border-stone-600 rounded-lg p-4 space-y-2">
                  <p className="text-stone-300 font-medium">🔥 Campfire Discussion</p>
                  <p className="text-stone-500 text-sm">
                    Discuss what happened. Accuse. Defend. The vote begins soon.
                  </p>
                  {isHost && (
                    <Button
                      onClick={handleBeginVote}
                      className="bg-red-800 hover:bg-red-700 text-stone-100 text-sm"
                    >
                      Begin Vote Now
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Vote */}
            {phase === 'vote' && (
              <div className="space-y-3">
                <div className="bg-stone-800 border border-stone-600 rounded-lg p-4">
                  <p className="text-stone-300 font-medium mb-1">Vote Phase</p>
                  <p className="text-stone-500 text-sm">
                    {hasVoted ? 'Vote cast. Waiting for others...' : 'Who do you suspect?'}
                  </p>
                </div>
                {!hasVoted && (
                  <div className="space-y-2">
                    {livingPlayers
                      .filter(p => p.id !== self?.id)
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleVote(p.id)}
                          className="w-full text-left bg-stone-800 hover:bg-red-950 border border-stone-600 hover:border-red-700 rounded-lg px-4 py-3 text-stone-300 transition-colors"
                        >
                          Exile {p.name}
                        </button>
                      ))
                    }
                    <button
                      onClick={() => handleVote(null)}
                      className="w-full text-left bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg px-4 py-3 text-stone-500 transition-colors"
                    >
                      Skip (no exile)
                    </button>
                  </div>
                )}
                {voteState && (
                  <p className="text-xs text-stone-500">
                    {voteState.votedPlayerIds?.length ?? 0} of {livingPlayers.length} voted
                  </p>
                )}
              </div>
            )}

            {/* Role indicator */}
            {self?.role && (
              <div className={`border rounded-lg px-3 py-2 text-xs ${self.role === 'saboteur' ? 'bg-red-950 border-red-800 text-red-300' : 'bg-green-950 border-green-800 text-green-300'}`}>
                You are: <strong>{self.role === 'saboteur' ? '💀 Wretch (Saboteur)' : '🛡 Crew Member'}</strong>
              </div>
            )}

            <div className="flex gap-3 text-xs text-stone-600">
              <span>Deck: {caravanDeckCount} cards</span>
              {reshufflePileCount > 0 && (
                <span>Reshuffle: {reshufflePileCount} cards</span>
              )}
            </div>
          </div>

          {/* Hand — pinned to bottom, max 2 rows with scroll if overflow */}
          {self?.hand?.length > 0 && (
            <div className="bg-stone-900 border-t border-stone-700 px-3 pt-2 pb-1 flex-shrink-0 max-h-40 overflow-y-auto">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Your Hand</p>
              <div className="flex flex-wrap gap-1">
                {self.hand.map((cardId, i) => (
                  <CardComponent
                    key={`${cardId}-${i}`}
                    cardId={cardId}
                    selected={selectedCardIdx === i}
                    onClick={() => setSelectedCardIdx(selectedCardIdx === i ? null : i)}
                    disabled={phase !== 'contribution' || iLocked}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — log + chat (hidden on mobile) */}
        <div className="hidden md:flex w-64 bg-stone-900 border-l border-stone-700 flex-col min-h-0">
          <div className="p-3 border-b border-stone-700">
            <p className="text-xs text-stone-500 uppercase tracking-wider">Log</p>
          </div>
          <ScrollArea className="h-64 flex-shrink-0 p-3">
            <div className="space-y-1">
              {[...log].reverse().map(entry => (
                <p key={entry.id} className="text-xs text-stone-400 leading-relaxed">
                  {entry.message}
                </p>
              ))}
            </div>
          </ScrollArea>

          <Separator className="bg-stone-700" />

          <div className="p-3 border-b border-stone-700">
            <p className="text-xs text-stone-500 uppercase tracking-wider">Chat</p>
          </div>
          <ScrollArea className="flex-1 min-h-0 p-3">
            <div className="space-y-1">
              {chatMessages.map(msg => (
                <p key={msg.id} className="text-xs text-stone-400">
                  <span className="text-stone-300 font-medium">{msg.name}:</span> {msg.text}
                </p>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleChat} className="p-2 flex gap-2 flex-shrink-0">
            <input
              className="flex-1 bg-stone-800 border border-stone-600 rounded px-2 py-1 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              placeholder="Message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <Button type="submit" size="sm" className="bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs px-2">
              →
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile bottom bar — log toggle + chat */}
      <div className="md:hidden bg-stone-900 border-t border-stone-700 flex-shrink-0">
        {showMobileLog && (
          <div className="border-b border-stone-700">
            <ScrollArea className="h-40 p-3">
              <div className="space-y-1">
                {[...log].reverse().map(entry => (
                  <p key={entry.id} className="text-xs text-stone-400 leading-relaxed">
                    {entry.message}
                  </p>
                ))}
              </div>
            </ScrollArea>
            <div className="px-3 pb-2 space-y-1">
              {chatMessages.slice(-3).map(msg => (
                <p key={msg.id} className="text-xs text-stone-400">
                  <span className="text-stone-300 font-medium">{msg.name}:</span> {msg.text}
                </p>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={handleChat} className="p-2 flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowMobileLog(v => !v)}
            className="text-xs text-stone-500 hover:text-stone-300 px-2 py-1 border border-stone-700 rounded flex-shrink-0"
          >
            {showMobileLog ? '▼ Log' : '▲ Log'}
          </button>
          <input
            className="flex-1 bg-stone-800 border border-stone-600 rounded px-2 py-1 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
            placeholder="Chat..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
          />
          <Button type="submit" size="sm" className="bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs px-2 flex-shrink-0">
            →
          </Button>
        </form>
      </div>
    </div>
  )
}
