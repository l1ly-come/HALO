/**
 * fortune.js — 占卜 v3
 * 六爻 + 塔罗 · 交互式抽取 · AI 解读
 */
(function () {
  'use strict';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(ts) { var d = new Date(ts); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); }

  var _T = window.T || function(k){return k};
  var currentView = 'main';

  function getHistory() { try { return JSON.parse(Storage.get('fortune_history', '[]')); } catch (e) { return []; } }
  function saveHistory(h) { Storage.set('fortune_history', JSON.stringify(h)); }

  /* ═══ 六爻数据 ═══ */
  var TRIGRAMS = [
    { name: '乾', symbol: '\u2630', nature: 'Heaven', lines: [1,1,1] },
    { name: '兑', symbol: '\u2631', nature: 'Lake', lines: [1,1,0] },
    { name: '离', symbol: '\u2632', nature: 'Fire', lines: [1,0,1] },
    { name: '震', symbol: '\u2633', nature: 'Thunder', lines: [1,0,0] },
    { name: '巽', symbol: '\u2634', nature: 'Wind', lines: [0,1,1] },
    { name: '坎', symbol: '\u2635', nature: 'Water', lines: [0,1,0] },
    { name: '艮', symbol: '\u2636', nature: 'Mountain', lines: [0,0,1] },
    { name: '坤', symbol: '\u2637', nature: 'Earth', lines: [0,0,0] }
  ];

  function castHexagram() {
    var lines = [];
    for (var i = 0; i < 6; i++) {
      var coins = Math.floor(Math.random() * 4);
      var type;
      if (coins === 0) type = 'old-yin';
      else if (coins === 3) type = 'old-yang';
      else if (coins === 1 || coins === 2) type = Math.random() > 0.5 ? 'young-yang' : 'young-yin';
      else type = 'young-yang';
      lines.push({
        value: (type === 'young-yang' || type === 'old-yang') ? 1 : 0,
        changing: type === 'old-yin' || type === 'old-yang',
        type: type
      });
    }
    var lower = lines.slice(0, 3).map(function (l) { return l.value; });
    var upper = lines.slice(3, 6).map(function (l) { return l.value; });
    var lowerTri = TRIGRAMS.find(function (t) { return t.lines.join('') === lower.join(''); }) || TRIGRAMS[7];
    var upperTri = TRIGRAMS.find(function (t) { return t.lines.join('') === upper.join(''); }) || TRIGRAMS[0];
    var hasChanging = lines.some(function (l) { return l.changing; });
    return { lines: lines, lower: lowerTri, upper: upperTri, hasChanging: hasChanging };
  }

  /* ═══ 塔罗数据 ═══ */
  var MAJOR_ARCANA = [
    'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
    'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
    'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
    'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
    'Judgement', 'The World'
  ];
  var MINOR_SUITS = ['Wands', 'Cups', 'Swords', 'Pentacles'];
  var MINOR_RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
  var CARD_SYMBOLS = {
    'Wands': '\u2660', 'Cups': '\u2665', 'Swords': '\u2666', 'Pentacles': '\u2663'
  };

  function buildTarotDeck() {
    var deck = [];
    MAJOR_ARCANA.forEach(function (name, i) {
      deck.push({ name: name, type: 'major', number: i, suit: '' });
    });
    MINOR_SUITS.forEach(function (suit) {
      MINOR_RANKS.forEach(function (rank, i) {
        deck.push({ name: rank + ' of ' + suit, type: 'minor', number: i, suit: suit });
      });
    });
    return deck;
  }

  function drawCards(count) {
    var deck = buildTarotDeck();
    var drawn = [];
    for (var i = 0; i < count; i++) {
      var idx = Math.floor(Math.random() * deck.length);
      var card = deck.splice(idx, 1)[0];
      card.reversed = Math.random() < 0.35;
      drawn.push(card);
    }
    return drawn;
  }

  /* ═══ 确认弹窗 ═══ */
  function showConfirmModal(msg, onYes) {
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:260px;text-align:center">' +
        '<div style="font-size:0.82rem;color:var(--text);padding:1.2rem 0.5rem 0.8rem;line-height:1.5">' + esc(msg) + '</div>' +
        '<div style="display:flex;border-top:1px solid var(--border-light)">' +
          '<button id="cf-no" style="flex:1;padding:12px;border:none;background:none;color:var(--text-3);font-size:0.78rem;cursor:pointer">'+_T('Cancel')+'</button>' +
          '<button id="cf-yes" style="flex:1;padding:12px;border:none;background:none;color:var(--text);font-size:0.78rem;font-weight:600;cursor:pointer;border-left:1px solid var(--border-light)">'+_T('Confirm')+'</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('cf-no').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('cf-yes').onclick = function () { ov.remove(); if (onYes) onYes(); };
  }

  /* ═══ 渲染 ═══ */
  function render() {
    var panel = document.getElementById('fortune-panel');
    if (!panel) return;
    if (currentView === 'history') { renderHistory(panel); return; }
    renderMain(panel);
  }

  /* ═══ 主页 ═══ */
  function renderMain(panel) {
    var history = getHistory();
    var lastResult = history.length ? history[0] : null;

    var lastHtml = '';
    if (lastResult) {
      lastHtml =
        '<div class="fort-section-title">'+_T('Last reading')+'</div>' +
        '<div class="fort-last-card" id="fort-last">' +
          '<div class="fort-last-icon">' + (lastResult.icon || '\u2728') + '</div>' +
          '<div class="fort-last-body">' +
            '<div class="fort-last-title">' + esc(lastResult.title || '') + '</div>' +
            '<div class="fort-last-sub">' + esc(lastResult.method === 'yijing' ? 'I Ching' : 'Tarot') + ' \u00b7 ' + fmtDate(lastResult.ts) + '</div>' +
          '</div>' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.2;flex-shrink:0"><path d="M9 18l6-6-6-6"/></svg>' +
        '</div>';
    }

    panel.innerHTML =
      '<div class="fort-app">' +
        '<div class="fort-header">' +
          '<div class="fort-hdr-left"><div class="fort-title">'+_T('Fortune')+'</div><div class="fort-subtitle">' + history.length + ' '+_T('readings')+'</div></div>' +
          '<div class="fort-hdr-right">' +
            '<button class="gal-hdr-btn" id="fort-hist-btn" title="History"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></button>' +
            '<button class="gal-hdr-btn" id="fort-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="fort-body">' +

          /* 两个主入口 */
          '<div class="fort-main-grid">' +

            '<div class="fort-main-card" id="fort-yijing">' +
              '<div class="fort-card-visual fort-yijing-visual">' +
                '<div class="fort-yao"><span></span></div>' +
                '<div class="fort-yao"><span></span><span></span></div>' +
                '<div class="fort-yao"><span></span></div>' +
                '<div class="fort-yao"><span></span><span></span></div>' +
                '<div class="fort-yao"><span></span></div>' +
                '<div class="fort-yao"><span></span></div>' +
              '</div>' +
              '<div class="fort-card-info">' +
                '<div class="fort-card-name">'+_T('I Ching')+'</div>' +
                '<div class="fort-card-name-sub">六爻占卜</div>' +
                '<div class="fort-card-desc">'+_T('Cast hexagram with three coins')+'</div>' +
              '</div>' +
            '</div>' +

            '<div class="fort-main-card" id="fort-tarot">' +
              '<div class="fort-card-visual fort-tarot-visual">' +
                '<div class="fort-tarot-stack">' +
                  '<div class="fort-tarot-c fort-tarot-c1"></div>' +
                  '<div class="fort-tarot-c fort-tarot-c2"></div>' +
                  '<div class="fort-tarot-c fort-tarot-c3"></div>' +
                '</div>' +
              '</div>' +
              '<div class="fort-card-info">' +
                '<div class="fort-card-name">'+_T('Tarot')+'</div>' +
                '<div class="fort-card-name-sub">塔罗牌</div>' +
                '<div class="fort-card-desc">'+_T('Draw cards from 78-card deck')+'</div>' +
              '</div>' +
            '</div>' +

          '</div>' +

          lastHtml +

        '</div>' +
      '</div>';

    document.getElementById('fort-close').onclick = function () { document.getElementById('modal-fortune').classList.remove('active'); };
    document.getElementById('fort-hist-btn').onclick = function () { currentView = 'history'; render(); };
    document.getElementById('fort-yijing').onclick = function () { showQuestionModal('yijing'); };
    document.getElementById('fort-tarot').onclick = function () { showQuestionModal('tarot'); };

    var lastEl = document.getElementById('fort-last');
    if (lastEl && lastResult) lastEl.onclick = function () { showResult(lastResult); };
  }

  /* ═══ 提问弹窗 ═══ */
  function showQuestionModal(method) {
    var title = method === 'yijing' ? 'I Ching · 六爻' : 'Tarot · 塔罗';
    var placeholder = method === 'yijing'
      ? _T('Focus your mind, ask one question...')
      : _T('What guidance do you seek...');

    var extraHtml = '';
    if (method === 'tarot') {
      extraHtml =
        '<div class="settings-item" style="margin-top:0.3rem">' +
          '<label class="settings-label">'+_T('Spread')+'</label>' +
          '<div class="fort-spread-grid">' +
            '<div class="fort-spread-opt fort-spread-active" data-count="1"><div class="fort-spread-num">1</div><div class="fort-spread-label">'+_T('Single')+'</div></div>' +
            '<div class="fort-spread-opt" data-count="3"><div class="fort-spread-num">3</div><div class="fort-spread-label">'+_T('Past · Now · Future')+'</div></div>' +
            '<div class="fort-spread-opt" data-count="5"><div class="fort-spread-num">5</div><div class="fort-spread-label">'+_T('Celtic Cross')+'</div></div>' +
          '</div>' +
        '</div>';
    }

    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:320px">' +
        '<div class="modal-header"><span class="modal-title">' + title + '</span>' +
          '<button class="modal-close" id="fq-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<div class="settings-item">' +
          '<label class="settings-label">'+_T('Your question')+'</label>' +
          '<textarea class="s-input" id="fq-text" rows="3" style="min-height:3.5rem;resize:vertical" placeholder="' + placeholder + '"></textarea>' +
        '</div>' +
        extraHtml +
        '<button class="s-btn fort-divine-btn" id="fq-go" style="width:100%;margin-top:0.4rem">' +
          (method === 'yijing' ? _T('Cast Coins') : _T('Draw Cards')) +
        '</button>' +
      '</div>';
    document.body.appendChild(ov);

    document.getElementById('fq-close').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };

    /* 塔罗 spread 选择 */
    var spreadCount = 1;
    var spreadGrid = ov.querySelector('.fort-spread-grid');
    if (spreadGrid) {
      spreadGrid.addEventListener('click', function (e) {
        var opt = e.target.closest('.fort-spread-opt');
        if (!opt) return;
        spreadGrid.querySelectorAll('.fort-spread-opt').forEach(function (o) { o.classList.remove('fort-spread-active'); });
        opt.classList.add('fort-spread-active');
        spreadCount = parseInt(opt.dataset.count, 10);
      });
    }

    document.getElementById('fq-go').onclick = function () {
      var question = (document.getElementById('fq-text').value || '').trim();
      if (!question) { Toast.warn(_T('Enter your question')); return; }
      ov.remove();
      if (method === 'yijing') { startYijing(question); }
      else { startTarot(question, spreadCount); }
    };
  }

  /* ═══ 六爻 — 起卦动画 ═══ */
  function startYijing(question) {
    var hex = castHexagram();

    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal fort-cast-modal" style="max-width:300px;text-align:center;padding:2rem 1.5rem">' +
        '<div class="fort-cast-title">'+_T('Casting hexagram...')+'</div>' +
        '<div class="fort-hex-display" id="fort-hex-lines"></div>' +
        '<div class="fort-cast-sub" id="fort-cast-status">'+_T('Throwing coins...')+'</div>' +
      '</div>';
    document.body.appendChild(ov);

    var container = document.getElementById('fort-hex-lines');
    var status = document.getElementById('fort-cast-status');
    var lineIdx = 0;

    function showNextLine() {
      if (lineIdx >= 6) {
        status.textContent = hex.upper.name + ' over ' + hex.lower.name;
        setTimeout(function () {
          ov.remove();
          aiInterpretYijing(question, hex);
        }, 800);
        return;
      }
      var line = hex.lines[lineIdx];
      var lineEl = document.createElement('div');
      lineEl.className = 'fort-hex-line fort-hex-anim';
      if (line.value === 1) {
        lineEl.innerHTML = '<div class="fort-yang-line"></div>';
      } else {
        lineEl.innerHTML = '<div class="fort-yin-line"><span></span><span></span></div>';
      }
      if (line.changing) lineEl.classList.add('fort-hex-changing');
      container.insertBefore(lineEl, container.firstChild);
      status.textContent = 'Line ' + (lineIdx + 1) + ' of 6' + (line.changing ? ' (changing)' : '');
      lineIdx++;
      setTimeout(showNextLine, 400);
    }

    setTimeout(showNextLine, 600);
  }

  /* ═══ 塔罗 — 抽牌动画 ═══ */
  function startTarot(question, count) {
    var cards = drawCards(count);
    var posNames = count === 1 ? ['Guidance'] : count === 3 ? ['Past', 'Present', 'Future'] : ['Situation', 'Challenge', 'Foundation', 'Near Future', 'Outcome'];

    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal fort-draw-modal" style="max-width:340px;padding:1.5rem">' +
        '<div class="fort-draw-title">'+_T('Drawing cards...')+'</div>' +
        '<div class="fort-drawn-cards" id="fort-drawn"></div>' +
        '<div class="fort-draw-status" id="fort-draw-status">'+_T('Shuffling deck...')+'</div>' +
      '</div>';
    document.body.appendChild(ov);

    var container = document.getElementById('fort-drawn');
    var status = document.getElementById('fort-draw-status');
    var cardIdx = 0;

    function showNextCard() {
      if (cardIdx >= cards.length) {
        status.textContent = cards.length + ' card' + (cards.length > 1 ? 's' : '') + ' drawn';
        setTimeout(function () {
          ov.remove();
          aiInterpretTarot(question, cards, posNames);
        }, 800);
        return;
      }
      var card = cards[cardIdx];
      var pos = posNames[cardIdx] || '';
      var isMajor = card.type === 'major';
      var suitSymbol = CARD_SYMBOLS[card.suit] || '';

      var cardEl = document.createElement('div');
      cardEl.className = 'fort-tarot-drawn fort-tarot-flip';
      cardEl.innerHTML =
        '<div class="fort-tarot-face' + (card.reversed ? ' fort-tarot-reversed' : '') + '">' +
          '<div class="fort-tarot-rank">' + (isMajor ? romanize(card.number) : suitSymbol) + '</div>' +
          '<div class="fort-tarot-name">' + esc(card.name) + '</div>' +
          (card.reversed ? '<div class="fort-tarot-rev-tag">Reversed</div>' : '') +
        '</div>' +
        '<div class="fort-tarot-pos">' + esc(pos) + '</div>';
      container.appendChild(cardEl);

      status.textContent = 'Card ' + (cardIdx + 1) + ': ' + card.name + (card.reversed ? ' (R)' : '');
      cardIdx++;
      setTimeout(showNextCard, 500);
    }

    setTimeout(showNextCard, 700);
  }

  function romanize(n) {
    var nums = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
    return nums[n] || String(n);
  }

  /* ═══ AI 解读 — 六爻 ═══ */
  function aiInterpretYijing(question, hex) {
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) { Toast.warn(_T('Set API key first')); return; }

    var linesDesc = hex.lines.map(function (l, i) {
      return 'Line ' + (i + 1) + ': ' + (l.value ? 'Yang' : 'Yin') + (l.changing ? ' (changing)' : '');
    }).join(', ');

    showLoadingModal(_T('Interpreting hexagram...'));

    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, {
      method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{
          role: 'system',
          content: 'You are a master I Ching (六爻) diviner. The user cast a hexagram.\n' +
            'Upper trigram: ' + hex.upper.name + ' (' + hex.upper.nature + ')\n' +
            'Lower trigram: ' + hex.lower.name + ' (' + hex.lower.nature + ')\n' +
            'Lines (bottom to top): ' + linesDesc + '\n' +
            'Has changing lines: ' + hex.hasChanging + '\n\n' +
            'Output JSON: {"title":"hexagram name (Chinese + English)","icon":"one emoji","level":"fortune level","content":"interpretation 150-200 chars, relate to the question","advice":"practical advice 1-2 sentences","changing":"if changing lines exist, explain transformation"}'
        }, {
          role: 'user', content: 'Question: ' + question
        }],
        temperature: 0.9, stream: false
      })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      removeLoadingModal();
      var text = ''; try { text = data.choices[0].message.content; } catch (e) {}
      var result = parseResult(text, 'yijing', question, hex);
      saveToHistory(result);
      showResult(result);
    }).catch(function (e) { removeLoadingModal(); Toast.error('Failed: ' + e.message); });
  }

  /* ═══ AI 解读 — 塔罗 ═══ */
  function aiInterpretTarot(question, cards, posNames) {
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) { Toast.warn(_T('Set API key first')); return; }

    var cardsDesc = cards.map(function (c, i) {
      return (posNames[i] || 'Card ' + (i + 1)) + ': ' + c.name + (c.reversed ? ' (Reversed)' : ' (Upright)');
    }).join('\n');

    showLoadingModal(_T('Reading the cards...'));

    var built = window.buildApiUrl('/chat/completions');
    fetch(built.url, {
      method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [{
          role: 'system',
          content: 'You are a skilled tarot reader. Cards drawn:\n' + cardsDesc + '\n\n' +
            'Output JSON: {"title":"reading title","icon":"one emoji","level":"outlook (e.g. Promising, Complex, Challenging)","content":"interpretation 150-250 chars, address each card position and relate to question","advice":"practical guidance 1-2 sentences","cards_brief":"one-line summary per card, separated by |"}'
        }, {
          role: 'user', content: 'Question: ' + question
        }],
        temperature: 0.9, stream: false
      })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      removeLoadingModal();
      var text = ''; try { text = data.choices[0].message.content; } catch (e) {}
      var result = parseResult(text, 'tarot', question);
      result.cards = cards;
      result.posNames = posNames;
      saveToHistory(result);
      showResult(result);
    }).catch(function (e) { removeLoadingModal(); Toast.error('Failed: ' + e.message); });
  }

  function parseResult(text, method, question, hex) {
    var result = { method: method, question: question, ts: Date.now(), title: method === 'yijing' ? 'Hexagram' : 'Reading', icon: '\u2728', level: '', content: text.slice(0, 200), advice: '', changing: '' };
    if (hex) { result.hexUpper = hex.upper.name; result.hexLower = hex.lower.name; result.lines = hex.lines; }
    var jm = text.match(/\{[\s\S]*\}/);
    if (jm) {
      try {
        var p = JSON.parse(jm[0]);
        result.title = p.title || result.title;
        result.icon = p.icon || result.icon;
        result.level = p.level || '';
        result.content = p.content || result.content;
        result.advice = p.advice || '';
        result.changing = p.changing || '';
        result.cardsBrief = p.cards_brief || '';
      } catch (e) {}
    }
    return result;
  }

  function saveToHistory(result) {
    var h = getHistory(); h.unshift(result);
    if (h.length > 30) h = h.slice(0, 30);
    saveHistory(h);
  }

  /* ═══ Loading ═══ */
  var loadingOv = null;
  function showLoadingModal(msg) {
    loadingOv = document.createElement('div');
    loadingOv.className = 'inner-modal-overlay';
    loadingOv.innerHTML =
      '<div class="inner-modal" style="max-width:260px;text-align:center;padding:2.5rem 1.5rem">' +
        '<div class="fort-loading-orb"><div class="fort-orb-inner"></div></div>' +
        '<div style="font-size:0.72rem;color:var(--text-3);margin-top:0.5rem">' + esc(msg) + '</div>' +
      '</div>';
    document.body.appendChild(loadingOv);
  }
  function removeLoadingModal() { if (loadingOv) { loadingOv.remove(); loadingOv = null; } }

  /* ═══ 结果展示 ═══ */
  function showResult(result) {
    var levelColors = {
      'Great Luck': '#8BC4A0', 'Promising': '#8BC4A0', 'Good': '#A0C4B8',
      'Moderate': '#B8B8B8', 'Complex': '#C4B8A0', 'Challenging': '#D4A0A0',
      'Caution': '#D4A0A0', '大吉': '#8BC4A0', '吉': '#A0C4B8', '凶': '#D4A0A0'
    };
    var levelColor = '#B8B8B8';
    Object.keys(levelColors).forEach(function (k) {
      if (result.level && result.level.indexOf(k) >= 0) levelColor = levelColors[k];
    });

    /* 卦象显示 */
    var hexHtml = '';
    if (result.method === 'yijing' && result.lines) {
      hexHtml = '<div class="fort-res-hex">';
      for (var i = 5; i >= 0; i--) {
        var l = result.lines[i];
        if (l.value === 1) hexHtml += '<div class="fort-res-yang' + (l.changing ? ' fort-res-changing' : '') + '"></div>';
        else hexHtml += '<div class="fort-res-yin' + (l.changing ? ' fort-res-changing' : '') + '"><span></span><span></span></div>';
      }
      hexHtml += '</div>';
    }

    /* 牌面显示 */
    var cardsHtml = '';
    if (result.method === 'tarot' && result.cards) {
      cardsHtml = '<div class="fort-res-cards">' +
        result.cards.map(function (c, i) {
          var pos = result.posNames && result.posNames[i] ? result.posNames[i] : '';
          return '<div class="fort-res-card-item">' +
            '<div class="fort-res-card-face' + (c.reversed ? ' fort-res-card-rev' : '') + '">' +
              '<div class="fort-res-card-num">' + (c.type === 'major' ? romanize(c.number) : (CARD_SYMBOLS[c.suit] || '')) + '</div>' +
            '</div>' +
            '<div class="fort-res-card-label">' + esc(c.name) + (c.reversed ? ' (R)' : '') + '</div>' +
            (pos ? '<div class="fort-res-card-pos">' + esc(pos) + '</div>' : '') +
          '</div>';
        }).join('') +
      '</div>';
    }

    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal fort-result" style="max-width:320px;padding:0;overflow:hidden">' +
        '<div class="fort-result-top" style="background:' + levelColor + '">' +
          '<div class="fort-result-icon">' + (result.icon || '\u2728') + '</div>' +
          '<div class="fort-result-title">' + esc(result.title) + '</div>' +
          (result.level ? '<div class="fort-result-level">' + esc(result.level) + '</div>' : '') +
        '</div>' +
        '<div class="fort-result-body">' +
          hexHtml + cardsHtml +
          '<div class="fort-result-content">' + esc(result.content) + '</div>' +
          (result.changing ? '<div class="fort-result-changing"><span class="fort-advice-dot" style="background:#D4A0A0"></span>' + esc(result.changing) + '</div>' : '') +
          (result.advice ? '<div class="fort-result-advice"><span class="fort-advice-dot"></span>' + esc(result.advice) + '</div>' : '') +
          (result.question ? '<div class="fort-result-question">Q: ' + esc(result.question) + '</div>' : '') +
        '</div>' +
        '<div class="fort-result-actions">' +
          '<button class="fort-result-btn" id="fr-close">'+_T('Close')+'</button>' +
          '<button class="fort-result-btn fort-result-btn-primary" id="fr-again">'+_T('Again')+'</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById('fr-close').onclick = function () { ov.remove(); render(); };
    document.getElementById('fr-again').onclick = function () {
      ov.remove();
      showQuestionModal(result.method);
    };
  }

  /* ═══ 历史 ═══ */
  function renderHistory(panel) {
    var history = getHistory();
    var listHtml = history.length ? history.map(function (h, i) {
      return '<div class="fort-hist-item" data-idx="' + i + '">' +
        '<div class="fort-hist-icon">' + (h.icon || '\u2728') + '</div>' +
        '<div class="fort-hist-info"><div class="fort-hist-title">' + esc(h.title || '') + '</div>' +
        '<div class="fort-hist-sub">' + esc(h.method === 'yijing' ? 'I Ching' : 'Tarot') + ' \u00b7 ' + esc(h.level || '') + '</div></div>' +
        '<div class="fort-hist-date">' + fmtDate(h.ts) + '</div></div>';
    }).join('') : '<div class="gal-empty" style="padding:2rem"><div class="gal-empty-text">'+_T('No readings yet')+'</div></div>';

    panel.innerHTML =
      '<div class="fort-app"><div class="fort-header"><div class="fort-hdr-left">' +
      '<button class="gal-back-btn" id="fh-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<div><div class="fort-title">'+_T('History')+'</div><div class="fort-subtitle">' + history.length + ' '+_T('readings')+'</div></div></div>' +
      (history.length ? '<button class="gal-hdr-btn" id="fh-clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>' : '') +
      '</div><div class="fort-body"><div class="fort-hist-list">' + listHtml + '</div></div></div>';

    document.getElementById('fh-back').onclick = function () { currentView = 'main'; render(); };
    var cb = document.getElementById('fh-clear');
    if (cb) cb.onclick = function () { showConfirmModal(_T('Clear all history?'), function () { saveHistory([]); renderHistory(panel); }); };
    panel.querySelector('.fort-hist-list').addEventListener('click', function (e) {
      var item = e.target.closest('.fort-hist-item');
      if (!item) return;
      var h = getHistory()[parseInt(item.dataset.idx, 10)];
      if (h) showResult(h);
    });
  }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'fortune') { currentView = 'main'; render(); }
  });
})();
