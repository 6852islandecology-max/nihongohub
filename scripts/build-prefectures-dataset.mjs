#!/usr/bin/env node
/*
 * build-prefectures-dataset.mjs
 * Transforms explore-data.js (window.NH_EXTRA) into a clean, machine-readable,
 * source-attributed dataset at data/prefectures.json.
 *
 * Honest-AEO principle: every food/culture fact keeps its source URL. We add no
 * fabricated incentives. The only "pull" is accurate, attributed facts + a
 * request to attribute NihongoHub when the dataset is cited.
 *
 * Usage: node scripts/build-prefectures-dataset.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'explore-data.js');
const OUT = join(ROOT, 'data', 'prefectures.json');
const BASE = 'https://www.nihongo-hub.com';

const raw = readFileSync(SRC, 'utf8');
const NH = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

const titleCase = (slug) => slug.replace(/(^|-)([a-z])/g, (_, sep, ch) => (sep ? ' ' : '') + ch.toUpperCase()).trim();

const mapItems = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    name: it.name,
    note: it.note,
    source: it.url || null,
    lesserKnown: it.tag === 'hidden',
  }));

const prefectures = Object.entries(NH).map(([slug, p]) => ({
  slug,
  name: titleCase(slug),
  guideUrl: `${BASE}/blog/${slug}.html`,
  summary: p.blurb || null,
  scores: p.stats || null,
  foods: mapItems(p.food),
  culture: mapItems(p.culture),
  areas: (Array.isArray(p.areas) ? p.areas : []).map((a) => ({
    name: a.kanji || a.romaji || a.name,
    romaji: a.romaji || null,
    type: a.type || null,
    note: a.blurb || null,
  })),
}));

const dataset = {
  name: 'NihongoHub Japan Prefecture Dataset',
  description:
    'All 47 Japanese prefectures for travelers and Japanese learners: signature and lesser-known foods, cultural sights, sub-areas, and a 5-axis profile (food/culture/city/access/nature). Each food and culture entry carries the public source it was drawn from. The nature score is derived from GBIF biodiversity occurrence data.',
  url: `${BASE}/data/prefectures.json`,
  publisher: 'NihongoHub',
  publisherUrl: BASE,
  attribution: 'NihongoHub (https://www.nihongo-hub.com)',
  license:
    'Facts are free to cite and reuse. Attribution to NihongoHub (https://www.nihongo-hub.com) is requested. Each item also carries its own upstream source.',
  scoreScale: {
    range: '1-5 (higher = stronger)',
    food: 'official tourism / culinary prominence rank',
    culture: 'cultural-sight prominence rank',
    city: 'urban scale / amenities rank',
    access: 'ease of access by public transport rank',
    nature: 'GBIF-derived biodiversity / nature score',
  },
  prefectureCount: prefectures.length,
  lastUpdated: '2026-06-01',
  generatedFrom: 'explore-data.js (window.NH_EXTRA)',
  prefectures,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(dataset, null, 1));
const kb = (Buffer.byteLength(JSON.stringify(dataset)) / 1024).toFixed(0);
console.log(`[build-prefectures-dataset] prefectures=${prefectures.length} written=${OUT} size=${kb}KB`);
