import React, { useState } from 'react';

const RevealRole = ({ role, onComplete }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div className="glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h1>ASSIGNMENT</h1>
            <p style={{ color: 'var(--text-dim)' }}>TAP TO UNCOVER YOUR SECRET OBJECTIVE</p>

            <div
                className={`role-card-wrapper ${isRevealed ? 'revealed' : ''}`}
                onClick={() => setIsRevealed(true)}
                style={{ position: 'relative', width: '100%', aspectRatio: '0.7', margin: '2rem 0' }}
            >
                <div className="role-card-inner">
                    <div className="role-card-front glass-panel">
                        <div className="fingerprint-vault" style={{ fontSize: '4rem', opacity: 0.3 }}>🔒</div>
                        <p style={{ marginTop: '1rem', fontWeight: 700 }}>CLASSIFIED</p>
                    </div>
                    <div className={`role-card-back glass-panel ${role.toLowerCase()}`}>
                        <div className="role-badge-premium">
                            {role === 'Robber' ? '💰' : '🚓'}
                        </div>
                        <h2 className={role === 'Robber' ? 'robber-theme' : 'cop-theme'}>{role.toUpperCase()}</h2>
                        <p className="role-objective" style={{ fontSize: '0.9rem', padding: '0 1rem', marginTop: '1rem' }}>
                            {role === 'Robber'
                                ? "Connect the entrance to the gold vault before the deck runs dry."
                                : "Block the robbers and exhaust the deck to secure the vault."}
                        </p>
                    </div>
                </div>
            </div>

            {isRevealed && (
                <button className="primary" onClick={onComplete} style={{ width: '100%' }}>
                    ENTER THE FIELD
                </button>
            )}
        </div>
    );
};

export default RevealRole;
