---
name: DriveHub Ultra
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 40px
  gutter: 24px
  section-gap: 64px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for a high-end enterprise SaaS experience that balances technical precision with premium aesthetics. The brand personality is **Professional, Trustworthy, and Tech-forward**, moving away from generic utility toward a more curated, editorial-tech feel. 

The visual style is **Modern Corporate with Glassmorphic accents**. It prioritizes extreme clarity and reduced cognitive load through generous whitespace and a refined hierarchy. The atmosphere is calm and focused, utilizing depth and light rather than heavy borders to define structure.

## Colors

The palette is anchored by a deep **Navy Primary** (`#0F172A`) to establish authority and trust. This is contrasted by an **Electric Blue Highlight** (`#3B82F6`) reserved for primary calls to action, active states, and focus indicators.

The surface system relies on a sophisticated range of "Slate" grays. Backgrounds use the lightest tint, while containers use white or semi-transparent glass layers. Text contrast is strictly maintained: Slate-900 for headings, Slate-600 for body, and Slate-400 for de-emphasized metadata.

## Typography

The typography system uses a dual-stack approach. **IBM Plex Sans** is utilized for headlines to provide a technical, structured feel with its distinct terminals. **Inter** handles all UI labels and body text for maximum legibility and neutrality.

For **Arabic support**, the system falls back to **IBM Plex Sans Arabic**, which maintains the same technical rigor and stroke consistency as the Latin glyphs. Headlines should utilize generous tracking (letter spacing) in Latin, but tracking should be reset to 0 for Arabic text to maintain script connectivity. All layouts must support RTL mirroring, ensuring icons that imply direction (arrows, progress bars) are flipped accordingly.

## Layout & Spacing

This design system employs a **12-column fluid grid** with a maximum content width of 1440px for desktop. To achieve the "high-end" feel, the grid uses wide 40px margins and 24px gutters, providing ample negative space for content to breathe.

**RTL Adaptation:**
- Layouts mirror along the vertical axis.
- Sidebar navigation moves from left to right.
- Padding-left becomes padding-right.
- The 12-column structure remains constant, but the flow of information starts from the top-right.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Ambient Shadows**. Instead of harsh borders, we use depth to define priority:

1.  **Level 0 (Base):** Light Slate background (`#F8FAFC`).
2.  **Level 1 (Cards):** Pure white surfaces with a soft, multi-layered shadow (0px 4px 20px rgba(15, 23, 42, 0.05)).
3.  **Level 2 (Overlays/Dropdowns):** Glassmorphic surfaces using `backdrop-filter: blur(12px)` and a subtle 1px semi-transparent white border to simulate light catching the edge.

Shadows are never pure black; they always carry a hint of the Primary Navy to keep the UI feeling cohesive and "expensive."

## Shapes

The shape language is consistently **Rounded**. Standard components like buttons and input fields use a `0.5rem` (8px) radius, while larger containers and cards utilize `1rem` (16px) or `1.5rem` (24px) to emphasize the soft, approachable nature of the high-end aesthetic. Pill shapes are reserved exclusively for status indicators and tags.

## Components

### Buttons
Primary buttons use the Navy background with white text. Secondary buttons are "Ghost" style with a subtle Slate-200 border. Transitions should be fluid (200ms ease-out).

### Input Fields
Inputs use a light background shift on hover rather than a heavy border change. Focus states use a 2px Electric Blue outer glow.

### Navigation
The navigation bar is "Floating" — detached from the top of the viewport with a glassmorphic background and a subtle shadow, making it feel like a lightweight layer above the content.

### Iconography
Icons utilize a thin 1.5pt stroke weight. They are never filled unless they are in an "active" state. In RTL mode, icons that denote linear progress or direction must be mirrored.

### Cards
Cards are the primary container unit. They should have no visible border, relying instead on the soft Level 1 shadow and 16px corner radius. Grouping within cards is achieved through subtle background shifts (e.g., a Slate-50 header section).