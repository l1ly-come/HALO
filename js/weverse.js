(function () {
  'use strict';

  var view = 'home', dmTarget = null, detailPost = null;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtAgo(ts) { var m = Math.floor((Date.now() - ts) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + 'm'; var h = Math.floor(m / 60); if (h < 24) return h + 'h'; var d = Math.floor(h / 24); if (d < 7) return d + 'd'; return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function fmtTime(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function randK(min, max) { var n = rand(min, max); return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n); }

  function getDMSettings(id) { try { return JSON.parse(Storage.get('wv_dm_settings_' + id, '{}')); } catch (e) { return {}; } }
  function setDMSettings(id, s) { Storage.set('wv_dm_settings_' + id, JSON.stringify(s)); }

  function render() {
    var panel = document.getElementById('weverse-panel');
    if (!panel) return;
    panel.innerHTML = ''; panel.className = 'modal-panel wv2-root';
    var app = document.createElement('div'); app.className = 'wv2-app';
    app.innerHTML = '<div class="wv2-body" id="wv2-body"></div><div class="wv2-nav" id="wv2-nav"></div>';
    panel.appendChild(app); renderNav(); renderView();
  }

  function showNav() { var n = document.getElementById('wv2-nav'); if (n) n.style.display = ''; }
  function hideNav() { var n = document.getElementById('wv2-nav'); if (n) n.style.display = 'none'; }

  function renderNav() {
    var nav = document.getElementById('wv2-nav'); if (!nav) return;
    var tabs = [
      { key: 'home', label: 'Home', svg: '<path d="M3 9.5L12 2l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
      { key: 'shop', label: 'Shop', svg: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
      { key: 'dm', label: 'DM', svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
      { key: 'more', label: 'More', svg: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09"/>' }
    ];
    nav.innerHTML = tabs.map(function (t) {
      var on = view === t.key;
      return '<button class="wv2-nav-btn' + (on ? ' wv2-nav-on' : '') + '" data-v="' + t.key + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (on ? '2.2' : '1.5') + '">' + t.svg + '</svg><span>' + t.label + '</span></button>';
    }).join('') + '<button class="wv2-nav-btn wv2-nav-close" id="wv2-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    nav.onclick = function (e) { var btn = e.target.closest('[data-v]'); if (btn) { view = btn.dataset.v; dmTarget = null; detailPost = null; showNav(); renderNav(); renderView(); } };
    document.getElementById('wv2-close').onclick = function () { document.getElementById('modal-pulse').classList.remove('active'); };
  }

  function renderView() {
    var body = document.getElementById('wv2-body'); if (!body) return;
    if (dmTarget) { renderDMChat(body); return; }
    if (detailPost) { renderPostDetail(body); return; }
    ({ home: renderHome, shop: renderShop, dm: renderDMList, more: renderMore })[view](body);
  }

  /* ═══ HOME ═══ */
  function renderHome(el) {
    var friends = Storage.getFriends();
    var posts = Storage.getWversePosts();

    var artistBar = '<div class="wv2-artist-bar"><div class="wv2-artist-add" id="wv2-auto-post"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></div>' +
      friends.map(function (f) { return '<div class="wv2-artist-chip" data-fid="' + f.id + '"><img src="' + esc(f.avatar) + '"/><span>' + esc((f.displayName || f.name || '').slice(0, 5)) + '</span></div>'; }).join('') + '</div>';

        // Live 入口
    var liveTarget = friends.length ? friends[Math.floor(Math.random() * friends.length)] : null;
    var liveHtml = '';
    if (liveTarget) {
      liveHtml = '<div class="wvl-entry" id="wvl-entry">' +
        '<div class="wvl-entry-left">' +
          '<div class="wvl-entry-av-wrap"><img src="' + esc(liveTarget.avatar) + '"/><span class="wvl-entry-live">LIVE</span></div>' +
          '<div><div class="wvl-entry-name">' + esc(liveTarget.displayName || liveTarget.name) + '</div><div class="wvl-entry-sub">Tap to join live</div></div>' +
        '</div>' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#ff3b6f;flex-shrink:0"><path d="M9 18l6-6-6-6"/></svg>' +
      '</div>';
    }

      var compose = '<div class="wv2-compose"><textarea class="wv2-compose-input" id="wv2-compose" placeholder="Share a moment..." rows="2"></textarea><div class="wv2-compose-bar"><select class="wv2-compose-as" id="wv2-post-as"><option value="me">As Me</option>' +
      friends.map(function (f) { return '<option value="' + f.id + '">As ' + esc((f.displayName || f.name || '').slice(0, 10)) + '</option>'; }).join('') + '</select><button class="wv2-compose-btn" id="wv2-post-btn">Post</button></div></div>';

    var feedHtml = '';
    if (!posts.length) { feedHtml = '<div class="wv2-empty"><div class="wv2-empty-icon">✦</div><p>No stories yet</p><p class="wv2-empty-sub">Tap + to create</p></div>'; }
    else {
      feedHtml = posts.map(function (p, i) {
        if (!p._randLikes) p._randLikes = rand(120, 9800);
        var likeNum = p._randLikes, cmtNum = (p.comments || []).length + rand(5, 200);
        var cmtPreview = '';
        if (p.comments && p.comments.length) {
          cmtPreview = p.comments.slice(0, 2).map(function (c) { return '<div class="wv2-feed-cmt' + (c.isArtist ? ' wv2-cmt-artist' : '') + '"><strong>' + esc(c.name) + '</strong> ' + esc(c.text) + '</div>'; }).join('') +
            (p.comments.length > 2 ? '<button class="wv2-view-all" data-pid="' + p.id + '">View all</button>' : '');
        }
        var transHtml = '';
        if (p.isArtist && p.translation) transHtml = '<div class="wv2-post-trans">' + esc(p.translation) + '</div>';
        else if (p.isArtist && !p.translation) transHtml = '<div class="wv2-post-trans wv2-trans-pending" data-pid="' + p.id + '">翻译中...</div>';

        return '<div class="wv2-feed-card" data-pid="' + p.id + '"><div class="wv2-feed-body">' +
          '<div class="wv2-feed-meta"><img class="wv2-feed-av" src="' + esc(p.avatar) + '"/><div class="wv2-feed-who"><span class="wv2-feed-name">' + esc(p.name) + (p.isArtist ? ' <span class="wv2-artist-tag">Artist</span>' : '') + '</span><span class="wv2-feed-time">' + fmtAgo(p.ts) + '</span></div></div>' +
          '<div class="wv2-feed-txt">' + esc(p.content) + '</div>' + transHtml +
          '<div class="wv2-feed-actions"><button class="wv2-act wv2-act-like' + (p.liked ? ' wv2-liked' : '') + '" data-pid="' + p.id + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="' + (p.liked ? '#e74c5e' : 'none') + '" stroke="' + (p.liked ? '#e74c5e' : 'currentColor') + '" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + randK(likeNum, likeNum + 500) + '</button>' +
          '<button class="wv2-act" data-comment="' + p.id + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ' + cmtNum + '</button></div>' +
          (cmtPreview ? '<div class="wv2-feed-comments">' + cmtPreview + '</div>' : '') +
        '</div></div>';
      }).join('');
    }

        el.innerHTML = artistBar + liveHtml + compose + '<div class="wv2-feed">' + feedHtml + '</div>';

    autoTranslatePosts();
        // Live 点击
    var liveEntry = document.getElementById('wvl-entry');
    if (liveEntry && liveTarget) {
      liveEntry.onclick = function () {
        if (window.WeverseLive) window.WeverseLive.start(liveTarget);
      };
    }


    document.getElementById('wv2-auto-post').onclick = aiAutoPost;
    document.getElementById('wv2-post-btn').onclick = function () {
      var text = (document.getElementById('wv2-compose').value || '').trim(); if (!text) return;
      var asVal = document.getElementById('wv2-post-as').value;
      var user = Storage.getActiveUser() || { name: 'Me', avatar: '' };
      var name, avatar, isArtist = false, artistId = '';
      if (asVal === 'me') { name = user.name; avatar = user.avatar; }
      else { var f = friends.find(function (x) { return x.id === asVal; }); name = f ? (f.displayName || f.name) : 'Artist'; avatar = f ? f.avatar : ''; isArtist = true; artistId = asVal; }
      Storage.addWversePost({ name: name, avatar: avatar, content: text, isArtist: isArtist, artistId: artistId });
      document.getElementById('wv2-compose').value = ''; renderView();
    };

    el.querySelectorAll('.wv2-artist-chip').forEach(function (chip) {
      chip.onclick = function () { var f = friends.find(function (x) { return x.id === chip.dataset.fid; }); if (f) showArtistProfile(f); };
    });

    el.addEventListener('click', function (e) {
      var like = e.target.closest('.wv2-act-like');
      var comment = e.target.closest('[data-comment]');
      var viewAll = e.target.closest('.wv2-view-all');
      if (like) { Storage.toggleWverseLike(like.dataset.pid); renderView(); }
      else if (comment) { detailPost = Storage.getWversePosts().find(function (x) { return x.id === comment.dataset.comment; }); if (detailPost) renderView(); }
      else if (viewAll) { detailPost = Storage.getWversePosts().find(function (x) { return x.id === viewAll.dataset.pid; }); if (detailPost) renderView(); }
    });
  }

  function showArtistProfile(artist) {
    var posts = Storage.getWversePosts().filter(function (p) { return p.artistId === artist.id; });
    var ov = document.createElement('div'); ov.className = 'inner-modal-overlay';
    var postsHtml = posts.length ? posts.slice(0, 5).map(function (p) {
      return '<div style="padding:10px 0;border-bottom:0.5px solid rgba(0,0,0,0.06);font-size:13px;color:#4a4640;line-height:1.5">' + esc(p.content) +
        (p.translation ? '<div style="font-size:11px;color:#888;font-style:italic;margin-top:4px">' + esc(p.translation) + '</div>' : '') +
        '<div style="font-size:10px;color:#bbb;margin-top:4px">' + fmtAgo(p.ts) + '</div></div>';
    }).join('') : '<div style="padding:20px;text-align:center;color:#ccc;font-size:13px">No posts yet</div>';

    ov.innerHTML = '<div class="inner-modal" style="max-width:380px;padding:0;overflow:hidden"><div style="height:90px;background:linear-gradient(135deg,#e8d5c4,#d4c4d8)"></div><div style="display:flex;flex-direction:column;align-items:center;padding:0 20px 8px;margin-top:-36px"><img src="' + esc(artist.avatar) + '" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.1)"/><div style="font-size:18px;font-weight:800;margin-top:10px;color:#2a2622">' + esc(artist.displayName || artist.name) + '</div><div style="font-size:12px;color:#a09890;text-align:center;margin:6px 0;max-width:90%;line-height:1.5">' + esc((artist.prompt || '').slice(0, 100) || 'No bio yet') + '</div><div style="display:flex;gap:24px;margin:8px 0 12px"><div style="text-align:center"><div style="font-size:18px;font-weight:800">' + posts.length + '</div><div style="font-size:10px;color:#b0a898;letter-spacing:0.1em">POSTS</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:800">' + Storage.getMessages(artist.id).length + '</div><div style="font-size:10px;color:#b0a898;letter-spacing:0.1em">CHATS</div></div></div></div><div style="border-top:0.5px solid #f0ece8;padding:0 16px;max-height:200px;overflow-y:auto"><div style="font-size:10px;font-weight:700;color:#c0b8b0;letter-spacing:0.1em;padding:12px 0 4px">RECENT POSTS</div>' + postsHtml + '</div><div style="padding:12px 16px"><button class="s-btn" id="wv-prof-close" style="width:100%;font-size:12px">Close</button></div></div>';
    document.body.appendChild(ov);
    document.getElementById('wv-prof-close').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
  }

  function autoTranslatePosts() {
    if (!Storage.get('apiKey', '')) return;
    var posts = Storage.getWversePosts(); var count = 0;
    posts.forEach(function (p) {
      if (!p.isArtist || p.translation || count >= 3) return; count++;
      var built = window.buildApiUrl('/chat/completions');
      fetch(built.url, { method: 'POST', headers: built.headers, body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'), messages: [{ role: 'system', content: 'Translate Korean to Chinese. Output only the translation.' }, { role: 'user', content: p.content }], temperature: 0.1, stream: false }) }).then(function (r) { return r.json(); }).then(function (d) { var t = ''; try { t = d.choices[0].message.content; } catch (e) {} if (t) { var all = Storage.getWversePosts(); var found = all.find(function (x) { return x.id === p.id; }); if (found) { found.translation = t.trim(); Storage.saveWversePosts(all); } var el2 = document.querySelector('.wv2-trans-pending[data-pid="' + p.id + '"]'); if (el2) { el2.textContent = t.trim(); el2.classList.remove('wv2-trans-pending'); } } }).catch(function () {});
    });
  }

  function aiAutoPost() {
    if (!Storage.get('apiKey', '')) { Toast.warn('Configure API first'); return; }
    var friends = Storage.getFriends(); if (!friends.length) { Toast.warn('Add contacts first'); return; }
    var f = friends[Math.floor(Math.random() * friends.length)];
    var cn = f.realName || f.displayName || f.name || 'AI';
    Toast.info(cn + ' is writing...');
    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, { method: 'POST', headers: built.headers,
      body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{ role: 'system', content: 'You are ' + cn + '. ' + (f.prompt || '') + '\nWrite a warm personal social media post in Korean (한국어). 1-3 sentences. First person. No hashtags. No asterisks. Stay in character.' },
          { role: 'user', content: 'Share something.' }], temperature: 1.0, stream: false })
    }).then(function (r) { return r.json(); }).then(function (d) { var t = ''; try { t = d.choices[0].message.content; } catch (e) {} if (t) { Storage.addWversePost({ name: cn, avatar: f.avatar, content: t.trim(), isArtist: true, artistId: f.id }); renderView(); Toast.success('Posted ✦'); } }).catch(function () { Toast.error('Failed'); });
  }

  /* Post Detail */
  function renderPostDetail(el) {
    var p = detailPost; if (!p) return;
    var allCmt = (p.comments || []).map(function (c) { return '<div class="wv2-detail-cmt' + (c.isArtist ? ' wv2-cmt-artist' : '') + '"><strong>' + esc(c.name) + '</strong> ' + esc(c.text) + '<div class="wv2-cmt-time">' + (c.ts ? fmtAgo(c.ts) : '') + '</div></div>'; }).join('');
    el.innerHTML = '<div class="wv2-detail"><div class="wv2-detail-hdr"><button class="wv2-back" id="wv2-detail-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button><span>Post</span></div>' +
      '<div class="wv2-feed-card" style="border-radius:0;margin:0"><div class="wv2-feed-body"><div class="wv2-feed-meta"><img class="wv2-feed-av" src="' + esc(p.avatar) + '"/><div class="wv2-feed-who"><span class="wv2-feed-name">' + esc(p.name) + '</span><span class="wv2-feed-time">' + fmtAgo(p.ts) + '</span></div></div><div class="wv2-feed-txt">' + esc(p.content) + '</div>' + (p.translation ? '<div class="wv2-post-trans">' + esc(p.translation) + '</div>' : '') + '</div></div>' +
      '<div class="wv2-detail-list">' + (allCmt || '<div style="padding:1.5rem;text-align:center;color:#ccc;font-size:13px">No comments</div>') + '</div>' +
      '<div class="wv2-detail-input"><input class="wv2-dm-input" id="wv2-cmt-inp" placeholder="Comment..."/><button class="wv2-dm-send" id="wv2-cmt-send">Send</button></div></div>';
    document.getElementById('wv2-detail-back').onclick = function () { detailPost = null; renderView(); };
    document.getElementById('wv2-cmt-send').onclick = function () {
      var inp = document.getElementById('wv2-cmt-inp'), text = (inp.value || '').trim(); if (!text) return;
      var user = Storage.getActiveUser() || { name: 'Me' };
      Storage.addWverseComment(p.id, { name: user.name, text: text, ts: Date.now(), isArtist: false }); inp.value = '';
      if (Math.random() < 0.3 && Storage.get('apiKey', '')) {
        var friends = Storage.getFriends(); if (friends.length) {
          var a = friends[Math.floor(Math.random() * friends.length)];
          var cn = a.realName || a.displayName || a.name || 'Artist';
          var built = window.buildApiUrl('/chat/completions');
          fetch(built.url, { method: 'POST', headers: built.headers,
            body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'),
              messages: [{ role: 'system', content: 'You are ' + cn + '. ' + (a.prompt || '') + '\nReply briefly in Korean (1 sentence). No asterisks. Stay in character.' }, { role: 'user', content: text }], temperature: 0.9, stream: false })
          }).then(function (r) { return r.json(); }).then(function (d) { var reply = ''; try { reply = d.choices[0].message.content; } catch (e) {} if (reply) { Storage.addWverseComment(p.id, { name: cn, text: reply.trim(), ts: Date.now(), isArtist: true }); detailPost = Storage.getWversePosts().find(function (x) { return x.id === p.id; }); renderView(); } }).catch(function () {});
        }
      }
      detailPost = Storage.getWversePosts().find(function (x) { return x.id === p.id; }); renderView();
    };
  }

  /* ═══ SHOP ═══ */
  var ALBUMS = ['Morning Dew','In the Silence','A Piece of Cloud','Midnight Garden','Paper Moon','Still Water','Lavender Hours','Letters Unsent','Gentle Rain','White Noise','Bloom Again','Fleeting','Golden Hour','Dear Spring','Starlit Path','Ocean Breath','Petal Storm','Velvet Sky','Moon Diary','Crystal Snow'];
  var TAGS = ['EP','Album','Single','LP','Repackage','Deluxe'];
  var PASTEL = ['#e8d5c4','#c4d4e0','#d4c4d8','#c8d8c4','#d8d4c4','#c4c8d8','#dcc8c4','#c4d8d4','#d8c4c8','#c8c4d8'];

  function genShopItems() { var items = [], used = {}; for (var i = 0; i < 8; i++) { var idx; do { idx = rand(0, ALBUMS.length - 1); } while (used[idx]); used[idx] = true; var isKRW = Math.random() > 0.4; items.push({ name: ALBUMS[idx], tag: TAGS[rand(0, TAGS.length - 1)], price: isKRW ? '₩ ' + rand(12, 35) + ',' + rand(0, 9) + '00' : '$ ' + rand(8, 24) + '.99', color: PASTEL[i % PASTEL.length] }); } return items; }

  function renderShop(el) {
    var items = genShopItems(); var banner = items.slice(0, 3);
    el.innerHTML = '<div class="wv2-page-hdr"><span class="wv2-page-title">Shop</span><button class="wv2-shop-refresh" id="wv2-shop-refresh"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button></div>' +
      '<div class="wv2-shop-banner" id="wv2-banner">' + banner.map(function (a, i) { return '<div class="wv2-banner-slide' + (i === 0 ? ' wv2-banner-active' : '') + '" style="background:' + a.color + '"><div class="wv2-banner-title">' + esc(a.name) + '</div><div class="wv2-banner-tag">' + a.tag + ' · ' + a.price + '</div></div>'; }).join('') + '</div>' +
      '<div class="wv2-shop-grid">' + items.map(function (a) { return '<div class="wv2-shop-item"><div class="wv2-shop-cover" style="background:' + a.color + '"><span class="wv2-shop-initial">' + a.name.charAt(0) + '</span></div><div class="wv2-shop-info"><div class="wv2-shop-name">' + esc(a.name) + '</div><div class="wv2-shop-price">' + a.price + ' <span class="wv2-shop-tag">' + a.tag + '</span></div></div></div>'; }).join('') + '</div>';
    document.getElementById('wv2-shop-refresh').onclick = function () { renderShop(el); Toast.success('Refreshed ✦'); };
    var slides = el.querySelectorAll('.wv2-banner-slide'), idx = 0;
    if (slides.length > 1) setInterval(function () { slides[idx].classList.remove('wv2-banner-active'); idx = (idx + 1) % slides.length; slides[idx].classList.add('wv2-banner-active'); }, 3500);
  }

  /* ═══ DM ═══ */
  function renderDMList(el) {
    showNav();
    var friends = Storage.getFriends(); var letters = Storage.getWverseLetters();
    var listHtml = friends.map(function (f) {
      var dmS = getDMSettings(f.id); var displayName = dmS.alias || f.displayName || f.name;
      var myLetters = letters.filter(function (l) { return l.artistId === f.id; });
      var last = myLetters.length ? myLetters[0] : null;
      var preview = last ? (last.reply || last.content || '').slice(0, 28) : 'Start a conversation...';
      return '<div class="wv2-dm-row" data-fid="' + f.id + '"><img class="wv2-dm-av" src="' + esc(f.avatar) + '"/><div class="wv2-dm-info"><div class="wv2-dm-name">' + esc(displayName) + '</div><div class="wv2-dm-preview">' + esc(preview) + '</div></div><span class="wv2-dm-time">' + (last ? fmtAgo(last.ts) : '') + '</span></div>';
    }).join('');
    if (!friends.length) listHtml = '<div class="wv2-empty"><div class="wv2-empty-icon">✉</div><p>No contacts</p></div>';
    el.innerHTML = '<div class="wv2-page-hdr"><span class="wv2-page-title">Messages</span></div><div class="wv2-dm-list">' + listHtml + '</div>';
    el.querySelectorAll('.wv2-dm-row').forEach(function (row) { row.onclick = function () { dmTarget = row.dataset.fid; hideNav(); renderView(); }; });
  }

  /* DM Chat */
  function renderDMChat(el) {
    hideNav();
    var friend = Storage.getFriends().find(function (f) { return f.id === dmTarget; });
    if (!friend) { dmTarget = null; showNav(); renderView(); return; }
    var cn = friend.realName || friend.displayName || friend.name || 'Artist';
    var dmS = getDMSettings(dmTarget); var alias = dmS.alias || cn; var chatBg = dmS.chatBg || '';
    var letters = Storage.getWverseLetters().filter(function (l) { return l.artistId === dmTarget; }).reverse();

    var msgsHtml = '';
    if (!letters.length) {
      msgsHtml = '<div class="wv2-dm-welcome"><img src="' + esc(friend.avatar) + '" class="wv2-dm-wel-av"/><div class="wv2-dm-wel-name">' + esc(alias) + '</div><div class="wv2-dm-wel-sub">Send your first message</div></div>';
    } else {
      msgsHtml = letters.map(function (l) {
        var isSent = l.direction === 'sent';
        var html = '<div class="wv2-dm-msg ' + (isSent ? 'wv2-dm-me' : 'wv2-dm-them') + '"><div class="wv2-dm-bubble" data-lid="' + l.id + '" data-dir="' + (isSent ? 'sent' : 'recv') + '">' + esc(l.content) + '</div><div class="wv2-dm-ts">' + fmtAgo(l.ts) + '</div></div>';
        if (l.reply) {
          html += '<div class="wv2-dm-msg wv2-dm-them"><div class="wv2-dm-bubble" data-lid="' + l.id + '" data-dir="reply">' + (window.parseMediaHTML ? window.parseMediaHTML(l.reply) : esc(l.reply)) + '</div>';

          if (l.replyTrans) html += '<div class="wv2-dm-trans">' + esc(l.replyTrans) + '</div>';
          else html += '<div class="wv2-dm-trans wv2-dm-trans-pending" data-lid="' + l.id + '">翻译中...</div>';
          html += '<div class="wv2-dm-ts">replied</div></div>';
        }
        return html;
      }).join('');
    }

    var bgCSS = chatBg ? 'background-image:url(' + esc(chatBg) + ');background-size:cover;background-position:center;' : '';
    var maskDiv = chatBg ? '<div class="wv2-dm-bg-mask"></div>' : '';

    el.innerHTML = '<div class="wv2-dm-chat">' +
      '<div class="wv2-dm-hdr"><button class="wv2-back" id="wv2-dm-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button><img class="wv2-dm-hdr-av" src="' + esc(friend.avatar) + '"/><span class="wv2-dm-hdr-name">' + esc(alias) + '</span><div style="flex:1"></div>' +
      '<button class="wv2-dm-more-btn" id="wv2-dm-trash" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>' +
      '<button class="wv2-dm-more-btn" id="wv2-dm-more"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></button></div>' +
      '<div class="wv2-dm-scroll" id="wv2-dm-scroll" style="' + bgCSS + '">' + maskDiv + '<div class="wv2-dm-scroll-in">' + msgsHtml + '</div></div>' +
      '<div class="wv2-dm-bar"><div class="wv2-dm-input-row">' +
        '<button class="wv2-dm-plus" id="wv2-dm-plus" title="AI Reply"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg></button>' +
        '<input class="wv2-dm-input" id="wv2-dm-inp" placeholder="Message..."/>' +
        '<button class="wv2-dm-send" id="wv2-dm-send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>' +
      '</div></div></div>';

    var scroll = document.getElementById('wv2-dm-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;

    document.getElementById('wv2-dm-back').onclick = function () { dmTarget = null; showNav(); renderView(); };

    document.getElementById('wv2-dm-trash').onclick = function () {
      var curLetters = Storage.getWverseLetters().filter(function (l) { return l.artistId === dmTarget; });
      if (!curLetters.length) { Toast.info('No messages'); return; }
      if (!confirm('Clear all messages?')) return;
      var all = Storage.getWverseLetters().filter(function (l) { return l.artistId !== dmTarget; });
      Storage.saveWverseLetters(all);
      renderDMChat(el);
      Toast.success('Cleared');
    };

    document.getElementById('wv2-dm-more').onclick = function () { showDMMore(dmTarget); };

    document.getElementById('wv2-dm-inp').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('wv2-dm-send').click(); } };

    /* 发送 — 只发消息 */
    document.getElementById('wv2-dm-send').onclick = function () {
      var inp = document.getElementById('wv2-dm-inp');
      var text = (inp.value || '').trim(); if (!text) return;
      Storage.addWverseLetter({ direction: 'sent', artistId: dmTarget, artistName: cn, content: text });
      inp.value = ''; renderDMChat(el);
    };

    /* 加号 = AI回复 */
    document.getElementById('wv2-dm-plus').onclick = function () {
      if (!Storage.get('apiKey', '')) { Toast.warn('Set API key first'); return; }
      var lt = Storage.getWverseLetters().filter(function (l) { return l.artistId === dmTarget; });
      if (!lt.length) { Toast.warn('Send a message first'); return; }
      Toast.info('답장 요청 중...');
      setTimeout(function () { aiDMReply(dmTarget, el); }, 800 + Math.random() * 2000);
    };

    autoTranslateDM(dmTarget);

    /* 长按消息菜单 */
    var dmScroll = document.getElementById('wv2-dm-scroll');
    if (dmScroll) {
      var dtimer = null;
      dmScroll.addEventListener('touchstart', function (ev) { var b = ev.target.closest('.wv2-dm-bubble'); if (!b) return; dtimer = setTimeout(function () { ev.preventDefault(); showDMCtx(b, dmTarget, el); }, 500); }, { passive: false });
      dmScroll.addEventListener('touchend', function () { clearTimeout(dtimer); });
      dmScroll.addEventListener('touchmove', function () { clearTimeout(dtimer); });
      dmScroll.addEventListener('mousedown', function (ev) { var b = ev.target.closest('.wv2-dm-bubble'); if (!b) return; dtimer = setTimeout(function () { showDMCtx(b, dmTarget, el); }, 500); });
      dmScroll.addEventListener('mouseup', function () { clearTimeout(dtimer); });
    }
  }

  /* DM长按菜单 */
  function showDMCtx(bubble, fid, el) {
    document.querySelectorAll('.wv2-ctx').forEach(function (m) { m.remove(); });
    var lid = bubble.dataset.lid; var dir = bubble.dataset.dir;
    var text = bubble.textContent || '';
    var isSent = dir === 'sent';

    var menu = document.createElement('div'); menu.className = 'wv2-ctx';
    var items = '<div class="wv2-ctx-item" data-act="copy">Copy</div>';
    if (isSent) items += '<div class="wv2-ctx-item" data-act="edit">Edit</div>';
    items += '<div class="wv2-ctx-item" data-act="delete">Delete</div>';
    menu.innerHTML = items;

    var rect = bubble.getBoundingClientRect();
    menu.style.top = Math.max(8, rect.top - 4) + 'px';
    menu.style.left = Math.min(rect.left, window.innerWidth - 140) + 'px';
    document.body.appendChild(menu);

    menu.addEventListener('click', function (ev) {
      var act = ev.target.closest('.wv2-ctx-item'); if (!act) return;
      var action = act.dataset.act;
      if (action === 'copy') { if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { Toast.success('Copied'); }); }
      else if (action === 'delete') {
        if (confirm('Delete?')) {
          var all = Storage.getWverseLetters();
          if (dir === 'reply') {
            var lt = all.find(function (l) { return l.id === lid; });
            if (lt) { delete lt.reply; delete lt.replyTrans; }
          } else { all = all.filter(function (l) { return l.id !== lid; }); }
          Storage.saveWverseLetters(all); renderDMChat(el);
        }
      } else if (action === 'edit') {
        var n = prompt('Edit:', text);
        if (n !== null && n.trim()) {
          var all2 = Storage.getWverseLetters();
          var target = all2.find(function (l) { return l.id === lid; });
          if (target) { target.content = n.trim(); Storage.saveWverseLetters(all2); }
          renderDMChat(el);
        }
      }
      menu.remove();
    });
    setTimeout(function () { var close = function (ev) { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); document.removeEventListener('touchstart', close); } }; document.addEventListener('click', close); document.addEventListener('touchstart', close); }, 10);
  }

  /* DM AI Reply */
  function aiDMReply(fid, el) {
    var friend = Storage.getFriends().find(function (f) { return f.id === fid; }); if (!friend) return;
    var cn = friend.realName || friend.displayName || friend.name || 'Artist';
    var letters = Storage.getWverseLetters().filter(function (l) { return l.artistId === fid; });
    var lastSent = letters.filter(function (l) { return l.direction === 'sent' && !l.reply; });
    if (!lastSent.length) return;
    var hist = lastSent.map(function (l) { return 'Fan: ' + l.content; }).join('\n');
    var user = Storage.getActiveUser() || { name: 'Fan' };
    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, { method: 'POST', headers: built.headers,
      body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{ role: 'system', content: 'You are ' + cn + '. ' + (friend.prompt || '') + '\nReply in Korean (한국어). Address fan exactly as "' + user.name + '" — do NOT translate or change their name. 1-3 sentences. No asterisks. Stay in character.\nYou can use [图片:description] to send a photo or [语音:content] for voice. Use naturally, not every time.' },
          { role: 'user', content: hist }], temperature: 0.8, stream: false })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var reply = ''; try { reply = d.choices[0].message.content; } catch (e) {}
      if (reply) {
        var all = Storage.getWverseLetters();
        var target = all.filter(function (l) { return l.artistId === fid && l.direction === 'sent' && !l.reply; });
        if (target.length) { target[target.length - 1].reply = reply.trim(); Storage.saveWverseLetters(all); }
        if (dmTarget === fid) renderDMChat(el);
        Toast.success(cn + ' replied ✦');
      }
    }).catch(function () { Toast.error('Failed'); });
  }

  /* DM自动翻译 */
  function autoTranslateDM(fid) {
    if (!Storage.get('apiKey', '')) return;
    var all = Storage.getWverseLetters(); var count = 0;
    all.forEach(function (l) {
      if (l.artistId !== fid || !l.reply || l.replyTrans || count >= 3) return; count++;
      var built = window.buildApiUrl('/chat/completions');
      fetch(built.url, { method: 'POST', headers: built.headers, body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'), messages: [{ role: 'system', content: 'Translate Korean to Chinese. Output only translation.' }, { role: 'user', content: l.reply }], temperature: 0.1, stream: false }) }).then(function (r) { return r.json(); }).then(function (d) { var t = ''; try { t = d.choices[0].message.content; } catch (e) {} if (t) { var all2 = Storage.getWverseLetters(); var found = all2.find(function (x) { return x.id === l.id; }); if (found) { found.replyTrans = t.trim(); Storage.saveWverseLetters(all2); } var dom = document.querySelector('.wv2-dm-trans-pending[data-lid="' + l.id + '"]'); if (dom) { dom.textContent = t.trim(); dom.classList.remove('wv2-dm-trans-pending'); } } }).catch(function () {});
    });
  }

  /* DM更多菜单 */
  function showDMMore(fid) {
    var friend = Storage.getFriends().find(function (f) { return f.id === fid; }); if (!friend) return;
    var dmS = getDMSettings(fid);
    var ov = document.createElement('div'); ov.className = 'inner-modal-overlay';
    ov.innerHTML = '<div class="inner-modal" style="max-width:300px"><div class="modal-header"><span class="modal-title">Settings</span><button class="modal-close" id="wvdm-x"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="settings-item"><label class="settings-label">Alias</label><input id="wvdm-alias" class="s-input" value="' + esc(dmS.alias || '') + '" placeholder="' + esc(friend.displayName || friend.name) + '"/></div>' +
      '<div class="settings-item"><label class="settings-label">Background</label><div style="display:flex;gap:0.25rem"><input id="wvdm-bg" class="s-input" value="' + esc(dmS.chatBg || '') + '" style="flex:1"/><button class="s-btn-sm" id="wvdm-bg-pick">Pick</button><button class="s-btn-sm" id="wvdm-bg-clear">Clear</button></div></div>' +
      '<button class="s-btn" id="wvdm-save" style="width:100%;margin-top:0.3rem">Save</button>' +
      '<button class="s-btn s-btn-danger" id="wvdm-clear" style="width:100%;margin-top:0.2rem;font-size:0.72rem">Clear Messages</button></div>';
    document.body.appendChild(ov);
    document.getElementById('wvdm-x').onclick = function () { ov.remove(); }; ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('wvdm-bg-pick').onclick = function () { var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = function () { var f2 = inp.files[0]; if (!f2) return; var r = new FileReader(); r.onload = function () { var img = new Image(); img.onload = function () { var w = img.width, h = img.height; if (w > 800) { h = Math.round(h * 800 / w); w = 800; } var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); document.getElementById('wvdm-bg').value = c.toDataURL('image/jpeg', 0.5); }; img.src = r.result; }; r.readAsDataURL(f2); }; inp.click(); };
    document.getElementById('wvdm-bg-clear').onclick = function () { document.getElementById('wvdm-bg').value = ''; };
    document.getElementById('wvdm-save').onclick = function () { setDMSettings(fid, { alias: (document.getElementById('wvdm-alias').value || '').trim(), chatBg: (document.getElementById('wvdm-bg').value || '').trim() }); ov.remove(); Toast.success('Saved'); renderView(); };
    document.getElementById('wvdm-clear').onclick = function () { if (!confirm('Clear all DM?')) return; var all = Storage.getWverseLetters().filter(function (l) { return l.artistId !== fid; }); Storage.saveWverseLetters(all); ov.remove(); renderView(); };
  }

  /* ═══ MORE ═══ */
  function renderMore(el) {
    var user = Storage.getActiveUser() || { name: 'Me', avatar: '' };
    var friends = Storage.getFriends(); var postCount = Storage.getWversePosts().length; var letterCount = Storage.getWverseLetters().length; var isDark = Storage.getDarkMode();
    el.innerHTML = '<div class="wv2-more">' +
      '<div class="wv2-more-profile"><img class="wv2-more-av" src="' + esc(user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=me') + '"/><div class="wv2-more-info"><div class="wv2-more-name">' + esc(user.name) + '</div><div class="wv2-more-sub">' + friends.length + ' artists · ' + postCount + ' posts</div></div><button class="wv2-more-edit" id="wv2-edit-profile">Edit</button></div>' +
      '<div class="wv2-more-stats"><div class="wv2-stat-item"><span class="wv2-stat-num">' + friends.length + '</span><span class="wv2-stat-label">Artists</span></div><div class="wv2-stat-item"><span class="wv2-stat-num">' + postCount + '</span><span class="wv2-stat-label">Posts</span></div><div class="wv2-stat-item"><span class="wv2-stat-num">' + letterCount + '</span><span class="wv2-stat-label">DMs</span></div></div>' +
      '<div class="wv2-more-section">Appearance</div>' +
      '<div class="wv2-menu-row" id="wv2-toggle-dark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span>Dark Mode</span><div class="dark-mode-toggle' + (isDark ? ' active' : '') + '" id="wv2-dark-toggle" style="margin-left:auto"></div></div>' +
      '<div class="wv2-more-section">Data</div>' +
      '<div class="wv2-menu-row" id="wv2-clear-posts"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg><span>Clear All Posts</span></div>' +
      '<div class="wv2-menu-row" id="wv2-clear-dms"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Clear All DMs</span></div>' +
      '<div class="wv2-more-section">About</div><div class="wv2-menu-row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h0"/></svg><span>Weverse v4.0</span></div></div>';

    document.getElementById('wv2-edit-profile').onclick = function () { showEditUser(el); };
    document.getElementById('wv2-toggle-dark').onclick = function () { var d = !Storage.getDarkMode(); Storage.setDarkMode(d); if (d) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme'); document.querySelectorAll('.dark-mode-toggle').forEach(function (t) { t.classList.toggle('active', d); }); };
    document.getElementById('wv2-clear-posts').onclick = function () { if (confirm('Clear all posts?')) { Storage.saveWversePosts([]); Toast.success('Cleared'); renderView(); } };
    document.getElementById('wv2-clear-dms').onclick = function () { if (confirm('Clear all DMs?')) { Storage.saveWverseLetters([]); Toast.success('Cleared'); renderView(); } };
  }

  function showEditUser(parentEl) {
    var user = Storage.getActiveUser() || { name: 'Me', avatar: '', prompt: '' };
    var ov = document.createElement('div'); ov.className = 'inner-modal-overlay';
    ov.innerHTML = '<div class="inner-modal" style="max-width:340px"><div class="modal-header"><span class="modal-title">Edit Profile</span><button class="modal-close" id="wvu-x"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;margin-bottom:0.3rem"><div style="position:relative;cursor:pointer" id="wvu-av-wrap"><img id="wvu-av-preview" src="' + esc(user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=me') + '" style="width:4rem;height:4rem;border-radius:50%;object-fit:cover;border:2px solid var(--border)"/><div style="position:absolute;bottom:0;right:0;width:1.2rem;height:1.2rem;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid var(--surface);font-size:0.6rem">✎</div></div></div>' +
      '<div class="settings-item"><label class="settings-label">Name</label><input id="wvu-name" class="s-input" value="' + esc(user.name) + '"/></div>' +
      '<div class="settings-item"><label class="settings-label">Avatar URL</label><input id="wvu-avatar-url" class="s-input" value="' + esc(user.avatar) + '" placeholder="https://..."/></div>' +
      '<div class="settings-item"><label class="settings-label">Bio</label><textarea id="wvu-prompt" class="s-input" rows="3" style="min-height:3rem;resize:vertical">' + esc(user.prompt || '') + '</textarea></div>' +
      '<button class="s-btn" id="wvu-save" style="width:100%">Save</button></div>';
    document.body.appendChild(ov);
    document.getElementById('wvu-x').onclick = function () { ov.remove(); }; ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('wvu-av-wrap').onclick = function () { var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = function () { var f = inp.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { var img = new Image(); img.onload = function () { var w = img.width, h = img.height; if (w > 400) { h = Math.round(h * 400 / w); w = 400; } var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); var d = c.toDataURL('image/jpeg', 0.6); document.getElementById('wvu-av-preview').src = d; document.getElementById('wvu-avatar-url').value = d; }; img.src = r.result; }; r.readAsDataURL(f); }; inp.click(); };
    document.getElementById('wvu-save').onclick = function () {
      var name = (document.getElementById('wvu-name').value || '').trim(); if (!name) return;
      var avatarUrl = (document.getElementById('wvu-avatar-url').value || '').trim();
      user.name = name; if (avatarUrl) user.avatar = avatarUrl;
      user.prompt = (document.getElementById('wvu-prompt').value || '').trim();
      Storage.upsertUser(user); ov.remove(); Toast.success('Profile updated'); renderMore(parentEl);
    };
  }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'pulse') { view = 'home'; dmTarget = null; detailPost = null; render(); }
  });
})();
