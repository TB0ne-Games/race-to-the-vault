import React, { useState } from 'react';
import TileRenderer from './TileRenderer';

const HandView = ({ hand, isMyTurn, players, onPlaceCard, onPlayAction }) => {
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [targetR, setTargetR] = useState(2);
    const [targetC, setTargetC] = useState(1);
    const [targetPlayerId, setTargetPlayerId] = useState(players[0]?.id || '');

    const selectedCard = hand.find(c => c.id === selectedCardId);

    const handleConfirm = () => {
        if (!selectedCard || !isMyTurn) return;

        if (selectedCard.type === 'action') {
            onPlayAction(selectedCard, targetPlayerId, parseInt(targetR), parseInt(targetC));
        } else {
            onPlaceCard(parseInt(targetR), parseInt(targetC), selectedCard);
        }
        setSelectedCardId(null);
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'map': return '🗺️';
            case 'dynamite': return '🧨';
            case 'sabotage': return '🔧'; // Sabotage tool
            case 'repair': return '🛠️';
            default: return '🃏';
        }
    };

    return (
        <div className={`hand-view-container ${isMyTurn ? 'active-turn' : ''}`}>
            <div className="turn-indicator">
                {isMyTurn ? "🚨 YOUR MOVE, AGENT" : "🛰️ WAITING FOR INTEL..."}
            </div>

            <div className="hand-scroll">
                {hand.map((card) => (
                    <div
                        key={card.id}
                        className={`game-card ${selectedCardId === card.id ? 'selected' : ''} ${card.type === 'action' ? 'card-action' : ''}`}
                        onClick={() => setSelectedCardId(card.id)}
                    >
                        {card.type === 'action' ? (
                            <div className="action-content">
                                <div className="card-label">{card.label}</div>
                                <div className="action-icon">{getActionIcon(card.action)}</div>
                                {card.tool && <div className="tool-tag">{card.tool}</div>}
                            </div>
                        ) : (
                            <TileRenderer tile={card} isSmall />
                        )}
                    </div>
                ))}
            </div>

            {selectedCardId && isMyTurn && (
                <div className="placement-controls glass-panel">
                    <h3>{selectedCard.type === 'action' ? `INITIATE: ${selectedCard.label}` : 'CONSTRUCT PATH'}</h3>

                    <div className="targeting-options">
                        {(selectedCard.type !== 'action' || selectedCard.action === 'map' || selectedCard.action === 'dynamite') && (
                            <div className="input-row">
                                <div className="control-group">
                                    <label>LATITUDE (ROW)</label>
                                    <input type="number" value={targetR} min="0" max="4" onChange={(e) => setTargetR(e.target.value)} />
                                </div>
                                <div className="control-group">
                                    <label>LONGITUDE (COL)</label>
                                    <input type="number" value={targetC} min="0" max="8" onChange={(e) => setTargetC(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {(selectedCard.action === 'sabotage' || selectedCard.action === 'repair') && (
                            <div className="control-group">
                                <label>TARGET AGENT</label>
                                <select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)}>
                                    <option value="">-- SELECT TARGET --</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <button className="primary" onClick={handleConfirm}>
                        CONFIRM {selectedCard.type === 'action' ? 'EXECUTION' : 'DEPLOYMENT'}
                    </button>
                    <button onClick={() => setSelectedCardId(null)} style={{ marginTop: '10px', fontSize: '0.8rem', padding: '0.5rem' }}>
                        ABORT
                    </button>
                </div>
            )}
        </div>
    );
};

export default HandView;
