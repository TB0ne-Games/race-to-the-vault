const { io } = require('socket.io-client');
const socket = io('http://localhost:3002'); // NEW PORT

console.log('Connecting to :3002...');

socket.on('connect', () => {
    console.log('Connected.');
    socket.emit('create_room');
});

socket.on('room_created', (code) => {
    console.log('Room:', code);
    const p1 = io('http://localhost:3002');
    p1.on('connect', () => {
        p1.emit('join_room', { roomCode: code, playerName: 'SoloPlayer' });
    });

    p1.on('joined_room', () => {
        console.log('Joined. Force starting...');
        socket.emit('start_game', code);
    });

    p1.on('game_started', (data) => {
        console.log('GAME STARTED EVENT:', JSON.stringify(data, null, 2));
        if (data && data.role && data.hand && Array.isArray(data.hand)) {
            console.log('SUCCESS: Received role and hand.');
            process.exit(0);
        } else {
            console.log('FAILED: Missing data or invalid hand format.');
            process.exit(1);
        }
    });

    p1.on('error', (err) => {
        console.log('PLAYER ERROR:', err);
        process.exit(1);
    });
});

setTimeout(() => {
    console.log('TIMEOUT');
    process.exit(1);
}, 8000);
