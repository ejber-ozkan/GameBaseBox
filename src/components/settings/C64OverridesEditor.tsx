import { useId } from 'react';
import type { C64Overrides, C64Resolved } from '../../types/c64';

interface Props {
  value: C64Overrides;
  onChange: (value: C64Overrides) => void;
  scope: 'global' | 'game';
  resolved?: C64Resolved;
  focusStart?: number;
  onControlFocus?: (index: number) => void;
}

const fields = [
  { key: 'region', label: 'Region', options: [['pal', 'PAL'], ['ntsc', 'NTSC']] },
  { key: 'trueDrive', label: 'True-drive emulation', options: [['true', 'Enabled'], ['false', 'Disabled']] },
  { key: 'virtualDevices', label: 'Virtual device traps', options: [['true', 'Enabled'], ['false', 'Disabled']] },
  { key: 'reu', label: 'REU memory expansion', options: [[0, 'Disabled'], ...[128, 256, 512, 1024, 2048, 4096, 8192, 16384].map(size => [size, `${size} KB`])] },
  { key: 'rom', label: 'ROM selection', options: [['standard', 'Standard C64'], ['swedish', 'Swedish'], ['danish', 'Danish']] },
] as const;

function formatValue(value: unknown): string {
  if (value == null) return 'Emulator default';
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (typeof value === 'number') return value ? `${value} KB` : 'Disabled';
  return String(value).toUpperCase();
}

export function C64OverridesEditor({ value, onChange, scope, resolved, focusStart = 40, onControlFocus }: Props) {
  const id = useId();
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-bold text-theme-text">{scope === 'global' ? 'C64 emulation defaults' : 'This game’s emulation settings'}</legend>
      <p className="text-xs leading-relaxed text-theme-text-muted">
        {scope === 'global'
          ? 'Automatic uses each game’s database and GEMUS settings. Forced defaults can conflict with a game’s requirements. Per-game overrides take priority.'
          : 'Changes apply to desktop VICE and RetroArch launches. Inherit uses global overrides, then this game’s GEMUS and database settings.'}
      </p>
      {fields.map((field, index) => {
        const effective = resolved?.[field.key];
        return (
          <div key={field.key} className="space-y-1">
            <label htmlFor={`${id}-${field.key}`} className="block text-xs font-semibold text-theme-text">{field.label}</label>
            <select
              id={`${id}-${field.key}`}
              className={`focus-idx-${focusStart + index} min-h-11 w-full rounded-theme border border-theme-outline-variant bg-theme-background px-3 text-sm text-theme-text focus-visible:outline-2 focus-visible:outline-theme-primary`}
              value={value[field.key] == null ? '' : String(value[field.key])}
              onFocus={() => onControlFocus?.(focusStart + index)}
              aria-describedby={effective ? `${id}-${field.key}-effective` : undefined}
              onKeyDown={event => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) event.stopPropagation(); }}
              onChange={event => {
                const next = { ...value };
                const selected = event.target.value;
                if (!selected) delete next[field.key];
                else Object.assign(next, { [field.key]: field.key === 'reu' ? Number(selected) : ['trueDrive', 'virtualDevices'].includes(field.key) ? selected === 'true' : selected });
                onChange(next);
              }}
            >
              <option value="">{scope === 'global' ? 'Automatic from database' : 'Inherit global / database'}</option>
              {field.options.map(([option, label]) => <option key={option} value={option}>{label}</option>)}
            </select>
            {effective && <p id={`${id}-${field.key}-effective`} className="text-xs text-theme-text-muted">Effective: {formatValue(effective.value)} · {effective.source}</p>}
          </div>
        );
      })}
      <button type="button" className={`focus-idx-${focusStart + 5} min-h-11 rounded-theme border border-theme-outline-variant px-3 text-xs text-theme-text hover:bg-theme-surface focus-visible:outline-2 focus-visible:outline-theme-primary`} onClick={() => onChange({})}>Reset overrides</button>
      {resolved && resolved.warnings.length > 0 && <div role="status" className="space-y-1 text-xs text-theme-text-muted">{resolved.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}
    </fieldset>
  );
}
