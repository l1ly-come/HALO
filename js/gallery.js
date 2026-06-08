/**
 * gallery.js — 角色相册 v2
 * 先选角色 → 分类浏览 → 点击看描述 → 添加真实照片 → AI刷新
 */
(function () {
  'use strict';

  var CATS = [
    { key: 'all', name: 'All', icon: '✦' },
    { key: 'selfie', name: 'Selfie', icon: '🤳' },
    { key: 'daily', name: 'Daily', icon: '☕' },
    { key: 'scenery', name: 'Scenery', icon: '🌅' },
    { key: 'food', name: 'Food', icon: '🍜' },
    { key: 'special', name: 'Special', icon: '💫' }
  ];

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function uid() { return 'p_' + Math.random().toString(36).slice(2,9); }
  function fmtDate(ts) { var d = new Date(ts); return (d.getMonth()+1) + '/' + d.getDate(); }

  function getPhotos(fid) { try { return JSON.parse(Storage.get('gallery_' + fid, '[]')); } catch(e) { return []; } }
  function savePhotos(fid, arr) { Storage.set('gallery_' + fid, JSON.stringify(arr)); }

  var currentFid = null;
  var currentCat = 'all';
  var currentView = 'characters';

  function render() {
    var panel = document.getElementById('gallery-panel');
    if (!panel) return;
    if (currentView === 'gallery' && currentFid) { renderGallery(panel); return; }
    if (currentView === 'viewer') return;
    renderCharacters(panel);
  }

  // ═══ 角色选择 ═══
  function renderCharacters(panel) {
    currentView = 'characters';
    var friends = Storage.getFriends();

    var listHtml = friends.length
      ? friends.map(function (f) {
          var photos = getPhotos(f.id);
          var cover = '';
          for (var i = 0; i < photos.length; i++) { if (photos[i].url) { cover = photos[i].url; break; } }
          return '<div class="gal2-char" data-fid="' + f.id + '">' +
            '<div class="gal2-char-cover">' +
              (cover ? '<img src="' + esc(cover) + '" />' : '<div class="gal2-char-empty"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>') +
            '</div>' +
            '<div class="gal2-char-info">' +
              '<img class="gal2-char-av" src="' + esc(f.avatar) + '" />' +
              '<div><div class="gal2-char-name">' + esc(f.displayName || f.name) + '</div>' +
              '<div class="gal2-char-count">' + photos.length + ' photos</div></div>' +
            '</div>' +
          '</div>';
        }).join('')
      : '<div class="gal-empty"><div class="gal-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="gal-empty-text">Add contacts first</div></div>';

    panel.innerHTML =
      '<div class="gal-app">' +
        '<div class="gal-header">' +
          '<div class="gal-hdr-left"><div class="gal-title">Gallery</div></div>' +
          '<div class="gal-hdr-actions">' +
            '<button class="gal-hdr-btn" id="gal-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="gal-body"><div class="gal2-char-grid">' + listHtml + '</div></div>' +
      '</div>';

    document.getElementById('gal-close').onclick = function () {
      document.getElementById('modal-gallery').classList.remove('active');
    };
    panel.querySelector('.gal-body').addEventListener('click', function (e) {
      var card = e.target.closest('.gal2-char');
      if (card) { currentFid = card.dataset.fid; currentCat = 'all'; currentView = 'gallery'; render(); }
    });
  }

  // ═══ 照片列表 ═══
  function renderGallery(panel) {
    var friend = Storage.getFriends().find(function (f) { return f.id === currentFid; });
    if (!friend) { currentView = 'characters'; render(); return; }
    var cn = friend.displayName || friend.name;
    var photos = getPhotos(currentFid);
    var filtered = currentCat === 'all' ? photos : photos.filter(function (p) { return p.category === currentCat; });

    var affinityLevel = null;
    if (window.Affinity && window.Affinity.isEnabled(currentFid)) {
      affinityLevel = window.Affinity.getLevel(currentFid).key;
    }
    var LEVEL_ORDER = ['stranger','familiar','close','intimate','soulmate'];

    var catsHtml = CATS.map(function (c) {
      var count = c.key === 'all' ? photos.length : photos.filter(function(p){return p.category===c.key;}).length;
      return '<button class="gal2-cat' + (currentCat === c.key ? ' gal2-cat-on' : '') + '" data-cat="' + c.key + '">' +
        '<span>' + c.icon + '</span><span>' + c.name + '</span>' +
        (count ? '<span class="gal2-cat-count">' + count + '</span>' : '') +
      '</button>';
    }).join('');

    var gridHtml = filtered.length
      ? filtered.map(function (p) {
          var locked = false;
          if (p.minLevel && affinityLevel) {
            locked = LEVEL_ORDER.indexOf(affinityLevel) < LEVEL_ORDER.indexOf(p.minLevel);
          }
          var realIdx = photos.indexOf(p);
          return '<div class="gal2-thumb' + (locked ? ' gal2-locked' : '') + '" data-idx="' + realIdx + '">' +
            (p.url
              ? '<img src="' + esc(p.url) + '" ' + (locked ? 'style="filter:blur(10px) brightness(0.5)"' : '') + ' />'
              : '<div class="gal2-placeholder">' +
                  '<div style="font-size:0.5rem;color:var(--text-3);text-align:center;padding:8px;line-height:1.3;overflow:hidden">' + esc((p.desc||'').slice(0,30)) + '</div>' +
                '</div>') +
            (locked ? '<div class="gal2-lock-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' : '') +
            (p.category ? '<span class="gal2-cat-tag">' + (CATS.find(function(c){return c.key===p.category;})||{icon:''}).icon + '</span>' : '') +
          '</div>';
        }).join('')
      : '<div class="gal-empty" style="grid-column:1/-1;padding:2rem"><div class="gal-empty-text">' + (currentCat === 'all' ? 'No photos yet' : 'No ' + currentCat + ' photos') + '</div></div>';

    panel.innerHTML =
      '<div class="gal-app">' +
        '<div class="gal-header">' +
          '<div class="gal-hdr-left">' +
            '<button class="gal-back-btn" id="gal-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
            '<img class="gal2-hdr-av" src="' + esc(friend.avatar) + '" />' +
            '<div><div class="gal-title">' + esc(cn) + '</div><div class="gal-total">' + photos.length + ' photos</div></div>' +
          '</div>' +
          '<div class="gal-hdr-actions">' +
            '<button class="gal-hdr-btn" id="gal-refresh" title="Generate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>' +
            '<button class="gal-hdr-btn" id="gal-add" title="Add"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="gal2-cats">' + catsHtml + '</div>' +
        '<div class="gal-body"><div class="gal2-grid">' + gridHtml + '</div></div>' +
      '</div>';

    document.getElementById('gal-back').onclick = function () { currentView = 'characters'; currentFid = null; render(); };
    document.getElementById('gal-add').onclick = function () { showAddPhoto(currentFid); };
    document.getElementById('gal-refresh').onclick = function () { aiRefresh(currentFid, friend); };

    panel.querySelector('.gal2-cats').addEventListener('click', function (e) {
      var btn = e.target.closest('.gal2-cat');
      if (btn) { currentCat = btn.dataset.cat; renderGallery(panel); }
    });

    panel.querySelector('.gal2-grid').addEventListener('click', function (e) {
      var thumb = e.target.closest('.gal2-thumb');
      if (!thumb || thumb.classList.contains('gal2-locked')) return;
      var idx = parseInt(thumb.dataset.idx, 10);
      showViewer(currentFid, idx);
    });
  }

  // ═══ 照片查看器 ═══
  function showViewer(fid, idx) {
    var photos = getPhotos(fid);
    var photo = photos[idx];
    if (!photo) return;

    var ov = document.createElement('div');
    ov.className = 'gal2-viewer';

    function renderView() {
      photos = getPhotos(fid);
      photo = photos[idx];
      if (!photo) { ov.remove(); return; }
      var catInfo = CATS.find(function(c){return c.key===photo.category;}) || {};

      ov.innerHTML =
        '<div class="gal2-viewer-bg"></div>' +
        '<div class="gal2-viewer-top">' +
          '<button class="gal2-viewer-btn" id="gv-back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
          '<span class="gal2-viewer-counter">' + (idx + 1) + ' / ' + photos.length + '</span>' +
          '<button class="gal2-viewer-btn" id="gv-del"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>' +
        '</div>' +
        '<div class="gal2-viewer-img">' +
                    (photo.url ? '<img src="' + esc(photo.url) + '" />' : '<div class="gal2-viewer-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>') +

        '</div>' +
        '<div class="gal2-viewer-info">' +
          '<div class="gal2-viewer-desc">' + esc(photo.desc || 'No description') + '</div>' +
          '<div class="gal2-viewer-meta">' +
            (catInfo.icon ? '<span>' + catInfo.icon + ' ' + (catInfo.name||'') + '</span>' : '') +
            '<span>' + fmtDate(photo.ts) + '</span>' +
            (photo.minLevel ? '<span>Locked: ' + photo.minLevel + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="gal2-viewer-nav">' +
          '<button class="gal-nav-btn" id="gv-prev"' + (idx <= 0 ? ' disabled' : '') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
          '<button class="gal-nav-btn" id="gv-next"' + (idx >= photos.length - 1 ? ' disabled' : '') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>' +
        '</div>';

      document.getElementById('gv-back').onclick = function () { ov.remove(); render(); };
      document.getElementById('gv-del').onclick = function () {
        if (!confirm('Delete this photo?')) return;
        photos.splice(idx, 1);
        savePhotos(fid, photos);
        if (idx >= photos.length) idx = photos.length - 1;
        if (idx < 0) { ov.remove(); render(); return; }
        renderView();
      };
      document.getElementById('gv-prev').onclick = function () { if (idx > 0) { idx--; renderView(); } };
      document.getElementById('gv-next').onclick = function () { if (idx < photos.length - 1) { idx++; renderView(); } };
    }

    document.body.appendChild(ov);
    renderView();
  }

  // ═══ 添加照片 ═══
  function showAddPhoto(fid) {
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';

    var catOpts = CATS.filter(function(c){return c.key!=='all';}).map(function (c) {
      return '<option value="' + c.key + '">' + c.icon + ' ' + c.name + '</option>';
    }).join('');

    var levelOpts = '<option value="">Everyone</option>' +
      '<option value="familiar">Familiar</option>' +
      '<option value="close">Close</option>' +
      '<option value="intimate">Intimate</option>' +
      '<option value="soulmate">Soulmate</option>';

    ov.innerHTML =
      '<div class="inner-modal" style="max-width:340px">' +
        '<div class="modal-header"><span class="modal-title">Add Photo</span>' +
          '<button class="modal-close" id="ap-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
        '<div class="image-picker">' +
          '<div class="image-picker-preview" id="ap-preview">Tap to select</div>' +
          '<div class="image-picker-actions">' +
            '<button id="ap-local">Local</button>' +
            '<button id="ap-url-mode">URL</button>' +
          '</div>' +
          '<div id="ap-url-row" style="display:none;margin-top:0.2rem"><input id="ap-url" class="s-input" placeholder="https://..." /></div>' +
        '</div>' +
        '<div class="settings-item"><label class="settings-label">Description (used for matching in chat)</label>' +
          '<input id="ap-desc" class="s-input" placeholder="e.g. sunset selfie at the beach" /></div>' +
        '<div class="settings-item"><label class="settings-label">Category</label>' +
          '<select id="ap-cat" class="s-select">' + catOpts + '</select></div>' +
        '<div class="settings-item"><label class="settings-label">Unlock Level</label>' +
          '<select id="ap-level" class="s-select">' + levelOpts + '</select></div>' +
        '<button class="s-btn" id="ap-save" style="width:100%;margin-top:0.3rem">Add</button>' +
      '</div>';

    document.body.appendChild(ov);
    var resultUrl = '';

    document.getElementById('ap-close').onclick = function () { ov.remove(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });

    document.getElementById('ap-url-mode').addEventListener('click', function () {
      var row = document.getElementById('ap-url-row');
      var showing = row.style.display !== 'none';
      row.style.display = showing ? 'none' : '';
      this.style.background = showing ? '' : 'var(--primary)';
      this.style.color = showing ? '' : '#fff';
    });

    document.getElementById('ap-local').addEventListener('click', function () {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return;
        if (f.size > 5 * 1024 * 1024) { Toast.warn('Max 5MB'); return; }
        var r = new FileReader();
        r.onload = function () {
          var img = new Image();
          img.onload = function () {
            var w = img.width, h = img.height;
            if (w > 800) { h = Math.round(h * 800 / w); w = 800; }
            var c = document.createElement('canvas'); c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            resultUrl = c.toDataURL('image/jpeg', 0.65);
            document.getElementById('ap-preview').innerHTML = '<img src="' + resultUrl + '" />';
          };
          img.src = r.result;
        };
        r.readAsDataURL(f);
      };
      inp.click();
    });

    var urlInput = document.getElementById('ap-url');
    if (urlInput) urlInput.addEventListener('input', function () {
      var u = this.value.trim();
      if (u) {
        resultUrl = u;
        document.getElementById('ap-preview').innerHTML = '<img src="' + esc(u) + '" onerror="this.parentElement.innerHTML=\'Failed\'" />';
      }
    });

    document.getElementById('ap-save').addEventListener('click', function () {
      var urlVal = (document.getElementById('ap-url') || {}).value || '';
      var url = urlVal.trim() || resultUrl;
      var desc = (document.getElementById('ap-desc').value || '').trim();
      var cat = document.getElementById('ap-cat').value;
      var level = document.getElementById('ap-level').value;

      if (!url && !desc) { Toast.warn('Add a photo or description'); return; }

      var photos = getPhotos(fid);
      photos.push({
        id: uid(),
        url: url || '',
        desc: desc || '',
        category: cat,
        ts: Date.now(),
        minLevel: level || ''
      });
      savePhotos(fid, photos);
      ov.remove();
      Toast.success('Photo added');
      render();
    });
  }

  // ═══ AI 刷新 ═══
  function aiRefresh(fid, friend) {
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) { Toast.warn('Set API key first'); return; }
    var cn = friend.realName || friend.displayName || friend.name || '';

    Toast.info('Generating photos...');
    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, {
      method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [
                    { role: 'system', content: '为角色"' + cn + '"生成4张照片描述。' +
            '\n角色背景：' + (friend.prompt || '').replace(/[\n\r]+/g, ' ').slice(0, 150) +
            '\n\n规则：' +
            '\n- 只输出JSON数组，不要markdown、不要解释、不要代码块' +
            '\n- 格式：[{"desc":"描述内容","category":"selfie"}]' +
            '\n- category只能是：selfie、daily、scenery、food、special' +
            '\n- 每条描述用中文，10-30个字，生动，第一人称视角' +
            '\n- 禁止使用emoji、颜文字，禁止出现AI这个词' +
            '\n- 像角色本人在描述自己拍的照片一样写' +
            '\n\n示例：[{"desc":"清晨阳光透过卧室窗帘，桌上放着刚泡好的咖啡","category":"daily"}]' },
          { role: 'user', content: '现在生成。' }

        ],
        temperature: 1.0, max_tokens: 2000, stream: false
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
        }).then(function (d) {
                console.log('RAW RESPONSE:', JSON.stringify(d));

      var text = '';
      try { text = d.choices[0].message.content.trim(); } catch (e) {}
      if (!text) { Toast.error('Empty response'); return; }

      // 清理各种包裹格式
      text = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^[^[]*/, '')  // 删掉 [ 之前的所有内容
        .replace(/[^\]]*$/, '') // 删掉 ] 之后的所有内容
        .trim();

      // 如果还是没有方括号，尝试手动包裹
      if (text.charAt(0) !== '[') text = '[' + text;
      if (text.charAt(text.length - 1) !== ']') text = text + ']';

      var items;
      try {
        items = JSON.parse(text);
      } catch (e) {
        // 最后兜底：用正则提取所有 desc
        var descs = [];
        var re = /"desc"\s*:\s*"([^"]+)"/g;
        var m;
        while ((m = re.exec(text)) !== null) descs.push(m[1]);
        if (descs.length) {
          items = descs.map(function (d) { return { desc: d, category: 'daily' }; });
        } else {
          Toast.error('Generate failed, try again');
          return;
        }
      }

      if (!Array.isArray(items) || !items.length) { Toast.error('No items'); return; }

      var photos = getPhotos(fid);
      var added = 0;
      items.forEach(function (item) {
        if (!item.desc) return;
        item.desc = item.desc
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1FA00}-\u{1FA9F}]/gu, '')
          .replace(/[~\u{FF5E}\u{2665}\u{2764}\u{2606}\u{2605}\u{00B7}\u{2022}\u{25CF}\u{25CB}\u{25C6}\u{25C7}\u{2728}\u{1F4AB}\u{1F31F}\u{2B50}]/gu, '')
          .replace(/\bAI\b/gi, cn)
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (!item.desc) return;

        var validCats = ['selfie','daily','scenery','food','special'];
        var cat = validCats.indexOf(item.category) >= 0 ? item.category : 'daily';

        photos.push({
          id: uid(), url: '', desc: item.desc,
          category: cat, ts: Date.now() + added * 100, minLevel: ''
        });
        added++;
      });

      savePhotos(fid, photos);
      Toast.success(added + ' photos generated');
      render();
    }).catch(function (e) {

      Toast.error('Failed: ' + (e.message || ''));
    });
  }

  // ═══ AIPhotoAlbum 接口（供 chat.js 使用）═══
  window.AIPhotoAlbum = {
    match: function (desc) {
      if (!desc) return null;
      var friends = Storage.getFriends();
      var lowerDesc = desc.toLowerCase();

      for (var fi = 0; fi < friends.length; fi++) {
        var photos = getPhotos(friends[fi].id);
        for (var pi = 0; pi < photos.length; pi++) {
          var p = photos[pi];
          if (!p.desc) continue;
          var pDesc = p.desc.toLowerCase();

          // 精确包含
          if (pDesc.indexOf(lowerDesc) >= 0 || lowerDesc.indexOf(pDesc) >= 0) {
            if (p.url) return { url: p.url, desc: p.desc, minLevel: p.minLevel || '' };
            return null; // 有描述但无图 → 不匹配图片显示
          }

          // 关键词匹配
          var keywords = lowerDesc.split(/[\s,]+/).filter(function(k){return k.length > 2;});
          var matched = keywords.filter(function (kw) { return pDesc.indexOf(kw) >= 0; });
          if (matched.length >= 2 || (matched.length === 1 && keywords.length <= 2)) {
            if (p.url) return { url: p.url, desc: p.desc, minLevel: p.minLevel || '' };
          }
        }
      }
      return null;
    },

    getAll: function () {
      var all = [];
      Storage.getFriends().forEach(function (f) {
        getPhotos(f.id).forEach(function (p) {
          all.push({
            url: p.url || '',
            desc: p.desc || '',
            tags: p.category || '',
            minLevel: p.minLevel || ''
          });
        });
      });
      return all;
    }
  };

  // ═══ 入口 ═══
  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'gallery') {
      currentView = 'characters';
      currentFid = null;
      currentCat = 'all';
      render();
    }
  });
})();

