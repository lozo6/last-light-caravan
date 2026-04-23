import { useState } from 'react'
import { socket } from '../lib/socket'
import { useGameStore } from '../store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Lobby() {
  const { players, lobby, settings, self, setRoomId, setPlayerName, setReconnectToken } = useGameStore()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [view, setView] = useState('home') // 'home' | 'create' | 'join' | 'waiting'
  const [error, setError] = useState('')

  function handleCreate() {
    if (!name.trim()) return setError('Enter your name first')
    socket.emit('create_room', { name: name.trim() }, ({ roomId, reconnectToken }) => {
      setRoomId(roomId)
      setPlayerName(name.trim())
      setReconnectToken(reconnectToken)
      setView('waiting')
    })
  }

  function handleJoin() {
    if (!name.trim()) return setError('Enter your name first')
    if (!joinCode.trim()) return setError('Enter a room code')
    socket.emit('join_room', { roomId: joinCode.trim().toUpperCase(), name: name.trim() }, ({ reconnectToken }) => {
      setPlayerName(name.trim())
      setReconnectToken(reconnectToken)
      setView('waiting')
    })
  }

  function handleStart() {
    socket.emit('start_game')
  }

  const isHost = self?.isHost

  if (view === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-stone-900 border-stone-700">
          <CardHeader>
            <CardTitle className="text-stone-100 text-2xl">
              🏜️ Last Light Caravan
            </CardTitle>
            <p className="text-stone-400 text-sm">
              Room code: <span className="text-amber-400 font-mono text-lg font-bold">{lobby?.roomId}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-stone-400 text-sm">Share this code with your friends</p>

            <div className="space-y-2">
              <p className="text-stone-300 text-sm font-medium">Players ({players.length}/{settings?.maxPlayers ?? 10})</p>
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-stone-300">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  {p.name}
                  {p.isHost && <span className="text-xs text-amber-400">(host)</span>}
                </div>
              ))}
            </div>

            {isHost ? (
              <Button
                onClick={handleStart}
                disabled={players.length < 2}
                // disabled={players.length < 4}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950"
              >
                {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
                {/* {players.length < 4 ? `Waiting for players... (${players.length}/4)` : 'Start Game'} */}
              </Button>
            ) : (
              <p className="text-stone-500 text-sm text-center">Waiting for host to start...</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-amber-400">🏜️ Last Light Caravan</h1>
          <p className="text-stone-400">A social deduction deck-building game</p>
        </div>

        {view === 'home' && (
          <Card className="bg-stone-900 border-stone-700">
            <CardContent className="pt-6 space-y-3">
              <input
                className="w-full bg-stone-800 border border-stone-600 rounded-md px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                placeholder="Your name"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button
                onClick={() => {
                  if (!name.trim()) return setError('Enter your name first')
                  setError('')
                  setView('create')
                  handleCreate()
                }}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold"
              >
                Create Room
              </Button>
              <Button
                onClick={() => {
                  if (!name.trim()) return setError('Enter your name first')
                  setError('')
                  setView('join')
                }}
                variant="outline"
                className="w-full border-stone-600 text-stone-300 hover:bg-stone-800"
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        )}

        {view === 'join' && (
          <Card className="bg-stone-900 border-stone-700">
            <CardHeader>
              <CardTitle className="text-stone-100">Join a Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="w-full bg-stone-800 border border-stone-600 rounded-md px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 uppercase tracking-widest font-mono"
                placeholder="Room code"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                maxLength={4}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button
                onClick={handleJoin}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold"
              >
                Join
              </Button>
              <Button
                onClick={() => setView('home')}
                variant="outline"
                className="w-full border-stone-600 text-stone-300 hover:bg-stone-800"
              >
                Back
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
