import { cn } from '@renderer/lib/cn'

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span>
        <span className="block text-[0.86rem] font-semibold text-ink-100">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[0.76rem] text-ink-400">{description}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked
            ? 'border-gold-400/50 bg-gold-400/30'
            : 'border-line-strong bg-base-700/60'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all duration-200',
            checked
              ? 'left-[1.35rem] bg-gold-300 shadow-[0_0_12px_rgba(212,184,122,0.45)]'
              : 'left-0.5 bg-ink-400'
          )}
        />
      </span>
    </button>
  )
}
