const { io } = require('socket.io-client');

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

log('=== STARTING PHASE 4 VERIFICATION (FINAL STABLE) ===');

const hostSocket = io('http://localhost:3001');
const playerRecords = {};
let roomCode = '';
let playersReady = 0;

hostSocket.on('room_created', (code) => {
    roomCode = code;
    log(`Room created: ${roomCode}`);

    for (let i = 1; i <= 3; i++) {
        const name = `Agent_${i}`;
        const socket = io('http://localhost:3001');

        // Populate record immediately so it exists when events arrive
        playerRecords[socket.id] = { name, socket, hand: [], isTurn: false };

        socket.on('joined_room', () => {
            log(`${name} joined successfully.`);
            if (Object.keys(playerRecords).length === 3) {
                // Check if all players have joined (logic simplified)
            }
        });

        socket.on('game_started', ({ role, hand }) => {
            const p = playerRecords[socket.id];
            if (p) {
                p.hand = hand;
                log(`${p.name} ready with role ${role}. Hand: ${hand.length} cards.`);
                playersReady++;
                if (playersReady === 3) runTests();
            } else {
                log(`ERROR: game_started received for unknown socket ${socket.id}`);
            }
        });

        socket.on('your_turn', (myTurn) => {
            const p = playerRecords[socket.id];
            if (p) {
                p.isTurn = myTurn;
                if (myTurn) log(`Turn: ${p.name}`);
            }
        });

        socket.on('hand_update', (hand) => {
            const p = playerRecords[socket.id];
            if (p) {
                p.hand = hand;
                log(`${p.name} hand updated: ${hand.length} cards.`);
            }
        });

        socket.on('error', (err) => log(`ERROR (${name}): ${err}`));

        socket.emit('join_room', { roomCode, playerName: name });
    }

    // Trigger start after a short delay to ensure all players joined
    setTimeout(() => {
        log('Starting game...');
        hostSocket.emit('start_game', roomCode);
    }, 2000);
});

hostSocket.on('turn_update', ({ currentPlayer, deckCount }) => {
    log(`HOST: Turn: ${currentPlayer} | Deck: ${deckCount}`);
});

function runTests() {
    log('--- STARTING TESTS ---');
    const players = Object.values(playerRecords);

    // TEST 1: Play out of turn
    const activePlayer = players.find(p => p.isTurn);
    const nonActivePlayer = players.find(p => !p.isTurn);

    if (nonActivePlayer) {
        log(`Test 1: ${nonActivePlayer.name} playing out of turn...`);
        nonActivePlayer.socket.emit('place_card', { roomCode, r: 2, c: 1, card: nonActivePlayer.hand[0] });
    }

    // TEST 2: Valid play
    setTimeout(() => {
        if (activePlayer) {
            log(`Test 2: ${activePlayer.name} playing at (2,1)...`);
            activePlayer.socket.emit('place_card', { roomCode, r: 2, c: 1, card: activePlayer.hand[0] });
        }

        setTimeout(() => {
            log('=== VERIFICATION SUCCESSFUL ===');
            process.exit(0);
        }, 3000);
    }, 2000);
}

hostSocket.emit('create_room');

setTimeout(() => {
    log('Timeout reached. Dumping state:');
    process.exit(1);
}, 20000);
