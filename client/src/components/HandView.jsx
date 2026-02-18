import React, { useState } from 'react';

const HandView = ({ hand, isMyTurn, players, onPlaceCard, onPlayAction }) => {
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [targetR, setTargetR] = useState(2);
    const [targetC, setTargetC] = useState(1);
    const [targetPlayerId, setTargetPlayerId] = useState('');

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

    const renderCardPreview = (card) => {
        if (card.type === 'action') {
            return (
                <div className={`action-preview ${card.action}`}>
                    <div className="action-icon">
                        {card.action === 'map' && '🔍'}
                        {card.action === 'dynamite' && '🧨'}
                        {card.action === 'sabotage' && '✂️'}
                        {card.action === 'repair' && '🔧'}
                    </div>
                </div>
            );
        }
        return (
            <div className="path-preview">
                {card.top && <div className="preview-line top"></div>}
                {card.bottom && <div className="preview-line bottom"></div>}
                {card.left && <div className="preview-line left"></div>}
                {card.right && <div className="preview-line right"></div>}
                {card.deadEnd && <div className="preview-dead-end">×</div>}
            </div>
        );
    };

    return (
        <div className={`hand-view-container ${isMyTurn ? 'my-turn' : ''}`}>
            <div className="turn-indicator">
                {isMyTurn ? "🚨 IT'S YOUR TURN! 🚨" : "Waiting for your turn..."}
            </div>

            <div className="hand-grid">
                {hand.map((card) => (
                    <div
                        key={card.id}
                        className={`hand-card ${selectedCardId === card.id ? 'selected' : ''} ${card.type === 'action' ? 'card-action' : ''}`}
                        onClick={() => setSelectedCardId(card.id)}
                    >
                        <div className="card-label">{card.label || (card.type === 'action' ? card.action : 'Path')}</div>
                        {renderCardPreview(card)}
                    </div>
                ))}
            </div>

            {selectedCardId && isMyTurn && (
                <div className="placement-controls">
                    <h3>{selectedCard.type === 'action' ? `Use ${selectedCard.label}` : 'Place Path'}</h3>

                    <div className="targeting-options">
                        {(selectedCard.type !== 'action' || selectedCard.action === 'map' || selectedCard.action === 'dynamite') && (
                            <div className="input-row">
                                <div className="control-group">
                                    <label>Row (0-4)</label>
                                    <input
                                        type="number"
                                        min="0" max="4"
                                        value={targetR}
                                        onChange={(e) => setTargetR(e.target.value)}
                                    />
                                </div>
                                <div className="control-group">
                                    <label>Col (1-8)</label>
                                    <input
                                        type="number"
                                        min="1" max="8"
                                        value={targetC}
                                        onChange={(e) => setTargetC(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {(selectedCard.action === 'sabotage' || selectedCard.action === 'repair') && (
                            <div className="input-row">
                                <div className="control-group">
                                    <label>Target Player</label>
                                    <select
                                        value={targetPlayerId}
                                        onChange={(e) => setTargetPlayerId(e.target.value)}
                                    >
                                        <option value="">Select Player...</option>
                                        {players.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="confirm-btn" onClick={handleConfirm}>
                        CONFIRM {selectedCard.type === 'action' ? 'ACTION' : 'PLACEMENT'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HandView;
