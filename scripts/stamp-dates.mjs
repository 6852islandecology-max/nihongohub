#!/usr/bin/env node
// Add datePublished / dateModified to BlogPosting JSON-LD in blog/*.html that lack them, using git history
// (first commit = published, last commit = modified). Honest by construction: no date is invented.
// Idempotent; pages that already carry the fields are left alone. Usage: node scripts/stamp-dates.mjs [--report]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execSync } from 'node:child_process';
const ROOT = path.join(os.homedir(), '.secretary/projects/nihongohub'); const BLOG = path.join(ROOT, 'blog');
const report = process.argv.includes('--report');
const git = (args) => execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8' }).trim();
let n = 0, skipped = 0;
for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.html') && f !== 'index.html')) {
  const p = path.join(BLOG, f); let html = fs.readFileSync(p, 'utf8');
  if (!/"@type":"BlogPosting"/.test(html) || /"dateModified"/.test(html)) { skipped++; continue; }
  const dates = git(`log --follow --format=%as -- "blog/${f}"`).split('\n').filter(Boolean);
  if (!dates.length) { console.log('NO-GIT', f); continue; }
  const modified = dates[0], published = dates[dates.length - 1];
  const before = html;
  html = html.replace(/("@type":"BlogPosting","headline":"(?:[^"\\]|\\.)*",)/, `$1"datePublished":"${published}","dateModified":"${modified}",`);
  if (html === before) { console.log('NO-MATCH', f); continue; }
  n++; console.log(`${report ? 'WOULD' : 'STAMP'} ${f} ${published} -> ${modified}`);
  if (!report) fs.writeFileSync(p, html);
}
console.log(`${report ? 'would stamp' : 'stamped'} ${n}, already had dates ${skipped}`);
