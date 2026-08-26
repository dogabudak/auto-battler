import { useCallback, useEffect, useState } from 'react';
import {
  COLORS,
  RADIUS,
  fieldLabelStyle,
  inputStyle as tokenInput,
  outlineButton,
  panelStyle,
} from './designTokens.js';

/**
 * Branding / watermark overlay burned into exported videos.
 *
 * Export is `getDisplayMedia` screen capture (see useScreenRecorder), so
 * anything rendered inside the arena element ends up in the .webm. The
 * watermark is therefore just a DOM overlay pinned to a corner of the arena —
 * no compositing step, no canvas.
 *
 * Settings persist in localStorage so a creator sets their handle once.
 */

export type WatermarkCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface WatermarkConfig {
  enabled: boolean;
  /** Handle / channel name, e.g. "@autobattler". Empty hides the text. */
  handle: string;
  /** Optional logo served from `public/`, e.g. "/brand/logo.png". */
  logoUrl: string;
  corner: WatermarkCorner;
  /** 0.2–1 */
  opacity: number;
  /** Size multiplier, 0.7–1.8 */
  scale: number;
  /** Keep it hidden while previewing, show it only in the recording. */
  onlyWhileRecording: boolean;
}

export const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: true,
  handle: '@autobattler',
  logoUrl: '',
  corner: 'bottom-right',
  opacity: 0.85,
  scale: 1,
  onlyWhileRecording: false,
};

const STORAGE_KEY = 'auto-battler:watermark';

const CORNERS: WatermarkCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

function loadConfig(): WatermarkConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WATERMARK;
    // Merge so configs saved by older builds still pick up new fields.
    return { ...DEFAULT_WATERMARK, ...(JSON.parse(raw) as Partial<WatermarkConfig>) };
  } catch {
    return DEFAULT_WATERMARK;
  }
}

/** Persisted watermark settings, shared by both battle views. */
export function useWatermark() {
  const [config, setConfig] = useState<WatermarkConfig>(loadConfig);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Private mode / storage disabled — settings just won't persist.
    }
  }, [config]);

  const update = useCallback((patch: Partial<WatermarkConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  return { config, update };
}

function cornerStyle(corner: WatermarkCorner, inset: number): React.CSSProperties {
  const [vertical, horizontal] = corner.split('-');
  return {
    [vertical === 'top' ? 'top' : 'bottom']: inset,
    [horizontal === 'left' ? 'left' : 'right']: inset,
  };
}

/**
 * The overlay itself. Render as the last child of the arena container (the
 * element with `position: relative`) so it sits above every effect layer.
 */
export const Watermark: React.FC<{
  config: WatermarkConfig;
  isRecording?: boolean;
  /**
   * Export pixels per unit of the original 50px-tile board. The arena is built
   * at export resolution now (1080x1920 and friends), so a watermark sized in
   * fixed pixels would come out as a speck on a vertical frame.
   */
  pixelScale?: number;
}> = ({ config, isRecording = false, pixelScale = 1 }) => {
  if (!config.enabled) return null;
  if (config.onlyWhileRecording && !isRecording) return null;
  if (!config.handle && !config.logoUrl) return null;

  const scale = config.scale * pixelScale;
  const fontSize = Math.round(13 * scale);
  const logoSize = Math.round(20 * scale);

  return (
    <div
      style={{
        position: 'absolute',
        ...cornerStyle(config.corner, Math.round(10 * scale)),
        display: 'flex',
        alignItems: 'center',
        gap: Math.round(6 * scale),
        padding: `${Math.round(4 * scale)}px ${Math.round(9 * scale)}px`,
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 999,
        backdropFilter: 'blur(2px)',
        opacity: config.opacity,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 70,
      }}
    >
      {config.logoUrl && (
        <img
          src={config.logoUrl}
          alt=""
          width={logoSize}
          height={logoSize}
          style={{ objectFit: 'contain', display: 'block' }}
        />
      )}
      {config.handle && (
        <span
          style={{
            fontSize,
            fontWeight: 'bold',
            color: '#fff',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}
        >
          {config.handle}
        </span>
      )}
    </div>
  );
};

const fieldLabel = fieldLabelStyle;
const inputStyle = tokenInput;

/** Compact settings panel — a BRAND button that expands into the controls. */
export const WatermarkControls: React.FC<{
  config: WatermarkConfig;
  onChange: (patch: Partial<WatermarkConfig>) => void;
}> = ({ config, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={outlineButton(config.enabled ? COLORS.accent.blue : COLORS.text.secondary)}
      >
        BRAND
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 260,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 14,
            ...panelStyle,
            zIndex: 100,
            textAlign: 'left',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => onChange({ enabled: e.target.checked })}
            />
            <span style={{ ...fieldLabel, color: COLORS.text.primary }}>Show watermark</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={fieldLabel}>Handle</span>
            <input
              type="text"
              value={config.handle}
              placeholder="@yourhandle"
              onChange={e => onChange({ handle: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={fieldLabel}>Logo path (optional)</span>
            <input
              type="text"
              value={config.logoUrl}
              placeholder="/brand/logo.png"
              onChange={e => onChange({ logoUrl: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={fieldLabel}>Corner</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {CORNERS.map(corner => (
                <button
                  key={corner}
                  onClick={() => onChange({ corner })}
                  style={{
                    padding: '5px 6px',
                    fontSize: 11,
                    background: config.corner === corner ? COLORS.bg.selected : 'transparent',
                    border: `1px solid ${config.corner === corner ? COLORS.accent.blue : COLORS.border.default}`,
                    borderRadius: RADIUS.sm,
                    cursor: 'pointer',
                    color: config.corner === corner ? COLORS.text.onSelected : COLORS.text.secondary,
                  }}
                >
                  {corner.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={fieldLabel}>Opacity {Math.round(config.opacity * 100)}%</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={config.opacity}
              onChange={e => onChange({ opacity: Number(e.target.value) })}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={fieldLabel}>Size {config.scale.toFixed(1)}x</span>
            <input
              type="range"
              min={0.7}
              max={1.8}
              step={0.1}
              value={config.scale}
              onChange={e => onChange({ scale: Number(e.target.value) })}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.onlyWhileRecording}
              onChange={e => onChange({ onlyWhileRecording: e.target.checked })}
            />
            <span style={{ ...fieldLabel, color: COLORS.text.primary }}>Only while recording</span>
          </label>
        </div>
      )}
    </div>
  );
};
