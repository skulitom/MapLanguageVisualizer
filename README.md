# World Language Map

Interactive world map for exploring official and major languages by country.

## Features

- Zoom and pan world map with graticule overlay.
- Hover tooltip with country name, language list, and primary language family.
- Click country for a detailed side panel.
- Two visualization modes.
- `Highlight Languages`: select one or more languages and highlight countries where they are spoken.
- `Language Families`: color countries by their primary language family.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- D3 (`d3-geo`, `d3-scale`, `d3-scale-chromatic`, `d3-selection`)
- TopoJSON (`topojson-client`) and `world-atlas`

## Getting Started

Prerequisites:

- Node.js 20+
- npm 10+

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - type-check and build production bundle
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint

Data generation (one-time or when editing language data source script):

```bash
npx tsx scripts/prepare-language-data.ts
```

This rewrites:

- `src/data/country-code-map.json` (250 entries)
- `src/data/language-data.json` (200 country entries)
- `src/data/language-families.json` (102 language entries)

## Data Sources

- Runtime map geometry: `world-atlas/countries-110m.json` (loaded in `src/hooks/useWorldMapData.ts`).
- Country/language join and language metadata: generated static JSON in `src/data/`.
- Reference shapefiles in `map_data/` are Natural Earth admin-0 country files included for local reference.

## Project Structure

```text
src/
  components/
    controls/      # mode selector, language selector, country detail panel
    layout/        # header + main/sidebar layout
    map/           # map svg, tooltip, legend
  hooks/           # data loading, map interaction, responsive dimensions
  data/            # generated JSON datasets
  utils/           # color scales + data join helpers
scripts/
  prepare-language-data.ts
map_data/          # Natural Earth reference shapefiles
```

## Notes

- Language data is curated static data and is not exhaustive for every spoken language in each country.
- Family mode uses each country's `primaryFamily` field.
