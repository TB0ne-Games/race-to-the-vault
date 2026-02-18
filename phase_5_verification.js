const { io } = require('socket.io-client');
const SERVER_URL = 'http://localhost:3001';

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

const runTest = async () => {
    log('=== FINAL PHASE 5 INTEGRATION TEST ===');
    const host = io(SERVER_URL);
    let roomCode = '';
    const players = [];
    let readyCount = 0;

    const onReady = () => {
        readyCount++;
        if (readyCount === 2) {
            log('All players ready. Starting sequence...');
            setTimeout(executeSequence, 1000);
        }
    };

    host.on('connect', () => host.emit('create_room'));
    host.on('room_created', (code) => {
        roomCode = code;
        for (let i = 1; i <= 2; i++) {
            const socket = io(SERVER_URL);
            const p = { socket, name: `Agent_${i}`, hand: [], id: null, isTurn: false };
            players.push(p);

            socket.on('connect', () => socket.emit('join_room', { roomCode, playerName: p.name }));
            socket.on('joined_room', () => { p.id = socket.id; });
            socket.on('game_started', ({ role, hand }) => {
                p.hand = hand;
                log(`${p.name} ready.`);
                onReady();
            });
            socket.on('your_turn', (turn) => p.isTurn = turn);
            socket.on('error', (err) => log(`ERROR (${p.name}): ${err}`));
            socket.on('intel_reveal', (data) => log(`INTEL REVEAL: ${JSON.stringify(data)}`));
        }
    });

    host.on('player_joined', (list) => {
        if (list.length === 2) host.emit('start_game', roomCode);
    });

    async function executeSequence() {
        const p1 = players[0];
        const p2 = players[1];

        // Ensure we wait for turn assignment
        await new Promise(r => setTimeout(r, 1000));

        let active = players.find(p => p.isTurn);
        let other = players.find(p => !p.isTurn);

        log(`--- STEP 1: Sabotage ---`);
        log(`${active.name} sabotaging ${other.name}...`);
        const sabCard = active.hand.find(c => c.action === 'sabotage') || active.hand[0];
        active.socket.emit('play_action', { roomCode, actionCard: sabCard, targetId: other.id });

        // Wait for turn to pass to 'other'
        await new Promise(r => setTimeout(r, 2000));

        log(`--- STEP 2: Placement Attempt (Should Fail) ---`);
        log(`${other.name} turn? ${other.isTurn}`);
        const pathCard = other.hand.find(c => !c.type || c.type === 'path') || other.hand[0];
        other.socket.emit('place_card', { roomCode, r: 2, c: 1, card: pathCard });

        await new Promise(r => setTimeout(r, 2000));

        log(`--- STEP 3: Intel card ---`);
        const intelCard = other.hand.find(c => c.action === 'map') || other.hand[0];
        other.socket.emit('play_action', { roomCode, actionCard: intelCard, r: 0, c: 8 });

        await new Promise(r => setTimeout(r, 2000));
        log('=== TEST COMPLETE ===');
        process.exit(0);
    }

    setTimeout(() => { log('TIMEOUT'); process.exit(1); }, 40000);
};

runTest();
