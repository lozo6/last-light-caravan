'use strict';

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');

const {
  createGameState,
  startGame,
  enterContribution,
  submitContribution,
  enterVote,
  castVote,
  forceResolveVote,
  buildPublicGameView,
  buildSelfView,
  buildGameOverView,
  Phase,
} = require('./gameState');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, '../../../packages/client/dist')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../packages/client/dist/index.html'));
});

const rooms    = new Map();
const socketMap = new Map();
const timers   = new Map();

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function broadcastState(roomId) {
  const state = rooms.get(roomId);
  if (!state) return;

  const isGameOver = state.phase === Phase.GAME_OVER;
  const publicView = isGameOver ? buildGameOverView(state) : buildPublicGameView(state);

  state.players.forEach(player => {
    if (!player.connected) return;
    const selfView = buildSelfView(state, player.id);
    io.to(player.id).emit('state_update', { game: publicView, self: selfView });
  });

  io.to(roomId).emit('phase_changed', { phase: state.phase, day: state.day });
}

function sendError(socket, message) {
  socket.emit('error', { message });
}

function clearRoomTimer(roomId) {
  const t = timers.get(roomId);
  if (t) { clearTimeout(t); timers.delete(roomId); }
}

function startDiscussionTimer(roomId) {
  clearRoomTimer(roomId);
  const state = rooms.get(roomId);
  if (!state) return;
  const duration = (state.settings.discussionTimerSeconds ?? 120) * 1000;
  const t = setTimeout(() => {
    const s = rooms.get(roomId);
    if (s && s.phase === Phase.DISCUSSION) {
      enterVote(s);
      broadcastState(roomId);
      startVoteTimer(roomId);
    }
  }, duration);
  timers.set(roomId, t);
}

