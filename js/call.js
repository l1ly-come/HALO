/**
 * call.js — 模拟语音通话 v6
 * 纯功能模块，不劫持任何事件
 * chat.js 已有 conv-call 按钮，通过 SimCall.start(friendId) 调用
 */
(function () {
  'use strict';

  var callOverlay = null, callState = 'idle', callTimer = null, callSeconds = 0;
  var currentFriend = null, callHistory = [];

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmtT(s) { return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }

  function startCall(friend) {
    if (callState !== 'idle' || !friend) return;
    currentFriend = friend; callState = 'ringing'; callSeconds = 0; callHistory = [];
    callOverlay = document.createElement('div');
    callOverlay.className = 'call-overlay';
    callOverlay.innerHTML = buildUI(friend);
    document.body.appendChild(callOverlay);
    requestAnimationFrame(function () { callOverlay.classList.add('call-show'); });
    bindEvents();
    setTimeout(function () { if (callState === 'ringing') connect(); }, 2000 + Math.random() * 3000);
  }

  function buildUI(f) {
    var cn = f.displayName || f.name || 'AI';
    return '<div class="call-bg"></div><div class="call-content">' +
      '<div class="call-top"><div class="call-status" id="call-status">calling...</div>' +
      '<div class="call-timer" id="call-timer" style="display:none">0:00</div></div>' +
      '<div class="call-avatar-area"><div class="call-ring call-ring-1"></div><div class="call-ring call-ring-2"></div><div class="call-ring call-ring-3"></div>' +
      '<img class="call-avatar" src="' + esc(f.avatar) + '" /></div>' +
      '<div class="call-name">' + esc(cn) + '</div>' +
      '<div class="call-subtitle-area"><div class="call-subtitle" id="call-subtitle"></div></div>' +
      '<div class="call-input-area" id="call-input-area" style="display:none">' +
      '<input class="call-input" id="call-input" placeholder="Say something..." autocomplete="off" /></div>' +
      '<div class="call-actions">' +
      '<button class="call-btn call-btn-mute" id="call-mute"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg><span>Speak</span></button>' +
      '<button class="call-btn call-btn-end" id="call-end"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.29-.71.29-.28 0-.53-.11-.71-.29L.29 13.08a1 1 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67a1 1 0 0 1 0 1.42l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg><span>End</span></button>' +
      '<button class="call-btn call-btn-speaker" id="call-speaker"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg><span>Send</span></button>' +
      '</div></div>';
  }

  function connect() {
    callState = 'connected';
    var s = document.getElementById('call-status'), t = document.getElementById('call-timer');
    if (s) s.textContent = 'connected';
    if (t) t.style.display = '';
    if (callOverlay) callOverlay.querySelectorAll('.call-ring').forEach(function (r) { r.classList.add('call-ring-stop'); });
    callTimer = setInterval(function () { callSeconds++; if (t) t.textContent = fmtT(callSeconds); }, 1000);
    setTimeout(function () { aiSpeak(null); }, 800 + Math.random() * 1500);
  }

  function aiSpeak(userText) {
    if (callState !== 'connected' || !currentFriend) return;
    if (!Storage.get('apiKey', '')) { showSub('Set API key first'); return; }
    showSub('...');
    var st = document.getElementById('call-status');
    if (st) st.textContent = (currentFriend.displayName || currentFriend.name) + ' speaking...';
    var cn = currentFriend.realName || currentFriend.displayName || currentFriend.name || 'AI';
    var user = Storage.getActiveUser() || { name: 'User' };
        var charBg = (currentFriend.prompt || '').replace(/[\n\r]+/g, '。').slice(0, 200);
    var msgs = [
      { role: 'system', content: cn + '正在和' + user.name + '打电话。背景：' + charBg +
        '\n\n你现在是电话里的真人。只输出一句话。不换行。不分段。不用emoji。不用颜文字。不用*号。不用括号。像真人说话一样，一口气说完一句。15到40个字。直接说话，不加任何标记。' }
    ];



    callHistory.forEach(function (h) { msgs.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text }); });
    msgs.push({ role: 'user', content: userText || (callHistory.length === 0 ? 'You picked up. Greet ' + user.name + '.' : 'Continue talking.') });
    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, { method: 'POST', headers: built.headers,
      body: JSON.stringify({ model: Storage.get('modelName', 'gpt-3.5-turbo'), messages: msgs, temperature: 0.9, max_tokens: 120, stream: false })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var t = ''; try {
  t = d.choices[0].message.content.trim()
    .split(/[\n\r]+/)[0]
    .replace(/\\n/g, '')
    .replace(/\*[^*]*\*/g, '')
    .replace(/[\[\]()（）""「」『』【】]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1FA00}-\u{1FA9F}]/gu, '')
    .replace(/[~～♡♥☆★·•●○◆◇]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
} catch (e) {}


      if (t && callState === 'connected') { callHistory.push({ role: 'ai', text: t }); showSub(t); if (st) st.textContent = 'connected'; }
    }).catch(function () { if (callState === 'connected') { showSub('...'); if (st) st.textContent = 'connected'; } });
  }

  function showSub(text) {
    var el = document.getElementById('call-subtitle'); if (!el) return;
    el.style.opacity = '0'; el.style.transform = 'translateY(6px)';
    setTimeout(function () { el.textContent = text; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 150);
  }

  function endCall() {
    callState = 'ended';
    if (callTimer) { clearInterval(callTimer); callTimer = null; }
    var s = document.getElementById('call-status'); if (s) s.textContent = 'call ended';
    var sub = document.getElementById('call-subtitle'); if (sub) sub.textContent = '';
    var inp = document.getElementById('call-input-area'); if (inp) inp.style.display = 'none';
    if (currentFriend && callSeconds > 0) {
      Storage.appendMessage(currentFriend.id, { role: 'model', content: '📞 Voice call · ' + fmtT(callSeconds), ts: Date.now() });
     
    }
    setTimeout(function () {
      if (!callOverlay) return;
      callOverlay.classList.remove('call-show'); callOverlay.classList.add('call-hide');
      setTimeout(function () { if (callOverlay) { callOverlay.remove(); callOverlay = null; } callState = 'idle'; currentFriend = null; callHistory = []; }, 500);
    }, 1200);
  }

  function bindEvents() {
    document.getElementById('call-end').addEventListener('click', endCall);
    var muteBtn = document.getElementById('call-mute');
    var inputArea = document.getElementById('call-input-area');
    var inputEl = document.getElementById('call-input');
    muteBtn.addEventListener('click', function () {
      if (callState !== 'connected') return;
      var show = inputArea.style.display === 'none';
      inputArea.style.display = show ? '' : 'none';
      muteBtn.classList.toggle('call-btn-active', show);
      if (show && inputEl) { inputEl.value = ''; inputEl.focus(); }
    });
    if (inputEl) inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('call-speaker').click(); } });
    document.getElementById('call-speaker').addEventListener('click', function () {
      if (callState !== 'connected') return;
      var text = (inputEl ? inputEl.value : '').trim();
      if (!text) { aiSpeak(null); return; }
      callHistory.push({ role: 'user', text: text });
      showSub('🎤 ' + text);
      if (inputEl) inputEl.value = '';
      var s = document.getElementById('call-status'); if (s) s.textContent = 'thinking...';
      setTimeout(function () { aiSpeak(text); }, 600 + Math.random() * 1200);
    });
  }

  window.SimCall = {
    start: function (friendId) {
      var f = Storage.getFriends().find(function (x) { return x.id === friendId; });
      if (f) startCall(f); else Toast.warn('Contact not found');
    },
    isActive: function () { return callState !== 'idle'; }
  };
})();
