---
name: DriveHub
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#4b1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e2c00'
  on-tertiary-container: '#f39461'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#773205'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  compact: 0.5rem
  comfortable: 1rem
  loose: 2rem
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
---

## Brand & Style
The design system is engineered for a driving school management platform that balances institutional authority with modern accessibility. The visual narrative is "Safe & Systematic," drawing inspiration from the clarity and precision of road infrastructure and modern logistics. 

The aesthetic adheres to **Corporate Modernism**, utilizing a structured grid, generous whitespace, and a high-contrast palette to ensure complex scheduling and student data remain legible. The emotional goal is to provide instructors with a sense of control and students with a sense of reliable progress. The system is designed with a "Mobile-First for Instructors, Dashboard-First for Admin" mentality, ensuring seamless utility across devices.

## Colors
This design system uses a palette grounded in trust and visibility. 

- **Primary (Deep Blue):** Used for navigation, primary actions, and brand reinforcement. It represents the "Road Authority."
- **Secondary/Warning (Amber):** Inspired by safety signage, this is reserved for high-visibility calls to action, cautionary alerts, and scheduled items requiring attention.
- **Surface & Background:** A clean `Slate-50` background ensures the white `Surface` cards pop with clarity.
- **Semantic Colors:** Success (Emerald) and Error (Ruby) are optimized for high contrast against white backgrounds to ensure critical status updates are immediately recognizable in both LTR and RTL contexts.

## Typography
IBM Plex Sans is the cornerstone of this design system, chosen for its exceptional legibility in both Arabic and English scripts. 

- **Scale:** The system uses a major-third typographic scale. 
- **Alignment:** For the primary Arabic interface, text is right-aligned with adjusted line-heights to accommodate the vertical characteristics of Arabic glyphs.
- **Hierarchy:** Use `Bold (700)` or `SemiBold (600)` for section headers to provide a strong visual anchor. `Medium (500)` is reserved for UI labels and button text to maintain clarity without overwhelming the user.

## Layout & Spacing
The layout uses a **Fluid Grid** system optimized for data density.

- **Desktop:** 12-column grid with 24px gutters. Dashboard widgets should span 3, 4, 6, or 12 columns.
- **Mobile:** Single column with 16px margins.
- **RTL Support:** Spacing logic is mirrored. Margins applied to the 'left' in LTR are applied to the 'right' in RTL.
- **Rhythm:** An 8px linear scale is used for all internal component spacing (8, 16, 24, 32, 40, 48, 64) to ensure a consistent vertical rhythm.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and subtle, directional shadows that mimic a natural light source.

- **Level 0 (Background):** Flat, Slate-50.
- **Level 1 (Cards/Inputs):** White surface with a 1px border (#E2E8F0) and a soft, low-opacity shadow (Y: 2px, Blur: 4px, Color: rgba(15, 23, 42, 0.05)).
- **Level 2 (Dropdowns/Modals):** Increased shadow depth (Y: 8px, Blur: 16px, Color: rgba(15, 23, 42, 0.1)) to indicate a clear separation from the workspace.
- **Interaction:** On hover, interactive cards should slightly "lift" by increasing shadow spread and shifting 2px upward.

## Shapes
The shape language is "Approachable Geometric." 

- **Base Radius:** 8px (0.5rem) for standard components like buttons, input fields, and small cards.
- **Large Radius:** 16px (1rem) for main dashboard containers and modal overlays.
- **Full Radius:** Used exclusively for status badges and progress indicators (pill-shaped) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid #1E3A8A with white text. 8px radius.
- **Secondary:** Outline #1E3A8A or Solid Amber (#F59E0B) for urgent actions like "Book Now."
- **States:** Hover states should be 10% darker. Active states should involve a slight scale-down (98%) to provide tactile feedback.

### Inputs
- **Style:** 1px border (#CBD5E1) with 8px radius. On focus, the border shifts to Primary Blue with a 3px soft outer glow.
- **RTL:** Icons (like search or calendar) should be flipped to the left side of the input for Arabic users.

### Cards
- **Structure:** Clean white background, 8px padding (Compact) or 16px padding (Comfortable). Headers within cards should have a subtle bottom divider.

### Badges & Status
- **Success Badge:** Soft green background with dark green text.
- **Warning/Pending Badge:** Soft amber background with dark brown text.
- **Design:** Pill-shaped (full roundedness) to avoid confusion with buttons.

### Navigation
- **Sidebar:** Vertical navigation on the right for Arabic, left for English. Use "Active State" markers (a 4px vertical bar) in the Primary color.

### Map Markers
- **Style:** Teardrop shape using the Primary Blue for standard locations and the Secondary Amber for current live vehicle locations. Must include high-contrast white icons inside the marker.

### Accordions (FAQ)
- **Style:** Bordered top/bottom only to maintain a clean flow. Use a chevron icon that rotates 180 degrees on expansion.