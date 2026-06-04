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
    PRICE_SET: '$19.99'
  });

  function wire() {
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
