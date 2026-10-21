// GSAP + ScrollTrigger motion system — see DESIGN.md §7.
// Degrades to a fully visible, static page if GSAP fails to load or the
// visitor prefers reduced motion.
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function showEverything() {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.opacity = 1;
    });
  }

  ready(function () {
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
      // GSAP failed to load (CDN down, offline, etc.) — don't leave the page half-hidden.
      document.documentElement.classList.remove('js');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.matchMedia().add(
      {
        motionOK: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)'
      },
      function (context) {
        if (context.conditions.reduced) {
          // Reduced motion (incl. Windows "Animation effects" off): no movement,
          // but keep gentle fades so the page still feels alive.
          initFadesOnly();
          return;
        }

        initHero();
        initReveals();
        initCountUp();
      }
    );
  });

  // CSS hides [data-reveal] (opacity 0) until JS runs, so every reveal must
  // animate TO an explicit opacity 1 (gsap.from would animate 0 -> 0).
  function reveal(el, fromVars, childVars) {
    var st = { trigger: el, start: 'top 80%', once: true };
    if (childVars) {
      gsap.set(el, { opacity: 1 });
      gsap.fromTo(el.children, childVars.from, Object.assign({ scrollTrigger: st }, childVars.to));
    } else {
      gsap.fromTo(el, fromVars.from, Object.assign({ scrollTrigger: st }, fromVars.to));
    }
  }

  // Reduced-motion version of rows 1–4: opacity only, no movement.
  function initFadesOnly() {
    var hero = document.querySelector('.hero .container');
    if (hero) gsap.from(hero.children, { opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var fade = { from: { opacity: 0 }, to: { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.12 } };
      if (el.getAttribute('data-reveal') === 'stagger') reveal(el, null, fade);
      else reveal(el, fade);
    });
  }

  // Row 1 — hero children rise + fade in on load, staggered.
  function initHero() {
    var hero = document.querySelector('.hero .container');
    if (!hero) return;
    gsap.from(hero.children, {
      yPercent: 40,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.12,
      delay: 0.1,
      clearProps: 'transform'
    });
  }

  // Rows 2–4 — scroll-triggered reveals, declared via data-reveal on markup.
  function initReveals() {
    document.querySelectorAll('[data-reveal="rise"]').forEach(function (el) {
      reveal(el, { from: { yPercent: 100, opacity: 0 }, to: { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', clearProps: 'transform' } });
    });
    document.querySelectorAll('[data-reveal="stagger"]').forEach(function (el) {
      reveal(el, null, { from: { y: '100%', opacity: 0 }, to: { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.25, clearProps: 'transform' } });
    });
    document.querySelectorAll('[data-reveal="fade"]').forEach(function (el) {
      reveal(el, { from: { opacity: 0 }, to: { opacity: 1, duration: 0.6, ease: 'power2.out' } });
    });
  }

  // Row 5 — stat count-up. Final value stays in the HTML; only used if a
  // page adds an element with [data-countup] (none exist in this build yet).
  function parseCountTarget(text) {
    var match = text.match(/^([\d.,]+)(.*)$/);
    if (!match) return null;
    return { value: parseFloat(match[1].replace(/,/g, '')), suffix: match[2] || '' };
  }

  function initCountUp() {
    document.querySelectorAll('[data-countup]').forEach(function (el, i) {
      var target = parseCountTarget(el.textContent.trim());
      if (!target) return;
      var counter = { value: 0 };
      gsap.to(counter, {
        value: target.value,
        duration: 3,
        ease: 'power2.out',
        delay: i * 0.15,
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top 80%', once: true },
        onUpdate: function () {
          el.textContent = Math.round(counter.value) + target.suffix;
        }
      });
    });
  }
})();
