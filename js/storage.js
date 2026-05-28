/**
 * storage.js — v7 修复版
 * 修复：deleteFriend 数据残留 · rawSet 错误处理 · 容量管理
 */
var Storage = (function () {
  'use strict';
  var PREFIX = 'xsj_';

  function rawGet(k,d){try{var v=localStorage.getItem(PREFIX+k);return v!==null?v:(d!==undefined?d:null);}catch(e){return d!==undefined?d:null;}}

  function rawSet(k,v){
    try{localStorage.setItem(PREFIX+k,v);}
    catch(e){
      console.warn('[Storage] Write failed:',k,e);
      if(typeof Toast!=='undefined')Toast.error('Storage full! Export & clear data.');
    }
  }

  function rawRemove(k){try{localStorage.removeItem(PREFIX+k);}catch(e){}}
  function getJSON(k,d){try{var v=rawGet(k,null);return v!==null?JSON.parse(v):d;}catch(e){return d;}}
  function setJSON(k,v){rawSet(k,JSON.stringify(v));}
  function normalizeFriend(f){if(!f)return f;if(!f.displayName)f.displayName=f.name||'';if(!f.realName)f.realName=f.displayName;return f;}

  /* ══ Storage Capacity ══ */
  function getStorageUsage(){
    var total=0;
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k&&k.indexOf(PREFIX)===0){total+=localStorage.getItem(k).length*2;}
    }
    return total;
  }
  function getStorageUsageKB(){return(getStorageUsage()/1024).toFixed(1);}
  function getStoragePercent(){return Math.min(100,(getStorageUsage()/(5*1024*1024)*100)).toFixed(1);}

  /* Users */
  function getUsers(){return getJSON('users',[]);}
  function saveUsers(a){setJSON('users',a);}
  function getActiveUserId(){return rawGet('activeUser',null);}
  function setActiveUserId(id){rawSet('activeUser',id);}
  function getActiveUser(){var id=getActiveUserId();if(!id)return null;return getUsers().find(function(u){return u.id===id;})||null;}
  function upsertUser(u){if(!u||!u.id)return;var l=getUsers();var i=l.findIndex(function(x){return x.id===u.id;});if(i>=0)l[i]=u;else l.push(u);saveUsers(l);}
  function deleteUser(id){saveUsers(getUsers().filter(function(u){return u.id!==id;}));if(getActiveUserId()===id)rawRemove('activeUser');}

  /* Friends */
  function getFriends(){return getJSON('friends',[]).map(normalizeFriend);}
  function saveFriends(a){setJSON('friends',a);}
  function upsertFriend(f){if(!f||!f.id)return;f=normalizeFriend(Object.assign({},f));var l=getFriends();var i=l.findIndex(function(x){return x.id===f.id;});if(i>=0)l[i]=f;else l.push(f);saveFriends(l);}

  function deleteFriend(id){
    saveFriends(getFriends().filter(function(f){return f.id!==id;}));
    var prefixes=[
      'msg_','unread_','memory_','conv_','status_','smemory_',
      'proactive_','friendStickers_','blocked_','charPhone_',
      'bb_msg_','bb_subday_','lang_','autotrans_'
    ];
    prefixes.forEach(function(p){rawRemove(p+id);});
  }

  /* Pinned */
  function getPinned(){return getJSON('pinned',[]);}
  function savePinned(a){setJSON('pinned',a);}
  function isPinned(id){return getPinned().indexOf(id)>=0;}
  function togglePin(id){var l=getPinned();var i=l.indexOf(id);if(i>=0)l.splice(i,1);else l.unshift(id);savePinned(l);return i<0;}

  /* Messages */
  function getMessages(cid){return getJSON('msg_'+cid,[]);}
  function saveMessages(cid,a){setJSON('msg_'+cid,a);}
  function appendMessage(cid,m){if(!cid||!m)return;var l=getMessages(cid);l.push(m);if(l.length>500)l=l.slice(l.length-500);saveMessages(cid,l);}
  function deleteMessage(cid,i){var l=getMessages(cid);if(i>=0&&i<l.length){l.splice(i,1);saveMessages(cid,l);}}
  function clearMessages(cid){saveMessages(cid,[]);}

  /* Unread */
  function getUnread(id){return parseInt(rawGet('unread_'+id,'0'),10);}
  function setUnread(id,c){rawSet('unread_'+id,String(Math.max(0,c)));}
  function addUnread(id){setUnread(id,getUnread(id)+1);}
  function clearUnread(id){rawRemove('unread_'+id);}

  /* Online Status */
  function getFriendStatus(fid){return rawGet('status_'+fid,'online');}
  function setFriendStatus(fid,s){rawSet('status_'+fid,s);}
  function simulateStatuses(){var p=['online','online','online','busy','offline'];getFriends().forEach(function(f){if(Math.random()<0.2)setFriendStatus(f.id,p[Math.floor(Math.random()*p.length)]);});}

  /* Conv Settings */
  var DEFAULT_CONV_SETTINGS={showAvatars:true,userAvatar:'',charAvatar:'',contextLength:20,chatBackground:'',bubblePreset:'',bubbleCSS:{meBg:'',meColor:'',meRadius:'',meShadow:'',meBorder:'',aiBg:'',aiColor:'',aiRadius:'',aiShadow:'',aiBorder:'',fontSize:'',spacing:'',customCode:''}};
  function getConvSettings(cid){var s=getJSON('conv_'+cid,null);if(!s)return JSON.parse(JSON.stringify(DEFAULT_CONV_SETTINGS));var r=JSON.parse(JSON.stringify(DEFAULT_CONV_SETTINGS));Object.keys(s).forEach(function(k){if(k==='bubbleCSS'&&typeof s[k]==='object')Object.assign(r.bubbleCSS,s.bubbleCSS);else r[k]=s[k];});return r;}
  function setConvSettings(cid,s){setJSON('conv_'+cid,s);}

  /* Bubble Presets */
  var BUBBLE_PRESETS={'':{ name:'Default'},sakura:{name:'Sakura',meBg:'linear-gradient(135deg,#fce4ec,#f8bbd0)',meColor:'#880e4f',meRadius:'1.2rem 1.2rem 0.2rem 1.2rem',aiBg:'#fff0f5',aiColor:'#4a0028',aiRadius:'1.2rem 1.2rem 1.2rem 0.2rem',meShadow:'0 3px 12px rgba(233,30,99,0.15)',aiShadow:'0 3px 12px rgba(233,30,99,0.08)'},ocean:{name:'Ocean',meBg:'linear-gradient(135deg,#0d47a1,#1976d2)',meColor:'#e3f2fd',meRadius:'1.2rem 1.2rem 0.2rem 1.2rem',aiBg:'#e8eaf6',aiColor:'#1a237e',aiRadius:'1.2rem 1.2rem 1.2rem 0.2rem'},forest:{name:'Forest',meBg:'linear-gradient(135deg,#1b5e20,#388e3c)',meColor:'#e8f5e9',meRadius:'1rem',aiBg:'#f1f8e9',aiColor:'#1b5e20',aiRadius:'1rem'},sunset:{name:'Sunset',meBg:'linear-gradient(135deg,#e65100,#ff6d00)',meColor:'#fff3e0',meRadius:'1.4rem',aiBg:'#fff8e1',aiColor:'#bf360c',aiRadius:'1.4rem'},galaxy:{name:'Galaxy',meBg:'linear-gradient(135deg,#4a148c,#7b1fa2)',meColor:'#f3e5f5',meRadius:'1.3rem',aiBg:'#ede7f6',aiColor:'#311b92',aiRadius:'1.3rem'},mint:{name:'Mint',meBg:'#a7ffeb',meColor:'#004d40',meRadius:'0.8rem',aiBg:'#e0f2f1',aiColor:'#00695c',aiRadius:'0.8rem'},dark:{name:'Dark',meBg:'#37474f',meColor:'#eceff1',meRadius:'1rem',aiBg:'#263238',aiColor:'#b0bec5',aiRadius:'1rem',meBorder:'1px solid rgba(255,255,255,0.08)',aiBorder:'1px solid rgba(255,255,255,0.06)'}};
  function getBubblePresets(){return BUBBLE_PRESETS;}

  /* Groups */
  function getGroups(){return getJSON('groups',[]);}
  function saveGroups(a){setJSON('groups',a);}
  function upsertGroup(g){if(!g||!g.id)return;var l=getGroups();var i=l.findIndex(function(x){return x.id===g.id;});if(i>=0)l[i]=g;else l.push(g);saveGroups(l);}
  function deleteGroup(id){saveGroups(getGroups().filter(function(g){return g.id!==id;}));rawRemove('msg_'+id);rawRemove('unread_'+id);rawRemove('conv_'+id);}

  /* Stats */
  function incChatCount(){var k='chatCount_'+new Date().toISOString().slice(0,10);rawSet(k,String(parseInt(rawGet(k,'0'),10)+1));}
  function getTodayChatCount(){return parseInt(rawGet('chatCount_'+new Date().toISOString().slice(0,10),'0'),10);}
  function getNoteSize(){return ((rawGet('noteInput','')||'').length*2/1024).toFixed(2);}
  function getTokenUsed(){return parseInt(rawGet('tokenUsed','0'),10);}
  function addToken(n){rawSet('tokenUsed',String(getTokenUsed()+n));}

  /* Moments */
  function getMoments(){return getJSON('moments',[]).map(function(m){if(!m.likes)m.likes=0;if(!m.liked)m.liked=false;if(!m.comments)m.comments=[];if(!m.id)m.id='m_'+Math.random().toString(36).slice(2,9);return m;});}
  function saveMoments(a){setJSON('moments',a);}
  function addMoment(m){m.id=m.id||'m_'+Math.random().toString(36).slice(2,9);m.likes=0;m.liked=false;m.comments=[];var l=getMoments();l.unshift(m);if(l.length>100)l=l.slice(0,100);saveMoments(l);}
  function deleteMoment(mid){saveMoments(getMoments().filter(function(m){return m.id!==mid;}));}
  function toggleLikeMoment(mid){var l=getMoments();var m=l.find(function(x){return x.id===mid;});if(m){m.liked=!m.liked;m.likes=Math.max(0,m.likes+(m.liked?1:-1));}saveMoments(l);return m;}
  function addCommentToMoment(mid,c){var l=getMoments();var m=l.find(function(x){return x.id===mid;});if(m)m.comments.push(c);saveMoments(l);}

  /* Dark Mode */
  function getDarkMode(){return rawGet('darkMode','false')==='true';}
  function setDarkMode(v){rawSet('darkMode',String(!!v));}

  /* World Book */
  function getWorldBook(){return getJSON('worldBook',[]).map(function(e){if(!e.category)e.category='General';if(!e.position)e.position='middle';return e;});}
  function saveWorldBook(a){setJSON('worldBook',a);}
  function addWorldBookEntry(e){var l=getWorldBook();e.id='wb_'+Math.random().toString(36).slice(2,9);if(e.enabled===undefined)e.enabled=true;if(!e.category)e.category='General';if(!e.position)e.position='middle';l.push(e);saveWorldBook(l);}
  function updateWorldBookEntry(id,u){var l=getWorldBook();var i=l.findIndex(function(x){return x.id===id;});if(i>=0)Object.assign(l[i],u);saveWorldBook(l);}
  function deleteWorldBookEntry(id){saveWorldBook(getWorldBook().filter(function(x){return x.id!==id;}));}

  /* Memory */
  function getMemorySummary(id){return rawGet('memory_'+id,'');}
  function setMemorySummary(id,s){rawSet('memory_'+id,s);}

  /* Temp / AI */
  function getTemperature(){var v=parseFloat(rawGet('chat_temperature','0.8'));return isNaN(v)?0.8:Math.max(0,Math.min(2,v));}
  function setTemperature(v){var x=parseFloat(v);rawSet('chat_temperature',String(isNaN(x)?0.8:Math.max(0,Math.min(2,x))));}
  function getActiveCharacter(){return getJSON('activeCharacter',null);}
  function setActiveCharacter(c){setJSON('activeCharacter',c);}

  /* KV */
  function get(k,d){return rawGet(k,d);}
  function set(k,v){rawSet(k,v);}
  function remove(k){rawRemove(k);}
  function clearAll(){var keys=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(PREFIX)===0)keys.push(k);}keys.forEach(function(k){localStorage.removeItem(k);});}

  /* Export / Import */
  function exportAll(){var d={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(PREFIX)===0)d[k]=localStorage.getItem(k);}return JSON.stringify(d,null,2);}
  function importAll(j){try{var d=JSON.parse(j);clearAll();Object.keys(d).forEach(function(k){if(k.indexOf(PREFIX)===0)localStorage.setItem(k,d[k]);});return true;}catch(e){return false;}}

  /* Time Awareness */
  var DEFAULT_TIME_SETTINGS={enabled:true,sleepStart:23,sleepEnd:7,busyStart:9,busyEnd:18,proactiveEnabled:true,proactiveInterval:30,lastVisit:Date.now()};
  function getTimeSettings(){var s=getJSON('timeSettings',null);if(!s)return JSON.parse(JSON.stringify(DEFAULT_TIME_SETTINGS));var r=JSON.parse(JSON.stringify(DEFAULT_TIME_SETTINGS));Object.keys(s).forEach(function(k){r[k]=s[k];});return r;}
  function setTimeSettings(s){setJSON('timeSettings',s);}
  function getCharacterTimeStatus(){var s=getTimeSettings();if(!s.enabled)return{status:'free',label:'Free',emoji:'😊'};var h=new Date().getHours();if(s.sleepStart>s.sleepEnd){if(h>=s.sleepStart||h<s.sleepEnd)return{status:'sleeping',label:'Sleeping',emoji:'😴'};}else{if(h>=s.sleepStart&&h<s.sleepEnd)return{status:'sleeping',label:'Sleeping',emoji:'😴'};}if(h>=s.busyStart&&h<s.busyEnd)return{status:'busy',label:'Busy',emoji:'📱'};return{status:'free',label:'Free',emoji:'😊'};}
  function recordVisit(){var s=getTimeSettings();s.lastVisit=Date.now();setTimeSettings(s);}
  function getAwayMinutes(){var s=getTimeSettings();return Math.floor((Date.now()-(s.lastVisit||Date.now()))/60000);}

  /* Structured Memory */
  function getStructuredMemory(cid){return getJSON('smemory_'+cid,{habits:[],likes:[],events:[]});}
  function setStructuredMemory(cid,m){setJSON('smemory_'+cid,m);}
  function addMemoryEntry(cid,cat,e){var m=getStructuredMemory(cid);if(!m[cat])m[cat]=[];e.ts=e.ts||Date.now();m[cat].push(e);if(m[cat].length>30)m[cat]=m[cat].slice(-30);setStructuredMemory(cid,m);}
  function removeMemoryEntry(cid,cat,i){var m=getStructuredMemory(cid);if(m[cat]&&i>=0&&i<m[cat].length){m[cat].splice(i,1);setStructuredMemory(cid,m);}}
  function clearStructuredMemory(cid){setStructuredMemory(cid,{habits:[],likes:[],events:[]});}
  function buildMemoryPrompt(cid){var m=getStructuredMemory(cid),p=[];if(m.events&&m.events.length){p.push('## Important Memories');m.events.forEach(function(e){var x=e.strength==='high'?'[STRONG] ':e.strength==='medium'?'[NORMAL] ':'';p.push('- '+x+e.text);});}if(m.habits&&m.habits.length){p.push('\n## User Habits');m.habits.forEach(function(h){p.push('- '+h.text);});}if(m.likes&&m.likes.length){p.push('\n## User Preferences');m.likes.forEach(function(l){p.push('- '+l.text);});}return p.length?'\n\n'+p.join('\n'):'';}

  /* Proactive Messages */
  function getProactiveMessages(cid){return getJSON('proactive_'+cid,[]);}
  function addProactiveMessage(cid,m){var l=getProactiveMessages(cid);l.push(m);if(l.length>20)l=l.slice(-20);setJSON('proactive_'+cid,l);}
  function clearProactiveMessages(cid){rawRemove('proactive_'+cid);}

  /* Sticker System */
  function getStickerGroups(){return getJSON('stickerGroups',[]);}
  function saveStickerGroups(a){setJSON('stickerGroups',a);}
  function addStickerGroup(name){var l=getStickerGroups();var g={id:'sg_'+Math.random().toString(36).slice(2,9),name:name,stickers:[]};l.push(g);saveStickerGroups(l);return g;}
  function deleteStickerGroup(gid){saveStickerGroups(getStickerGroups().filter(function(g){return g.id!==gid;}));}
  function renameStickerGroup(gid,n){var l=getStickerGroups();var g=l.find(function(x){return x.id===gid;});if(g)g.name=n;saveStickerGroups(l);}
  function addStickerToGroup(gid,url,desc){var l=getStickerGroups();var g=l.find(function(x){return x.id===gid;});if(!g)return null;var s={id:'st_'+Math.random().toString(36).slice(2,9),url:url,desc:desc||''};g.stickers.push(s);saveStickerGroups(l);return s;}
  function removeStickerFromGroup(gid,sid){var l=getStickerGroups();var g=l.find(function(x){return x.id===gid;});if(g)g.stickers=g.stickers.filter(function(s){return s.id!==sid;});saveStickerGroups(l);}
  function getFriendStickerGroups(fid){return getJSON('friendStickers_'+fid,[]);}
  function setFriendStickerGroups(fid,gids){setJSON('friendStickers_'+fid,gids);}
  function getFriendStickers(fid){var gids=getFriendStickerGroups(fid);var all=getStickerGroups();var r=[];gids.forEach(function(gid){var g=all.find(function(x){return x.id===gid;});if(g&&g.stickers)g.stickers.forEach(function(s){r.push(s);});});return r;}
  function buildStickerPrompt(fid){var s=getFriendStickers(fid);if(!s.length)return '';var lines=s.map(function(x){return '- [sticker:'+x.id+'] '+(x.desc||'sticker');});return '\n\n## Available Stickers\nYou can use stickers in your reply with [sticker:ID] format:\n'+lines.join('\n');}

  /* Music System */
  function getPlaylists(){return getJSON('playlists',[]);}
  function savePlaylists(a){setJSON('playlists',a);}
  function addPlaylist(pl){if(!pl.id)pl.id='pl_'+Math.random().toString(36).slice(2,9);if(!pl.tracks)pl.tracks=[];var l=getPlaylists();l.push(pl);savePlaylists(l);return pl;}
  function deletePlaylist(pid){savePlaylists(getPlaylists().filter(function(p){return p.id!==pid;}));}
  function updatePlaylist(pid,updates){var l=getPlaylists();var p=l.find(function(x){return x.id===pid;});if(p)Object.assign(p,updates);savePlaylists(l);}
  function addTrackToPlaylist(pid,track){var l=getPlaylists();var p=l.find(function(x){return x.id===pid;});if(!p)return;if(!track.id)track.id='tr_'+Math.random().toString(36).slice(2,9);p.tracks.push(track);savePlaylists(l);}
  function removeTrackFromPlaylist(pid,tid){var l=getPlaylists();var p=l.find(function(x){return x.id===pid;});if(p)p.tracks=p.tracks.filter(function(t){return t.id!==tid;});savePlaylists(l);}
  function getCharacterPlaylists(charId){return getPlaylists().filter(function(p){return p.characterId===charId;});}
  function getCurrentTrack(){return getJSON('currentTrack',null);}
  function setCurrentTrack(t){setJSON('currentTrack',t);}
  function getMusicState(){return getJSON('musicState',{playing:false,volume:0.8,currentPlaylistId:'',currentIndex:0});}
  function setMusicState(s){setJSON('musicState',s);}

  /* Init */
  function initDefaults(){
    if(getUsers().length===0){saveUsers([{id:'u_default',name:'Me',avatar:'https://api.dicebear.com/7.x/bottts/svg?seed=me&backgroundColor=b6e3f4',prompt:'',wallet:100}]);setActiveUserId('u_default');}
    if(!getActiveCharacter())setActiveCharacter({name:'AI'});
  }
  initDefaults();

  /* Block */
  function isBlocked(f){return rawGet('blocked_'+f,'false')==='true';}
  function setBlocked(f,v){rawSet('blocked_'+f,String(!!v));}

  /* Character Phone */
  function getCharacterPhone(f){return getJSON('charPhone_'+f,{schedule:[],diary:[],notes:[],shopping:[],tweets:[],screenTime:'',deliveryHistory:[],assets:'',appstore:''});}
  function setCharacterPhone(f,d){setJSON('charPhone_'+f,d);}

  /* Weverse */
  function getWversePosts(){return getJSON('wv_posts',[]);}
  function saveWversePosts(a){setJSON('wv_posts',a);}
  function addWversePost(p){p.id=p.id||'wvp_'+Math.random().toString(36).slice(2,9);p.ts=p.ts||Date.now();p.likes=0;p.liked=false;p.comments=p.comments||[];var l=getWversePosts();l.unshift(p);if(l.length>200)l=l.slice(0,200);saveWversePosts(l);return p;}
  function deleteWversePost(pid){saveWversePosts(getWversePosts().filter(function(p){return p.id!==pid;}));}
  function toggleWverseLike(pid){var l=getWversePosts();var p=l.find(function(x){return x.id===pid;});if(p){p.liked=!p.liked;p.likes=Math.max(0,p.likes+(p.liked?1:-1));}saveWversePosts(l);return p;}
  function addWverseComment(pid,comment){var l=getWversePosts();var p=l.find(function(x){return x.id===pid;});if(p){if(!p.comments)p.comments=[];p.comments.push(comment);}saveWversePosts(l);}
  function getWverseLetters(){return getJSON('wv_letters',[]);}
  function saveWverseLetters(a){setJSON('wv_letters',a);}
  function addWverseLetter(letter){letter.id=letter.id||'wvl_'+Math.random().toString(36).slice(2,9);letter.ts=letter.ts||Date.now();var l=getWverseLetters();l.unshift(letter);if(l.length>100)l=l.slice(0,100);saveWverseLetters(l);return letter;}

  /* Bubble */
  function getBubbleSubscriptions(){return getJSON('bb_subs',[]);}
  function saveBubbleSubscriptions(a){setJSON('bb_subs',a);}
  function addBubbleSubscription(artistId){var l=getBubbleSubscriptions();if(l.indexOf(artistId)<0)l.push(artistId);saveBubbleSubscriptions(l);}
  function removeBubbleSubscription(artistId){saveBubbleSubscriptions(getBubbleSubscriptions().filter(function(id){return id!==artistId;}));}
  function getBubbleMessages(artistId){return getJSON('bb_msg_'+artistId,[]);}
  function saveBubbleMessages(artistId,a){setJSON('bb_msg_'+artistId,a);}
  function addBubbleMessage(artistId,msg){msg.id=msg.id||'bbm_'+Math.random().toString(36).slice(2,9);msg.ts=msg.ts||Date.now();var l=getBubbleMessages(artistId);l.push(msg);if(l.length>300)l=l.slice(l.length-300);saveBubbleMessages(artistId,l);}

  /* Language */
  var LANGUAGES=[
    {code:'zh',name:'Chinese',flag:'CN'},
    {code:'en',name:'English',flag:'EN'},
    {code:'ja',name:'Japanese',flag:'JP'},
    {code:'ko',name:'Korean',flag:'KR'},
    {code:'fr',name:'French',flag:'FR'},
    {code:'de',name:'German',flag:'DE'},
    {code:'es',name:'Spanish',flag:'ES'},
    {code:'ru',name:'Russian',flag:'RU'},
    {code:'pt',name:'Portuguese',flag:'PT'},
    {code:'ar',name:'Arabic',flag:'AR'}
  ];
  function getLanguages(){return LANGUAGES;}
  function getConvLanguage(convId){return rawGet('lang_'+convId,'');}
  function setConvLanguage(convId,lang){rawSet('lang_'+convId,lang);}
  function getAutoTranslate(convId){return rawGet('autotrans_'+convId,'false')==='true';}
  function setAutoTranslate(convId,val){rawSet('autotrans_'+convId,String(!!val));}
  function getGlobalLanguage(){return rawGet('globalLang','');}
  function setGlobalLanguage(lang){rawSet('globalLang',lang);}

  return {
    get:get,set:set,remove:remove,clearAll:clearAll,
    getStorageUsageKB:getStorageUsageKB,getStoragePercent:getStoragePercent,
    getUsers:getUsers,saveUsers:saveUsers,getActiveUserId:getActiveUserId,setActiveUserId:setActiveUserId,
    getActiveUser:getActiveUser,upsertUser:upsertUser,deleteUser:deleteUser,
    getFriends:getFriends,saveFriends:saveFriends,upsertFriend:upsertFriend,deleteFriend:deleteFriend,normalizeFriend:normalizeFriend,
    getPinned:getPinned,savePinned:savePinned,isPinned:isPinned,togglePin:togglePin,
    getMessages:getMessages,saveMessages:saveMessages,appendMessage:appendMessage,deleteMessage:deleteMessage,clearMessages:clearMessages,
    getUnread:getUnread,setUnread:setUnread,addUnread:addUnread,clearUnread:clearUnread,
    getFriendStatus:getFriendStatus,setFriendStatus:setFriendStatus,simulateStatuses:simulateStatuses,
    getConvSettings:getConvSettings,setConvSettings:setConvSettings,DEFAULT_CONV_SETTINGS:DEFAULT_CONV_SETTINGS,getBubblePresets:getBubblePresets,
    getGroups:getGroups,saveGroups:saveGroups,upsertGroup:upsertGroup,deleteGroup:deleteGroup,
    incChatCount:incChatCount,getTodayChatCount:getTodayChatCount,getNoteSize:getNoteSize,getTokenUsed:getTokenUsed,addToken:addToken,
    getMoments:getMoments,saveMoments:saveMoments,addMoment:addMoment,deleteMoment:deleteMoment,toggleLikeMoment:toggleLikeMoment,addCommentToMoment:addCommentToMoment,
    getDarkMode:getDarkMode,setDarkMode:setDarkMode,
    getWorldBook:getWorldBook,saveWorldBook:saveWorldBook,addWorldBookEntry:addWorldBookEntry,updateWorldBookEntry:updateWorldBookEntry,deleteWorldBookEntry:deleteWorldBookEntry,
    getMemorySummary:getMemorySummary,setMemorySummary:setMemorySummary,
    getActiveCharacter:getActiveCharacter,setActiveCharacter:setActiveCharacter,
    getTemperature:getTemperature,setTemperature:setTemperature,
    exportAll:exportAll,importAll:importAll,
    getTimeSettings:getTimeSettings,setTimeSettings:setTimeSettings,getCharacterTimeStatus:getCharacterTimeStatus,
    recordVisit:recordVisit,getAwayMinutes:getAwayMinutes,DEFAULT_TIME_SETTINGS:DEFAULT_TIME_SETTINGS,
    getStructuredMemory:getStructuredMemory,setStructuredMemory:setStructuredMemory,
    addMemoryEntry:addMemoryEntry,removeMemoryEntry:removeMemoryEntry,
    clearStructuredMemory:clearStructuredMemory,buildMemoryPrompt:buildMemoryPrompt,
    getProactiveMessages:getProactiveMessages,addProactiveMessage:addProactiveMessage,clearProactiveMessages:clearProactiveMessages,
    getStickerGroups:getStickerGroups,saveStickerGroups:saveStickerGroups,
    addStickerGroup:addStickerGroup,deleteStickerGroup:deleteStickerGroup,renameStickerGroup:renameStickerGroup,
    addStickerToGroup:addStickerToGroup,removeStickerFromGroup:removeStickerFromGroup,
    getFriendStickerGroups:getFriendStickerGroups,setFriendStickerGroups:setFriendStickerGroups,
    getFriendStickers:getFriendStickers,buildStickerPrompt:buildStickerPrompt,
    getPlaylists:getPlaylists,savePlaylists:savePlaylists,addPlaylist:addPlaylist,
    deletePlaylist:deletePlaylist,updatePlaylist:updatePlaylist,
    addTrackToPlaylist:addTrackToPlaylist,removeTrackFromPlaylist:removeTrackFromPlaylist,
    getCharacterPlaylists:getCharacterPlaylists,
    getCurrentTrack:getCurrentTrack,setCurrentTrack:setCurrentTrack,
    getMusicState:getMusicState,setMusicState:setMusicState,
    isBlocked:isBlocked,setBlocked:setBlocked,
    getCharacterPhone:getCharacterPhone,setCharacterPhone:setCharacterPhone,
    getWversePosts:getWversePosts,saveWversePosts:saveWversePosts,addWversePost:addWversePost,
    deleteWversePost:deleteWversePost,toggleWverseLike:toggleWverseLike,addWverseComment:addWverseComment,
    getWverseLetters:getWverseLetters,saveWverseLetters:saveWverseLetters,addWverseLetter:addWverseLetter,
    getBubbleSubscriptions:getBubbleSubscriptions,saveBubbleSubscriptions:saveBubbleSubscriptions,
    addBubbleSubscription:addBubbleSubscription,removeBubbleSubscription:removeBubbleSubscription,
    getBubbleMessages:getBubbleMessages,saveBubbleMessages:saveBubbleMessages,addBubbleMessage:addBubbleMessage,
    getLanguages:getLanguages,getConvLanguage:getConvLanguage,setConvLanguage:setConvLanguage,
    getAutoTranslate:getAutoTranslate,setAutoTranslate:setAutoTranslate,
    getGlobalLanguage:getGlobalLanguage,setGlobalLanguage:setGlobalLanguage
  };
})();

