/* lib/config.js — central runtime config for paid-product links (relocation guide set).
 *
 * Gumroad is not registered yet, so purchase CTAs currently route to the newsletter
 * ("notify at launch"). When the owner registers Gumroad later, flip TWO values below:
 *   GUMROAD_LIVE = true
 *   PRODUCT_URL  = '<your gumroad product url>'
 * …and every CTA marked with data-nh-buy switches to a real buy link automatically.
 * No build step: a DOMContentLoaded pass rewrites the marked anchors.
 *
 * Per-CTA opt-in markup:
 *   <a data-nh-buy="set"
 *      data-nh-newsletter="../index.html#newsletter"      (newsletter fallback href for this page depth)
 *      data-nh-label-wait="NOTIFY ME — 3-VOL SET $19.99 →" (label while not live)
 *      data-nh-label-live="GET 3-VOL SET $19.99 →"          (label once live)
 *      href="../index.html#newsletter">…</a>
 */
(function () {
  var CFG = (window.NH_CONFIG = {
    GUMROAD_LIVE: false,
    PRODUCT_URL: '', // e.g. 'https://fukuda.gumroad.com/l/japan-guide-set'
    PRICE_SET: '$19.99',

    /* --- Affiliate links (single source of truth) ----------------------------
     * Fill a value ONLY after a program is approved and you have your tracking
     * link/ID. Until then leave it '' and every <a data-aff="KEY"> keeps its
     * built-in fallback href (the generic, non-tracked link already in the page),
     * so nothing breaks and no fake-affiliate claim is made.
     *
     * Markup contract on each link:
     *   <a data-aff="klook"
     *      data-aff-fallback="https://www.klook.com/..."  (used while key is empty)
     *      href="https://www.klook.com/..."               (same as fallback)
     *      target="_blank" rel="sponsored noopener">Tours & tickets →</a>
     *
     * Routing rule (2026-05-04): travel affiliates only inside the 47-prefecture
     * blog articles + the moving guide — never bare in Substack/Medium/Reddit/Gumroad.
     * Keep a visible "PR / Affiliate" label near every affiliate link.
     * Progress + which program is approved: affiliates/registration-tracker.md
     * ------------------------------------------------------------------------ */
    AFFILIATES: {
      booking: '',      // Booking.com (hotels)
      klook: '',        // Klook — CJ / Involve Asia (tours, eSIM)
      viator: '',       // Viator — Awin / direct (experiences)
      getyourguide: '', // GetYourGuide (experiences)
      jrpass: '',       // JRPass.com (rail pass)
      airalo: '',       // Airalo (eSIM)
      magicaltrip: '',  // MagicalTrip (Japan tours)
      // learning programs (may be linked directly from Medium learning posts)
      italki: '',
      migaku: '',
      lingq: ''
    }
  });

  function wireBuy() {
    var live = !!(CFG.GUMROAD_LIVE && CFG.PRODUCT_URL);
    document.querySelectorAll('[data-nh-buy]').forEach(function (el) {
      var waitHref = el.getAttribute('data-nh-newsletter') || 'index.html#newsletter';
      if (live) {
        el.setAttribute('href', CFG.PRODUCT_URL);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
        if (el.dataset.nhLabelLive) el.textContent = el.dataset.nhLabelLive;
      } else {
        el.setAttribute('href', waitHref);
        el.removeAttribute('target');
        if (el.dataset.nhLabelWait) el.textContent = el.dataset.nhLabelWait;
      }
    });
  }

  function wireAff() {
    var aff = CFG.AFFILIATES || {};
    document.querySelectorAll('[data-aff]').forEach(function (el) {
      var key = el.getAttribute('data-aff');
      var approved = aff[key];
      var fallback = el.getAttribute('data-aff-fallback') || el.getAttribute('href');
      el.setAttribute('href', approved ? approved : (fallback || '#'));
      // keep target/rel as authored (sponsored noopener) — do not touch
    });
  }

  function wire() {
    wireBuy();
    wireAff();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
