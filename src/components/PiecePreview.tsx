import React from 'react';
import type { TrayPiece } from '../game/types';
import { BlockTile } from './BlockTile';

interface PiecePreviewProps {
  piece: TrayPiece;
  cellSize: number;
  gap?: number;
  dimmed?: boolean;
}

export const PiecePreview: React.FC<PiecePreviewProps> = ({
  piece,
  cellSize,
  gap = 3,
  dimmed = false,
}) => {
  const occupiedMap = new Set(piece.cells.map((c) => `${c.r},${c.c}`));
  const width = piece.cols * cellSize + (piece.cols - 1) * gap;
  const height = piece.rows * cellSize + (piece.rows - 1) * gap;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${piece.cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${piece.rows}, ${cellSize}px)`,
        gap: `${gap}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      className="pointer-events-none"
    >
      {Array.from({ length: piece.rows }).map((_, r) =>
        Array.from({ length: piece.cols }).map((__, c) => {
          const active = occupiedMap.has(`${r},${c}`);
          return (
            <div key={`${r}-${c}`} className="w-full h-full">
              {active ? (
                <BlockTile color={piece.color} dimmed={dimmed} />
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
};
