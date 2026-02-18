const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';

const log = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMsg = `[${timestamp}] ${msg}`;
    console.log(formattedMsg);
};

const runFullTest = async () => {
    log('=== STARTING INTEGRATED SYSTEM TEST (PHASES 1-4) ===');

    const hostSocket = io(SERVER_URL);
    let roomCode = '';
    const players = {};
    let playersReady = 0;

    hostSocket.on('connect', () => {
        log('SYSTEM: Host connected.');
        hostSocket.emit('create_room');
    });

    hostSocket.on('room_created', (code) => {
        roomCode = code;
        log(`PHASE 1 (Networking): Room created: ${roomCode}`);

        for (let i = 1; i <= 3; i++) {
            const name = `Agent_${i}`;
            const socket = io(SERVER_URL);

            players[name] = { socket, name, hand: [], isTurn: false, role: null };

            socket.on('connect', () => {
                socket.emit('join_room', { roomCode, playerName: name });
            });

            socket.on('joined_room', () => {
                log(`PHASE 1 (Networking): ${name} joined.`);
            });

            socket.on('game_started', ({ role, hand }) => {
                players[name].role = role;
                players[name].hand = hand;
                log(`PHASE 2 & 4: ${name} assigned: ${role}. Hand: ${hand.length} cards.`);
                playersReady++;
                if (playersReady === 3) {
                    log('SYSTEM: All players synced. Starting interaction sequence...');
                    setTimeout(executeGameFlow, 1000);
                }
            });

            socket.on('your_turn', (myTurn) => {
                players[name].isTurn = myTurn;
                if (myTurn) log(`PHASE 4 (Turn): It is now ${name}'s turn.`);
            });

            socket.on('hand_update', (hand) => {
                players[name].hand = hand;
                log(`PHASE 4 (Hand): ${name}'s hand replenished. Size: ${hand.length}`);
            });

            socket.on('error', (err) => log(`ERROR (${name}): ${err}`));
        }
    });

    hostSocket.on('player_joined', (pList) => {
        if (pList.length === 3) {
            log('SYSTEM: Lobby full. Starting game...');
            setTimeout(() => {
                hostSocket.emit('start_game', roomCode);
            }, 500);
        }
    });

    hostSocket.on('turn_update', ({ currentPlayer, deckCount }) => {
        log(`HOST STATUS: Turn: ${currentPlayer} | Deck: ${deckCount}`);
    });

    hostSocket.on('board_update', (board) => {
        let paths = 0;
        board.forEach(row => row.forEach(cell => { if (cell?.type === 'path') paths++; }));
        log(`PHASE 3 (Gameboard): Board update. Paths: ${paths}`);
    });

    hostSocket.on('game_over', ({ winner }) => {
        log(`=== PHASE 3 (Victory): Game Over. Winner: ${winner}! ===`);
        log('=== FULL SYSTEM TEST SUCCESSFUL ===');
        process.exit(0);
    });

    async function executeGameFlow() {
        log('--- BEGINNING INTERACTIVE FLOW ---');

        for (let i = 0; i < 15; i++) {
            const activePlayer = Object.values(players).find(p => p.isTurn);
            if (!activePlayer) {
                await new Promise(r => setTimeout(r, 500));
                continue;
            }

            const col = i + 1;
            if (col > 8) break;

            const card = activePlayer.hand.find(c => c.left && c.right) || activePlayer.hand[0];
            log(`ACTION: ${activePlayer.name} playing at (2, ${col})...`);
            activePlayer.socket.emit('place_card', { roomCode, r: 2, c: col, card });

            await new Promise(r => setTimeout(r, 2000));
        }
    }

    setTimeout(() => {
        log('SYSTEM: Test reached timeout.');
        process.exit(0);
    }, 45000);
};

runFullTest().catch(log);
