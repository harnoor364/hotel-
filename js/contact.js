/* Contact page: front-end-only enquiry form. Nothing is sent anywhere. */
(function () {
  'use strict';
  var form = document.getElementById('enquiryForm');
  var wrap = document.getElementById('enquiryWrap');
  var thanks = document.getElementById('enquiryThanks');

  function setError(id, msg) {
    var f = document.getElementById(id);
    f.classList.toggle('has-error', !!msg);
    f.querySelector('.field-error').textContent = msg || '';
    return !msg;
  }

  function check() {
    var name = document.getElementById('en-name').value.trim();
    var contact = document.getElementById('en-contact').value.trim();
    var msg = document.getElementById('en-message').value.trim();
    var digits = contact.replace(/[^\d]/g, '');
    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
    var isPhone = /^[+\d\s()-]+$/.test(contact) && digits.length >= 10 && digits.length <= 13;

    var ok = setError('e-name', name.length < 2 ? 'Please enter your name.' : '');
    ok = setError('e-contact', !contact ? 'Please add a phone number or email.' : (!isEmail && !isPhone ? 'Enter a valid phone number or email.' : '')) && ok;
    ok = setError('e-message', msg.length < 5 ? 'Please write a short message.' : '') && ok;
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!check()) {
      var f = form.querySelector('.has-error .input');
      if (f) f.focus();
      return;
    }
    document.getElementById('thanksName').textContent = document.getElementById('en-name').value.trim().split(/\s+/)[0];
    wrap.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  });

  form.addEventListener('input', function (e) {
    if (e.target.closest('.has-error')) check();
  });

  document.getElementById('enquiryAgain').addEventListener('click', function () {
    form.reset();
    thanks.hidden = true;
    wrap.hidden = false;
  });
})();
