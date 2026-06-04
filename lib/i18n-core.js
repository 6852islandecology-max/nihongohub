/* lib/i18n-core.js — chrome-only translations (nav / footer / chip) for the shared
 * site chrome injected by lib/site-chrome.js. Loaded BEFORE site-chrome.js.
 *
 * Scope is deliberately tiny: only the strings the shared header/footer/chip render.
 * Per-page content dictionaries (T / QT / PX) stay inline in each page — do NOT migrate them here.
 * site-chrome paints these onto elements carrying data-i18n-chrome (a distinct attribute from
 * each page's own data-i18n), so it never collides with a page's setLang/applyLang. */
window.NH_I18N = {
  en: { nav_home:'Home', nav_leveltest:'🎯 Level test', nav_quiz:'⚔️ Quiz', nav_explore:'🗾 Explore',
        nav_journey:'⚔ My Journey', nav_dashboard:'📊 Dashboard', nav_culture:'📖 Culture', nav_reloc:'🏡 Relocation',
        nav_pricing:'💴 Pricing', nav_shadowing:'🎙 Shadowing',
        chip_login:'Log in', foot_tag:'Master Japanese · Explore Japan',
        foot_home:'Home', foot_quiz:'Quiz', foot_explore:'Explore', foot_pricing:'Pricing', foot_about:'About' },
  ja: { nav_home:'ホーム', nav_leveltest:'🎯 レベル測定', nav_quiz:'⚔️ クイズ', nav_explore:'🗾 探索',
        nav_journey:'⚔ 冒険の記録', nav_dashboard:'📊 ダッシュボード', nav_culture:'📖 カルチャー', nav_reloc:'🏡 移住ガイド',
        nav_pricing:'💴 料金', nav_shadowing:'🎙 シャドーイング',
        chip_login:'ログイン', foot_tag:'日本語を学び、日本を巡る',
        foot_home:'ホーム', foot_quiz:'クイズ', foot_explore:'探索', foot_pricing:'料金', foot_about:'概要' },
  zh: { nav_home:'首頁', nav_leveltest:'🎯 程度測驗', nav_quiz:'⚔️ 測驗', nav_explore:'🗾 探索',
        nav_journey:'⚔ 我的旅程', nav_dashboard:'📊 儀表板', nav_culture:'📖 文化', nav_reloc:'🏡 移居指南',
        nav_pricing:'💴 方案', nav_shadowing:'🎙 跟讀',
        chip_login:'登入', foot_tag:'學日語・探索日本',
        foot_home:'首頁', foot_quiz:'測驗', foot_explore:'探索', foot_pricing:'方案', foot_about:'關於' },
  es: { nav_home:'Inicio', nav_leveltest:'🎯 Tu nivel', nav_quiz:'⚔️ Quiz', nav_explore:'🗾 Explorar',
        nav_journey:'⚔ Mi viaje', nav_dashboard:'📊 Panel', nav_culture:'📖 Cultura', nav_reloc:'🏡 Mudanza',
        nav_pricing:'💴 Precios', nav_shadowing:'🎙 Shadowing',
        chip_login:'Entrar', foot_tag:'Aprende japonés · Explora Japón',
        foot_home:'Inicio', foot_quiz:'Quiz', foot_explore:'Explorar', foot_pricing:'Precios', foot_about:'Acerca de' },
  th: { nav_home:'หน้าแรก', nav_leveltest:'🎯 วัดระดับ', nav_quiz:'⚔️ ควิซ', nav_explore:'🗾 สำรวจ',
        nav_journey:'⚔ เส้นทางของฉัน', nav_dashboard:'📊 แดชบอร์ด', nav_culture:'📖 วัฒนธรรม', nav_reloc:'🏡 ย้ายมาญี่ปุ่น',
        nav_pricing:'💴 ราคา', nav_shadowing:'🎙 ชาโดว์อิ้ง',
        chip_login:'เข้าสู่ระบบ', foot_tag:'เรียนภาษาญี่ปุ่น · สำรวจญี่ปุ่น',
        foot_home:'หน้าแรก', foot_quiz:'ควิซ', foot_explore:'สำรวจ', foot_pricing:'ราคา', foot_about:'เกี่ยวกับ' },
  id: { nav_home:'Beranda', nav_leveltest:'🎯 Cek level', nav_quiz:'⚔️ Kuis', nav_explore:'🗾 Jelajah',
        nav_journey:'⚔ Perjalananku', nav_dashboard:'📊 Dasbor', nav_culture:'📖 Budaya', nav_reloc:'🏡 Pindah ke Jepang',
        nav_pricing:'💴 Harga', nav_shadowing:'🎙 Shadowing',
        chip_login:'Masuk', foot_tag:'Belajar bahasa Jepang · Jelajahi Jepang',
        foot_home:'Beranda', foot_quiz:'Kuis', foot_explore:'Jelajah', foot_pricing:'Harga', foot_about:'Tentang' }
};
