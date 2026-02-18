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

        // Path segments
        if (top) paths.push(<line key="t" x1="50" y1="50" x2="50" y2="0" className="path-segment" />);
        if (bottom) paths.push(<line key="b" x1="50" y1="50" x2="50" y2="100" className="path-segment" />);
        if (left) paths.push(<line key="l" x1="50" y1="50" x2="0" y2="50" className="path-segment" />);
        if (right) paths.push(<line key="r" x1="50" y1="50" x2="100" y2="50" className="path-segment" />);

        if (deadEnd) {
            paths.push(<circle key="dead" cx="50" cy="50" r="8" className="dead-end-marker" />);
        }

        return (
            <svg viewBox="0 0 100 100" className={`tile-svg ${tile.type || 'path'}-tile`}>
                {paths}
            </svg>
        );
    };

    return (
        <div className={`tile-container ${isSmall ? 'small' : ''}`}>
            {renderPath()}
        </div>
    );
};

export default TileRenderer;
