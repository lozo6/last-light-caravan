import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { socket } from './lib/socket'
import Lobby from './components/Lobby'
import Game from './components/Game'

export default function App() {
  const { phase, setGameState, setSelfState, addChatMessage } = useGameStore()

  useEffect(() => {
    socket.on('state_update', ({ game, self }) => {
      setGameState(game)
      setSelfState(self)
    })

    socket.on('chat_message', (msg) => {
      addChatMessage(msg)
    })

    socket.on('error', ({ message }) => {
      console.error('[Server error]', message)
    })

    return () => {
      socket.off('state_update')
      socket.off('chat_message')
      socket.off('error')
    }
  }, [])

  const inGame = phase && phase !== 'lobby' && phase !== null

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {!inGame ? <Lobby /> : <Game />}
    </div>
  )
}
