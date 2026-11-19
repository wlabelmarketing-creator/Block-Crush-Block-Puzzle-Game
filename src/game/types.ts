export type BlockColorId =
  | 'amber'
  | 'coral'
  | 'emerald'
  | 'sky'
  | 'indigo'
  | 'rose'
  | 'teal';

export interface BlockColorTheme {
  id: BlockColorId;
  label: string;
  gradient: string;
  highlight: string;
  shadow: string;
  border: string;
  glow: string;
  ghostBg: string;
  ghostBorder: string;
}

export interface CellCoord {
  r: number;
  c: number;
}

export interface BlockShapeDefinition {
  id: string;
  name: string;
  cells: CellCoord[];
  rows: number;
  cols: number;
  weight: number;
}

export interface TrayPiece {
  uid: string;
  shapeId: string;
  name: string;
  cells: CellCoord[];
  rows: number;
  cols: number;
  color: BlockColorId;
  placed: boolean;
}

export type GridCell = BlockColorId | null;
export type BoardGrid = GridCell[][];

export type GamePhase = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface LineClearPreview {
  valid: boolean;
  rowsToClear: number[];
  colsToClear: number[];
}

export interface PlacementOutcome {
  valid: boolean;
  nextGrid: BoardGrid;
  placedCells: CellCoord[];
  clearedRows: number[];
  clearedCols: number[];
  clearedCells: CellCoord[];
  linesCleared: number;
  placementPoints: number;
  clearPoints: number;
  allClearBonus: number;
  totalPointsEarned: number;
  nextCombo: number;
  isAllClear: boolean;
}

export interface RunStatsSnapshot {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  linesCleared: number;
  maxCombo: number;
  piecesPlaced: number;
}

export interface FloatingCallout {
  id: number;
  title: string;
  points: number;
  row: number;
  col: number;
  accent: BlockColorId | 'gold';
}
