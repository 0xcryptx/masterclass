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
