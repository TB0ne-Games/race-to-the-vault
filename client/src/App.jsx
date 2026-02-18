import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import RevealRole from './components/RevealRole';
import HandView from './components/HandView';
import './App.css';

const socket = io('http://localhost:3001');

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
  const [roomPlayers, setRoomPlayers] = useState([]); // New state

  useEffect(() => {
    socket.on('room_created', (code) => {
      setRoomCode(code);
      setView('host');
    });

    socket.on('joined_room', ({ roomCode, playerName }) => {
      setRoomCode(roomCode);
      setName(playerName);
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
      setHand(hand || []);
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
      alert(`Game Over! ${winner} Win!`);
    });

    socket.on('intel_reveal', ({ r, c, hasMoney }) => {
      alert(`INTEL: Vault at (${r},${c}) ${hasMoney ? "CONTAINS THE MONEY! 💰" : "is EMPTY. ❌"}`);
    });

    socket.on('error', (message) => {
      alert(message);
    });

    return () => {
      socket.off('room_created');
      socket.off('joined_room');
      socket.off('player_joined');
      socket.off('board_update');
      socket.off('game_started');
      socket.off('error');
    };
  }, []);

  const handleCreateRoom = () => {
    socket.emit('create_room');
  };

  const handleJoinRoom = (playerName, code) => {
    socket.emit('join_room', { roomCode: code, playerName });
  };

  const handleStartGame = (code) => {
    socket.emit('start_game', code);
  };

  if (view === 'lobby') {
    return (
      <div className="app-container">
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
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="app-container">
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
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <button className="primary" onClick={joinRoom}>AUTHORIZE ENTRY</button>
            <button onClick={() => setView('lobby')}>CANCEL</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {view === 'host' && (
        <HostView
          roomCode={roomCode}
          players={players}
          onStartGame={handleStartGame}
          grid={board}
          turnInfo={turnInfo}
          gameStarted={!!board}
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
              <RevealRole role={role} name={name} />
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
