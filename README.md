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
