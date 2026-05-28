/**
 * random-draw.js — 随机抽签 v1
 * 选择困难症终结器
 */
(function () {
  'use strict';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(ts) { var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  var PRESETS = [
    { name: '🧋 Afternoon Tea',  items: ['Latte', 'Matcha', 'Oat Milk Tea', 'Americano', 'Peach Oolong', 'Dirty Chai', 'Taro Milk', 'Earl Grey'] },
    { name: '🍽️ What to Eat',   items: ['Korean BBQ', 'Ramen', 'Hot Pot', 'Sushi', 'Pasta', 'Fried Chicken', 'Pho', 'Burger'] },
    { name: '🎬 Weekend Plan',   items: ['Movie', 'Cafe Hopping', 'Museum', 'Park Walk', 'Stay Home', 'Shopping', 'Cooking', 'Road Trip'] },
    { name: '🎵 Mood Playlist',  items: ['Chill Lo-fi', 'K-pop', 'Jazz', 'Indie', 'Classical', 'R&B', 'Acoustic', 'Electronic'] },
    { name: '🎲 Yes or No',      items: ['Yes', 'No', 'Maybe', 'Ask Again Later', 'Definitely', 'Not Today'] }
  ];

  function getHistory() { try { return JSON.parse(Storage.get('draw_history', '[]')); } catch (e) { return []; } }
  function saveHistory(h) { Storage.set('draw_history', JSON.stringify(h)); }

  var _T = window.T || function(k){return k};
  var currentView = 'main';

  function render() {
    var panel = document.getElementById('draw-panel');
    if (!panel) return;
    if (currentView === 'history') { renderHistory(panel); return; }
    renderMain(panel);
  }

  function renderMain(panel) {
    var history = getHistory();

    var presetsHtml = PRESETS.map(function (p, i) {
      return '<div class="draw-preset" data-idx="' + i + '">' +
        '<div class="draw-preset-name">' + esc(p.name) + '</div>' +
        '<div class="draw-preset-count">' + p.items.length + ' '+_T('options')+'</div>' +
      '</div>';
    }).join('');

    var lastHtml = '';
    if (history.length) {
      var last = history[0];
      lastHtml =
        '<div class="draw-section-title">'+_T('Last Draw')+'</div>' +
        '<div class="draw-last">' +
          '<div class="draw-last-result">' + esc(last.result) + '</div>' +
          '<div class="draw-last-from">' + esc(last.category || 'Custom') + ' · ' + fmtDate(last.ts) + '</div>' +
        '</div>';
    }

    panel.innerHTML =
      '<div class="draw-app">' +
        '<div class="draw-header">' +
          '<div class="draw-hdr-left">' +
            '<div class="draw-title">'+_T('Random Draw')+'</div>' +
            '<div class="draw-subtitle">'+_T('Let fate decide')+'</div>' +
          '</div>' +
          '<div class="draw-hdr-right">' +
            '<button class="gal-hdr-btn" id="draw-hist-btn" title="History"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></button>' +
            '<button class="gal-hdr-btn" id="draw-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="draw-body">' +

          '<div class="draw-custom-card">' +
            '<div class="draw-custom-title">'+_T('Custom Draw')+'</div>' +
            '<textarea class="s-input draw-custom-input" id="draw-custom" rows="3" placeholder="Enter options, one per line...\ne.g.\nBubble tea\nCoffee\nJuice"></textarea>' +
            '<button class="draw-go-btn" id="draw-custom-go">'+_T('Draw!')+'</button>' +
          '</div>' +

          '<div class="draw-section-title">'+_T('Quick Picks')+'</div>' +
          '<div class="draw-preset-grid">' + presetsHtml + '</div>' +

          lastHtml +

        '</div>' +
      '</div>';

    document.getElementById('draw-close').onclick = function () {
      document.getElementById('modal-draw').classList.remove('active');
    };
    document.getElementById('draw-hist-btn').onclick = function () {
      currentView = 'history'; render();
    };

    document.getElementById('draw-custom-go').onclick = function () {
      var text = (document.getElementById('draw-custom').value || '').trim();
      if (!text) { Toast.warn(_T('Enter some options')); return; }
      var items = text.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (items.length < 2) { Toast.warn(_T('Need at least 2 options')); return; }
      startDraw(items, 'Custom');
    };

    panel.querySelector('.draw-preset-grid').addEventListener('click', function (e) {
      var el = e.target.closest('.draw-preset');
      if (!el) return;
      var preset = PRESETS[parseInt(el.dataset.idx, 10)];
      if (preset) startDraw(preset.items, preset.name);
    });
  }

  function startDraw(items, category) {
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal draw-anim-modal" style="max-width:280px;text-align:center;padding:2rem 1.5rem;overflow:hidden">' +
        '<div class="draw-anim-label" id="draw-anim-label">'+_T('Shuffling...')+'</div>' +
        '<div class="draw-anim-display" id="draw-anim-display"></div>' +
        '<div class="draw-anim-sub" id="draw-anim-sub"></div>' +
      '</div>';
    document.body.appendChild(ov);

    var display = document.getElementById('draw-anim-display');
    var label = document.getElementById('draw-anim-label');
    var sub = document.getElementById('draw-anim-sub');
    var count = 0;
    var total = 15 + Math.floor(Math.random() * 8);
    var result = items[Math.floor(Math.random() * items.length)];

    function tick() {
      if (count >= total) {
        display.textContent = result;
        display.style.fontSize = '1.8rem';
        display.style.fontWeight = '300';
        display.style.animation = 'popIn 0.3s var(--ease-bounce)';
        label.textContent = '✨';
        label.style.fontSize = '1.5rem';
        sub.textContent = category || 'Custom';
        sub.style.opacity = '1';

        var h = getHistory();
        h.unshift({ result: result, category: category, items: items, ts: Date.now() });
        if (h.length > 50) h = h.slice(0, 50);
        saveHistory(h);

        setTimeout(function () {
          ov.onclick = function () { ov.remove(); render(); };
          sub.textContent += ' · ' + _T('Tap to close');
        }, 500);
        return;
      }

      var speed = count < 8 ? 60 : count < 12 ? 120 : 200 + (count - 12) * 80;
      var show = count >= total - 1 ? result : items[Math.floor(Math.random() * items.length)];
      display.textContent = show;
      display.style.fontSize = count < total - 3 ? '1.1rem' : '1.4rem';
      count++;
      setTimeout(tick, speed);
    }

    setTimeout(tick, 300);
  }

  function renderHistory(panel) {
    var history = getHistory();
    var listHtml = history.length
      ? history.map(function (h, i) {
          return '<div class="draw-hist-item">' +
            '<div class="draw-hist-result">' + esc(h.result) + '</div>' +
            '<div class="draw-hist-meta">' + esc(h.category || 'Custom') + ' · ' + fmtDate(h.ts) + '</div>' +
          '</div>';
        }).join('')
      : '<div class="gal-empty" style="padding:2rem"><div class="gal-empty-text">'+_T('No draws yet')+'</div></div>';

    panel.innerHTML =
      '<div class="draw-app">' +
        '<div class="draw-header">' +
          '<div class="draw-hdr-left" style="display:flex;align-items:center;gap:0.5rem">' +
            '<button class="gal-back-btn" id="draw-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
            '<div><div class="draw-title">'+_T('History')+'</div><div class="draw-subtitle">' + history.length + ' '+_T('draws')+'</div></div>' +
          '</div>' +
          (history.length ? '<button class="gal-hdr-btn" id="draw-clear-hist"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>' : '') +
        '</div>' +
        '<div class="draw-body"><div class="draw-hist-list">' + listHtml + '</div></div>' +
      '</div>';

    document.getElementById('draw-back').onclick = function () { currentView = 'main'; render(); };
    var cb = document.getElementById('draw-clear-hist');
    if (cb) cb.onclick = function () { if (confirm('Clear?')) { saveHistory([]); renderHistory(panel); } };
  }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'draw') { currentView = 'main'; render(); }
  });
})();
