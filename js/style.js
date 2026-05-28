/**
 * style.js — 主题管理模块
 * 功能：深色模式切换快捷入口
 * 依赖：Storage
 */

(function () {
  'use strict';

  /* 绑定所有深色模式切换按钮（页面中可能有多个） */
  function bindAllDarkToggles() {
    document.querySelectorAll('.dark-mode-toggle').forEach(function (el) {
      /* 防止重复绑定 */
      if (el.dataset.bound) return;
      el.dataset.bound = '1';

      el.classList.toggle('active', Storage.getDarkMode());

      el.addEventListener('click', function () {
        var isDark = !Storage.getDarkMode();
        Storage.setDarkMode(isDark);

        if (isDark) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }

        /* 同步所有切换按钮 */
        document.querySelectorAll('.dark-mode-toggle').forEach(function (t) {
          t.classList.toggle('active', isDark);
        });

        Toast.info(isDark ? '🌙 深色模式' : '☀️ 浅色模式');
      });
    });
  }

  function init() {
    bindAllDarkToggles();

    /* 监听动态创建的模态框打开，重新绑定 */
    document.addEventListener('modalOpen', function () {
      setTimeout(bindAllDarkToggles, 100);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
