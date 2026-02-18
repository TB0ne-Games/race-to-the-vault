import React, { useState } from 'react';

const HandView = ({ hand, isMyTurn, onPlaceCard }) => {
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [row, setRow] = useState(2);
    const [col, setCol] = useState(1);

    const selectedCard = hand.find(c => c.id === selectedCardId);

    const handlePlace = () => {
        if (selectedCard && isMyTurn) {
            onPlaceCard(parseInt(row), parseInt(col), selectedCard);
            setSelectedCardId(null);
        }
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
                        className={`hand-card ${selectedCardId === card.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCardId(card.id)}
                    >
                        <div className="path-preview">
                            {card.top && <div className="preview-line top"></div>}
                            {card.bottom && <div className="preview-line bottom"></div>}
                            {card.left && <div className="preview-line left"></div>}
                            {card.right && <div className="preview-line right"></div>}
                            {card.deadEnd && <div className="preview-dead-end">×</div>}
                        </div>
                    </div>
                ))}
            </div>

            {selectedCardId && isMyTurn && (
                <div className="placement-controls">
                    <h3>Place Card</h3>
                    <div className="input-row">
                        <div className="control-group">
                            <label>Row (0-4)</label>
                            <input
                                type="number"
                                min="0" max="4"
                                value={row}
                                onChange={(e) => setRow(e.target.value)}
                            />
                        </div>
                        <div className="control-group">
                            <label>Col (1-8)</label>
                            <input
                                type="number"
                                min="1" max="8"
                                value={col}
                                onChange={(e) => setCol(e.target.value)}
                            />
                        </div>
                    </div>
                    <button className="confirm-btn" onClick={handlePlace}>
                        CONFIRM PLACEMENT
                    </button>
                </div>
            )}
        </div>
    );
};

export default HandView;
