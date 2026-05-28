var fs = require('fs');
var code = fs.readFileSync('js/chat.js', 'utf8');
var n = 0;

// 问题1: 删除多余的 showCardAction（保留最后一个，它最完整）
// 找到第一个 showCardAction 的位置
var first = code.indexOf("function showCardAction(msg,msgIdx,convId,container){var typeLabels={'transfer-receive'");
var second = code.indexOf("function showCardAction(msg,msgIdx,convId,container){var typeLabels={'transfer':'Transfer'");
if (first >= 0 && second >= 0 && first < second) {
  // 删除第一个（从 first 到 second）
  code = code.slice(0, first) + code.slice(second);
  n++;
  console.log('OK #' + n + ': removed 1st duplicate showCardAction');
}

// 检查是否还有第三个
var third = code.indexOf("function showCardAction(msg,msgIdx,convId,container){", code.indexOf("function showCardAction(") + 10);
if (third >= 0) {
  var fourth = code.indexOf("function showCardAction(", third + 10);
  if (fourth >= 0) {
    // 删除第二个重复
    code = code.slice(0, fourth) + code.slice(code.indexOf('\nfunction showLightbox', fourth));
    n++;
    console.log('OK #' + n + ': removed 2nd duplicate showCardAction');
  }
}

// 问题2: 删除 streamResponse 里重复的 ack 代码
var ack1 = 'var ackMsgs=Storage.getMessages(convId);var ackDirty=false;ackMsgs.forEach';
var pos1 = code.indexOf(ack1);
if (pos1 >= 0) {
  var pos2 = code.indexOf(ack1, pos1 + 100);
  if (pos2 >= 0) {
    // 找第二个 ack 块的结尾
    var endStr = "scrollToBottom(msgEl);}";
    var endPos = code.indexOf(endStr, pos2);
    if (endPos >= 0) {
      code = code.slice(0, pos2) + code.slice(endPos + endStr.length);
      n++;
      console.log('OK #' + n + ': removed duplicate ack block in streamResponse');
    }
  }
}

// 问题3: 删除重复的 showMorePanel 块
// 搜索第二个出现的 showMorePanel
var sm1 = code.indexOf("function showMorePanel(convId,entity,msgEl,isGroup){");
if (sm1 >= 0) {
  var sm2 = code.indexOf("function showMorePanel(convId,entity,msgEl,isGroup){", sm1 + 100);
  if (sm2 >= 0) {
    // 第二个块从 sm2 一直到它后面的 pluginVoice 结束
    // 找第二个 pluginVoice 之后的 pluginMusicShare
    var music = code.indexOf("function pluginMusicShare(", sm2);
    if (music >= 0) {
      code = code.slice(0, sm2) + code.slice(music);
      n++;
      console.log('OK #' + n + ': removed duplicate showMorePanel block (~60KB)');
    }
  }
}

// 问题4: delivery 拆开后加 Accept/Decline
var delRevealed = "dc2.innerHTML='<div class=\"card-amount\">'+esc(msg.item||'')+'</div><div class=\"card-meta\">Delivery";
var delEnd = "dBody.appendChild(dc2);}dRow";
var dri = code.indexOf(delRevealed);
var dei = code.indexOf(delEnd, dri);
if (dri >= 0 && dei >= 0) {
  var oldDel = code.slice(dri, dei);
  if (oldDel.indexOf('card-clickable') < 0) {
    var newDel = oldDel.replace(
      "dBody.appendChild(dc2);",
      "if(!isMe&&!msg.accepted&&!msg.declined){dc2.classList.add('card-clickable');dc2.innerHTML+='<div class=\"card-action-hint\">Tap to respond</div>';dc2.addEventListener('click',function(){showCardAction(msg,safeIdx,convId,container);});}if(msg.accepted){dc2.classList.add('card-done');}if(msg.declined){dc2.classList.add('card-declined');}dBody.appendChild(dc2);"
    );
    // Actually need to find and replace the exact block
    var dFullOld = code.slice(dri, dei + delEnd.length);
    if (dFullOld.indexOf('card-clickable') < 0) {
      // insert before dBody.appendChild(dc2)
      code = code.slice(0, dei) + 
        "if(!isMe&&!msg.accepted&&!msg.declined){dc2.classList.add('card-clickable');dc2.innerHTML+='<div class=\"card-action-hint\">Tap to respond</div>';dc2.addEventListener('click',function(){showCardAction(msg,safeIdx,convId,container);});}if(msg.accepted){dc2.classList.add('card-done');}if(msg.declined){dc2.classList.add('card-declined');}" +
        code.slice(dei);
      n++;
      console.log('OK #' + n + ': delivery revealed + Accept/Decline');
    }
  } else {
    console.log('SKIP: delivery clickable (already done)');
  }
}

// 问题4b: gift 拆开后加 Accept/Decline
var giftRevealed = "gc2.innerHTML='<div class=\"card-amount\">'+esc(msg.item||'')+'</div><div class=\"card-meta\">Gift";
var giftEnd = "gBody.appendChild(gc2);}gRow";
var gri = code.indexOf(giftRevealed);
var gei = code.indexOf(giftEnd, gri);
if (gri >= 0 && gei >= 0) {
  var oldGift = code.slice(gri, gei);
  if (oldGift.indexOf('card-clickable') < 0) {
    code = code.slice(0, gei) +
      "if(!isMe&&!msg.accepted&&!msg.declined){gc2.classList.add('card-clickable');gc2.innerHTML+='<div class=\"card-action-hint\">Tap to respond</div>';gc2.addEventListener('click',function(){showCardAction(msg,safeIdx,convId,container);});}if(msg.accepted){gc2.classList.add('card-done');}if(msg.declined){gc2.classList.add('card-declined');}" +
      code.slice(gei);
    n++;
    console.log('OK #' + n + ': gift revealed + Accept/Decline');
  } else {
    console.log('SKIP: gift clickable (already done)');
  }
}

fs.writeFileSync('js/chat.js', code, 'utf8');
console.log('\nDone! ' + n + ' fixes. Size: ' + (code.length / 1024).toFixed(1) + 'KB');
