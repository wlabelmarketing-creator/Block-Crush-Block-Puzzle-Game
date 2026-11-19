import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Flame,
  HelpCircle,
  Pause,
  PlayCircle,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AdBanner } from './components/AdBanner';
import {
  InterstitialAdModal,
  RewardedAdModal,
  type RewardedAdPurpose,
} from './components/AdOverlayModal';
import { GameBoard } from './components/GameBoard';
import { GameOverModal, InstructionsModal, PauseModal } from './components/Modals';
import { PiecePreview } from './components/PiecePreview';
import { TitleScreen } from './components/TitleScreen';
import { getNativeAndroidAdBridge, shouldShowInterstitial } from './game/ads';
import {
  canPieceFitAnywhere,
  clearCenterAreaForRevive,
  createEmptyGrid,
  generateTray,
  getLineClearPreview,
  hasAnyValidMove,
  placePieceAndClear,
} from './game/engine';
import { GRID_SIZE } from './game/shapes';
import { hapticsEngine } from './game/haptics';
import { soundEngine } from './game/sound';
import { useAndroidPWA, useOnlineStatus } from './hooks/useAndroidPWA';
import type {
  BlockColorId,
  BoardGrid,
  CellCoord,
  FloatingCallout,
  GamePhase,
  RunStatsSnapshot,
  TrayPiece,
} from './game/types';

const BEST_SCORE_STORAGE_KEY = 'block_crush_best_score_v1';

interface ClearingCellVisual {
  r: number;
  c: number;
  color: BlockColorId;
}

interface DragState {
  piece: TrayPiece;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  moved: boolean;
  boardCellPx: number;
}

function loadBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number): void {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score));
  } catch {
    // ignore storage errors
  }
}

