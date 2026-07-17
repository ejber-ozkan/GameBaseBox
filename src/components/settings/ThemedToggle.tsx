interface ThemedToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  onMouseEnter?: () => void;
  focusClassName?: string;
  focused?: boolean;
  large?: boolean;
}

export function ThemedToggle({ label, checked, onChange, onMouseEnter, focusClassName = '', focused = false, large = false }: ThemedToggleProps) {
  const sizing = large
    ? { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: 'translate-x-7' }
    : { track: 'h-6 w-12', thumb: 'h-5 w-5', translate: 'translate-x-6' };

  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={onChange}
      onMouseEnter={onMouseEnter}
      className={`${focusClassName} relative ml-6 shrink-0 border border-theme-outline-variant ${sizing.track} rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 focus-visible:ring-offset-theme-background ${focused ? 'ring-2 ring-theme-primary/70 ring-offset-2 ring-offset-theme-background' : ''} ${
        checked ? 'bg-theme-primary' : 'bg-theme-background'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 ${sizing.thumb} rounded-full bg-theme-surface shadow transition-transform ${
          checked ? sizing.translate : 'translate-x-0'
        }`}
      />
    </button>
  );
}
