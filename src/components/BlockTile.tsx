import React from 'react';
import { BLOCK_COLORS } from '../game/shapes';
import type { BlockColorId } from '../game/types';

interface BlockTileProps {
  color: BlockColorId;
  sizePx?: number;
  isGhost?: boolean;
  isInvalidGhost?: boolean;
  isClearing?: boolean;
  isJustPlaced?: boolean;
  isLineTelegraph?: boolean;
  dimmed?: boolean;
  className?: string;
}

export const BlockTile: React.FC<BlockTileProps> = ({
  color,
  sizePx,
  isGhost = false,
  isInvalidGhost = false,
  isClearing = false,
  isJustPlaced = false,
  isLineTelegraph = false,
  dimmed = false,
  className = '',
}) => {
  const theme = BLOCK_COLORS[color];
  const dimensionStyle: React.CSSProperties | undefined = sizePx
    ? { width: `${sizePx}px`, height: `${sizePx}px` }
    : undefined;

  if (isGhost) {
    return (
      <div
        style={{
          ...dimensionStyle,
          backgroundColor: isInvalidGhost ? 'rgba(244, 63, 94, 0.24)' : theme.ghostBg,
          borderColor: isInvalidGhost ? 'rgba(251, 113, 133, 0.85)' : theme.ghostBorder,
        }}
        className={`w-full h-full rounded-[22%] border-2 transition-transform duration-100 pointer-events-none ${
          isInvalidGhost ? 'border-dashed' : ''
        } ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        ...dimensionStyle,
        background: theme.gradient,
        boxShadow: isLineTelegraph
          ? `0 0 16px ${theme.glow}, inset 0 -3px 0 ${theme.shadow}, inset 0 2px 0 ${theme.highlight}`
          : `0 3px 6px rgba(2, 6, 23, 0.42), inset 0 -3px 0 ${theme.shadow}, inset 0 2px 0 ${theme.highlight}`,
      }}
      className={`relative w-full h-full rounded-[22%] border border-white/20 select-none overflow-hidden ${
        isClearing ? 'animate-cell-clear' : ''
      } ${isJustPlaced ? 'animate-block-pop' : ''} ${
        dimmed ? 'opacity-45 saturate-75' : ''
      } ${isLineTelegraph ? 'brightness-115 ring-2 ring-white/80' : ''} ${className}`}
    >
      {/* Inner jewel bevel facet */}
      <div
        aria-hidden="true"
        className="absolute inset-[18%] rounded-[16%] border border-white/20 bg-white/10 pointer-events-none"
      />
      {/* Top-left specular gleam */}
      <div
        aria-hidden="true"
        className="absolute top-[10%] left-[12%] w-[30%] h-[16%] rounded-full bg-white/40 pointer-events-none"
      />
    </div>
  );
};
