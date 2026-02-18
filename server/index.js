const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

const INITIAL_BOARD = (rows, cols) => {
  const board = Array(rows).fill(null).map(() => Array(cols).fill(null));
  // Entrance (Center of first column)
  board[2][0] = {
    type: 'entrance',
    id: 'start',
    top: true, bottom: true, left: true, right: true
  };
  // Vaults (Last column, rows 0, 2, 4)
  const vaultPositions = [0, 2, 4];
  vaultPositions.forEach((row, idx) => {
    board[row][8] = {
      type: 'vault',
      id: `vault-${idx}`,
      revealed: false,
      hasMoney: false, // Set during shuffle
      top: true, bottom: true, left: true, right: true
    };
  });
  return board;
};

const SHUFFLE_VAULTS = (board) => {
  const vaultRows = [0, 2, 4];
  const moneyRow = vaultRows[Math.floor(Math.random() * vaultRows.length)];
  vaultRows.forEach(row => {
    board[row][8].hasMoney = (row === moneyRow);
  });
};

const IS_CONNECTED_TO_START = (board, r, c) => {
  const visited = new Set();
  const queue = [[2, 0]]; // Start at entrance

  while (queue.length > 0) {
    const [currR, currC] = queue.shift();
    const key = `${currR},${currC}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (currR === r && currC === c) return true;

    const currNode = board[currR][currC];
    if (!currNode) continue;

    // Check neighbors
    const directions = [
      { dr: -1, dc: 0, door: 'top', opp: 'bottom' },
      { dr: 1, dc: 0, door: 'bottom', opp: 'top' },
      { dr: 0, dc: -1, door: 'left', opp: 'right' },
      { dr: 0, dc: 1, door: 'right', opp: 'left' }
    ];

    for (const { dr, dc, door, opp } of directions) {
      const nextR = currR + dr;
      const nextC = currC + dc;
      if (nextR >= 0 && nextR < 5 && nextC >= 0 && nextC < 9) {
        const nextNode = board[nextR][nextC];
        if (nextNode && currNode[door] && nextNode[opp]) {
          queue.push([nextR, nextC]);
        }
      }
    }
  }
  return false;
};

const CAN_PLACE_CARD = (board, r, c, card) => {
  // 1. Must be empty
  if (board[r][c]) return false;

  // 2. Must have at least one neighbor
  const neighbors = [
    { dr: -1, dc: 0, door: 'top', opp: 'bottom' },
    { dr: 1, dc: 0, door: 'bottom', opp: 'top' },
    { dr: 0, dc: -1, door: 'left', opp: 'right' },
    { dr: 0, dc: 1, door: 'right', opp: 'left' }
  ];

  let hasNeighbor = false;
  for (const { dr, dc, door, opp } of neighbors) {
    const nextR = r + dr;
    const nextC = c + dc;
    if (nextR >= 0 && nextR < 5 && nextC >= 0 && nextC < 9) {
      const neighbor = board[nextR][nextC];
      if (neighbor) {
        hasNeighbor = true;
        // 3. Doors must match
        if (card[door] !== neighbor[opp]) return false;
      }
    }
  }

  if (!hasNeighbor) return false;

  // 4. Temporarily place to check connectivity
  board[r][c] = card;
  const connected = IS_CONNECTED_TO_START(board, r, c);
  board[r][c] = null; // Revert

  return connected;
};

const CREATE_DECK = () => {
  const deck = [];
  const addCards = (count, props) => {
    for (let i = 0; i < count; i++) {
      deck.push({ id: `card-${Math.random().toString(36).substr(2, 9)}`, ...props });
    }
  };

  // Good Path Cards (Connective)
  addCards(5, { top: true, bottom: true, left: true, right: true, deadEnd: false }); // Cross
  addCards(5, { top: true, bottom: true, left: true, right: false, deadEnd: false }); // T-left
  addCards(5, { top: true, bottom: true, left: false, right: true, deadEnd: false }); // T-right
  addCards(10, { top: false, bottom: false, left: true, right: true, deadEnd: false }); // Horizontal
  addCards(10, { top: true, bottom: true, left: false, right: false, deadEnd: false }); // Vertical
  addCards(5, { top: false, bottom: true, left: false, right: true, deadEnd: false }); // Curve BR
  addCards(5, { top: false, bottom: true, left: true, right: false, deadEnd: false }); // Curve BL

  // Dead-end Cards (Sabotage path)
  addCards(3, { top: true, bottom: true, left: true, right: true, deadEnd: true }); // Blocked Cross
  addCards(3, { top: false, bottom: false, left: true, right: true, deadEnd: true }); // Blocked Horizontal
  addCards(3, { top: true, bottom: true, left: false, right: false, deadEnd: true }); // Blocked Vertical

  // Action Cards
  addCards(3, { type: 'action', action: 'map', label: 'Vault Intel' });
  addCards(3, { type: 'action', action: 'dynamite', label: 'Dynamite' });

  // Sabotage Tools (Break others)
  addCards(3, { type: 'action', action: 'sabotage', tool: 'flashlight', label: 'Cut Power' });
  addCards(3, { type: 'action', action: 'sabotage', tool: 'drill', label: 'Jam Drill' });
  addCards(3, { type: 'action', action: 'sabotage', tool: 'map', label: 'Steal Map' });

  // Repair Tools (Fix oneself or others)
  addCards(2, { type: 'action', action: 'repair', tool: 'flashlight', label: 'Flashlight' });
  addCards(2, { type: 'action', action: 'repair', tool: 'drill', label: 'New Drill Bit' });
  addCards(2, { type: 'action', action: 'repair', tool: 'map', label: 'Crumpled Map' });

  return deck;
};

const SHUFFLE_DECK = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
};

const handleAITurn = (room, roomCode) => {
  const currentPlayer = room.players[room.currentPlayerIndex];
  if (!currentPlayer || !currentPlayer.isAI || room.winner) return;

  console.log(`AI Turn: ${currentPlayer.name} is thinking...`);

  setTimeout(() => {
    // 1. Try to play a path card if possible
    const pathCards = currentPlayer.hand.filter(c => c.type !== 'action');
    let moveMade = false;

    // Check if tools are okay
    const brokenTools = Object.keys(currentPlayer.tools).filter(t => !currentPlayer.tools[t]);

    if (brokenTools.length === 0) {
      const possiblePositions = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 1; c < 9; c++) {
          possiblePositions.push({ r, c });
        }
      }
      for (let i = possiblePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possiblePositions[i], possiblePositions[j]] = [possiblePositions[j], possiblePositions[i]];
      }

      for (const card of pathCards) {
        for (const pos of possiblePositions) {
          if (CAN_PLACE_CARD(room.grid, pos.r, pos.c, card)) {
            room.grid[pos.r][pos.c] = { ...card, type: 'path' };
            currentPlayer.hand = currentPlayer.hand.filter(h => h.id !== card.id);
            if (room.deck.length > 0) currentPlayer.hand.push(room.deck.pop());

            const directions = [
              { dr: -1, dc: 0, door: 'top', opp: 'bottom' },
              { dr: 1, dc: 0, door: 'bottom', opp: 'top' },
              { dr: 0, dc: -1, door: 'left', opp: 'right' },
              { dr: 0, dc: 1, door: 'right', opp: 'left' }
            ];
            directions.forEach(({ dr, dc, door, opp }) => {
              const nextR = pos.r + dr;
              const nextC = pos.c + dc;
              if (nextR >= 0 && nextR < 5 && nextC >= 0 && nextC < 9) {
                const neighbor = room.grid[nextR][nextC];
                if (neighbor && neighbor.type === 'vault' && !neighbor.revealed) {
                  if (card[door] && IS_CONNECTED_TO_START(room.grid, pos.r, pos.c)) {
                    neighbor.revealed = true;
                    if (neighbor.hasMoney) {
                      room.winner = 'Robbers';
                      io.to(roomCode).emit('game_over', { winner: 'Robbers' });
                    }
                  }
                }
              }
            });

            moveMade = true;
            break;
          }
        }
        if (moveMade) break;
      }
    }

    if (!moveMade) {
      console.log(`AI ${currentPlayer.name} passing (no valid move found or tools broken).`);
    }

    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    const nextPlayer = room.players[room.currentPlayerIndex];

    io.to(roomCode).emit('board_update', room.grid);
    io.to(roomCode).emit('turn_update', {
      currentPlayer: nextPlayer.name,
      deckCount: room.deck.length,
      players: room.players.map(p => ({ id: p.id, name: p.name, tools: p.tools, isAI: p.isAI }))
    });

    if (nextPlayer.isAI) {
      handleAITurn(room, roomCode);
    } else {
      io.to(nextPlayer.id).emit('your_turn', true);
    }

    if (room.deck.length === 0 && room.players.every(p => p.hand.length === 0) && !room.winner) {
      room.winner = 'Cops';
      io.to(roomCode).emit('game_over', { winner: 'Cops' });
    }
  }, 1500);
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomCode] = { host: socket.id, players: [] };
    socket.join(roomCode);
    socket.emit('room_created', roomCode);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    if (rooms[roomCode]) {
      const player = {
        id: socket.id,
        name: playerName,
        role: null,
        hand: [],
        tools: { flashlight: true, drill: true, map: true },
        isAI: false
      };
      rooms[roomCode].players.push(player);
      socket.join(roomCode);
      socket.emit('joined_room', { roomCode, playerName });
      io.to(rooms[roomCode].host).emit('player_joined', rooms[roomCode].players);
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  socket.on('add_ai', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].host === socket.id && !rooms[roomCode].gameStarted) {
      const room = rooms[roomCode];
      const aiPlayer = {
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        name: `BOT ${room.players.length + 1}`,
        role: null,
        hand: [],
        tools: { flashlight: true, drill: true, map: true },
        isAI: true
      };
      room.players.push(aiPlayer);
      io.to(room.host).emit('player_joined', room.players);
    }
  });

  socket.on('start_game', (roomCode) => {
    if (rooms[roomCode] && rooms[roomCode].host === socket.id) {
      const room = rooms[roomCode];
      const playerCount = room.players.length;
      room.grid = INITIAL_BOARD(5, 9);
      SHUFFLE_VAULTS(room.grid);
      room.deck = CREATE_DECK();
      SHUFFLE_DECK(room.deck);
      room.gameStarted = true;
      room.currentPlayerIndex = 0;
      room.winner = null;

      let copCount = Math.max(1, Math.floor(playerCount / 3));
      let roles = Array(copCount).fill('Cop').concat(Array(playerCount - copCount).fill('Robber'));
      for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
      }

      const handSize = playerCount <= 5 ? 6 : 5;
      room.players.forEach((p, i) => {
        p.role = roles[i];
        p.hand = [];
        for (let j = 0; j < handSize; j++) if (room.deck.length > 0) p.hand.push(room.deck.pop());
        if (!p.isAI) io.to(p.id).emit('game_started', { role: p.role, hand: p.hand });
      });

      io.to(room.host).emit('board_update', room.grid);
      io.to(room.host).emit('turn_update', {
        currentPlayer: room.players[room.currentPlayerIndex].name,
        deckCount: room.deck.length,
        players: room.players.map(p => ({ id: p.id, name: p.name, tools: p.tools, isAI: p.isAI }))
      });

      const firstPlayer = room.players[room.currentPlayerIndex];
      if (firstPlayer.isAI) handleAITurn(room, roomCode);
      else io.to(firstPlayer.id).emit('your_turn', true);
    }
  });

  socket.on('place_card', ({ roomCode, r, c, card }) => {
    if (rooms[roomCode] && rooms[roomCode].gameStarted) {
      const room = rooms[roomCode];
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (socket.id !== currentPlayer.id) return socket.emit('error', 'Not your turn!');

      const brokenTools = Object.keys(currentPlayer.tools).filter(t => !currentPlayer.tools[t]);
      if (brokenTools.length > 0) return socket.emit('error', 'Tools broken!');

      if (CAN_PLACE_CARD(room.grid, r, c, card)) {
        room.grid[r][c] = { ...card, type: 'path' };
        currentPlayer.hand = currentPlayer.hand.filter(h => h.id !== card.id);
        if (room.deck.length > 0) currentPlayer.hand.push(room.deck.pop());
        socket.emit('hand_update', currentPlayer.hand);
        socket.emit('your_turn', false);

        const directions = [{ dr: -1, dc: 0, door: 'top', opp: 'bottom' }, { dr: 1, dc: 0, door: 'bottom', opp: 'top' }, { dr: 0, dc: -1, door: 'left', opp: 'right' }, { dr: 0, dc: 1, door: 'right', opp: 'left' }];
        directions.forEach(({ dr, dc, door, opp }) => {
          const nextR = r + dr, nextC = c + dc;
          if (nextR >= 0 && nextR < 5 && nextC >= 0 && nextC < 9) {
            const neighbor = room.grid[nextR][nextC];
            if (neighbor && neighbor.type === 'vault' && !neighbor.revealed) {
              if (card[door] && IS_CONNECTED_TO_START(room.grid, r, c)) {
                neighbor.revealed = true;
                if (neighbor.hasMoney) {
                  room.winner = 'Robbers';
                  io.to(roomCode).emit('game_over', { winner: 'Robbers' });
                }
              }
            }
          }
        });

        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
        const nextPlayer = room.players[room.currentPlayerIndex];
        io.to(roomCode).emit('board_update', room.grid);
        io.to(roomCode).emit('turn_update', {
          currentPlayer: nextPlayer.name,
          deckCount: room.deck.length,
          players: room.players.map(p => ({ id: p.id, name: p.name, tools: p.tools, isAI: p.isAI }))
        });

        if (nextPlayer.isAI) handleAITurn(room, roomCode);
        else io.to(nextPlayer.id).emit('your_turn', true);

        if (room.deck.length === 0 && room.players.every(p => p.hand.length === 0) && !room.winner) {
          room.winner = 'Cops';
          io.to(roomCode).emit('game_over', { winner: 'Cops' });
        }
      } else {
        socket.emit('error', 'Invalid placement');
      }
    }
  });

  socket.on('play_action', ({ roomCode, actionCard, targetId, r, c }) => {
    if (rooms[roomCode] && rooms[roomCode].gameStarted) {
      const room = rooms[roomCode];
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (socket.id !== currentPlayer.id) return socket.emit('error', 'Not your turn!');
      let actionSuccess = false;

      if (actionCard.action === 'map') {
        const vault = room.grid[r][c];
        if (vault && vault.type === 'vault') {
          socket.emit('intel_reveal', { r, c, hasMoney: vault.hasMoney });
          actionSuccess = true;
        }
      } else if (actionCard.action === 'dynamite') {
        const tile = room.grid[r][c];
        if (tile && tile.type === 'path') {
          room.grid[r][c] = null;
          actionSuccess = true;
        }
      } else if (actionCard.action === 'sabotage') {
        const target = room.players.find(p => p.id === targetId);
        if (target && target.tools[actionCard.tool]) {
          target.tools[actionCard.tool] = false;
          actionSuccess = true;
        }
      } else if (actionCard.action === 'repair') {
        const target = room.players.find(p => p.id === targetId);
        if (target && !target.tools[actionCard.tool]) {
          target.tools[actionCard.tool] = true;
          actionSuccess = true;
        }
      }

      if (actionSuccess) {
        currentPlayer.hand = currentPlayer.hand.filter(h => h.id !== actionCard.id);
        if (room.deck.length > 0) currentPlayer.hand.push(room.deck.pop());
        socket.emit('hand_update', currentPlayer.hand);
        socket.emit('your_turn', false);
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
        const nextPlayer = room.players[room.currentPlayerIndex];
        io.to(roomCode).emit('board_update', room.grid);
        io.to(roomCode).emit('turn_update', {
          currentPlayer: nextPlayer.name,
          deckCount: room.deck.length,
          players: room.players.map(p => ({ id: p.id, name: p.name, tools: p.tools, isAI: p.isAI }))
        });

        if (nextPlayer.isAI) handleAITurn(room, roomCode);
        else io.to(nextPlayer.id).emit('your_turn', true);

        if (room.deck.length === 0 && room.players.every(p => p.hand.length === 0) && !room.winner) {
          room.winner = 'Cops';
          io.to(roomCode).emit('game_over', { winner: 'Cops' });
        }
      } else {
        socket.emit('error', 'Action failed');
      }
    }
  });

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
