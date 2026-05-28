/**
 * emotion.js — 情绪天气 v1
 * AI 分析聊天语气，生成心情天气报告
 */
(function () {
  'use strict';

  var _T = window.T || function(k){return k};
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(ts) { var d = new Date(ts); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); }
  function fmtTime(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  var WEATHERS = {
    sunny:    { icon: '☀️', label: 'Sunny',        color: '#E8D5A0', desc: 'Warm and bright' },
    cloudy:   { icon: '⛅', label: 'Partly Cloudy', color: '#B8C4D0', desc: 'Calm with thoughts' },
    rainy:    { icon: '🌧️', label: 'Rainy',         color: '#9EB0C4', desc: 'A bit down' },
    stormy:   { icon: '⛈️', label: 'Stormy',        color: '#A090A8', desc: 'Turbulent emotions' },
    rainbow:  { icon: '🌈', label: 'Rainbow',       color: '#C4B0D0', desc: 'Excited and colorful' },
    foggy:    { icon: '🌫️', label: 'Foggy',         color: '#C0C0C0', desc: 'Uncertain, drifting' },
    snowy:    { icon: '❄️', label: 'Snowy',         color: '#D0D8E0', desc: 'Quiet and still' },
    breezy:   { icon: '🍃', label: 'Breezy',        color: '#A8C4A8', desc: 'Light and playful' },
    starry:   { icon: '🌙', label: 'Starry Night',  color: '#8890A8', desc: 'Reflective, dreamy' }
  };

  function getHistory() { try { return JSON.parse(Storage.get('emotion_history', '[]')); } catch (e) { return []; } }
  function saveHistory(h) { Storage.set('emotion_history', JSON.stringify(h)); }

  function render() {
    var panel = document.getElementById('emotion-panel');
    if (!panel) return;

    var history = getHistory();
    var today = history.length ? history[0] : null;
    var isToday = today && fmtDate(today.ts) === fmtDate(Date.now());

    var todayHtml = '';
    if (isToday && today) {
      var w = WEATHERS[today.weather] || WEATHERS.cloudy;
      todayHtml =
        '<div class="emo-today">' +
          '<div class="emo-today-icon">' + w.icon + '</div>' +
          '<div class="emo-today-label">' + esc(w.label) + '</div>' +
          '<div class="emo-today-desc">' + esc(today.summary || w.desc) + '</div>' +
          '<div class="emo-today-detail">' + esc(today.detail || '') + '</div>' +
          '<div class="emo-today-time">' + fmtTime(today.ts) + '</div>' +
        '</div>';
    } else {
      todayHtml =
        '<div class="emo-empty-today">' +
          '<div class="emo-empty-icon">🌤️</div>' +
          '<div class="emo-empty-text">'+_T('No reading yet today')+'</div>' +
          '<div class="emo-empty-sub">'+_T('Tap below to check your emotional weather')+'</div>' +
        '</div>';
    }

    var histHtml = '';
    if (history.length > (isToday ? 1 : 0)) {
      var items = history.slice(isToday ? 1 : 0, 10);
      histHtml =
        '<div class="emo-section-title">'+_T('Recent')+'</div>' +
        '<div class="emo-hist-list">' +
        items.map(function (h) {
          var w2 = WEATHERS[h.weather] || WEATHERS.cloudy;
          return '<div class="emo-hist-item">' +
            '<div class="emo-hist-icon">' + w2.icon + '</div>' +
            '<div class="emo-hist-info">' +
              '<div class="emo-hist-label">' + esc(w2.label) + '</div>' +
              '<div class="emo-hist-summary">' + esc((h.summary || '').slice(0, 40)) + '</div>' +
            '</div>' +
            '<div class="emo-hist-date">' + fmtDate(h.ts) + '</div>' +
          '</div>';
        }).join('') +
        '</div>';
    }

    panel.innerHTML =
      '<div class="emo-app">' +
        '<div class="emo-header">' +
          '<div class="emo-hdr-left">' +
            '<div class="emo-title">'+_T('Emotion Weather')+'</div>' +
            '<div class="emo-subtitle">' + history.length + ' '+_T('readings')+'</div>' +
          '</div>' +
          '<button class="gal-hdr-btn" id="emo-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<div class="emo-body">' +
          todayHtml +
          '<button class="emo-generate-btn" id="emo-generate">' +
            (isToday ? _T('Refresh Reading') : _T('Check My Weather')) +
          '</button>' +
          '<div class="emo-friend-select">' +
            '<select class="s-select" id="emo-friend-sel" style="font-size:0.7rem">' +
              '<option value="__all__">'+ _T('All Conversations') +'</option>' +
              Storage.getFriends().map(function (f) {
                return '<option value="' + f.id + '">' + esc(f.displayName || f.name) + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          histHtml +
          (history.length > 1 ? '<button class="emo-clear-btn" id="emo-clear">'+_T('Clear History')+'</button>' : '') +
        '</div>' +
      '</div>';

    document.getElementById('emo-close').onclick = function () {
      document.getElementById('modal-emotion').classList.remove('active');
    };

    document.getElementById('emo-generate').onclick = function () {
      generateWeather();
    };

    var clearBtn = document.getElementById('emo-clear');
    if (clearBtn) clearBtn.onclick = function () {
      if (confirm(_T('Clear all history?'))) { saveHistory([]); render(); }
    };
  }

  function generateWeather() {
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) { Toast.warn(_T('Set API key first')); return; }

    var friendId = (document.getElementById('emo-friend-sel') || {}).value || '__all__';
    var allMsgs = [];

    if (friendId === '__all__') {
      Storage.getFriends().forEach(function (f) {
        var msgs = Storage.getMessages(f.id);
        msgs.forEach(function (m) {
          if (m.role === 'user' && typeof m.content === 'string' && m.content.indexOf('__PLUGIN__:') !== 0) {
            allMsgs.push(m);
          }
        });
      });
    } else {
      Storage.getMessages(friendId).forEach(function (m) {
        if (m.role === 'user' && typeof m.content === 'string' && m.content.indexOf('__PLUGIN__:') !== 0) {
          allMsgs.push(m);
        }
      });
    }

    allMsgs.sort(function (a, b) { return b.ts - a.ts; });
    var recent = allMsgs.slice(0, 20).map(function (m) { return m.content.slice(0, 80); }).join('\n');

    if (!recent) { Toast.warn(_T('No messages to analyze')); return; }

    showLoading();

    var weatherKeys = Object.keys(WEATHERS).join(', ');
    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, {
      method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{
          role: 'system',
          content: 'Analyze the user\'s recent messages and determine their emotional "weather".\n' +
            'Available weathers: ' + weatherKeys + '\n\n' +
            'Output JSON only:\n' +
            '{"weather":"one of the weather keys","summary":"one sentence mood summary (max 30 chars)","detail":"2-3 sentences about their emotional state, gentle and warm tone"}'
        }, {
          role: 'user',
          content: 'My recent messages:\n' + recent
        }],
        temperature: 0.8, stream: false
      })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      removeLoading();
      var text = ''; try { text = data.choices[0].message.content; } catch (e) {}
      var jm = text.match(/\{[\s\S]*\}/);
      var result = { weather: 'cloudy', summary: '', detail: '', ts: Date.now() };
      if (jm) {
        try {
          var p = JSON.parse(jm[0]);
          result.weather = WEATHERS[p.weather] ? p.weather : 'cloudy';
          result.summary = (p.summary || '').slice(0, 50);
          result.detail = (p.detail || '').slice(0, 200);
        } catch (e) {}
      }
      var h = getHistory();
      h.unshift(result);
      if (h.length > 30) h = h.slice(0, 30);
      saveHistory(h);
      render();
      Toast.success(_T('Weather updated'));
    }).catch(function (e) {
      removeLoading();
      Toast.error('Failed: ' + e.message);
    });
  }

  var loadingOv = null;
  function showLoading() {
    loadingOv = document.createElement('div');
    loadingOv.className = 'inner-modal-overlay';
    loadingOv.innerHTML =
      '<div class="inner-modal" style="max-width:220px;text-align:center;padding:2.5rem 1.5rem">' +
        '<div style="font-size:2.5rem;animation:float 2s ease-in-out infinite">🌤️</div>' +
        '<div style="font-size:0.7rem;color:var(--text-3);margin-top:0.5rem">'+_T('Reading your emotions...')+'</div>' +
      '</div>';
    document.body.appendChild(loadingOv);
  }
  function removeLoading() { if (loadingOv) { loadingOv.remove(); loadingOv = null; } }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'emotion') render();
  });
})();
