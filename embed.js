/* MISMO Business Glossary: the loader (Perry, 13 Nov 2026). Its address never changes:
 *   https://resources.mismo.org/glossary/embed.js
 * It reads version.json beside it on every load, so whatever the glossary publishes shows at once, then loads the current
 * app-<fingerprint>.css and .js and mounts the glossary. The page gets one global, window.MISMO_GLOSSARY:
 *   MISMO_GLOSSARY.mount(element, {base, headerOffset, embedded})   returns a promise, settled once the terms are in
 *   MISMO_GLOSSARY.version                                          version.json's contents, once read
 * It also mounts itself on <div id="mm-glossary"> when it finds one that nothing has mounted, with any options the page
 * set beforehand in window.MISMO_GLOSSARY = {options: {...}}. See docs/embed.md. */
(function(){
  'use strict';
  var G = window.MISMO_GLOSSARY = window.MISMO_GLOSSARY || {};
  if(G.mount) return;   // loaded twice: the first copy stands
  var me = document.currentScript;
  var BASE = me && me.src ? me.src.replace(/[?#].*$/, '').replace(/[^\/]*$/, '') : 'https://resources.mismo.org/glossary/';
  var loading = null;

  function json(url){
    return fetch(url, {cache: 'no-cache'}).then(function(r){ if(!r.ok) throw new Error(url + ' returned ' + r.status); return r.json(); });
  }
  function add(tag, url){
    return new Promise(function(ok, no){
      var e = document.createElement(tag);
      if(tag === 'link'){ e.rel = 'stylesheet'; e.href = url; } else { e.src = url; e.async = false; }
      e.setAttribute('data-mm-glossary', '');
      e.onload = function(){ ok(e); };
      e.onerror = function(){ e.remove(); no(new Error(url + ' did not load')); };
      document.head.appendChild(e);
    });
  }
  function load(fresh){
    return json(BASE + 'version.json' + (fresh ? '?t=' + Date.now() : '')).then(function(v){
      G.version = v;
      return Promise.all([add('link', BASE + v.css), add('script', BASE + v.js)]);
    });
  }
  /* A publish replaces the app files. A page that read version.json just before one finds its files gone: it asks again. */
  function ready(){
    if(!loading) loading = load(false).catch(function(){ return load(true); }).then(function(){
      if(!G.app || !G.app.mount) throw new Error('the glossary\u2019s app file did not start');
    });
    return loading;
  }

  function mount(el, opts){
    el = el || document.getElementById('mm-glossary');
    if(!el) return Promise.reject(new Error('MISMO_GLOSSARY.mount: no element to draw the glossary in'));
    el.setAttribute('data-gl', '');   // claimed, so the automatic mount leaves it alone
    var o = Object.assign({base: BASE, embedded: true}, G.options || {}, opts || {});
    return ready().then(function(){ return G.app.mount(el, o); }, function(e){
      if(!el.firstChild) el.innerHTML = '<p style="margin:40px 0;font:inherit">The Business Glossary couldn\u2019t be loaded. Reload the page to try again.</p>';
      throw e;
    });
  }
  G.mount = mount;

  function auto(){
    var el = document.getElementById('mm-glossary');
    if(el && !el.hasAttribute('data-gl')) mount(el).catch(function(e){ console.error('MISMO_GLOSSARY:', e && e.message); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else setTimeout(auto, 0);
})();
