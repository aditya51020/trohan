// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  var scrim = document.querySelector('.nav-scrim');

  // Pause smooth scrolling + page scroll while the mobile menu is open.
  function lockScroll(lock) {
    if (window.trohanLenis) { if (lock) window.trohanLenis.stop(); else window.trohanLenis.start(); }
    document.body.style.overflow = lock ? 'hidden' : '';
  }
  function closeNav() {
    nav.classList.remove('open');
    scrim.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    lockScroll(false);
  }
  function toggleNav() {
    var isOpen = nav.classList.toggle('open');
    scrim.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    lockScroll(isOpen);
  }
  if (nav) nav.setAttribute('data-lenis-prevent', ''); // let the menu itself scroll

  if (toggle && nav && scrim) {
    toggle.addEventListener('click', toggleNav);
    scrim.addEventListener('click', closeNav);
    // Close the menu when a real link is tapped (not the Services/About accordion toggles).
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (a.parentElement.classList.contains('has-dropdown') && window.innerWidth <= 991) return;
        if (nav.classList.contains('open')) closeNav();
      });
    });
    // Leaving mobile width with the menu open -> reset.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 991 && nav.classList.contains('open')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (nav.classList.contains('open')) {
        closeNav();
        toggle.focus();
      }
    });

    // Keep focus inside the mobile menu while it's open.
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !nav.classList.contains('open')) return;
      var focusable = nav.querySelectorAll('a, button');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // Mobile dropdown expand (Services / About menus)
  document.querySelectorAll('.has-dropdown > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 991) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });

  // Desktop dropdowns: ONE source of truth per dropdown — the data-open
  // attribute — set by hover, click/Enter/Space and keyboard alike, so
  // there's no separate CSS :hover trigger fighting the JS state.
  function canHover() {
    return window.matchMedia('(hover: hover)').matches;
  }

  document.querySelectorAll('.has-dropdown').forEach(function (item) {
    var link = item.querySelector('a');
    if (!link) return;
    var closeTimer = null;
    var open = false;

    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');
    item.setAttribute('data-open', 'false');

    function setOpen(next) {
      open = next;
      item.setAttribute('data-open', String(open));
      link.setAttribute('aria-expanded', String(open));
    }

    item.addEventListener('mouseenter', function () {
      if (!canHover() || window.innerWidth <= 991) return;
      clearTimeout(closeTimer);
      setOpen(true);
    });
    item.addEventListener('mouseleave', function () {
      if (!canHover() || window.innerWidth <= 991) return;
      closeTimer = window.setTimeout(function () { setOpen(false); }, 120);
    });

    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 991) return; // mobile accordion above handles this
      e.preventDefault();
      document.querySelectorAll('.has-dropdown[data-open="true"]').forEach(function (other) {
        if (other !== item) {
          other.setAttribute('data-open', 'false');
          var otherLink = other.querySelector('a');
          if (otherLink) otherLink.setAttribute('aria-expanded', 'false');
        }
      });
      setOpen(!open);
    });

    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && window.innerWidth > 991) {
        setOpen(false);
        link.focus();
      }
    });
  });

  document.addEventListener('mousedown', function (e) {
    document.querySelectorAll('.has-dropdown[data-open="true"]').forEach(function (item) {
      if (!item.contains(e.target)) {
        item.setAttribute('data-open', 'false');
        var link = item.querySelector('a');
        if (link) link.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Contact form: no server, so on submit we open the visitor's email app
  // with a message to Trohan already filled in — they just press Send.
  document.querySelectorAll('form[data-mail-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (name) { var el = form.elements[name]; return el ? el.value.trim() : ''; };
      var name = (v('first-name') + ' ' + v('last-name')).trim();
      var subject = v('subject') || 'Quote request from the website';
      var body = [
        'Name: ' + name,
        'Email: ' + v('email'),
        v('phone') ? 'Phone: ' + v('phone') : '',
        '',
        v('message')
      ].filter(function (line, i) { return line !== '' || i === 3; }).join('\n');
      var to = form.getAttribute('data-mail-to');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      var note = form.querySelector('.form-feedback');
      if (!note) {
        note = document.createElement('p');
        note.className = 'form-feedback form-note';
        note.setAttribute('role', 'status');
        form.appendChild(note);
      }
      note.innerHTML = 'Your email app should now open with your message to Trohan — just press <b>Send</b>. ' +
        'If nothing opened, email us at <a href="mailto:' + to + '">' + to + '</a> or call <a href="tel:+17787120824">+1 778-712-0824</a>.';
    });
  });

  // Accessible before/after slider
  document.querySelectorAll('.before-after').forEach(function (widget) {
    var range = widget.querySelector('input[type="range"]');
    var after = widget.querySelector('.layer-after');
    var divider = widget.querySelector('.divider');
    if (!range || !after) return;
    function update() {
      var v = range.value;
      after.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      if (divider) divider.style.left = v + '%';
    }
    range.addEventListener('input', update);
    range.addEventListener('keydown', function (e) {
      var step = 5;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        range.value = Math.max(0, Number(range.value) - step);
        update();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        range.value = Math.min(100, Number(range.value) + step);
        update();
      }
    });
    update();
  });
});
