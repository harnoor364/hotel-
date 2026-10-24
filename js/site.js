/* Hotel Kabir — shared site script.
   Loaded synchronously at the top of <body> so the header renders with no flash.
   Holds room data, price helpers, header/footer, contact popup and scroll reveals. */

(function () {
  'use strict';

  /* ---------- Images (Unsplash CDN, resized on the fly) ---------- */
  var IMG = function (id, w, q) {
    return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=' + w + '&q=' + (q || 70);
  };

  /* Backup photos used if a primary image fails to load. */
  var BACKUP_IDS = [
    '1582719478250-c89cae4dc85b',
    '1590490360182-c33d57733427',
    '1611892440504-42a792e24d32',
    '1618773928121-c32242e63f39',
    '1578683010236-d716f9a3f461'
  ];

  /* ---------- Room data (all values are imaginary placeholders) ---------- */
  var ROOMS = [
    {
      id: 'standard',
      name: 'Standard Room',
      price: 2499,
      size: '240 sq ft',
      bed: 'Queen bed',
      guests: 2,
      img: '1611892440504-42a792e24d32',
      blurb: 'A calm, well-proportioned room with everything you need for a restful night and nothing you don’t.',
      amenities: ['Air conditioning', 'High-speed Wi-Fi', '32″ smart TV', 'Tea & coffee tray', 'Rain shower']
    },
    {
      id: 'deluxe',
      name: 'Deluxe Room',
      price: 3299,
      size: '300 sq ft',
      bed: 'King bed',
      guests: 3,
      img: '1618773928121-c32242e63f39',
      blurb: 'More room to unwind, with a window seat for slow mornings and a desk for the odd bit of work.',
      amenities: ['Air conditioning', 'High-speed Wi-Fi', '43″ smart TV', 'Minibar', 'Window seat', 'Work desk']
    },
    {
      id: 'executive',
      name: 'Executive Room',
      price: 4199,
      size: '360 sq ft',
      bed: 'King bed',
      guests: 3,
      img: '1590490360182-c33d57733427',
      blurb: 'Designed for longer stays and business travel, with a lounge corner and breakfast included.',
      amenities: ['Breakfast included', 'Lounge seating', 'Espresso machine', 'Bathrobe & slippers', 'Minibar', 'High-speed Wi-Fi']
    },
    {
      id: 'family',
      name: 'Family Suite',
      price: 5999,
      size: '520 sq ft',
      bed: 'King + 2 single beds',
      guests: 4,
      img: '1582719478250-c89cae4dc85b',
      blurb: 'A separate sitting area and space for everyone — the easiest way to travel together.',
      amenities: ['Separate sitting area', 'Breakfast included', 'Two smart TVs', 'Minibar', 'Bathtub', 'High-speed Wi-Fi']
    }
  ];

  var GST_RATE = 0.12;

  /* ---------- Helpers ---------- */
  var inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  function formatINR(n) { return inr.format(Math.round(n)); }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Local YYYY-MM-DD (avoids the UTC shift of toISOString). */
  function toISODate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function parseISODate(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }

  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }

  function nightsBetween(a, b) {
    if (!a || !b) return 0;
    return Math.round((b - a) / 86400000);
  }

  function prettyDate(d) {
    return d ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  }

  function getRoom(id) {
    for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) return ROOMS[i];
    return null;
  }

  function quote(roomId, nights) {
    var room = getRoom(roomId);
    if (!room || nights < 1) return null;
    var subtotal = room.price * nights;
    var gst = subtotal * GST_RATE;
    return { room: room, nights: nights, rate: room.price, subtotal: subtotal, gst: gst, total: subtotal + gst };
  }

  window.Kabir = {
    IMG: IMG,
    ROOMS: ROOMS,
    GST_RATE: GST_RATE,
    formatINR: formatINR,
    toISODate: toISODate,
    parseISODate: parseISODate,
    today: today,
    addDays: addDays,
    nightsBetween: nightsBetween,
    prettyDate: prettyDate,
    getRoom: getRoom,
    quote: quote
  };

  /* ---------- Icons ---------- */
  var ICON = {
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 8.8c0 3.3 2.9 6.2 6.2 6.2l1.3-1.6-2-1-1 .8a4.4 4.4 0 0 1-2.7-2.7l.8-1-1-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    mark: '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 21L20 8l15 13"/><path d="M27 14.2V9.5h3.5v7.7"/><path d="M12 30V20M12 25l6.5-5.5M14.6 22.8L19 30"/><path d="M23 30v-6.5a2.5 2.5 0 0 1 5 0V30"/></svg>',
    roof: '<svg class="logo-roof" viewBox="0 0 64 26" aria-hidden="true"><path d="M4 24L32 4l28 20"/><path d="M45 13.3V6h6v11.6"/><path d="M28 24v-7h8v7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5l8.5 7 8.5-7"/></svg>'
  };
  window.Kabir.ICON = ICON;

  /* ---------- Header ---------- */
  var page = document.body.getAttribute('data-page') || '';
  var NAV = [
    { href: 'index.html', label: 'Home', key: 'home' },
    { href: 'rooms.html', label: 'Rooms & Prices', key: 'rooms' },
    { href: 'index.html#tour', label: 'Walkthrough', key: 'tour' },
    { href: 'contact.html', label: 'Contact', key: 'contact' }
  ];

  function navLinks(cls) {
    return NAV.map(function (n) {
      var active = n.key === page ? ' aria-current="page"' : '';
      return '<a class="' + cls + '" href="' + n.href + '"' + active + '>' + n.label + '</a>';
    }).join('');
  }

  var headerHTML =
    '<a class="skip-link" href="#main">Skip to content</a>' +
    '<header class="site-header" id="siteHeader">' +
      /* Slim utility bar (desktop) */
      '<div class="topbar">' +
        '<div class="container topbar-inner">' +
          '<div class="topbar-group">' +
            '<button class="topbar-link" data-contact="call">' + ICON.phone + 'Phone number coming soon</button>' +
            '<span class="topbar-link">' + ICON.clock + 'Check-in 12 pm &middot; Check-out 11 am</span>' +
          '</div>' +
          '<div class="topbar-group">' +
            '<a class="topbar-link" href="booking.html">' + ICON.calendar + 'My Booking</a>' +
            '<a class="topbar-link" href="contact.html#enquiry">' + ICON.mail + 'Send an Enquiry</a>' +
            '<span class="topbar-lang">EN</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      /* Centred logo row (desktop) */
      '<div class="logo-row">' +
        '<a class="logo" href="index.html" aria-label="Hotel Kabir, home">' + ICON.roof +
          '<span class="logo-name">Hotel Kabir</span>' +
          '<span class="logo-tag">Boutique Hotel &amp; Dining</span>' +
        '</a>' +
      '</div>' +
      /* Navigation row (always visible) */
      '<div class="nav-row">' +
        '<div class="container nav-row-inner">' +
          '<div class="nav-left">' +
            '<button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span></button>' +
            '<a class="logo-compact" href="index.html" aria-label="Hotel Kabir, home">' + ICON.roof + '<span>Hotel Kabir</span></a>' +
          '</div>' +
          '<nav class="nav" aria-label="Main">' + navLinks('nav-link') + '</nav>' +
          '<div class="header-actions">' +
            '<a class="btn btn-taupe btn-xs" href="booking.html">Book Now</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</header>' +
    '<div class="mobile-menu" id="mobileMenu" hidden>' +
      '<nav aria-label="Mobile">' + navLinks('mobile-link') + '</nav>' +
      '<a class="btn btn-gold btn-block" href="booking.html">Book Now</a>' +
      '<p class="mobile-menu-note">Phone number coming soon</p>' +
    '</div>';

  var mount = document.getElementById('site-header');
  if (mount) mount.outerHTML = headerHTML;

  /* ---------- Image fallback ----------
     If an image fails, try a backup photo once, then show a styled placeholder. */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    var tries = +(img.getAttribute('data-tries') || 0);
    if (tries < 1) {
      img.setAttribute('data-tries', tries + 1);
      var w = img.getAttribute('width') > 900 ? 1600 : 900;
      var backup = BACKUP_IDS[(img.src.length + tries) % BACKUP_IDS.length];
      img.removeAttribute('srcset');
      img.src = IMG(backup, w);
    } else {
      img.classList.add('img-missing');
      img.removeAttribute('srcset');
      img.removeAttribute('src');
    }
  }, true);

  /* ---------- Everything that needs the full DOM ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderFooter();
    renderContactLayer();
    initHeader();
    initReveal();
  });

  function renderFooter() {
    var f = document.getElementById('site-footer');
    if (!f) return;
    f.outerHTML =
      '<footer class="site-footer">' +
        '<div class="container footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="brand brand-light" href="index.html">' + ICON.mark + '<span>Hotel Kabir</span></a>' +
            '<p>Unhurried rooms, honest food and a front desk that remembers your name.</p>' +
          '</div>' +
          '<div>' +
            '<h3 class="footer-title">Explore</h3>' +
            '<ul class="footer-links">' +
              '<li><a href="index.html">Home</a></li>' +
              '<li><a href="rooms.html">Rooms &amp; Prices</a></li>' +
              '<li><a href="index.html#tour">Walkthrough</a></li>' +
              '<li><a href="booking.html">Book a Stay</a></li>' +
              '<li><a href="contact.html">Contact</a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h3 class="footer-title">Reach us</h3>' +
            '<ul class="footer-contact">' +
              '<li><span>Phone</span>Phone number coming soon</li>' +
              '<li><span>WhatsApp</span>+91 XXXXX XXXXX</li>' +
              '<li><span>Email</span>Email address coming soon</li>' +
              '<li><span>Address</span>Address to be announced</li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h3 class="footer-title">Front desk</h3>' +
            '<p class="footer-hours">Open 24 hours, every day.<br>Check-in from 12:00 pm<br>Check-out by 11:00 am</p>' +
          '</div>' +
        '</div>' +
        '<div class="container footer-bottom">' +
          '<p>&copy; Hotel Kabir</p>' +
          '<p>Demo website — prices and details shown are placeholders.</p>' +
        '</div>' +
      '</footer>';
  }

  /* Floating mobile buttons + the "number coming soon" popup. */
  function renderContactLayer() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="float-contact" aria-label="Quick contact">' +
        '<button class="float-btn float-call" data-contact="call" aria-label="Call Hotel Kabir">' + ICON.phone + '<span>Call</span></button>' +
        '<button class="float-btn float-wa" data-contact="whatsapp" aria-label="WhatsApp Hotel Kabir">' + ICON.whatsapp + '<span>WhatsApp</span></button>' +
      '</div>' +
      '<div class="modal" id="contactModal" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle" hidden>' +
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card">' +
          '<button class="modal-close" data-close aria-label="Close">' + ICON.close + '</button>' +
          '<div class="modal-icon" id="contactModalIcon"></div>' +
          '<p class="eyebrow" id="contactModalKicker">Call us</p>' +
          '<h2 id="contactModalTitle">Contact number will be added soon</h2>' +
          '<p class="modal-text">We’re setting up our direct line. Until then, you can send an enquiry and our team will get back to you.</p>' +
          '<div class="modal-actions">' +
            '<a class="btn btn-maroon" href="contact.html#enquiry">Send an enquiry</a>' +
            '<button class="btn btn-ghost" data-close>Close</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var modal = document.getElementById('contactModal');
    var lastFocus = null;

    function open(kind) {
      lastFocus = document.activeElement;
      var wa = kind === 'whatsapp';
      document.getElementById('contactModalKicker').textContent = wa ? 'WhatsApp' : 'Call us';
      document.getElementById('contactModalIcon').innerHTML = wa ? ICON.whatsapp : ICON.phone;
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add('is-open'); });
      document.documentElement.classList.add('no-scroll');
      modal.querySelector('.modal-close').focus();
    }

    function close() {
      modal.classList.remove('is-open');
      document.documentElement.classList.remove('no-scroll');
      setTimeout(function () { modal.hidden = true; }, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-contact]');
      if (t) { e.preventDefault(); open(t.getAttribute('data-contact')); return; }
      if (e.target.closest('#contactModal [data-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
    window.Kabir.openContact = open;

    /* Show the floating buttons once the visitor starts scrolling,
       so they never cover the hero or booking form on first view. */
    var floatWrap = document.querySelector('.float-contact');
    function toggleFloat() { floatWrap.classList.toggle('is-shown', window.scrollY > 320); }
    toggleFloat();
    window.addEventListener('scroll', toggleFloat, { passive: true });
  }

  function initHeader() {
    var header = document.getElementById('siteHeader');
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if (!header) return;

    function onScroll() {
      header.classList.toggle('is-compact', window.scrollY > 60);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setMenu(open) {
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      header.classList.toggle('menu-open', open);
      document.documentElement.classList.toggle('no-scroll', open);
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
      } else {
        menu.classList.remove('is-open');
        setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 300);
      }
    }
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960 && !menu.hidden) setMenu(false); });
  }

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }
})();
