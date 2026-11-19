import { BLOCK_SHAPES, COLOR_IDS, GRID_SIZE } from './shapes';
import type {
  BlockShapeDefinition,
  BoardGrid,
  CellCoord,
  LineClearPreview,
  PlacementOutcome,
  TrayPiece,
} from './types';

let uidCounter = 1;

export function createEmptyGrid(): BoardGrid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
}

export function cloneGrid(grid: BoardGrid): BoardGrid {
  return grid.map((row) => [...row]);
}

export function countOccupiedCells(grid: BoardGrid): number {
  let count = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) count++;
    }
  }
  return count;
}

export function canPlacePiece(
  grid: BoardGrid,
  piece: Pick<TrayPiece, 'cells'>,
  anchorRow: number,
  anchorCol: number
): boolean {
  for (const cell of piece.cells) {
    const r = anchorRow + cell.r;
    const c = anchorCol + cell.c;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
      return false;
    }
    if (grid[r][c] !== null) {
      return false;
    }
  }
  return true;
}

export function getLineClearPreview(
  grid: BoardGrid,
  piece: Pick<TrayPiece, 'cells' | 'color'>,
  anchorRow: number,
  anchorCol: number
): LineClearPreview {
  if (!canPlacePiece(grid, piece, anchorRow, anchorCol)) {
    return { valid: false, rowsToClear: [], colsToClear: [] };
  }

  const simulated = cloneGrid(grid);
  for (const cell of piece.cells) {
    simulated[anchorRow + cell.r][anchorCol + cell.c] = piece.color;
  }

  const rowsToClear: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    if (simulated[r].every((val) => val !== null)) {
      rowsToClear.push(r);
    }
  }

  const colsToClear: number[] = [];
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (simulated[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) {
      colsToClear.push(c);
    }
  }

  return {
    valid: true,
    rowsToClear,
    colsToClear,
  };
}

export function placePieceAndClear(
  grid: BoardGrid,
  piece: Pick<TrayPiece, 'cells' | 'color'>,
  anchorRow: number,
  anchorCol: number,
  currentCombo: number
): PlacementOutcome {
  if (!canPlacePiece(grid, piece, anchorRow, anchorCol)) {
    return {
      valid: false,
      nextGrid: grid,
      placedCells: [],
      clearedRows: [],
      clearedCols: [],
      clearedCells: [],
      linesCleared: 0,
      placementPoints: 0,
      clearPoints: 0,
      allClearBonus: 0,
      totalPointsEarned: 0,
      nextCombo: currentCombo,
      isAllClear: false,
    };
  }

  const nextGrid = cloneGrid(grid);
  const placedCells: CellCoord[] = [];

  for (const cell of piece.cells) {
    const r = anchorRow + cell.r;
    const c = anchorCol + cell.c;
    nextGrid[r][c] = piece.color;
    placedCells.push({ r, c });
  }

  const clearedRows: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    if (nextGrid[r].every((val) => val !== null)) {
      clearedRows.push(r);
    }
  }

  const clearedCols: number[] = [];
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (nextGrid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) {
      clearedCols.push(c);
    }
  }

  const clearedSet = new Set<string>();
  const clearedCells: CellCoord[] = [];

  for (const r of clearedRows) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const key = `${r},${c}`;
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        clearedCells.push({ r, c });
      }
      nextGrid[r][c] = null;
    }
  }

  for (const c of clearedCols) {
    for (let r = 0; r < GRID_SIZE; r++) {
      const key = `${r},${c}`;
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        clearedCells.push({ r, c });
      }
      nextGrid[r][c] = null;
    }
  }

  const linesCleared = clearedRows.length + clearedCols.length;
  const placementPoints = piece.cells.length;

  let nextCombo = 0;
  let clearPoints = 0;
  let allClearBonus = 0;
  let isAllClear = false;

  if (linesCleared > 0) {
    nextCombo = currentCombo + 1;
    // Quadratic reward for simultaneous multi-line clears, scaled by consecutive combo streak
    const baseLineScore = linesCleared * linesCleared * 10;
    clearPoints = baseLineScore * nextCombo;

    if (countOccupiedCells(nextGrid) === 0) {
      isAllClear = true;
      allClearBonus = 300;
    }
  }

  const totalPointsEarned = placementPoints + clearPoints + allClearBonus;

  return {
    valid: true,
    nextGrid,
    placedCells,
    clearedRows,
    clearedCols,
    clearedCells,
    linesCleared,
    placementPoints,
    clearPoints,
    allClearBonus,
    totalPointsEarned,
    nextCombo,
    isAllClear,
  };
}

