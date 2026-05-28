/**
 * live.js — Weverse Live v1
 * AI 模拟角色直播 · 实时弹幕互动
 */
(function () {
  'use strict';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var liveActive = false;
  var liveArtist = null;
  var liveComments = [];
  var liveTimer = null;
  var viewerCount = 0;

  function startLive(artist) {
    liveArtist = artist;
    liveActive = true;
    liveComments = [];
    viewerCount = 800 + Math.floor(Math.random() * 4200);
    renderLive();
    scheduleArtistChat();
  }

  function endLive() {
    liveActive = false;
    liveArtist = null;
    liveComments = [];
    if (liveTimer) { clearTimeout(liveTimer); liveTimer = null; }
  }

  function renderLive() {
    var panel = document.getElementById('weverse-panel');
    if (!panel || !liveArtist) return;

    var cn = liveArtist.displayName || liveArtist.name || 'Artist';
    var av = liveArtist.avatar || '';

    var commentsHtml = liveComments.map(function (c) {
      var isArtist = c.from === 'artist';
      return '<div class="wvl-comment' + (isArtist ? ' wvl-artist-comment' : '') + '">' +
        (isArtist ? '<span class="wvl-artist-badge">★</span>' : '') +
        '<strong>' + esc(c.name) + '</strong> ' + esc(c.text) +
      '</div>';
    }).join('');

    panel.innerHTML =
      '<div class="wvl-container">' +
        '<div class="wvl-video">' +
          '<div class="wvl-video-inner">' +
            '<img class="wvl-avatar" src="' + esc(av) + '" />' +
            '<div class="wvl-pulse-ring"></div>' +
            '<div class="wvl-pulse-ring wvl-pulse-2"></div>' +
          '</div>' +
          '<div class="wvl-overlay-top">' +
            '<button class="wvl-back" id="wvl-back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
            '<div class="wvl-info">' +
              '<div class="wvl-name">' + esc(cn) + '</div>' +
              '<div class="wvl-viewers"><span class="wvl-live-dot"></span>' + viewerCount.toLocaleString() + ' watching</div>' +
            '</div>' +
          '</div>' +
          '<div class="wvl-status">LIVE</div>' +
        '</div>' +
        '<div class="wvl-chat" id="wvl-chat">' + commentsHtml + '</div>' +
        '<div class="wvl-input-bar">' +
          '<input class="wvl-input" id="wvl-input" placeholder="Say something..." />' +
          '<button class="wvl-send" id="wvl-send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>' +
        '</div>' +
      '</div>';

    var chat = document.getElementById('wvl-chat');
    if (chat) chat.scrollTop = chat.scrollHeight;

    document.getElementById('wvl-back').onclick = function () {
      endLive();
      // re-render weverse home
      document.getElementById('modal-pulse').classList.remove('active');
      setTimeout(function () {
        document.getElementById('modal-pulse').classList.add('active');
        document.dispatchEvent(new CustomEvent('modalOpen', { detail: { name: 'pulse' } }));
      }, 100);
    };

    document.getElementById('wvl-input').onkeydown = function (e) {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('wvl-send').click(); }
    };

    document.getElementById('wvl-send').onclick = function () {
      var inp = document.getElementById('wvl-input');
      var text = (inp.value || '').trim();
      if (!text) return;
      inp.value = '';

      var user = Storage.getActiveUser() || { name: 'Me' };
      addComment(user.name, text, false);

      // AI artist responds to user comment
      setTimeout(function () {
        aiArtistRespond(text);
      }, 1500 + Math.random() * 3000);
    };

    // fake viewer fluctuation
    setInterval(function () {
      if (!liveActive) return;
      viewerCount += Math.floor(Math.random() * 40 - 15);
      if (viewerCount < 500) viewerCount = 500;
      var el = document.querySelector('.wvl-viewers');
      if (el) el.innerHTML = '<span class="wvl-live-dot"></span>' + viewerCount.toLocaleString() + ' watching';
    }, 8000);
  }

  function addComment(name, text, isArtist) {
    liveComments.push({ name: name, text: text, from: isArtist ? 'artist' : 'fan', ts: Date.now() });
    if (liveComments.length > 60) liveComments = liveComments.slice(-60);
    var chat = document.getElementById('wvl-chat');
    if (!chat) return;

    var c = document.createElement('div');
    c.className = 'wvl-comment' + (isArtist ? ' wvl-artist-comment' : '');
    c.innerHTML = (isArtist ? '<span class="wvl-artist-badge">★</span>' : '') +
      '<strong>' + esc(name) + '</strong> ' + esc(text);
    chat.appendChild(c);
    chat.scrollTop = chat.scrollHeight;
  }

  // fake fan comments
  var FAKE_FANS = ['mochi🍡', 'starlight', '달빛✨', 'somi_fan', 'cloud9', 'sweetberry', '하늘🌙', 'ddeulgi', 'loveu♡', 'sunflower'];
  var FAKE_COMMENTS_KR = [
    '오빠 사랑해요 ♡', '오늘도 너무 예뻐요', '와 드디어 라이브!!', '기다렸어요ㅠㅠ',
    'ㅋㅋㅋㅋ 귀여워', '오늘 뭐 먹었어요?', '노래 불러주세요~', '보고 싶었어요',
    '하트 해주세요 ♡♡♡', '사랑해 사랑해 사랑해', '멋있다...', '오늘 컨디션 어때요?',
    '우리 오빠 최고!', 'ㅎㅎㅎ 웃기다', '잘자요~', '다음에 또 해주세요!'
  ];

  function scheduleArtistChat() {
    if (!liveActive) return;

    // Artist says something unprompted
    var delay = 5000 + Math.random() * 12000;
    liveTimer = setTimeout(function () {
      if (!liveActive || !liveArtist) return;

      // sprinkle fake fan comments
      var fanCount = 1 + Math.floor(Math.random() * 3);
      for (var i = 0; i < fanCount; i++) {
        (function (idx) {
          setTimeout(function () {
            var fan = FAKE_FANS[Math.floor(Math.random() * FAKE_FANS.length)];
            var cmt = FAKE_COMMENTS_KR[Math.floor(Math.random() * FAKE_COMMENTS_KR.length)];
            addComment(fan, cmt, false);
          }, idx * 800);
        })(i);
      }

      // Artist speaks after fans
      setTimeout(function () {
        aiArtistSpeak();
      }, fanCount * 800 + 1500);

      scheduleArtistChat();
    }, delay);
  }

  function aiArtistSpeak() {
    if (!liveActive || !liveArtist) return;
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) {
      var cn2 = liveArtist.displayName || liveArtist.name;
      addComment(cn2, '여러분 안녕~ 오늘도 와줘서 고마워요 ♡', true);
      return;
    }

    var cn = liveArtist.realName || liveArtist.displayName || liveArtist.name || 'Artist';
    var recent = liveComments.slice(-6).map(function (c) { return c.name + ': ' + c.text; }).join('\n');

    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, {
      method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{
          role: 'system',
          content: 'You are ' + cn + ' doing a live stream on Weverse. ' + (liveArtist.prompt || '') +
            '\nYou are chatting casually with fans in Korean (한국어).' +
            '\nSay 1 short sentence. Be warm, playful, natural. No asterisks. Stay in character.' +
            '\nRecent chat:\n' + (recent || '(just started)')
        }, {
          role: 'user', content: 'Say something to fans on live.'
        }],
        temperature: 1.0, stream: false
      })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var t = ''; try { t = d.choices[0].message.content; } catch (e) {}
      if (t && liveActive) addComment(cn, t.trim(), true);
    }).catch(function () {});
  }

  function aiArtistRespond(userText) {
    if (!liveActive || !liveArtist) return;
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) return;

    var cn = liveArtist.realName || liveArtist.displayName || liveArtist.name || 'Artist';
    var user = Storage.getActiveUser() || { name: 'Fan' };

    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, {
      method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{
          role: 'system',
          content: 'You are ' + cn + ' on a live stream. ' + (liveArtist.prompt || '') +
            '\nA fan named "' + user.name + '" just commented. Reply in Korean (한국어).' +
            '\n1 short warm sentence. Read their comment and respond naturally. No asterisks.'
        }, {
          role: 'user', content: user.name + ' says: ' + userText
        }],
        temperature: 0.9, stream: false
      })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var t = ''; try { t = d.choices[0].message.content; } catch (e) {}
      if (t && liveActive) addComment(cn, t.trim(), true);
    }).catch(function () {});
  }

  // expose for weverse.js to call
  window.WeverseLive = {
    start: startLive,
    isActive: function () { return liveActive; }
  };
})();
