/* Gold scroll-progress bar attached to the bottom of the navbar
   (same approach as the Rejuvenate site) */
(function () {
  "use strict";
  var header = document.querySelector(".nav");
  if (!header) return;

  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  var fill = document.createElement("i");
  bar.appendChild(fill);
  header.appendChild(bar);

  function onScroll() {
    var st = window.scrollY || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var p = docH > 0 ? Math.min(1, Math.max(0, st / docH)) : 0;
    fill.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
})();

/* Touch devices ignore scrollbar styling (iOS hides it entirely), so on pages with
   html.show-sb we draw our own slim champagne thumb on the right edge. Draggable. */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!root.classList.contains("show-sb")) return;
  if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

  var rail = document.createElement("div");
  rail.className = "touch-sb";
  rail.setAttribute("aria-hidden", "true");
  var thumb = document.createElement("i");
  rail.appendChild(thumb);
  document.body.appendChild(rail);

  var thumbH = 0, maxTop = 0, maxScroll = 0, ticking = false, drag = null;

  function measure() {
    var vh = window.innerHeight;
    var docH = root.scrollHeight;
    maxScroll = Math.max(0, docH - vh);
    rail.style.display = maxScroll > 4 ? "" : "none";
    thumbH = Math.max(44, vh * vh / docH);
    maxTop = vh - thumbH - 8;
    thumb.style.height = thumbH + "px";
    place();
  }
  function place() {
    ticking = false;
    var st = window.scrollY || root.scrollTop;
    var p = maxScroll ? Math.min(1, Math.max(0, st / maxScroll)) : 0;
    thumb.style.transform = "translate3d(0," + (4 + p * maxTop).toFixed(1) + "px,0)";
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(place); }
  }, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  measure();
  setTimeout(measure, 800);   // images that load late change the page height

  thumb.addEventListener("pointerdown", function (e) {
    drag = { y: e.clientY, st: window.scrollY };
    rail.classList.add("is-dragging");
    try { thumb.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  thumb.addEventListener("pointermove", function (e) {
    if (!drag || !maxTop) return;
    var dy = e.clientY - drag.y;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, drag.st + dy * (maxScroll / maxTop));
  });
  function end() { drag = null; rail.classList.remove("is-dragging"); root.style.scrollBehavior = ""; }
  thumb.addEventListener("pointerup", end);
  thumb.addEventListener("pointercancel", end);
})();
