import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import RevealRole from './components/RevealRole';
import HandView from './components/HandView';
import GameOver from './components/GameOver';
import Notification from './components/Notification';
import './App.css';

const socket = io('http://192.168.4.176:3001');

function App() {
  const [view, setView] = useState('lobby'); // lobby, host, player, hand
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState(null);
  const [board, setBoard] = useState(null);
  const [hand, setHand] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnInfo, setTurnInfo] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [aiDifficulty, setAiDifficulty] = useState(5);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    socket.on('room_created', (code) => {
      setRoomCode(code);
      setView('host');
    });

    socket.on('joined_room', () => {
      setView('hand');
    });

    socket.on('player_joined', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('board_update', (updatedBoard) => {
      setBoard(updatedBoard);
    });

    socket.on('game_started', ({ role, hand }) => {
      setRole(role);
      setHand(hand);
      setView('hand');
    });

    socket.on('hand_update', (updatedHand) => {
      setHand(updatedHand);
    });

    socket.on('your_turn', (myTurn) => {
      setIsMyTurn(myTurn);
    });

    socket.on('turn_update', (info) => {
      setTurnInfo(info);
      if (info.players) setRoomPlayers(info.players);
    });

    socket.on('game_over', ({ winner }) => {
      setWinner(winner);
    });

    socket.on('intel_reveal', ({ r, c, hasMoney }) => {
      addNotification(`INTEL: Vault (${r},${c}) is ${hasMoney ? "LOADED 💰" : "EMPTY ❌"}`, 'intel');
    });

    socket.on('error', (message) => {
      addNotification(message, 'info');
    });

    return () => {
      socket.off('room_created');
      socket.off('joined_room');
      socket.off('player_joined');
      socket.off('board_update');
      socket.off('game_started');
      socket.off('hand_update');
      socket.off('your_turn');
      socket.off('turn_update');
      socket.off('game_over');
      socket.off('intel_reveal');
      socket.off('error');
    };
  }, []);

  const createRoom = () => {
    socket.emit('create_room');
  };

  const joinRoom = (playerName, code) => {
    setName(playerName);
    setRoomCode(code);
    socket.emit('join_room', { roomCode: code, playerName });
  };

  const handleStartGame = (code) => {
    socket.emit('start_game', code);
  };

  const handleAddAI = (code) => {
    socket.emit('add_ai', { roomCode: code, difficulty: aiDifficulty });
  };

  const handleRemoveAI = (code, aiId) => {
    socket.emit('remove_ai', { roomCode: code, aiId });
  };

  const resetGame = () => {
    setWinner(null);
    setRole(null);
    setHand([]);
    setBoard(null);
    setView('lobby');
    setRoomCode('');
    setName('');
    setPlayers([]);
    setIsMyTurn(false);
    setTurnInfo(null);
    setRoomPlayers([]);
    setNotifications([]);
  };

  return (
    <div className="app-container">
      <div className="scanline-effect"></div>
      <Notification notifications={notifications} onRemove={removeNotification} />

      {winner && (
        <GameOver winner={winner} onRestart={resetGame} />
      )}

      {view === 'lobby' && (
        <div className="glass-panel lobby">
          <h1>RACE TO THE VAULT</h1>
          <div className="lobby-options">
            <button className="primary" onClick={createRoom}>
              CREATE PRIVATE ROOM
              <span>Be the Host</span>
            </button>
            <div className="divider">OR</div>
            <button onClick={() => setView('join')}>
              JOIN EXISTING VAULT
              <span>Use Room Code</span>
            </button>
          </div>
        </div>
      )}

      {view === 'join' && (
        <div className="glass-panel">
          <h1>JOIN HEIST</h1>
          <div className="join-form">
            <div className="input-group">
              <input
                className="form-input"
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="input-group">
              <input
                className="form-input"
                placeholder="YOUR NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button className="primary" onClick={() => joinRoom(name, roomCode)}>AUTHORIZE ENTRY</button>
            <button onClick={() => setView('lobby')}>CANCEL</button>
          </div>
        </div>
      )}

      {view === 'host' && (
        <HostView
          roomCode={roomCode}
          players={players}
          onStartGame={handleStartGame}
          onAddAI={handleAddAI}
          onRemoveAI={handleRemoveAI}
          aiDifficulty={aiDifficulty}
          setAiDifficulty={setAiDifficulty}
          grid={board}
          turnInfo={turnInfo}
          gameStarted={!!board}
          role={role}
          hand={hand}
          isMyTurn={isMyTurn}
          onPlaceCard={(r, c, card) => socket.emit('place_card', { roomCode, r, c, card })}
          onPlayAction={(actionCard, targetId, r, c) => socket.emit('play_action', { roomCode, actionCard, targetId, r, c })}
          roomPlayers={roomPlayers}
          onJoinAsPlayer={(name) => {
            joinRoom(name, roomCode);
            handleStartGame(roomCode);
          }}
        />
      )}

      {view === 'player' && (
        <PlayerView onJoin={joinRoom} />
      )}

      {view === 'hand' && (
        <div className="player-hand-container">
          {!role ? (
            <div className="player-hand-placeholder">
              <h2>Welcome, Agent {name}</h2>
              <p>You are in room: <strong>{roomCode}</strong></p>
              <div className="waiting-spinner">
                <div className="spinner"></div>
                <p>Waiting for host to start...</p>
              </div>
            </div>
          ) : (
            <div className="game-active-view">
              <RevealRole role={role} onComplete={() => { }} />
              <HandView
                hand={hand}
                isMyTurn={isMyTurn}
                players={roomPlayers}
                onPlaceCard={(r, c, card) => {
                  socket.emit('place_card', { roomCode, r, c, card });
                }}
                onPlayAction={(actionCard, targetId, r, c) => {
                  socket.emit('play_action', { roomCode, actionCard, targetId, r, c });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
