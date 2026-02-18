const { io } = require('socket.io-client');
const socket = io('http://localhost:3001');

console.log('Connecting to server...');

socket.on('connect', () => {
    console.log('Connected! ID:', socket.id);
    socket.emit('create_room');
});

socket.on('room_created', (code) => {
    console.log('Room created:', code);
    socket.emit('join_room', { roomCode: code, playerName: 'TestPlayer' });
});

socket.on('joined_room', (data) => {
    console.log('Joined room:', data);
    console.log('Waiting for game start... (Note: this needs 3 players to start)');
    // Since we only have 1 player, we'll just check if the join was successful
    console.log('TEST PASSED: Connection and Room joining verified.');
    process.exit(0);
});

socket.on('error', (err) => {
    console.error('Error:', err);
    process.exit(1);
});

setTimeout(() => {
    console.log('Timeout reached');
    process.exit(1);
}, 10000);
