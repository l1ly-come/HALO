(function () {
  'use strict';

  var currentView = 'chat', currentArtist = null;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtTime(ts) { var d = new Date(ts); return (d.getHours() >= 12 ? '오후 ' : '오전 ') + ((d.getHours() % 12) || 12) + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function fmtDate(ts) { var d = new Date(ts); return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
  function getDays(id) { var d = parseInt(Storage.get('bb_subday_' + id, '0'), 10); if (!d) { d = Date.now(); Storage.set('bb_subday_' + id, String(d)); } return Math.max(1, Math.floor((Date.now() - d) / 86400000) + 1); }
  function getCharLimit(days) { return days < 50 ? 30 : days < 100 ? 50 : 100; }
  function getReplyCount(id) { var msgs = Storage.getBubbleMessages(id), c = 0; for (var i = msgs.length - 1; i >= 0; i--) { if (msgs[i].from === 'artist') break; if (msgs[i].from === 'fan') c++; } return c; }
  function replaceUsername(t) { var p = getBubbleProfile(); var n = p.name || (Storage.getActiveUser() || {}).name || 'User'; return (t || '').replace(/\{\{username\}\}/gi, n).replace(/\{\{user\}\}/gi, n).replace(/\{\{name\}\}/gi, n); }
  function getArtistSettings(id) { try { return JSON.parse(Storage.get('bb_settings_' + id, '{}')); } catch (e) { return {}; } }
  function setArtistSettings(id, s) { Storage.set('bb_settings_' + id, JSON.stringify(s)); }
  function getBubbleProfile() { try { return JSON.parse(Storage.get('bb_profile', '{}')); } catch (e) { return {}; } }
  function setBubbleProfile(p) { Storage.set('bb_profile', JSON.stringify(p)); }

  function render() {
    var panel = document.getElementById('bubble-panel'); if (!panel) return;
    panel.className = 'modal-panel ly-root';
    if (currentArtist) { renderChat(panel); return; }
    panel.innerHTML = '<div class="ly-app"><div class="ly-hdr" id="ly-hdr"></div><div class="ly-body" id="ly-body"></div><div class="ly-nav" id="ly-nav"></div></div>';
    renderNav(); renderHdr(); renderBody(); autoSend();
  }

  function renderNav() {
    var nav = document.getElementById('ly-nav'); if (!nav) return;
    var tabs = [
      { k: 'chat', l: 'Chat', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
      { k: 'friends', l: 'Friends', d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
      { k: 'settings', l: 'Settings', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09' }
    ];
    nav.innerHTML = tabs.map(function (t) { var on = currentView === t.k; return '<button class="ly-nav-btn' + (on ? ' ly-nav-on' : '') + '" data-v="' + t.k + '"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (on ? '2.2' : '1.5') + '"><path d="' + t.d + '"/></svg><span>' + t.l + '</span></button>'; }).join('');
    nav.onclick = function (e) { var b = e.target.closest('[data-v]'); if (b) { currentView = b.dataset.v; renderNav(); renderHdr(); renderBody(); } };
  }

  function renderHdr() {
    var hdr = document.getElementById('ly-hdr'); if (!hdr) return;
    var heart = '<svg width="14" height="14" viewBox="0 0 24 24"><defs><linearGradient id="lyh" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c9b8ff"/><stop offset="100%" stop-color="#A383F7"/></linearGradient></defs><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="url(#lyh)"/></svg>';
    if (currentView === 'chat') {
      hdr.innerHTML = '<div class="ly-hdr-row"><div class="ly-hdr-side"></div><div class="ly-hdr-mid"><span class="ly-logo">bubble</span>' + heart + '</div><button class="ly-hdr-x" id="ly-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';
    } else {
      hdr.innerHTML = '<div class="ly-hdr-row"><div class="ly-hdr-side"></div><div class="ly-hdr-mid"><span class="ly-hdr-title">' + ({ friends: 'Friends', settings: 'Settings' }[currentView]) + '</span></div><button class="ly-hdr-x" id="ly-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';
    }
    document.getElementById('ly-close').onclick = function () { document.getElementById('modal-style').classList.remove('active'); };
  }

  function renderBody() { var body = document.getElementById('ly-body'); if (!body) return; ({ chat: renderList, friends: renderFriends, settings: renderSettings })[currentView](body); }

  function renderList(el) {
    var subs = Storage.getBubbleSubscriptions(), fs = Storage.getFriends().filter(function (f) { return subs.indexOf(f.id) >= 0; });
    if (!fs.length) { el.innerHTML = '<div class="ly-empty">💜<p>No subscriptions</p><p style="font-size:11px;color:#ccc">Go to Friends tab</p></div>'; return; }
    el.innerHTML = '<div class="ly-list">' + fs.map(function (f) { var msgs = Storage.getBubbleMessages(f.id), last = msgs.length ? msgs[msgs.length - 1] : null; var s = getArtistSettings(f.id), av = s.artistAvatar || f.avatar; var preview = last ? replaceUsername(last.text || '').slice(0, 30) : 'Start chatting'; return '<div class="ly-list-row" data-fid="' + f.id + '"><div class="ly-av-wrap"><div class="ly-av-frame"></div><img class="ly-av-img" src="' + esc(av) + '"/></div><div class="ly-list-info"><div class="ly-list-top"><span class="ly-list-name">' + esc(f.displayName || f.name) + '</span><span class="ly-list-time">' + (last ? fmtTime(last.ts) : '') + '</span></div><div class="ly-list-preview">' + esc(preview) + '</div></div></div>'; }).join('') + '</div>';
    el.querySelector('.ly-list').onclick = function (e) { var r = e.target.closest('.ly-list-row'); if (r) { currentArtist = r.dataset.fid; render(); } };
  }

  /* ═══ Chat ═══ */
  function renderChat(panel) {
    var artist = Storage.getFriends().find(function (f) { return f.id === currentArtist; });
    if (!artist) { currentArtist = null; render(); return; }
    var msgs = Storage.getBubbleMessages(currentArtist);
    var days = getDays(currentArtist), charLimit = getCharLimit(days), replyCount = getReplyCount(currentArtist), canReply = replyCount < 3;
    var an = artist.displayName || artist.name || 'Artist', st = getArtistSettings(currentArtist), artistAv = st.artistAvatar || artist.avatar, chatBg = st.chatBg || '';

    var html = '', lastDate = '', prevFrom = '';
    if (!msgs.length) { html = '<div class="ly-welcome"><div class="ly-wel-ring"><img src="' + esc(artistAv) + '"/></div><div class="ly-wel-name">' + esc(an) + '</div><div class="ly-wel-days">D+' + days + '</div></div>'; }
    else { msgs.forEach(function (m, idx) {
      var dl = fmtDate(m.ts); if (dl !== lastDate) { html += '<div class="ly-date">' + dl + '</div>'; lastDate = dl; prevFrom = ''; }
      var isCont = m.from === prevFrom && m.from === 'artist';
      if (m.from === 'artist') {
        html += '<div class="ly-msg ly-msg-ai' + (isCont ? ' ly-cont' : '') + '">'; if (!isCont) html += '<div class="ly-ai-av"><div class="ly-av-frame"></div><img src="' + esc(artistAv) + '"/></div>';
        html += '<div class="ly-ai-body">'; if (!isCont) html += '<div class="ly-ai-name"><span class="ly-badge">ARTIST</span>' + esc(an) + '</div>';
        html += '<div class="ly-ai-bubble-wrap"><div class="ly-bubble ly-bubble-ai" data-idx="' + idx + '">' + esc(replaceUsername(m.text)) + '</div><div class="ly-trans-icon">번역</div></div>';
        if (m.translation) html += '<div class="ly-bubble ly-bubble-ai" data-idx="' + idx + '">' + (window.parseMediaHTML ? window.parseMediaHTML(replaceUsername(m.text)) : esc(replaceUsername(m.text))) + '</div>';
        else html += '<div class="ly-auto-trans ly-trans-pending" data-idx="' + idx + '">翻译중...</div>';
        html += '<div class="ly-time">' + fmtTime(m.ts) + '</div></div></div>';
      } else {
        html += '<div class="ly-msg ly-msg-user"><div class="ly-user-body"><div class="ly-time ly-time-r">' + fmtTime(m.ts) + '</div><div class="ly-bubble ly-bubble-user" data-idx="' + idx + '">' + esc(m.text) + '</div></div></div>';
      }
      prevFrom = m.from;
    }); }

    var bgCSS = chatBg ? 'background-image:url(' + esc(chatBg) + ');background-size:cover;background-position:center;' : '';
    var maskDiv = chatBg ? '<div class="ly-bg-mask"></div>' : '';
    var heart = '<svg width="11" height="11" viewBox="0 0 24 24"><defs><linearGradient id="lyh2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c9b8ff"/><stop offset="100%" stop-color="#A383F7"/></linearGradient></defs><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="url(#lyh2)"/></svg>';

    panel.innerHTML = '<div class="ly-app ly-chat-mode"><div class="ly-chat-header"><div class="ly-ch-row"><button class="ly-ch-btn" id="ly-back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button><div class="ly-ch-center"><span class="ly-ch-name">' + esc(an) + '</span></div><div class="ly-ch-right"><button class="ly-ch-btn" id="ly-trash" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button><button class="ly-ch-btn" id="ly-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></button><button class="ly-ch-btn" id="ly-more"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg></button></div></div><div class="ly-ch-sub"><span class="ly-ch-logo">bubble</span> ' + heart + ' <span class="ly-ch-days">+1314</span></div></div>' +
      '<div class="ly-scroll" id="ly-scroll" style="' + bgCSS + '">' + maskDiv + '<div class="ly-scroll-in">' + html + '</div></div>' +
      '<div class="ly-input-area">' + (!canReply ? '<div class="ly-limit">답장 한도 도달 (3/3)</div>' : '') +
      '<div class="ly-input-row">' +
        '<button class="ly-plus" id="ly-plus" title="AI Reply"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A383F7" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg></button>' +
        '<div class="ly-input-wrap"><textarea class="ly-textarea" id="ly-inp" placeholder="Send a message..." maxlength="' + charLimit + '"' + (!canReply ? ' disabled' : '') + '></textarea><span class="ly-counter" id="ly-cnt">0/' + charLimit + '</span></div>' +
        '<button class="ly-send" id="ly-send"' + (!canReply ? ' disabled' : '') + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>' +
      '</div></div></div>';

    var sc = document.getElementById('ly-scroll'); if (sc) sc.scrollTop = sc.scrollHeight;
    document.getElementById('ly-back').onclick = function () { currentArtist = null; render(); };
    document.getElementById('ly-more').onclick = function () { showMore(currentArtist, panel); };
    document.getElementById('ly-search').onclick = function () { Toast.info('Search coming soon'); };
    document.getElementById('ly-trash').onclick = function () { var msgs2 = Storage.getBubbleMessages(currentArtist); if (!msgs2.length) { Toast.info('No messages'); return; } if (!confirm('Clear all messages?')) return; Storage.saveBubbleMessages(currentArtist, []); renderChat(panel); Toast.success('Cleared'); };

    var inp = document.getElementById('ly-inp'), cnt = document.getElementById('ly-cnt');
    if (inp) {
      inp.oninput = function () { cnt.textContent = inp.value.length + '/' + charLimit; inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 80) + 'px'; };
      inp.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };
    }

    function doSend() {
      var t = (inp.value || '').trim(); if (!t) return;
      Storage.addBubbleMessage(currentArtist, { from: 'fan', text: t, ts: Date.now() });
      inp.value = ''; renderChat(panel);
    }
    document.getElementById('ly-send').onclick = doSend;

    document.getElementById('ly-plus').onclick = function () {
      if (!Storage.get('apiKey', '')) { Toast.warn('Set API key first'); return; }
      var m = Storage.getBubbleMessages(currentArtist);
      if (!m.length) { Toast.warn('Send a message first'); return; }
      Toast.info('답장 요청 중...');
      setTimeout(function () { aiReply(currentArtist, panel); }, 800 + Math.random() * 2000);
    };

    autoTranslate(currentArtist);

    var scrollEl = document.getElementById('ly-scroll');
    if (scrollEl) {
      var ltimer = null;
      scrollEl.addEventListener('touchstart', function (ev) { var b = ev.target.closest('.ly-bubble'); if (!b) return; ltimer = setTimeout(function () { ev.preventDefault(); showBubbleCtx(b, currentArtist, panel); }, 500); }, { passive: false });
      scrollEl.addEventListener('touchend', function () { clearTimeout(ltimer); });
      scrollEl.addEventListener('touchmove', function () { clearTimeout(ltimer); });
      scrollEl.addEventListener('mousedown', function (ev) { var b = ev.target.closest('.ly-bubble'); if (!b) return; ltimer = setTimeout(function () { showBubbleCtx(b, currentArtist, panel); }, 500); });
      scrollEl.addEventListener('mouseup', function () { clearTimeout(ltimer); });
    }
  }

  function showBubbleCtx(bubble, artistId, panel) {
    document.querySelectorAll('.ly-ctx').forEach(function (m) { m.remove(); });
    var idx = parseInt(bubble.dataset.idx, 10);
    var msgs = Storage.getBubbleMessages(artistId);
    var msg = !isNaN(idx) && msgs[idx] ? msgs[idx] : null;
    if (!msg) return;
    var isMe = msg.from === 'fan';
    var text = msg.text || '';

    var menu = document.createElement('div'); menu.className = 'ly-ctx';
    var items = '<div class="ly-ctx-item" data-act="copy">Copy</div>';
    if (isMe) items += '<div class="ly-ctx-item" data-act="edit">Edit</div>';
    items += '<div class="ly-ctx-item" data-act="delete">Delete</div>';
    menu.innerHTML = items;

    var rect = bubble.getBoundingClientRect();
    menu.style.top = Math.max(8, rect.top - 4) + 'px';
    menu.style.left = Math.min(rect.left, window.innerWidth - 140) + 'px';
    document.body.appendChild(menu);

    menu.addEventListener('click', function (ev) {
      var act = ev.target.closest('.ly-ctx-item'); if (!act) return;
      var action = act.dataset.act;
      if (action === 'copy') { if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { Toast.success('Copied'); }); }
      else if (action === 'delete') { if (confirm('Delete?')) { msgs.splice(idx, 1); Storage.saveBubbleMessages(artistId, msgs); renderChat(panel); } }
      else if (action === 'edit') { var n = prompt('Edit:', text); if (n !== null && n.trim()) { msgs[idx].text = n.trim(); Storage.saveBubbleMessages(artistId, msgs); renderChat(panel); } }
      menu.remove();
    });
    setTimeout(function () { var close = function (ev) { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); document.removeEventListener('touchstart', close); } }; document.addEventListener('click', close); document.addEventListener('touchstart', close); }, 10);
  }

  function autoTranslate(artistId) {
    if (!Storage.get('apiKey', '')) return;
    var msgs = Storage.getBubbleMessages(artistId); var count = 0;
    msgs.forEach(function (m, i) {
      if (m.from !== 'artist' || m.translation || count >= 3) return; count++;
      var built = window.buildApiUrl('/chat/completions');
      fetch(built.url, { method: 'POST', headers: built.headers, body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'), messages: [{ role: 'system', content: 'Translate Korean to Chinese. Output only translation.' }, { role: 'user', content: m.text }], temperature: 0.1, stream: false }) }).then(function (r) { return r.json(); }).then(function (d) { var t = ''; try { t = d.choices[0].message.content; } catch (e) {} if (t) { t = replaceUsername(t.trim()); var all = Storage.getBubbleMessages(artistId); if (all[i]) { all[i].translation = t; Storage.saveBubbleMessages(artistId, all); } var el = document.querySelector('.ly-trans-pending[data-idx="' + i + '"]'); if (el) { el.textContent = t; el.classList.remove('ly-trans-pending'); } } }).catch(function () { var el = document.querySelector('.ly-trans-pending[data-idx="' + i + '"]'); if (el) { el.textContent = '翻译失败'; el.classList.remove('ly-trans-pending'); } });
    });
  }

  function aiReply(artistId, panel) {
    var artist = Storage.getFriends().find(function (f) { return f.id === artistId; }); if (!artist) return;
    var cn = artist.realName || artist.displayName || artist.name || 'Artist';
    var msgs = Storage.getBubbleMessages(artistId).slice(-10);
    var hist = msgs.map(function (m) { return (m.from === 'fan' ? 'Fan' : cn) + ': ' + replaceUsername(m.text); }).join('\n');
    var profile = getBubbleProfile(), fanName = profile.name || (Storage.getActiveUser() || {}).name || 'Fan';
    var persona = profile.persona ? '\nFan persona: ' + profile.persona : '';
    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, { method: 'POST', headers: built.headers,
      body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{ role: 'system', content: 'You are ' + cn + ' on Bubble. ' + (artist.prompt || '') + '\nIMPORTANT: Reply in Korean (한국어), BUT write the fan\'s name exactly as "' + fanName + '" without translating or changing it.' + persona + '\n1-2 warm sentences. No asterisks. Stay in character.\nYou can use [图片:description] to send a photo or [语音:content] for voice. Use naturally, not every time.' },
          { role: 'user', content: hist }], temperature: 0.9, stream: false })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var t = ''; try { t = d.choices[0].message.content; } catch (e) {}
      if (t) { t = replaceUsername(t.trim()); Storage.addBubbleMessage(artistId, { from: 'artist', text: t, ts: Date.now() }); if (currentArtist === artistId) renderChat(panel); }
    }).catch(function () { Toast.error('Failed'); });
  }

  function showMore(artistId, panel) { var ov = document.createElement('div'); ov.className = 'inner-modal-overlay'; ov.innerHTML = '<div class="inner-modal" style="max-width:300px"><div class="modal-header"><span class="modal-title">설정</span><button class="modal-close" id="lym-x"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div><div class="ly-menu"><div class="ly-menu-item" id="lym-aav">🖼️ Artist Avatar</div><div class="ly-menu-item" id="lym-mav">👤 My Avatar</div><div class="ly-menu-item" id="lym-bg">🎨 Background</div><div class="ly-menu-item ly-menu-danger" id="lym-clr">🗑️ Clear</div></div></div>'; document.body.appendChild(ov); document.getElementById('lym-x').onclick = function () { ov.remove(); }; ov.onclick = function (e) { if (e.target === ov) ov.remove(); }; document.getElementById('lym-aav').onclick = function () { ov.remove(); pickImg(function (u) { if (!u) return; var s = getArtistSettings(artistId); s.artistAvatar = u; setArtistSettings(artistId, s); renderChat(panel); }); }; document.getElementById('lym-mav').onclick = function () { ov.remove(); pickImg(function (u) { if (!u) return; var s = getArtistSettings(artistId); s.myAvatar = u; setArtistSettings(artistId, s); Toast.success('Updated'); }); }; document.getElementById('lym-bg').onclick = function () { ov.remove(); pickImg(function (u) { var s = getArtistSettings(artistId); s.chatBg = u || ''; setArtistSettings(artistId, s); renderChat(panel); }); }; document.getElementById('lym-clr').onclick = function () { if (!confirm('Clear?')) return; Storage.saveBubbleMessages(artistId, []); ov.remove(); renderChat(panel); }; }

  function pickImg(cb) { var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = function () { var f = inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { var img = new Image(); img.onload = function () { var w = img.width, h = img.height; if (w > 600) { h = Math.round(h * 600 / w); w = 600; } var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); cb(c.toDataURL('image/jpeg', 0.6)); }; img.src = r.result; }; r.readAsDataURL(f); }; inp.click(); }

  function renderFriends(el) { var fs = Storage.getFriends(), subs = Storage.getBubbleSubscriptions(); var user = Storage.getActiveUser() || { name: 'Me', avatar: '' }; var profile = getBubbleProfile(), dn = profile.name || user.name; el.innerHTML = '<div class="ly-friends"><div class="ly-me-card"><img class="ly-me-av" src="' + esc(user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=me') + '"/><div style="flex:1"><div class="ly-me-name">' + esc(dn) + '</div><div class="ly-me-sub">' + subs.length + ' subs</div>' + (profile.persona ? '<div class="ly-me-bio">' + esc(profile.persona.slice(0, 40)) + '</div>' : '') + '</div><button class="ly-me-edit" id="ly-edit-me"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A383F7" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></div><div class="ly-f-title">ALL ARTISTS</div><div class="ly-f-list">' + fs.map(function (f) { var on = subs.indexOf(f.id) >= 0; return '<div class="ly-f-row"><div class="ly-av-wrap ly-av-sm"><div class="ly-av-frame"></div><img class="ly-av-img" src="' + esc(f.avatar) + '"/></div><div class="ly-f-info"><div class="ly-f-name">' + esc(f.displayName || f.name) + '</div>' + (on ? '<div class="ly-f-days">D+' + getDays(f.id) + '</div>' : '') + '</div><button class="ly-f-btn' + (on ? ' ly-f-on' : '') + '" data-fid="' + f.id + '">' + (on ? 'Subscribed' : 'Subscribe') + '</button></div>'; }).join('') + '</div></div>'; document.getElementById('ly-edit-me').onclick = function () { editProfile(el); }; el.querySelectorAll('.ly-f-btn').forEach(function (b) { b.onclick = function () { var fid = b.dataset.fid; if (subs.indexOf(fid) >= 0) Storage.removeBubbleSubscription(fid); else { Storage.addBubbleSubscription(fid); Storage.set('bb_subday_' + fid, String(Date.now())); } renderFriends(el); }; }); }

  function editProfile(parentEl) { var user = Storage.getActiveUser() || { name: 'Me' }, profile = getBubbleProfile(); var ov = document.createElement('div'); ov.className = 'inner-modal-overlay'; ov.innerHTML = '<div class="inner-modal" style="max-width:320px"><div class="modal-header"><span class="modal-title">Edit Profile</span><button class="modal-close" id="lyp-x"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div><div class="settings-item"><label class="settings-label">Name</label><input id="lyp-name" class="s-input" value="' + esc(profile.name || user.name) + '"/></div><div class="settings-item"><label class="settings-label">Persona</label><textarea id="lyp-bio" class="s-input" rows="3" style="min-height:4rem;resize:vertical" placeholder="Tell artists about yourself...">' + esc(profile.persona || '') + '</textarea></div><button class="s-btn" id="lyp-save" style="width:100%;background:#A383F7;border:none">Save</button></div>'; document.body.appendChild(ov); document.getElementById('lyp-x').onclick = function () { ov.remove(); }; ov.onclick = function (e) { if (e.target === ov) ov.remove(); }; document.getElementById('lyp-save').onclick = function () { var n = (document.getElementById('lyp-name').value || '').trim(), bio = (document.getElementById('lyp-bio').value || '').trim(); setBubbleProfile({ name: n, persona: bio }); if (n) { var u = Storage.getActiveUser(); if (u) { u.name = n; Storage.upsertUser(u); } } ov.remove(); Toast.success('Saved 💜'); renderFriends(parentEl); }; }

  function renderSettings(el) { var subs = Storage.getBubbleSubscriptions(), total = 0; subs.forEach(function (id) { total += Storage.getBubbleMessages(id).length; }); el.innerHTML = '<div class="ly-settings"><div class="ly-s-card"><span class="ly-s-label">Subscriptions</span><span class="ly-s-val">' + subs.length + '</span></div><div class="ly-s-card"><span class="ly-s-label">Messages</span><span class="ly-s-val">' + total + '</span></div><div class="ly-s-card"><span class="ly-s-label">Language</span><span class="ly-s-val">KR → CN</span></div></div>'; }

  function autoSend() { var subs = Storage.getBubbleSubscriptions(); if (!Storage.get('apiKey', '')) return; var profile = getBubbleProfile(), fanName = profile.name || (Storage.getActiveUser() || {}).name || 'Fan'; subs.forEach(function (id) { var msgs = Storage.getBubbleMessages(id), last = msgs.length ? msgs[msgs.length - 1] : null; if (last && last.from === 'artist' && (Date.now() - last.ts) > 3600000 && Math.random() < 0.4) { var a = Storage.getFriends().find(function (f) { return f.id === id; }); if (!a) return; var cn = a.realName || a.displayName || a.name || 'Artist'; var built = window.buildApiUrl('/chat/completions'); fetch(built.url, { method: 'POST', headers: built.headers, body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'), messages: [{ role: 'system', content: 'You are ' + cn + ' on Bubble. ' + (a.prompt || '') + '\nMUST reply in Korean. Send casual 1-2 sentences to "' + fanName + '". Write their name exactly as-is, do NOT translate it. No asterisks. Stay in character.\nYou can use [图片:description] to send a photo or [语音:content] for voice. Use naturally, not every time.' }, { role: 'user', content: 'Send bubble.' }], temperature: 1.0, stream: false }) }).then(function (r) { return r.json(); }).then(function (d) { var t = ''; try { t = d.choices[0].message.content; } catch (e) {} if (t) { t = replaceUsername(t.trim()); Storage.addBubbleMessage(id, { from: 'artist', text: t, ts: Date.now() }); } }).catch(function () {}); } }); }

  document.addEventListener('modalOpen', function (e) { if (e.detail && e.detail.name === 'style') { currentView = 'chat'; currentArtist = null; render(); } });
})();
