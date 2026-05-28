/**
 * splash.js — HALO 开屏动画
 * 自动 3 秒后消失，点击可跳过
 */
(function () {
  'use strict';

  var DURATION = 3000; // 自动消失时间(ms)
  var splash = null;
  var dismissed = false;

  function createSplash() {
    splash = document.createElement('div');
    splash.className = 'splash-screen';
    splash.innerHTML =
      '<div class="splash-particles">' +
        '<div class="splash-dot"></div>' +
        '<div class="splash-dot"></div>' +
        '<div class="splash-dot"></div>' +
        '<div class="splash-dot"></div>' +
        '<div class="splash-dot"></div>' +
        '<div class="splash-dot"></div>' +
        '<div class="splash-dot"></div>' +
        '<div class="splash-dot"></div>' +
      '</div>' +
      '<div class="splash-glow splash-glow-1"></div>' +
      '<div class="splash-glow splash-glow-2"></div>' +
      '<div class="splash-ring">' +
        '<div class="splash-logo">HALO</div>' +
      '</div>' +
      '<div class="splash-sub">your emotional universe</div>' +
      '<div class="splash-tap">tap anywhere</div>' +
      '<div class="splash-loader"></div>';

    document.body.appendChild(splash);

    // 点击跳过
    splash.addEventListener('click', dismiss);
    splash.addEventListener('touchstart', dismiss, { passive: true });

    // 自动消失
    setTimeout(dismiss, DURATION);
  }

  function dismiss() {
    if (dismissed || !splash) return;
    dismissed = true;

    splash.classList.add('splash-out');

    setTimeout(function () {
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
        splash = null;
      }
    }, 700);
  }

  // 页面加载时立即显示
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSplash);
  } else {
    createSplash();
  }
})();
