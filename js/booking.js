/* Booking page: 3-step form, validation, live price, demo confirmation.
   Nothing is sent or stored anywhere. */
(function () {
  'use strict';
  var K = window.Kabir;

  var form = document.getElementById('bookingForm');
  var steps = form.querySelectorAll('.step');
  var stepper = document.getElementById('stepper').children;
  var current = 1;

  var el = {
    checkin: document.getElementById('checkin'),
    checkout: document.getElementById('checkout'),
    guests: document.getElementById('guests'),
    rooms: document.getElementById('roomOptions'),
    name: document.getElementById('name'),
    phone: document.getElementById('phone'),
    email: document.getElementById('email'),
    requests: document.getElementById('requests'),
    sumImg: document.getElementById('sumImg'),
    sumRoom: document.getElementById('sumRoom'),
    sumDates: document.getElementById('sumDates'),
    sumBreakdown: document.getElementById('sumBreakdown')
  };

  /* ---------- Room options ---------- */
  el.rooms.innerHTML = K.ROOMS.map(function (r) {
    return '' +
      '<label class="room-option">' +
        '<input type="radio" name="room" value="' + r.id + '" data-cap="' + r.guests + '">' +
        '<span class="opt">' +
          '<img loading="lazy" src="' + K.IMG(r.img, 160, 60) + '" width="74" height="74" alt="">' +
          '<span><strong>' + r.name + '</strong>' +
          '<small>' + r.bed + ' &middot; up to ' + r.guests + ' guests</small>' +
          '<span class="opt-price">' + K.formatINR(r.price) + ' / night</span>' +
          '<span class="cap-note">Too small for your group</span></span>' +
        '</span>' +
      '</label>';
  }).join('');
  var roomInputs = el.rooms.querySelectorAll('input[name="room"]');

  function selectedRoom() {
    var r = el.rooms.querySelector('input[name="room"]:checked');
    return r ? K.getRoom(r.value) : null;
  }

  /* ---------- Prefill from URL ---------- */
  var params = new URLSearchParams(location.search);
  var t = K.today();
  el.checkin.min = K.toISODate(t);

  var pIn = K.parseISODate(params.get('checkin'));
  var pOut = K.parseISODate(params.get('checkout'));
  if (pIn && pIn >= t) el.checkin.value = K.toISODate(pIn);
  else el.checkin.value = K.toISODate(t);
  var ci = K.parseISODate(el.checkin.value);
  if (pOut && pOut > ci) el.checkout.value = K.toISODate(pOut);
  else el.checkout.value = K.toISODate(K.addDays(ci, 1));
  el.checkout.min = K.toISODate(K.addDays(ci, 1));

  var pGuests = parseInt(params.get('guests'), 10);
  if (pGuests >= 1 && pGuests <= 4) el.guests.value = String(pGuests);

  var pRoom = params.get('room');
  if (K.getRoom(pRoom)) el.rooms.querySelector('input[value="' + pRoom + '"]').checked = true;

  /* ---------- Field errors ---------- */
  function setError(fieldId, msg) {
    var f = document.getElementById(fieldId);
    if (!f) return;
    f.classList.toggle('has-error', !!msg);
    var p = f.querySelector('.field-error');
    if (p) p.textContent = msg || '';
  }

  /* ---------- Capacity ---------- */
  function applyCapacity() {
    var g = +el.guests.value;
    roomInputs.forEach(function (inp) {
      var tooSmall = +inp.getAttribute('data-cap') < g;
      inp.disabled = tooSmall;
      if (tooSmall && inp.checked) inp.checked = false;
    });
  }

  /* ---------- Validation ---------- */
  function validateDates(show) {
    var a = K.parseISODate(el.checkin.value);
    var b = K.parseISODate(el.checkout.value);
    var e1 = '', e2 = '';
    if (!a) e1 = 'Please choose a check-in date.';
    else if (a < K.today()) e1 = 'Check-in can’t be in the past.';
    if (!b) e2 = 'Please choose a check-out date.';
    else if (a && b <= a) e2 = 'Check-out must be after check-in.';
    else if (a && K.nightsBetween(a, b) > 30) e2 = 'Online bookings are limited to 30 nights.';
    if (show) { setError('f-checkin', e1); setError('f-checkout', e2); }
    return !e1 && !e2;
  }

  function validateStep1() {
    var ok = validateDates(true);
    var room = selectedRoom();
    if (!room) { setError('f-room', 'Please choose a room.'); ok = false; }
    else setError('f-room', '');
    return ok;
  }

  function cleanPhone(v) {
    var d = v.replace(/[^\d]/g, '');
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return d;
  }

  function validateField(id) {
    var msg = '';
    if (id === 'name') {
      var n = el.name.value.trim();
      if (!n) msg = 'Please enter your name.';
      else if (n.length < 2 || !/^[\p{L} .'-]+$/u.test(n)) msg = 'Please enter a valid name (letters only).';
      setError('f-name', msg);
    }
    if (id === 'phone') {
      var p = el.phone.value.trim();
      if (!p) msg = 'Please enter your mobile number.';
      else if (!/^[6-9]\d{9}$/.test(cleanPhone(p))) msg = 'Enter a valid 10-digit Indian mobile number.';
      setError('f-phone', msg);
    }
    if (id === 'email') {
      var e = el.email.value.trim();
      if (!e) msg = 'Please enter your email address.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) msg = 'Enter a valid email address.';
      setError('f-email', msg);
    }
    return !msg;
  }

  function validateStep2() {
    var a = validateField('name');
    var b = validateField('phone');
    var c = validateField('email');
    return a && b && c;
  }

  /* ---------- Live price ---------- */
  function row(label, value, cls) {
    return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span>' + label + '</span><span>' + value + '</span></li>';
  }

  function currentQuote() {
    var room = selectedRoom();
    if (!room || !validateDates(false)) return null;
    var a = K.parseISODate(el.checkin.value);
    var b = K.parseISODate(el.checkout.value);
    return K.quote(room.id, K.nightsBetween(a, b));
  }

  function breakdownHTML(q) {
    return row('Room rate', K.formatINR(q.rate) + ' / night') +
      row('Nights', q.nights) +
      row('Subtotal', K.formatINR(q.subtotal)) +
      row('GST (12%)', K.formatINR(q.gst)) +
      row('Total', K.formatINR(q.total), 'total');
  }

  var lastImg = '';
  function updateSummary() {
    var room = selectedRoom();
    var a = K.parseISODate(el.checkin.value);
    var b = K.parseISODate(el.checkout.value);
    var g = +el.guests.value;

    el.sumRoom.textContent = room ? room.name : 'Choose a room';
    if (room && room.img !== lastImg) {
      lastImg = room.img;
      el.sumImg.removeAttribute('data-tries');
      el.sumImg.classList.remove('img-missing');
      el.sumImg.src = K.IMG(room.img, 700, 65);
    }
    el.sumDates.textContent = (a && b && b > a)
      ? K.prettyDate(a) + ' → ' + K.prettyDate(b) + ' · ' + g + (g === 1 ? ' guest' : ' guests')
      : 'Select your dates';

    var q = currentQuote();
    el.sumBreakdown.innerHTML = q
      ? breakdownHTML(q)
      : row('Room rate', room ? K.formatINR(room.price) + ' / night' : '—') + row('Nights', '—') + row('GST (12%)', '—') + row('Total', '—', 'total');
    el.sumBreakdown.classList.remove('price-flash');
    void el.sumBreakdown.offsetWidth;
    el.sumBreakdown.classList.add('price-flash');
  }

  /* ---------- Step navigation ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function buildReview() {
    var room = selectedRoom();
    var a = K.parseISODate(el.checkin.value);
    var b = K.parseISODate(el.checkout.value);
    var g = +el.guests.value;
    var req = el.requests.value.trim();
    document.getElementById('reviewGrid').innerHTML =
      '<div class="review-block"><h4>Dates</h4><p>' + K.prettyDate(a) + '<br>to ' + K.prettyDate(b) + '</p><button type="button" class="edit" data-goto="1">Edit</button></div>' +
      '<div class="review-block"><h4>Room &amp; guests</h4><p>' + room.name + '<br>' + g + (g === 1 ? ' guest' : ' guests') + '</p><button type="button" class="edit" data-goto="1">Edit</button></div>' +
      '<div class="review-block wide"><h4>Guest</h4><p>' + esc(el.name.value.trim()) + '<br>' + esc(el.phone.value.trim()) + ' &middot; ' + esc(el.email.value.trim()) + '</p><button type="button" class="edit" data-goto="2">Edit</button></div>' +
      (req ? '<div class="review-block wide"><h4>Special requests</h4><p>' + esc(req) + '</p></div>' : '');
    document.getElementById('reviewBreakdown').innerHTML = breakdownHTML(currentQuote());
  }

  function goTo(n) {
    current = n;
    steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === n); });
    for (var i = 0; i < stepper.length; i++) {
      stepper[i].classList.toggle('is-active', i + 1 === n);
      stepper[i].classList.toggle('is-done', i + 1 < n);
    }
    if (n === 3) buildReview();
    var panel = document.getElementById('bookingPanel');
    var top = panel.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    var h = form.querySelector('.step.is-active h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) {
      if (current === 1 && !validateStep1()) return focusFirstError();
      if (current === 2 && !validateStep2()) return focusFirstError();
      goTo(current + 1);
    } else if (e.target.closest('[data-back]')) {
      goTo(current - 1);
    } else if (e.target.closest('[data-goto]')) {
      goTo(+e.target.closest('[data-goto]').getAttribute('data-goto'));
    }
  });

  function focusFirstError() {
    var f = form.querySelector('.step.is-active .has-error .input, .step.is-active .has-error input');
    if (f) f.focus();
  }

  /* ---------- Live updates ---------- */
  el.checkin.addEventListener('change', function () {
    var a = K.parseISODate(el.checkin.value);
    if (a) {
      el.checkout.min = K.toISODate(K.addDays(a, 1));
      var b = K.parseISODate(el.checkout.value);
      if (!b || b <= a) el.checkout.value = K.toISODate(K.addDays(a, 1));
    }
    validateDates(true);
    updateSummary();
  });
  el.checkout.addEventListener('change', function () { validateDates(true); updateSummary(); });
  el.guests.addEventListener('change', function () { applyCapacity(); updateSummary(); });
  el.rooms.addEventListener('change', function () { setError('f-room', ''); updateSummary(); });
  ['name', 'phone', 'email'].forEach(function (id) {
    el[id].addEventListener('blur', function () { if (el[id].value) validateField(id); });
    el[id].addEventListener('input', function () {
      if (document.getElementById('f-' + id).classList.contains('has-error')) validateField(id);
    });
  });

  /* ---------- Confirm ---------- */
  function bookingId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    var buf = new Uint32Array(6);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < 6; i++) out += chars[buf[i] % chars.length];
    return 'HK-' + out.slice(0, 3) + '-' + out.slice(3);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (current !== 3) return;
    if (!validateStep1()) return goTo(1);
    if (!validateStep2()) return goTo(2);
    var q = currentQuote();
    document.getElementById('successName').textContent = el.name.value.trim().split(/\s+/)[0];
    document.getElementById('bookingId').textContent = bookingId();
    document.getElementById('successBreakdown').innerHTML =
      row('Room', q.room.name) +
      row('Dates', K.prettyDate(K.parseISODate(el.checkin.value)) + ' → ' + K.prettyDate(K.parseISODate(el.checkout.value))) +
      breakdownHTML(q);
    form.hidden = true;
    document.getElementById('stepper').hidden = true;
    document.querySelector('.booking-layout').classList.add('is-done');
    var s = document.getElementById('successScreen');
    s.hidden = false;
    var top = s.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    s.focus({ preventScroll: true });
  });

  applyCapacity();
  updateSummary();
})();
