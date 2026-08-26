import { useState } from 'react';
import { ArenaLayout } from './boardLayout.js';
import {
  COLORS,
  RADIUS,
  SPACE,
  TYPE,
  labelStyle,
  outlineButton,
  panelStyle,
} from './designTokens.js';
import { EXPORT_FORMAT_LIST, ExportFormat, ExportFormatId } from './exportFormats.js';

/**
 * Export format selection — the frame a battle is composed for.
 *
 * Shown as scale outlines rather than words, because the shape *is* the choice:
 * a 9:16 board is tall and gets a tall grid, a 16:9 board is wide. Switching
 * reshapes the board, so a battle in progress has to restart; the callers wire
 * that up.
 */

/** Miniature of the frame's proportions, with its board grid drawn in. */
const FrameOutline: React.FC<{ format: ExportFormat; boxSize: number; accent: string }> = ({
  format, boxSize, accent,
}) => {
  const aspect = format.width / format.height;
  const height = aspect >= 1 ? boxSize / aspect : boxSize;
  const width = aspect >= 1 ? boxSize : boxSize * aspect;

  return (
    <div style={{
      width: boxSize, height: boxSize,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width, height,
        border: `1px solid ${accent}`,
        borderRadius: 2,
        background:
          `repeating-linear-gradient(90deg, ${accent}22 0 1px, transparent 1px ${width / format.cols}px),` +
          `repeating-linear-gradient(180deg, ${accent}22 0 1px, transparent 1px ${height / format.rows}px)`,
      }} />
    </div>
  );
};

export const FormatGrid: React.FC<{
  formatId: ExportFormatId;
  onSelect: (id: ExportFormatId) => void;
  compact?: boolean;
}> = ({ formatId, onSelect, compact = false }) => (
  <div style={{
    display: 'flex', gap: SPACE.md, flexWrap: 'wrap', justifyContent: 'center',
  }}>
    {EXPORT_FORMAT_LIST.map(format => {
      const selected = format.id === formatId;
      const accent = selected ? COLORS.accent.blue : COLORS.text.muted;
      return (
        <button
          key={format.id}
          onClick={() => onSelect(format.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: SPACE.md,
            padding: compact ? '8px 10px' : '10px 14px',
            background: selected ? COLORS.bg.panelRaised : 'transparent',
            border: `2px solid ${selected ? COLORS.accent.blue : COLORS.border.subtle}`,
            borderRadius: RADIUS.lg, cursor: 'pointer',
            color: selected ? COLORS.text.onSelected : COLORS.text.secondary,
            textAlign: 'left',
            width: compact ? 200 : 224,
          }}
        >
          <FrameOutline format={format} boxSize={compact ? 34 : 44} accent={accent} />
          <div>
            <div style={{
              fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold,
              letterSpacing: TYPE.tracking.tight,
            }}>
              {format.name} · {format.aspect}
            </div>
            <div style={{ fontSize: TYPE.size.xs, color: COLORS.text.muted, marginTop: 3 }}>
              {format.platforms}
            </div>
            <div style={{ fontSize: TYPE.size.xs, color: COLORS.text.faint, marginTop: 2 }}>
              {format.width}×{format.height} · {format.cols}×{format.rows} board
            </div>
          </div>
        </button>
      );
    })}
  </div>
);

/** Compact in-battle switcher — a FORMAT button that expands into the grid. */
export const FormatControls: React.FC<{
  formatId: ExportFormatId;
  layout: ArenaLayout;
  onSelect: (id: ExportFormatId) => void;
}> = ({ formatId, layout, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={outlineButton(COLORS.accent.blue)}>
        {layout.format.aspect}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          width: 232,
          display: 'flex', flexDirection: 'column', gap: SPACE.md,
          padding: 14, zIndex: 100, ...panelStyle,
        }}>
          <div style={{ ...labelStyle, letterSpacing: 1.5 }}>Export format</div>
          <FormatGrid formatId={formatId} onSelect={onSelect} compact />
          <div style={{
            fontSize: TYPE.size.xs, color: COLORS.text.faint, lineHeight: 1.4,
          }}>
            Reshapes the board, so switching restarts the battle.
          </div>
        </div>
      )}
    </div>
  );
};
