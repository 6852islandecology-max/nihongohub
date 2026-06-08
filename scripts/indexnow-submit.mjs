// scripts/indexnow-submit.mjs
// Submit all sitemap URLs to IndexNow (Bing, Yandex, Seznam, etc.).
// IndexNow is NOT used by Google — it complements Google Search Console.
//
// Usage:
//   node scripts/indexnow-submit.mjs            # submit every URL in sitemap.xml
//   node scripts/indexnow-submit.mjs <url> ...  # submit only the given URLs
//
// Prereq: the key file must already be live at
//   https://www.nihongo-hub.com/a9b851da9ef0103566aa28fa65fc7764.txt
// (commit + deploy it before running, or IndexNow rejects the key).

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOST = 'www.nihongo-hub.com';
const KEY = 'a9b851da9ef0103566aa28fa65fc7764';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const here = dirname(fileURLToPath(import.meta.url));

async function urlsFromSitemap() {
  const xml = await readFile(join(here, '..', 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const cliUrls = process.argv.slice(2);
  const urlList = cliUrls.length ? cliUrls : await urlsFromSitemap();
  if (!urlList.length) {
    console.error('No URLs to submit.');
    process.exit(1);
  }

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  // IndexNow returns 200 (accepted) or 202 (accepted, pending) on success.
  console.log(`Submitted ${urlList.length} URL(s) to IndexNow.`);
  console.log(`HTTP ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (text) console.log(text);
  if (res.status !== 200 && res.status !== 202) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
