/**
 * fix-card-ack.js — 用户发卡片后，点AI回复时自动产生接收反馈
 * 用法: node fix-card-ack.js
 */
var fs = require('fs');
var path = require('path');
var file = path.join(__dirname, 'js', 'chat.js');
var code = fs.readFileSync(file, 'utf8');
var n = 0;

function insertBefore(anchor, text, label) {
  var idx = code.indexOf(anchor);
  if (idx === -1) { console.log('⚠️  SKIP: ' + label); return false; }
  code = code.slice(0, idx) + text + code.slice(idx);
  n++;
  console.log('✅ #' + n + ': ' + label);
  return true;
}

// ═══ 1. 定义 doCardAck 函数 ═══
var ackFn = [
  'function doCardAck(convId){',
  'var msgs=Storage.getMessages(convId);var dirty=false;',
  'msgs.forEach(function(lm){',
  'if(lm.role==="user"&&!lm._acked&&(lm.type==="transfer"||lm.type==="delivery"||lm.type==="gift")){',
  'lm._acked=true;dirty=true;',
  'var ok=Math.random()>0.1;var v=lm.amount||lm.item||"";',
  'if(lm.type==="transfer")Storage.appendMessage(convId,{role:"model",type:"status",statusType:ok?"received":"returned",statusText:ok?"Accepted \\u00a5"+v:"Declined \\u00a5"+v,ts:Date.now()});',
  'else if(lm.type==="delivery")Storage.appendMessage(convId,{role:"model",type:"status",statusType:ok?"received":"returned",statusText:ok?"Received "+v:"Returned "+v,ts:Date.now()});',
  'else Storage.appendMessage(convId,{role:"model",type:"status",statusType:ok?"received":"returned",statusText:ok?"Accepted "+v:"Returned "+v,ts:Date.now()});',
  '}});',
  'if(dirty)Storage.saveMessages(convId,msgs);',
  '}\n'
].join('');

// 插在 showCardAction 或 showLightbox 前面
if (code.indexOf('function doCardAck(') >= 0) {
  console.log('— doCardAck: already defined');
} else {
  var inserted = insertBefore(
    'function showCardAction(',
    ackFn,
    'define doCardAck function'
  );
  if (!inserted) {
    insertBefore(
      'function showLightbox(',
      ackFn,
      'define doCardAck function (alt)'
    );
  }
}

// ═══ 2. triggerAIReply 中，streamResponse 调用前插入 ═══
var triggerAnchor = 'streamResponse(convId,friend,msgEl,buildPromptMessages(convId,friend),ab,aiBtn);';
var ackCall = 'doCardAck(convId);';

if (code.indexOf(triggerAnchor) >= 0) {
  // 检查是否已经有 doCardAck 在前面
  var pos = code.indexOf(triggerAnchor);
  var before = code.slice(Math.max(0, pos - 60), pos);
  if (before.indexOf('doCardAck') >= 0) {
    console.log('— triggerAIReply ack: already present');
  } else {
    insertBefore(triggerAnchor, ackCall, 'triggerAIReply: ack before streamResponse');
  }
} else {
  console.log('⚠️  triggerAIReply streamResponse anchor not found');
}

// ═══ 3. triggerGroupAIReply 中，streamResponse 调用前插入 ═══
var groupAnchor = 'streamResponse(convId,group,msgEl,buildPromptMessages(convId,resp,cn),ab,aiBtn,{name:cn,avatar:resp.avatar});';
if (code.indexOf(groupAnchor) >= 0) {
  var pos2 = code.indexOf(groupAnchor);
  var before2 = code.slice(Math.max(0, pos2 - 60), pos2);
  if (before2.indexOf('doCardAck') >= 0) {
    console.log('— triggerGroupAIReply ack: already present');
  } else {
    insertBefore(groupAnchor, ackCall, 'triggerGroupAIReply: ack before streamResponse');
  }
} else {
  console.log('⚠️  triggerGroupAIReply streamResponse anchor not found');
}

// ═══ 4. 清除 streamResponse 内部残留的旧 ack 块 ═══
// 这步可选，旧 ack 有 _acked 防重复，不会出 bug，只是冗余
var ackPat = 'var ackMsgs=Storage.getMessages(convId);var ackDirty=false;';
var ackTail = 'scrollToBottom(msgEl);}';
var cleaned = 0;
var safety = 0;
while (safety++ < 50) {
  var p = code.indexOf(ackPat);
  if (p < 0) break;
  var e = code.indexOf(ackTail, p);
  if (e < 0) break;
  code = code.slice(0, p) + code.slice(e + ackTail.length);
  cleaned++;
}
// 也清理 ackM/ackD 变量名的版本
var ackPat2 = 'var ackM=Storage.getMessages(convId);var ackD=false;';
while (safety++ < 100) {
  var p2 = code.indexOf(ackPat2);
  if (p2 < 0) break;
  var e2 = code.indexOf(ackTail, p2);
  if (e2 < 0) break;
  code = code.slice(0, p2) + code.slice(e2 + ackTail.length);
  cleaned++;
}
if (cleaned) { n++; console.log('✅ #' + n + ': removed ' + cleaned + ' old inline ack blocks'); }
else { console.log('— no old ack blocks found'); }

// ═══ 写回 ═══
fs.writeFileSync(file, code, 'utf8');
console.log('\n════════════════════════');
console.log('Done! ' + n + ' fixes applied');
console.log('Size: ' + (code.length / 1024).toFixed(1) + ' KB');
