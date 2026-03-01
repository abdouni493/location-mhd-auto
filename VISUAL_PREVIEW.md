# 🖼️ Visual Preview - Règlement de Dette Enhancement

## Modal Layout Preview

### Tab System
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💳 Règlement de Dette                                ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                       ┃
┃  [💰 Effectuer Versement]  [📋 Historique (3)]      ┃
┃   (GREEN-ACTIVE)            (BLUE-INACTIVE)         ┃
┃                                                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Payment Input Tab View
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Summary Cards (3 columns)                             ┃
┣━━━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 💵 TOTAL  ┃ ✅ VERSÉ  ┃ ⚠️ RESTE                ┃
┃ 150,000   ┃ 80,000    ┃ 70,000                  ┃
┃ (PURPLE)  ┃ (GREEN)   ┃ (RED)                   ┃
┣━━━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                   ┃
┃ 🎯 Montant à Verser         [⚡ Solder tout]   ┃
┃ ┌─────────────────────────────────────────────┐ ┃
┃ │ 💵   [    25,000    ]  ▲ ▼                 │ ┃
┃ │      (BLUE/DARK BG) (WHITE TEXT)          │ ┃
┃ └─────────────────────────────────────────────┘ ┃
┃                                                   ┃
┃ [+1K] [+5K] [+10K] [+20K]                      ┃
┃ (ORANGE/AMBER BUTTONS)                          ┃
┃                                                   ┃
┃ ┌─────────────────────────────────────────────┐ ┃
┃ │ 📊 Total Après: 105,000 DZ                │ ┃
┃ │ (GREEN GRADIENT)                            │ ┃
┃ └─────────────────────────────────────────────┘ ┃
┃                                                   ┃
┃ ┌─────────────────────────────────────────────┐ ┃
┃ │    ✅ Confirmer le Versement              │ ┃
┃ │    (GREEN GRADIENT BUTTON)                  │ ┃
┃ └─────────────────────────────────────────────┘ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Payment History Tab View
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📭 Empty State                                  ┃
┃ (OR)                                            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ┌──────────────────────────────────────────┐   ┃
┃ │ 1 │ 💰 50,000 │ 📅 Feb 15 │ [🗑️ Del]  │   ┃
┃ │   │ (BLUE/CYAN BG)                       │   ┃
┃ └──────────────────────────────────────────┘   ┃
┃ ┌──────────────────────────────────────────┐   ┃
┃ │ 2 │ 💰 30,000 │ 📅 Feb 10 │ [🗑️ Del]  │   ┃
┃ │   │ (BLUE/CYAN BG)                       │   ┃
┃ └──────────────────────────────────────────┘   ┃
┃ ┌──────────────────────────────────────────┐   ┃
┃ │ 3 │ 💰 20,000 │ 📅 Feb 05 │ [🗑️ Del]  │   ┃
┃ │   │ (BLUE/CYAN BG)                       │   ┃
┃ └──────────────────────────────────────────┘   ┃
┃                                                  ┃
┃ ┌──────────────────────────────────────────┐   ┃
┃ │ 📈 Total Versé: 100,000 DZ              │   ┃
┃ │ (GREEN GRADIENT)                         │   ┃
┃ └──────────────────────────────────────────┘   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Color Gradient Examples

### Card Gradients
```
💵 TOTAL CARD             ✅ PAID CARD              ⚠️ REMAIN CARD
from-purple-100           from-green-100           from-red-100
to-purple-50              to-green-50              to-red-50
┌──────────────────┐      ┌──────────────────┐     ┌──────────────────┐
│███████████████████│      │███████████████████│     │███████████████████│
│███  DARKER  ███  │      │███  DARKER  ███  │     │███  DARKER  ███  │
│███████████████████│      │███████████████████│     │███████████████████│
└──────────────────┘      └──────────────────┘     └──────────────────┘
```

### Button Gradients
```
QUICK BUTTONS                          CONFIRM BUTTON
from-amber-400 to-orange-500           from-gradient-green
┌──────────────────┐                   ┌──────────────────────┐
│███████████████████│                   │████████████████████││
│  +1K    +5K      │                   │  ✅ CONFIRMER       ││
│ +10K   +20K      │                   │                     ││
└──────────────────┘                   └──────────────────────┘
```