function getInitialPhase(): GamePhase {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return 'PLAYING';
    }
  }
  return 'TITLE_MENU';
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>(() => getInitialPhase());
  const [grid, setGrid] = useState<BoardGrid>(() => createEmptyGrid());
  const [tray, setTray] = useState<TrayPiece[]>(() => generateTray(createEmptyGrid()));
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [piecesPlaced, setPiecesPlaced] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() =>
    hapticsEngine.isEnabled()
  );
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [dealGeneration, setDealGeneration] = useState<number>(0);
  const [revivedThisRun, setRevivedThisRun] = useState<boolean>(false);
  const [gamesCompleted, setGamesCompleted] = useState<number>(0);
  const [rewardedAdPurpose, setRewardedAdPurpose] =
    useState<RewardedAdPurpose | null>(null);
  const [showInterstitialAd, setShowInterstitialAd] = useState<boolean>(false);

  const { isInstallable, isInstalled, install } = useAndroidPWA();
  const isOnline = useOnlineStatus();

  // Interaction & visual feedback state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<CellCoord | null>(null);
  const [justPlacedKeys, setJustPlacedKeys] = useState<Set<string>>(new Set());
  const [clearingCells, setClearingCells] = useState<ClearingCellVisual[]>([]);
  const [callouts, setCallouts] = useState<FloatingCallout[]>([]);
  const [shakeBoard, setShakeBoard] = useState<boolean>(false);
  const [gameOverSnapshot, setGameOverSnapshot] = useState<RunStatsSnapshot | null>(
    null
  );

  const boardRef = useRef<HTMLDivElement | null>(null);
  const calloutIdRef = useRef<number>(1);
  const gameOverTimerRef = useRef<number | null>(null);
  const clearVisualTimerRef = useRef<number | null>(null);
  const popTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  // Sync document.body.dataset.state for state machine clarity & verification
  useEffect(() => {
    const stateValue =
      phase === 'TITLE_MENU'
        ? 'title'
        : phase === 'PLAYING'
        ? 'playing'
        : phase === 'PAUSED'
        ? 'paused'
        : 'gameover';
    document.body.dataset.state = stateValue;
  }, [phase]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (gameOverTimerRef.current) window.clearTimeout(gameOverTimerRef.current);
      if (clearVisualTimerRef.current) window.clearTimeout(clearVisualTimerRef.current);
      if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
      if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const resetAndStartGame = useCallback(() => {
    if (gameOverTimerRef.current) window.clearTimeout(gameOverTimerRef.current);
    if (clearVisualTimerRef.current) window.clearTimeout(clearVisualTimerRef.current);
    if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
    if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);

    const freshGrid = createEmptyGrid();
    const freshTray = generateTray(freshGrid);

    setGrid(freshGrid);
    setTray(freshTray);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLinesCleared(0);
    setPiecesPlaced(0);
    setDragState(null);
    setSelectedPieceId(null);
    setHoverAnchor(null);
    setJustPlacedKeys(new Set());
    setClearingCells([]);
    setCallouts([]);
    setShakeBoard(false);
    setGameOverSnapshot(null);
    setShowInstructions(false);
    setRevivedThisRun(false);
    setRewardedAdPurpose(null);
    setShowInterstitialAd(false);
    setDealGeneration((g) => g + 1);
    setPhase('PLAYING');

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundEngine.playDeal();
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleToggleHaptics = useCallback(() => {
    const nextHaptics = hapticsEngine.toggle();
    setHapticsEnabled(nextHaptics);
  }, []);

  const applyRewardedOutcome = useCallback(
    (purpose: RewardedAdPurpose) => {
      if (purpose === 'revive') {
        const { nextGrid, clearedCells } = clearCenterAreaForRevive(grid);
        const freshTray = generateTray(nextGrid);
        setGrid(nextGrid);
        setTray(freshTray);
        setRevivedThisRun(true);
        setGameOverSnapshot(null);
        setDealGeneration((g) => g + 1);
        setPhase('PLAYING');
        soundEngine.playClear(2, Math.max(1, combo));
        hapticsEngine.clear(2);

        if (clearedCells.length > 0) {
          setClearingCells(
            clearedCells.map((c) => ({ r: c.r, c: c.c, color: 'amber' }))
          );
          if (clearVisualTimerRef.current) {
            window.clearTimeout(clearVisualTimerRef.current);
          }
          clearVisualTimerRef.current = window.setTimeout(() => {
            setClearingCells([]);
          }, 270);
        }
      } else if (purpose === 'swap-tray') {
        const freshTray = generateTray(grid);
        setTray(freshTray);
        setSelectedPieceId(null);
        setHoverAnchor(null);
        setDealGeneration((g) => g + 1);
        soundEngine.playDeal();
        hapticsEngine.place();
      }
    },
    [combo, grid]
  );

  const triggerRewardedAd = useCallback(
    (purpose: RewardedAdPurpose) => {
      const bridge = getNativeAndroidAdBridge();
      if (bridge?.showRewarded && bridge.showRewarded(purpose)) {
        applyRewardedOutcome(purpose);
        return;
      }
      setDragState(null);
      setHoverAnchor(null);
      setRewardedAdPurpose(purpose);
    },
    [applyRewardedOutcome]
  );

  const handlePlayAgainAfterGameOver = useCallback(() => {
    const nextCompleted = gamesCompleted + 1;
    setGamesCompleted(nextCompleted);

    if (shouldShowInterstitial(nextCompleted)) {
      const bridge = getNativeAndroidAdBridge();
      if (bridge?.showInterstitial && bridge.showInterstitial()) {
        resetAndStartGame();
        return;
      }
      setShowInterstitialAd(true);
      return;
    }

    resetAndStartGame();
  }, [gamesCompleted, resetAndStartGame]);

  // Measure exact pixel width of a single 8x8 grid cell from the DOM
  const measureBoardCellPx = useCallback((): number => {
    const el = boardRef.current;
    if (!el) return 44;
    const firstCell = el.querySelector('[data-testid="cell-0-0"]');
    if (firstCell) {
      const cellRect = firstCell.getBoundingClientRect();
      if (cellRect.width > 0) return cellRect.width;
    }
    const rect = el.getBoundingClientRect();
    const innerWidth = rect.width - 24;
    const cellPx = (innerWidth - (GRID_SIZE - 1) * 6) / GRID_SIZE;
    return Math.max(28, cellPx);
  }, []);

  // Project pointer screen coordinates onto the 8x8 grid anchor (top-left of piece)
  const projectPointerToAnchor = useCallback(
    (
      clientX: number,
      clientY: number,
      piece: TrayPiece,
      pointerType: string,
      boardCellPx: number
    ): CellCoord | null => {
      const el = boardRef.current;
      if (!el) return null;
      const firstCell = el.querySelector('[data-testid="cell-0-0"]');
      const rect = el.getBoundingClientRect();
      const gap = 6;
      const gridLeft = firstCell
        ? firstCell.getBoundingClientRect().left
        : rect.left + (window.innerWidth >= 640 ? 13 : 11);
      const gridTop = firstCell
        ? firstCell.getBoundingClientRect().top
        : rect.top + (window.innerWidth >= 640 ? 13 : 11);

      // Lift touch drags upward so the player's thumb doesn't cover the target cells
      const touchLiftY = pointerType === 'touch' ? 76 : 0;
      const visualCenterX = clientX;
      const visualCenterY = clientY - touchLiftY;

      const pieceWidthPx = piece.cols * boardCellPx + (piece.cols - 1) * gap;
      const pieceHeightPx = piece.rows * boardCellPx + (piece.rows - 1) * gap;

      // Top-left corner of the dragged piece's bounding box
      const pieceLeftX = visualCenterX - pieceWidthPx / 2;
      const pieceTopY = visualCenterY - pieceHeightPx / 2;

      const stride = boardCellPx + gap;

      const anchorCol = Math.round((pieceLeftX - gridLeft) / stride);
      const anchorRow = Math.round((pieceTopY - gridTop) / stride);

      // Allow snapping when piece is roughly inside or touching the board bounds
      if (
        anchorRow < -1 ||
        anchorRow > GRID_SIZE ||
        anchorCol < -1 ||
        anchorCol > GRID_SIZE
      ) {
        return null;
      }

      return { r: anchorRow, c: anchorCol };
    },
    []
  );

  // Execute placing a piece at (anchorRow, anchorCol)
  const commitPlacement = useCallback(
    (piece: TrayPiece, anchorRow: number, anchorCol: number): boolean => {
      if (phase !== 'PLAYING' || piece.placed) return false;

      // Capture pre-clear colors so clearing cells animate with their actual block colors
      const preClearColors = new Map<string, BlockColorId>();
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const val = grid[r][c];
          if (val !== null) preClearColors.set(`${r},${c}`, val);
        }
      }
      for (const cell of piece.cells) {
        preClearColors.set(`${anchorRow + cell.r},${anchorCol + cell.c}`, piece.color);
      }

      const outcome = placePieceAndClear(grid, piece, anchorRow, anchorCol, combo);
      if (!outcome.valid) {
        soundEngine.playInvalid();
        hapticsEngine.invalid();
        return false;
      }

      const nextScore = score + outcome.totalPointsEarned;
      const nextBest = Math.max(bestScore, nextScore);
      const isNewBest = nextScore > bestScore && nextScore > 0;
      const nextLines = linesCleared + outcome.linesCleared;
      const nextMaxCombo = Math.max(maxCombo, outcome.nextCombo);
      const nextPiecesPlaced = piecesPlaced + 1;

      setGrid(outcome.nextGrid);
      setScore(nextScore);
      setCombo(outcome.nextCombo);
      setMaxCombo(nextMaxCombo);
      setLinesCleared(nextLines);
      setPiecesPlaced(nextPiecesPlaced);
      setSelectedPieceId(null);
      setHoverAnchor(null);

      if (nextBest > bestScore) {
        setBestScore(nextBest);
        saveBestScore(nextBest);
      }

      // Placement pop animation on surviving placed cells
      const clearedSet = new Set(outcome.clearedCells.map((c) => `${c.r},${c.c}`));
      const placedSet = new Set(
        outcome.placedCells
          .map((c) => `${c.r},${c.c}`)
          .filter((key) => !clearedSet.has(key))
      );
      setJustPlacedKeys(placedSet);
      if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
      popTimerRef.current = window.setTimeout(() => {
        setJustPlacedKeys(new Set());
      }, 210);

      // Sound, Haptics & Clear FX
      soundEngine.playPlace(piece.cells.length);
      hapticsEngine.place();

      if (outcome.linesCleared > 0) {
        soundEngine.playClear(outcome.linesCleared, outcome.nextCombo);
        hapticsEngine.clear(outcome.linesCleared);

        const visuals: ClearingCellVisual[] = outcome.clearedCells.map((cell) => ({
          r: cell.r,
          c: cell.c,
          color: preClearColors.get(`${cell.r},${cell.c}`) ?? piece.color,
        }));
        setClearingCells(visuals);
        if (clearVisualTimerRef.current) {
          window.clearTimeout(clearVisualTimerRef.current);
        }
        clearVisualTimerRef.current = window.setTimeout(() => {
          setClearingCells([]);
        }, 270);

        if (outcome.linesCleared >= 2 || outcome.nextCombo >= 2 || outcome.isAllClear) {
          setShakeBoard(true);
          if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
          shakeTimerRef.current = window.setTimeout(() => setShakeBoard(false), 230);
        }

        // Floating score/combo callout
        const labelParts: string[] = [];
        if (outcome.isAllClear) {
          labelParts.push('ALL CLEAR!');
        } else if (outcome.linesCleared === 2) {
          labelParts.push('DOUBLE!');
        } else if (outcome.linesCleared === 3) {
          labelParts.push('TRIPLE!');
        } else if (outcome.linesCleared >= 4) {
          labelParts.push('MEGA CLEAR!');
        } else if (outcome.nextCombo >= 2) {
          labelParts.push(`COMBO ×${outcome.nextCombo}`);
        } else {
          labelParts.push('NICE!');
        }

        if (outcome.nextCombo >= 2 && outcome.linesCleared >= 2) {
          labelParts[0] = `${labelParts[0]} ×${outcome.nextCombo}`;
        }

        const calloutId = calloutIdRef.current++;
        const centerCell = outcome.placedCells[0] ?? { r: anchorRow, c: anchorCol };
        setCallouts((prev) => [
          ...prev.slice(-2),
          {
            id: calloutId,
            title: labelParts[0],
            points: outcome.totalPointsEarned,
            row: centerCell.r,
            col: centerCell.c,
            accent: outcome.isAllClear ? 'gold' : piece.color,
          },
        ]);
        window.setTimeout(() => {
          setCallouts((prev) => prev.filter((item) => item.id !== calloutId));
        }, 1050);
      }

      // Update tray: mark piece placed; if all 3 placed, deal 3 fresh pieces
      let updatedTray = tray.map((p) =>
        p.uid === piece.uid ? { ...p, placed: true } : p
      );
      if (updatedTray.every((p) => p.placed)) {
        updatedTray = generateTray(outcome.nextGrid);
        setDealGeneration((g) => g + 1);
        window.setTimeout(() => soundEngine.playDeal(), 90);
      }
      setTray(updatedTray);

      // Check Game Over: can ANY remaining tray piece fit anywhere?
      if (!hasAnyValidMove(outcome.nextGrid, updatedTray)) {
        const snapshot: RunStatsSnapshot = {
          score: nextScore,
          bestScore: nextBest,
          isNewBest,
          linesCleared: nextLines,
          maxCombo: nextMaxCombo,
          piecesPlaced: nextPiecesPlaced,
        };
        if (gameOverTimerRef.current) window.clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = window.setTimeout(() => {
          soundEngine.playGameOver();
          hapticsEngine.gameOver();
          setGameOverSnapshot(snapshot);
          setPhase('GAME_OVER');
        }, 460);
      }

      return true;
    },
    [bestScore, combo, grid, linesCleared, maxCombo, phase, piecesPlaced, score, tray]
  );

  // Global keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showInstructions) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowInstructions(false);
        }
        return;
      }

      if (phase === 'TITLE_MENU') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          resetAndStartGame();
        }
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (phase === 'PLAYING') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setDragState(null);
          setHoverAnchor(null);
          setPhase('PAUSED');
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetAndStartGame();
        }
      } else if (phase === 'PAUSED') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setPhase('PLAYING');
        }
      } else if (phase === 'GAME_OVER') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          resetAndStartGame();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleMute, phase, resetAndStartGame, showInstructions]);

  // Pointer drag handlers on tray slots
  const handleTrayPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    piece: TrayPiece
  ) => {
    if (phase !== 'PLAYING' || piece.placed || e.button > 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if capture unsupported
    }
    const boardCellPx = measureBoardCellPx();
    soundEngine.playPickup();
    hapticsEngine.pickup();
    setDragState({
      piece,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      clientX: e.clientX,
      clientY: e.clientY,
      moved: false,
      boardCellPx,
    });
  };

  const handleTrayPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
    const moved = dragState.moved || dist > 7;
    const nextAnchor = moved
      ? projectPointerToAnchor(
          e.clientX,
          e.clientY,
          dragState.piece,
          dragState.pointerType,
          dragState.boardCellPx
        )
      : null;

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            clientX: e.clientX,
            clientY: e.clientY,
            moved,
          }
        : null
    );
    setHoverAnchor(nextAnchor);
  };

  const handleTrayPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const { piece, moved, pointerType, boardCellPx } = dragState;
    setDragState(null);

    if (!moved) {
      // Tap/Click fallback: toggle piece selection for click-to-place
      setSelectedPieceId((prev) => (prev === piece.uid ? null : piece.uid));
      setHoverAnchor(null);
      return;
    }

    const dropAnchor = projectPointerToAnchor(
      e.clientX,
      e.clientY,
      piece,
      pointerType,
      boardCellPx
    );
    setHoverAnchor(null);
    if (dropAnchor) {
      commitPlacement(piece, dropAnchor.r, dropAnchor.c);
    } else {
      soundEngine.playInvalid();
      hapticsEngine.invalid();
    }
  };

  const handleTrayPointerCancel = () => {
    setDragState(null);
    setHoverAnchor(null);
  };

  // Compute centered anchor clamped to board bounds for click-to-place & hover preview
  const getClickAnchorForPiece = useCallback(
    (piece: TrayPiece, row: number, col: number): CellCoord => {
      const rawR = row - Math.floor((piece.rows - 1) / 2);
      const rawC = col - Math.floor((piece.cols - 1) / 2);
      return {
        r: Math.max(0, Math.min(GRID_SIZE - piece.rows, rawR)),
        c: Math.max(0, Math.min(GRID_SIZE - piece.cols, rawC)),
      };
    },
    []
  );

  // Click-to-place when a tray piece is selected
  const handleBoardCellClick = (row: number, col: number) => {
    if (phase !== 'PLAYING' || !selectedPieceId) return;
    const selectedPiece = tray.find((p) => p.uid === selectedPieceId && !p.placed);
    if (!selectedPiece) return;
    const anchor = getClickAnchorForPiece(selectedPiece, row, col);
    commitPlacement(selectedPiece, anchor.r, anchor.c);
  };

  const handleBoardCellHover = (row: number, col: number) => {
    if (phase !== 'PLAYING' || !selectedPieceId || dragState) return;
    const selectedPiece = tray.find((p) => p.uid === selectedPieceId && !p.placed);
    if (!selectedPiece) return;
    setHoverAnchor(getClickAnchorForPiece(selectedPiece, row, col));
  };

  const handleBoardLeave = () => {
    if (!dragState) {
      setHoverAnchor(null);
    }
  };

  const activePreviewPiece = useMemo(() => {
    if (dragState && dragState.moved) return dragState.piece;
    if (selectedPieceId) {
      return tray.find((p) => p.uid === selectedPieceId && !p.placed) ?? null;
    }
    return null;
  }, [dragState, selectedPieceId, tray]);

  const lineClearPreview = useMemo(() => {
    if (!activePreviewPiece || !hoverAnchor) return null;
    return getLineClearPreview(grid, activePreviewPiece, hoverAnchor.r, hoverAnchor.c);
  }, [activePreviewPiece, grid, hoverAnchor]);

  // Precompute whether each tray piece can currently fit anywhere on the board
  const trayFitMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of tray) {
      map.set(p.uid, p.placed ? false : canPieceFitAnywhere(grid, p));
    }
    return map;
  }, [grid, tray]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#070B16] text-slate-100 select-none overflow-x-hidden flex justify-center">
      {/* Dedicated Android Portrait Mobile Shell */}
      <div className="w-full max-w-[430px] min-h-[100dvh] bg-[#0B1020] sm:border-x sm:border-slate-800/70 flex flex-col relative">
        {phase === 'TITLE_MENU' ? (
          <TitleScreen
            bestScore={bestScore}
            muted={muted}
            hapticsEnabled={hapticsEnabled}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            onStart={resetAndStartGame}
            onShowInstructions={() => setShowInstructions(true)}
            onToggleMute={handleToggleMute}
            onToggleHaptics={handleToggleHaptics}
            onInstallApp={install}
          />
        ) : (
          <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between px-3 pt-[max(0.85rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] gap-3">
            {/* Compact Mobile Top App Bar */}
            <header className="w-full flex items-center justify-between gap-2 px-0.5">
              {/* Score & Best Cluster */}
              <div className="flex items-center gap-3.5">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Score
                  </div>
                  <div
                    data-testid="score-value"
                    className="font-display text-2xl font-extrabold tabular-nums text-white leading-none mt-0.5"
                  >
                    {score.toLocaleString()}
                  </div>
                </div>

                <div className="h-7 w-px bg-slate-800" aria-hidden="true" />

                <div>
                  <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-amber-300/90">
                    <Trophy className="w-3 h-3" aria-hidden="true" />
                    <span>Best</span>
                  </div>
                  <div
                    data-testid="best-score-value"
                    className="font-display text-lg font-bold tabular-nums text-amber-300 leading-none mt-1"
                  >
                    {bestScore.toLocaleString()}
                  </div>
                </div>

                {combo >= 1 && (
                  <>
                    <div className="h-7 w-px bg-slate-800" aria-hidden="true" />
                    <div>
                      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-emerald-300">
                        <Flame className="w-3 h-3" aria-hidden="true" />
                        <span>Combo</span>
                      </div>
                      <div
                        data-testid="combo-value"
                        className="font-display text-lg font-bold tabular-nums text-emerald-300 leading-none mt-1"
                      >
                        ×{combo}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 44x44px Android Touch Utility Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleMute();
                  }}
                  aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
                  aria-pressed={muted}
                  title="Mute / Unmute"
                  className="w-11 h-11 rounded-xl bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-300" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShowInstructions(true);
                  }}
                  aria-label="How to play"
                  title="How to Play"
                  className="w-11 h-11 rounded-xl bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    resetAndStartGame();
                  }}
                  aria-label="Restart game"
                  title="New Game"
                  className="w-11 h-11 rounded-xl bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setPhase('PAUSED');
                  }}
                  aria-label="Pause game"
                  title="Pause"
                  className="w-11 h-11 rounded-xl bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </header>

          {/* Main 8x8 Board Centerpiece */}
          <main className="w-full flex flex-col items-center justify-center my-auto">
            <GameBoard
              boardRef={boardRef}
              grid={grid}
              hoverAnchor={hoverAnchor}
              activePiece={activePreviewPiece}
              preview={lineClearPreview}
              justPlacedKeys={justPlacedKeys}
              clearingCells={clearingCells}
              callouts={callouts}
              shakeBoard={shakeBoard}
              selectedPieceId={selectedPieceId}
              onCellClick={handleBoardCellClick}
              onCellHover={handleBoardCellHover}
              onBoardLeave={handleBoardLeave}
            />
          </main>

          {/* Bottom Thumb-Zone 3-Piece Block Tray + Rewarded Swap */}
          <section
            aria-label="Available blocks"
            className="w-full flex flex-col gap-2"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-slate-400">
                Drag onto grid or tap to place
              </span>
              <button
                type="button"
                data-testid="swap-tray-ad-btn"
                onClick={() => triggerRewardedAd('swap-tray')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Swap Blocks · Ad</span>
              </button>
            </div>

            <div
              data-testid="block-tray"
              className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-[#131B31] border border-slate-700/70 shadow-[0_12px_32px_rgba(2,6,23,0.65)]"
            >
              {tray.map((piece, idx) => {
                const isDraggingThis =
                  dragState?.piece.uid === piece.uid && dragState.moved;
                const isSelected = selectedPieceId === piece.uid;
                const canFit = trayFitMap.get(piece.uid) ?? false;

                // Keep piece comfortably inside tray slot regardless of 1..5 span
                const maxSpan = Math.max(piece.rows, piece.cols);
                const trayCellSize =
                  maxSpan >= 5 ? 15.5 : maxSpan === 4 ? 18 : maxSpan === 3 ? 22 : 25;

                return (
                  <div
                    key={`${dealGeneration}-${piece.uid}`}
                    style={{ animationDelay: `${idx * 45}ms` }}
                    className="animate-tray-deal relative flex items-center justify-center h-[84px] rounded-xl bg-[#1B2542]/70"
                  >
                    {!piece.placed && (
                      <button
                        type="button"
                        data-testid={`tray-piece-${idx}`}
                        data-shape={piece.shapeId}
                        aria-label={`${piece.name}${
                          !canFit ? ' (cannot fit on board)' : ''
                        }${isSelected ? ', selected' : ''}`}
                        onPointerDown={(e) => handleTrayPointerDown(e, piece)}
                        onPointerMove={handleTrayPointerMove}
                        onPointerUp={handleTrayPointerUp}
                        onPointerCancel={handleTrayPointerCancel}
                        className={`w-full h-full flex items-center justify-center rounded-xl touch-none transition-all duration-150 cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-amber-400 ${
                          isDraggingThis ? 'opacity-20 scale-90' : 'opacity-100'
                        } ${
                          isSelected
                            ? 'ring-2 ring-amber-300 bg-amber-400/10'
                            : 'hover:bg-[#233055]/80'
                        }`}
                      >
                        <PiecePreview
                          piece={piece}
                          cellSize={trayCellSize}
                          gap={2.5}
                          dimmed={!canFit}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Banner Ad Placement */}
            <AdBanner rotationSeed={dealGeneration} />
          </section>
        </div>
      )}

      {/* Offline Status Toast */}
      {!isOnline && (
        <div
          role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-800 border border-slate-600 px-3.5 py-1.5 text-xs font-medium text-amber-200 shadow-lg whitespace-nowrap"
        >
          Offline Ready · Playing from local cache
        </div>
      )}

      {/* Floating Drag Ghost Attached to Pointer */}
      {dragState && dragState.moved && (
        <div
          aria-hidden="true"
          style={{
            transform: `translate3d(${dragState.clientX}px, ${
              dragState.clientY - (dragState.pointerType === 'touch' ? 76 : 0)
            }px, 0) translate(-50%, -50%)`,
          }}
          className="fixed top-0 left-0 z-40 pointer-events-none drop-shadow-[0_18px_28px_rgba(2,6,23,0.75)]"
        >
          <PiecePreview
            piece={dragState.piece}
            cellSize={dragState.boardCellPx}
            gap={6}
          />
        </div>
      )}

      {/* Android Bottom Sheets */}
      {phase === 'PAUSED' && !showInstructions && (
        <PauseModal
          score={score}
          bestScore={bestScore}
          linesCleared={linesCleared}
          muted={muted}
          hapticsEnabled={hapticsEnabled}
          onToggleMute={handleToggleMute}
          onToggleHaptics={handleToggleHaptics}
          onResume={() => setPhase('PLAYING')}
          onRestart={resetAndStartGame}
          onShowInstructions={() => setShowInstructions(true)}
          onExitToTitle={() => {
            setShowInstructions(false);
            setPhase('TITLE_MENU');
          }}
        />
      )}

      {phase === 'GAME_OVER' && gameOverSnapshot && !rewardedAdPurpose && !showInterstitialAd && (
        <GameOverModal
          stats={gameOverSnapshot}
          canRevive={!revivedThisRun}
          onReviveAd={() => triggerRewardedAd('revive')}
          onPlayAgain={handlePlayAgainAfterGameOver}
          onExitToTitle={() => {
            setGameOverSnapshot(null);
            setPhase('TITLE_MENU');
          }}
        />
      )}

      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}

      {rewardedAdPurpose && (
        <RewardedAdModal
          purpose={rewardedAdPurpose}
          creativeSeed={dealGeneration}
          onClaimReward={() => {
            const purpose = rewardedAdPurpose;
            setRewardedAdPurpose(null);
            applyRewardedOutcome(purpose);
          }}
          onCancel={() => setRewardedAdPurpose(null)}
        />
      )}

      {showInterstitialAd && (
        <InterstitialAdModal
          creativeSeed={gamesCompleted}
          onClose={() => {
            setShowInterstitialAd(false);
            resetAndStartGame();
          }}
        />
      )}
      </div>
    </div>
  );
}
