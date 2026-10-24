/* Home page: availability bar + scroll-driven walkthrough. */
(function () {
  'use strict';
  var K = window.Kabir;

  /* ---------- Availability bar ---------- */
  var form = document.getElementById('availabilityForm');
  if (form) {
    var ci = document.getElementById('av-checkin');
    var co = document.getElementById('av-checkout');
    var err = document.getElementById('av-error');
    var t = K.today();

    ci.min = K.toISODate(t);
    ci.value = K.toISODate(t);
    co.min = K.toISODate(K.addDays(t, 1));
    co.value = K.toISODate(K.addDays(t, 1));

    ci.addEventListener('change', function () {
      var a = K.parseISODate(ci.value);
      if (!a) return;
      co.min = K.toISODate(K.addDays(a, 1));
      var b = K.parseISODate(co.value);
      if (!b || b <= a) co.value = K.toISODate(K.addDays(a, 1));
      err.textContent = '';
    });
    co.addEventListener('change', function () { err.textContent = ''; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = K.parseISODate(ci.value);
      var b = K.parseISODate(co.value);
      if (!a || !b) { err.textContent = 'Please choose your check-in and check-out dates.'; return; }
      if (a < K.today()) { err.textContent = 'Check-in can’t be in the past.'; return; }
      if (b <= a) { err.textContent = 'Check-out must be after check-in.'; return; }
      var q = new URLSearchParams({ checkin: ci.value, checkout: co.value, guests: document.getElementById('av-guests').value });
      window.location.href = 'booking.html?' + q.toString();
    });
  }

  /* ---------- Walkthrough ---------- */
  var tour = document.getElementById('tour');
  if (!tour) return;

  var scenes = tour.querySelectorAll('.tour-scene');
  var sceneImgs = tour.querySelectorAll('.tour-scene img');
  var captions = tour.querySelectorAll('.tour-caption');
  var segs = tour.querySelectorAll('.tour-seg');
  var segFills = tour.querySelectorAll('.tour-seg i');
  var intro = document.getElementById('tourIntro');
  var chapter = document.getElementById('tourChapter');
  var timeEl = document.getElementById('tourTime');
  var playBtn = document.getElementById('tourPlay');

  var N = scenes.length;
  var INTRO = 0.06;          // share of the scroll used by the title card
  var FADE = 0.12;           // half-width of each crossfade, in scenes
  var DURATION = 90;         // "video" length shown in the timecode (seconds)
  var PLAY_MS = 32000;       // auto-play time for the whole walkthrough
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function geometry() {
    var top = tour.getBoundingClientRect().top + window.scrollY;
    var dist = tour.offsetHeight - window.innerHeight;
    return { top: top, dist: Math.max(1, dist) };
  }

  function fmt(s) {
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }

  var lastChapter = -1;

  function render() {
    var g = geometry();
    var p = clamp((window.scrollY - g.top) / g.dist, 0, 1);
    var sp = clamp((p - INTRO) / (1 - INTRO), 0, 1);
    var f = sp * N;

    intro.style.opacity = clamp(1 - p / INTRO, 0, 1);

    for (var i = 0; i < N; i++) {
      var fadeIn = i === 0 ? 1 : clamp((f - i + FADE) / (2 * FADE), 0, 1);
      var fadeOut = i === N - 1 ? 1 : clamp((i + 1 + FADE - f) / (2 * FADE), 0, 1);
      var o = Math.min(fadeIn, fadeOut);
      scenes[i].style.opacity = o;
      scenes[i].style.visibility = o > 0 ? 'visible' : 'hidden';

      if (!reduced && o > 0) {
        // Slow "camera" push-in with a gentle pan, like walking through the room.
        var local = clamp((f - i + FADE) / (1 + 2 * FADE), 0, 1);
        var scale = 1.04 + 0.16 * local;
        var dx = (i % 2 ? 1 : -1) * 2.2 * local;
        var dy = -1.2 * local;
        sceneImgs[i].style.transform = 'translate3d(' + dx + '%,' + dy + '%,0) scale(' + scale + ')';
      }

      var c = f - i;
      var cin = clamp((c - 0.06) / 0.16, 0, 1);
      var cout = i === N - 1 ? 1 : clamp((0.9 - c) / 0.14, 0, 1);
      var co = sp <= 0 ? 0 : Math.min(cin, cout);
      captions[i].style.opacity = co;
      captions[i].style.transform = 'translateY(' + (1 - co) * 24 + 'px)';

      segFills[i].style.transform = 'scaleX(' + clamp(f - i, 0, 1) + ')';
    }

    var idx = Math.min(N - 1, Math.floor(f));
    if (idx !== lastChapter) {
      chapter.textContent = '0' + (idx + 1) + ' / 0' + N;
      lastChapter = idx;
    }
    timeEl.textContent = fmt(sp * DURATION) + ' / ' + fmt(DURATION);
  }

  var ticking = false;
  var inView = false;
  function onScroll() {
    if (!inView || ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; render(); });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      document.body.classList.toggle('in-tour', inView);
      if (inView) render();
    }, { rootMargin: '100px 0px' }).observe(tour);
  } else {
    inView = true;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { render(); });
  render();

  /* Jump to a chapter */
  segs.forEach(function (seg, i) {
    seg.addEventListener('click', function () {
      stop();
      var g = geometry();
      var sp = (i + 0.35) / N;
      var p = INTRO + sp * (1 - INTRO);
      window.scrollTo({ top: g.top + p * g.dist, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* Auto-play: scrolls the page through the tour at a steady pace. */
  var playing = false;
  var pos = 0;
  var last = 0;
  var raf = 0;

  function step(ts) {
    if (!playing) return;
    var g = geometry();
    var dt = last ? ts - last : 16;
    last = ts;
    pos += (g.dist / PLAY_MS) * dt;
    var end = g.top + g.dist;
    if (pos >= end) {
      pos = end;
      window.scrollTo({ top: pos, behavior: 'instant' });
      stop();
      return;
    }
    window.scrollTo({ top: pos, behavior: 'instant' });
    raf = requestAnimationFrame(step);
  }

  function play() {
    var g = geometry();
    var p = (window.scrollY - g.top) / g.dist;
    pos = p < 0 || p > 0.98 ? g.top : window.scrollY;
    window.scrollTo({ top: pos, behavior: 'instant' });
    playing = true;
    last = 0;
    playBtn.classList.add('is-playing');
    playBtn.setAttribute('aria-label', 'Pause walkthrough');
    raf = requestAnimationFrame(step);
  }

  function stop() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(raf);
    playBtn.classList.remove('is-playing');
    playBtn.setAttribute('aria-label', 'Play walkthrough');
  }

  playBtn.addEventListener('click', function () { playing ? stop() : play(); });
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (playing && !(e.target && e.target.closest && e.target.closest('#tourPlay'))) stop();
    }, { passive: true });
  });
})();
