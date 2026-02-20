import React, { useState } from 'react';
import Board from './Board';
import TileRenderer from './TileRenderer';

const HandView = ({ hand, board, isMyTurn, players, tools, onPlaceCard, onPlayAction, onDiscardCard }) => {
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [targetPlayerId, setTargetPlayerId] = useState(players[0]?.id || '');

    const selectedCard = hand.find(c => c.id === selectedCardId);

    const handleCellClick = (r, c) => {
        if (!selectedCard || !isMyTurn) return;

        if (selectedCard.type === 'action') {
            // Some actions might require a target player, but dynamite/map can use coordinates
            if (selectedCard.action === 'map' || selectedCard.action === 'dynamite') {
                onPlayAction(selectedCard, null, r, c);
                setSelectedCardId(null);
            } else if (selectedCard.action === 'sabotage' || selectedCard.action === 'repair') {
                // If it's a social action, we might still want to select a player
                // But if they clicked the board, we could potentially auto-select a player if there's one there
                // For now, let's keep it simple for placement
                onPlayAction(selectedCard, targetPlayerId, r, c);
                setSelectedCardId(null);
            }
        } else {
            onPlaceCard(r, c, selectedCard);
            setSelectedCardId(null);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'map': return '🗺️';
            case 'dynamite': return '🧨';
            case 'sabotage': return '🔧';
            case 'repair': return '🛠️';
            default: return '🃏';
        }
    };

    return (
        <div className={`hand-view-container ${isMyTurn ? 'active-turn' : ''}`}>
            <div className="hand-header">
                <div className="turn-indicator">
                    {isMyTurn ? "🚨 YOUR MOVE, AGENT" : "🛰️ WAITING FOR INTEL..."}
                </div>
                {tools && (
                    <div className="my-tools-status">
                        <span title="Flashlight" className={tools.flashlight ? 'tool-ok' : 'tool-broken'}>🔦</span>
                        <span title="Drill" className={tools.drill ? 'tool-ok' : 'tool-broken'}>⚙️</span>
                        <span title="Map" className={tools.map ? 'tool-ok' : 'tool-broken'}>🗺️</span>
                    </div>
                )}
            </div>

            {board && isMyTurn && selectedCardId && (
                <div className="board-interaction-layer">
                    <p className="interaction-hint">SELECT A LOCATION ON THE GRID TO DEPLOY</p>
                    <Board grid={board} onCellClick={handleCellClick} />
                </div>
            )}

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
                    <div className="placement-header">
                        <h3>{selectedCard.type === 'action' ? `INITIATE: ${selectedCard.label}` : 'CONSTRUCT PATH'}</h3>
                        <button className="discard-btn" onClick={() => onDiscardCard(selectedCard.id)} title="Discard this card and skip turn">
                            🗑️ DISCARD
                        </button>
                    </div>

                    <div className="targeting-options">
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
                        <p className="hint">Click on the board above to confirm location.</p>
                    </div>

                    <button onClick={() => setSelectedCardId(null)} style={{ marginTop: '10px', fontSize: '0.8rem', padding: '0.5rem' }}>
                        ABORT
                    </button>
                </div>
            )}
        </div>
    );
};

export default HandView;
