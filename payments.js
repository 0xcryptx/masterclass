/* Ticket buttons ([data-pay], real checkout URL in data-href).
   - Locked until the Terms & Conditions box (#agreeTerms) is ticked.
   - PAYMENTS_LIVE = false: show the "payments temporarily unavailable" popup.
   - PAYMENTS_LIVE = true:  go straight to the checkout in data-href. */
(function () {
  var PAYMENTS_LIVE = false;

  var d = document.getElementById('pay-off');
  var box = document.getElementById('agreeTerms');
  var agree = document.getElementById('agree');
  var hint = document.getElementById('agreeHint');
  var pays = document.querySelectorAll('[data-pay]');
  if (!pays.length) return;

  function sync() {
    var ok = !box || box.checked;
    pays.forEach(function (a) {
      a.classList.toggle('is-locked', !ok);
      a.setAttribute('aria-disabled', String(!ok));
    });
    if (ok && agree) { agree.classList.remove('needs'); hint && hint.classList.remove('show'); }
  }
  if (box) box.addEventListener('change', sync);
  sync();

  pays.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (box && !box.checked) {
        // Not accepted yet: point the user at the checkbox instead of continuing.
        agree.classList.remove('needs'); void agree.offsetWidth; agree.classList.add('needs');
        if (hint) hint.classList.add('show');
        agree.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (PAYMENTS_LIVE && a.getAttribute('data-href')) { location.href = a.getAttribute('data-href'); return; }
      if (d) { d.showModal(); document.documentElement.classList.add('no-scroll'); }
    });
  });

  if (d) {
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () { document.documentElement.classList.remove('no-scroll'); });
  }
})();
