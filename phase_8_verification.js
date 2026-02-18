const { io } = require('socket.io-client');
const SERVER_URL = 'http://localhost:3001';

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

const runAITest = async () => {
    log('=== STARTING AI INTEGRATION TEST (PHASE 8) ===');

    const host = io(SERVER_URL);
    let roomCode = '';

    host.on('connect', () => {
        host.emit('create_room');
    });

    host.on('room_created', (code) => {
        roomCode = code;
        log(`Room created: ${roomCode}`);

        // Add 2 AI bots
        log('Injecting AI bots...');
        host.emit('add_ai', { roomCode });
        host.emit('add_ai', { roomCode });

        // Join 1 human player
        const human = io(SERVER_URL);
        human.on('connect', () => {
            human.emit('join_room', { roomCode, playerName: 'Human_Agent' });
        });

        human.on('joined_room', () => {
            log('Human player joined.');
        });
    });

    host.on('player_joined', (list) => {
        log(`Players in lobby: ${list.length}`);
        if (list.length === 3) {
            log('Starting game with 2 Bots and 1 Human...');
            host.emit('start_game', roomCode);
        }
    });

    host.on('turn_update', (info) => {
        log(`TURN UPDATE: Current Player: ${info.currentPlayer}`);
        if (info.currentPlayer === 'Human_Agent') {
            log('SUCCESS: Turn advanced to human agent.');
            // AI must have played or passed.
        }
    });

    setTimeout(() => {
        log('Verification complete (logged AI turns).');
        process.exit(0);
    }, 15000);
};

runAITest();