function startVoteTimer(roomId) {
  clearRoomTimer(roomId);
  const state = rooms.get(roomId);
  if (!state) return;
  const duration = (state.settings.voteTimerSeconds ?? 60) * 1000;
  const t = setTimeout(() => {
    const s = rooms.get(roomId);
    if (s && s.phase === Phase.VOTE) {
      forceResolveVote(s);
      broadcastState(roomId);
      if (s.phase === Phase.DISCUSSION) startDiscussionTimer(roomId);
    }
  }, duration);
  timers.set(roomId, t);
}

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on('create_room', ({ name }, callback) => {
    if (!name?.trim()) return sendError(socket, 'Name is required');
    let roomId;
    do { roomId = generateRoomId(); } while (rooms.has(roomId));

    const state = createGameState(roomId, socket.id, name.trim());
    rooms.set(roomId, state);
    socketMap.set(socket.id, { roomId, playerId: socket.id });

    socket.join(roomId);
    socket.join(socket.id);

    console.log(`[Room] Created ${roomId} by ${name}`);
    broadcastState(roomId);
    if (callback) callback({ roomId, reconnectToken: state.players[0].reconnectToken });
  });

  socket.on('join_room', ({ roomId, name }, callback) => {
    if (!roomId || !name?.trim()) return sendError(socket, 'Room ID and name are required');
    const state = rooms.get(roomId.toUpperCase());
    if (!state) return sendError(socket, 'Room not found');
    if (state.phase !== Phase.LOBBY) return sendError(socket, 'Game already in progress');
    if (state.players.length >= state.settings.maxPlayers) return sendError(socket, 'Room is full');

    const player = {
      id: socket.id,
      name: name.trim(),
      role: null,
      alive: true,
      isHost: false,
      hand: [],
      connected: true,
      votedForPlayerId: null,
      reconnectToken: uuidv4(),
    };

    state.players.push(player);
    socketMap.set(socket.id, { roomId: state.lobby.roomId, playerId: socket.id });

    socket.join(state.lobby.roomId);
    socket.join(socket.id);

    io.to(state.lobby.roomId).emit('player_joined', { name: player.name });
    broadcastState(state.lobby.roomId);
    if (callback) callback({ reconnectToken: player.reconnectToken });
  });

  socket.on('request_sync', () => {
    const info = socketMap.get(socket.id);
    if (!info) return;
    const state = rooms.get(info.roomId);
    if (!state) return;
    const publicView = state.phase === Phase.GAME_OVER
      ? buildGameOverView(state) : buildPublicGameView(state);
    const selfView = buildSelfView(state, info.playerId);
    socket.emit('state_update', { game: publicView, self: selfView });
  });

  socket.on('update_settings', ({ settings }) => {
    const info = socketMap.get(socket.id);
    if (!info) return sendError(socket, 'Not in a room');
    const state = rooms.get(info.roomId);
    if (!state) return;
    if (state.lobby.hostId !== socket.id) return sendError(socket, 'Only host can change settings');
    if (state.phase !== Phase.LOBBY) return sendError(socket, 'Game already started');

    const allowed = ['numDays', 'cardsPerDayDraw', 'maxPlayers', 'revealExiledRole',
                     'discussionTimerSeconds', 'voteTimerSeconds'];
    for (const key of allowed) {
      if (settings[key] !== undefined) state.settings[key] = settings[key];
    }
    broadcastState(info.roomId);
  });

  socket.on('start_game', () => {
    const info = socketMap.get(socket.id);
    if (!info) return sendError(socket, 'Not in a room');
    const state = rooms.get(info.roomId);
    if (!state) return;
    if (state.lobby.hostId !== socket.id) return sendError(socket, 'Only host can start the game');
    try {
      startGame(state);
      broadcastState(info.roomId);
    } catch (e) {
      sendError(socket, e.message);
    }
  });

  socket.on('advance_phase', () => {
    const info = socketMap.get(socket.id);
    if (!info) return;
    const state = rooms.get(info.roomId);
    if (!state) return;
    if (state.phase === Phase.DAWN_EVENT) {
      enterContribution(state);
      broadcastState(info.roomId);
    }
  });

  socket.on('submit_contribution', ({ cardId }) => {
    const info = socketMap.get(socket.id);
    if (!info) return sendError(socket, 'Not in a room');
    const state = rooms.get(info.roomId);
    if (!state) return;
    try {
      submitContribution(state, info.playerId, cardId ?? null);
      broadcastState(info.roomId);
      if (state.phase === Phase.DISCUSSION) startDiscussionTimer(info.roomId);
    } catch (e) {
      sendError(socket, e.message);
    }
  });

  socket.on('begin_vote', () => {
    const info = socketMap.get(socket.id);
    if (!info) return;
    const state = rooms.get(info.roomId);
    if (!state) return;
    if (state.phase !== Phase.DISCUSSION) return sendError(socket, 'Not in discussion phase');
    if (state.lobby.hostId !== socket.id) return sendError(socket, 'Only host can begin vote early');
    clearRoomTimer(info.roomId);
    enterVote(state);
    broadcastState(info.roomId);
    startVoteTimer(info.roomId);
  });

  socket.on('cast_vote', ({ targetId }) => {
    const info = socketMap.get(socket.id);
    if (!info) return sendError(socket, 'Not in a room');
    const state = rooms.get(info.roomId);
    if (!state) return;
    try {
      castVote(state, info.playerId, targetId ?? null);
      io.to(info.roomId).emit('vote_update', {
        votedPlayerIds: Object.keys(state.voteState?.votes ?? {}),
      });
      if (state.phase !== Phase.VOTE) {
        clearRoomTimer(info.roomId);
        broadcastState(info.roomId);
        if (state.phase === Phase.DISCUSSION) startDiscussionTimer(info.roomId);
      }
    } catch (e) {
      sendError(socket, e.message);
    }
  });

  socket.on('send_chat_message', ({ text }) => {
    const info = socketMap.get(socket.id);
    if (!info) return;
    const state = rooms.get(info.roomId);
    if (!state) return;
    const player = state.players.find(p => p.id === info.playerId);
    if (!player?.alive) return;
    const msg = {
      id: uuidv4(),
      playerId: player.id,
      name: player.name,
      text: String(text).slice(0, 300),
      timestamp: Date.now(),
    };
    io.to(info.roomId).emit('chat_message', msg);
  });

  socket.on('reconnect_player', ({ roomId, reconnectToken }, callback) => {
    const state = rooms.get(roomId);
    if (!state) return sendError(socket, 'Room not found');
    const player = state.players.find(p => p.reconnectToken === reconnectToken);
    if (!player) return sendError(socket, 'Invalid reconnect token');

    const oldId = player.id;
    socketMap.delete(oldId);
    player.id = socket.id;
    player.connected = true;
    socketMap.set(socket.id, { roomId, playerId: socket.id });

    socket.join(roomId);
    socket.join(socket.id);

    if (state.lobby.hostId === oldId) state.lobby.hostId = socket.id;
    broadcastState(roomId);
    if (callback) callback({ success: true });
  });

  socket.on('leave_room', () => handleDisconnect(socket));
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    handleDisconnect(socket);
  });

  function handleDisconnect(socket) {
    const info = socketMap.get(socket.id);
    if (!info) return;
    const state = rooms.get(info.roomId);
    if (state) {
      const player = state.players.find(p => p.id === info.playerId);
      if (player) {
        player.connected = false;
        io.to(info.roomId).emit('player_left', { name: player.name, id: player.id });
        broadcastState(info.roomId);
        if (state.phase === Phase.LOBBY) {
          const anyConnected = state.players.some(p => p.connected);
          if (!anyConnected) {
            rooms.delete(info.roomId);
            clearRoomTimer(info.roomId);
            console.log(`[Room] Cleaned up empty room ${info.roomId}`);
          }
        }
      }
    }
    socketMap.delete(socket.id);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🏜️  Last Light Caravan server running on http://localhost:${PORT}\n`);
});
