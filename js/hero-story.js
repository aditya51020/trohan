// Hero story animation — see css/hero-story.css.
// A small time-based sequencer (no library): events fire at fixed times in a
// 15s job, then the next job (residential <-> commercial) starts. Pauses when
// the hero is off-screen, the tab is hidden, or the visitor presses pause.
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var root = document.querySelector('.hero-story');
    if (!root) return;

    var JOBS = [
      { scene: 'residential', tag: 'Residential', title: 'Panel upgrade to 200 A + new lighting' },
      { scene: 'commercial', tag: 'Commercial', title: 'Tenant build-out · LED + parking lot lighting' }
    ];
    var STEPS = ['Site visit & inspection', 'Quote approved', 'Permit filed', 'Wiring & installation', 'Safety inspection passed'];
    var DURATION = 15000;

    var $ = function (sel, el) { return (el || root).querySelector(sel); };
    var $$ = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };

    // Prepare every wire: measure its length and add a "current pulse" twin.
    $$('.hs-wire').forEach(function (wire) {
      var len = Math.ceil(wire.getTotalLength());
      wire.style.setProperty('--len', len);
      if (wire.classList.contains('hs-under')) return;
      var pulse = wire.cloneNode();
      pulse.setAttribute('class', 'hs-pulse');
      pulse.style.setProperty('--len', len + 'px');
      wire.parentNode.insertBefore(pulse, wire.nextSibling);
    });

    var van = $('.hs-van');
    var stamp = $('.hs-stamp');
    var stampText = $('.hs-stamp-text');
    var reqCard = $('.hs-request');
    var stepsCard = $('.hs-steps');
    var toast = $('.hs-toast');
    var stepEls = $$('.hs-steps li');
    var bar = $('.hs-progress span');

    function sceneEl() { return $('.hs-' + (root.getAttribute('data-scene') === 'commercial' ? 'com' : 'res')); }
    function setStep(i, state) {
      stepEls.forEach(function (li, k) {
        li.classList.toggle('is-done', k < i || (k === i && state === 'done'));
        li.classList.toggle('is-active', k === i && state === 'active');
      });
      var done = state === 'done' ? i + 1 : i;
      bar.style.setProperty('--p', (done / STEPS.length) * 100 + '%');
      $('[data-hs="current"]').textContent = done >= STEPS.length ? 'Power on — job complete ✓' : 'Step ' + (Math.min(i, STEPS.length - 1) + 1) + '/5 · ' + STEPS[Math.min(i, STEPS.length - 1)];
    }
    function on(els, cls, stagger) {
      els.forEach(function (el, k) {
        if (stagger) setTimeout(function () { el.classList.add(cls); }, k * stagger);
        else el.classList.add(cls);
      });
    }

    function reset(job) {
      root.setAttribute('data-scene', job.scene);
      $('[data-hs="tag"]').textContent = job.tag;
      $('[data-hs="title"]').textContent = job.title;
      $$('.is-drawn, .is-on, .is-in, .is-pass').forEach(function (el) {
        el.classList.remove('is-drawn', 'is-on', 'is-in', 'is-pass');
      });
      stampText.textContent = 'PERMIT FILED';
      setStep(0, 'pending');
    }

    // Timeline for one job (ms from job start).
    var EVENTS = [
      [0,     function (job) { reset(job); }],
      [150,   function () { reqCard.classList.add('is-in'); }],
      [450,   function () { stepsCard.classList.add('is-in'); }],
      [900,   function () { setStep(0, 'active'); van.classList.add('is-in'); }],
      [1700,  function () { $('.hs-scan', sceneEl()).classList.add('is-on'); }],
      [3000,  function () { $('.hs-scan', sceneEl()).classList.remove('is-on'); setStep(0, 'done'); setStep(1, 'active'); }],
      [4200,  function () { setStep(1, 'done'); setStep(2, 'active'); stamp.classList.add('is-on'); }],
      [5600,  function () { setStep(2, 'done'); setStep(3, 'active'); $('.hs-drop', sceneEl()).classList.add('is-drawn'); }],
      [6300,  function () { on($$('.hs-wire:not(.hs-drop)', sceneEl()), 'is-drawn', 250); }],
      [7600,  function () {
        $$('.hs-pulse', sceneEl()).forEach(function (p, k) { p.style.setProperty('--d', (k * 0.18) + 's'); p.classList.add('is-on'); });
      }],
      [8200,  function () {
        var sc = sceneEl();
        var floors = $$('.hs-floor', sc);
        if (floors.length) {
          floors.slice().reverse().forEach(function (f, k) { setTimeout(function () { on($$('.hs-light', f), 'is-on', 60); }, k * 380); });
          setTimeout(function () { on($$('.hs-sign, .hs-cone', sc), 'is-on', 200); }, 1150);
        } else {
          on($$('.hs-light', sc), 'is-on', 260);
        }
      }],
      [9900,  function () {
        setStep(3, 'done'); setStep(4, 'active');
        stamp.classList.remove('is-on'); void stamp.getBoundingClientRect();
        stampText.textContent = 'INSPECTION PASSED'; stamp.classList.add('is-on', 'is-pass');
      }],
      [11200, function () { setStep(4, 'done'); toast.classList.add('is-in'); $$('.hs-pulse', sceneEl()).forEach(function (p) { p.classList.remove('is-on'); }); }],
      [14100, function () { [reqCard, stepsCard, toast].forEach(function (c) { c.classList.remove('is-in'); }); van.classList.remove('is-in'); stamp.classList.remove('is-on'); }]
    ];

    // Long stamp text needs a wider plate.
    var plate = $('.hs-stamp rect');
    new MutationObserver(function () {
      var w = stampText.textContent.length > 13 ? 200 : 150;
      plate.setAttribute('width', w); stampText.setAttribute('x', w / 2);
    }).observe(stampText, { childList: true, characterData: true, subtree: true });

    // Sequencer.
    var t = 0, next = 0, jobIndex = 0, last = null;
    var paused = false, inView = true;
    function running() { return !paused && inView && !document.hidden; }
    function tick(now) {
      if (last === null) last = now;
      var dt = Math.min(now - last, 100);
      last = now;
      if (running()) {
        t += dt;
        while (next < EVENTS.length && EVENTS[next][0] <= t) { EVENTS[next][1](JOBS[jobIndex]); next++; }
        if (t >= DURATION) { t = 0; next = 0; jobIndex = (jobIndex + 1) % JOBS.length; }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Pause button.
    var btn = $('.hs-toggle');
    btn.addEventListener('click', function () {
      paused = !paused;
      root.classList.toggle('is-paused', paused);
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    });

    // Off-screen -> pause.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        root.classList.toggle('is-paused', paused || !inView);
      }, { threshold: 0.15 }).observe(root);
    }

    // Debug/test hook: jump the sequencer to a time (ms) in the current job.
    window.__heroStory = {
      seek: function (ms) { while (next < EVENTS.length && EVENTS[next][0] <= ms) { EVENTS[next][1](JOBS[jobIndex]); next++; } t = ms; },
      nextJob: function () { t = DURATION; },
      state: function () { return { t: Math.round(t), job: JOBS[jobIndex].scene, next: next }; }
    };
  });
})();
