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
      const player = { id: socket.id, name: playerName, role: null };
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
      room.gameStarted = true;

      // Saboteur-like role distribution
      let copCount = 1;
      if (playerCount >= 5) copCount = 2;
      if (playerCount >= 7) copCount = 3;

      let roles = [];
      for (let i = 0; i < copCount; i++) roles.push('Cop');
      for (let i = 0; i < playerCount - copCount; i++) roles.push('Robber');

      // Shuffle roles
      roles = roles.sort(() => Math.random() - 0.5);

      // Assign and notify players
      room.players.forEach((player, index) => {
        player.role = roles[index];
        console.log(`Sending role ${player.role} to player ${player.name} (${player.id})`);
        io.to(player.id).emit('game_started', { role: player.role });
      });

      // Notify host of the initial board
      io.to(room.host).emit('board_update', room.grid);

      console.log(`Game started in room ${roomCode}. Board initialized and roles distributed.`);
    } else {
      console.log(`Start game failed: room ${roomCode} not found or not host`);
    }
  });

  socket.on('place_card', ({ roomCode, r, c, card }) => {
    if (rooms[roomCode] && rooms[roomCode].gameStarted) {
      const room = rooms[roomCode];

      if (CAN_PLACE_CARD(room.grid, r, c, card)) {
        room.grid[r][c] = { ...card, type: 'path' };

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

        io.to(room.host).emit('board_update', room.grid);
      } else {
        socket.emit('error', 'Invalid placement');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle cleanup if needed
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
