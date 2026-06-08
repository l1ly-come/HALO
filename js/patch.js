/* patch.js — 防止 content 为空导致崩溃 */
(function(){
  var orig = Storage.getMessages;
  Storage.getMessages = function(cid) {
    var msgs = orig.call(Storage, cid);
    msgs.forEach(function(m) {
      if (m.content === undefined || m.content === null) {
        m.content = m.text || '';
      }
    });
    return msgs;
  };
})();
