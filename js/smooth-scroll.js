// Smooth (inertia) scrolling for the whole site, using Lenis.
// Synced with GSAP ScrollTrigger so scroll reveals fire at the right moment.
// Same-page anchor links (#projects etc.) glide to their target below the 88px header.
(function () {
  if (typeof window.Lenis === 'undefined') return; // CDN failed -> normal browser scrolling

  var HEADER = 88;
  var lenis = new Lenis({
    lerp: 0.1,            // lower = smoother/slower; 0.1 is a calm, natural feel
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.2
  });
  window.trohanLenis = lenis;

  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
  }

  function targetFromHash(hash) {
    if (!hash || hash === '#') return null;
    try { return document.querySelector(decodeURIComponent(hash)); } catch (e) { return null; }
  }

  // Same-page anchors: smooth scroll instead of jumping.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || url.origin !== location.origin) return;
    var target = targetFromHash(url.hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -HEADER, duration: 1.2 });
    history.pushState(null, '', url.hash);
  });

  // Arriving from another page with a hash (e.g. index.html#projects).
  window.addEventListener('load', function () {
    var target = targetFromHash(location.hash);
    if (target) lenis.scrollTo(target, { offset: -HEADER, immediate: true });
  });
})();
