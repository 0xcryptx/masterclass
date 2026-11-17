/* Photo gallery, ported from the JANA Travel site:
   collapsed photo stack -> click to expand into a grid -> click a photo for a
   fullscreen Swiper lightbox (swipe, arrows, keyboard, counter, edge wrap). */
(function () {
  /* Files are numbered like the originals in assets/gallery (01-54); 21 and 37 are
     near-duplicate shots, so they're left out. */
  var SKIP = { 21: 1, 37: 1 };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var FULL = [], THUMB = [];
  for (var n = 1; n <= 54; n++) {
    if (SKIP[n]) continue;
    FULL.push('assets/images/gallery/' + pad(n) + '.jpg');
    THUMB.push('assets/images/gallery/thumbs/' + pad(n) + '.jpg');
  }
  var COUNT = FULL.length;
  /* Collapsed stack preview (centre card = 3rd), by file number. */
  var STACK = [26, 16, 7, 18, 23].map(function (n) { return 'assets/images/gallery/thumbs/' + pad(n) + '.jpg'; });

  var SWIPER_CSS = 'https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.css';
  var SWIPER_JS = 'https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js';

  var currentSlide = 0, lightboxOpen = false, lightboxScrollPosition = 0;
  var isGalleryExpanded = false, swiper = null, swiperPromise = null, suppressCloseUntil = 0;
  var ANGLES = [-30, -15, 0, 15, 30], DISTANCES = [150, 100, 80, 100, 150];

  function $(id) { return document.getElementById(id); }
  function preload(urls) { urls.forEach(function (src) { var im = new Image(); im.decoding = 'async'; im.src = src; }); }
  function norm(i) { return ((i % COUNT) + COUNT) % COUNT; }

  /* ---------- Swiper loading ---------- */
  function ensureSwiperLoaded() {
    if (window.Swiper) return Promise.resolve(window.Swiper);
    if (!swiperPromise) {
      swiperPromise = new Promise(function (resolve, reject) {
        var link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = SWIPER_CSS;
        document.head.appendChild(link);
        var s = document.createElement('script');
        s.src = SWIPER_JS; s.async = true;
        s.onload = function () { resolve(window.Swiper); };
        s.onerror = function () { swiperPromise = null; reject(new Error('Failed to load Swiper')); };
        document.head.appendChild(s);
      });
    }
    return swiperPromise;
  }

  var lightboxReady = null;
  function ensureLightboxReady() {
    if (!lightboxReady) {
      lightboxReady = ensureSwiperLoaded().then(buildLightboxSwiper).catch(function (e) { lightboxReady = null; throw e; });
    }
    return lightboxReady;
  }

  function buildLightboxSwiper() {
    var container = $('lightboxSwipeContainer');
    container.classList.add('swiper');
    var wrapper = document.createElement('div');
    wrapper.className = 'swiper-wrapper';
    wrapper.innerHTML = FULL.map(function (src, i) {
      var near = i === norm(currentSlide) || i === norm(currentSlide - 1) || i === norm(currentSlide + 1);
      return '<div class="swiper-slide lightbox-image-container"><img src="' + src + '" alt="" draggable="false" loading="' + (near ? 'eager' : 'lazy') + '" decoding="async"></div>';
    }).join('');
    container.innerHTML = '';
    container.appendChild(wrapper);

    swiper = new window.Swiper(container, {
      slidesPerView: 1, spaceBetween: 0, speed: 300, loop: false,
      watchSlidesProgress: true, resistanceRatio: 0.85, threshold: 8, roundLengths: true,
      allowTouchMove: true, simulateTouch: false, touchStartPreventDefault: false,
      passiveListeners: true, initialSlide: currentSlide,
      on: {
        slideChange: function (inst) { setSlide(inst.activeIndex, 'lightbox'); }
      }
    });

    /* Swipe past the first/last photo wraps around instantly. */
    var startIndex = 0;
    swiper.on('touchStart', function () { startIndex = swiper.activeIndex; });
    swiper.on('touchEnd', function () {
      var diff = (swiper.touches && swiper.touches.diff) || 0;
      var idx = swiper.activeIndex;
      if (diff < -40 && idx >= COUNT - 1 && idx === startIndex) wrapTo(0);
      else if (diff > 40 && idx <= 0 && idx === startIndex) wrapTo(COUNT - 1);
    });
  }
  function wrapTo(i) {
    swiper.slideTo(i, 0);
    setSlide(i, 'lightbox');
    requestAnimationFrame(function () { if (swiper.activeIndex !== i) swiper.slideTo(i, 0); });
  }

  /* ---------- Slide state ---------- */
  var syncLock = false;
  function setSlide(index, source) {
    if (syncLock) return;
    syncLock = true;
    currentSlide = norm(index);
    if (source !== 'lightbox' && swiper && lightboxOpen) swiper.slideTo(currentSlide, source === 'arrow' ? 300 : 0);
    if (lightboxOpen) {
      $('lightboxCounter').textContent = (currentSlide + 1) + ' / ' + COUNT;
      preload([FULL[norm(currentSlide - 1)], FULL[currentSlide], FULL[norm(currentSlide + 1)]]);
    }
    syncLock = false;
  }
  function changeSlide(dir) {
    var next = currentSlide + dir;
    if (next < 0 || next >= COUNT) { if (swiper) swiper.slideTo(norm(next), 0); setSlide(next, 'api'); }
    else setSlide(next, 'arrow');
  }

  /* ---------- Lightbox open / close ---------- */
  function openGalleryImage(index) {
    currentSlide = index;
    // Defer so Android's synthetic click after touchend doesn't land on the overlay and close it.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ensureLightboxReady().then(openLightbox).catch(function (e) { console.error('Gallery lightbox failed:', e); });
      });
    });
  }

  function openLightbox() {
    var overlay = $('lightboxOverlay');
    lightboxScrollPosition = window.scrollY;
    suppressCloseUntil = Date.now() + 500;
    overlay.classList.add('active');
    clearItemHover();
    var b = document.body.style;
    b.overflow = 'hidden'; b.position = 'fixed'; b.width = '100%'; b.top = '-' + lightboxScrollPosition + 'px';
    document.documentElement.style.overflow = 'hidden';
    lightboxOpen = true;
    swiper.update();
    swiper.slideTo(currentSlide, 0);
    setSlide(currentSlide, 'api');
  }

  function closeLightbox() {
    var overlay = $('lightboxOverlay');
    if (!lightboxOpen) return;
    overlay.classList.remove('active');
    var b = document.body.style;
    b.overflow = ''; b.position = ''; b.width = ''; b.top = '';
    var html = document.documentElement;
    html.style.overflow = '';
    html.style.scrollBehavior = 'auto';              // jump back instantly, no smooth scroll
    window.scrollTo(0, lightboxScrollPosition);
    html.style.scrollBehavior = '';
    lightboxOpen = false;
    clearItemHover();
  }

  /* ---------- Grid ---------- */
  function buildGrid() {
    var grid = $('galleryGrid');
    if (grid.childElementCount) return;
    var rotations = [-15, -10, -5, 0, 5, 10, 15, -12, 8, -8, 12, -6];
    THUMB.forEach(function (src, index) {
      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.setProperty('--rotation', rotations[index % rotations.length] + 'deg');
      item.innerHTML = '<img src="' + src + '" alt="The Ultimate Masterclass Dubai, photo ' + (index + 1) + '" draggable="false" loading="lazy" decoding="async"><div class="gallery-overlay"></div>';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGalleryImage(index); }
      });
      item.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openGalleryImage(index); });
      grid.appendChild(item);
    });
  }

  function expandGallery() {
    if (isGalleryExpanded) return;
    isGalleryExpanded = true;
    var stack = $('photoStack'), expanded = $('galleryExpanded');
    buildGrid();
    ensureLightboxReady().catch(function () {});

    var cards = stack.querySelectorAll('.stack-card');
    cards.forEach(function (card, i) {
      card.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.transform = 'rotate(' + ANGLES[i] + 'deg) translateY(' + DISTANCES[i] + 'px) scale(0.5)';
      card.style.opacity = '0';
    });

    setTimeout(function () {
      stack.classList.add('hidden');
      // Animate to the grid's real height, then release the cap so resizes don't clip it.
      expanded.style.maxHeight = expanded.scrollHeight + 'px';
      expanded.classList.add('active');
      setTimeout(function () { if (isGalleryExpanded) expanded.style.maxHeight = 'none'; }, 700);

      cards.forEach(function (card) { card.style.transition = ''; card.style.transform = ''; card.style.opacity = ''; });

      setTimeout(function () {
        document.querySelectorAll('.gallery-item').forEach(function (item, i) {
          setTimeout(function () { item.classList.add('visible'); }, Math.min(i, 12) * 50);
        });
      }, 100);
    }, 400);
  }

  function collapseGallery() {
    if (!isGalleryExpanded) return;
    isGalleryExpanded = false;
    var stack = $('photoStack'), expanded = $('galleryExpanded');

    document.querySelectorAll('.gallery-item.visible').forEach(function (item) {
      item.classList.add('collapsing');
      item.classList.remove('visible');
    });
    // From 'none' back to a pixel height first so the close can animate.
    expanded.style.maxHeight = expanded.scrollHeight + 'px';
    void expanded.offsetHeight;
    expanded.classList.remove('active');
    expanded.style.maxHeight = '';

    // Scroll back to the section straight away so the stack lands in view.
    var section = $('gallery');
    var navH = document.querySelector('.nav') ? document.querySelector('.nav').offsetHeight : 0;
    var top = section.getBoundingClientRect().top + window.pageYOffset - navH;
    if (window.pageYOffset > top) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

    setTimeout(function () {
      document.querySelectorAll('.gallery-item.collapsing').forEach(function (item) { item.classList.remove('collapsing'); });
      var cards = stack.querySelectorAll('.stack-card');
      cards.forEach(function (card, i) {
        card.style.transition = 'none';
        card.style.transform = 'rotate(' + ANGLES[i] + 'deg) translateY(' + DISTANCES[i] + 'px) scale(0.5)';
        card.style.opacity = '0';
      });
      stack.classList.remove('hidden');
      setTimeout(function () {
        cards.forEach(function (card) {
          card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
          card.style.transform = ''; card.style.opacity = '';
        });
      }, 50);
    }, 600);
  }

  /* ---------- Touch hover states ---------- */
  function clearItemHover() {
    document.querySelectorAll('.gallery-item.is-touch-hover').forEach(function (i) { i.classList.remove('is-touch-hover'); });
  }

  function init() {
    var stack = $('photoStack');
    if (!stack) return;
    stack.querySelectorAll('.stack-card').forEach(function (card, i) {
      if (STACK[i]) card.style.backgroundImage = 'url("' + STACK[i] + '")';
    });
    preload(STACK);

    stack.addEventListener('click', expandGallery);
    stack.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expandGallery(); } });
    stack.addEventListener('touchstart', function () { stack.classList.add('touch-active'); }, { passive: true });
    stack.addEventListener('touchend', function () { setTimeout(function () { stack.classList.remove('touch-active'); }, 300); });
    $('galleryCollapse').addEventListener('click', collapseGallery);

    var grid = $('galleryGrid');
    grid.addEventListener('touchstart', function (e) {
      var item = e.target.closest('.gallery-item');
      clearItemHover();
      if (item) item.classList.add('is-touch-hover');
    }, { passive: true });
    grid.addEventListener('touchend', function (e) {
      var item = e.target.closest('.gallery-item');
      if (item) item.classList.remove('is-touch-hover');
    }, { passive: true });
    grid.addEventListener('touchcancel', clearItemHover);
    document.addEventListener('touchstart', function (e) {
      if (!lightboxOpen && !e.target.closest('.gallery-item')) clearItemHover();
    }, { passive: true });

    var overlay = $('lightboxOverlay');
    $('lightboxSwipeContainer').addEventListener('click', function (e) {
      if (lightboxOpen && e.target.closest('img')) e.stopPropagation();
    });
    overlay.addEventListener('click', function (e) {
      if (Date.now() < suppressCloseUntil) return;
      if (e.target.closest('.lightbox-close, .lightbox-btn, .lightbox-counter')) return;
      closeLightbox();
    });
    overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    overlay.querySelector('.lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); changeSlide(-1); });
    overlay.querySelector('.lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); changeSlide(1); });

    document.addEventListener('keydown', function (e) {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') changeSlide(-1);
      if (e.key === 'ArrowRight') changeSlide(1);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
