import React from 'react';
import { BLOCK_COLORS, GRID_SIZE } from '../game/shapes';
import type {
  BlockColorId,
  BoardGrid,
  CellCoord,
  FloatingCallout,
  LineClearPreview,
  TrayPiece,
} from '../game/types';
import { BlockTile } from './BlockTile';

interface ClearingCellVisual {
  r: number;
  c: number;
  color: BlockColorId;
}

interface GameBoardProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  grid: BoardGrid;
  hoverAnchor: CellCoord | null;
  activePiece: TrayPiece | null;
  preview: LineClearPreview | null;
  justPlacedKeys: Set<string>;
  clearingCells: ClearingCellVisual[];
  callouts: FloatingCallout[];
  shakeBoard: boolean;
  selectedPieceId: string | null;
  onCellClick: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onBoardLeave?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  boardRef,
  grid,
  hoverAnchor,
  activePiece,
  preview,
  justPlacedKeys,
  clearingCells,
  callouts,
  shakeBoard,
  selectedPieceId,
  onCellClick,
  onCellHover,
  onBoardLeave,
}) => {
  const ghostKeys = new Set<string>();
  if (hoverAnchor && activePiece) {
    for (const cell of activePiece.cells) {
      const r = hoverAnchor.r + cell.r;
      const c = hoverAnchor.c + cell.c;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        ghostKeys.add(`${r},${c}`);
      }
    }
  }

  const telegraphRows = new Set(preview?.valid ? preview.rowsToClear : []);
  const telegraphCols = new Set(preview?.valid ? preview.colsToClear : []);

  const clearingMap = new Map<string, BlockColorId>();
  for (const item of clearingCells) {
    clearingMap.set(`${item.r},${item.c}`, item.color);
  }

  return (
    <div className="relative flex items-center justify-center w-full">
      <div
        ref={boardRef}
        data-testid="game-board"
        onMouseLeave={onBoardLeave}
        className={`relative w-full max-w-[min(94vw,440px)] aspect-square p-2.5 sm:p-3 rounded-2xl bg-[#131B31] border border-slate-700/70 shadow-[0_20px_50px_rgba(2,6,23,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] ${
          shakeBoard ? 'animate-board-shake' : ''
        }`}
      >
        {/* 8x8 Grid */}
        <div
          role="grid"
          aria-label="8 by 8 puzzle board"
          className="grid grid-cols-8 grid-rows-8 gap-1.5 w-full h-full"
        >
          {grid.map((rowArr, r) =>
            rowArr.map((cellColor, c) => {
              const key = `${r},${c}`;
              const isGhost = ghostKeys.has(key);
              const isClearing = clearingMap.has(key);
              const clearingColor = clearingMap.get(key);
              const isJustPlaced = justPlacedKeys.has(key);
              const isTelegraph =
                telegraphRows.has(r) || telegraphCols.has(c);

              const hasBlock = cellColor !== null;
              const isSelectedTargetable = selectedPieceId !== null && !hasBlock;

              return (
                <button
                  key={key}
                  type="button"
                  data-testid={`cell-${r}-${c}`}
                  data-occupied={hasBlock ? 'true' : 'false'}
                  aria-label={`Row ${r + 1} Column ${c + 1}${
                    hasBlock ? `, filled ${BLOCK_COLORS[cellColor].label}` : ', empty'
                  }`}
                  onMouseEnter={() => onCellHover?.(r, c)}
                  onFocus={() => onCellHover?.(r, c)}
                  onClick={() => onCellClick(r, c)}
                  className={`relative w-full h-full rounded-[22%] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-1 ${
                    isTelegraph && !hasBlock
                      ? 'bg-amber-400/18 ring-1 ring-amber-300/60'
                      : 'bg-[#1B2542] shadow-[inset_0_2px_4px_rgba(2,6,23,0.65)]'
                  } ${
                    isSelectedTargetable
                      ? 'hover:bg-[#253359] cursor-pointer'
                      : 'cursor-default'
                  }`}
                >
                  {/* Subtle recessed center dot on empty cells */}
                  {!hasBlock && !isGhost && !isClearing && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-600/35" />
                    </span>
                  )}

                  {/* Filled tile */}
                  {hasBlock && (
                    <BlockTile
                      color={cellColor}
                      isJustPlaced={isJustPlaced}
                      isLineTelegraph={isTelegraph}
                    />
                  )}

                  {/* Clearing tile animation */}
                  {!hasBlock && isClearing && clearingColor && (
                    <BlockTile color={clearingColor} isClearing />
                  )}

                  {/* Drag ghost preview */}
                  {isGhost && activePiece && !hasBlock && (
                    <BlockTile
                      color={activePiece.color}
                      isGhost
                      isInvalidGhost={preview ? !preview.valid : false}
                    />
                  )}

                  {/* Invalid overlap highlight when hovering over filled cell */}
                  {isGhost && hasBlock && activePiece && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-[7px] border-2 border-dashed border-rose-400/90 bg-rose-500/30 pointer-events-none"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Floating Callouts (Lines / Combos / All Clear) */}
        <div
          aria-live="polite"
          className="absolute inset-0 pointer-events-none overflow-visible z-20"
        >
          {callouts.map((callout) => {
            const topPct = ((callout.row + 0.5) / GRID_SIZE) * 100;
            const leftPct = Math.min(82, Math.max(18, ((callout.col + 0.5) / GRID_SIZE) * 100));
            return (
              <div
                key={callout.id}
                style={{
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                }}
                className="absolute animate-float-callout flex flex-col items-center text-center whitespace-nowrap"
              >
                <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-amber-300 drop-shadow-[0_3px_8px_rgba(2,6,23,0.95)]">
                  {callout.title}
                </span>
                <span className="font-display text-sm font-bold tabular-nums text-white drop-shadow-[0_2px_6px_rgba(2,6,23,0.95)]">
                  +{callout.points}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
