import React from 'react';
import TileRenderer from './TileRenderer';

const Board = ({ grid, onCellClick, highlightedCells = [] }) => {
    if (!grid) return null;

    return (
        <div className="board-grid">
            {grid.map((row, r) => (
                row.map((tile, c) => {
                    const isHighlighted = highlightedCells.some(cell => cell.r === r && cell.c === c);
                    return (
                        <div
                            key={`${r}-${c}`}
                            className={`grid-cell ${onCellClick ? 'clickable' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                            onClick={() => onCellClick && onCellClick(r, c)}
                        >
                            <TileRenderer tile={tile} />
                        </div>
                    );
                })
            ))}
        </div>
    );
};

export default Board;
