/**
 * app.js — v7 (心声=AI自动生成，点聊天界面AI头像触发)
 */
(function () {
  'use strict';

  function openModal(name) {
    var el = document.getElementById('modal-' + name);
    if (!el) return;
    el.classList.add('active');
    document.dispatchEvent(new CustomEvent('modalOpen', { detail: { name: name } }));
  }

  function closeModal(name) {
    var el = document.getElementById('modal-' + name);
    if (el) el.classList.remove('active');
  }

  function bindAppIcons() {
    document.querySelectorAll('[data-app]').forEach(function (el) {
      el.addEventListener('click', function () {
        openModal(el.getAttribute('data-app'));
      });
    });
  }

  function bindCloseButtons() {
    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(btn.getAttribute('data-close'));
      });
    });
  }

  function bindOverlayClose() {
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });
  }

  function bindNoteAutoSave() {
    var el = document.getElementById('note-input');
    if (!el) return;
    el.value = Storage.get('noteInput', '');
    el.addEventListener('input', function () {
      Storage.set('noteInput', el.value);
    });
  }

  function bindMainInputSave() {
    var el = document.getElementById('main-input');
    if (!el) return;
    el.value = Storage.get('mainInput', '');
    el.addEventListener('input', function () {
      Storage.set('mainInput', el.value);
    });
  }

  function bindVinyl() {
    var vinyl = document.getElementById('music-vinyl');
    if (!vinyl) return;
    vinyl.addEventListener('click', function () {
      vinyl.classList.toggle('paused');
    });
  }

  function compressForStorage(dataUrl, maxW, cb) {
    var img = new Image();
    img.onload = function () {
      var w = img.width, hh = img.height;
      if (w > maxW) { hh = Math.round(hh * maxW / w); w = maxW; }
      var c = document.createElement('canvas');
      c.width = w; c.height = hh;
      c.getContext('2d').drawImage(img, 0, 0, w, hh);
      cb(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  function loadHeroImages() {
    var heroAv = Storage.get('heroAvatar', '');
    var heroBg = Storage.get('heroBanner', '');
    var interAv = Storage.get('interactAvatar', '');
    if (heroAv) { var img = document.getElementById('hero-avatar'); if (img) img.src = heroAv; }
    if (heroBg) { var banner = document.getElementById('hero-banner'); if (banner) { banner.style.cssText += ';background-image:url("' + heroBg + '") !important;background-size:cover !important;background-position:center !important;'; } }
    if (interAv) { var img2 = document.getElementById('interact-avatar'); if (img2) img2.src = interAv; }
  }

  function bindHeroEdits() {
    function pickAndSave(storageKey, loadFn) {
      if (typeof showImagePicker !== 'undefined') {
        showImagePicker({ title: 'Select Image', currentUrl: Storage.get(storageKey, ''), maxWidth: storageKey === 'heroBanner' ? 1200 : 400, quality: 0.7,
          onConfirm: function (url) {
            if (url) { if (url.indexOf('data:') === 0) { compressForStorage(url, storageKey === 'heroBanner' ? 1200 : 400, function (c) { Storage.set(storageKey, c); loadFn(); }); } else { Storage.set(storageKey, url); loadFn(); } }
            else { Storage.set(storageKey, ''); loadFn(); }
          }
        });
      } else {
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', function () { var f = inp.files[0]; if (!f) return; var reader = new FileReader(); reader.onload = function () { compressForStorage(reader.result, storageKey === 'heroBanner' ? 1200 : 400, function (c) { Storage.set(storageKey, c); loadFn(); }); }; reader.readAsDataURL(f); });
        inp.click();
      }
    }
    var avEdit = document.getElementById('hero-avatar-edit');
    if (avEdit) avEdit.addEventListener('click', function (e) { e.stopPropagation(); pickAndSave('heroAvatar', loadHeroImages); });
    var bgEdit = document.getElementById('hero-banner-edit');
    if (bgEdit) bgEdit.addEventListener('click', function (e) { e.stopPropagation(); pickAndSave('heroBanner', loadHeroImages); });
    var interEdit = document.getElementById('interact-avatar-edit');
    if (interEdit) interEdit.addEventListener('click', function (e) { e.stopPropagation(); pickAndSave('interactAvatar', loadHeroImages); });
  }

  function init() {
    bindAppIcons();
    bindCloseButtons();
    bindOverlayClose();
    bindNoteAutoSave();
    bindMainInputSave();
    bindVinyl();
    loadHeroImages();
    bindHeroEdits();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/**
 * 心声系统 — 点击聊天界面AI头像，AI自动生成
 */
(function () {
  'use strict';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function timeAgo(ts) { if (!ts) return ''; var m = Math.floor((Date.now() - ts) / 60000); if (m < 1) return 'now'; if (m < 60) return m + 'm'; var h = Math.floor(m / 60); if (h < 24) return h + 'h'; return Math.floor(h / 24) + 'd'; }

  function getCache(fid) {
    try { var c = JSON.parse(Storage.get('heart_' + fid, '{}')); if (c.ts && Date.now() - c.ts < 300000) return c; return null; } catch (e) { return null; }
  }
  function setCache(fid, d) { Storage.set('heart_' + fid, JSON.stringify(d)); }

  /* 只拦截聊天界面里AI消息旁的头像 (.msg-avatar) */
  document.addEventListener('click', function (e) {
    var av = e.target.closest('.msg-avatar');
    if (!av) return;
    var row = av.closest('.msg-row');
    if (!row || row.classList.contains('me')) return;

    e.stopPropagation();
    e.preventDefault();

    /* 找当前聊天好友 */
    var convName = document.querySelector('.conv-name');
    if (!convName) return;
    var friends = Storage.getFriends();
    var friend = null;
    var nameText = convName.textContent.trim();

    friends.forEach(function (f) {
      if ((f.displayName || f.name || '') === nameText || (f.realName || '') === nameText) friend = f;
    });
    if (!friend) {
      var avSrc = av.src || '';
      friends.forEach(function (f) { if (f.avatar && avSrc.indexOf(f.avatar) >= 0) friend = f; });
    }

    if (friend) showHeart(friend);
  }, true);

  function showHeart(friend) {
    var cached = getCache(friend.id);
    if (cached) { renderCard(friend, cached); return; }
    renderLoading(friend);
    generateHeart(friend);
  }

  function renderLoading(friend) {
    closeHeart();
    var ov = document.createElement('div');
    ov.className = 'heart-overlay';
    ov.innerHTML =
      '<div class="heart-card">' +
        '<button class="heart-x" id="hrt-x">&times;</button>' +
        '<div class="heart-av-area"><div class="heart-av-ring"><img src="' + esc(friend.avatar) + '"/></div></div>' +
        '<div class="heart-name">' + esc(friend.displayName || friend.name) + '</div>' +
        '<div class="heart-quote"><span class="heart-loading-text">reading mind...</span></div>' +
      '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('heart-show'); });
    document.getElementById('hrt-x').onclick = closeHeart;
    ov.onclick = function (e) { if (e.target === ov) closeHeart(); };
  }

  function renderCard(friend, data) {
    closeHeart();
    var ov = document.createElement('div');
    ov.className = 'heart-overlay';
    ov.innerHTML =
      '<div class="heart-card">' +
        '<button class="heart-x" id="hrt-x">&times;</button>' +
        '<div class="heart-av-area"><div class="heart-av-ring"><img src="' + esc(friend.avatar) + '"/></div></div>' +
        '<div class="heart-name">' + esc(friend.displayName || friend.name) + '</div>' +
        '<div class="heart-status-dot"><div class="heart-dot" style="background:' + esc(data.color || '#58C322') + '"></div><span class="heart-dot-label">' + esc(data.mood || 'Thinking') + '</span></div>' +
        '<div class="heart-quote">' + esc(data.text || '') + '</div>' +
        (data.ts ? '<div class="heart-ts">' + timeAgo(data.ts) + '</div>' : '') +
        '<div class="heart-btns"><button class="heart-btn heart-btn-primary" id="hrt-refresh">Refresh</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('heart-show'); });
    document.getElementById('hrt-x').onclick = closeHeart;
    ov.onclick = function (e) { if (e.target === ov) closeHeart(); };
    document.getElementById('hrt-refresh').onclick = function () {
      closeHeart();
      Storage.remove('heart_' + friend.id);
      renderLoading(friend);
      generateHeart(friend);
    };
  }

  function generateHeart(friend) {
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) { closeHeart(); Toast.warn('Set API key first'); return; }
    var cn = friend.realName || friend.displayName || friend.name || 'AI';
    var msgs = Storage.getMessages(friend.id);
    var recent = msgs.slice(-8).map(function (m) {
      return (m.role === 'user' ? 'User' : cn) + ': ' + (typeof m.content === 'string' ? m.content.slice(0, 60) : '');
    }).join('\n');
    var now = new Date();
    var timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, { method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{
          role: 'system',
          content: 'You are ' + cn + '. ' + (friend.prompt || '') +
            '\n\nBased on recent conversation and current time (' + timeStr + '), generate your current inner thought/mood.' +
            '\nOutput JSON only: {"text":"your inner thought (1 short sentence, max 30 chars)","mood":"one word (e.g. Happy, Thinking, Missing you, Sleepy, Excited)","color":"hex color matching mood (e.g. #58C322 green, #FF6B6B pink, #FFB347 warm, #87CEEB calm, #C7C7C7 tired)"}'
        },
        { role: 'user', content: recent || 'No recent conversation. Generate based on time of day.' }],
        temperature: 0.9, stream: false
      })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var raw = ''; try { raw = d.choices[0].message.content; } catch (e) {}
      var jm = raw.match(/\{[\s\S]*\}/);
      if (jm) {
        try {
          var p = JSON.parse(jm[0]);
          var result = { text: (p.text || '').slice(0, 50), mood: p.mood || 'Thinking', color: (p.color && p.color.match(/^#/)) ? p.color : '#58C322', ts: Date.now() };
          setCache(friend.id, result);
          renderCard(friend, result);
          return;
        } catch (e) {}
      }
      var fallback = { text: '...', mood: 'Thinking', color: '#C7C7C7', ts: Date.now() };
      setCache(friend.id, fallback);
      renderCard(friend, fallback);
    }).catch(function () { closeHeart(); Toast.error('Failed'); });
  }

  function closeHeart() {
    document.querySelectorAll('.heart-overlay').forEach(function (el) {
      el.classList.remove('heart-show');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 200);
    });
  }
})();
