#!/usr/bin/env node
// Apply photo QC verdicts: remove BAD tiles from blog/img-credits-multi.json (the page builders skip missing keys),
// keep a log of UNSURE tiles for owner review. Usage: node scripts/apply-photo-qc.mjs qc-a.json [qc-b.json ...]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const CRED = path.join(os.homedir(), '.secretary/projects/nihongohub/blog/img-credits-multi.json');
const LOG = path.join(os.homedir(), '.secretary/projects/nihongohub/blog/photo-qc-log.json');
const c = JSON.parse(fs.readFileSync(CRED, 'utf8')); const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : { removed: [], unsure: [] };
let removed = 0, unsure = 0;
for (const f of process.argv.slice(2)) for (const v of JSON.parse(fs.readFileSync(f, 'utf8'))) {
  const rec = c[v.slug]?.[v.key]; if (!rec) continue;
  if (v.verdict === 'BAD') { log.removed.push({ ...v, file: rec.file, title: rec.title, source: rec.fetched_from }); try { fs.unlinkSync(path.join(path.dirname(CRED), rec.file)); } catch {} delete c[v.slug][v.key]; removed++; }
  else { log.unsure.push({ ...v, file: rec.file, title: rec.title }); unsure++; }
}
fs.writeFileSync(CRED, JSON.stringify(c, null, 2)); fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
console.log(`removed ${removed}, unsure ${unsure} -> ${LOG}`);
