/**
 * sticker-batch.js — 表情包批量导入
 * 在贴纸管理器打开时自动注入 "Batch Import" 按钮
 */
(function () {
  'use strict';

  function injectBatchBtn() {
    var createBtn = document.getElementById('sm-create');
    if (!createBtn || document.getElementById('sm-batch')) return;

    var batchBtn = document.createElement('button');
    batchBtn.id = 'sm-batch';
    batchBtn.className = 's-btn';
    batchBtn.textContent = 'Batch Import';
    batchBtn.style.cssText = 'margin-top:0.3rem;width:100%;font-size:0.72rem;background:var(--primary);border:none;color:#fff';

    createBtn.parentElement.after(batchBtn);

    batchBtn.addEventListener('click', function () {
      showBatchModal();
    });
  }

  function showBatchModal() {
    // 找到当前选中的 group
    var groups = Storage.getStickerGroups();
    if (!groups.length) { Toast.warn('Create a group first'); return; }

    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal" style="max-width:380px">' +
        '<div class="modal-header">' +
          '<span class="modal-title">Batch Import</span>' +
          '<button class="modal-close" id="bi-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<div class="settings-item">' +
          '<label class="settings-label">Target Group</label>' +
          '<select id="bi-group" class="s-select">' +
            groups.map(function (g) {
              return '<option value="' + g.id + '">' + (g.name || 'Unnamed') + ' (' + (g.stickers || []).length + ')</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="settings-item">' +
          '<label class="settings-label">Format: one per line<br><code style="font-size:0.6rem;color:var(--text-3)">URL | description</code></label>' +
          '<textarea id="bi-text" class="s-input" rows="8" style="min-height:8rem;resize:vertical;font-family:monospace;font-size:0.68rem" placeholder="https://example.com/sticker1.png | happy face\nhttps://example.com/sticker2.png | sad face\nhttps://example.com/sticker3.png"></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:0.25rem">' +
          '<button class="s-btn" id="bi-import" style="flex:1">Import</button>' +
          '<button class="s-btn s-btn-outline" id="bi-preview" style="flex:1">Preview</button>' +
        '</div>' +
        '<div id="bi-result" style="margin-top:0.3rem;font-size:0.68rem;color:var(--text-2)"></div>' +
      '</div>';

    document.body.appendChild(ov);

    document.getElementById('bi-close').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });

    document.getElementById('bi-preview').addEventListener('click', function () {
      var lines = parseLines();
      if (!lines.length) { Toast.warn('No valid entries'); return; }
      var result = document.getElementById('bi-result');
      result.innerHTML = '<div style="font-weight:600;margin-bottom:0.2rem">' + lines.length + ' stickers found:</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
        lines.map(function (l) {
          return '<div style="width:40px;height:40px;border-radius:4px;overflow:hidden;border:1px solid var(--border-light)">' +
            '<img src="' + l.url + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.background=\'#f88\'" />' +
          '</div>';
        }).join('') + '</div>';
    });

    document.getElementById('bi-import').addEventListener('click', function () {
      var gid = document.getElementById('bi-group').value;
      var lines = parseLines();
      if (!lines.length) { Toast.warn('No valid entries'); return; }

      var added = 0;
      lines.forEach(function (l) {
        Storage.addStickerToGroup(gid, l.url, l.desc);
        added++;
      });

      Toast.success(added + ' stickers imported');
      ov.remove();

      // 刷新贴纸管理器
      var smGroups = document.getElementById('sm-groups');
      if (smGroups) {
        var groups2 = Storage.getStickerGroups();
        // 触发重新渲染（简单方式：关闭再打开）
        document.querySelectorAll('.inner-modal-overlay').forEach(function (o) { o.remove(); });
      }
    });

    function parseLines() {
      var text = (document.getElementById('bi-text').value || '').trim();
      if (!text) return [];
      return text.split('\n').map(function (line) {
        line = line.trim();
        if (!line) return null;
        var parts = line.split('|');
        var url = (parts[0] || '').trim();
        var desc = (parts[1] || '').trim();
        if (!url) return null;
        if (!url.match(/^https?:\/\//) && !url.match(/^data:/)) return null;
        return { url: url, desc: desc };
      }).filter(Boolean);
    }
  }

  // 监听 DOM 变化，当贴纸管理器打开时注入按钮
  var observer = new MutationObserver(function () {
    if (document.getElementById('sm-create') && !document.getElementById('sm-batch')) {
      setTimeout(injectBatchBtn, 50);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
