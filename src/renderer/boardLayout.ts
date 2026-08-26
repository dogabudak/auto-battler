import { useCallback, useEffect, useState } from 'react';
import { Position } from '../types/index.js';
import { ARENA_TYPE_RATIO } from './designTokens.js';
import {
  DEFAULT_FORMAT_ID,
  EXPORT_FORMATS,
  ExportFormat,
  ExportFormatId,
  getExportFormat,
} from './exportFormats.js';

/**
 * Board and arena geometry, derived from the selected export format and shared
 * by both battle views so the two can't drift.
 *
 * Three coordinate spaces are in play, and mixing them up is what used to put
 * units outside the board:
 *
 *   - **Board space** — tile coordinates, what the simulators work in. A unit
 *     position is a point clamped to `[0, cols-1] × [0, rows-1]`.
 *   - **Export space** — pixels inside the arena element. This is the frame that
 *     ships: 1080x1920 for vertical, and every size below is in these pixels.
 *   - **Screen space** — export space multiplied by a preview scale, so a
 *     1080x1920 arena is visible on a laptop. Only the preview wrapper knows
 *     about this; nothing inside the arena does.
 *
 * A unit is *drawn* as a one-tile box whose **top-left** sits at its board
 * position, so its visual centre is half a tile down-right of the point the
 * simulator tracks. Effect layers convert by adding `tile / 2`;
 * `distributedPositions` subtracts half a tile from each slot centre.
 */

export interface ArenaLayout {
  format: ExportFormat;
  /** Board grid. */
  cols: number;
  rows: number;
  /** Export pixels per board cell — always an integer, so assets land on whole pixels. */
  tile: number;
  boardWidth: number;
  boardHeight: number;
  /** Arena size in export pixels; equals the format frame exactly. */
  width: number;
  height: number;
  /**
   * Margin between the arena edge and the play area, per axis.
   *
   * A unit is more than its tile: the name label sits above it, damage numbers
   * float up, ability bursts ring out past its radius, and long entity names
   * are wider than a tile. Without this margin all of that is clipped at the
   * edges, and units on the last row cross painted boundaries (a pitch
   * touchline) instead of staying inside them. Whatever the grid doesn't use of
   * the frame lands here, so the two axes usually differ.
   */
  insetX: number;
  insetY: number;
  /**
   * Widest a unit's name label may render when it is parked on the left or
   * right board edge — half its own tile plus the margin. The worst case; use
   * `labelWidthAt()` for a unit's actual room.
   */
  labelMaxWidth: number;
  /** Arena text sizes in export pixels, from ARENA_TYPE_RATIO. */
  font: {
    unitLabel: number;
    damageNumber: number;
    damageNumberBig: number;
    calloutTitle: number;
    calloutName: number;
    slash: number;
    watermark: number;
  };
}

/**
 * Smallest margin to reserve, as a fraction of the frame's shorter side. The
 * grid is sized to fit inside it; leftover space widens it further.
 */
const MIN_INSET_FRACTION = 0.05;

export function getArenaLayout(formatId: ExportFormatId): ArenaLayout {
  const format = getExportFormat(formatId);
  const { width, height, cols, rows } = format;

  const minInset = Math.round(Math.min(width, height) * MIN_INSET_FRACTION);

  // Integer tile: fractional tiles put crests on half pixels, which reads as
  // soft the moment the video is compressed.
  const tile = Math.floor(
    Math.min((width - minInset * 2) / cols, (height - minInset * 2) / rows)
  );

  const boardWidth = tile * cols;
  const boardHeight = tile * rows;

  return {
    format,
    cols,
    rows,
    tile,
    boardWidth,
    boardHeight,
    width,
    height,
    insetX: (width - boardWidth) / 2,
    insetY: (height - boardHeight) / 2,
    labelMaxWidth: tile + (width - boardWidth),
    font: {
      unitLabel: Math.round(tile * ARENA_TYPE_RATIO.unitLabel),
      damageNumber: Math.round(tile * ARENA_TYPE_RATIO.damageNumber),
      damageNumberBig: Math.round(tile * ARENA_TYPE_RATIO.damageNumberBig),
      calloutTitle: Math.round(tile * ARENA_TYPE_RATIO.calloutTitle),
      calloutName: Math.round(tile * ARENA_TYPE_RATIO.calloutName),
      slash: Math.round(tile * ARENA_TYPE_RATIO.slash),
      watermark: Math.round(tile * ARENA_TYPE_RATIO.watermark),
    },
  };
}

/**
 * How wide a name label may render for a unit at board column `x`.
 *
 * Labels are centred on the unit, so the room available is twice the distance
 * from the unit's centre to the nearer arena edge. Capping at the *worst case*
 * (a unit on the board edge) would truncate names everywhere, which on a narrow
 * vertical frame means most of them — "UNITED STATES" doesn't fit the edge
 * allowance even though a unit mid-board has room to spare. Computing it per
 * unit keeps the no-overflow guarantee while letting names show in full
 * wherever there is space for them.
 */