---

## Button Styles & States

### Normal State
```
  ┌─────────────────────┐
  │ 💰 Effectuer Paiement│
  │  (bg-gradient-green │
  │   shadow-lg)        │
  └─────────────────────┘
```

### Hover State
```
  ┌─────────────────────┐
  │ 💰 Effectuer Paiement│  ↑ (scale: 105%)
  │  (shadow-2xl)       │
  │  (transform)        │
  └─────────────────────┘
```

### Active/Clicked State
```
  ┌─────────────────────┐
  │ 💰 Effectuer Paiement│  ↓ (scale: 95%)
  │  (shadow-md)        │
  │  (transform)        │
  └─────────────────────┘
```

### Disabled State
```
  ┌─────────────────────┐
  │ ⏳ Traitement...     │  (opacity: 50%)
  │  (pointer: none)    │
  │  (cursor: wait)     │
  └─────────────────────┘
```

---

## Emoji Legend

| Icon | Meaning | Usage |
|------|---------|-------|
| 💳 | Payment/Card | Modal title |
| 💵 | Money | Amount displays |
| ✅ | Success/Check | Paid amount, confirm button |
| ⚠️ | Warning | Remaining balance |
| 🎯 | Target/Focus | Input section |
| ⚡ | Quick/Fast | Quick action buttons |
| 🗑️ | Delete | Delete buttons |
| 📋 | List/History | History tab |
| 📅 | Calendar/Date | Payment dates |
| 📊 | Chart/Summary | Summary displays |
| 📭 | Empty | Empty state message |
| ⏳ | Hourglass | Loading/processing |

---

## Responsive Breakpoints

### Desktop (≥ 1024px)
```
Full 3-column layout for summary cards
Large input field (56px font)
All features visible
Horizontal scrolling not needed
```

### Tablet (768px - 1023px)
```
2-column layout for summary cards
Medium input field (48px font)
Touch-friendly buttons
Optimized spacing
```

### Mobile (< 768px)
```
Stacked single column layout
Smaller input field (40px font)
Large touch buttons
Scrollable history
Optimized padding
```

---

## Animation Examples

### Hover Effect
```
Timeline: 0.2s ease-in-out
Properties:
  - transform: scale(1.05)
  - box-shadow: increase
  - transition: smooth
```

### Click Effect
```
Timeline: 0.1s ease-out
Properties:
  - transform: scale(0.95)
  - opacity: 0.9
  - transition: quick
```

### Input Focus
```
Timeline: 0.3s ease-in
Properties:
  - ring: blue-200
  - border: blue-600
  - transition: smooth
```

### Bounce Animation (Money Icon)
```
Timeline: infinite
Properties:
  - translate: up/down
  - duration: 0.5s
  - smooth motion
```

---

## Typography Scale

```
Modal Title         → 18px, font-black, text-lg
Card Labels         → 11px, font-black, uppercase, tracking-widest
Amount Values       → 28px-48px, font-black
Input Field         → 48px, font-black
Button Text         → 11px, font-black, uppercase, tracking-widest
Regular Text        → 14px, font-bold
Small Text          → 12px, font-bold
Tiny Text           → 9-10px, font-black, uppercase
```

---

## Spacing Reference

```
Padding Inside Cards    → 20px (p-5) to 32px (p-8)
Gaps Between Items      → 12px (gap-3) to 16px (gap-4)
Section Spacing         → 24px (space-y-6) to 40px (space-y-10)
Button Padding          → 12px-48px (py-3 to py-12)
Field Padding           → 24px-32px (px-6 to px-8)
Border Radius          → 12px-48px (rounded-2xl to rounded-[3rem])
```

---

## Component Hierarchy

