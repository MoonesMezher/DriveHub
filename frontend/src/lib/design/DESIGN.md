# DriveHub Design System Reference

## Tokens

| Tailwind class | CSS variable | Use |
|----------------|--------------|-----|
| `bg-primary` | `--color-primary` | Primary actions, headings |
| `bg-surface-container-lowest` | `--color-surface-container-lowest` | Cards, inputs |
| `p-comfortable` | `--spacing-comfortable` | Card padding (md) |
| `p-loose` | `--spacing-loose` | Section spacing |
| `rounded-xl` | `--radius-xl` | Cards, buttons |
| `rounded-2xl` | `--radius-2xl` | Image cards |
| `rounded-3xl` | `--radius-3xl` | Hero sections |
| `shadow-card` | `--shadow-card` | Default elevation |
| `duration-standard` | `--duration-standard` | Hover transitions |

## Typography

- `text-display-lg` — Page heroes (public)
- `text-headline-md` — Section titles
- `text-headline-sm` — Card titles
- `text-body-md` — Default body
- `text-label-md` — Form labels, nav

## Components

### Layout
- `PageHeader` — All dashboard pages (title + description + actions)
- `Card` — Content containers (default/tinted/hoverable)
- `StatCard` — KPI metrics on home dashboards

### Forms
- `Input`, `Select`, `Textarea`, `Checkbox`, `Switch` — Form controls
- `FormField`, `FormSection` — Grouped form layouts

### Data
- `DataTable` — Tables with mobile card fallback
- `EmptyState` — No data / error / search states
- `Pagination` — List pagination
- `Skeleton` — Loading placeholders

### Marketing
- `ImageCard` — Visual cards with image overlay
- `SectionBlock`, `PageSection` — Public page sections
- `components/sections/*` — Reusable marketing blocks

## Page Patterns

### Public pages
```
space-y-loose
  SectionBlock / PageSection
  ImageCard grid
  CtaBanner
```

### CRUD dashboards
```
PageHeader variant="compact"
FilterBar (SearchInput + Select)
grid xl:grid-cols-[1fr_380px]
  DataTable + Pagination
  Form Card (sticky)
```

## RTL
Use logical properties: `start`/`end`, `ms`/`me`, `border-s`/`border-e`.
