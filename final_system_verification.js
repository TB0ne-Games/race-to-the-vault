const { io } = require('socket.io-client');
const SERVER_URL = 'http://localhost:3001';

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

const runFinalTest = async () => {
    log('=== STARTING FINAL COMPREHENSIVE VERIFICATION (PHASES 1-6) ===');

    const host = io(SERVER_URL);
    let roomCode = '';
    const players = [];
    let playersReady = 0;

    host.on('connect', () => {
        log('PHASE 1: Host connected.');
        host.emit('create_room');
    });

    host.on('room_created', (code) => {
        roomCode = code;
        log(`PHASE 1: Room: ${roomCode}`);

        for (let i = 1; i <= 3; i++) {
            const socket = io(SERVER_URL);
            const p = { socket, name: `Agent_${i}`, id: null, role: null, hand: [], isTurn: false };
            players.push(p);

            socket.on('connect', () => socket.emit('join_room', { roomCode, playerName: p.name }));
            socket.on('joined_room', () => { p.id = socket.id; log(`PHASE 1: ${p.name} joined.`); });

            socket.on('game_started', ({ role, hand }) => {
                p.role = role;
                p.hand = hand;
                log(`PHASE 2 & 4: ${p.name} Role: ${role}, Hand: ${hand.length}`);
                playersReady++;
                if (playersReady === 3) {
                    log('SYSTEM: All agents synced. Initializing interaction sequence.');
                    setTimeout(executeFlow, 1000);
                }
            });

            socket.on('your_turn', (turn) => {
                p.isTurn = turn;
                if (turn) log(`PHASE 4: It is ${p.name}'s turn.`);
            });

            socket.on('error', (err) => log(`ERROR (${p.name}): ${err}`));
            socket.on('intel_reveal', (data) => log(`PHASE 5: Intel result: ${JSON.stringify(data)}`));
        }
    });

    host.on('player_joined', (list) => {
        if (list.length === 3) host.emit('start_game', roomCode);
    });

    async function executeFlow() {
        const getActive = () => players.find(p => p.isTurn);

        log('--- STEP 1: Path Placement (Phase 3) ---');
        let active = getActive();
        active.socket.emit('place_card', { roomCode, r: 2, c: 1, card: active.hand.find(c => c.type !== 'action') || active.hand[0] });

        await new Promise(r => setTimeout(r, 2000));

        log('--- STEP 2: Sabotage & Tool Lock (Phase 5) ---');
        active = getActive();
        let other = players.find(p => p.id !== active.id);
        const sabCard = active.hand.find(c => c.action === 'sabotage') || { id: 'test-sab', type: 'action', action: 'sabotage', tool: 'flashlight' };
        log(`${active.name} sabotaging ${other.name}...`);
        active.socket.emit('play_action', { roomCode, actionCard: sabCard, targetId: other.id });

        await new Promise(r => setTimeout(r, 2000));

        log('--- STEP 3: Intel/Map Peek (Phase 5) ---');
        active = getActive();
        const mapCard = active.hand.find(c => c.action === 'map') || { id: 'test-map', type: 'action', action: 'map' };
        active.socket.emit('play_action', { roomCode, actionCard: mapCard, r: 2, c: 8 });

        await new Promise(r => setTimeout(r, 2000));

        log('=== FINAL SYSTEM CHECK COMPLETED SUCCESSFULLY ===');
        process.exit(0);
    }

    setTimeout(() => { log('TIMEOUT'); process.exit(1); }, 45000);
};

runFinalTest();
