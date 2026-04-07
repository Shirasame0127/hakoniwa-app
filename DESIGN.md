# DESIGN.md — AI箱庭ライフOS

Inspired by Notion's warm neutral system. Clean, minimal, nature-forward.
Apply this spec to every UI component in the project.

---

## Visual Theme

**Personality**: Calm, grounded, alive. Like a Japanese garden — purposeful whitespace, warm neutrals, and pops of living green.
**Mode**: Light-first (dark mode future scope)
**Grid**: 8px base unit throughout

---

## Color Palette

### Base Neutrals (Warm — yellow-brown undertone)
```
--color-bg:          #FAFAF8   /* page background */
--color-surface:     #FFFFFF   /* card / panel */
--color-surface-2:   #F5F5F2   /* subtle section bg */
--color-border:      rgba(0,0,0,0.08)   /* whisper thin */
--color-border-mid:  rgba(0,0,0,0.12)   /* dividers */
```

### Text
```
--color-text-primary:   #1A1A17   /* headings */
--color-text-secondary: #6B6B5E   /* subtext */
--color-text-muted:     #9A9A8E   /* placeholders */
```

### Brand — Garden Green
```
--color-green-50:   #F0FDF4
--color-green-100:  #DCFCE7
--color-green-500:  #22C55E   /* primary CTA */
--color-green-600:  #16A34A   /* hover */
--color-green-700:  #166534   /* dark text on light */
--color-green-900:  #14532D   /* headings */
```

### Accent — Earth
```
--color-earth-amber: #D97706   /* warnings / food */
--color-earth-rust:  #DC2626   /* alerts */
--color-earth-sky:   #0EA5E9   /* links / info */
```

### Elevation (shadows stacked, each ≤ 5% opacity)
```
level-0: none
level-1: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)
level-2: 0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)
level-3: 0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.05)
```

---

## Typography

**Font**: Inter (system fallback: -apple-system, sans-serif)
**OpenType features**: `"cv01", "ss01"` (clean numerals)

| Role          | Size   | Weight | Tracking    | Leading |
|---------------|--------|--------|-------------|---------|
| Display XL    | 56px   | 700    | -1.8px      | 1.1     |
| Display L     | 40px   | 700    | -1.2px      | 1.15    |
| H1            | 32px   | 700    | -0.8px      | 1.2     |
| H2            | 24px   | 600    | -0.4px      | 1.3     |
| H3            | 18px   | 600    | -0.2px      | 1.4     |
| Body L        | 17px   | 400    | 0           | 1.6     |
| Body          | 15px   | 400    | 0           | 1.6     |
| Caption       | 13px   | 400    | 0.1px       | 1.5     |
| Label/Badge   | 11px   | 500    | 0.4px       | 1       |

---

## Components

### Buttons
```
Primary:
  bg: #22C55E   text: white   radius: 8px   px:16 py:9
  hover: bg #16A34A,  shadow level-1
  active: scale 0.98

Secondary:
  bg: rgba(0,0,0,0.04)   text: #1A1A17   border: 1px rgba(0,0,0,0.08)
  hover: bg rgba(0,0,0,0.07)

Ghost:
  bg: transparent   text: #6B6B5E
  hover: bg rgba(0,0,0,0.04)

Danger:
  bg: #DC2626   text: white
```

### Cards
```
bg: white
border: 1px solid rgba(0,0,0,0.08)
border-radius: 12px
padding: 24px
shadow: level-1
hover: shadow level-2, translateY(-1px)
transition: all 200ms ease
```

### Inputs
```
bg: white
border: 1px solid rgba(0,0,0,0.12)
border-radius: 8px
px: 12px   py: 9px
focus: border-color #22C55E, ring 3px rgba(34,197,94,0.15)
placeholder: #9A9A8E
```

### Navigation Bar
```
bg: white / backdrop-blur-sm (on scroll: bg white, shadow level-1)
height: 56px
border-bottom: 1px solid rgba(0,0,0,0.06)
logo: H3 weight 700 color #14532D
nav links: Body weight 500 color #6B6B5E
nav links hover: color #1A1A17
active link: color #22C55E
```

### Status / Progress Bar
```
track bg: rgba(0,0,0,0.06)   radius: 9999px   height: 6px
fill: linear-gradient(90deg, #22C55E, #16A34A)
```

### Badge / Level Chip
```
bg: #F0FDF4   color: #166534
border: 1px solid rgba(34,197,94,0.3)
radius: 9999px   px: 10px   py: 3px   font: Label
```

### Sidebar Panel
```
bg: #FAFAF8
border-right: 1px solid rgba(0,0,0,0.06)
width: 280px
section header: Caption UPPERCASE tracking-wide color muted
item: Body py:6 px:12 radius:6 hover:bg rgba(0,0,0,0.04)
item.active: bg rgba(34,197,94,0.08) color #166534 weight 500
```

---

## Layout

- Max content width: 1280px
- Page horizontal padding: 24px (mobile) → 40px (tablet) → 64px (desktop)
- Section vertical spacing: 64px → 96px → 120px
- Card gutter: 16px → 24px

---

## Spacing Scale (8px base)
```
2px, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 120px
```

---

## Motion
```
micro (hover, focus):  100–150ms  ease-out
standard (open, enter): 200ms    ease
expressive (page, canvas): 300ms cubic-bezier(0.16,1,0.3,1)
no motion for: background pulses, infinite spin
```

---

## Agent Implementation Notes

When implementing UI:
1. Use bg `#FAFAF8` for page, `#FFFFFF` for cards
2. All borders are `rgba(0,0,0,0.08)` — never solid gray
3. Green `#22C55E` for primary CTAs only, not decorations
4. Shadows are always multi-layer at low opacity
5. Body text is `#6B6B5E`, never pure black
6. Icon size: 16px inline, 20px standalone, 24px feature icons
7. Border-radius: 8px for inputs/buttons, 12px for cards, 16px for panels
