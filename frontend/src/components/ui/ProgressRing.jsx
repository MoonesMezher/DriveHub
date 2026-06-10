import { cn } from '@/lib/cn'

export const ProgressRing = ({
  value = 0,
  size = 64,
  strokeWidth = 6,
  className = '',
  label,
  sublabel,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-outline-variant"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-secondary transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-label-sm font-bold text-secondary">
          {value}%
        </span>
      </div>
      {(label || sublabel) && (
        <div>
          {label && <span className="block text-label-sm text-on-surface-variant">{label}</span>}
          {sublabel && <span className="block text-headline-sm text-on-surface">{sublabel}</span>}
        </div>
      )}
    </div>
  )
}
