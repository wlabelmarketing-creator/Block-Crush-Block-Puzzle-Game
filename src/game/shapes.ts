import type { BlockColorId, BlockColorTheme, BlockShapeDefinition } from './types';

export const GRID_SIZE = 8;

export const BLOCK_COLORS: Record<BlockColorId, BlockColorTheme> = {
  amber: {
    id: 'amber',
    label: 'Amber',
    gradient: 'linear-gradient(155deg, #FCD34D 0%, #F59E0B 55%, #D97706 100%)',
    highlight: 'rgba(255, 251, 235, 0.58)',
    shadow: '#92400E',
    border: '#FBBF24',
    glow: 'rgba(245, 158, 11, 0.42)',
    ghostBg: 'rgba(251, 191, 36, 0.32)',
    ghostBorder: 'rgba(252, 211, 77, 0.85)',
  },
  coral: {
    id: 'coral',
    label: 'Coral',
    gradient: 'linear-gradient(155deg, #FCA5A5 0%, #F97316 52%, #EA580C 100%)',
    highlight: 'rgba(255, 247, 237, 0.55)',
    shadow: '#9A3412',
    border: '#FB923C',
    glow: 'rgba(249, 115, 22, 0.42)',
    ghostBg: 'rgba(251, 146, 60, 0.32)',
    ghostBorder: 'rgba(253, 186, 116, 0.85)',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    gradient: 'linear-gradient(155deg, #6EE7B7 0%, #10B981 55%, #059669 100%)',
    highlight: 'rgba(236, 253, 245, 0.55)',
    shadow: '#065F46',
    border: '#34D399',
    glow: 'rgba(16, 185, 129, 0.42)',
    ghostBg: 'rgba(52, 211, 153, 0.32)',
    ghostBorder: 'rgba(110, 231, 183, 0.85)',
  },
  sky: {
    id: 'sky',
    label: 'Sky',
    gradient: 'linear-gradient(155deg, #7DD3FC 0%, #0EA5E9 55%, #0284C7 100%)',
    highlight: 'rgba(240, 249, 255, 0.58)',
    shadow: '#075985',
    border: '#38BDF8',
    glow: 'rgba(14, 165, 233, 0.42)',
    ghostBg: 'rgba(56, 189, 248, 0.32)',
    ghostBorder: 'rgba(125, 211, 252, 0.85)',
  },
  indigo: {
    id: 'indigo',
    label: 'Cobalt',
    gradient: 'linear-gradient(155deg, #A5B4FC 0%, #6366F1 55%, #4F46E5 100%)',
    highlight: 'rgba(238, 242, 255, 0.55)',
    shadow: '#3730A3',
    border: '#818CF8',
    glow: 'rgba(99, 102, 241, 0.42)',
    ghostBg: 'rgba(129, 140, 248, 0.32)',
    ghostBorder: 'rgba(165, 180, 252, 0.85)',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    gradient: 'linear-gradient(155deg, #FDA4AF 0%, #F43F5E 55%, #E11D48 100%)',
    highlight: 'rgba(255, 241, 242, 0.55)',
    shadow: '#9F1239',
    border: '#FB7185',
    glow: 'rgba(244, 63, 94, 0.42)',
    ghostBg: 'rgba(251, 113, 133, 0.32)',
    ghostBorder: 'rgba(253, 164, 175, 0.85)',
  },
  teal: {
    id: 'teal',
    label: 'Teal',
    gradient: 'linear-gradient(155deg, #5EEAD4 0%, #14B8A6 55%, #0D9488 100%)',
    highlight: 'rgba(240, 253, 250, 0.55)',
    shadow: '#115E59',
    border: '#2DD4BF',
    glow: 'rgba(20, 184, 166, 0.42)',
    ghostBg: 'rgba(45, 212, 191, 0.32)',
    ghostBorder: 'rgba(94, 234, 212, 0.85)',
  },
};

export const COLOR_IDS: BlockColorId[] = [
  'amber',
  'coral',
  'emerald',
  'sky',
  'indigo',
  'rose',
  'teal',
];

function defineShape(
  id: string,
  name: string,
  pattern: string[],
  weight: number
): BlockShapeDefinition {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === '#') {
        cells.push({ r, c });
      }
    }
  }
  return {
    id,
    name,
    cells,
    rows: pattern.length,
    cols: pattern[0].length,
    weight,
  };
}

export const BLOCK_SHAPES: BlockShapeDefinition[] = [
  // Single & small lines
  defineShape('dot-1', 'Single Cube', ['#'], 4),
  defineShape('line-2h', '2-Block Bar', ['##'], 7),
  defineShape('line-2v', '2-Block Pillar', ['#', '#'], 7),
  defineShape('line-3h', '3-Block Bar', ['###'], 8),
  defineShape('line-3v', '3-Block Pillar', ['#', '#', '#'], 8),
  defineShape('line-4h', '4-Block Bar', ['####'], 6),
  defineShape('line-4v', '4-Block Pillar', ['#', '#', '#', '#'], 6),
  defineShape('line-5h', '5-Block Bar', ['#####'], 4),
  defineShape('line-5v', '5-Block Pillar', ['#', '#', '#', '#', '#'], 4),

  // Squares & rectangles
  defineShape('sq-2x2', '2×2 Square', ['##', '##'], 9),
  defineShape('sq-3x3', '3×3 Cube', ['###', '###', '###'], 4),
  defineShape('rect-2x3', '2×3 Block', ['###', '###'], 4),
  defineShape('rect-3x2', '3×2 Block', ['##', '##', '##'], 4),

  // Small 2x2 corners
  defineShape('corner-tl', 'Small Corner', ['##', '#.'], 6),
  defineShape('corner-tr', 'Small Corner', ['##', '.#'], 6),
  defineShape('corner-bl', 'Small Corner', ['#.', '##'], 6),
  defineShape('corner-br', 'Small Corner', ['.#', '##'], 6),

  // Large 3x3 L-corners
  defineShape('big-l-tl', 'Large Corner', ['###', '#..', '#..'], 4),
  defineShape('big-l-tr', 'Large Corner', ['###', '..#', '..#'], 4),
  defineShape('big-l-bl', 'Large Corner', ['#..', '#..', '###'], 4),
  defineShape('big-l-br', 'Large Corner', ['..#', '..#', '###'], 4),

  // Standard L & J tetrominoes
  defineShape('l-1', 'L-Block', ['#.', '#.', '##'], 5),
  defineShape('l-2', 'L-Block', ['.#', '.#', '##'], 5),
  defineShape('l-3', 'L-Block', ['###', '#..'], 5),
  defineShape('l-4', 'L-Block', ['###', '..#'], 5),

  // T-shapes
  defineShape('t-up', 'T-Block', ['.#.', '###'], 5),
  defineShape('t-down', 'T-Block', ['###', '.#.'], 5),
  defineShape('t-left', 'T-Block', ['.#', '##', '.#'], 4),
  defineShape('t-right', 'T-Block', ['#.', '##', '#.'], 4),

  // S & Z shapes
  defineShape('s-h', 'S-Block', ['.##', '##.'], 4),
  defineShape('z-h', 'Z-Block', ['##.', '.##'], 4),
  defineShape('s-v', 'S-Block', ['#.', '##', '.#'], 4),
  defineShape('z-v', 'Z-Block', ['.#', '##', '#.'], 4),
];
