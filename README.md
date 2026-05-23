# Jyotish Kundli PWA

Offline-first React + TypeScript + Vite Progressive Web App starter with multilingual support, IndexedDB persistence, and local-first testing workflow.

## Stack

- React 18 + TypeScript (strict mode)
- Vite 5
- `vite-plugin-pwa` with `injectManifest`
- Dexie.js for IndexedDB
- i18next + react-i18next
- Zustand for app state
- Vitest + React Testing Library
- Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

## Environment variables (optional features)

Create a `.env.local` in the project root (Vite reads `VITE_*` variables):

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | Enables the **map location picker** on Home and Kundli. Enable **Maps JavaScript API** and **Geocoding API** on your Google Cloud project (billing may be required). Without a key, map buttons still appear but show a short setup message instead of a map. |
| `VITE_NARRATIVE_API_URL` | HTTPS endpoint for **“Details about me”** (POST JSON body from `buildNarrativeSummary`). Your server should return JSON `{ "narrative": "..." }` or plain text. |
| `VITE_NARRATIVE_API_KEY` | Optional header auth (`Authorization: Bearer …` and `X-Api-Key`) for that endpoint. **Browser-exposed keys are only for prototypes**; use a serverless proxy or user-supplied keys in production. |

Online narrative runs only if the user enables **Allow online narrative** in Settings and the URL is configured.

## Astrology calculations

Charts and Panchang use **geocentric ecliptic longitudes** from [`astronomy-engine`](https://github.com/cosinekitty/astronomy) (Sun, Moon, and major planets), converted to the **sidereal zodiac** using a user-selectable **ayanāṃśa** in **Settings**:

- **Drik Gaṇita (default)** — **True Chitrāpakṣa**: the ayanāṃśa at each instant is chosen so **Spica (α Vir)** has sidereal longitude **180°** (observational / “drik” anchor, similar in spirit to Swiss Ephemeris `TRUE_CITRA`).
- **Lahiri** — linear **Chitrapaksha** model anchored at J2000 (close to Swiss Ephemeris `LAHIRI` for modern dates).

**Lagna** uses mean obliquity, local sidereal time from UT + longitude, and the standard ecliptic ascendant formula, then subtracts the same ayanāṃśa as the planets.

- **Houses** are **whole sign from sidereal lagna** (each rāśi = one house).
- **Rāhu / Ketu** use the **true** lunar ascending node (Meeus-style correction to the mean node); **Ketu** is Rāhu + 180°.
- **Birth time**: for birth places inside India (rough bounding box), date and time from the form are read as **Asia/Kolkata (IST)** civil time. Outside that box they are read as **UTC** until a timezone control is added.
- **Panchang** tithi / yoga / nakṣatra use the same sidereal Sun/Moon; sunrise/sunset use SunCalc (and optional USNO-style API on Home).

South chart and downloaded patrikā **do not show degree/minute text** on grahas—only **navāṁśa pada (1–9)** in parentheses. The planet table on the Kundli page lists **navāṁśa** and **dvādaśāṁśa** without the full ecliptic degree column.

For **legal-grade** agreement with a given desktop program, match their **ayanāṃśa**, **node type**, **house system**, and **timezone**; this app documents its choices above.

## 🔄 Development Workflow (MANDATORY)

Every code change MUST follow this process:

### Step 1: Make Changes

- Edit code in your branch
- Save files

### Step 2: Run Local Check

```bash
npm run check
```

### Step 3: Review Locally

- Confirm tests pass
- Confirm app launches at local Vite URL
- Verify offline mode and language changes

### Step 4: Commit

- Stage only intended files
- Commit with a clear message

## Scripts

- `npm run dev`: kill conflicting ports and run Vite at `5173`
- `npm run build`: type-check and production build
- `npm run preview`: preview built app
- `npm run test`: run tests once
- `npm run test:watch`: run tests in watch mode
- `npm run test:ui`: open Vitest UI
- `npm run kill-ports`: stop local servers on common ports
- `npm run check`: enforce local test -> review -> dev flow
