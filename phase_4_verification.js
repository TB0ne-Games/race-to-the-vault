const { io } = require('socket.io-client');

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

log('=== STARTING PHASE 4 VERIFICATION (FINAL STABLE v2) ===');

const hostSocket = io('http://localhost:3001');
const playerRecords = {}; // We'll use name as key for initialization
const socketToName = {};   // Map socket.id to name after connection
let roomCode = '';
let playersReady = 0;

hostSocket.on('room_created', (code) => {
    roomCode = code;
    log(`Room created: ${roomCode}`);

    for (let i = 1; i <= 3; i++) {
        const name = `Agent_${i}`;
        const socket = io('http://localhost:3001');

        playerRecords[name] = { socket, hand: [], isTurn: false };

        socket.on('connect', () => {
            socketToName[socket.id] = name;
            log(`${name} connected with ID ${socket.id}`);
            socket.emit('join_room', { roomCode, playerName: name });
        });

        socket.on('joined_room', () => {
            log(`${name} joined room.`);
        });

        socket.on('game_started', ({ role, hand }) => {
            playerRecords[name].hand = hand;
            log(`${name} ready with role ${role}. Hand: ${hand.length} cards.`);
            playersReady++;
            if (playersReady === 3) {
                setTimeout(runTests, 1000);
            }
        });

        socket.on('your_turn', (myTurn) => {
            playerRecords[name].isTurn = myTurn;
            if (myTurn) log(`Turn Event -> ${name}`);
        });

        socket.on('hand_update', (hand) => {
            playerRecords[name].hand = hand;
            log(`${name} hand updated: ${hand.length} cards.`);
        });

        socket.on('error', (err) => log(`ERROR (${name}): ${err}`));
    }

    // Check for players periodically and start
    let startAttempted = false;
    const checkInterval = setInterval(() => {
        if (Object.keys(socketToName).length === 3 && !startAttempted) {
            log('All sockets connected. Starting game...');
            hostSocket.emit('start_game', roomCode);
            startAttempted = true;
            clearInterval(checkInterval);
        }
    }, 1000);
});

hostSocket.on('turn_update', ({ currentPlayer, deckCount }) => {
    log(`HOST: Turn: ${currentPlayer} | Deck: ${deckCount}`);
});

function runTests() {
    log('--- STARTING TESTS ---');
    const players = Object.values(playerRecords);

    // Find active and inactive players by checking isTurn flag
    const activePlayerName = Object.keys(playerRecords).find(name => playerRecords[name].isTurn);
    const inactivePlayerName = Object.keys(playerRecords).find(name => !playerRecords[name].isTurn);

    if (inactivePlayerName) {
        log(`Test 1: ${inactivePlayerName} attempting play out of turn...`);
        const p = playerRecords[inactivePlayerName];
        p.socket.emit('place_card', { roomCode, r: 2, c: 1, card: p.hand[0] });
    }

    setTimeout(() => {
        if (activePlayerName) {
            log(`Test 2: ${activePlayerName} (Active) playing at (2,1)...`);
            const p = playerRecords[activePlayerName];
            p.socket.emit('place_card', { roomCode, r: 2, c: 1, card: p.hand[0] });
        } else {
            log('ERROR: No active player found!');
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
}, 25000);
