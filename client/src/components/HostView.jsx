import React from 'react';
import TileRenderer from './TileRenderer';

const HostView = ({ roomCode, players, gameStarted, onStartGame, grid, turnInfo }) => {
    return (
        <div className="host-container">
            <div className="host-header">
                <div className="room-badge">
                    <span className="label">Room Code</span>
                    <span className="code">{roomCode}</span>
                </div>
                {!gameStarted && (
                    <button className="primary" onClick={onStartGame} disabled={players.length < 3}>
                        INITIALIZE HEIST
                        <span>{players.length}/10 Players</span>
                    </button>
                )}
                {gameStarted && turnInfo && (
                    <div className="turn-banner">
                        ACTIVE AGENT: <span className="active-player">{turnInfo.currentPlayer}</span>
                    </div>
                )}
                <div className="room-badge">
                    <span className="label">DECK</span>
                    <span className="code">{turnInfo?.deckCount || 0}</span>
                </div>
            </div>

            {!gameStarted ? (
                <div className="glass-panel lobby-players" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>SECURE LOBBY</h2>
                    <div className="players-grid">
                        {players.map(player => (
                            <div key={player.id} className="player-card">
                                <div className="status-indicator"></div>
                                {player.name}
                            </div>
                        ))}
                    </div>
                    {players.length < 3 && <p className="hint" style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.6 }}>MINIMUM 3 AGENTS REQUIRED TO START</p>}
                </div>
            ) : (
                <div className="board-grid">
                    {grid && grid.map((row, r) => (
                        row.map((tile, c) => (
                            <div key={`${r}-${c}`} className="grid-cell">
                                <TileRenderer tile={tile} />
                            </div>
                        ))
                    ))}
                </div>
            )}

            {gameStarted && (
                <div className="game-footer">
                    <div className="active-players">
                        {players.map(p => (
                            <div className={`small-player-card ${turnInfo?.currentPlayer === p.name ? 'active' : ''}`} key={p.id}>
                                <div className="player-meta">
                                    <span className="player-name">{p.name}</span>
                                    {p.tools && (
                                        <div className="player-tools">
                                            <span title="Flashlight" className={p.tools.flashlight ? 'tool-ok' : 'tool-broken'}>🔦</span>
                                            <span title="Drill" className={p.tools.drill ? 'tool-ok' : 'tool-broken'}>⚙️</span>
                                            <span title="Map" className={p.tools.map ? 'tool-ok' : 'tool-broken'}>🗺️</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostView;
