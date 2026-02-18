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
        <div className="glass-panel" style={{ maxWidth: '400px' }}>
            <h1 style={{ fontSize: '2.5rem' }}>AGENT AUTH</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '2rem' }}>ENTER CREDENTIALS TO JOIN THE CREW</p>

            <form onSubmit={handleSubmit} className="join-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="input-group">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="AGENT ALIAS"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: '100%', marginBottom: '0' }}
                    />
                </div>

                <div className="input-group">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="ROOM ACCESS CODE"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        required
                        style={{ width: '100%', marginBottom: '0' }}
                    />
                </div>

                <button type="submit" className="primary">
                    AUTHORIZE ENTRY
                </button>
            </form>
        </div>
    );
};

export default PlayerView;
