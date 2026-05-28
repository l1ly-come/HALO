/**
 * memory.js — 记忆摘要系统（修复版）
 */
(function () {
  'use strict';

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderMemoryPanel() {
    var c = document.getElementById('memory-content');
    if (!c) return;
    var friends = Storage.getFriends();
    var cardsHtml = '';
    if (!friends.length) {
      cardsHtml = '<div class="tab-empty" style="padding:1rem"><p>暂无好友</p></div>';
    } else {
      cardsHtml = friends.map(function (f) {
        var summary = Storage.getMemorySummary(f.id);
        var preview = summary ? summary.slice(0, 60) + (summary.length > 60 ? '…' : '') : '暂无记忆摘要';
        var name = f.displayName || f.name || '未命名';
        return '<div class="wb-card" style="flex-direction:column;align-items:stretch;gap:0.4rem">' +
          '<div style="display:flex;align-items:center;gap:0.5rem">' +
            '<img class="friend-avatar" src="' + esc(f.avatar) + '" ' +
                 'style="width:2rem;height:2rem" ' +
                 'onerror="this.src=\'https://api.dicebear.com/7.x/bottts/svg?seed=' + f.id + '\'" />' +
            '<span style="font-weight:700;font-size:0.82rem;flex:1">' + esc(name) + '</span>' +
            '<button class="btn-secondary btn-gen-memory" data-fid="' + f.id + '" style="font-size:0.68rem;padding:0.25rem 0.6rem">🧠 生成</button>' +
          '</div>' +
          '<div style="font-size:0.72rem;color:var(--text-2);line-height:1.5" class="memory-preview" data-fid="' + f.id + '">' +
            esc(preview) +
          '</div>' +
          '<div style="display:flex;gap:0.3rem;justify-content:flex-end">' +
            '<button class="btn-secondary btn-edit-memory" data-fid="' + f.id + '" style="font-size:0.65rem;padding:0.2rem 0.5rem">编辑</button>' +
            '<button class="btn-secondary btn-clear-memory" data-fid="' + f.id + '" style="font-size:0.65rem;padding:0.2rem 0.5rem;color:var(--error)">清空</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    c.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:0.5rem;padding:0.5rem">' +
        '<div style="font-size:0.78rem;font-weight:700;color:var(--accent)">🧠 记忆摘要管理</div>' +
        '<div style="font-size:0.68rem;color:var(--text-2);line-height:1.5;margin-bottom:0.3rem">' +
          '记忆摘要注入 AI 系统提示词，帮助 AI 记住关键信息。' +
        '</div>' +
        cardsHtml +
      '</div>';

    c.addEventListener('click', function (e) {
      var genBtn = e.target.closest('.btn-gen-memory');
      var editBtn = e.target.closest('.btn-edit-memory');
      var clearBtn = e.target.closest('.btn-clear-memory');
      if (genBtn) { e.stopPropagation(); generateMemorySummary(genBtn.dataset.fid, genBtn); }
      else if (editBtn) { e.stopPropagation(); showEditMemoryModal(editBtn.dataset.fid); }
      else if (clearBtn) {
        e.stopPropagation();
        if (confirm('确定清空？')) {
          Storage.setMemorySummary(clearBtn.dataset.fid, '');
          Toast.success('已清空');
          renderMemoryPanel();
        }
      }
    });
  }

  function generateMemorySummary(friendId, btn) {
    var apiKey = Storage.get('apiKey', '');
    if (!apiKey) { Toast.warn('请先配置 API Key'); return; }
    var messages = Storage.getMessages(friendId);
    if (messages.length < 3) { Toast.warn('对话太少，至少 3 条'); return; }

    var chatHistory = messages.slice(-30).filter(function (m) {
      return !(m.role === 'user' && typeof m.content === 'string' && m.content.indexOf('__PLUGIN__:') === 0);
    }).map(function (m) {
      return (m.role === 'user' ? '用户' : 'AI') + '：' + m.content;
    }).join('\n');

    var existingSummary = Storage.getMemorySummary(friendId);
    var summaryHint = existingSummary ? '\n\n旧摘要：\n' + existingSummary : '';
    var prompt = '阅读聊天记录，提取关键信息生成简洁记忆摘要（200字内）。包含用户信息、情感事件、约定、生活细节。' +
      summaryHint + '\n\n--- 聊天记录 ---\n' + chatHistory;

    var built = window.buildApiUrl('/chat/completions');
    if (btn) { btn.textContent = '⏳…'; btn.disabled = true; }

    fetch(built.url, {
      method: 'POST', headers: built.headers,
      body: JSON.stringify({
        model: Storage.get('modelName', 'gpt-3.5-turbo'),
        messages: [
          { role: 'system', content: '你是记忆管理助手，擅长提炼关键信息。' },
          { role: 'user', content: prompt }
        ], temperature: 0.3, stream: false
      })
    })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var summary = '';
      try { summary = data.choices[0].message.content; } catch (e) {}
      if (summary) {
        Storage.setMemorySummary(friendId, summary.trim());
        Toast.success('摘要已生成');
        renderMemoryPanel();
      } else { Toast.error('生成失败'); }
    })
    .catch(function (e) { Toast.error('失败：' + e.message); })
    .finally(function () { if (btn) { btn.textContent = '🧠 生成'; btn.disabled = false; } });
  }

  function showEditMemoryModal(friendId) {
    var summary = Storage.getMemorySummary(friendId);
    var friend = Storage.getFriends().find(function (f) { return f.id === friendId; });
    var name = friend ? (friend.displayName || friend.name || '好友') : '好友';

    var overlay = document.createElement('div');
    overlay.className = 'inner-modal-overlay';
    overlay.innerHTML =
      '<div class="inner-modal">' +
        '<div class="modal-header"><span class="modal-title">编辑「' + esc(name) + '」的记忆</span>' +
          '<button class="modal-close" id="mem-close">✕</button></div>' +
        '<div class="settings-item">' +
          '<label class="settings-label">记忆摘要</label>' +
          '<textarea id="mem-content" class="s-input" rows="8" style="min-height:10rem;resize:vertical" placeholder="写下希望 AI 记住的信息…">' +
            esc(summary) + '</textarea>' +
        '</div>' +
        '<button class="btn-primary" id="mem-save" style="width:100%">保存</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('mem-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.getElementById('mem-save').addEventListener('click', function () {
      Storage.setMemorySummary(friendId, (document.getElementById('mem-content').value || '').trim());
      overlay.remove();
      Toast.success('已保存');
      renderMemoryPanel();
    });
  }

  function getMemoryForPrompt(friendId) {
    var summary = Storage.getMemorySummary(friendId);
    if (!summary) return '';
    return '\n\n## 记忆摘要\n' + summary;
  }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'memory') renderMemoryPanel();
  });

  window.Memory = {
    render: renderMemoryPanel,
    getForPrompt: getMemoryForPrompt,
    generateSummary: generateMemorySummary
  };
})();
