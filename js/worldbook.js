/**
 * worldbook.js — 世界书系统（修复版）
 * 修复：位置选择器 radio 与视觉状态不同步
 * 修复：wb-pos-selector 布局缺失
 */

(function () {
  'use strict';

  var DEFAULT_CATEGORIES = ['General', 'Characters', 'Locations', 'Events', 'Lore'];

  function renderWorldBook() {
    var c = document.getElementById('worldbook-content');
    if (!c) return;

    var entries = Storage.getWorldBook();
    var categories = getUsedCategories(entries);

    var filterHtml = '<div class="wb-filter-bar" style="display:flex;flex-wrap:wrap;gap:0.15rem;padding:0.25rem 0">' +
      '<button class="wb-filter-chip active" data-cat="__all__">All</button>' +
      categories.map(function (cat) {
        return '<button class="wb-filter-chip" data-cat="' + esc(cat) + '">' + esc(cat) + '</button>';
      }).join('') +
    '</div>';

    var listHtml = '';
    if (!entries.length) {
      listHtml = '<div class="tab-empty" style="padding:1rem"><p>No world book entries</p>' +
        '<p style="font-size:0.7rem;opacity:0.5">World book entries inject background knowledge into AI when keywords match.</p></div>';
    } else {
      listHtml = '<div class="wb-list" id="wb-list">' +
        entries.map(function (e, i) {
          var posLabel = e.position === 'before' ? 'Before' : e.position === 'after' ? 'After' : 'Middle';
          var posClass = e.position === 'before' ? 'pos-before' : e.position === 'after' ? 'pos-after' : 'pos-middle';
          return '<div class="wb-entry-card" data-wbid="' + e.id + '" data-cat="' + esc(e.category || 'General') + '" style="animation-delay:' + (i * 0.03) + 's">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:0.3rem">' +
              '<div style="flex:1;min-width:0">' +
                '<span class="wb-entry-keyword">' + esc(e.keyword) + '</span>' +
                '<div style="display:flex;gap:0.2rem;margin-top:0.1rem">' +
                  '<span class="wb-cat-badge">' + esc(e.category || 'General') + '</span>' +
                  '<span class="wb-pos-badge ' + posClass + '">' + posLabel + '</span>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:0.15rem;flex-shrink:0">' +
                '<button class="wb-toggle ' + (e.enabled ? 'on' : '') + '" data-wbid="' + e.id + '"></button>' +
                '<button class="wb-btn-edit" data-wbid="' + e.id + '" style="font-size:0.58rem;padding:0.15rem 0.25rem;color:var(--text-3);background:none;border:none;cursor:pointer">Edit</button>' +
                '<button class="wb-btn-del" data-wbid="' + e.id + '" style="font-size:0.58rem;padding:0.15rem 0.25rem;color:var(--text-3);background:none;border:none;cursor:pointer">Del</button>' +
              '</div>' +
            '</div>' +
            '<div class="wb-entry-preview">' + esc((e.content || '').slice(0, 80)) + '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    c.innerHTML =
      '<div class="wb-wrap">' +
        '<div class="wb-toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:0.3rem 0;border-bottom:0.5px solid var(--border-light);margin-bottom:0.4rem">' +
          '<span class="wb-title">World Book</span>' +
          '<div style="display:flex;gap:0.2rem">' +
            '<button class="s-btn-sm" id="wb-manage-cats">Categories</button>' +
            '<button class="s-btn" id="wb-add" style="font-size:0.72rem;padding:0.3rem 0.7rem">+ Add</button>' +
          '</div>' +
        '</div>' +
        filterHtml +
        listHtml +
      '</div>';

    document.getElementById('wb-add').addEventListener('click', function () {
      showEditWBModal(null);
    });

    document.getElementById('wb-manage-cats').addEventListener('click', showCategoryManager);

    var filterBar = c.querySelector('.wb-filter-bar');
    if (filterBar) {
      filterBar.addEventListener('click', function (e) {
        var chip = e.target.closest('.wb-filter-chip');
        if (!chip) return;
        filterBar.querySelectorAll('.wb-filter-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var cat = chip.dataset.cat;
        var list = document.getElementById('wb-list');
        if (!list) return;
        list.querySelectorAll('.wb-entry-card').forEach(function (card) {
          card.style.display = (cat === '__all__' || card.dataset.cat === cat) ? '' : 'none';
        });
      });
    }

    var wbList = document.getElementById('wb-list');
    if (wbList) {
      wbList.addEventListener('click', function (e) {
        var toggle = e.target.closest('.wb-toggle');
        var edit = e.target.closest('.wb-btn-edit');
        var del = e.target.closest('.wb-btn-del');

        if (toggle) {
          e.stopPropagation();
          var entry = Storage.getWorldBook().find(function (x) { return x.id === toggle.dataset.wbid; });
          if (entry) {
            Storage.updateWorldBookEntry(toggle.dataset.wbid, { enabled: !entry.enabled });
            renderWorldBook();
          }
        } else if (edit) {
          e.stopPropagation();
          var entry2 = Storage.getWorldBook().find(function (x) { return x.id === edit.dataset.wbid; });
          if (entry2) showEditWBModal(entry2);
        } else if (del) {
          e.stopPropagation();
          if (confirm('Delete this entry?')) {
            Storage.deleteWorldBookEntry(del.dataset.wbid);
            Toast.success('Deleted');
            renderWorldBook();
          }
        }
      });
    }
  }

  /* ══════════════════════════════
     编辑/新增弹窗 — 修复版
     核心修复：position radio 手动同步
  ══════════════════════════════ */
  function showEditWBModal(entry) {
    var isNew = !entry;
    if (isNew) entry = { keyword: '', content: '', enabled: true, category: 'General', position: 'middle' };

    var cats = getAvailableCategories();
    /* 确保 position 有效 */
    var curPos = entry.position || 'middle';
    if (['before', 'middle', 'after'].indexOf(curPos) < 0) curPos = 'middle';

    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';
    ov.innerHTML =
      '<div class="inner-modal">' +
        '<div class="modal-header"><span class="modal-title">' + (isNew ? 'Add Entry' : 'Edit Entry') + '</span>' +
          '<button class="modal-close" id="wbe-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +

        '<div class="settings-item">' +
          '<label class="settings-label">Keywords (comma separated)</label>' +
          '<input id="wbe-keyword" class="s-input" value="' + esc(entry.keyword) + '" placeholder="e.g. Magic Academy, Holy City" /></div>' +

        '<div class="settings-item">' +
          '<label class="settings-label">Category</label>' +
          '<div style="display:flex;gap:0.25rem;align-items:center">' +
            '<select id="wbe-category" class="s-select" style="flex:1">' +
              cats.map(function (c) {
                return '<option value="' + esc(c) + '"' + (entry.category === c ? ' selected' : '') + '>' + esc(c) + '</option>';
              }).join('') +
            '</select>' +
            '<input id="wbe-custom-cat" class="s-input" placeholder="Or new..." style="flex:1" />' +
          '</div></div>' +

        /* ★ 修复：用按钮替代 radio，彻底避免 label/radio 同步问题 */
        '<div class="settings-item">' +
          '<label class="settings-label">Injection Position</label>' +
          '<div id="wbe-pos-group" style="display:flex;gap:0.25rem;margin-top:0.15rem">' +
            buildPosBtn('before', 'Before', 'Top of prompt', curPos) +
            buildPosBtn('middle', 'Middle', 'After character', curPos) +
            buildPosBtn('after', 'After', 'End of prompt', curPos) +
          '</div>' +
        '</div>' +

        '<div class="settings-item">' +
          '<label class="settings-label">Content</label>' +
          '<textarea id="wbe-content" class="s-input" rows="5" style="min-height:6rem;resize:vertical" placeholder="Background knowledge to inject...">' +
            esc(entry.content) +
          '</textarea></div>' +

        '<button class="s-btn" id="wbe-save" style="width:100%">Save</button>' +
      '</div>';
    document.body.appendChild(ov);

    document.getElementById('wbe-close').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });

    /* ★ 修复：位置选择用 data-pos 属性，点击时设置 selected 状态 */
    var posGroup = document.getElementById('wbe-pos-group');
    posGroup.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-pos]');
      if (!btn) return;
      posGroup.querySelectorAll('[data-pos]').forEach(function (b) {
        b.classList.remove('wb-pos-selected');
        b.style.borderColor = 'var(--border-light)';
        b.style.background = 'var(--surface)';
      });
      btn.classList.add('wb-pos-selected');
      btn.style.borderColor = 'var(--primary)';
      btn.style.background = 'rgba(0,149,246,0.04)';
    });

    document.getElementById('wbe-save').addEventListener('click', function () {
      var keyword = (document.getElementById('wbe-keyword').value || '').trim();
      var content = (document.getElementById('wbe-content').value || '').trim();
      var customCat = (document.getElementById('wbe-custom-cat').value || '').trim();
      var category = customCat || document.getElementById('wbe-category').value || 'General';

      /* ★ 修复：从 data-pos 属性读取位置 */
      var selectedBtn = posGroup.querySelector('.wb-pos-selected');
      var position = selectedBtn ? selectedBtn.dataset.pos : 'middle';

      if (!keyword) { Toast.warn('Enter keywords'); return; }
      if (!content) { Toast.warn('Enter content'); return; }

      if (isNew) {
        Storage.addWorldBookEntry({
          keyword: keyword, content: content, enabled: true,
          category: category, position: position
        });
        Toast.success('Entry added');
      } else {
        Storage.updateWorldBookEntry(entry.id, {
          keyword: keyword, content: content,
          category: category, position: position
        });
        Toast.success('Entry updated');
      }
      ov.remove();
      renderWorldBook();
    });
  }

  /* 构建位置按钮 */
  function buildPosBtn(value, label, desc, current) {
    var isActive = value === current;
    return '<div data-pos="' + value + '" class="' + (isActive ? 'wb-pos-selected' : '') + '" ' +
      'style="flex:1;padding:0.4rem 0.3rem;border:1.5px solid ' + (isActive ? 'var(--primary)' : 'var(--border-light)') + ';' +
      'border-radius:var(--radius-sm);cursor:pointer;text-align:center;' +
      'background:' + (isActive ? 'rgba(0,149,246,0.04)' : 'var(--surface)') + ';' +
      'transition:all 0.15s">' +
      '<div style="font-size:0.68rem;font-weight:600;color:var(--text)">' + label + '</div>' +
      '<div style="font-size:0.5rem;color:var(--text-3);margin-top:0.05rem">' + desc + '</div>' +
    '</div>';
  }

  /* ══════════════════════════════
     分类管理器
  ══════════════════════════════ */
  function showCategoryManager() {
    var cats = getAvailableCategories();
    var ov = document.createElement('div');
    ov.className = 'inner-modal-overlay';

    function render() {
      cats = getAvailableCategories();
      var html = cats.map(function (c) {
        var isDefault = DEFAULT_CATEGORIES.indexOf(c) >= 0;
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.35rem 0.3rem;border-bottom:0.5px solid var(--border-light)">' +
          '<span style="font-size:0.78rem;font-weight:500">' + esc(c) + '</span>' +
          (isDefault ? '<span style="font-size:0.6rem;color:var(--text-3)">Built-in</span>' :
            '<button class="wb-cat-del" data-cat="' + esc(c) + '" style="font-size:0.6rem;color:var(--error);background:none;border:none;cursor:pointer">Del</button>') +
        '</div>';
      }).join('');
      var container = document.getElementById('cat-list');
      if (container) container.innerHTML = html;
    }

    ov.innerHTML =
      '<div class="inner-modal" style="max-width:320px">' +
        '<div class="modal-header"><span class="modal-title">Categories</span>' +
          '<button class="modal-close" id="cat-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
        '<div id="cat-list"></div>' +
        '<div style="display:flex;gap:0.25rem;margin-top:0.3rem">' +
          '<input id="cat-new" class="s-input" placeholder="New category..." style="flex:1" />' +
          '<button class="s-btn" id="cat-add" style="flex-shrink:0">Add</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    render();

    document.getElementById('cat-close').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });

    document.getElementById('cat-add').addEventListener('click', function () {
      var name = (document.getElementById('cat-new').value || '').trim();
      if (!name) { Toast.warn('Enter a name'); return; }
      if (cats.indexOf(name) >= 0) { Toast.warn('Already exists'); return; }
      var custom = getCustomCategories();
      custom.push(name);
      saveCustomCategories(custom);
      document.getElementById('cat-new').value = '';
      Toast.success('Added');
      render();
    });

    document.getElementById('cat-list').addEventListener('click', function (e) {
      var del = e.target.closest('.wb-cat-del');
      if (!del) return;
      var custom = getCustomCategories().filter(function (c) { return c !== del.dataset.cat; });
      saveCustomCategories(custom);
      Toast.success('Removed');
      render();
    });
  }

  function getCustomCategories() {
    try { return JSON.parse(Storage.get('wbCustomCats', '[]')); }
    catch (e) { return []; }
  }
  function saveCustomCategories(arr) {
    Storage.set('wbCustomCats', JSON.stringify(arr));
  }
  function getAvailableCategories() {
    return DEFAULT_CATEGORIES.concat(getCustomCategories());
  }
  function getUsedCategories(entries) {
    var set = {};
    entries.forEach(function (e) { if (e.category) set[e.category] = true; });
    return Object.keys(set);
  }

  function matchWorldBook(text) {
    var entries = Storage.getWorldBook();
    var result = { before: [], middle: [], after: [] };
    entries.forEach(function (entry) {
      if (!entry.enabled) return;
      var keywords = entry.keyword.split(/[,，]/).map(function (k) { return k.trim().toLowerCase(); }).filter(Boolean);
      var lowerText = text.toLowerCase();
      var hit = keywords.some(function (kw) { return lowerText.indexOf(kw) >= 0; });
      if (hit) {
        var pos = entry.position || 'middle';
        if (!result[pos]) result[pos] = [];
        result[pos].push({ content: entry.content, category: entry.category || 'General' });
      }
    });
    return result;
  }

  function matchFlat(text) {
    var grouped = matchWorldBook(text);
    var all = [];
    ['before', 'middle', 'after'].forEach(function (pos) {
      (grouped[pos] || []).forEach(function (item) { all.push(item.content); });
    });
    return all;
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'worldbook') renderWorldBook();
  });

  window.WorldBook = {
    render: renderWorldBook,
    match: matchFlat,
    matchGrouped: matchWorldBook
  };
})();

