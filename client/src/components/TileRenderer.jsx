import React from 'react';

const TileRenderer = ({ tile, isSmall = false }) => {
    if (!tile) return <div className="grid-cell-empty"></div>;

    const renderPath = () => {
        // Determine SVG path based on tile connections
        // Entrance always has all doors
        const { top, bottom, left, right, deadEnd } = tile;

        // SVG Paths for different segment types
        const paths = [];
        const center = 50;
        const stroke = 12;

        // Background tile
        paths.push(<rect key="bg" x="0" y="0" width="100" height="100" className="tile-bg" />);

        if (tile.type === 'entrance') {
            paths.push(<text key="label" x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="tile-label">ENTRANCE</text>);
        }

        if (tile.type === 'vault') {
            if (tile.revealed) {
                paths.push(
                    <g key="vault-revealed">
                        <rect x="20" y="20" width="60" height="60" rx="4" className="vault-box" />
                        <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" className="vault-icon">
                            {tile.hasMoney ? "💰" : "❌"}
                        </text>
                    </g>
                );
            } else {
                paths.push(<rect key="vault-hidden" x="20" y="20" width="60" height="60" rx="4" className="vault-hidden" />);
                paths.push(<text key="vault-label" x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="vault-label-small">VAULT</text>);
            }
            return (
                <svg viewBox="0 0 100 100" className={`tile-svg vault-tile ${tile.revealed ? 'revealed' : ''}`}>
                    {paths}
                </svg>
            );
        }

        // Path segments with entry animations
        const segmentStyle = {
            strokeDasharray: 50,
            strokeDashoffset: 50,
            animation: 'drawPath 0.8s ease-out forwards'
        };

        if (top) paths.push(<line key="t" x1="50" y1="50" x2="50" y2="0" className="path-segment" style={segmentStyle} />);
        if (bottom) paths.push(<line key="b" x1="50" y1="50" x2="50" y2="100" className="path-segment" style={segmentStyle} />);
        if (left) paths.push(<line key="l" x1="50" y1="50" x2="0" y2="50" className="path-segment" style={segmentStyle} />);
        if (right) paths.push(<line key="r" x1="50" y1="50" x2="100" y2="50" className="path-segment" style={segmentStyle} />);

        if (deadEnd) {
            paths.push(<circle key="dead" cx="50" cy="50" r="10" className="dead-end-marker" />);
            paths.push(<text key="dead-x" x="50" y="52" textAnchor="middle" dominantBaseline="middle" fill="#000" fontSize="12" fontWeight="bold">X</text>);
        }

        return (
            <svg viewBox="0 0 100 100" className={`tile-svg ${tile.type || 'path'}-tile`}>
                <defs>
                    <style>
                        {`@keyframes drawPath { to { stroke-dashoffset: 0; } }`}
                    </style>
                </defs>
                {paths}
            </svg>
        );
    };

    return (
        <div className={`tile-container ${isSmall ? 'small' : ''}`}>
            {renderPath()}
            {!isSmall && (
                <div className="coord-overlay" style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    fontSize: '8px',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.5
                }}>
                    POS_SEC_0{Math.floor(Math.random() * 100)}
                </div>
            )}
        </div>
    );
};

export default TileRenderer;
