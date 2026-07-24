#!/usr/bin/env node
/*
 * apply-geo-summaries.mjs
 * Merge data/geo-summaries-overlay.json into data/prefectures.json, filling the prefecture
 * summaries the dataset generator leaves null. Keeps these page-grounded summaries durable
 * across regeneration of prefectures.json. Idempotent (writes only when something changes).
 *
 * Content build order: build-prefectures-dataset.mjs -> apply-geo-summaries.mjs -> inject-evidence.mjs
 *
 * Usage: node scripts/apply-geo-summaries.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'prefectures.json');
const DRY = process.argv.includes('--dry');

const overlay = JSON.parse(readFileSync(join(ROOT, 'data', 'geo-summaries-overlay.json'), 'utf8'));
const data = JSON.parse(readFileSync(DATA, 'utf8'));

let filled = 0;
for (const p of (data.prefectures || [])) {
  const s = overlay[p.slug];
  if (typeof s === 'string' && p.summary !== s) { p.summary = s; filled++; }
}

if (filled && !DRY) {
  data.lastUpdated = '2026-06-15';
  writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n');
}
console.log(`[apply-geo-summaries] ${DRY ? 'would-fill' : 'filled'}=${filled}`);
