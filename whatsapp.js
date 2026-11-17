/* Floating WhatsApp button (same as janatravel). */
(function () {
  var PHONE = "447821859250";
  var MESSAGE = "Hi! I'd like to know more about The Ultimate Masterclass Dubai.";

  var link = document.createElement("a");
  link.href = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(MESSAGE);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "wa-float-btn";
  link.setAttribute("aria-label", "Chat with us on WhatsApp");

  link.innerHTML =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.657 4.522 1.796 6.382L4 29l7.82-1.75A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.978 16.47c-.29.816-1.44 1.5-2.36 1.696-.63.132-1.452.238-4.22-.906-3.542-1.464-5.82-5.05-6-5.286-.176-.236-1.432-1.906-1.432-3.636s.91-2.578 1.234-2.932c.29-.316.63-.396.842-.396.212 0 .424.002.61.012.196.01.46-.074.72.55.29.686.982 2.416 1.068 2.592.086.176.144.382.028.618-.116.236-.174.382-.34.588-.176.204-.36.454-.514.61-.176.176-.36.366-.154.72.206.354.914 1.51 1.964 2.446 1.35 1.204 2.49 1.578 2.844 1.754.354.176.562.146.77-.088.206-.236.884-1.032 1.12-1.386.236-.354.472-.294.796-.176.324.118 2.058.972 2.41 1.148.354.176.588.264.674.412.088.148.088.858-.202 1.672Z"/></svg>';

  var style = document.createElement("style");
  style.textContent =
    ".wa-float-btn{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));width:56px;height:56px;" +
    "border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 4px 14px rgba(0,0,0,0.25);z-index:9999;transition:transform .2s ease;}" +
    ".wa-float-btn:hover{transform:scale(1.08);}" +
    ".wa-float-btn svg{width:30px;height:30px;}" +
    "@media (max-width:480px){.wa-float-btn{right:14px;bottom:calc(14px + env(safe-area-inset-bottom));width:50px;height:50px;}" +
    ".wa-float-btn svg{width:26px;height:26px;}}";

  document.head.appendChild(style);
  document.body.appendChild(link);
})();
