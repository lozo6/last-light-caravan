import { useState } from 'react'
import { socket } from '../lib/socket'
import { useGameStore } from '../store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Lobby() {
  const { players, lobby, settings, self, setRoomId, setPlayerName, setReconnectToken } = useGameStore()

  const [view,        setView]        = useState('home')
  const [name,        setName]        = useState('')
  const [joinCode,    setJoinCode]    = useState('')
  const [error,       setError]       = useState('')
  const [serverError, setServerError] = useState('')

  function handleCreate() {
    if (!name.trim()) return setError('Enter your name first')
    setError('')
    socket.emit('create_room', { name: name.trim() }, (res) => {
      if (res?.error) return setServerError(res.error)
      setRoomId(res.roomId)
      setPlayerName(name.trim())
      setReconnectToken(res.reconnectToken)
      setView('waiting')
    })
  }

  function handleJoin() {
    if (!name.trim())     return setError('Enter your name first')
    if (!joinCode.trim()) return setError('Enter a room code')
    setError('')
    setServerError('')
    socket.emit('join_room', { roomId: joinCode.trim().toUpperCase(), name: name.trim() }, (res) => {
      if (res?.error) return setServerError(res.error)
      setPlayerName(name.trim())
      setReconnectToken(res.reconnectToken)
      setView('waiting')
    })
  }

  function handleStart() {
    socket.emit('start_game')
  }

  const isHost      = self?.isHost
  const playerCount = players.length
  const maxPlayers  = settings?.maxPlayers ?? 10
  const canStart    = playerCount >= 4

  if (view === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-950">
        <Card className="w-full max-w-md bg-stone-900 border-stone-700">
          <CardHeader>
            <CardTitle className="text-stone-100 text-2xl">Last Light Caravan</CardTitle>
            <p className="text-stone-400 text-sm">
              Room code: <span className="text-amber-400 font-mono text-lg font-bold tracking-widest">{lobby?.roomId}</span>
            </p>
            <p className="text-stone-500 text-xs">Share this code with your friends</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">Players ({playerCount}/{maxPlayers})</p>
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-stone-800 rounded-lg">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-500' : 'bg-stone-600'}`} />
                  <span className="text-stone-200 text-sm flex-1 text-left">{p.name}</span>
                  {p.isHost && <span className="text-xs text-amber-400 font-medium flex-shrink-0">host</span>}
                </div>
              ))}
            </div>
            {isHost ? (
              <div className="space-y-2">
                {!canStart && (
                  <p className="text-stone-500 text-xs text-center">
                    Waiting for players... ({playerCount}/4 minimum)
                  </p>
                )}
                <Button
                  onClick={handleStart}
                  disabled={!canStart}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-semibold"
                >
                  {canStart ? 'Start Game' : `Need ${4 - playerCount} more player${4 - playerCount === 1 ? '' : 's'}`}
                </Button>
              </div>
            ) : (
              <p className="text-stone-500 text-sm text-center">Waiting for host to start...</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === 'home') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-950">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-amber-400">Last Light Caravan</h1>
            <p className="text-stone-400 text-sm">A social deduction deck-building game</p>
          </div>
          <Card className="bg-stone-900 border-stone-700">
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={() => { setError(''); setView('create') }}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-6 text-base"
              >
                Create Room
              </Button>
              <Button
                onClick={() => { setError(''); setView('join') }}
                className="w-full bg-stone-600 hover:bg-stone-500 text-stone-100 font-semibold py-6 text-base"
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
          <p className="text-stone-600 text-xs text-center">Requires at least 4 players to start</p>
        </div>
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-950">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-amber-400">Last Light Caravan</h1>
            <p className="text-stone-500 text-sm">Create a new room</p>
          </div>
          <Card className="bg-stone-900 border-stone-700">
            <CardContent className="pt-6 space-y-3">
              <input
                className="w-full bg-stone-800 border border-stone-600 rounded-md px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                placeholder="Your name"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                maxLength={20}
              />
              {error       && <p className="text-red-400 text-sm">{error}</p>}
              {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
              <Button onClick={handleCreate} className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold">
                Create Room
              </Button>
              <Button onClick={() => { setError(''); setServerError(''); setView('home') }} variant="outline" className="w-full border-stone-600 text-stone-400 hover:bg-stone-800">
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (view === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-950">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-amber-400">Last Light Caravan</h1>
            <p className="text-stone-500 text-sm">Join an existing room</p>
          </div>
          <Card className="bg-stone-900 border-stone-700">
            <CardContent className="pt-6 space-y-3">
              <input
                className="w-full bg-stone-800 border border-stone-600 rounded-md px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 uppercase tracking-widest font-mono text-center text-lg"
                placeholder="ROOM CODE"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); setServerError('') }}
                maxLength={4}
                autoFocus
              />
              <input
                className="w-full bg-stone-800 border border-stone-600 rounded-md px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                placeholder="Your name"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={20}
              />
              {error       && <p className="text-red-400 text-sm">{error}</p>}
              {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
              <Button onClick={handleJoin} className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold">
                Join Room
              </Button>
              <Button onClick={() => { setError(''); setServerError(''); setView('home') }} variant="outline" className="w-full border-stone-600 text-stone-400 hover:bg-stone-800">
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
