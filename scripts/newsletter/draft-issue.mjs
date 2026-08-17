#!/usr/bin/env node
// Draft one issue of "47 Notes from Japan" (one prefecture a week) from the same data the
// v2 guides are built from — nothing is invented here; every item exists on the site.
//   node scripts/newsletter/draft-issue.mjs tokushima        # draft for a slug
//   node scripts/newsletter/draft-issue.mjs --next           # next prefecture in rotation
// Writes: 成果物/Marketing/NihongoHub/newsletter/issues/<date>-<slug>.html (+ .txt, + .review.md)
// The owner reads the .review.md, edits the .html if wanted, then send-issue.mjs sends it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { ROOT, OUT_DIR, esc, today, loadState, saveState } from './lib.mjs';
import { GUIDES, REGION_LABELS } from '../../blog/guides-data.js';
import { EXTRA } from '../../blog/guides-extra.js';
import { SPOTS } from '../build-spots-v2.mjs';

const sandbox = { window: {} };
vm.runInNewContext(readFileSync(ROOT + 'explore-data.js', 'utf8'), sandbox);
const NH = sandbox.window.NH_EXTRA;
const CREDITS = JSON.parse(readFileSync(ROOT + 'blog/img-credits-multi.json', 'utf8'));
const ENRICHED = JSON.parse(readFileSync(ROOT + 'blog/guides-enriched.json', 'utf8'));
const RELEASE = JSON.parse(readFileSync(ROOT + 'blog/v2-release.json', 'utf8'));
const SITE = 'https://www.nihongo-hub.com';

const args = process.argv.slice(2);
let slug = args.find(a => !a.startsWith('--'));
const st = loadState(); st.issued = st.issued || [];
if (!slug && args.includes('--next')) {
  // rotation: released v2 prefectures first (they have the best landing page), then JIS order
  const order = [...RELEASE.prefectures, ...GUIDES.map(g => g.slug).filter(s => !RELEASE.prefectures.includes(s))];
  slug = order.find(s => !st.issued.includes(s)) || order[0];
}
if (!slug) { console.error('usage: node scripts/newsletter/draft-issue.mjs <slug> | --next'); process.exit(1); }

const g = GUIDES.find(x => x.slug === slug); if (!g) throw new Error('no guide ' + slug);
const nh = NH[slug] || {}, ex = { ...(EXTRA[slug] || {}), ...(ENRICHED[slug] || {}) };
const name = g.romaji, region = REGION_LABELS[g.region];
const released = RELEASE.prefectures.includes(slug);
const guideUrl = `${SITE}/blog/${slug}${released ? '-v2' : ''}.html`;
const hero = CREDITS[slug]?.hero || CREDITS[slug]?.tile1 || CREDITS[slug]?.see1 || null;
const tagline = (ex.tagline || g.lede || g.blurb || '').replace(/\.$/, '');
const blurb = nh.blurb || g.intro || g.blurb || '';
const history = ex.history || '';
const see = (nh.culture || []).slice(0, 3), eat = (nh.food || []).slice(0, 3);
const feed = (nh.feed || []).slice(0, 3);
const spots = Object.entries(SPOTS).filter(([, v]) => v.pref === slug).slice(0, 4);
const phrase = g.phrase || null, word = g.word || null;
const utm = (u, c) => u + (u.includes('?') ? '&' : '?') + `utm_source=newsletter&utm_medium=email&utm_campaign=47notes-${slug}&utm_content=${c}`;
const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q + ' ' + name + ' Japan')}`;

// ---------- HTML (inline CSS, single column, dark-mode friendly) ----------
const item = (it, i, kind) => `
  <tr><td style="padding:10px 0;border-top:1px solid #eee5d5">
    <div style="font:700 16px/1.35 Georgia,serif;color:#16100a">${esc(it.name)} ${it.tag === 'hidden' ? `<span style="font:600 11px/1 Arial,sans-serif;color:#bf3325;letter-spacing:.4px;vertical-align:middle">${kind === 'see' ? 'HIDDEN GEM' : 'LOCAL SECRET'}</span>` : ''}</div>
    <div style="font:15px/1.55 Arial,sans-serif;color:#4a4036;margin-top:3px">${esc(it.note || '')}</div>
    ${kind === 'see' ? `<div style="font:13px/1.5 Arial,sans-serif;margin-top:4px"><a href="${maps(it.name.split(' (')[0])}" style="color:#1f3a5f">Map</a>${it.url ? ` · <a href="${esc(it.url)}" style="color:#1f3a5f">Official site</a>` : ''}</div>` : ''}
  </td></tr>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(name)} — 47 Notes from Japan</title></head>
