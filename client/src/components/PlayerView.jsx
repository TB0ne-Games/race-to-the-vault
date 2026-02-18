import React, { useState } from 'react';

const PlayerView = ({ onJoin }) => {
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && roomCode) {
            onJoin(name, roomCode.toUpperCase());
        }
    };

    return (
        <div className="player-container">
            <div className="header">
                <h1>Vault Heist</h1>
                <p>Join the Crew</p>
            </div>

            <form onSubmit={handleSubmit} className="join-form">
                <div className="input-group">
                    <label htmlFor="name">Agent Name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="roomCode">Room Code</label>
                    <input
                        id="roomCode"
                        type="text"
                        placeholder="6-character code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        maxLength={6}
                        required
                    />
                </div>

                <button type="submit" className="join-button">
                    Join Heist
                </button>
            </form>
        </div>
    );
};

export default PlayerView;
