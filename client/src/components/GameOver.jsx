import React from 'react';

const GameOver = ({ winner, onRestart }) => {
    if (!winner) return null;

    return (
        <div className="game-over-overlay">
            <div className="game-over-content glass-panel">
                <h1 className={`winner-banner ${winner.toLowerCase()}`}>
                    {winner === 'Robbers' ? '💰 HEIST SUCCESSFUL' : '🚓 HEIST BUSTED'}
                </h1>
                <p className="game-over-msg">
                    {winner === 'Robbers'
                        ? "The robbers have escaped with the loot! The vault is empty."
                        : "The cops have secured the area. The heist has been neutralized."}
                </p>
                <button className="primary" onClick={onRestart} style={{ width: '100%', padding: '1.5rem' }}>
                    RETURN TO LOBBY
                </button>
            </div>
        </div>
    );
};

export default GameOver;
