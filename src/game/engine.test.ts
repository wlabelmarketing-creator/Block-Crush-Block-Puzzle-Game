import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canPieceFitAnywhere,
  canPlacePiece,
  clearCenterAreaForRevive,
  createEmptyGrid,
  generateTray,
  getLineClearPreview,
  hasAnyValidMove,
  placePieceAndClear,
} from './engine';
import { shouldShowInterstitial } from './ads';
import { GRID_SIZE } from './shapes';
import type { TrayPiece } from './types';

function makePiece(
  cells: Array<{ r: number; c: number }>,
  rows: number,
  cols: number,
  color: TrayPiece['color'] = 'amber'
): TrayPiece {
  return {
    uid: 'test-piece',
    shapeId: 'test',
    name: 'Test Piece',
    cells,
    rows,
    cols,
    color,
    placed: false,
  };
}

test('canPlacePiece rejects out-of-bounds and overlapping cells', () => {
  const grid = createEmptyGrid();
  const bar3 = makePiece(
    [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
    ],
    1,
    3
  );

  assert.equal(canPlacePiece(grid, bar3, 0, 5), true);
  assert.equal(canPlacePiece(grid, bar3, 0, 6), false);
  assert.equal(canPlacePiece(grid, bar3, -1, 0), false);
  assert.equal(canPlacePiece(grid, bar3, 0, -1), false);

  grid[0][6] = 'sky';
  assert.equal(canPlacePiece(grid, bar3, 0, 4), false);
  assert.equal(canPlacePiece(grid, bar3, 0, 3), true);
});

test('placePieceAndClear detects simultaneous row and column clears and updates combo streak', () => {
  const grid = createEmptyGrid();
  // Fill row 2 except col 4
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== 4) grid[2][c] = 'emerald';
  }
  // Fill col 4 except row 2
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== 2) grid[r][4] = 'coral';
  }

  const single = makePiece([{ r: 0, c: 0 }], 1, 1, 'amber');
  const preview = getLineClearPreview(grid, single, 2, 4);
  assert.equal(preview.valid, true);
  assert.deepEqual(preview.rowsToClear, [2]);
  assert.deepEqual(preview.colsToClear, [4]);

  const outcome = placePieceAndClear(grid, single, 2, 4, 1);
  assert.equal(outcome.valid, true);
  assert.equal(outcome.linesCleared, 2);
  assert.deepEqual(outcome.clearedRows, [2]);
  assert.deepEqual(outcome.clearedCols, [4]);
  // 8 in row + 8 in col - 1 intersection = 15 unique cells cleared
  assert.equal(outcome.clearedCells.length, 15);
  assert.equal(outcome.nextCombo, 2);
  // placement = 1, clearPoints = (2*2*10) * 2 = 80, allClearBonus = 300
  assert.equal(outcome.isAllClear, true);
  assert.equal(outcome.placementPoints, 1);
  assert.equal(outcome.clearPoints, 80);
  assert.equal(outcome.allClearBonus, 300);
  assert.equal(outcome.totalPointsEarned, 381);

  // Verify board is completely cleared
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      assert.equal(outcome.nextGrid[r][c], null);
    }
  }
});

test('combo streak resets to 0 when a placement clears zero lines', () => {
  const grid = createEmptyGrid();
  const sq2 = makePiece(
    [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
    ],
    2,
    2,
    'indigo'
  );

  const outcome = placePieceAndClear(grid, sq2, 0, 0, 3);
  assert.equal(outcome.valid, true);
  assert.equal(outcome.linesCleared, 0);
  assert.equal(outcome.nextCombo, 0);
  assert.equal(outcome.totalPointsEarned, 4);
});

test('hasAnyValidMove detects game over accurately when no piece fits', () => {
  const grid = createEmptyGrid();
  // Create a checkerboard where no 2x1, 1x2, or 2x2 can fit, only 1x1 can fit
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if ((r + c) % 2 === 0) {
        grid[r][c] = 'teal';
      }
    }
  }

  const bar2h = makePiece(
    [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
    ],
    1,
    2
  );
  const sq2 = makePiece(
    [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
    ],
    2,
    2
  );
  const dot1 = makePiece([{ r: 0, c: 0 }], 1, 1);

  assert.equal(canPieceFitAnywhere(grid, bar2h), false);
  assert.equal(canPieceFitAnywhere(grid, sq2), false);
  assert.equal(canPieceFitAnywhere(grid, dot1), true);

  assert.equal(hasAnyValidMove(grid, [bar2h, sq2]), false);
  assert.equal(hasAnyValidMove(grid, [bar2h, { ...dot1, placed: true }]), false);
  assert.equal(hasAnyValidMove(grid, [bar2h, dot1]), true);
});

test('generateTray produces 3 valid unplaced pieces with at least one playable on crowded board', () => {
  const grid = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = 'sky';
    }
  }
  // Leave only two adjacent cells empty
  grid[3][3] = null;
  grid[3][4] = null;

  const tray = generateTray(grid);
  assert.equal(tray.length, 3);
  assert.equal(tray.every((p) => !p.placed && p.cells.length >= 1), true);
  assert.equal(hasAnyValidMove(grid, tray), true);
});

test('clearCenterAreaForRevive clears only the central 4x4 region and preserves outer cells', () => {
  const grid = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = 'coral';
    }
  }

  const { nextGrid, clearedCells } = clearCenterAreaForRevive(grid);
  assert.equal(clearedCells.length, 16);
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const inCenter = r >= 2 && r <= 5 && c >= 2 && c <= 5;
      assert.equal(nextGrid[r][c], inCenter ? null : 'coral');
    }
  }
});

test('shouldShowInterstitial triggers every 2nd completed game', () => {
  assert.equal(shouldShowInterstitial(0), false);
  assert.equal(shouldShowInterstitial(1), false);
  assert.equal(shouldShowInterstitial(2), true);
  assert.equal(shouldShowInterstitial(3), false);
  assert.equal(shouldShowInterstitial(4), true);
});
