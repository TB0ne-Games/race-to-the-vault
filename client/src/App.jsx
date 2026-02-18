import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import RevealRole from './components/RevealRole';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [view, setView] = useState('lobby'); // lobby, host, player, hand
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState(null);
  const [board, setBoard] = useState(null);

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

    socket.on('game_started', ({ role }) => {
      setRole(role);
      setView('hand');
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

  return (
    <div className="app-container">
      {view === 'lobby' && (
        <div className="lobby">
          <h1>Vault Heist</h1>
          <div className="lobby-options">
            <button
              type="button"
              className="host-btn"
              onClick={() => {
                console.log('Host a Game clicked');
                handleCreateRoom();
              }}
            >
              Host a Game
              <span>Display on big screen</span>
            </button>
            <div className="divider">OR</div>
            <button
              type="button"
              className="join-btn"
              onClick={() => {
                console.log('Join a Game clicked');
                setView('player');
              }}
            >
              Join a Game
              <span>Play on your phone</span>
            </button>
          </div>
        </div>
      )}

      {view === 'host' && (
        <HostView
          roomCode={roomCode}
          players={players}
          onStart={handleStartGame}
          board={board}
        />
      )}

      {view === 'player' && (
        <PlayerView onJoin={handleJoinRoom} />
      )}

      {view === 'hand' && (
        <div className="player-hand">
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
            <RevealRole role={role} name={name} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