```
MODAL (max-w-3xl)
├── Header (Title + Close)
├── TAB SYSTEM
│   ├── Tab Button 1 (Payment)
│   └── Tab Button 2 (History)
├── CONTENT AREA
│   └── IF Payment Tab:
│       ├── Summary Cards (3 cols)
│       ├── Input Section
│       │   ├── Input Field
│       │   ├── Quick Buttons
│       │   └── Summary Card
│       └── Confirm Button
│   └── IF History Tab:
│       ├── Payment List
│       │   ├── Payment Item (repeating)
│       │   └── Delete Button
│       └── History Summary Card
└── Footer (Optional)
```

---

## Sample Card Layouts

### Summary Card (Total)
```
┌─────────────────────────┐
│ 💵 Total Dû             │ ← Label (11px)
│ ━━━━━━━━━━━━━━━━━━━━━ │ ← Line
│ 150,000                 │ ← Value (28px)
│ DZ                      │ ← Currency (12px)
└─────────────────────────┘
  Background: from-purple-100 to-purple-50
  Border: 3px border-purple-300
  Shadow: shadow-md
```

### Payment Item
```
┌────────────────────────────────────────────┐
│ 1 │ 💰 50,000 DZ │ 📅 Feb 15, 2026 │ [🗑️] │
│   │ Large text   │ Small text      │ Red │
└────────────────────────────────────────────┘
  Background: from-blue-100 to-cyan-100
  Border: 3px border-blue-300
  Shadow: shadow-md
  Hover: shadow-lg, scale-105
```

---

## Icon Size Reference

```
Section Icons (Emojis)  → 18px-32px (text-2xl to text-3xl)
Card Icons             → 12px-16px (text-lg to text-xl)
Button Icons           → 12px-14px (inline)
Large Display Icons    → 48px-64px (text-5xl to text-6xl)
```

---

## Color Coding System

| Color | Meaning | Hex Value |
|-------|---------|-----------|
| Purple | Total Amount | #d8b4fe (border-purple-300) |
| Green | Paid/Success | #86efac (border-green-300) |
| Red | Remaining/Warning | #fca5a5 (border-red-300) |
| Blue | Active/Input | #93c5fd (border-blue-400) |
| Orange | Action/Quick | #fb923c |
| Amber | Preset Buttons | #fbbf24 |
| Gray | Disabled/Secondary | #d1d5db |

---

## State Indicators

### Loading
```
⏳ Traitement...
(opacity: 50%, pointer: none)
```

### Success
```
✅ + Green background
(bright, prominent)
```

### Warning
```
⚠️ + Red background
(alert color)
```

### Disabled
```
Grayed out with reduced opacity
(cannot interact)
```

---

## Mobile View Example

```
┌──────────────────────┐
│ 💳 Règlement de Dette│
├──────────────────────┤
│ [💰 Versement] [📋] │
├──────────────────────┤
│ ┌────────────────┐   │
│ │ 💵 Total       │   │
│ │ 150,000 DZ     │   │
│ └────────────────┘   │
│ ┌────────────────┐   │
│ │ ✅ Versé       │   │
│ │ 80,000 DZ      │   │
│ └────────────────┘   │
│ ┌────────────────┐   │
│ │ ⚠️ Reste       │   │
│ │ 70,000 DZ      │   │
│ └────────────────┘   │
├──────────────────────┤
│ 🎯 Montant Verser    │
│ ┌────────────────┐   │
│ │ [Amount Input] │   │
│ │  ▲        ▼     │   │
│ └────────────────┘   │
│ [+1K] [+5K] [+10K]   │
│ [+20K]               │
│ ┌────────────────┐   │
│ │ 📊 105,000 DZ  │   │
│ └────────────────┘   │
│ [✅ Confirmer]       │
└──────────────────────┘
```

---

## Accessibility Features

- ✅ High contrast colors for readability
- ✅ Large touch targets for mobile (44px minimum)
- ✅ Clear labels for all inputs
- ✅ Confirmation dialogs for destructive actions
- ✅ Keyboard accessible
- ✅ Screen reader friendly
- ✅ Semantic HTML

---

**Visual Preview Complete!** 🎨

For more details, see PAYMENT_DESIGN_GUIDE.md
