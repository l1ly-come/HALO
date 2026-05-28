(function(){
  'use strict';
  var audio=null,isPlaying=false,currentPl=null,currentIdx=0;

  function getAudio(){
    if(!audio){
      audio=new Audio();audio.volume=0.8;
      audio.addEventListener('ended',playNext);
      audio.addEventListener('timeupdate',updateProgress);
      audio.addEventListener('error',function(){Toast.error('Cannot play this track');isPlaying=false;updateUI();});
    }
    return audio;
  }
  function fmt(s){if(!s||isNaN(s))return '0:00';var m=Math.floor(s/60),sec=Math.floor(s%60);return m+':'+String(sec).padStart(2,'0');}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function render(){
    var panel=document.getElementById('music-panel');if(!panel)return;
    var pls=Storage.getPlaylists();var ct=Storage.getCurrentTrack();
    var nowTitle=ct?ct.title:'No track';var nowArtist=ct?(ct.artist||''):'';
    var plHtml='';
    if(!pls.length){plHtml='<div style="text-align:center;color:var(--text-3);padding:1.5rem;font-size:0.78rem">No playlists yet</div>';}
    else{plHtml=pls.map(function(pl){
      var isActive=currentPl&&currentPl.id===pl.id;
      return '<div class="m-pl-card'+(isActive?' m-pl-active':'')+'" data-pid="'+pl.id+'">'+
        '<div class="m-pl-info"><div class="m-pl-name">'+esc(pl.name)+'</div>'+
        '<div class="m-pl-count">'+(pl.tracks||[]).length+' tracks</div></div>'+
        '<div class="m-pl-btns">'+
          '<button class="m-pl-btn m-pl-play" data-pid="'+pl.id+'"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>'+
          '<button class="m-pl-btn m-pl-edit" data-pid="'+pl.id+'">Edit</button>'+
          '<button class="m-pl-btn m-pl-del" data-pid="'+pl.id+'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>'+
        '</div></div>';
    }).join('');}

    panel.innerHTML=
      '<div class="modal-header"><span class="modal-title">Music</span>'+
        '<button class="modal-close" data-close="music"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
      '<div class="m-player">'+
        '<div class="m-now">'+
          '<div class="m-disc'+(isPlaying?' m-spinning':'')+'"><div class="m-disc-inner"></div></div>'+
          '<div class="m-now-info"><div class="m-now-title">'+esc(nowTitle)+'</div><div class="m-now-artist">'+esc(nowArtist)+'</div></div>'+
        '</div>'+
        '<div class="m-progress"><span class="m-time" id="m-cur">0:00</span>'+
          '<div class="m-bar" id="m-bar"><div class="m-bar-fill" id="m-fill" style="width:0%"></div></div>'+
          '<span class="m-time" id="m-dur">0:00</span></div>'+
        '<div class="m-controls">'+
          '<button class="m-ctrl" id="m-prev"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>'+
          '<button class="m-ctrl m-ctrl-main" id="m-play">'+(isPlaying?
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>':
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>')+'</button>'+
          '<button class="m-ctrl" id="m-next"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6z"/></svg></button>'+
        '</div>'+
        '<div class="m-vol"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/></svg>'+
          '<input type="range" class="s-range" id="m-vol-range" min="0" max="1" step="0.05" value="'+(audio?audio.volume:0.8)+'" /></div>'+
      '</div>'+
      '<div class="m-section"><span>Playlists</span>'+
        '<button class="s-btn-sm" id="m-new-pl">+ New</button></div>'+
      '<div class="m-playlists" id="m-playlists">'+plHtml+'</div>';

    panel.querySelector('[data-close="music"]').addEventListener('click',function(){
      document.getElementById('modal-music').classList.remove('active');
    });
    bindEvents();
  }

  function bindEvents(){
    var playBtn=document.getElementById('m-play');if(playBtn)playBtn.addEventListener('click',togglePlay);
    var prevBtn=document.getElementById('m-prev');if(prevBtn)prevBtn.addEventListener('click',playPrev);
    var nextBtn=document.getElementById('m-next');if(nextBtn)nextBtn.addEventListener('click',playNext);
    var volRange=document.getElementById('m-vol-range');if(volRange)volRange.addEventListener('input',function(){getAudio().volume=parseFloat(this.value);});
    var bar=document.getElementById('m-bar');if(bar)bar.addEventListener('click',function(e){if(!audio||!audio.duration)return;var r=bar.getBoundingClientRect();audio.currentTime=(e.clientX-r.left)/r.width*audio.duration;});
    var newBtn=document.getElementById('m-new-pl');if(newBtn)newBtn.addEventListener('click',function(e){e.stopPropagation();showNewPl();});
    var plList=document.getElementById('m-playlists');
    if(plList)plList.addEventListener('click',function(e){
      var play=e.target.closest('.m-pl-play');
      var edit=e.target.closest('.m-pl-edit');
      var del=e.target.closest('.m-pl-del');
      if(play){e.stopPropagation();startPl(play.dataset.pid);}
      else if(edit){e.stopPropagation();showEditPl(edit.dataset.pid);}
      else if(del){e.stopPropagation();if(confirm('Delete playlist?')){Storage.deletePlaylist(del.dataset.pid);render();}}
    });
  }

  function startPl(pid){
    var pl=Storage.getPlaylists().find(function(p){return p.id===pid;});
    if(!pl||!pl.tracks||!pl.tracks.length){Toast.warn('Empty playlist');return;}
    currentPl=pl;currentIdx=0;playTrack(pl.tracks[0]);
  }

  function playTrack(track){
    if(!track||!track.src){Toast.warn('No audio source');return;}
    var a=getAudio();a.src=track.src;
    a.play().then(function(){isPlaying=true;Storage.setCurrentTrack(track);updateUI();})
    .catch(function(err){Toast.error('Play failed');console.warn(err);isPlaying=false;updateUI();});
  }

  function togglePlay(){
    var a=getAudio();
    if(isPlaying){a.pause();isPlaying=false;}
    else if(a.src){a.play().catch(function(e){console.warn(e);});isPlaying=true;}
    else if(currentPl&&currentPl.tracks.length){playTrack(currentPl.tracks[currentIdx]);return;}
    else{Toast.info('Select a playlist');return;}
    updateUI();
  }

  function playNext(){if(!currentPl||!currentPl.tracks.length)return;currentIdx=(currentIdx+1)%currentPl.tracks.length;playTrack(currentPl.tracks[currentIdx]);}
  function playPrev(){if(!currentPl||!currentPl.tracks.length)return;currentIdx=(currentIdx-1+currentPl.tracks.length)%currentPl.tracks.length;playTrack(currentPl.tracks[currentIdx]);}

  function updateUI(){
    var btn=document.getElementById('m-play');
    if(btn)btn.innerHTML=isPlaying?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    var disc=document.querySelector('.m-disc');if(disc)disc.classList.toggle('m-spinning',isPlaying);
    var ct=Storage.getCurrentTrack();
    var t=document.querySelector('.m-now-title');if(t)t.textContent=ct?ct.title:'No track';
    var a=document.querySelector('.m-now-artist');if(a)a.textContent=ct?(ct.artist||''):'';
  }

  function updateProgress(){
    if(!audio||!audio.duration)return;
    var pct=(audio.currentTime/audio.duration)*100;
    var fill=document.getElementById('m-fill');if(fill)fill.style.width=pct+'%';
    var cur=document.getElementById('m-cur');if(cur)cur.textContent=fmt(audio.currentTime);
    var dur=document.getElementById('m-dur');if(dur)dur.textContent=fmt(audio.duration);
  }

  function showNewPl(){
    var ov=document.createElement('div');ov.className='inner-modal-overlay';
    ov.innerHTML='<div class="inner-modal" style="max-width:300px"><div class="modal-header"><span class="modal-title">New Playlist</span><button class="modal-close" id="npl-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div><div class="settings-item"><label class="settings-label">Name</label><input id="npl-name" class="s-input" placeholder="My Playlist" /></div><button class="s-btn" id="npl-save" style="width:100%;margin-top:0.3rem">Create</button></div>';
    document.body.appendChild(ov);
    document.getElementById('npl-close').addEventListener('click',function(){ov.remove();});
    ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
    document.getElementById('npl-save').addEventListener('click',function(){
      var name=(document.getElementById('npl-name').value||'').trim();
      if(!name){Toast.warn('Enter a name');return;}
      Storage.addPlaylist({name:name,tracks:[]});
      ov.remove();Toast.success('Created');render();
    });
  }

  function showEditPl(pid){
    var pl=Storage.getPlaylists().find(function(p){return p.id===pid;});if(!pl)return;
    var ov=document.createElement('div');ov.className='inner-modal-overlay';

    function renderTracks(){
      pl=Storage.getPlaylists().find(function(p){return p.id===pid;});
      var html='';
      if(!pl.tracks||!pl.tracks.length)html='<div style="text-align:center;color:var(--text-3);padding:0.5rem;font-size:0.72rem">No tracks</div>';
      else html=pl.tracks.map(function(t,i){
        return '<div class="m-track-row"><span class="m-track-num">'+(i+1)+'</span>'+
          '<div class="m-track-info"><div class="m-track-title">'+esc(t.title)+'</div><div class="m-track-artist">'+esc(t.artist||'')+'</div></div>'+
          '<button class="m-track-play" data-idx="'+i+'"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>'+
          '<button class="m-track-del" data-tid="'+t.id+'">x</button></div>';
      }).join('');
      var c=document.getElementById('epl-tracks');if(c)c.innerHTML=html;
    }

    ov.innerHTML='<div class="inner-modal" style="max-width:380px"><div class="modal-header"><span class="modal-title">'+esc(pl.name)+'</span><button class="modal-close" id="epl-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
      '<div class="m-track-list" id="epl-tracks"></div>'+
      '<div style="display:flex;gap:0.25rem;margin-top:0.3rem">'+
        '<button class="s-btn-sm" id="epl-add-url" style="flex:1">+ URL</button>'+
        '<button class="s-btn-sm" id="epl-add-file" style="flex:1">+ File</button>'+
      '</div></div>';
    document.body.appendChild(ov);renderTracks();
    document.getElementById('epl-close').addEventListener('click',function(){ov.remove();render();});
    ov.addEventListener('click',function(e){if(e.target===ov){ov.remove();render();}});

    document.getElementById('epl-tracks').addEventListener('click',function(e){
      var playB=e.target.closest('.m-track-play');
      var delB=e.target.closest('.m-track-del');
      if(playB){var idx=parseInt(playB.dataset.idx,10);currentPl=pl;currentIdx=idx;playTrack(pl.tracks[idx]);}
      else if(delB){Storage.removeTrackFromPlaylist(pid,delB.dataset.tid);renderTracks();}
    });

    document.getElementById('epl-add-url').addEventListener('click',function(e){
      e.stopPropagation();
      var ov2=document.createElement('div');ov2.className='inner-modal-overlay';
      ov2.innerHTML='<div class="inner-modal" style="max-width:320px"><div class="modal-header"><span class="modal-title">Add Track</span><button class="modal-close" id="at-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
        '<div class="settings-item"><label class="settings-label">Title</label><input id="at-title" class="s-input" /></div>'+
        '<div class="settings-item"><label class="settings-label">Artist</label><input id="at-artist" class="s-input" /></div>'+
        '<div class="settings-item"><label class="settings-label">Audio URL</label><input id="at-src" class="s-input" placeholder="https://...mp3" /></div>'+
        '<div style="display:flex;gap:0.2rem;margin-top:0.3rem"><button class="s-btn s-btn-outline" id="at-test" style="flex:1">Test</button><button class="s-btn" id="at-save" style="flex:1">Add</button></div></div>';
      document.body.appendChild(ov2);
      document.getElementById('at-close').addEventListener('click',function(){ov2.remove();});
      ov2.addEventListener('click',function(ev){if(ev.target===ov2)ov2.remove();});

      document.getElementById('at-test').addEventListener('click',function(ev){
        ev.stopPropagation();
        var src=document.getElementById('at-src').value.trim();
        if(!src){Toast.warn('Enter URL');return;}
        var testA=new Audio(src);testA.volume=0.5;
        testA.play().then(function(){Toast.success('Playing!');setTimeout(function(){testA.pause();testA.src='';},3000);})
        .catch(function(){Toast.error('Cannot play');});
      });

      document.getElementById('at-save').addEventListener('click',function(ev){
        ev.stopPropagation();
        var title=document.getElementById('at-title').value.trim()||'Untitled';
        var artist=document.getElementById('at-artist').value.trim()||'';
        var src=document.getElementById('at-src').value.trim();
        if(!src){Toast.warn('Enter URL');return;}
        Storage.addTrackToPlaylist(pid,{title:title,artist:artist,src:src});
        ov2.remove();renderTracks();Toast.success('Added');
      });
    });

    /* 修复：本地文件使用 base64 而非 createObjectURL */
    document.getElementById('epl-add-file').addEventListener('click',function(e){
      e.stopPropagation();
      var inp=document.createElement('input');inp.type='file';inp.accept='audio/*';inp.multiple=true;
      inp.addEventListener('change',function(){
        var files=Array.from(inp.files);
        if(!files.length)return;
        var processed=0;
        var skipped=0;
        files.forEach(function(file){
          /* 限制单个文件 8MB */
          if(file.size>8*1024*1024){
            Toast.warn(file.name+' too large (>8MB), skipped');
            skipped++;
            processed++;
            if(processed===files.length){
              Toast.success((files.length-skipped)+' added');
              renderTracks();
            }
            return;
          }
          var reader=new FileReader();
          reader.onload=function(){
            var name=file.name.replace(/\.[^.]+$/,'');
            Storage.addTrackToPlaylist(pid,{title:name,artist:'Local',src:reader.result});
            processed++;
            if(processed===files.length){
              Toast.success((files.length-skipped)+' added');
              renderTracks();
            }
          };
          reader.onerror=function(){
            Toast.error('Failed to read '+file.name);
            processed++;
            skipped++;
            if(processed===files.length) renderTracks();
          };
          reader.readAsDataURL(file);
        });
      });
      inp.click();
    });
  }

  document.addEventListener('modalOpen',function(e){if(e.detail&&e.detail.name==='music')render();});

  window.MusicPlayer={render:render,togglePlay:togglePlay,playNext:playNext,playPrev:playPrev,
    isPlaying:function(){return isPlaying;},
    getListenTogetherInfo:function(){if(!isPlaying||!currentPl)return null;var ct=Storage.getCurrentTrack();if(!ct)return null;return{title:ct.title,artist:ct.artist||'',playlistName:currentPl.name};}
  };
})();

