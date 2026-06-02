/**
 * settings.js — v6 Final
 */
(function () {
  'use strict';

  function buildUrl(resource, baseUrl, apiKey) {
    var pureBase = (baseUrl || Storage.get('api_base_url', '') || '').replace(/\/+$/, '');
    var key = apiKey || Storage.get('apiKey', '');
    var finalUrl = pureBase + '/v1' + resource;
    return { url: finalUrl, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key } };
  }

  window.buildApiUrl = function (resource, opts) {
    opts = opts || {};
    return buildUrl(resource, opts.baseUrl || Storage.get('api_base_url', ''), opts.apiKey || Storage.get('apiKey', ''));
  };

  function apiFetch(resource, baseUrl, apiKey, method, body) {
    var req = buildUrl(resource, baseUrl, apiKey);
    var opts = { method: method || 'GET', headers: req.headers };
    if (body) opts.body = JSON.stringify(body);
    return fetch(req.url, opts).then(function (r) {
      if (r.ok) return r.json();
      return r.text().then(function (txt) {
        var msg; try { var j = JSON.parse(txt); msg = (j.error && (j.error.message || j.error.code)) || txt.slice(0, 200); } catch (_) { msg = txt.slice(0, 200) || ('HTTP ' + r.status); }
        throw new Error('HTTP ' + r.status + ' — ' + msg);
      });
    });
  }

  function applyDarkMode(dark) {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }

  function initDarkMode() {
    var isDark = Storage.getDarkMode();
    applyDarkMode(isDark);
    document.querySelectorAll('.dark-mode-toggle').forEach(function (el) { el.classList.toggle('active', isDark); });
  }

  function applyAppearance() {
    var wall = Storage.get('wallpaper', '');
    var fs = Storage.get('fontSize', '16px');
    if (wall) {
      if (wall.indexOf('data:') === 0 || wall.indexOf('http') === 0) {
        document.body.style.backgroundImage = 'url("' + wall + '")';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else { document.body.style.background = wall; }
    }
    document.documentElement.style.setProperty('--font-size-base', fs);
    initDarkMode();
  }

  function populateForm() {
    var elKey = document.getElementById('set-api-key');
    var elBase = document.getElementById('set-base-url');
    if (elKey) elKey.value = Storage.get('apiKey', '');
    if (elBase) elBase.value = Storage.get('api_base_url', '');

    var saved = Storage.get('modelName', 'gemini-1.5-flash');
    var modelSel = document.getElementById('set-model');
    if (modelSel) {
      var exists = Array.prototype.some.call(modelSel.options, function (o) { return o.value === saved; });
      if (!exists) { var opt = document.createElement('option'); opt.value = saved; opt.textContent = saved; modelSel.appendChild(opt); }
      modelSel.value = saved;
    }
    var tempSlider = document.getElementById('set-temperature');
    var tempDisplay = document.getElementById('temp-display');
    var savedTemp = Storage.getTemperature();
    if (tempSlider) tempSlider.value = savedTemp;
    if (tempDisplay) tempDisplay.textContent = savedTemp.toFixed(1);
  }

  function refreshStats() {
    var chatCount = Storage.getTodayChatCount();
    var elChat = document.getElementById('stat-chat-count');
    var barChat = document.getElementById('bar-chat');
    if (elChat) elChat.textContent = chatCount;
    if (barChat) barChat.style.width = Math.min(chatCount / 50 * 100, 100) + '%';
    var noteKB = Storage.getNoteSize();
    var elNote = document.getElementById('stat-note-size');
    var barNote = document.getElementById('bar-note');
    if (elNote) elNote.textContent = noteKB + ' KB';
    if (barNote) barNote.style.width = Math.min(parseFloat(noteKB) / 50 * 100, 100) + '%';
    var tokenUsed = Storage.getTokenUsed();
    var elToken = document.getElementById('stat-token');
    var barToken = document.getElementById('bar-token');
    if (elToken) elToken.textContent = tokenUsed + ' / 1000';
    if (barToken) barToken.style.width = Math.min(tokenUsed / 1000 * 100, 100) + '%';
  }

  function formVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function flashBtn(btn, text, dur) { if (!btn) return; var orig = btn.textContent; btn.textContent = text; setTimeout(function () { btn.textContent = orig; }, dur || 1500); }

  function bindButtons() {
    var btnApi = document.getElementById('btn-save-api');
    if (btnApi) btnApi.addEventListener('click', function () {
      Storage.set('apiKey', formVal('set-api-key'));
      Storage.set('api_base_url', formVal('set-base-url'));
      Storage.set('modelName', formVal('set-model') || 'gemini-1.5-flash');
      var ts = document.getElementById('set-temperature');
      if (ts) Storage.setTemperature(parseFloat(ts.value));
      Toast.success('API settings saved'); flashBtn(btnApi, 'Saved');
    });

    var btnTest = document.getElementById('btn-test-api');
    if (btnTest) btnTest.addEventListener('click', function () {
      var key = formVal('set-api-key') || Storage.get('apiKey', '');
      var base = formVal('set-base-url') || Storage.get('api_base_url', '');
      if (!key) { Toast.warn('Enter API Key first'); return; }
      if (!base) { Toast.warn('Enter Base URL first'); return; }
      var orig = btnTest.textContent; btnTest.textContent = 'Testing...'; btnTest.disabled = true;
      apiFetch('/models', base, key)
        .then(function (data) { Toast.success('Connected! Models: ' + (data.data || []).length); })
        .catch(function (e) { Toast.error('Failed: ' + e.message); })
        .finally(function () { btnTest.textContent = orig; btnTest.disabled = false; });
    });

    var btnFetch = document.getElementById('btn-fetch-models');
    if (btnFetch) btnFetch.addEventListener('click', function () {
      var key = formVal('set-api-key') || Storage.get('apiKey', '');
      var base = formVal('set-base-url') || Storage.get('api_base_url', '');
      if (!key) { Toast.warn('Enter API Key first'); return; }
      if (!base) { Toast.warn('Enter Base URL first'); return; }
      var orig = btnFetch.textContent; btnFetch.textContent = 'Fetching...'; btnFetch.disabled = true;
      apiFetch('/models', base, key)
        .then(function (data) {
          var models = (data.data || []).map(function (m) { return m.id || ''; }).filter(Boolean).sort();
          if (!models.length) { Toast.warn('No models found'); return; }
          var sel = document.getElementById('set-model'); if (!sel) return;
          var cur = sel.value; sel.innerHTML = '';
          models.forEach(function (n) { var opt = document.createElement('option'); opt.value = n; opt.textContent = n; sel.appendChild(opt); });
          sel.value = models.indexOf(cur) >= 0 ? cur : models[0];
          Storage.set('modelName', sel.value);
          Toast.success(models.length + ' models loaded');
        })
        .catch(function (e) { Toast.error('Failed: ' + e.message); })
        .finally(function () { btnFetch.textContent = orig; btnFetch.disabled = false; });
    });

    var modelSel = document.getElementById('set-model');
    if (modelSel) modelSel.addEventListener('change', function () { Storage.set('modelName', modelSel.value); });

    var tempSlider = document.getElementById('set-temperature');
    var tempDisplay = document.getElementById('temp-display');
    if (tempSlider && tempDisplay) tempSlider.addEventListener('input', function () { tempDisplay.textContent = parseFloat(tempSlider.value).toFixed(1); });

    var btnExport = document.getElementById('btn-export-data');
    if (btnExport) btnExport.addEventListener('click', function () {
      var json = Storage.exportAll(); var blob = new Blob([json], { type: 'application/json' }); var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = 'xsj_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); Toast.success('Exported');
    });

    var btnImport = document.getElementById('btn-import-data');
    if (btnImport) btnImport.addEventListener('click', function () {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
      inp.addEventListener('change', function () {
        var f = inp.files[0]; if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          if (!confirm('Import will overwrite all data. Continue?')) return;
          if (Storage.importAll(reader.result)) { Toast.success('Imported, reloading...'); setTimeout(function () { location.reload(); }, 800); }
          else Toast.error('Import failed');
        };
        reader.readAsText(f);
      });
      inp.click();
    });

    var btnClear = document.getElementById('btn-clear-data');
    if (btnClear) btnClear.addEventListener('click', function () {
      if (!confirm('Clear all data? This cannot be undone.')) return;
      Storage.clearAll(); Toast.info('Cleared, reloading...'); setTimeout(function () { location.reload(); }, 800);
    });
  }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'settings') { populateForm(); refreshStats(); }
  });

  function init() { applyAppearance(); bindButtons(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/**
 * Theme System — 独立模块
 */
(function () {
  'use strict';

    var APPS = [
    { key: 'chat', name: 'Chat' },
    
    { key: 'settings', name: 'Settings' },
    { key: 'pulse', name: 'Weverse' },
    { key: 'gallery', name: 'Gallery' },
    { key: 'fortune', name: 'Fortune' },
   
    { key: 'draw', name: 'Draw' }
  ];


  function getTheme() { try { return JSON.parse(Storage.get('themeConfig', '{}')); } catch (e) { return {}; } }
  function saveTheme(t) { Storage.set('themeConfig', JSON.stringify(t)); }

  function injectCustomFont() {
    var fontData = Storage.get('customFontData', '');
    var fontName = Storage.get('customFontName', '');
    if (!fontData || !fontName) return;
    var old = document.getElementById('custom-font-face'); if (old) old.remove();
    var ext = fontName.split('.').pop().toLowerCase();
    var format = ext === 'woff' ? 'woff' : ext === 'woff2' ? 'woff2' : ext === 'otf' ? 'opentype' : 'truetype';
    var style = document.createElement('style');
    style.id = 'custom-font-face';
    style.textContent = '@font-face{font-family:"CustomUserFont";src:url(' + fontData + ') format("' + format + '");font-weight:normal;font-style:normal;}';
    document.head.appendChild(style);
  }

  function applyTheme() {
    var t = getTheme();
    injectCustomFont();
    if (t.fontFamily === '__custom__') {
      if (Storage.get('customFontData', '')) document.body.style.fontFamily = '"CustomUserFont",-apple-system,sans-serif';
    } else if (t.fontFamily) { document.body.style.fontFamily = t.fontFamily; }
    else { document.body.style.fontFamily = ''; }
    if (t.fontSize) document.documentElement.style.setProperty('--font-size-base', t.fontSize + 'px');
    if (t.wallpaper) {
      document.body.style.backgroundImage = 'url("' + t.wallpaper + '")';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else { document.body.style.backgroundImage = ''; document.body.style.backgroundAttachment = ''; }
    APPS.forEach(function (app) {
      var iconUrl = t['icon_' + app.key];
      var cell = document.querySelector('[data-app="' + app.key + '"] .app-icon-wrap');
      if (cell && iconUrl) cell.innerHTML = '<img src="' + iconUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>';
    });
  }

  function populateThemeForm() {
    var t = getTheme();
    var fontSel = document.getElementById('theme-font');
    var fsSlider = document.getElementById('theme-fs');
    var fsVal = document.getElementById('theme-fs-val');
    var wallInp = document.getElementById('theme-wallpaper');
    var darkToggle = document.getElementById('theme-dark-toggle');
    var fontNameEl = document.getElementById('theme-font-name');
    var fontPreview = document.getElementById('theme-font-preview');
    var customArea = document.getElementById('theme-custom-font-area');

    if (fontSel) fontSel.value = t.fontFamily || '';
    if (fsSlider) fsSlider.value = t.fontSize || 15;
    if (fsVal) fsVal.textContent = (t.fontSize || 15) + 'px';
    if (wallInp) wallInp.value = t.wallpaper || '';
    if (darkToggle) darkToggle.classList.toggle('active', Storage.getDarkMode());

    var cfName = Storage.get('customFontName', '');
    var cfData = Storage.get('customFontData', '');
    if (fontNameEl) fontNameEl.textContent = cfName || 'No custom font';
   if (customArea) customArea.style.display = '';

    if (fontPreview && cfData && t.fontFamily === '__custom__') { fontPreview.style.display = ''; fontPreview.style.fontFamily = '"CustomUserFont",sans-serif'; }
    else if (fontPreview) { fontPreview.style.display = 'none'; }

    var grid = document.getElementById('theme-icon-grid');
    if (grid) {
      grid.innerHTML = APPS.map(function (app) {
        var iconUrl = t['icon_' + app.key] || '';
        var preview = iconUrl
          ? '<img src="' + iconUrl + '" style="width:2.2rem;height:2.2rem;border-radius:0.5rem;object-fit:cover"/>'
          : '<div style="width:2.2rem;height:2.2rem;border-radius:0.5rem;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--text-3)">Default</div>';
        return '<div class="theme-icon-item"><div class="theme-icon-preview">' + preview + '</div><span class="theme-icon-label">' + app.name + '</span><button class="s-btn-sm theme-icon-pick" data-app="' + app.key + '">Pick</button></div>';
      }).join('');
    }
  }

  document.addEventListener('click', function (e) {
    var id = e.target.id;

    if (id === 'theme-dark-toggle' || (e.target.closest && e.target.closest('#theme-dark-toggle'))) {
      var isDark = !Storage.getDarkMode(); Storage.setDarkMode(isDark);
      if (isDark) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
      document.querySelectorAll('.dark-mode-toggle').forEach(function (el) { el.classList.toggle('active', isDark); });
      return;
    }

    if (id === 'theme-font-upload') {
      e.preventDefault(); e.stopPropagation();
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.ttf,.woff,.woff2,.otf';
      inp.addEventListener('change', function () {
        var f = inp.files[0]; if (!f) return;
        if (f.size > 2 * 1024 * 1024) { Toast.error('Font too large (max 2MB)'); return; }
        var reader = new FileReader();
        reader.onload = function () {
          try { Storage.set('customFontData', reader.result); Storage.set('customFontName', f.name); }
          catch (err) { Toast.error('Storage full!'); return; }
          var t = getTheme(); t.fontFamily = '__custom__'; saveTheme(t);
          injectCustomFont(); applyTheme(); populateThemeForm();
          Toast.success('Font "' + f.name + '" loaded');
        };
        reader.readAsDataURL(f);
      });
      inp.click(); return;
    }

    if (id === 'theme-font-clear') {
      Storage.remove('customFontData'); Storage.remove('customFontName');
      var old = document.getElementById('custom-font-face'); if (old) old.remove();
      var t = getTheme(); if (t.fontFamily === '__custom__') { t.fontFamily = ''; saveTheme(t); }
      applyTheme(); populateThemeForm(); Toast.success('Custom font removed'); return;
    }

    if (id === 'theme-wall-pick') {
      var inp2 = document.createElement('input'); inp2.type = 'file'; inp2.accept = 'image/*';
      inp2.addEventListener('change', function () {
        var f = inp2.files[0]; if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var img = new Image();
          img.onload = function () {
            var w = img.width, hh = img.height; if (w > 1200) { hh = Math.round(hh * 1200 / w); w = 1200; }
            var c = document.createElement('canvas'); c.width = w; c.height = hh;
            c.getContext('2d').drawImage(img, 0, 0, w, hh);
            var dataUrl = c.toDataURL('image/jpeg', 0.5);
            var wInp = document.getElementById('theme-wallpaper'); if (wInp) wInp.value = dataUrl;
            var t2 = getTheme(); t2.wallpaper = dataUrl; saveTheme(t2); applyTheme(); Toast.success('Wallpaper set');
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
      });
      inp2.click(); return;
    }

    if (id === 'theme-wall-clear') {
      var wInp = document.getElementById('theme-wallpaper'); if (wInp) wInp.value = '';
      var t3 = getTheme(); t3.wallpaper = ''; saveTheme(t3); applyTheme(); Toast.success('Wallpaper cleared'); return;
    }

    if (id === 'theme-icon-reset') {
      var t4 = getTheme(); APPS.forEach(function (app) { delete t4['icon_' + app.key]; }); saveTheme(t4);
      Toast.success('Icons reset. Reloading...'); setTimeout(function () { location.reload(); }, 800); return;
    }

    var iconBtn = e.target.closest('.theme-icon-pick');
    if (iconBtn) {
      var appKey = iconBtn.dataset.app;
      var inp3 = document.createElement('input'); inp3.type = 'file'; inp3.accept = 'image/*';
      inp3.addEventListener('change', function () {
        var f = inp3.files[0]; if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var img = new Image();
          img.onload = function () {
            var c = document.createElement('canvas'); c.width = 128; c.height = 128;
            c.getContext('2d').drawImage(img, 0, 0, 128, 128);
            var dataUrl = c.toDataURL('image/jpeg', 0.7);
            var t5 = getTheme(); t5['icon_' + appKey] = dataUrl; saveTheme(t5);
            applyTheme(); populateThemeForm(); Toast.success(appKey + ' icon updated');
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
      });
      inp3.click(); return;
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'theme-font') {
      var t = getTheme(); t.fontFamily = e.target.value; saveTheme(t); applyTheme();
      var area = document.getElementById('theme-custom-font-area');
      if (area) area.style.display = (e.target.value === '__custom__') ? '' : 'none';
      var prev = document.getElementById('theme-font-preview');
      if (prev && e.target.value === '__custom__' && Storage.get('customFontData', '')) { prev.style.display = ''; prev.style.fontFamily = '"CustomUserFont",sans-serif'; }
      else if (prev) { prev.style.display = 'none'; }
    }
    if (e.target.id === 'theme-wallpaper') {
      var t2 = getTheme(); t2.wallpaper = e.target.value.trim(); saveTheme(t2); applyTheme();
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'theme-fs') {
      var val = document.getElementById('theme-fs-val');
      if (val) val.textContent = e.target.value + 'px';
      var t = getTheme(); t.fontSize = parseInt(e.target.value, 10); saveTheme(t); applyTheme();
    }
  });

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'settings') setTimeout(populateThemeForm, 50);
  });

  applyTheme();
})();
