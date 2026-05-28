/**
 * gallery.js — 相册 v3
 * AI Photo Album + 聊天图片收集 + 无prompt/confirm
 */
(function () {
  'use strict';

  var _T = window.T || function(k){return k};
  var currentAlbum = null, currentPhoto = null, currentView = 'main';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(ts) { var d = new Date(ts); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); }
  function fmtTime(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  function getAlbums() { try { return JSON.parse(Storage.get('gallery_albums', '[]')); } catch (e) { return []; } }
  function saveAlbums(a) { Storage.set('gallery_albums', JSON.stringify(a)); }

  /* ═══ AI Photo Album ═══ */
  function getAIPhotos() { try { return JSON.parse(Storage.get('ai_photos', '[]')); } catch (e) { return []; } }
  function saveAIPhotos(a) { Storage.set('ai_photos', JSON.stringify(a)); }
  function addAIPhoto(photo) {
    photo.id = photo.id || 'ap_' + Math.random().toString(36).slice(2, 9);
    photo.ts = photo.ts || Date.now();
    var list = getAIPhotos();
    list.unshift(photo);
    if (list.length > 50) list = list.slice(0, 50);
    saveAIPhotos(list);
    return photo;
  }
  function deleteAIPhoto(id) { saveAIPhotos(getAIPhotos().filter(function (p) { return p.id !== id; })); }
  function updateAIPhoto(id, updates) {
    var list = getAIPhotos();
    var p = list.find(function (x) { return x.id === id; });
    if (p) { Object.keys(updates).forEach(function (k) { p[k] = updates[k]; }); saveAIPhotos(list); }
  }

  function matchAIPhoto(keyword) {
    if (!keyword) return null;
    var photos = getAIPhotos();
    if (!photos.length) return null;
    var kw = keyword.toLowerCase().trim();
    var byId = photos.find(function (p) { return p.id === kw; });
    if (byId) return byId;
    var byDesc = null, bestScore = 0;
    photos.forEach(function (p) {
      var combined = ((p.desc || '') + ' ' + (p.tags || '')).toLowerCase();
      if (combined.indexOf(kw) >= 0) {
        var score = kw.length / combined.length;
        if (!byDesc || score > bestScore) { byDesc = p; bestScore = score; }
      }
    });
    if (byDesc) return byDesc;
    var words = kw.split(/[\s,，、]+/).filter(Boolean);
    var best = null, bestCount = 0;
    photos.forEach(function (p) {
      var combined = ((p.desc || '') + ' ' + (p.tags || '')).toLowerCase();
      var count = 0;
      words.forEach(function (w) { if (combined.indexOf(w) >= 0) count++; });
      if (count > bestCount) { best = p; bestCount = count; }
    });
    if (bestCount > 0) return best;
    return null;
  }

  window.AIPhotoAlbum = {
    match: matchAIPhoto,
    getAll: getAIPhotos,
    add: addAIPhoto,
    remove: deleteAIPhoto
  };

  function collectChatPhotos() {
    var friends = Storage.getFriends();
    var photos = [];
    friends.forEach(function (f) {
      var msgs = Storage.getMessages(f.id);
      msgs.forEach(function (m) {
        if (m.type === 'image' && m.content) {
          photos.push({ url: m.content, ts: m.ts || Date.now(), from: m.role === 'user' ? 'Me' : (f.displayName || f.name || 'AI'), convId: f.id, convName: f.displayName || f.name || '' });
        }
      });
    });
    photos.sort(function (a, b) { return b.ts - a.ts; });
    return photos;
  }

  function getTotalPhotos() {
    var count = 0;
    getAlbums().forEach(function (a) { count += (a.photos || []).length; });
    return count;
  }

  /* ═══ 弹窗代替 prompt/confirm ═══ */
  function showNewAlbumModal() {
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:280px">' +
        '<div class="modal-header"><span class="modal-title">'+_T('New Album')+'</span>' +
          '<button class="modal-close" id="na-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<div class="settings-item">' +
          '<label class="settings-label">'+_T('Album Name')+'</label>' +
          '<input class="s-input" id="na-name" placeholder="My Album..." autofocus />' +
        '</div>' +
        '<button class="s-btn" id="na-save" style="width:100%;margin-top:0.3rem">Create</button>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('na-close').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('na-name').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('na-save').click();
    });
    document.getElementById('na-save').onclick = function () {
      var name = (document.getElementById('na-name').value || '').trim();
      if (!name) { Toast.warn(_T('Enter a name')); return; }
      var a = getAlbums();
      a.push({ name: name, photos: [], ts: Date.now() });
      saveAlbums(a);
      ov.remove();
      Toast.success(_T('Album created'));
      render();
    };
  }

  function showRenameModal(idx, panel) {
    var album = getAlbums()[idx];
    if (!album) return;
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:280px">' +
        '<div class="modal-header"><span class="modal-title">'+_T('Rename')+'</span>' +
          '<button class="modal-close" id="rn-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<div class="settings-item">' +
          '<input class="s-input" id="rn-name" value="' + esc(album.name) + '" />' +
        '</div>' +
        '<button class="s-btn" id="rn-save" style="width:100%;margin-top:0.3rem">Save</button>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('rn-close').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('rn-name').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('rn-save').click();
    });
    document.getElementById('rn-save').onclick = function () {
      var n = (document.getElementById('rn-name').value || '').trim();
      if (!n) return;
      var a = getAlbums();
      a[idx].name = n;
      saveAlbums(a);
      ov.remove();
      Toast.success(_T('Renamed'));
      renderAlbumDetail(panel);
    };
  }

  function showConfirmModal(msg, onYes) {
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:260px;text-align:center">' +
        '<div style="font-size:0.82rem;color:var(--text);padding:1.2rem 0.5rem 0.8rem;line-height:1.5">' + esc(msg) + '</div>' +
        '<div style="display:flex;border-top:1px solid var(--border-light)">' +
          '<button class="card-action-btn" id="cf-no" style="flex:1;padding:12px;border:none;background:none;color:var(--text-3);font-size:0.78rem;cursor:pointer">'+_T('Cancel')+'</button>' +
          '<button class="card-action-btn" id="cf-yes" style="flex:1;padding:12px;border:none;background:none;color:var(--text);font-size:0.78rem;font-weight:600;cursor:pointer;border-left:1px solid var(--border-light)">'+_T('Confirm')+'</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('cf-no').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('cf-yes').onclick = function () { ov.remove(); if (onYes) onYes(); };
  }

  /* ═══ 渲染入口 ═══ */
  function render() {
    var panel = document.getElementById('gallery-panel');
    if (!panel) return;
    if (currentView === 'ai') { renderAIAlbum(panel); return; }
    if (currentPhoto !== null) { renderViewer(panel); return; }
    if (currentAlbum !== null) { renderAlbumDetail(panel); return; }
    renderMain(panel);
  }

  /* ═══ 主页 ═══ */
  function renderMain(panel) {
    var albums = getAlbums();
    var chatPhotos = collectChatPhotos();
    var aiPhotos = getAIPhotos();
    var totalPhotos = getTotalPhotos();

    var albumsHtml = albums.map(function (a, i) {
      var cover = a.photos && a.photos.length ? (typeof a.photos[0] === 'string' ? a.photos[0] : a.photos[0].url) : '';
      return '<div class="gal-album" data-idx="' + i + '"><div class="gal-album-cover">' +
        (cover ? '<img src="' + esc(typeof cover === 'string' ? cover : '') + '" />' : '<div class="gal-album-empty-cover"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>') +
        '</div><div class="gal-album-meta"><div class="gal-album-name">' + esc(a.name) + '</div><div class="gal-album-count">' + (a.photos || []).length + '</div></div></div>';
    }).join('');

    var recentHtml = '';
    if (chatPhotos.length) {
      recentHtml = '<div class="gal-section-title">'+ _T('Chat Photos')+'<span class="gal-section-count">' + chatPhotos.length + '</span></div>' +
        '<div class="gal-recent-grid">' +
        chatPhotos.slice(0, 6).map(function (p, i) {
          return '<div class="gal-recent-thumb" data-chat-idx="' + i + '"><img src="' + esc(p.url) + '" /><div class="gal-recent-from">' + esc(p.from) + '</div></div>';
        }).join('') +
        (chatPhotos.length > 6 ? '<div class="gal-recent-more" id="gal-chat-all">+' + (chatPhotos.length - 6) + '</div>' : '') +
        '</div>';
    }

    panel.innerHTML =
      '<div class="gal-app"><div class="gal-header"><div class="gal-hdr-left"><span class="gal-title">'+_T('Gallery')+'</span><span class="gal-total">' + (totalPhotos + chatPhotos.length) + ' '+_T('photos')+'</span></div>' +
      '<button class="gal-hdr-btn" id="gal-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="gal-body">' +
      '<div class="gal-ai-entry" id="gal-ai-entry">' +
        '<div class="gal-ai-entry-left">' +
          '<div class="gal-ai-entry-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>' +
          '<div><div class="gal-ai-entry-title">'+_T('AI Photo Album')+'</div><div class="gal-ai-entry-sub">' + aiPhotos.length + ' '+_T('photos')+'</div></div>' +
        '</div>' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
      '</div>' +
      '<div class="gal-toolbar">' +
        '<button class="gal-tool-btn" id="gal-new-album"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> '+_T('New Album')+'</button>' +
        '<button class="gal-tool-btn" id="gal-sync-chat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> '+_T('Sync Chat')+'</button>' +
      '</div>' +
      (albums.length ? '<div class="gal-section-title">'+ _T('Albums')+'<span class="gal-section-count">' + albums.length + '</span></div><div class="gal-album-grid" id="gal-albums">' + albumsHtml + '</div>' : '') +
      recentHtml +
      (!albums.length && !chatPhotos.length && !aiPhotos.length ? '<div class="gal-empty"><div class="gal-empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div><div class="gal-empty-text">'+_T('No photos yet')+'</div><div class="gal-empty-sub">'+_T('Create an album or send images in chat')+'</div></div>' : '') +
      '</div></div>';

    document.getElementById('gal-close').onclick = function () { document.getElementById('modal-gallery').classList.remove('active'); };
    document.getElementById('gal-ai-entry').onclick = function () { currentView = 'ai'; render(); };
    document.getElementById('gal-new-album').onclick = function () { showNewAlbumModal(); };
    document.getElementById('gal-sync-chat').onclick = function () {
      var photos = collectChatPhotos(); if (!photos.length) { Toast.info(_T('No chat photos')); return; }
      var a = getAlbums(); var ca = a.find(function (x) { return x.name === 'Chat Photos'; });
      if (!ca) { ca = { name: 'Chat Photos', photos: [], ts: Date.now() }; a.unshift(ca); }
      var existing = ca.photos.map(function (p) { return typeof p === 'string' ? p : p.url; }); var added = 0;
      photos.forEach(function (p) { if (existing.indexOf(p.url) < 0) { ca.photos.unshift(p); existing.push(p.url); added++; } });
      if (ca.photos.length > 100) ca.photos = ca.photos.slice(0, 100);
      saveAlbums(a); Toast.success(added + ' synced'); render();
    };
    var ag = document.getElementById('gal-albums');
    if (ag) ag.onclick = function (e) { var c = e.target.closest('.gal-album'); if (c) { currentAlbum = parseInt(c.dataset.idx, 10); render(); } };
    var rg = panel.querySelector('.gal-recent-grid');
    if (rg) rg.onclick = function (e) {
      var t = e.target.closest('.gal-recent-thumb'); if (t) { showLightbox(chatPhotos[parseInt(t.dataset.chatIdx, 10)].url); return; }
      var m = e.target.closest('#gal-chat-all'); if (m) { document.getElementById('gal-sync-chat').click(); var a2 = getAlbums(); var ci = a2.findIndex(function (x) { return x.name === 'Chat Photos'; }); if (ci >= 0) { currentAlbum = ci; render(); } }
    };
  }

  /* ═══ AI Photo Album ═══ */
  function renderAIAlbum(panel) {
    var photos = getAIPhotos();
    var listHtml = '';
    if (photos.length) {
      listHtml = photos.map(function (p) {
        return '<div class="aip-card" data-id="' + p.id + '"><div class="aip-thumb"><img src="' + esc(p.url) + '" /></div><div class="aip-info"><div class="aip-desc-text">' + esc(p.desc || _T('No description')) + '</div>' +
          (p.tags ? '<div class="aip-tags">' + p.tags.split(/[,，、\s]+/).filter(Boolean).map(function (t) { return '<span class="aip-tag">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
          '<div class="aip-date">' + fmtDate(p.ts) + '</div></div><div class="aip-actions">' +
          '<button class="aip-edit-btn" data-id="' + p.id + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
          '<button class="aip-del-btn" data-id="' + p.id + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div></div>';
      }).join('');
    } else {
      listHtml = '<div class="gal-empty" style="padding:2rem"><div class="gal-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div><div class="gal-empty-text">'+_T('No AI photos')+'</div><div class="gal-empty-sub">'+_T('Add photos with descriptions for AI to use in chat')+'</div></div>';
    }

    panel.innerHTML =
      '<div class="gal-app"><div class="gal-header"><div class="gal-hdr-left">' +
      '<button class="gal-back-btn" id="aip-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<div><div class="gal-title">'+_T('AI Photo Album')+'</div><div class="gal-total">' + photos.length + ' '+_T('photos')+' · max 50</div></div></div>' +
      '<button class="gal-hdr-btn" id="aip-add" title="Add Photo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button></div>' +
      '<div class="gal-body"><div class="aip-help-card"><div class="aip-help-title">'+_T('How it works')+'</div><div class="aip-help-text">Add photos with descriptions. When chatting, AI can write <code>[相册:keyword]</code> to send a matching photo from this album as a real image.</div></div>' +
      '<div class="aip-list">' + listHtml + '</div></div></div>';

    document.getElementById('aip-back').onclick = function () { currentView = 'main'; render(); };
    document.getElementById('aip-add').onclick = function () { showAddAIPhoto(panel); };
    panel.querySelector('.aip-list').addEventListener('click', function (e) {
      var editBtn = e.target.closest('.aip-edit-btn');
      var delBtn = e.target.closest('.aip-del-btn');
      var card = e.target.closest('.aip-card');
      if (editBtn) { e.stopPropagation(); showEditAIPhoto(editBtn.dataset.id, panel); return; }
      if (delBtn) { e.stopPropagation(); showConfirmModal(_T('Delete this photo?'), function () { deleteAIPhoto(delBtn.dataset.id); renderAIAlbum(panel); }); return; }
      if (card) { var p = getAIPhotos().find(function (x) { return x.id === card.dataset.id; }); if (p) showLightbox(p.url); }
    });
  }

  function showAddAIPhoto(parentPanel) {
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    var resultUrl = '';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:340px"><div class="modal-header"><span class="modal-title">'+_T('Add AI Photo')+'</span><button class="modal-close" id="aip-add-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="aip-add-preview" id="aip-preview"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>'+_T('Tap to select')+'</span></div>' +
      '<div style="display:flex;gap:0.25rem;margin-top:0.3rem"><button class="gal-tool-btn" id="aip-pick-local" style="flex:1">'+_T('Local File')+'</button><button class="gal-tool-btn" id="aip-pick-url" style="flex:1">'+_T('From URL')+'</button></div>' +
      '<div id="aip-url-row" style="display:none;margin-top:0.3rem"><input class="s-input" id="aip-url-input" placeholder="https://..." /></div>' +
      '<div class="settings-item" style="margin-top:0.4rem"><label class="settings-label">'+_T('Description (AI uses this to match)')+'</label><textarea class="s-input" id="aip-desc" rows="2" style="min-height:2.5rem;resize:vertical" placeholder="e.g. selfie at cafe, sunset photo..."></textarea></div>' +
      '<div class="settings-item"><label class="settings-label">'+_T('Tags (comma separated)')+'</label><input class="s-input" id="aip-tags" placeholder="e.g. selfie, cafe, smile" /></div>' +
      '<button class="s-btn" id="aip-save" style="width:100%;margin-top:0.3rem">'+_T('Add Photo')+'</button></div>';
    document.body.appendChild(ov);
    document.getElementById('aip-add-close').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('aip-preview').onclick = function () { document.getElementById('aip-pick-local').click(); };
    document.getElementById('aip-pick-local').onclick = function () {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function () { var f = inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { compressImg(r.result, function (c) { resultUrl = c; document.getElementById('aip-preview').innerHTML = '<img src="' + c + '" />'; }); }; r.readAsDataURL(f); };
      inp.click();
    };
    document.getElementById('aip-pick-url').onclick = function () { var row = document.getElementById('aip-url-row'); row.style.display = row.style.display === 'none' ? '' : 'none'; };
    var urlInput = document.getElementById('aip-url-input');
    if (urlInput) urlInput.addEventListener('input', function () { var u = urlInput.value.trim(); if (u) { resultUrl = u; document.getElementById('aip-preview').innerHTML = '<img src="' + esc(u) + '" onerror="this.parentElement.innerHTML=\'Failed\'" />'; } });
    document.getElementById('aip-save').onclick = function () {
      var url = (document.getElementById('aip-url-input') || {}).value || ''; url = url.trim() || resultUrl;
      if (!url) { Toast.warn(_T('Select a photo')); return; }
      var desc = (document.getElementById('aip-desc').value || '').trim();
      var tags = (document.getElementById('aip-tags').value || '').trim();
      if (!desc) { Toast.warn(_T('Add a description')); return; }
      addAIPhoto({ url: url, desc: desc, tags: tags });
      ov.remove(); Toast.success(_T('Photo added')); renderAIAlbum(parentPanel);
    };
  }

  function showEditAIPhoto(id, parentPanel) {
    var photo = getAIPhotos().find(function (p) { return p.id === id; });
    if (!photo) return;
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:340px"><div class="modal-header"><span class="modal-title">'+_T('Edit Photo')+'</span><button class="modal-close" id="aipe-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="aip-add-preview"><img src="' + esc(photo.url) + '" /></div>' +
      '<div class="settings-item" style="margin-top:0.4rem"><label class="settings-label">'+_T('Description')+'</label><textarea class="s-input" id="aipe-desc" rows="2" style="min-height:2.5rem;resize:vertical">' + esc(photo.desc || '') + '</textarea></div>' +
      '<div class="settings-item"><label class="settings-label">'+_T('Tags')+'</label><input class="s-input" id="aipe-tags" value="' + esc(photo.tags || '') + '" /></div>' +
      '<button class="s-btn" id="aipe-save" style="width:100%;margin-top:0.3rem">Save</button></div>';
    document.body.appendChild(ov);
    document.getElementById('aipe-close').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('aipe-save').onclick = function () {
      var desc = (document.getElementById('aipe-desc').value || '').trim();
      var tags = (document.getElementById('aipe-tags').value || '').trim();
      if (!desc) { Toast.warn(_T('Add a description')); return; }
      updateAIPhoto(id, { desc: desc, tags: tags });
      ov.remove(); Toast.success(_T('Updated')); renderAIAlbum(parentPanel);
    };
  }

  /* ═══ 相册详情 ═══ */
  function renderAlbumDetail(panel) {
    var albums = getAlbums(); var album = albums[currentAlbum];
    if (!album) { currentAlbum = null; render(); return; }
    var photos = (album.photos || []).map(function (p) { return typeof p === 'string' ? { url: p, ts: Date.now() } : p; });
    var gridHtml = photos.map(function (p, i) { return '<div class="gal-photo-thumb" data-pi="' + i + '"><img src="' + esc(p.url) + '" /></div>'; }).join('');

    panel.innerHTML =
      '<div class="gal-app"><div class="gal-header"><div class="gal-hdr-left">' +
      '<button class="gal-back-btn" id="gal-detail-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<div><div class="gal-title">' + esc(album.name) + '</div><div class="gal-total">' + photos.length + ' photos</div></div></div>' +
      '<div class="gal-hdr-actions"><button class="gal-hdr-btn" id="gal-add-photo"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button>' +
      '<button class="gal-hdr-btn" id="gal-album-more"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button></div></div>' +
      '<div class="gal-body">' +
      (photos.length ? '<div class="gal-photo-grid">' + gridHtml + '</div>' : '<div class="gal-empty"><div class="gal-empty-text">'+_T('Empty album')+'</div><div class="gal-empty-sub">'+_T('Tap + to add')+'</div></div>') +
      '</div></div>';

    document.getElementById('gal-detail-back').onclick = function () { currentAlbum = null; render(); };
    document.getElementById('gal-add-photo').onclick = function () {
      pickPhoto(function (url) { if (!url) return; var a = getAlbums(); a[currentAlbum].photos.unshift({ url: url, ts: Date.now(), from: 'Me' }); if (a[currentAlbum].photos.length > 100) a[currentAlbum].photos = a[currentAlbum].photos.slice(0, 100); saveAlbums(a); renderAlbumDetail(panel); });
    };
    document.getElementById('gal-album-more').onclick = function () { showAlbumMenu(currentAlbum, panel); };
    var grid = panel.querySelector('.gal-photo-grid');
    if (grid) grid.onclick = function (e) { var t = e.target.closest('.gal-photo-thumb'); if (t) { currentPhoto = parseInt(t.dataset.pi, 10); render(); } };
  }

  /* ═══ 照片查看器 ═══ */
  function renderViewer(panel) {
    var albums = getAlbums(); var album = albums[currentAlbum];
    if (!album || !album.photos || !album.photos[currentPhoto]) { currentPhoto = null; render(); return; }
    var photos = album.photos; var p = photos[currentPhoto]; if (typeof p === 'string') p = { url: p, ts: Date.now() }; var total = photos.length;

    panel.innerHTML =
      '<div class="gal-viewer"><div class="gal-viewer-header"><button class="gal-back-btn" id="gal-viewer-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button><div class="gal-viewer-counter">' + (currentPhoto + 1) + ' / ' + total + '</div><button class="gal-hdr-btn" id="gal-viewer-del"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></div>' +
      '<div class="gal-viewer-body" id="gal-vb"><img class="gal-viewer-img" src="' + esc(p.url) + '" /></div>' +
      '<div class="gal-viewer-info">' + (p.from ? '<div class="gal-viewer-from">' + esc(p.from) + '</div>' : '') + (p.ts ? '<div class="gal-viewer-date">' + fmtDate(p.ts) + ' ' + fmtTime(p.ts) + '</div>' : '') + (p.convName ? '<div class="gal-viewer-conv">from ' + esc(p.convName) + '</div>' : '') + '</div>' +
      '<div class="gal-viewer-nav"><button class="gal-nav-btn" id="gal-prev"' + (currentPhoto <= 0 ? ' disabled' : '') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button><button class="gal-nav-btn" id="gal-next"' + (currentPhoto >= total - 1 ? ' disabled' : '') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button></div></div>';

    document.getElementById('gal-viewer-back').onclick = function () { currentPhoto = null; render(); };
    document.getElementById('gal-prev').onclick = function () { if (currentPhoto > 0) { currentPhoto--; render(); } };
    document.getElementById('gal-next').onclick = function () { if (currentPhoto < total - 1) { currentPhoto++; render(); } };
    document.getElementById('gal-viewer-del').onclick = function () {
      showConfirmModal(_T('Delete this photo?'), function () {
        var a = getAlbums(); a[currentAlbum].photos.splice(currentPhoto, 1); saveAlbums(a);
        if (currentPhoto >= a[currentAlbum].photos.length) currentPhoto = a[currentAlbum].photos.length - 1;
        if (currentPhoto < 0) currentPhoto = null;
        render();
      });
    };
    var vb = document.getElementById('gal-vb'); var sx = 0, mv = false;
    vb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; mv = false; });
    vb.addEventListener('touchmove', function (e) { if (Math.abs(e.touches[0].clientX - sx) > 20) mv = true; });
    vb.addEventListener('touchend', function (e) { if (!mv) return; var d = e.changedTouches[0].clientX - sx; if (d > 50 && currentPhoto > 0) { currentPhoto--; render(); } else if (d < -50 && currentPhoto < total - 1) { currentPhoto++; render(); } });
  }

  /* ═══ 相册菜单 ═══ */
  function showAlbumMenu(idx, panel) {
    var album = getAlbums()[idx]; if (!album) return;
    var ov = document.createElement('div'); ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:280px"><div class="modal-header"><span class="modal-title">' + esc(album.name) + '</span><button class="modal-close" id="gam-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="gal-menu-list">' +
        '<div class="gal-menu-item" id="gam-rename"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'+_T('Rename')+'</div>' +
        '<div class="gal-menu-item" id="gam-add"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>'+_T('Add Photos')+'</div>' +
        '<div class="gal-menu-item gal-menu-danger" id="gam-clear"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M8 6V4h8V4M19 6l-1 14H6L5 6"/></svg>'+_T('Clear')+'</div>' +
        '<div class="gal-menu-item gal-menu-danger" id="gam-delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>'+_T('Delete Album')+'</div>' +
      '</div></div>';
    document.body.appendChild(ov);
    document.getElementById('gam-close').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('gam-rename').onclick = function () { ov.remove(); showRenameModal(idx, panel); };
    document.getElementById('gam-add').onclick = function () { ov.remove(); pickPhoto(function (url) { if (!url) return; var a = getAlbums(); a[idx].photos.unshift({ url: url, ts: Date.now(), from: 'Me' }); saveAlbums(a); renderAlbumDetail(panel); }); };
    document.getElementById('gam-clear').onclick = function () { ov.remove(); showConfirmModal(_T('Clear all photos in this album?'), function () { var a = getAlbums(); a[idx].photos = []; saveAlbums(a); Toast.success('Cleared'); renderAlbumDetail(panel); }); };
    document.getElementById('gam-delete').onclick = function () { ov.remove(); showConfirmModal(_T('Delete this album?'), function () { var a = getAlbums(); a.splice(idx, 1); saveAlbums(a); Toast.success('Deleted'); currentAlbum = null; render(); }); };
  }

  /* ═══ 工具 ═══ */
  function pickPhoto(cb) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () { var f = inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { compressImg(r.result, cb); }; r.readAsDataURL(f); };
    inp.click();
  }

  function compressImg(dataUrl, cb) {
    var img = new Image();
    img.onload = function () { var w = img.width, hh = img.height; if (w > 800) { hh = Math.round(hh * 800 / w); w = 800; } var c = document.createElement('canvas'); c.width = w; c.height = hh; c.getContext('2d').drawImage(img, 0, 0, w, hh); cb(c.toDataURL('image/jpeg', 0.5)); };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  function showLightbox(src) {
    var lb = document.createElement('div'); lb.className = 'lightbox-overlay';
    lb.innerHTML = '<img src="' + esc(src) + '" />';
    document.body.appendChild(lb); lb.onclick = function () { lb.remove(); };
  }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'gallery') { currentAlbum = null; currentPhoto = null; currentView = 'main'; render(); }
  });
})();

