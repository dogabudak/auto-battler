import { useMemo, useState } from 'react';
import { PACK_LIST, buildRoster, getGroupNames, getPack } from '../engine/index.js';
import type { PackId, RosterMode } from '../engine/index.js';
import { EntityImage } from './EntityImage.js';
import { ArenaThemeGrid, useArenaTheme } from './ArenaTheme.js';
import { useExportFormat } from './boardLayout.js';
import { FormatGrid } from './FormatPicker.js';
import {
  COLORS,
  RADIUS,
  SPACE,
  TYPE,
  labelStyle,
  primaryButton,
} from './designTokens.js';

/** Battle mode is independent of the entity pack — any pack plays any mode. */
export type BattleMode = 'ffa' | 'brawl';

export interface BattleConfig {
  mode: BattleMode;
  packId: PackId;
  /** Resolved entity keys that enter the battle. */
  roster: string[];
}

const MODES: { id: BattleMode; name: string; blurb: string; accent: string }[] = [
  { id: 'ffa', name: 'FFA BATTLE', blurb: 'Classic free-for-all', accent: COLORS.accent.green },
  { id: 'brawl', name: 'BRAWL', blurb: 'Hit once, move on', accent: COLORS.accent.gold },
];

/** Practical ceiling before the board gets too crowded to read. */
const ROSTER_SIZES = [8, 12, 16, 20, 24];

const ALL_GROUPS = '__all__';

