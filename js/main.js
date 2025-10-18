// main.js - clean single file
// visitor counter, guestbook, sprinkle captions, defensive include loader

// make a small HTML-escape helper available globally so multiple modules can use it
window.escapeHtml = function(s){ return String(s===null||s===undefined?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };

(function(){
  function el(id){ return document.getElementById(id); }

  // Visitor counter
  try{
    var key = 'retro_visitors_v1';
    var n = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, n);
    if(el('visitor-count')) el('visitor-count').textContent = n;
  }catch(e){ if(el('visitor-count')) el('visitor-count').textContent = 'n/a'; }

  // Guestbook
  var form = document.getElementById('guest-form');
  var entriesEl = document.getElementById('guest-entries');
  var storageKey = 'retro_guestbook_v1';

  // local alias (calls global helper)
  function escapeHtml(s){ return window.escapeHtml(s); }

  function loadEntries(){
    if(!entriesEl) return;
    var raw = localStorage.getItem(storageKey);
    var arr = raw? JSON.parse(raw): [];
    entriesEl.innerHTML = '';
    if(arr.length===0){ entriesEl.innerHTML = '<div class="hint">No entries yet — be the first!</div>'; return }
    arr.slice().reverse().forEach(function(entry){
      var d = document.createElement('div'); d.className='entry';
      var when = new Date(entry.t).toLocaleString();
      d.innerHTML = '<strong>'+escapeHtml(entry.n)+'</strong> <span style="color:#666;font-size:12px">('+when+')</span><p>'+escapeHtml(entry.m)+'</p>';
      entriesEl.appendChild(d);
    });
  }

  if(form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var name = document.getElementById('guest-name').value.trim() || 'Anonymous';
      var msg = document.getElementById('guest-msg').value.trim();
      if(!msg) return;
      var raw = localStorage.getItem(storageKey);
      var arr = raw? JSON.parse(raw): [];
      arr.push({n:name,m:msg,t:Date.now()});
      localStorage.setItem(storageKey, JSON.stringify(arr));
      document.getElementById('guest-name').value='';
      document.getElementById('guest-msg').value='';
      loadEntries();
    });
  }

  var clearBtn = document.getElementById('clear-guest');
  if(clearBtn){ clearBtn.addEventListener('click', function(){ if(confirm('Clear guestbook?')){ localStorage.removeItem(storageKey); loadEntries(); } }); }

  // display year
  var y = new Date().getFullYear(); if(document.getElementById('year')) document.getElementById('year').textContent = y;

  loadEntries();

  // Sprinkle captions
  (function(){
    var jokes = [
      "I'm reading a book about anti-gravity. It's impossible to put down!",
      "Why did the scarecrow win an award? Because he was outstanding in his field.",
      "I would tell you a joke about construction, but I'm still working on it.",
      "Did you hear about the restaurant on the moon? Great food, no atmosphere.",
      "I used to play piano by ear, but now I use my hands.",
      "Why don't skeletons fight each other? They don't have the guts.",
      "I'm on a seafood diet. I see food and I eat it.",
      "Why did the tomato blush? Because it saw the salad dressing!",
      "Why don't eggs tell jokes? They'd crack each other up.",
      "How do you organize a space party? You planet."
    ];
    function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    var caps = document.querySelectorAll('.sprinkle-caption');
    caps.forEach(function(c){ c.textContent = rand(jokes); });
  })();

  // Make polaroids draggable so users can move decorations away from content.
  (function(){
    var dragging = null;
    var offsetX = 0, offsetY = 0;

    function savePos(el){
      try{
        var rect = el.getBoundingClientRect();
        var key = 'polaroid_pos_' + (el.dataset.polaroidId || el.className.replace(/\s+/g,'_'));
        var data = {left: rect.left, top: rect.top};
        localStorage.setItem(key, JSON.stringify(data));
      }catch(e){}
    }

    function loadSavedPos(el){
      try{
        var key = 'polaroid_pos_' + (el.dataset.polaroidId || el.className.replace(/\s+/g,'_'));
        var raw = localStorage.getItem(key); if(!raw) return false;
        var o = JSON.parse(raw); if(!o) return false;
  el.style.position='fixed'; el.style.left = Math.round(o.left) + 'px'; el.style.top = Math.round(o.top) + 'px'; el.style.zIndex='10000';
              // ensure media inside polaroid won't intercept pointer events and will autoplay
              try{
                var mv = el.querySelectorAll('video, img');
                mv.forEach(function(m){ try{ m.style.pointerEvents = 'none'; }catch(e){} });
                var v = el.querySelector('video');
                if(v){
                  try{ v.muted = true; v.setAttribute('playsinline',''); v.playsInline = true; v.preload = 'auto'; v.load(); v.play && v.play().catch(function(){ /* ignore */ }); }catch(e){}
                }
              }catch(e){}
  // ensure any video inside the polaroid continues to play
  try{ var v = el.querySelector('video'); if(v){ v.muted = true; v.playsInline = true; v.play && v.play().catch(function(){}); } }catch(e){}
        return true;
      }catch(e){return false}
    }

      // helper to extract rotation angle from computed transform (in degrees)
      function getOriginalRotation(el){
        try{
          var st = window.getComputedStyle(el);
          var tf = st.transform || st.webkitTransform;
          if(!tf || tf === 'none') return 0;
          // matrix(a,b,c,d,tx,ty) => angle = Math.atan2(b, a)
          var m = tf.match(/matrix\(([^)]+)\)/);
          if(m){
            var parts = m[1].split(',').map(parseFloat);
            var a = parts[0], b = parts[1];
            var ang = Math.round(Math.atan2(b, a) * (180/Math.PI));
            return ang;
          }
        }catch(e){}
        return 0;
      }

    function onPointerDown(e){
      e.preventDefault && e.preventDefault();
      var el = e.currentTarget;
      dragging = el;
      // cancel any pending putdown animation and mark dragging (lift)
      try{ el.classList.remove('putdown'); }catch(e){}
      // store original rotation so we can restore on drop
      try{ if(!el.dataset.origRotate) el.dataset.origRotate = getOriginalRotation(el); }catch(e){}
      el.classList.add('dragging');
      var rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
      if(el.setPointerCapture) try{ el.setPointerCapture(e.pointerId); }catch(er){}
    }

    function onPointerMove(e){
      if(!dragging) return;
      var x = e.clientX - offsetX, y = e.clientY - offsetY;
      var vw = window.innerWidth || document.documentElement.clientWidth;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var ew = dragging.offsetWidth || 84, eh = dragging.offsetHeight || 84;
      var minMargin = 8;
      x = Math.min(Math.max(x, minMargin), Math.max(minMargin, vw - ew - minMargin));
      y = Math.min(Math.max(y, minMargin), Math.max(minMargin, vh - eh - minMargin));
      dragging.style.left = Math.round(x) + 'px';
      dragging.style.top = Math.round(y) + 'px';
      // visually lift while dragging but preserve rotation
      try{
        var r = parseFloat(dragging.dataset.origRotate || 0) || 0;
        dragging.style.transform = 'translateY(-8px) scale(1.06) rotate('+r+'deg)';
      }catch(e){}
    }

    function onPointerUp(e){
      if(!dragging) return;
      // capture the element and its rotation so callbacks don't rely on the shared `dragging` var
      var el = dragging;
      try{ el.classList.remove('dragging'); if(el.releasePointerCapture) el.releasePointerCapture(e.pointerId); }catch(e){}
      // play the putdown animation: set transform to settle while including rotation
      try{
        var r = parseFloat(el.dataset.origRotate || 0) || 0;
        el.style.transform = 'translateY(2px) scale(1.02) rotate(' + r + 'deg)';
        el.classList.add('putdown');
        var once = function _ae(){
          try{ el.classList.remove('putdown'); el.style.transform = 'rotate(' + r + 'deg)'; }catch(e){}
          try{ el.removeEventListener('animationend', once); }catch(e){}
        };
        try{ el.addEventListener('animationend', once); }catch(e){}
      }catch(e){}
      savePos(el);
      // as a last attempt, ensure videos are playing after user interaction
      try{ var vv = el.querySelector('video'); if(vv){ vv.muted = true; vv.loop = true; vv.setAttribute('playsinline',''); vv.play && vv.play().catch(function(){}); } }catch(e){}
      dragging = null;
    }

    function attach(){
      var nodes = document.querySelectorAll('.polaroid-border');
      nodes.forEach(function(n, idx){
        // ensure each polaroid has a stable id for storage
        if(!n.dataset.polaroidId) n.dataset.polaroidId = 'p' + (idx+1);
        loadSavedPos(n);
        // also ensure videos autoplay after initial placement
          // also ensure videos autoplay after initial placement and disable pointer events on media
          try{ 
            var v = n.querySelector('video'); 
            var imgs = n.querySelectorAll('img,video'); 
            imgs.forEach(function(m){ try{ m.style.pointerEvents='none'; }catch(e){} }); 
            if(v){ 
              v.muted = true; 
              v.setAttribute('playsinline',''); 
              v.playsInline = true; 
              v.preload='auto'; 
              v.load(); 
              v.play && v.play().catch(function(){}); 
            } 
          }catch(e){}
        n.addEventListener('pointerdown', onPointerDown);
      });
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      // dblclick on container to reset saved positions
      var container = document.querySelector('.border-polaroids');
      if(container) container.addEventListener('dblclick', function(){
        var nodes = document.querySelectorAll('.polaroid-border');
        nodes.forEach(function(n){ try{ localStorage.removeItem('polaroid_pos_' + n.dataset.polaroidId); }catch(e){} });
        try{ posPolaroids(); }catch(e){}
      });
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
  })();

})();

