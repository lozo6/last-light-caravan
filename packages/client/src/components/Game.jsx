import { useGameStore } from '../store/gameStore'
import { socket } from '../lib/socket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

const CARD_DATA = {
  CREW_WATER_CACHE:       { name: 'Water Cache',       color: 'bg-blue-900 border-blue-600' },
  CREW_FOOD_FORAGE:       { name: 'Food Forage',        color: 'bg-green-900 border-green-600' },
  CREW_CAMPFIRE_STORY:    { name: 'Campfire Story',     color: 'bg-orange-900 border-orange-600' },
  CREW_REPAIR_KIT:        { name: 'Repair Kit',         color: 'bg-yellow-900 border-yellow-600' },
  CREW_CLEAR_MAP:         { name: 'Clear Map',          color: 'bg-teal-900 border-teal-600' },
  CREW_SCOUTS_INSIGHT:    { name: "Scout's Insight",    color: 'bg-cyan-900 border-cyan-600' },
  CREW_EXTRA_RATIONS:     { name: 'Extra Rations',      color: 'bg-lime-900 border-lime-600' },
  CREW_MAKESHIFT_SHELTER: { name: 'Makeshift Shelter',  color: 'bg-stone-700 border-stone-500' },
  CREW_FRESH_TRACKS:      { name: 'Fresh Tracks',       color: 'bg-emerald-900 border-emerald-600' },
  CREW_DESERT_HERBS:      { name: 'Desert Herbs',       color: 'bg-green-800 border-green-500' },
  SAB_WATER_LEAK:         { name: 'Water Leak',         color: 'bg-red-900 border-red-600' },
  SAB_SPOILED_RATIONS:    { name: 'Spoiled Rations',    color: 'bg-red-900 border-red-600' },
  SAB_FALSE_MAP:          { name: 'False Map',          color: 'bg-red-900 border-red-600' },
  SAB_BROKEN_AXLE:        { name: 'Broken Axle',        color: 'bg-red-900 border-red-600' },
  SAB_DUST_CLOUD:         { name: 'Dust Cloud',         color: 'bg-red-900 border-red-600' },
  SAB_PANIC_WHISPER:      { name: 'Panic Whisper',      color: 'bg-red-900 border-red-600' },
  SAB_SAND_SICKNESS:      { name: 'Sand Sickness',      color: 'bg-red-900 border-red-600' },
  SAB_MIRAGE_OASIS:       { name: 'Mirage Oasis',       color: 'bg-red-900 border-red-600' },
  SAB_HIDDEN_TRAP:        { name: 'Hidden Trap',        color: 'bg-red-900 border-red-600' },
  SAB_INFESTED_SUPPLIES:  { name: 'Infested Supplies',  color: 'bg-red-900 border-red-600' },
  // Encounter cards
  ENC_WILD_JACKALS:       { name: 'Wild Jackals',       color: 'bg-amber-900 border-amber-700' },
  ENC_DUST_DEVIL:         { name: 'Dust Devil',         color: 'bg-amber-900 border-amber-700' },
  ENC_MERCHANT_CARAVAN:   { name: 'Merchant Caravan',   color: 'bg-amber-900 border-amber-700' },
  ENC_CANYON_NARROW:      { name: 'Canyon Narrow',      color: 'bg-amber-900 border-amber-700' },
  ENC_RUINED_SHRINE:      { name: 'Ruined Shrine',      color: 'bg-amber-900 border-amber-700' },
  ENC_FERAL_NOMADS:       { name: 'Feral Nomads',       color: 'bg-amber-900 border-amber-700' },
  ENC_DESERT_BLOOM:       { name: 'Desert Bloom',       color: 'bg-amber-900 border-amber-700' },
  ENC_SAND_WYRM_TRACKS:   { name: 'Sand Wyrm Tracks',   color: 'bg-amber-900 border-amber-700' },
  ENC_SANDSTORM:          { name: 'Sandstorm',          color: 'bg-amber-900 border-amber-700' },
  ENC_OASIS_REAL:         { name: 'Oasis (Real)',        color: 'bg-amber-900 border-amber-700' },
}

