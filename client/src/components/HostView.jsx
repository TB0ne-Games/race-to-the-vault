import React, { useState } from 'react';
import TileRenderer from './TileRenderer';
import HandView from './HandView';
import RevealRole from './RevealRole';

const HostView = ({ roomCode, players, gameStarted, onStartGame, onAddAI, onRemoveAI, grid, turnInfo, aiDifficulty, setAiDifficulty, role, hand, isMyTurn, onPlaceCard, onPlayAction, roomPlayers, onJoinAsPlayer }) => {
    const [isJoining, setIsJoining] = useState(false);
    const [hostName, setHostName] = useState('Host Agent');
    const getDifficultyLabel = (val) => {
        if (val <= 3) return "EASY";
        if (val <= 7) return "MEDIUM";
        return "HARD";
    };
    return (
        <div className={`host-container ${role ? 'playing' : ''}`}>
            <div className="host-header">
                <div className="room-badge">
                    <span className="label">Room Code</span>
                    <span className="code">{roomCode}</span>
                </div>
                {!gameStarted && (
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <button className="primary" onClick={() => onStartGame(roomCode)} disabled={players.length < 3}>
                            INITIALIZE HEIST
                            <span>{players.length}/10 Agents</span>
                        </button>
                        <div className="ai-difficulty-control">
                            <div className="difficulty-header">
                                <span className="label">AI LEVEL</span>
                                <span className="value">{aiDifficulty} ({getDifficultyLabel(aiDifficulty)})</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={aiDifficulty}
                                onChange={(e) => setAiDifficulty(parseInt(e.target.value))}
                                className="difficulty-slider"
                            />
                            <button className="ai-inject-btn" onClick={() => onAddAI(roomCode)}>
                                INJECT AI AGENT
                                <span>Add Bot</span>
                            </button>
                        </div>
                    </div>
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
                            <div key={player.id} className={`player-card ${player.isAI ? 'is-ai' : ''}`}>
                                <div className="status-indicator"></div>
                                <span className="player-name-wrapper">
                                    {player.name} {player.isAI ? '🤖' : ''}
                                </span>
                                {player.isAI && (
                                    <button
                                        className="remove-ai-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveAI(roomCode, player.id);
                                        }}
                                        title="Remove Agent"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {players.length < 3 && <p className="hint" style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.6 }}>MINIMUM 3 AGENTS REQUIRED TO START</p>}

                    {!players.find(p => p.id.startsWith('ai-') === false && p.name === hostName) && !isJoining && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button className="secondary" onClick={() => setIsJoining(true)}>JOIN AS AGENT</button>
                        </div>
                    )}

                    {isJoining && (
                        <div className="join-form" style={{ marginTop: '2rem', maxWidth: '300px', margin: '2rem auto' }}>
                            <input
                                className="form-input"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                placeholder="HOST AGENT NAME"
                            />
                            <button className="primary" onClick={() => { onJoinAsPlayer(hostName); setIsJoining(false); }}>CONFIRM ENTRY</button>
                        </div>
                    )}
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
                            <div className={`small-player-card ${turnInfo?.currentPlayer === p.name ? 'active' : ''} ${p.isAI ? 'is-ai' : ''}`} key={p.id}>
                                <div className="player-meta">
                                    <span className="player-name">{p.name} {p.isAI ? '🤖' : ''}</span>
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

            {gameStarted && role && (
                <div className="host-player-controls" style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid var(--glass-border)',
                    padding: '10px'
                }}>
                    <RevealRole role={role} onComplete={() => { }} />
                    <HandView
                        hand={hand}
                        isMyTurn={isMyTurn}
                        players={roomPlayers}
                        onPlaceCard={onPlaceCard}
                        onPlayAction={onPlayAction}
                    />
                </div>
            )}
        </div>
    );
};

export default HostView;
