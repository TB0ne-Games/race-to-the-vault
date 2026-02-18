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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomCode] = { host: socket.id, players: [] };
    socket.join(roomCode);
    socket.emit('room_created', roomCode);
    console.log(`Room created: ${roomCode}`);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    if (rooms[roomCode]) {
      const player = {
        id: socket.id,
        name: playerName,
        role: null,
        hand: [],
        tools: { flashlight: true, drill: true, map: true }
      };
      rooms[roomCode].players.push(player);
      socket.join(roomCode);
      socket.emit('joined_room', { roomCode, playerName });

      // Notify host
      io.to(rooms[roomCode].host).emit('player_joined', rooms[roomCode].players);
      console.log(`Player ${playerName} joined room ${roomCode}`);
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  socket.on('start_game', (roomCode) => {
    if (rooms[roomCode] && rooms[roomCode].host === socket.id) {
      const room = rooms[roomCode];
      const playerCount = room.players.length;

      // Initialize board and shuffle vaults
      room.grid = INITIAL_BOARD(5, 9);
      SHUFFLE_VAULTS(room.grid);

      // Initialize deck
      room.deck = CREATE_DECK();
      SHUFFLE_DECK(room.deck);

      room.gameStarted = true;
      room.currentPlayerIndex = 0;
      room.winner = null;

      // Saboteur-like role distribution
      let copCount = 1;
      if (playerCount >= 5) copCount = 2;
      if (playerCount >= 7) copCount = 3;

      let roles = [];
      for (let i = 0; i < copCount; i++) roles.push('Cop');
      for (let i = 0; i < playerCount - copCount; i++) roles.push('Robber');

      // Shuffle roles
      for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
      }

      const handSize = playerCount <= 5 ? 6 : 5;

      room.players.forEach((player, idx) => {
        player.role = roles[idx];
        player.hand = [];
        for (let i = 0; i < handSize; i++) {
          if (room.deck.length > 0) {
            player.hand.push(room.deck.pop());
          }
        }

        console.log(`DEBUG: Player ${player.name} (${player.id}) getting role ${player.role} and hand size ${player.hand.length}`);
        const startData = {
          role: player.role,
          hand: player.hand
        };
        console.log(`DEBUG: Emitting game_started with:`, JSON.stringify(startData));
        io.to(player.id).emit('game_started', startData);
      });

      // Notify host of the initial board and turn status
      io.to(room.host).emit('board_update', room.grid);
      io.to(room.host).emit('turn_update', {
        currentPlayer: room.players[room.currentPlayerIndex].name,
        deckCount: room.deck.length
      });

      // Also notify the active player
      io.to(room.players[room.currentPlayerIndex].id).emit('your_turn', true);

      console.log(`Game started in room ${roomCode}. Deck initialized and roles/hands distributed.`);
    } else {
      console.log(`Start game failed: room ${roomCode} not found or not host`);
    }
  });

  socket.on('place_card', ({ roomCode, r, c, card }) => {
    if (rooms[roomCode] && rooms[roomCode].gameStarted) {
      const room = rooms[roomCode];
      const currentPlayer = room.players[room.currentPlayerIndex];

      // Turn validation
      if (socket.id !== currentPlayer.id) {
        return socket.emit('error', 'Not your turn!');
      }

      // Tool validation: Can't place path if any tool is broken
      const brokenTools = Object.keys(currentPlayer.tools).filter(t => !currentPlayer.tools[t]);
      if (brokenTools.length > 0) {
        return socket.emit('error', `Cannot place paths! Tool broken: ${brokenTools.join(', ')}`);
      }

      if (CAN_PLACE_CARD(room.grid, r, c, card)) {
        room.grid[r][c] = { ...card, type: 'path' };

        // Remove card from player's hand
        currentPlayer.hand = currentPlayer.hand.filter(h => h.id !== card.id);

        // Draw a new card
        if (room.deck.length > 0) {
          currentPlayer.hand.push(room.deck.pop());
        }

        // Notify client of hand/turn update
        socket.emit('hand_update', currentPlayer.hand);
        socket.emit('your_turn', false);

        // Check for vault reveals
        const directions = [
          { dr: -1, dc: 0, door: 'top', opp: 'bottom' },
          { dr: 1, dc: 0, door: 'bottom', opp: 'top' },
          { dr: 0, dc: -1, door: 'left', opp: 'right' },
          { dr: 0, dc: 1, door: 'right', opp: 'left' }
        ];

        directions.forEach(({ dr, dc, door, opp }) => {
          const nextR = r + dr;
          const nextC = c + dc;
          if (nextR >= 0 && nextR < 5 && nextC >= 0 && nextC < 9) {
            const neighbor = room.grid[nextR][nextC];
            if (neighbor && neighbor.type === 'vault' && !neighbor.revealed) {
              // Check if path connects to vault door
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

        // Advance turn
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
        const nextPlayer = room.players[room.currentPlayerIndex];

        // Notify host
        io.to(room.host).emit('board_update', room.grid);
        io.to(room.host).emit('turn_update', {
          currentPlayer: nextPlayer.name,
          deckCount: room.deck.length,
          players: room.players.map(p => ({ id: p.id, name: p.name, tools: p.tools }))
        });

        // Notify next player
        io.to(nextPlayer.id).emit('your_turn', true);

        // Check for Cop victory (Deck empty and all hands empty)
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
        // Remove card from hand
        currentPlayer.hand = currentPlayer.hand.filter(h => h.id !== actionCard.id);
        if (room.deck.length > 0) currentPlayer.hand.push(room.deck.pop());

        // Notify and advance
        socket.emit('hand_update', currentPlayer.hand);
        socket.emit('your_turn', false);

        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
        const nextPlayer = room.players[room.currentPlayerIndex];

        io.to(room.host).emit('board_update', room.grid);
        io.to(room.host).emit('turn_update', {
          currentPlayer: nextPlayer.name,
          deckCount: room.deck.length,
          players: room.players.map(p => ({ id: p.id, name: p.name, tools: p.tools }))
        });
        io.to(nextPlayer.id).emit('your_turn', true);

        // Check for Cop victory (Deck empty and all hands empty)
        if (room.deck.length === 0 && room.players.every(p => p.hand.length === 0) && !room.winner) {
          room.winner = 'Cops';
          io.to(roomCode).emit('game_over', { winner: 'Cops' });
        }
      } else {
        socket.emit('error', 'Action failed or invalid target');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