const RESOURCE_ICONS = {
  food:      { icon: '🌾', label: 'Food',  color: 'text-green-400' },
  water:     { icon: '💧', label: 'Water', color: 'text-blue-400' },
  morale:    { icon: '🔥', label: 'Morale', color: 'text-orange-400' },
  integrity: { icon: '⚙️', label: 'Wagon', color: 'text-yellow-400' },
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
  EVENT_SCORCH_DAY:     { name: 'Scorch Day',      desc: 'Food losses are doubled today.' },
  EVENT_CLEAR_SKIES:    { name: 'Clear Skies',     desc: 'The first hazard today is cancelled.' },
  EVENT_THIEVES_NEARBY: { name: 'Thieves Nearby',  desc: 'The first resource gain becomes a loss.' },
  EVENT_TAILWIND:       { name: 'Tailwind',         desc: 'One fewer card drawn today.' },
  EVENT_MIRAGE_FIELDS:  { name: 'Mirage Fields',   desc: 'The second card resolved triggers twice.' },
}

function ResourceBar({ resource, value, max = 10 }) {
  const { icon, label, color } = RESOURCE_ICONS[resource]
  const pct = (value / max) * 100
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

function CardComponent({ cardId, selected, onClick, disabled }) {
  const card = CARD_DATA[cardId] ?? { name: cardId, color: 'bg-stone-800 border-stone-600' }
  const isSab = cardId?.startsWith('SAB_')

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative border-2 rounded-lg p-3 text-left transition-all duration-150 w-28 min-h-20
        ${card.color}
        ${selected ? 'ring-2 ring-amber-400 scale-105' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
      `}
    >
      <p className="text-xs font-semibold text-stone-100 leading-tight">{card.name}</p>
      {isSab && <p className="text-xs text-red-400 mt-1">⚠ Wretch</p>}
    </button>
  )
}

export default function Game() {
  const {
    phase, day, resources, players, self,
    currentEventId, todayDrawnCards, persistentEffects,
    voteState, contributionStatus, log, settings,
    winner, gameOverReason, caravanDeckCount,
    chatMessages, lobby,
  } = useGameStore()

  const [selectedCard, setSelectedCard] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [showMobileLog, setShowMobileLog] = useState(false)

  // Track by day instead of boolean — fixes the multi-day reset bug
  const [contributedOnDay, setContributedOnDay] = useState(null)
  const [votedOnDay, setVotedOnDay] = useState(null)

  const hasContributed = contributedOnDay === day
  const hasVoted = votedOnDay === day

  const isHost = self?.isHost
  const myContrib = contributionStatus?.[self?.id]
  const iLocked = myContrib?.locked ?? false
  const currentEvent = EVENT_NAMES[currentEventId]
  const livingPlayers = players.filter(p => p.alive)

  function handleContribute() {
    socket.emit('submit_contribution', { cardId: selectedCard })
    setSelectedCard(null)
    setContributedOnDay(day)
  }

  function handleHold() {
    socket.emit('submit_contribution', { cardId: null })
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

  if (phase === 'gameOver') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-5xl font-bold">
            {winner === 'crew' ? '🌅' : '💀'}
          </h1>
          <h2 className="text-3xl font-bold text-amber-400">
            {winner === 'crew' ? 'The Crew Survives!' : 'The Caravan Falls'}
          </h2>
          <p className="text-stone-400">
            {gameOverReason === 'days_complete' && 'The caravan reached the Last Light.'}
            {gameOverReason === 'all_saboteurs_exiled' && 'All Wretches were exiled.'}
            {gameOverReason === 'resource_zero' && 'A resource collapsed. The Wretches win.'}
          </p>
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

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-700 px-4 py-3 flex items-center justify-between">
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

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left sidebar — players — hidden on mobile */}
        <div className="hidden md:flex w-48 bg-stone-900 border-r border-stone-700 p-3 flex-col gap-2">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Players</p>
          {players.map(p => {
            const contrib = contributionStatus?.[p.id]
            return (
              <div key={p.id} className={`flex items-center gap-2 ${!p.alive ? 'opacity-40' : ''}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-500' : 'bg-stone-600'}`} />
                <span className="text-sm text-stone-300 truncate flex-1">{p.name}</span>
                {p.isHost && <span className="text-xs text-amber-500">★</span>}
                {!p.alive && <span className="text-xs text-stone-600">✗</span>}
                {phase === 'contribution' && contrib?.locked && p.alive && (
                  <span className="text-xs text-green-500">✓</span>
                )}
                {phase === 'vote' && voteState?.votedPlayerIds?.includes(p.id) && p.alive && (
                  <span className="text-xs text-amber-500">✓</span>
                )}
              </div>
            )
          })}

          <Separator className="bg-stone-700 my-2" />

          {/* Persistent effects */}
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

          {/* Resources — always visible at top */}
          <div className="bg-stone-900 border-b border-stone-700 px-4 py-3 grid grid-cols-4 gap-4 flex-shrink-0">
            {Object.entries(resources).map(([key, val]) => (
              <ResourceBar key={key} resource={key} value={val} />
            ))}
          </div>

          {/* Phase content — scrollable middle, never pushes hand off screen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

            {/* Dawn Event */}
            {phase === 'dawnEvent' && currentEvent && (
              <div className="bg-amber-950 border border-amber-700 rounded-lg p-4 space-y-2">
                <p className="text-xs text-amber-500 uppercase tracking-wider">Dawn Event</p>
                <p className="text-amber-300 font-semibold text-lg">{currentEvent.name}</p>
                <p className="text-amber-200 text-sm">{currentEvent.desc}</p>
                {isHost && (
                  <Button
                    onClick={handleAdvance}
                    className="mt-2 bg-amber-700 hover:bg-amber-600 text-stone-100"
                  >
                    Continue →
                  </Button>
                )}
                {!isHost && (
                  <p className="text-xs text-amber-600 mt-2">Waiting for host to continue...</p>
                )}
              </div>
            )}

            {/* Contribution phase */}
            {phase === 'contribution' && (
              <div className="space-y-3">
                <div className="bg-stone-800 border border-stone-600 rounded-lg p-4">
                  <p className="text-stone-300 font-medium mb-1">Contribution Phase</p>
                  <p className="text-stone-500 text-sm">
                    {iLocked ? 'Waiting for others...' : 'Choose a card to contribute, or hold.'}
                  </p>
                </div>
                {!iLocked && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={handleContribute}
                      disabled={!selectedCard}
                      className="bg-amber-600 hover:bg-amber-500 text-stone-950"
                    >
                      Contribute Selected
                    </Button>
                    <Button
                      onClick={handleHold}
                      variant="outline"
                      className="border-stone-600 text-stone-300 hover:bg-stone-800"
                    >
                      Hold
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Cards resolved today */}
            {(phase === 'resolution' || phase === 'discussion') && todayDrawnCards.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Cards Resolved Today</p>
                <div className="flex flex-wrap gap-2">
                  {todayDrawnCards.map(ci => (
                    <div key={ci.instanceId} className={`border-2 rounded-lg p-3 w-28 ${CARD_DATA[ci.cardId]?.color ?? 'bg-stone-800 border-stone-600'}`}>
                      <p className="text-xs font-semibold text-stone-100">{CARD_DATA[ci.cardId]?.name ?? ci.cardId}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion */}
            {phase === 'discussion' && (
              <div className="bg-stone-800 border border-stone-600 rounded-lg p-4 space-y-2">
                <p className="text-stone-300 font-medium">Campfire Discussion</p>
                <p className="text-stone-500 text-sm">Discuss what happened. Accuse. Defend. The vote begins soon.</p>
                {isHost && (
                  <Button
                    onClick={handleBeginVote}
                    className="bg-red-800 hover:bg-red-700 text-stone-100 text-sm"
                  >
                    Begin Vote Now
                  </Button>
                )}
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
              <div className={`border rounded-lg p-3 text-sm ${self.role === 'saboteur' ? 'bg-red-950 border-red-800 text-red-300' : 'bg-green-950 border-green-800 text-green-300'}`}>
                You are: <strong>{self.role === 'saboteur' ? '💀 Wretch (Saboteur)' : '🛡 Crew Member'}</strong>
              </div>
            )}

            {/* Deck info */}
            <div className="flex gap-3 text-xs text-stone-600">
              <span>Deck: {caravanDeckCount} cards</span>
            </div>
          </div>

          {/* Hand — pinned to bottom, never scrolled away */}
          {self?.hand?.length > 0 && (
            <div className="bg-stone-900 border-t border-stone-700 p-3 flex-shrink-0">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Your Hand</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {self.hand.map((cardId, i) => (
                  <CardComponent
                    key={`${cardId}-${i}`}
                    cardId={cardId}
                    selected={selectedCard === cardId}
                    onClick={() => setSelectedCard(selectedCard === cardId ? null : cardId)}
                    disabled={phase !== 'contribution' || iLocked}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — log + chat — hidden on mobile */}
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

          {/* Chat */}
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

      {/* Mobile-only bottom bar — chat + collapsible log */}
      <div className="md:hidden bg-stone-900 border-t border-stone-700 flex-shrink-0">
        {/* Collapsible log panel */}
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
        {/* Chat input row with log toggle */}
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