/* Includes + projects (defensive) */
(function(){
  function sanitizeInclude(text){
    if(!text) return text;
    var t = String(text).trim();
    if(t.indexOf('```') !== -1){
      var parts = t.split('\n');
      if(parts[0] && parts[0].trim().startsWith('```')) parts.shift();
      if(parts.length && parts[parts.length-1].trim().startsWith('```')) parts.pop();
      t = parts.join('\n').trim();
    }
    return t;
  }

  function loadIncludes(){
    var nodes = document.querySelectorAll('[data-include]');
    if(!nodes || nodes.length===0){ console.debug('include loader: no [data-include] elements found'); return }
    nodes.forEach(function(el){
      var url = el.getAttribute('data-include');
      console.debug('include loader: fetching', url);
      // show a small loading hint while we fetch
      try{ el.innerHTML = '<div class="hint">Loading '+escapeHtml(url)+' ...</div>'; }catch(e){}
      fetch(url).then(function(res){ if(!res.ok) throw new Error('HTTP '+res.status); return res.text(); }).then(function(txt){
        var sanitized;
        try{
          sanitized = sanitizeInclude(txt);
        }catch(errSan){
          console.error('sanitizeInclude threw for', url, errSan);
          el.innerHTML = '<div class="hint">Failed to sanitize '+escapeHtml(url)+': '+escapeHtml(String(errSan))+'</div>';
          return;
        }
        try{
          el.innerHTML = sanitized;
        }catch(errSet){
          console.error('setting innerHTML failed for', url, errSet);
          try{ el.innerHTML = '<div class="hint">Failed to insert '+escapeHtml(url)+': '+escapeHtml(String(errSet))+'</div>'; }catch(e){}
          return;
        }
        // normalize image/video/src paths inside included fragments (remove leading '/'
        // so hosting under a subpath still works)
        try{ normalizeIncludedImageSrcs(el); }catch(e){ console.warn('normalizeIncludedImageSrcs missing or failed', e); }
        // normalize image srcs and make included images resilient
        try{ fixIncludedImages(el); }catch(e){ console.warn('fixIncludedImages failed', e); }
        // populate sprinkle captions inside newly included content
        try{ populateSprinkleCaptions(el); }catch(e){}
        // mark loaded
        try{ el.dataset.includeLoaded = 'true'; }catch(e){}
        runAfterInclude(el);
      }).catch(function(err){ console.warn('include failed', url, err); try{ el.innerHTML = '<div class="hint">Failed to load '+escapeHtml(url)+': '+escapeHtml(String(err))+'</div>'; }catch(e){} });
    });
  }

  // look for <img> tags inside an included fragment, prefetch their src (HEAD) and attach
  // an onerror handler which replaces failed images with a friendly fallback.
  function fixIncludedImages(container){
    if(!container) return;
    var imgs = container.querySelectorAll('img');
    imgs.forEach(function(img){
      var src = img.getAttribute('src');
      if(!src) return;
      console.debug('include image check:', src);
      // If src is a root-absolute path (starts with '/') convert it to a relative path
      // so deployments under a subpath (e.g. GitHub Pages project sites) still resolve.
      try{
        if(src.charAt(0) === '/' && !src.startsWith('//')){
          var rel = src.slice(1); // remove leading slash
          img.setAttribute('src', rel);
          src = rel;
        }
      }catch(e){}
      // attach onerror fallback
      img.addEventListener('error', function onerr(){
        img.removeEventListener('error', onerr);
        console.warn('image failed to load:', src);
        // show a small visual fallback (use kitter.jpeg from assets)
        try{ img.dataset._failedSrc = src; img.src = '/assets/kitter.jpeg'; img.classList.add('img-missing'); }
        catch(e){ console.warn('failed to set fallback image', e); }
        // add a short hint below image if not already present
        try{
          var note = document.createElement('div'); note.className='hint'; note.textContent = 'Image failed to load: ' + src; 
          if(img.nextSibling && img.nextSibling.classList && img.nextSibling.classList.contains('hint')) return; 
          img.parentNode && img.parentNode.insertBefore(note, img.nextSibling);
        }catch(e){ /* ignore */ }
      });
      // try a quick HEAD fetch to detect missing file (same-origin). If it fails, trigger error handler
      try{
        fetch(src, {method:'HEAD'}).then(function(r){ if(!r.ok) { img.dispatchEvent(new Event('error')); } }).catch(function(){ img.dispatchEvent(new Event('error')); });
      }catch(e){ /* ignore fetch errors */ }
    });
  }

  // Normalize any root-absolute src attributes inside included fragments so they work
  // when the site is hosted under a subpath (GitHub Pages project sites, etc.). This
  // will rewrite src="/assets/foo.jpg" to "assets/foo.jpg" on images and videos.
  function normalizeIncludedImageSrcs(container){
    if(!container) return;
    var sel = container.querySelectorAll('img, video, source');
    sel.forEach(function(node){
      try{
        var s = node.getAttribute('src');
        if(s && s.charAt(0) === '/' && !s.startsWith('//')){
          node.setAttribute('src', s.slice(1));
        }
        // also handle <source srcset> or <source src>
        var srcset = node.getAttribute('srcset');
        if(srcset && srcset.indexOf('/')===0){
          node.setAttribute('srcset', srcset.replace(/(^|\s)\/(\S+)/g, function(m, p1, p2){ return p1 + p2; }));
        }
        if(node.tagName && node.tagName.toLowerCase() === 'source'){
          var ss = node.getAttribute('src'); if(ss && ss.charAt(0) === '/' && !ss.startsWith('//')) node.setAttribute('src', ss.slice(1));
        }
      }catch(e){ /* ignore */ }
    });
  }

  // populate sprinkle captions (same jokes array used earlier) for newly included fragments
  function populateSprinkleCaptions(container){
    if(!container) return;
    var jokes = [
      "I'm reading a book about anti-gravity. It's impossible to put down!",
      "Why did the scarecrow win an award? Because he was outstanding in his field.",
      "I would tell you a joke about construction, but I'm still working on it.",
      "Did you hear about the restaurant on the moon? Great food, no atmosphere.",
      "I used to play piano by ear, but now I use my hands.",
      "Why don't skeletons fight each other? They don't have the guts.",
      "I'm on a seafood diet. I see food and I eat it.",
      "Why did the tomato blush? Because it saw the salad dressing!",
      "Why don't eggs tell jokes? They'd crack each other up.",
      "How do you organize a space party? You planet."
    ];
    function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    var caps = container.querySelectorAll('.sprinkle-caption');
    caps.forEach(function(c){ c.textContent = rand(jokes); });
  }

  function runAfterInclude(container){
    var listEl = container.querySelector('#projects-list') || document.getElementById('projects-list');
    if(listEl){
  console.debug('projects loader: fetching data/games.json');
  // use a relative path so this works if the site is hosted under a pathname
  fetch('data/games.json').then(function(res){ if(!res.ok) throw new Error('HTTP '+res.status); return res.json(); }).then(function(list){
        var out = '';
        list.forEach(function(item){
          out += '<div class="project">\n';
          out += '<h3>' + escapeHtml(item.title) + '</h3>\n';
          out += '<p>' + escapeHtml(item.description) + '</p>\n';
          out += '<p><a href="' + escapeHtml(item.site) + '" target="_blank">View</a> | <a href="' + escapeHtml(item.source) + '" target="_blank">Source</a></p>\n';
          out += '</div>\n';
        });
        listEl.innerHTML = out;
      }).catch(function(e){ console.warn('games.json load failed', e); try{ listEl.innerHTML = '<div class="hint">Failed to load projects (see console)</div>'; }catch(err){} });
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadIncludes); else loadIncludes();
})();

  /* Position border polaroids dynamically so they stay outside the main .page and don't
     overlap content or get pushed off-screen. This runs on load and resize. */
  (function(){
    function posPolaroids(){
      try{
        var page = document.querySelector('.page');
        var container = document.querySelector('.border-polaroids');
        if(!page || !container) return;
        var rect = page.getBoundingClientRect();
        var left = rect.left, top = rect.top, w = rect.width, h = rect.height;
        var margin = 28; // how far outside the page to place them

        // helper to set fixed left/top and clamp to viewport so polaroids never go off-screen
        function setPos(sel, x, y){
          var el = document.querySelector(sel); if(!el) return;
          try{
            var vw = (window.innerWidth || document.documentElement.clientWidth);
            var vh = (window.innerHeight || document.documentElement.clientHeight);
            var ew = el.offsetWidth || 84;
            var eh = el.offsetHeight || 84;
            var minMargin = 8; // minimal gap from viewport edge
            // compute clamped coordinates
            var cx = Math.round(Math.min(Math.max(x, minMargin), Math.max(minMargin, vw - ew - minMargin)));
            var cy = Math.round(Math.min(Math.max(y, minMargin), Math.max(minMargin, vh - eh - minMargin)));
            el.style.position = 'fixed';
            el.style.left = cx + 'px';
            el.style.top = cy + 'px';
            el.style.zIndex = '10000';
          }catch(e){
            // fallback to simple placement
            el.style.position='fixed'; el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.zIndex='10000';
          }
        }

        // left column
        setPos('.polaroid-border.p1', left - margin - 84, top + h*0.06);
        setPos('.polaroid-border.p2', left - margin - 84, top + h*0.42);

        // bottom-ish (center-left / center-right)
        setPos('.polaroid-border.p3', left + Math.max(8, w*0.06), top + h + margin);
        setPos('.polaroid-border.p4', left + w*0.44, top + h + margin);

        // right column
        setPos('.polaroid-border.p5', left + w + margin, top + h*0.08);
        setPos('.polaroid-border.p6', left + w + margin + 8, top + h*0.18);
        setPos('.polaroid-border.p7', left + w + margin + 20, top + h*0.44);

        // top-ish
        setPos('.polaroid-border.p8', left + w*0.36, top - margin - 84);
        setPos('.polaroid-border.p9', left + w*0.48, top - margin - 84);
      }catch(e){ console.warn('posPolaroids failed', e); }
    }

    window.addEventListener('load', posPolaroids);
    window.addEventListener('resize', function(){ clearTimeout(window.__posPolaroidsTimer); window.__posPolaroidsTimer = setTimeout(posPolaroids, 120); });
    // run once after a short delay to allow layout/fonts/images to settle
    setTimeout(posPolaroids, 500);
  })();