export function BattleSetup({ onStart }: { onStart: (config: BattleConfig) => void }) {
  const [mode, setMode] = useState<BattleMode>('brawl');
  const [packId, setPackId] = useState<PackId>('countries');
  const [group, setGroup] = useState<string>(ALL_GROUPS);
  const [rosterMode, setRosterMode] = useState<RosterMode>('top');
  const [size, setSize] = useState<number>(16);

  const pack = getPack(packId);
  const groupNames = useMemo(() => getGroupNames(packId), [packId]);
  // Both persisted, so the battle views pick up the same stage and frame on mount.
  const { theme, selection: themeSelection, select: selectTheme } = useArenaTheme(packId);
  const { formatId, layout, select: selectFormat } = useExportFormat();

  // Recomputed on every control change so the preview is always what you get,
  // except for 'random' where Start re-draws.
  const roster = useMemo(
    () => buildRoster(packId, { size, group: group === ALL_GROUPS ? undefined : group, mode: rosterMode }),
    [packId, size, group, rosterMode]
  );

  const selectPack = (id: PackId) => {
    setPackId(id);
    setGroup(ALL_GROUPS);
    setSize(getPack(id).defaultRosterSize);
  };

  const start = () => {
    onStart({
      mode,
      packId,
      roster: buildRoster(packId, {
        size,
        group: group === ALL_GROUPS ? undefined : group,
        mode: rosterMode,
      }),
    });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minHeight: '100vh', padding: '32px 20px', gap: 26,
      background: theme.pageBackground,
      transition: 'background 0.4s ease',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: TYPE.size.displayLg, letterSpacing: TYPE.tracking.wider, margin: 0, color: COLORS.text.primary }}>AUTO BATTLER</h1>
        <p style={{ color: COLORS.text.secondary, fontSize: TYPE.size.md + 1, marginTop: SPACE.md }}>
          Pick a pack, pick a mode, start the fight
        </p>
      </div>

      <Section label="Entity Pack">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {PACK_LIST.map(p => {
            const selected = p.id === packId;
            return (
              <button
                key={p.id}
                onClick={() => selectPack(p.id)}
                style={{
                  width: 210, padding: '16px 18px', textAlign: 'left',
                  background: selected
                    ? `linear-gradient(135deg, ${COLORS.bg.selected}, #14243a)`
                    : COLORS.bg.panelRaised,
                  border: `2px solid ${selected ? COLORS.accent.blue : COLORS.border.subtle}`,
                  borderRadius: 12, cursor: 'pointer',
                  color: selected ? COLORS.text.primary : COLORS.text.secondary,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }}>{p.name}</div>
                <div style={{ fontSize: TYPE.size.md - 1, color: COLORS.text.secondary, marginTop: SPACE.sm }}>{p.tagline}</div>
                <div style={{ fontSize: TYPE.size.sm, color: COLORS.text.muted, marginTop: SPACE.md, lineHeight: 1.4 }}>
                  {p.statBasis}
                </div>
                <div style={{ fontSize: TYPE.size.sm, color: COLORS.text.muted, marginTop: SPACE.sm }}>
                  {Object.keys(p.templates).length} entities
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Battle Mode">
        <div style={{ display: 'flex', gap: 12 }}>
          {MODES.map(m => {
            const selected = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  width: 180, padding: '14px 18px',
                  background: selected ? COLORS.bg.panelRaised : 'transparent',
                  border: `2px solid ${selected ? m.accent : COLORS.border.subtle}`,
                  borderRadius: 12, cursor: 'pointer',
                  color: selected ? m.accent : COLORS.text.secondary,
                  fontSize: 15, fontWeight: 'bold', letterSpacing: 1,
                }}
              >
                {m.name}
                <div style={{ fontSize: TYPE.size.sm, color: COLORS.text.secondary, marginTop: SPACE.sm, fontWeight: TYPE.weight.normal }}>
                  {m.blurb}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Export Format">
        <FormatGrid formatId={formatId} onSelect={selectFormat} />
      </Section>

      <Section label="Arena Theme">
        <ArenaThemeGrid
          selection={themeSelection}
          packId={packId}
          layout={layout}
          onSelect={selectTheme}
        />
      </Section>

      <Section label="Roster">
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
          {pack.groups && (
            <Field label={pack.groupLabel ?? 'Group'}>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                style={selectStyle}
              >
                <option value={ALL_GROUPS}>All</option>
                {groupNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Size">
            <div style={{ display: 'flex', gap: 4 }}>
              {ROSTER_SIZES.map(n => (
                <Chip key={n} selected={n === size} onClick={() => setSize(n)}>{n}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Pick by">
            <div style={{ display: 'flex', gap: 4 }}>
              <Chip selected={rosterMode === 'top'} onClick={() => setRosterMode('top')}>Strongest</Chip>
              <Chip selected={rosterMode === 'random'} onClick={() => setRosterMode('random')}>Random</Chip>
            </div>
          </Field>
        </div>
      </Section>

      <Section label={`Lineup — ${roster.length} entities`}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
          maxWidth: 760, minHeight: 64,
        }}>
          {roster.map(key => (
            <div key={key} style={{ width: 74, textAlign: 'center' }}>
              <EntityImage
                imageUrl={pack.templates[key]?.imageUrl}
                name={pack.displayNames[key] ?? key}
                size={32}
              />
              <div style={{
                fontSize: TYPE.size.xs - 1, color: COLORS.text.secondary, marginTop: SPACE.xs,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {pack.displayNames[key] ?? key}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <button
        onClick={start}
        style={{
          ...primaryButton(COLORS.accent.green, COLORS.accent.greenDeep),
          padding: '14px 56px', borderRadius: RADIUS.lg,
          letterSpacing: TYPE.tracking.wide,
        }}
      >
        START BATTLE
      </button>
    </div>
  );
}

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <div style={labelStyle}>
      {label}
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: TYPE.size.xs, letterSpacing: TYPE.tracking.normal, color: COLORS.text.muted, textTransform: 'uppercase' }}>
      {label}
    </span>
    {children}
  </div>
);

const Chip: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({
  selected, onClick, children,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 12px', fontSize: 12,
      background: selected ? COLORS.bg.selected : 'transparent',
      border: `1px solid ${selected ? COLORS.accent.blue : COLORS.border.default}`,
      borderRadius: 6, cursor: 'pointer',
      color: selected ? COLORS.text.onSelected : COLORS.text.secondary,
    }}
  >
    {children}
  </button>
);

const selectStyle: React.CSSProperties = {
  background: COLORS.bg.inset,
  border: `1px solid ${COLORS.border.default}`,
  borderRadius: 6,
  color: COLORS.text.primary,
  fontSize: 13,
  padding: '6px 8px',
  minWidth: 150,
};
