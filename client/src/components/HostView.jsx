import React from 'react';

const HostView = ({ roomCode, players, onStart, board }) => {
    if (!board) {
        return (
            <div className="host-container">
                <div className="header">
                    <h1>Vault Heist</h1>
                    <div className="room-info">
                        <span>Room Code:</span>
                        <span className="code">{roomCode}</span>
                    </div>
                </div>

                <div className="player-list">
                    <h2>Joined Players ({players.length})</h2>
                    <div className="players-grid">
                        {players.length === 0 ? (
                            <p className="empty-message">Waiting for players to join...</p>
                        ) : (
                            players.map((player) => (
                                <div key={player.id} className="player-card">
                                    <span className="player-name">{player.name}</span>
                                    <span className="status">Ready</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="footer">
                    <button
                        className="start-button"
                        disabled={players.length < 3}
                        onClick={() => onStart(roomCode)}
                    >
                        {players.length < 3 ? 'Need 3+ Players' : 'Start Game'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="game-host-container">
            <div className="game-header">
                <h1>Vault Heist</h1>
                <div className="game-status">In Progress</div>
            </div>

            <div className="board-grid">
                {board.map((row, rIdx) => (
                    row.map((cell, cIdx) => (
                        <div key={`${rIdx}-${cIdx}`} className={`grid-cell ${cell ? 'has-card' : ''}`}>
                            {cell && (
                                <div className={`card-tile ${cell.type}`}>
                                    {cell.type === 'entrance' && <div className="entrance-label">ENTRANCE</div>}
                                    {cell.type === 'vault' && (
                                        <div className={`vault-label ${cell.revealed ? 'revealed' : ''}`}>
                                            {cell.revealed ? (cell.hasMoney ? '💰' : '💎') : 'VAULT'}
                                        </div>
                                    )}
                                    {cell.type === 'path' && (
                                        <div className="path-lines">
                                            {cell.top && <div className="line top"></div>}
                                            {cell.bottom && <div className="line bottom"></div>}
                                            {cell.left && <div className="line left"></div>}
                                            {cell.right && <div className="line right"></div>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ))}
            </div>

            <div className="game-footer">
                <div className="active-players">
                    {players.map(p => (
                        <div key={p.id} className="small-player-card">
                            {p.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HostView;
