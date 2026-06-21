import { cn } from '@/lib/cn'

const variants = {
  primary:
    'bg-primary !text-white hover:bg-primary/90 hover:!text-white active:scale-[0.98] shadow-sm',
  secondary:
    'bg-secondary-container text-on-secondary-container hover:brightness-105 active:scale-[0.98] shadow-sm',
  outline:
    'border border-primary text-primary bg-transparent hover:bg-surface-container-low active:scale-[0.98]',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
  danger:
    'bg-error !text-white hover:bg-error hover:!text-white active:scale-[0.98]',
  ultra:
    'bg-ultra-secondary !text-white hover:bg-ultra-secondary hover:!text-white active:scale-[0.98] shadow-sm',
}

const sizes = {
  sm: 'h-9 px-3 text-label-sm gap-1.5',
  md: 'h-11 px-5 text-label-md gap-2',
  lg: 'h-12 px-6 text-body-md gap-2',
  icon: 'h-10 w-10 p-0 justify-center',
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  leftIcon,
  rightIcon,
  ...props
}) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-standard',
      'focus-ring disabled:pointer-events-none disabled:opacity-50',
      variants[variant],
      sizes[size],
      className,
    )}
    {...props}
  >
    {leftIcon}
    {children}
    {rightIcon}
  </button>
)
