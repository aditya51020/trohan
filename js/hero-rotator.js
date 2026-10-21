// Hero headline rotating word. All words are grid-stacked in the DOM up
// front; a data-state attribute ("in" | "out" | "idle") controls which one
// is visible, and the wrapper's width always follows the CURRENT word only
// (measured via a hidden clone) so a shorter word never leaves a gap.
// Degrades to the static first word (pre-rendered in the HTML) if JS is
// disabled or motion is reduced.
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var wrapper = document.querySelector('.hero-rotator');
    if (!wrapper) return;

    var words = (window.TrohanContent && window.TrohanContent.heroWords) || ['right.'];
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    wrapper.innerHTML = '';
    var wordEls = words.map(function (w, i) {
      var span = document.createElement('span');
      span.className = 'hero-rotator-word';
      span.textContent = w;
      span.setAttribute('data-state', i === 0 ? 'in' : 'idle');
      wrapper.appendChild(span);
      return span;
    });

    var measurer = document.createElement('span');
    measurer.className = 'hero-rotator-measure';
    wrapper.appendChild(measurer);

    var index = 0;

    function measure() {
      measurer.textContent = words[index];
      wrapper.style.width = measurer.getBoundingClientRect().width + 'px';
    }
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);

    // Reduced motion still rotates, but CSS turns the slide into a crossfade.
    if (words.length <= 1) return;

    var prevIndex = null;
    var timer = null;
    var offscreen = false;

    function advance() {
      var nextIndex = (index + 1) % words.length;
      if (prevIndex !== null) wordEls[prevIndex].setAttribute('data-state', 'idle');
      wordEls[index].setAttribute('data-state', 'out');
      wordEls[nextIndex].setAttribute('data-state', 'in');
      prevIndex = index;
      index = nextIndex;
      measure();
    }

    function play() {
      if (timer || document.hidden || offscreen) return;
      timer = setInterval(advance, 2500);
    }
    function pause() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else play();
    });

    if ('IntersectionObserver' in window) {
      var hero = wrapper.closest('.hero') || wrapper;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          offscreen = !entry.isIntersecting;
          if (offscreen) pause(); else play();
        });
      }, { threshold: 0.1 }).observe(hero);
    } else {
      play();
    }
  });
})();