export function canPieceFitAnywhere(
  grid: BoardGrid,
  piece: Pick<TrayPiece, 'cells' | 'rows' | 'cols'>
): boolean {
  const maxRow = GRID_SIZE - piece.rows;
  const maxCol = GRID_SIZE - piece.cols;
  for (let r = 0; r <= maxRow; r++) {
    for (let c = 0; c <= maxCol; c++) {
      if (canPlacePiece(grid, piece, r, c)) {
        return true;
      }
    }
  }
  return false;
}

export function findFirstValidPlacement(
  grid: BoardGrid,
  piece: Pick<TrayPiece, 'cells' | 'rows' | 'cols'>
): CellCoord | null {
  const maxRow = GRID_SIZE - piece.rows;
  const maxCol = GRID_SIZE - piece.cols;
  for (let r = 0; r <= maxRow; r++) {
    for (let c = 0; c <= maxCol; c++) {
      if (canPlacePiece(grid, piece, r, c)) {
        return { r, c };
      }
    }
  }
  return null;
}

/**
 * Clears the central 4x4 region (rows 2..5, cols 2..5) for a rewarded-ad Revive,
 * preserving outer blocks and returning cleared coordinates for visual feedback.
 */
export function clearCenterAreaForRevive(grid: BoardGrid): {
  nextGrid: BoardGrid;
  clearedCells: CellCoord[];
} {
  const nextGrid = cloneGrid(grid);
  const clearedCells: CellCoord[] = [];
  for (let r = 2; r <= 5; r++) {
    for (let c = 2; c <= 5; c++) {
      if (nextGrid[r][c] !== null) {
        clearedCells.push({ r, c });
        nextGrid[r][c] = null;
      }
    }
  }
  return { nextGrid, clearedCells };
}

export function hasAnyValidMove(grid: BoardGrid, tray: TrayPiece[]): boolean {
  for (const piece of tray) {
    if (!piece.placed && canPieceFitAnywhere(grid, piece)) {
      return true;
    }
  }
  return false;
}

function pickWeightedShape(
  candidates: BlockShapeDefinition[],
  rng: () => number
): BlockShapeDefinition {
  const totalWeight = candidates.reduce((acc, s) => acc + s.weight, 0);
  let roll = rng() * totalWeight;
  for (const shape of candidates) {
    roll -= shape.weight;
    if (roll <= 0) return shape;
  }
  return candidates[candidates.length - 1];
}

function shapeToTrayPiece(
  shape: BlockShapeDefinition,
  color: TrayPiece['color']
): TrayPiece {
  return {
    uid: `piece-${uidCounter++}`,
    shapeId: shape.id,
    name: shape.name,
    cells: shape.cells.map((cell) => ({ ...cell })),
    rows: shape.rows,
    cols: shape.cols,
    color,
    placed: false,
  };
}

/**
 * Generates 3 random block shapes while maintaining fair gameplay:
 * avoids dealing 3 massive pieces that immediately deadlock a moderately open board,
 * and mixes distinct colors so tray pieces are easy to visually distinguish.
 */
export function generateTray(
  grid: BoardGrid,
  rng: () => number = Math.random
): TrayPiece[] {
  const availableColors = [...COLOR_IDS];
  const pickedPieces: TrayPiece[] = [];
  const usedShapeIds = new Set<string>();

  // Filter shapes that could fit if needed for fairness
  const fittingShapes = BLOCK_SHAPES.filter((s) => canPieceFitAnywhere(grid, s));

  for (let i = 0; i < 3; i++) {
    let pool = BLOCK_SHAPES.filter((s) => !usedShapeIds.has(s.id));
    if (pool.length === 0) pool = BLOCK_SHAPES;

    // On the 3rd piece, if neither of the first 2 fits on the board and at least one shape can fit,
    // guarantee the 3rd piece is placeable so deals feel fair rather than abrupt RNG losses.
    if (
      i === 2 &&
      fittingShapes.length > 0 &&
      !pickedPieces.some((p) => canPieceFitAnywhere(grid, p))
    ) {
      const uniqueFitting = fittingShapes.filter((s) => !usedShapeIds.has(s.id));
      pool = uniqueFitting.length > 0 ? uniqueFitting : fittingShapes;
    }

    const shape = pickWeightedShape(pool, rng);
    usedShapeIds.add(shape.id);

    const colorIdx = Math.floor(rng() * availableColors.length);
    const color = availableColors.splice(colorIdx, 1)[0] ?? COLOR_IDS[i % COLOR_IDS.length];
    pickedPieces.push(shapeToTrayPiece(shape, color));
  }

  return pickedPieces;
}
