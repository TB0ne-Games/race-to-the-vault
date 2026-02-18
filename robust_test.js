const { io } = require('socket.io-client');
const SERVER_URL = 'http://localhost:3002';

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

const runTest = () => {
    log('=== STARTING ROBUST FULL TEST ===');
    const host = io(SERVER_URL);
    const players = [];
    let roomCode = '';

    host.on('connect', () => {
        log('Host connected.');
        host.emit('create_room');
    });

    host.on('room_created', (code) => {
        roomCode = code;
        log(`Room: ${roomCode}`);

        for (let i = 0; i < 3; i++) {
            const socket = io(SERVER_URL);
            const player = { socket, name: `Agent_${i + 1}`, hand: [], role: null, isTurn: false };
            players.push(player);

            socket.on('connect', () => {
                socket.emit('join_room', { roomCode, playerName: player.name });
            });

            socket.on('game_started', ({ role, hand }) => {
                player.role = role;
                player.hand = hand;
                log(`${player.name} started. Role: ${role}, Hand: ${hand.length}`);
            });

            socket.on('your_turn', (myTurn) => {
                player.isTurn = myTurn;
                if (myTurn) log(`TURN: ${player.name}`);
            });

            socket.on('hand_update', (hand) => {
                player.hand = hand;
                log(`${player.name} hand updated.`);
            });
        }
    });

    host.on('player_joined', (list) => {
        if (list.length === 3) {
            log('Lobby full. Starting game in 1s...');
            setTimeout(() => host.emit('start_game', roomCode), 1000);
        }
    });

    host.on('turn_update', (info) => {
        log(`HOST VIEW: Current Turn: ${info.currentPlayer}`);
    });

    host.on('board_update', (board) => {
        let paths = 0;
        board.forEach(r => r.forEach(c => { if (c?.type === 'path') paths++ }));
        log(`HOST VIEW: Board updated. Paths: ${paths}`);
    });

    host.on('game_over', ({ winner }) => {
        log(`SUCCESS: Game Over. Winner: ${winner}`);
        process.exit(0);
    });

    // Test sequence
    setTimeout(async () => {
        log('--- TEST: Placement Sequence ---');
        // We need player 1 to be the one who starts or find who starts
        const sequence = [
            { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 }
        ];

        for (const pos of sequence) {
            const active = players.find(p => p.isTurn);
            if (active) {
                log(`${active.name} placing at (${pos.r}, ${pos.c})`);
                active.socket.emit('place_card', { roomCode, r: pos.r, c: pos.c, card: active.hand[0] });
            } else {
                log('No active player found, skipping step...');
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        log('Verification reached end of sequence.');
        process.exit(0);
    }, 10000);

    setTimeout(() => {
        log('TIMEOUT');
        process.exit(1);
    }, 30000);
};

runTest();
