/**
 * Export formats — the frame a battle is designed *in*, not cropped *to*.
 *
 * The arena used to be a fixed 750x700 desktop board that a later pipeline step
 * would have to crop into a 9:16 video. Cropping a near-square board to 9:16
 * throws away a third of the action or letterboxes it, and either way the
 * composition was never designed for the frame it ships in. So the frame comes
 * first: pick a format, and the board, tile size, margins and text sizes are all
 * derived from it, at export resolution.
 *
 * Each format carries its own board grid, shaped to the frame — a vertical video
 * gets a tall board, a wide video a wide one — so units use the whole frame
 * instead of clustering in a square in the middle.
 *
 * The grids keep tiles square and the unit count comparable to the original
 * 15x14 board (210 tiles), so battles feel the same density in any format.
 */

export type ExportFormatId = 'vertical' | 'square' | 'wide';

export interface ExportFormat {
  id: ExportFormatId;
  name: string;
  /** Aspect label, e.g. "9:16". */
  aspect: string;
  /** Where this format is meant to be posted. */
  platforms: string;
  /** Export frame in pixels — the arena is built at exactly this size. */
  width: number;
  height: number;
  /** Board grid, shaped to the frame. */
  cols: number;
  rows: number;
}

export const EXPORT_FORMATS: Record<ExportFormatId, ExportFormat> = {
  vertical: {
    id: 'vertical',
    name: 'Vertical',
    aspect: '9:16',
    platforms: 'TikTok · Reels · Shorts',
    width: 1080,
    height: 1920,
    // 12x21 = 252 tiles at 0.571 ratio — a hair wider than 9:16 (0.5625), so
    // the leftover height becomes margin rather than distortion.
    cols: 12,
    rows: 21,
  },
  square: {
    id: 'square',
    name: 'Square',
    aspect: '1:1',
    platforms: 'Instagram feed',
    width: 1080,
    height: 1080,
    cols: 15,
    rows: 15,
  },
  wide: {
    id: 'wide',
    name: 'Wide',
    aspect: '16:9',
    platforms: 'X · YouTube',
    width: 1920,
    height: 1080,
    // 24x13 = 312 tiles at 1.846 vs 16:9's 1.778 — again, the slack lands in
    // the horizontal margin.
    cols: 24,
    rows: 13,
  },
};

export const EXPORT_FORMAT_LIST: ExportFormat[] = Object.values(EXPORT_FORMATS);

/** Vertical is the default: the plan's primary platforms are TikTok and Reels. */
export const DEFAULT_FORMAT_ID: ExportFormatId = 'vertical';

export function getExportFormat(id: ExportFormatId): ExportFormat {
  return EXPORT_FORMATS[id] ?? EXPORT_FORMATS[DEFAULT_FORMAT_ID];
}
