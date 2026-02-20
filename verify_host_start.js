const { io } = require('socket.io-client');
const SERVER_URL = 'http://localhost:3001';

const testHostStart = async () => {
    console.log('=== VERIFYING HOST IMMEDIATE START ===');
    const hostSocket = io(SERVER_URL);
    let roomCode = '';

    hostSocket.on('connect', () => {
        console.log('Host connected.');
        hostSocket.emit('create_room');
    });

    hostSocket.on('room_created', (code) => {
        roomCode = code;
        console.log(`Room created: ${roomCode}`);

        // Simulating the user joining as an agent
        // In the real app, this happens via the UI which calls joinRoom and handleStartGame
        // We'll simulate this by emitting both events rapidly
        console.log('Simulating host joining as agent and starting game...');
        hostSocket.emit('join_room', { roomCode, playerName: 'Host Agent' });
        hostSocket.emit('start_game', roomCode);
    });

    hostSocket.on('game_started', ({ role, hand }) => {
        console.log(`SUCCESS: Game started immediately! Role: ${role}`);
        process.exit(0);
    });

    hostSocket.on('error', (err) => {
        console.error(`ERROR: ${err}`);
        process.exit(1);
    });

    setTimeout(() => {
        console.error('TIMEOUT: Game did not start in time.');
        process.exit(1);
    }, 5000);
};

testHostStart().catch(console.error);