<body style="margin:0;padding:0;background:#f4efe6">
<span style="display:none;max-height:0;overflow:hidden;color:transparent">${esc(tagline)}. Where to go, what to eat, one phrase to say.</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe6"><tr><td align="center" style="padding:18px 10px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fffdf8;border-radius:12px;overflow:hidden">
  <tr><td style="padding:16px 22px 6px;font:700 12px/1 Arial,sans-serif;color:#c8911f;letter-spacing:.6px">47 NOTES FROM JAPAN · ${esc(region.toUpperCase())}</td></tr>
  <tr><td style="padding:0 22px 12px;font:700 28px/1.2 Georgia,serif;color:#16100a">${esc(name)}<br><span style="font:italic 17px/1.35 Georgia,serif;color:#6b5b3e">${esc(tagline)}</span></td></tr>
  ${hero ? `<tr><td><a href="${utm(guideUrl, 'hero')}"><img src="${SITE}/blog/${esc(hero.file)}" width="600" alt="${esc(hero.label)}" style="display:block;width:100%;height:auto"></a></td></tr>
  <tr><td style="padding:6px 22px 0;font:11px/1.4 Arial,sans-serif;color:#9a8b73">Photo: ${esc(hero.artist)} · ${esc(hero.license)}</td></tr>` : ''}
  <tr><td style="padding:16px 22px 0;font:16px/1.6 Arial,sans-serif;color:#2c2620">${esc(blurb)}${history ? `<br><br>${esc(history)}` : ''}</td></tr>

  <tr><td style="padding:22px 22px 0;font:700 13px/1 Arial,sans-serif;color:#c8911f;letter-spacing:.6px">WHAT TO SEE</td></tr>
  <tr><td style="padding:4px 22px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${see.map((it, i) => item(it, i, 'see')).join('')}</table></td></tr>

  <tr><td style="padding:22px 22px 0;font:700 13px/1 Arial,sans-serif;color:#c8911f;letter-spacing:.6px">WHAT TO EAT</td></tr>
  <tr><td style="padding:4px 22px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${eat.map((it, i) => item(it, i, 'eat')).join('')}</table></td></tr>

  ${(phrase || word) ? `<tr><td style="padding:22px 22px 0;font:700 13px/1 Arial,sans-serif;color:#c8911f;letter-spacing:.6px">SAY IT IN ${esc(name.toUpperCase())}</td></tr>
  <tr><td style="padding:8px 22px 0"><div style="background:#16100a;color:#f4efe6;border-radius:10px;padding:14px 16px">
    ${phrase ? `<div style="font:700 20px/1.3 'Hiragino Sans','Noto Sans JP',sans-serif">${esc(phrase.jp)}</div><div style="font:14px/1.4 Arial,sans-serif;color:#e9a23b">${esc(phrase.ro)}</div><div style="font:14px/1.5 Arial,sans-serif;color:#d8cdb8;margin-top:2px">${esc(phrase.en)}</div>` : ''}
    ${word ? `<div style="margin-top:${phrase ? '12px' : '0'};font:15px/1.5 Arial,sans-serif;color:#d8cdb8">Local word: <b style="color:#fff">${esc(word.jp)}</b> (${esc(word.ro)}) — ${esc(word.en)}</div>` : ''}
  </div></td></tr>` : ''}

  ${spots.length ? `<tr><td style="padding:22px 22px 0;font:700 13px/1 Arial,sans-serif;color:#c8911f;letter-spacing:.6px">SPOT GUIDES</td></tr>
  <tr><td style="padding:6px 22px 0;font:15px/1.7 Arial,sans-serif">${spots.map(([k, v]) => `<a href="${utm(`${SITE}/blog/spots/${k}.html`, 'spot')}" style="color:#1f3a5f">${esc(v.name)}</a> <span style="color:#9a8b73">— ${esc(v.tagline)}</span>`).join('<br>')}</td></tr>` : ''}

  ${feed.length ? `<tr><td style="padding:22px 22px 0;font:700 13px/1 Arial,sans-serif;color:#c8911f;letter-spacing:.6px">${esc(name.toUpperCase())} RIGHT NOW</td></tr>
  <tr><td style="padding:6px 22px 0;font:15px/1.7 Arial,sans-serif">${feed.map(f => `<a href="${esc(f.url)}" style="color:#1f3a5f">${esc(f.title)}</a> <span style="color:#9a8b73">· ${esc(f.source)}</span>`).join('<br>')}</td></tr>` : ''}

  <tr><td style="padding:24px 22px 8px" align="center"><a href="${utm(guideUrl, 'cta')}" style="display:inline-block;background:#bf3325;color:#fff;text-decoration:none;font:700 16px/1 Arial,sans-serif;padding:14px 22px;border-radius:8px">Read the full ${esc(name)} guide →</a>
  <div style="font:13px/1.5 Arial,sans-serif;color:#9a8b73;margin-top:8px">Access from Tokyo &amp; Osaka, real prices, hotels, and neighbours.</div></td></tr>

  <tr><td style="padding:18px 22px 22px;font:12px/1.6 Arial,sans-serif;color:#9a8b73;border-top:1px solid #eee5d5">
    You get this because you subscribed on nihongo-hub.com. One prefecture a week; reply to this email and a human answers.<br>
    NihongoHub · <a href="${SITE}/tokushoho.html" style="color:#9a8b73">Operator details</a> · <a href="${SITE}/blog/japan-prefectures.html" style="color:#9a8b73">All 47 prefectures</a> · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#9a8b73">Unsubscribe</a>
  </td></tr>
