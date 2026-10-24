/* Rooms page: room list + price calculator. */
(function () {
  'use strict';
  var K = window.Kabir;

  /* ---------- Room list ---------- */
  var list = document.getElementById('roomList');
  list.innerHTML = K.ROOMS.map(function (r, i) {
    return '' +
      '<article class="room-row" id="' + r.id + '" data-reveal>' +
        '<div class="room-row-media">' +
          '<img loading="' + (i === 0 ? 'eager' : 'lazy') + '" decoding="async" ' +
            'src="' + K.IMG(r.img, 1000) + '" ' +
            'srcset="' + K.IMG(r.img, 640, 65) + ' 640w, ' + K.IMG(r.img, 1000) + ' 1000w" ' +
            'sizes="(min-width: 900px) 55vw, 100vw" width="1000" height="750" alt="' + r.name + ' at Hotel Kabir">' +
          '<span class="room-index">0' + (i + 1) + '</span>' +
        '</div>' +
        '<div class="room-row-body">' +
          '<p class="eyebrow">Room type 0' + (i + 1) + '</p>' +
          '<h2>' + r.name + '</h2>' +
          '<p>' + r.blurb + '</p>' +
          '<div class="spec-list">' +
            '<div class="spec"><span>Size</span><strong>' + r.size + '</strong></div>' +
            '<div class="spec"><span>Bed</span><strong>' + r.bed + '</strong></div>' +
            '<div class="spec"><span>Guests</span><strong>Up to ' + r.guests + '</strong></div>' +
          '</div>' +
          '<ul class="amenity-list">' + r.amenities.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>' +
          '<div class="room-buy">' +
            '<div class="room-price"><small>Per night</small><strong>' + K.formatINR(r.price) + '</strong> <span>+ GST</span></div>' +
            '<a class="btn btn-maroon" href="booking.html?room=' + r.id + '">Book This Room</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }).join('');

  /* Re-run reveal for the rows we just added. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    list.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    list.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* If arriving with #deluxe etc., scroll after rows exist. */
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { target.scrollIntoView(); target.classList.add('is-visible'); }, 60);
  }

  /* ---------- Calculator ---------- */
  var roomSel = document.getElementById('calc-room');
  var inEl = document.getElementById('calc-in');
  var outEl = document.getElementById('calc-out');
  var guestsEl = document.getElementById('calc-guests');
  var errEl = document.getElementById('calcError');
  var nameEl = document.getElementById('calcRoomName');
  var bdEl = document.getElementById('calcBreakdown');
  var bookEl = document.getElementById('calcBook');

  roomSel.innerHTML = K.ROOMS.map(function (r) {
    return '<option value="' + r.id + '">' + r.name + ' — ' + K.formatINR(r.price) + '/night</option>';
  }).join('');
  roomSel.value = 'deluxe';

  var t = K.today();
  inEl.min = K.toISODate(t);
  inEl.value = K.toISODate(K.addDays(t, 7));
  outEl.min = K.toISODate(K.addDays(t, 1));
  outEl.value = K.toISODate(K.addDays(t, 9));

  function row(label, value, cls) {
    return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span>' + label + '</span><span>' + value + '</span></li>';
  }

  function update() {
    var a = K.parseISODate(inEl.value);
    var b = K.parseISODate(outEl.value);
    var room = K.getRoom(roomSel.value);
    var guests = +guestsEl.value;
    var err = '';

    if (a) outEl.min = K.toISODate(K.addDays(a, 1));

    if (!a || !b) err = 'Choose both dates to see a price.';
    else if (a < K.today()) err = 'Check-in can’t be in the past.';
    else if (b <= a) err = 'Check-out must be after check-in.';
    else if (guests > room.guests) err = 'The ' + room.name + ' sleeps up to ' + room.guests + '. Try the Family Suite for larger groups.';

    errEl.textContent = err;
    nameEl.textContent = room.name;

    var nights = err ? 0 : K.nightsBetween(a, b);
    var q = K.quote(room.id, nights);
    if (!q) {
      bdEl.innerHTML =
        row('Room rate', K.formatINR(room.price) + ' / night') +
        row('Nights', '—') +
        row('GST (12%)', '—', 'muted') +
        row('Total', '—', 'total');
      bookEl.href = 'booking.html?room=' + room.id;
    } else {
      bdEl.innerHTML =
        row(K.formatINR(q.rate) + ' × ' + q.nights + (q.nights === 1 ? ' night' : ' nights'), K.formatINR(q.subtotal)) +
        row('GST (12%)', K.formatINR(q.gst)) +
        row('Total', K.formatINR(q.total), 'total');
      var params = new URLSearchParams({ room: room.id, checkin: inEl.value, checkout: outEl.value, guests: guests });
      bookEl.href = 'booking.html?' + params.toString();
    }
    bdEl.classList.remove('price-flash');
    void bdEl.offsetWidth;
    bdEl.classList.add('price-flash');
  }

  inEl.addEventListener('change', function () {
    var a = K.parseISODate(inEl.value);
    var b = K.parseISODate(outEl.value);
    if (a && (!b || b <= a)) outEl.value = K.toISODate(K.addDays(a, 1));
    update();
  });
  [roomSel, outEl, guestsEl].forEach(function (el) { el.addEventListener('change', update); });
  update();
})();
