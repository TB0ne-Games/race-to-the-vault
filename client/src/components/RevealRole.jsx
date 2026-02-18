import React, { useState } from 'react';

const RevealRole = ({ role, name }) => {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="role-reveal-container">
            <div className="header">
                <h1>Role Assigned</h1>
                <p>Agent {name}</p>
            </div>

            <div
                className={`role-card-wrapper ${revealed ? 'revealed' : ''}`}
                onMouseDown={() => setRevealed(true)}
                onMouseUp={() => setRevealed(false)}
                onTouchStart={() => setRevealed(true)}
                onTouchEnd={() => setRevealed(false)}
            >
                <div className="role-card-inner">
                    <div className="role-card-front">
                        <div className="fingerprint-icon">Tap & Hold to Reveal</div>
                    </div>
                    <div className={`role-card-back ${role.toLowerCase()}`}>
                        <div className="role-badge">{role}</div>
                        <p className="role-objective">
                            {role === 'Robber'
                                ? 'Work with the crew to find the vault.'
                                : 'Infiltrate the crew and sabotage the heist.'}
                        </p>
                    </div>
                </div>
            </div>

            <p className="secrecy-note">Keep your role secret from other players!</p>
        </div>
    );
};

export default RevealRole;
