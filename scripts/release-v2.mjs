#!/usr/bin/env node
/**
 * Staged release of the v2 prefecture guides.
 * Plan: blog/v2-release-plan.json = [{ date: 'YYYY-MM-DD', prefectures: [...] }, ...]
 * State: blog/v2-release.json (what is indexable now).
 *
 *   node scripts/release-v2.mjs --status          # what is released / due / pending
 *   node scripts/release-v2.mjs --due             # release every batch whose date <= today, rebuild, sitemap
 *   node scripts/release-v2.mjs kagawa ehime      # release specific prefectures now
 * Then: git add -A && git commit -m "release(v2): <slugs>" && git push   (deploy = git push only)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PLAN = ROOT + 'blog/v2-release-plan.json', STATE = ROOT + 'blog/v2-release.json';
const plan = JSON.parse(readFileSync(PLAN, 'utf8')), state = JSON.parse(readFileSync(STATE, 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const args = process.argv.slice(2);
if (args.includes('--status')) {
  console.log('released:', state.prefectures.join(' '));
  for (const b of plan) console.log(`${b.date} ${b.date <= today ? (b.prefectures.every(p => state.prefectures.includes(p)) ? 'done   ' : 'DUE    ') : 'pending'} ${b.prefectures.join(' ')}`);
  process.exit(0);
}
let add = args.filter(a => !a.startsWith('--'));
if (args.includes('--due')) add = plan.filter(b => b.date <= today).flatMap(b => b.prefectures);
add = add.filter(p => !state.prefectures.includes(p));
if (!add.length) { console.log('nothing to release'); process.exit(0); }
state.prefectures.push(...add);
writeFileSync(STATE, JSON.stringify(state, null, 2));
console.log('releasing:', add.join(' '));
execSync(`node scripts/build-guide-v2.mjs ${add.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
execSync('node scripts/build-hub-v2.mjs', { cwd: ROOT, stdio: 'inherit' });
execSync('node scripts/build-sitemap.mjs', { cwd: ROOT, stdio: 'inherit' });
console.log(`\nnext: git add -A && git commit -m "release(v2): ${add.join(' ')}" && git push`);
