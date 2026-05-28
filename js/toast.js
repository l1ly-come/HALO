/**
 * toast.js — 轻量级 Toast 通知系统
 * 替代 alert()，统一通知体验
 * 在 index.html 中 storage.js 之后、app.js 之前引入
 */
(function () {
  'use strict';

  var container = null;
  var DURATION  = 2800;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  function show(msg, type, duration) {
    var wrap = ensureContainer();
    var el   = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    el.textContent = msg;
    wrap.appendChild(el);

    requestAnimationFrame(function () { el.classList.add('toast--visible'); });

    var dur = duration || DURATION;
    setTimeout(function () {
      el.classList.remove('toast--visible');
      el.addEventListener('transitionend', function () { el.remove(); });
      setTimeout(function () { if (el.parentNode) el.remove(); }, 400);
    }, dur);
  }

  window.Toast = {
    info:    function (m, d) { show(m, 'info',    d); },
    success: function (m, d) { show(m, 'success', d); },
    error:   function (m, d) { show(m, 'error',   d); },
    warn:    function (m, d) { show(m, 'warn',    d); }
  };
})();
