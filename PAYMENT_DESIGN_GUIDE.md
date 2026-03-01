# 🎨 Visual Design - Règlement de Dette

## Color Palette & Emojis

### Summary Cards
```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ 💵 Total Dû         │  │ ✅ Versé            │  │ ⚠️ Reste à Payer    │
│ ━━━━━━━━━━━━━━━━━━━ │  │ ━━━━━━━━━━━━━━━━━━━ │  │ ━━━━━━━━━━━━━━━━━━━ │
│ PURPLE GRADIENT     │  │ GREEN GRADIENT      │  │ RED GRADIENT        │
│ 150,000 DZ          │  │ 80,000 DZ           │  │ 70,000 DZ           │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Payment Input Section
```
┌──────────────────────────────────────────────────────┐
│ 🎯 Montant à Verser  [⚡ Solder tout]              │
├──────────────────────────────────────────────────────┤
│ BLUE/CYAN GRADIENT BACKGROUND                        │
│                                                       │
│  💵  ┌─────────────────────────┐   ▲                │
│      │         25,000          │   ▼                │
│      └─────────────────────────┘                     │
│                                                       │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐             │
│  │+1K DZ│  │+5K DZ│  │+10K DZ│ │+20K DZ│            │
│  └──────┘  └──────┘  └──────┘  └──────┘             │
│  AMBER/ORANGE GRADIENT BUTTONS                       │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📊 Total Versé Après: 105,000 DZ             │  │
│  │ (GREEN GRADIENT)                              │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Tabs Design

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  [💰 Effectuer un Versement]  [📋 Historique (3)]       │
│   (GREEN-ACTIVE)               (BLUE-INACTIVE)          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Payment History View

```
┌────────────────────────────────────────────────────────────┐
│  📭 Aucun versement enregistré                             │
│  (Empty State)                                             │
└────────────────────────────────────────────────────────────┘

OR

┌────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 1  │  💰 50,000 DZ  │  📅 Feb 15, 2026  │ [🗑️ Del] │  │
│ │    │  (BLUE/CYAN GRADIENT BACKGROUND)               │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 2  │  💰 30,000 DZ  │  📅 Feb 10, 2026  │ [🗑️ Del] │  │
│ │    │  (BLUE/CYAN GRADIENT BACKGROUND)               │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 3  │  💰 20,000 DZ  │  📅 Feb 05, 2026  │ [🗑️ Del] │  │
│ │    │  (BLUE/CYAN GRADIENT BACKGROUND)               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 📈 Total Versé via Historique: 100,000 DZ          │  │
│ │ (GREEN GRADIENT BACKGROUND)                          │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Modal Layout

```
╔════════════════════════════════════════════════════════════════╗
║ 💳 Règlement de Dette                                  [X]     ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  [💰 Payment Tab]  [📋 History Tab]                           ║
║                                                                ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            ║
║  │ 💵 Total Dû │  │ ✅ Versé    │  │⚠️ Reste     │            ║
║  │  150,000 DZ │  │  80,000 DZ  │  │  70,000 DZ  │            ║
║  └─────────────┘  └─────────────┘  └─────────────┘            ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────┐     ║
║  │ 🎯 Montant à Verser                                 │     ║
║  │ ┌────────────────────────────────────────────────┐  │     ║
║  │ │ 💵    [    25,000    ]  ▲ ▼                   │  │     ║
║  │ └────────────────────────────────────────────────┘  │     ║
║  │                                                      │     ║
║  │ [+1K] [+5K] [+10K] [+20K]                          │     ║
║  │                                                      │     ║
║  │ 📊 Total Versé Après: 105,000 DZ                   │     ║
║  └──────────────────────────────────────────────────────┘     ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────┐     ║
║  │        ✅ Confirmer le Versement                   │     ║
║  └──────────────────────────────────────────────────────┘     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

## Color Reference

### Gradients Used

| Purpose | Colors | Tailwind Classes |
|---------|--------|------------------|
| Total Amount | Purple | `from-purple-100 to-purple-50` |
| Paid Amount | Green | `from-green-100 to-green-50` |
| Remaining | Red | `from-red-100 to-red-50` |
| Input Area | Blue/Cyan | `from-blue-50 to-cyan-50` |
| Quick Buttons | Amber/Orange | `from-amber-400 to-orange-500` |
| Payment Summary | Green | `from-green-300 to-emerald-300` |
| History Items | Blue/Cyan | `from-blue-100 to-cyan-100` |
| History Summary | Green | `from-green-100 to-emerald-100` |

### Border Colors

| Element | Color | Hex |
|---------|-------|-----|
| Total Card | Purple | `#d8b4fe` (border-purple-300) |
| Paid Card | Green | `#86efac` (border-green-300) |
| Remaining Card | Red | `#fca5a5` (border-red-300) |
| Input Container | Blue | `#93c5fd` (border-blue-400) |

## Button States

### Normal State
```
┌─────────────────────┐
│  💰 Effectuer un V  │
│  (bg-gradient)      │
└─────────────────────┘
```

### Hover State
```
┌─────────────────────┐
│  💰 Effectuer un V  │
│  (shadow-lg)        │
│  (scale: 105%)      │
└─────────────────────┘
```

### Active State
```
┌─────────────────────┐
│  💰 Effectuer un V  │
│  (bg-gradient)      │
│  (scale: 95%)       │
└─────────────────────┘
```

### Disabled State
```
┌─────────────────────┐
│  ⏳ Traitement...   │
│  (opacity: 50%)     │
│  (pointer: none)    │
└─────────────────────┘
```

## Emoji Reference

| Action | Emoji | Usage |
|--------|-------|-------|
| Payment/Money | 💳💵💰 | Headers, amounts |
| Success | ✅ | Paid amounts, confirm buttons |
| Warning | ⚠️ | Remaining debt |
| Target | 🎯 | Input section |
| Quick Action | ⚡ | Pay all button |
| Delete | 🗑️ | Remove payment |
| History | 📋 | History tab |
| Date | 📅 | Payment dates |
| Empty | 📭 | No payments state |
| Chart | 📊 | Summary displays |
| Loading | ⏳ | Processing state |
| Bounce Icon | 💵 | Animated money icon |

## Typography

### Font Sizes
- Modal Title: `text-lg` (18px)
- Card Labels: `text-[11px]` (11px) - uppercase, bold
- Payment Amount: `text-3xl` or `text-5xl` - font-black
- Input Field: `text-5xl` - font-black
- Buttons: `text-[11px]` or `text-[10px]` - uppercase
- Summary: `text-4xl` - font-black

### Font Weights
- All titles and labels: `font-black` (900)
- Regular text: `font-bold`
- Input text: `font-black`

## Spacing

- Card padding: `p-5` to `p-8`
- Grid gaps: `gap-3` to `gap-4`
- Section spacing: `space-y-6` to `space-y-10`
- Internal padding: `px-6 py-3` to `px-8 py-10`

## Responsive Design

- **Desktop**: Full 3-column card layout
- **Tablet**: Grid adjusts to 2 columns
- **Mobile**: Stacked single column

---

**Design System Version**: 1.0  
**Last Updated**: February 28, 2026