export function labelWidthAt(x: number, layout: ArenaLayout): number {
  const centre = x * layout.tile + layout.tile / 2;
  const room = Math.min(centre + layout.insetX, layout.boardWidth - centre + layout.insetX);
  return Math.max(layout.tile, room * 2);
}

/**
 * The arena element's style.
 *
 * `flexShrink: 0` is load-bearing, not decoration: both views are column flex
 * containers with `minHeight: 100vh`, so on a short window the arena — a flex
 * item — was silently shrunk to fit (748px declared, 647px rendered on a 949px
 * viewport). Unit positions come from the *declared* board size, so every row
 * past the shrunk height rendered below the visible arena and was clipped.
 * Refusing to shrink keeps board space and export space in agreement; the
 * preview wrapper handles fitting the thing on screen.
 *
 * `boxSizing: content-box` because themes draw their own frame and the page sets
 * border-box globally, which would otherwise eat the frame's width out of the
 * margin and push the play area off-centre by the border width.
 */
export function arenaStyle(layout: ArenaLayout): React.CSSProperties {
  return {
    position: 'relative',
    width: layout.width,
    height: layout.height,
    flexShrink: 0,
    boxSizing: 'content-box',
    overflow: 'hidden',
  };
}

/**
 * The board-space layer inside the arena. Everything positioned in tile
 * coordinates goes in here. Overflow stays visible on purpose, so labels,
 * damage numbers and ability bursts spill into the margin instead of being
 * clipped by the arena edge.
 */
export function playAreaStyle(layout: ArenaLayout): React.CSSProperties {
  return {
    position: 'absolute',
    left: layout.insetX,
    top: layout.insetY,
    width: layout.boardWidth,
    height: layout.boardHeight,
    pointerEvents: 'none',
  };
}

/**
 * Starting formation: a grid of `count` units spread over the whole board.
 *
 * Each row is centred independently, so a partly-filled final row sits in the
 * middle instead of bunching against the left edge. Slot centres are evenly
 * spaced across the full board and then shifted back half a tile, which both
 * centres the formation and guarantees every unit box lands inside the board.
 */
export function distributedPositions(count: number, layout: ArenaLayout): Position[] {
  const { cols: boardCols, rows: boardRows } = layout;
  const cols = Math.min(count, Math.ceil(Math.sqrt(count * (boardCols / boardRows))));
  const rows = Math.ceil(count / cols);

  const positions: Position[] = [];
  for (let row = 0; row < rows; row++) {
    const inRow = Math.min(cols, count - row * cols);
    for (let col = 0; col < inRow; col++) {
      positions.push({
        x: (boardCols * (col + 0.5)) / inRow - 0.5,
        y: (boardRows * (row + 0.5)) / rows - 0.5,
      });
    }
  }
  return positions;
}

/* -------------------------------------------------- format selection -- */

const STORAGE_KEY = 'auto-battler:export-format';

function loadFormatId(): ExportFormatId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw in EXPORT_FORMATS) return raw as ExportFormatId;
  } catch {
    // Private mode / storage disabled — fall through to the default.
  }
  return DEFAULT_FORMAT_ID;
}

/**
 * Persisted export format, shared by the setup screen and both battle views —
 * pick a frame once and every battle is composed for it.
 */
export function useExportFormat() {
  const [formatId, setFormatId] = useState<ExportFormatId>(loadFormatId);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, formatId);
    } catch {
      // Same as above — the choice just won't survive a reload.
    }
  }, [formatId]);

  const select = useCallback((next: ExportFormatId) => setFormatId(next), []);

  return { formatId, layout: getArenaLayout(formatId), select };
}

/** Chrome the preview has to share the window with, in screen px. */
const CHROME_ALLOWANCE = 260;

export interface PreviewScale {
  /** Export space → screen space multiplier. */
  scale: number;
  /**
   * Device pixels per export pixel. At 1 or above, a screen capture records the
   * arena at full export resolution; below it, the capture is upscaling and the
   * result will look soft however high the bitrate goes.
   */
  devicePixelScale: number;
}

/**
 * Fit the export frame into the window for preview. Returns the device-pixel
 * scale too, since that — not the export size — is what a screen capture
 * actually gets.
 */
export function usePreviewScale(layout: ArenaLayout): PreviewScale {
  const measure = useCallback((): PreviewScale => {
    if (typeof window === 'undefined') return { scale: 1, devicePixelScale: 1 };
    const scale = Math.min(
      1,
      (window.innerWidth - 48) / layout.width,
      (window.innerHeight - CHROME_ALLOWANCE) / layout.height
    );
    return { scale, devicePixelScale: scale * (window.devicePixelRatio || 1) };
  }, [layout.width, layout.height]);

  const [value, setValue] = useState<PreviewScale>(measure);

  useEffect(() => {
    setValue(measure());
    const onResize = () => setValue(measure());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  return value;
}
