/**
 * affinity.js — 好感度与解锁系统
 * 零侵入：不修改 chat.js
 */
(function () {
  'use strict';

  var LEVELS = [
    { key: 'stranger',  name: '初识',  min: 0,    desc: '刚加上好友，还不太熟' },
    { key: 'familiar',  name: '熟悉',  min: 50,   desc: '开始有日常的寒暄了' },
    { key: 'close',     name: '亲近',  min: 200,  desc: '聊得越来越多了' },
    { key: 'intimate',  name: '亲密',  min: 500,  desc: '会分享心事的关系' },
    { key: 'soulmate',  name: '挚友',  min: 1000, desc: '无话不说' }
  ];

  function getData(fid) {
    try { return JSON.parse(Storage.get('affinity_' + fid, '{}')) || {}; } catch (e) { return {}; }
  }
  function saveData(fid, d) { Storage.set('affinity_' + fid, JSON.stringify(d)); }

  function isEnabled(fid) {
    var f = Storage.getFriends().find(function (x) { return x.id === fid; });
    return f && f.affinityEnabled === true;
  }

  function getScore(fid) {
    if (!isEnabled(fid)) return 9999; // 未开启 = 全解锁
    var d = getData(fid);
    return d.score || 0;
  }

  function getLevel(fid) {
    var score = getScore(fid);
    var level = LEVELS[0];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (score >= LEVELS[i].min) { level = LEVELS[i]; break; }
    }
    return level;
  }

  function addScore(fid, pts) {
    if (!isEnabled(fid)) return;
    var d = getData(fid);
    var oldScore = d.score || 0;
    var oldLevel = getLevelByScore(oldScore);
    d.score = oldScore + pts;
    d.lastActive = Date.now();
    saveData(fid, d);
    var newLevel = getLevelByScore(d.score);
    if (newLevel.key !== oldLevel.key && LEVELS.indexOf(newLevel) > LEVELS.indexOf(oldLevel)) {
      // 阶段提升 — 插入系统消息
      Storage.appendMessage(fid, {
        role: 'model',
        content: '💫 ' + newLevel.desc,
        ts: Date.now(),
        type: 'status',
        statusType: 'viewed',
        statusText: newLevel.name + ' · ' + newLevel.desc
      });
    }
  }

  function getLevelByScore(score) {
    var level = LEVELS[0];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (score >= LEVELS[i].min) { level = LEVELS[i]; break; }
    }
    return level;
  }

  // ── 每日签到 ──
  function checkDailyBonus(fid) {
    if (!isEnabled(fid)) return;
    var d = getData(fid);
    var today = new Date().toDateString();
    if (d.lastVisitDay === today) return;
    d.lastVisitDay = today;
    // 连续天数
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.lastVisitDate === yesterday.toDateString()) {
      d.streak = (d.streak || 0) + 1;
    } else {
      d.streak = 1;
    }
    d.lastVisitDate = today;
    saveData(fid, d);
    addScore(fid, 3); // 每日首次 +3
    if (d.streak === 7) addScore(fid, 10);
    if (d.streak === 30) addScore(fid, 30);
  }

  // ── 衰减 ──
  function checkDecay(fid) {
    if (!isEnabled(fid)) return;
    var d = getData(fid);
    if (!d.lastActive) return;
    var days = Math.floor((Date.now() - d.lastActive) / 86400000);
    if (days >= 3 && !d._decayed) {
      var decay = Math.floor(days / 3) * 5;
      var prevLevel = getLevelByScore(d.score || 0);
      d.score = Math.max(prevLevel.min, (d.score || 0) - decay);
      d._decayed = true;
      saveData(fid, d);
    }
    if (days < 3) {
      d._decayed = false;
      saveData(fid, d);
    }
  }

  // ── 自动计分（监听消息） ──
  var _origAppend = Storage.appendMessage;
  Storage.appendMessage = function (cid, m) {
    _origAppend.call(Storage, cid, m);
    if (!m) return;
    if (m.role === 'user' && m.type !== 'status') addScore(cid, 1);
    if (m.role === 'model' && m.type !== 'status') addScore(cid, 1);
    if (m.type === 'transfer' || m.type === 'delivery' || m.type === 'gift') addScore(cid, 3);
    if (m.type === 'call') addScore(cid, 5);
  };

  // ── 注入 prompt ──
  var _origBuildApi = window.buildApiUrl;
  // 通过 hook buildPromptMessages 不现实（在 IIFE 里），改用全局 prompt 注入
  // 在 prompts.js 的 CORE_PROMPT 后面追加
  

  // ── 为 settings.js 的 buildUrl 提供好感度上下文 ──
  // chat.js 的 buildPromptMessages 会 replace ${affinityContext}
  // 但它在 IIFE 里我们碰不到，所以换个方式：
  // 直接在 CORE_PROMPT 模板变量列表里加
  // 实际上更简单的方式：hook fetch
  var _origFetch = window.fetch;
  window.fetch = function () {
    var args = arguments;
    if (args[1] && args[1].body && typeof args[1].body === 'string') {
      try {
        var body = JSON.parse(args[1].body);
        if (body.messages && body.messages[0] && body.messages[0].role === 'system') {
          // 找当前好友
          var nameEl = document.querySelector('.conv-name');
          if (nameEl) {
            var name = nameEl.textContent.trim();
            var friend = Storage.getFriends().find(function (f) {
              return (f.displayName || f.name || '') === name || (f.realName || '') === name;
            });
            if (friend && isEnabled(friend.id)) {
              var level = getLevel(friend.id);
              var injection = '\n\n## Relationship Level: ' + level.name +
                '\nYou and the user are at "' + level.name + '" level (' + level.desc + ').' +
                '\nAdjust your tone naturally:';
              if (level.key === 'stranger') injection += '\n- Be polite but slightly reserved';
              else if (level.key === 'familiar') injection += '\n- Be friendly and casual';
              else if (level.key === 'close') injection += '\n- Be warm, share things proactively';
              else if (level.key === 'intimate') injection += '\n- Be very comfortable, share feelings, use pet names';
              else if (level.key === 'soulmate') injection += '\n- Be completely open, deeply connected, use intimate language';
              body.messages[0].content += injection;
              args[1].body = JSON.stringify(body);
            }
          }
        }
      } catch (e) {}
    }
    return _origFetch.apply(this, args);
  };

  // ── 注入到好友编辑表单 ──
  document.addEventListener('click', function (e) {
    // 检测编辑/添加好友按钮被点击
    if (e.target.closest('.btn-edit-friend') || e.target.closest('#btn-add-friend')) {
      setTimeout(injectToggle, 200);
    }
  });

  function injectToggle() {
    var saveBtn = document.getElementById('ff-save');
    if (!saveBtn || document.getElementById('ff-affinity-toggle')) return;

    // 获取当前好友
    var avatarInput = document.getElementById('ff-avatar');
    var currentFid = null;
    Storage.getFriends().forEach(function (f) {
      if (avatarInput && avatarInput.value === f.avatar) currentFid = f.id;
    });
    var currentEnabled = currentFid ? isEnabled(currentFid) : false;

    var wrapper = document.createElement('div');
    wrapper.className = 'settings-item s-row';
    wrapper.style.marginTop = '0.2rem';
    wrapper.innerHTML =
      '<label class="settings-label">Affinity Mode</label>' +
      '<div class="dark-mode-toggle' + (currentEnabled ? ' active' : '') + '" id="ff-affinity-toggle"></div>';
    saveBtn.parentElement.insertBefore(wrapper, saveBtn);

    document.getElementById('ff-affinity-toggle').addEventListener('click', function () {
      this.classList.toggle('active');
    });

    // Hook save 按钮
    var origClick = saveBtn.onclick;
    saveBtn.addEventListener('click', function () {
      var toggle = document.getElementById('ff-affinity-toggle');
      var enabled = toggle && toggle.classList.contains('active');
      // 延迟保存，等原始 save 先执行
      setTimeout(function () {
        var displayName = (document.getElementById('ff-display') || {}).value;
        if (!displayName) return;
        var friends = Storage.getFriends();
        var f = friends.find(function (x) {
          return (x.displayName || x.name || '') === displayName.trim();
        });
        if (f) {
          f.affinityEnabled = enabled;
          Storage.upsertFriend(f);
        }
      }, 100);
    });
  }

  // ── 注入到 conv-more 面板 ──
  document.addEventListener('click', function (e) {
    if (e.target.closest('#conv-more')) {
      setTimeout(injectMoreInfo, 300);
    }
  });

  function injectMoreInfo() {
    var morePanel = document.querySelector('.conv-more-inner');
    if (!morePanel || document.getElementById('affinity-info')) return;

    var nameEl = document.querySelector('.conv-name');
    if (!nameEl) return;
    var name = nameEl.textContent.trim();
    var friend = Storage.getFriends().find(function (f) {
      return (f.displayName || f.name || '') === name;
    });
    if (!friend || !isEnabled(friend.id)) return;

    checkDecay(friend.id);
    var level = getLevel(friend.id);
    var d = getData(friend.id);

    var info = document.createElement('div');
    info.id = 'affinity-info';
    info.style.cssText = 'padding:0.5rem 0.6rem;margin-bottom:0.3rem;background:rgba(0,0,0,0.02);border-radius:12px;display:flex;align-items:center;gap:0.5rem';
    info.innerHTML =
      '<div style="font-size:1.2rem">✦</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:0.75rem;font-weight:600;color:var(--text)">' + level.name + '</div>' +
        '<div style="font-size:0.55rem;color:var(--text-3)">' + level.desc +
          (d.streak > 1 ? ' · ' + d.streak + ' days streak' : '') +
        '</div>' +
      '</div>';

    var firstSection = morePanel.querySelector('.more-section-title');
    if (firstSection) morePanel.insertBefore(info, firstSection);
  }

  // ── 打开对话时检查签到 ──
  document.addEventListener('click', function (e) {
    var row = e.target.closest('.friend-row[data-cid]');
    if (row) {
      var fid = row.dataset.cid;
      setTimeout(function () {
        checkDailyBonus(fid);
        checkDecay(fid);
      }, 500);
    }
  });

  // ── 暴露 API ──
  window.Affinity = {
    getLevel: getLevel,
    getScore: getScore,
    isEnabled: isEnabled,
    addScore: addScore,
    getData: getData,
    LEVELS: LEVELS
  };
})();
