/**
 * media-parse.js — 共享媒体解析
 * 把 [图片:desc] [语音:content] 转成 HTML
 */
(function () {
  'use strict';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  window.parseMediaHTML = function (text) {
    if (!text) return '';
    var html = esc(text);

    // [图片:xxx] or [Photo:xxx]
    html = html.replace(/\[(图片|照片|Photo|Image)[：:]([^\]]+)\]/gi, function (m, tag, desc) {
      var matched = window.AIPhotoAlbum && window.AIPhotoAlbum.match ? window.AIPhotoAlbum.match(desc.trim()) : null;
      if (matched) {
        return '<div class="mp-img"><img src="' + esc(matched.url) + '" onclick="this.classList.toggle(\'mp-zoom\')" /><div class="mp-img-cap">' + esc(desc.trim()) + '</div></div>';
      }
      return '<div class="mp-photo-card"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>' + esc(desc.trim()) + '</span></div>';
    });

    // [语音:xxx] or [Voice:xxx]
    html = html.replace(/\[(语音|语音消息|Voice)[：:]([^\]]+)\]/gi, function (m, tag, content) {
      var dur = Math.max(2, Math.min(Math.ceil(content.trim().length / 8), 12));
      return '<div class="mp-voice" onclick="this.classList.toggle(\'mp-voice-open\')"><div class="mp-voice-row"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><div class="mp-voice-bars"><span></span><span></span><span></span><span></span></div><span class="mp-voice-dur">0:' + String(dur).padStart(2, '0') + '</span></div><div class="mp-voice-text">' + esc(content.trim()) + '</div></div>';
    });

    return html;
  };
})();
