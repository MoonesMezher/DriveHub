/**
 * Design tokens — مرآة لـ theme.css للاستخدام في JS (charts, maps, إلخ)
 */
export const colors = {
  primary: '#00236f',
  onPrimary: '#ffffff',
  primaryContainer: '#1e3a8a',
  onPrimaryContainer: '#90a8ff',
  secondary: '#855300',
  onSecondary: '#ffffff',
  secondaryContainer: '#fea619',
  onSecondaryContainer: '#684000',
  tertiary: '#4b1c00',
  tertiaryContainer: '#6e2c00',
  background: '#faf8ff',
  onBackground: '#131b2e',
  surface: '#faf8ff',
  onSurface: '#131b2e',
  onSurfaceVariant: '#444651',
  surfaceDim: '#d2d9f4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  surfaceContainerHighest: '#dae2fd',
  outline: '#757682',
  outlineVariant: '#c5c5d3',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  success: '#047857',
  onSuccess: '#ffffff',
  successContainer: '#d1fae5',
  warning: '#b45309',
  warningContainer: '#fef3c7',
  ultraSecondary: '#2170e4',
  ultraOnSecondary: '#ffffff',
}

export const typography = {
  displayLg: { size: '3rem', lineHeight: '3.5rem', weight: 700 },
  displayLgMobile: { size: '2.25rem', lineHeight: '2.75rem', weight: 700 },
  headlineMd: { size: '2rem', lineHeight: '2.5rem', weight: 600 },
  headlineSm: { size: '1.5rem', lineHeight: '2rem', weight: 600 },
  bodyLg: { size: '1.125rem', lineHeight: '1.75rem', weight: 400 },
  bodyMd: { size: '1rem', lineHeight: '1.5rem', weight: 400 },
  labelMd: { size: '0.875rem', lineHeight: '1.25rem', weight: 500 },
  labelSm: { size: '0.75rem', lineHeight: '1rem', weight: 600 },
}

export const spacing = {
  compact: '0.5rem',
  comfortable: '1rem',
  loose: '2rem',
  gutter: '1.5rem',
  marginMobile: '1rem',
  marginDesktop: '2.5rem',
  stackSm: '0.25rem',
  stackMd: '0.75rem',
  stackLg: '1.5rem',
}

export const radius = {
  sm: '0.25rem',
  default: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
}

export const shadows = {
  card: '0 2px 4px rgb(15 23 42 / 0.05)',
  cardHover: '0 10px 25px -5px rgb(0 35 111 / 0.1)',
  elevated: '0 8px 16px rgb(15 23 42 / 0.1)',
  glass: '0 4px 20px rgb(15 23 42 / 0.05)',
}

export const motion = {
  fast: '150ms',
  standard: '250ms',
  slow: '500ms',
}

export const layout = {
  sidebarWidth: '16rem',
  headerHeight: '4rem',
  maxContentWidth: '90rem',
}