</table></td></tr></table></body></html>`;

// ---------- plain text ----------
const text = [
  `47 NOTES FROM JAPAN — ${name} (${region})`, tagline, '', blurb, history, '',
  'WHAT TO SEE', ...see.map(it => `- ${it.name}${it.tag === 'hidden' ? ' [hidden gem]' : ''}: ${it.note || ''}`), '',
  'WHAT TO EAT', ...eat.map(it => `- ${it.name}${it.tag === 'hidden' ? ' [local secret]' : ''}: ${it.note || ''}`), '',
  phrase ? `SAY IT: ${phrase.jp} (${phrase.ro}) — ${phrase.en}` : '', word ? `Local word: ${word.jp} (${word.ro}) — ${word.en}` : '', '',
  spots.length ? 'SPOT GUIDES\n' + spots.map(([k, v]) => `- ${v.name}: ${SITE}/blog/spots/${k}.html`).join('\n') : '',
  feed.length ? `${name.toUpperCase()} RIGHT NOW\n` + feed.map(f => `- ${f.title} (${f.source}): ${f.url}`).join('\n') : '', '',
  `Read the full guide: ${utm(guideUrl, 'cta')}`, '',
  'You get this because you subscribed on nihongo-hub.com. Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}',
].filter(l => l !== null && l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n');

const subject = `${name}: ${tagline}`;
const stamp = today();
mkdirSync(OUT_DIR + 'issues', { recursive: true });
const base = `${OUT_DIR}issues/${stamp}-${slug}`;
writeFileSync(base + '.html', html);
writeFileSync(base + '.txt', text);
writeFileSync(base + '.review.md', [
  `# 47 Notes from Japan — ${name} (draft ${stamp})`, '',
  `件名: ${subject}`, `送信ファイル: ${base}.html`, `ランディング: ${guideUrl} (${released ? 'v2 公開済' : 'classic — v2 は未公開'})`, '',
  '## 中身（すべてサイト既存データ、新規記述なし）',
  `- 見どころ ${see.length} 件（うち hidden ${see.filter(i => i.tag === 'hidden').length}） / 食 ${eat.length} 件 / フレーズ ${phrase ? 1 : 0} / 地元語 ${word ? 1 : 0} / スポット記事 ${spots.length} / right now ${feed.length}`,
  `- 写真: ${hero ? `${hero.label} — ${hero.artist} (${hero.license})` : 'なし'}`, '',
  '## 送る前に確認',
  '- [ ] right now のリンク先が生きているか（外部ニュース）',
  '- [ ] 文面に古い日付・価格が無いか',
  `- [ ] 送信: node scripts/newsletter/send-issue.mjs "${base}.html" --subject "${subject.replace(/"/g, '\\"')}" --test <自分のアドレス>  → 問題なければ --test を外す`, '',
  '編集したい場合は .html を直接直してから送る。',
].join('\n'));
st.lastDraft = { slug, stamp, subject, file: base + '.html' }; saveState(st);
console.log(`draft: ${base}.html\nsubject: ${subject}\nreview: ${base}.review.md`);
