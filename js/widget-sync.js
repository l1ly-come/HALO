(function () {
  'use strict';

  function syncWidgets() {
    // ── Music Widget ──
    var musicEl = document.querySelector('.widget-music-wide');
    if (musicEl && window.MusicPlayer) {
      var info = MusicPlayer.getListenTogetherInfo();
      var titleEl = musicEl.querySelector('.w-m-title');
      var artistEl = musicEl.querySelector('.w-m-artist');
      if (info && titleEl) {
        titleEl.textContent = info.title;
        artistEl.textContent = info.artist || info.playlistName || '—';
        musicEl.classList.add('playing');
      } else {
        if (MusicPlayer.isPlaying && !MusicPlayer.isPlaying()) {
          musicEl.classList.remove('playing');
        }
      }
    }

    // ── Emotion Widget ──
    var emoWidget = document.querySelector('.widget-square[data-app="emotion"]');
    if (emoWidget) {
      try {
        var history = JSON.parse(Storage.get('emotion_history', '[]'));
        if (history.length > 0) {
          var today = history[0];
          var iconEl = emoWidget.querySelector('.w-icon');
          var descEl = emoWidget.querySelector('.w-desc');
          if (iconEl && today.icon) iconEl.textContent = today.icon;
          if (descEl && today.label) descEl.textContent = today.label;
        }
      } catch (e) {}
    }
  }

  // 首次同步 + 轮询
  function init() {
    syncWidgets();
    setInterval(syncWidgets, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Widget 点击 → 打开对应 app
  document.addEventListener('click', function (e) {
    var widget = e.target.closest('.widget-music-wide, .widget-square');
    if (!widget) return;
    var app = widget.dataset.app;
    if (app) {
      var modal = document.getElementById('modal-' + app);
      if (modal) {
        modal.classList.add('active');
        document.dispatchEvent(new CustomEvent('modalOpen', { detail: { name: app } }));
      }
    }
  });
})();
