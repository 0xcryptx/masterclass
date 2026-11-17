/* Reviews marquee: scrolls slowly and continuously, like the amalak clients strip.
   - Swipe / drag to move through the reviews; a flick carries momentum.
   - Tap / click toggles pause. Speed always eases, so nothing jerks. */
(function () {
  var box = document.getElementById('rv');
  if (!box) return;
  var section = box.closest('.reviews');
  var track = box.querySelector('.rv-track');
  var hint = section.querySelector('.rv-hint');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Duplicate the cards once so the loop is seamless.
  Array.prototype.slice.call(track.children).forEach(function (card) {
    var copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  });

  var half = 0, x = 0, v = 0, paused = false, visible = true, last = 0;
  var drag = null;   // {id, startX, startPos, lastX, lastT, vel, moved}
  function speed() { return window.innerWidth < 640 ? 22 : 30; }   // px per second
  function wrap() { if (half) { x = x % half; if (x < 0) x += half; } }
  function measure() { half = track.scrollWidth / 2; wrap(); }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  function frame(t) {
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;  // clamp after tab switches
    last = t;
    if (!drag) {
      var target = paused || !visible ? 0 : speed();
      var rate = target === 0 ? 5 : (Math.abs(v) > speed() * 2 ? 2.5 : 4);   // flicks glide, pauses settle quickly
      v += (target - v) * Math.min(1, dt * rate);
      if (target === 0 && Math.abs(v) < 0.05) v = 0;
      x += v * dt;
    }
    wrap();
    track.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px,0,0)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Don't animate while the section is off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(box);
  }

  function setPaused(p) {
    paused = p;
    section.classList.toggle('is-paused', p);
    if (hint) hint.textContent = p ? 'Paused · tap to resume' : 'Swipe or tap to pause';
  }
  if (hint) hint.textContent = 'Swipe or tap to pause';

  // Pointer handling: small movement = tap (toggle pause), otherwise drag.
  box.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || drag) return;
    drag = { id: e.pointerId, startX: e.clientX, startPos: x, lastX: e.clientX, lastT: e.timeStamp, vel: 0, moved: false };
  });
  box.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      box.classList.add('is-dragging');
      try { box.setPointerCapture(e.pointerId); } catch (_) {}
    }
    if (!drag.moved) return;
    var dt = Math.max(1, e.timeStamp - drag.lastT);
    var inst = -(e.clientX - drag.lastX) / dt * 1000;      // px/s in track direction
    drag.vel = drag.vel * 0.6 + inst * 0.4;
    drag.lastX = e.clientX; drag.lastT = e.timeStamp;
    x = drag.startPos - dx;
  });
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved) {
      var idle = e.timeStamp - drag.lastT > 80;            // held still before letting go: no flick
      v = idle ? 0 : Math.max(-2500, Math.min(2500, drag.vel));
      box.classList.remove('is-dragging');
    } else if (e.type === 'pointerup' && !String(window.getSelection && window.getSelection())) {
      setPaused(!paused);
    }
    drag = null;
  }
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
  box.addEventListener('dragstart', function (e) { e.preventDefault(); });

  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', 'Attendee reviews. Swipe to browse, tap to pause or resume');
  box.tabIndex = 0;
  box.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setPaused(!paused); }
    else if (e.key === 'ArrowRight') { v = 900; }
    else if (e.key === 'ArrowLeft') { v = -900; }
  });
})();
