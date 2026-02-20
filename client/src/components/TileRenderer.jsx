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
            paths.push(<text key="label" x="50" y="85" textAnchor="middle" dominantBaseline="middle" className="tile-label">HEADQUARTERS</text>);
            paths.push(<text key="icon" x="50" y="45" textAnchor="middle" dominantBaseline="middle" className="entrance-icon">🏢</text>);
        }

        if (tile.type === 'vault') {
            if (tile.revealed) {
                paths.push(
                    <g key="vault-revealed" className={tile.hasMoney ? "money-glimmer" : ""}>
                        <rect x="25" y="25" width="50" height="50" rx="4" className="vault-box" />
                        <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" className="vault-icon">
                            {tile.hasMoney ? "💰" : "❌"}
                        </text>
                    </g>
                );
            } else {
                paths.push(<rect key="vault-hidden" x="25" y="25" width="50" height="50" rx="4" className="vault-hidden" />);
                paths.push(<text key="vault-label" x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="vault-label-small">VAULT</text>);
            }
            return (
                <svg viewBox="0 0 100 100" className={`tile-svg vault-tile ${tile.revealed ? 'revealed' : ''}`}>
                    {paths}
                </svg>
            );
        }

        // Path segments (Dual layer for Street look)
        const renderSegment = (dir, x1, y1, x2, y2) => [
            <line key={`sw-${dir}`} x1={x1} y1={y1} x2={x2} y2={y2} className="sidewalk" />,
            <line key={`p-${dir}`} x1={x1} y1={y1} x2={x2} y2={y2} className="path-segment" />,
            <line key={`m-${dir}`} x1={x1} y1={y1} x2={x2} y2={y2} className="road-marking" />
        ];

        if (top) paths.push(...renderSegment('t', 50, 50, 50, 0));
        if (bottom) paths.push(...renderSegment('b', 50, 50, 50, 100));
        if (left) paths.push(...renderSegment('l', 50, 50, 0, 50));
        if (right) paths.push(...renderSegment('r', 50, 50, 100, 50));

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
