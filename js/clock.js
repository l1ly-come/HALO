/**
 * clock.js — 优化版
 * 改动：缓存 DOM 元素避免每秒查询
 */

(function () {
  'use strict';

  var WEEKS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /* 缓存 DOM 元素 */
  var clockEl = null;
  var dateEl  = null;
  var cached  = false;

  function ensureCache() {
    if (cached) return;
    clockEl = document.getElementById('clock');
    dateEl  = document.getElementById('date-text');
    cached  = true;
  }

  function tick() {
    ensureCache();
    var now  = new Date();
    var h    = pad(now.getHours());
    var m    = pad(now.getMinutes());
    var s    = pad(now.getSeconds());
    var y    = now.getFullYear();
    var mo   = pad(now.getMonth() + 1);
    var d    = pad(now.getDate());
    var week = WEEKS[now.getDay()];

    if (clockEl) clockEl.textContent = h + ':' + m + ':' + s;
    if (dateEl)  dateEl.textContent  = y + '/' + mo + '/' + d + '\u00a0' + week;
  }

  tick();
  setInterval(tick, 1000);
})();
