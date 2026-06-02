# Municipality drill-down data (N03) — pipeline & format

For the next phase of `prefectures.html`: clicking a prefecture opens a
**clickable municipal map** (cities / wards / towns). Geometry comes from
the government's **N03 行政区域データ (MLIT 国土数値情報)**.

## Why lazy-load per prefecture
Raw N03 for all 47 prefectures is tens of MB — far too heavy to ship in one
page. So we **simplify + split per prefecture** and load `data/n03/<slug>.json`
only when that prefecture is opened (`municipality-demo.html` shows the renderer).

## Data source & license
- **N03 行政区域データ** — MLIT 国土数値情報 (https://nlftp.mlit.go.jp/ksj/).
  Free to use including commercially; **attribution required** ("国土数値情報（行政区域データ）国土交通省").
- Add that attribution to any production page that renders this data.

## Build pipeline (per prefecture)
Requires `mapshaper` (npm i -g mapshaper). `scripts/build-n03.mjs` wraps this:

```
# 1. download the N03 GeoJSON for one prefecture (by JIS code, e.g. 13 = Tokyo)
# 2. simplify to ~5% to cut weight while keeping shape
mapshaper n03_13.geojson \
  -simplify 5% keep-shapes \
  -each 'name=N03_004, romaji=""' \
  -filter-fields name,romaji \
  -o format=svg target=* id-field=name
# → extract per-feature SVG path "d" attributes into data/n03/13.json
```

## Output format consumed by the renderer
`data/n03/<slug>.json`:
```json
{
  "pref": "Tokyo",
  "viewBox": "0 0 100 100",
  "areas": [
    { "name": "渋谷区", "romaji": "Shibuya", "blurb": "…", "d": "M.. Z" }
  ]
}
```
`tokyo-sample.json` in this folder is a **schematic placeholder** (clearly
labelled) so the renderer can be demonstrated before real N03 data is built.

## Integration plan (after a real <slug>.json exists)
Fold the `loadMunicipalities()` renderer from `municipality-demo.html` into
`prefectures.html`'s SUB-AREAS block: on prefecture open, `fetch` the file;
on 404, keep the current text cards (no regression).
