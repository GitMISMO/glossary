/* MISMO Business Glossary: the public glossary as one piece that mounts into a box (Perry, 13 Nov 2026).
   One source for both places it appears: the glossary page on mismo.org, which loads embed.js and mounts it into
   <div id="mm-glossary"> with {base, headerOffset, embedded: true}, and the standalone page at resources.mismo.org/glossary,
   which mounts it with {embedded: false} and draws its own copy of the website header and footer.
   Rules for sharing the page with the website (Jonna, 10 Nov 2026): no global name but window.MISMO_GLOSSARY; every
   element id starts gl-; the styles are scoped to #mm-glossary when built (tools/build-embed.py); data by full address;
   layers below z-index 1030 so the website's menu opens over them. See docs/embed.md. */
(function(){
var G = window.MISMO_GLOSSARY = window.MISMO_GLOSSARY || {};
if(G.app) return;   // loaded twice: the first copy stands
/* The website's sticky header, in pixels (60, or 90 with an administrator signed in); 0 on the standalone page. */
function headerOffset(OPT){ var h = OPT && OPT.headerOffset; try{ h = typeof h === 'function' ? h() : h; }catch(e){ h = 0; } h = Number(h); return h > 0 ? h : 0; }

async function main(ROOT,OPT){
'use strict';
const $=id=>document.getElementById(id);
const hdr=()=>headerOffset(OPT), docTop=el=>el.getBoundingClientRect().top+window.scrollY;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x).toLocaleString('en-US');
const LOGO=`<svg role="img" aria-label="MISMO" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 708 108"><g transform="translate(0.000000,108.000000) scale(0.100000,-0.100000)" fill="#0f314c"><path d="M5917 1065 c-169 -46 -279 -153 -335 -323 -21 -65 -25 -96 -25 -197
0 -101 4 -132 25 -197 57 -172 168 -280 335 -323 84 -22 723 -22 808 0 222 58
355 253 355 520 0 270 -132 459 -361 520 -74 20 -730 20 -802 0z m692 -320
c57 -33 76 -84 76 -200 0 -116 -19 -167 -76 -200 -32 -19 -52 -20 -294 -20
-297 0 -307 2 -346 83 -30 61 -31 198 -2 262 41 93 68 100 368 97 219 -2 243
-4 274 -22z M0 545 l0 -515 225 0 225 0 2 296 3 296 116 -294 116 -293 197 0 198
0 119 295 118 295 1 -297 0 -298 225 0 225 0 0 515 0 515 -337 -2 -338 -3
-104 -264 c-80 -204 -107 -260 -113 -245 -5 10 -52 129 -106 264 l-98 245
-337 3 -337 2 0 -515z M1892 1044 l-22 -15 0 -483 c0 -455 1 -484 18 -499 16 -15 48 -17
246 -17 128 0 235 4 246 10 32 17 34 57 4 95 -33 44 -64 143 -64 206 l0 49
203 0 c191 0 205 -1 222 -20 10 -11 34 -24 54 -30 49 -13 586 -13 612 0 22 12
26 62 7 78 -8 6 -174 15 -413 21 -502 15 -549 23 -628 110 -43 48 -57 93 -57
187 0 82 19 156 55 208 30 44 32 77 7 99 -27 25 -456 25 -490 1z M3716 1044 c-23 -22 -20 -31 19 -77 43 -49 78 -155 73 -218 l-3 -44
-204 -3 c-194 -2 -205 -1 -218 17 -24 35 -78 41 -355 41 -255 0 -269 -1 -288
-20 -27 -27 -26 -58 3 -70 12 -5 202 -14 422 -19 421 -12 476 -18 555 -62 92
-51 132 -159 111 -299 -12 -77 -34 -129 -77 -179 -23 -28 -25 -36 -16 -57 l12
-24 215 0 215 0 2 306 3 306 120 -303 120 -304 197 -3 196 -2 118 296 119 297
3 -296 2 -297 225 0 225 0 0 515 0 515 -338 0 -337 0 -104 -265 c-58 -146
-106 -263 -108 -261 -2 2 -50 120 -107 262 l-104 259 -340 3 c-300 2 -342 0
-356 -14z"/></g><g transform="translate(0.000000,108.000000) scale(0.100000,-0.100000)" fill="#50a4db"><path d="M2485 1046 c-44 -20 -111 -94 -136 -151 -27 -60 -37 -198 -20 -263
13 -48 68 -115 114 -138 64 -34 162 -43 562 -55 239 -6 405 -15 413 -21 19
-16 15 -66 -7 -78 -26 -13 -563 -13 -612 0 -20 6 -44 19 -54 30 -17 19 -31 20
-222 20 l-203 0 0 -49 c0 -81 34 -172 86 -230 78 -87 31 -81 672 -81 l568 0
46 29 c79 50 122 121 139 231 21 140 -19 248 -111 299 -79 44 -134 50 -555 62
-220 5 -410 14 -422 19 -29 12 -30 43 -3 70 19 19 33 20 288 20 277 0 331 -6
355 -41 13 -18 24 -19 218 -17 l204 3 3 44 c4 60 -31 168 -70 215 -17 21 -52
52 -77 67 l-45 29 -550 0 c-440 -1 -557 -3 -581 -14z"/></g></svg>`;
/* The two files the console publishes. no-cache: revalidate, so a new version shows at once
   (the server answers 304 when nothing changed, so this is a round trip, not a download). */
/* The MISMO website's header and footer, exactly (Perry, 18 Oct 2026; design A7, colours taken from the site): the
   white logo, the site's navigation with its menus (no Log in: the glossary is a separate application). */
const SITE='https://collaborate.mismo.org/mismowebsite';
const NAV=[['Membership','membership',[['MISMO Members','membership/member-directory'],['Our Lender Champions','membership/lender-champions'],['Our Industry Champions','membership/industry-champions'],['Innovation Investment Fund','membership/iif']]],
  ['Standards & Resources','standards-resources',[['Business Glossary','standards-resources/business-glossary'],['Certifications','standards-resources/certification'],['MISMO Link','standards-resources/mismo-link'],['Digital Mortgage Resource Center','standards-resources/digital-mortgage-resource-center']]],
  ['Get Involved','get-involved',[['Communities & Workgroups','get-involved/workgroups'],['Collaborate (Members Only)','get-involved/communities']]],
  ['Events','events',[['MISMO Summit','events/summit'],['Education','events/education']]],
  ['About MISMO','about-mismo',[['News','about-mismo/news'],['Contributor Awards','about-mismo/contributor-awards']]]];
const LOGO_REV=LOGO.replace('fill="#0f314c"','fill="#ffffff"').replace('fill="#50a4db"','fill="#75BFEA"');
const CHV='<svg class="chv" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SVGI=(d,w=20)=>`<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const DL_URL='https://collaborate.mismo.org/viewdocument/business-glossary';
const masthead=`<header class="mm-header">
  <a class="mm-logo" href="https://collaborate.mismo.org/mismowebsite/home"><img src="https://higherlogicdownload.s3.amazonaws.com/MISMO/LogoImages/6e07790a-6fc9-43dc-b9d6-9178e00c3342_mismo-reverse-nav-logo.png" alt="MISMO logo. This will take you to the homepage"></a>
  <nav aria-label="Main">
  <ul class="mm-nav" id="mm-nav">
    <li><a class="mm-nav-link" href="https://collaborate.mismo.org/mismowebsite/membership" aria-haspopup="true">Membership <svg class="mm-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <ul class="mm-dd">
        <li><a href="https://collaborate.mismo.org/mismowebsite/membership/member-directory">MISMO Members</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/membership/lender-champions">Our Lender Champions</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/membership/industry-champions">Our Industry Champions</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/membership/iif">Innovation Investment Fund</a></li>
      </ul>
    </li>
    <li><a class="mm-nav-link" href="https://collaborate.mismo.org/mismowebsite/standards-resources" aria-haspopup="true">Standards &amp; Resources <svg class="mm-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <ul class="mm-dd">
        <li><a href="https://collaborate.mismo.org/mismowebsite/standards-resources/business-glossary">Business Glossary</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/standards-resources/certification">Certifications</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/standards-resources/mismo-link">MISMO Link</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/standards-resources/digital-mortgage-resource-center">Digital Mortgage Resource Center</a></li>
      </ul>
    </li>
    <li><a class="mm-nav-link" href="https://collaborate.mismo.org/mismowebsite/get-involved" aria-haspopup="true">Get Involved <svg class="mm-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <ul class="mm-dd">
        <li><a href="https://collaborate.mismo.org/mismowebsite/get-involved/workgroups">Communities &amp; Workgroups</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/get-involved/communities">Collaborate (Members Only)</a></li>
      </ul>
    </li>
    <li><a class="mm-nav-link" href="https://collaborate.mismo.org/mismowebsite/events" aria-haspopup="true">Events <svg class="mm-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <ul class="mm-dd">
        <li><a href="https://collaborate.mismo.org/mismowebsite/events/summit">MISMO Summit</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/events/education">Education</a></li>
      </ul>
    </li>
    <li><a class="mm-nav-link" href="https://collaborate.mismo.org/mismowebsite/about-mismo" aria-haspopup="true">About MISMO <svg class="mm-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <ul class="mm-dd">
        <li><a href="https://collaborate.mismo.org/mismowebsite/about-mismo/news">News</a></li>
        <li><a href="https://collaborate.mismo.org/mismowebsite/about-mismo/contributor-awards">Contributor Awards</a></li>
      </ul>
    </li>
  </ul>
  </nav>
  <div class="mm-actions">
    <form class="mm-search" action="https://collaborate.mismo.org/mismowebsite/search" method="get" role="search">
      <input type="hidden" name="executeSearch" value="true"><input type="hidden" name="l" value="1">
      <input class="mm-search-in" type="search" name="SearchTerm" placeholder="Search..." aria-label="Search the MISMO website" tabindex="-1" onblur="if(!this.value.trim())this.form.classList.remove('is-open')">
      <button class="mm-search-btn" type="submit" aria-label="Search" onclick="var f=this.form;if(!f.classList.contains('is-open')||!f.SearchTerm.value.trim()){event.preventDefault();f.classList.add('is-open');f.SearchTerm.tabIndex=0;f.SearchTerm.focus();}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg></button>
    </form>
    <a class="mm-login" href="https://identity.mba.org/connect/authorize?client_id=Mba.HigherLogic.MismoMigration&amp;scope=openid+profile+email+id&amp;response_type=code&amp;redirect_uri=https%3A%2F%2Fcollaborate.mismo.org&amp;state=https%3a%2f%2fcollaborate.mismo.org%2fmismowebsite%2fhome">Log In</a>
  </div>
  <button type="button" class="mm-burger" aria-label="Open menu" aria-expanded="false" aria-controls="mm-nav"><span></span><span></span><span></span></button>
</header>`;
const footer=`<footer class="mm-footer"><div class="mm-footer-in"><span>MISMO &middot; 1919 M Street NW, 5th Floor, Washington, DC 20036 &middot; <a href="mailto:info@mismo.org">info@mismo.org</a></span><span>&copy; 2026 MISMO. All rights reserved.</span></div></footer>`;
/* The hero's skyline, as on the site: drawn, so nothing loads from elsewhere. */
const SKY=(()=>{ let x=30,seed=4,out=''; const r=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; }; const W=700,H=430;
  while(x<W){ const bw=[70,84,96,110,124][Math.floor(r()*5)], bh=150+Math.floor(r()*(H-170)), f=['#082237','#09243B','#0A2740'][Math.floor(r()*3)];
    out+=`<rect x="${x}" y="${H-bh}" width="${bw}" height="${bh}" fill="${f}"/>`; for(let k=0,m=1+Math.floor(r()*3);k<m;k++) out+=`<rect x="${x+6+Math.floor(r()*(bw-20))}" y="${H-bh+10+Math.floor(r()*80)}" width="7" height="9" fill="#1C4059"/>`;
    x+=bw+6+Math.floor(r()*16); }
  return `<svg class="sh-sky" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${out}<path d="M${W*.42} ${H} L${W} ${H-120}" stroke="#7D97AC" stroke-opacity=".55" stroke-width="2.2"/><path d="M${W*.62} ${H} L${W} ${H-60}" stroke="#7D97AC" stroke-opacity=".35" stroke-width="1.4"/></svg>`; })();
/* Suggest a Term (relay request 10). On, as it will be in production (Perry, 2 Nov 2026: the site isn't live yet). Until
   IT deploys request 10, sending one answers that it isn't switched on yet, and nothing typed is lost. */
const SUGGEST_LIVE=true;
/* The page itself (Perry, 13 Nov 2026, for mismo.org): drawn once before the terms arrive, with the hero, the search box
   (off until then) and a loading line, and again once they're in. Embedded on mismo.org, the website supplies the header
   and footer, so neither is drawn. */
const pageHTML=x=>(OPT.embedded?'':masthead)+`<div style="position: relative; overflow: hidden; background: #071d2e; min-height: clamp(380px,37vw,520px); display: flex; align-items: center; padding: clamp(34px,3.8vw,50px) clamp(20px,5vw,48px);"><!-- built-in Pathway artwork (shows until a photo is added) --> <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%; height: 100%;"> <defs> <linearGradient id="gl-skyhm" x1="0" y1="0" x2="0" y2="1"> <stop offset="0%" stop-color="#0d314c" stop-opacity="0"></stop> </linearGradient> <linearGradient id="gl-gndhm" x1="0" y1="0" x2="0" y2="1"> <stop offset="0%" stop-color="#0e3a5c"></stop><stop offset="100%" stop-color="#071d2e"></stop> </linearGradient> <radialGradient id="gl-glowhm" cx="50%" cy="50%" r="50%"> <stop offset="0%" stop-color="#74bfeb" stop-opacity=".42"></stop> <stop offset="100%" stop-color="#74bfeb" stop-opacity="0"></stop> </radialGradient> <linearGradient id="gl-trailhm" x1="0" y1="0" x2="1" y2="0"> <stop offset="0%" stop-color="#74bfeb" stop-opacity="0"></stop> <stop offset="45%" stop-color="#9ad4f4" stop-opacity=".95"></stop> <stop offset="100%" stop-color="#ffffff" stop-opacity=".55"></stop> </linearGradient> </defs> <rect x="0" y="0" width="1200" height="560" fill="url(#gl-gndhm)"></rect> <ellipse cx="930" cy="360" rx="420" ry="250" fill="url(#gl-glowhm)"></ellipse> <g fill="#0a2740" opacity="1"> <rect x="640" y="300" width="52" height="260"></rect><rect x="698" y="236" width="40" height="324"></rect> <rect x="744" y="318" width="60" height="242"></rect><rect x="810" y="186" width="48" height="374"></rect> <rect x="864" y="268" width="68" height="292"></rect><rect x="938" y="214" width="42" height="346"></rect> <rect x="986" y="296" width="56" height="264"></rect><rect x="1048" y="238" width="50" height="322"></rect> <rect x="1104" y="310" width="64" height="250"></rect><rect x="1174" y="258" width="44" height="302"></rect> </g> <rect x="560" y="548" width="660" height="12" fill="#0a2740"></rect> <g fill="#74bfeb" opacity=".30"> <rect x="684" y="222" width="5" height="7"></rect><rect x="696" y="246" width="5" height="7"></rect> <rect x="800" y="184" width="5" height="7"></rect><rect x="814" y="216" width="5" height="7"></rect> <rect x="860" y="258" width="5" height="7"></rect><rect x="884" y="290" width="5" height="7"></rect> <rect x="932" y="214" width="5" height="7"></rect><rect x="988" y="292" width="5" height="7"></rect> <rect x="1050" y="240" width="5" height="7"></rect><rect x="1108" y="312" width="5" height="7"></rect> </g> <g fill="none" stroke="url(#gl-trailhm)" stroke-linecap="round"> <path d="M470,620 C690,540 880,470 1250,398" stroke-width="13" opacity=".15"></path> <path d="M470,620 C690,540 880,470 1250,398" stroke-width="3"></path> <path d="M450,654 C680,572 890,500 1258,428" stroke-width="1.4" opacity=".7"></path> <path d="M520,684 C740,604 940,534 1264,464" stroke-width="7" opacity=".2"></path> <path d="M520,684 C740,604 940,534 1264,464" stroke-width="2" opacity=".85"></path> <path d="M580,712 C800,636 990,570 1272,500" stroke-width="1.2" opacity=".55"></path> </g> </svg> <!-- PHOTO LAYER -->
<div style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; background-image: none; background-size: cover; background-position: center right; background-repeat: no-repeat;"></div>
<!-- scrim: keeps the copy readable over any photo -->
<div style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(90deg,#071d2e 0%,rgba(7,29,46,.96) 30%,rgba(7,29,46,.80) 50%,rgba(7,29,46,.42) 72%,rgba(7,29,46,.22) 100%);"></div>
<div style="position: relative; z-index: 2; width: 100%; max-width: 1120px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 30px; align-items: center;">
<div style="flex: 1 1 440px; min-width: 0; max-width: 620px; margin-right: auto;">
<p style="margin: 0 0 14px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .14em; color: #74bfeb; font-family: inherit; line-height: 1.5;">Standards &amp; Resources</p>
<h1 style="margin: 0 0 18px; font-family: inherit; font-size: clamp(33px,5.3vw,53px); font-weight: bold; line-height: 1.04; letter-spacing: -.027em; color: #ffffff; text-shadow: 0 2px 18px rgba(7,29,46,.6);">Business Glossary<span style="display: block; color: #56b4f2;">Shared Definitions</span></h1>
<p style="margin: 0 0 12px; font-family: inherit; font-size: clamp(16.5px,1.8vw,19px); font-weight: 500; line-height: 1.5; color: #ffffff; max-width: 40ch;">Standard definitions for ${n(x.thousands)}+ terms used across the mortgage industry, maintained by MISMO’s communities and workgroups.</p>
<p id="gl-aVer" style="margin: 0; font-family: inherit; font-size: 15px; line-height: 1.6; color: #a9d8f3; max-width: 52ch;">${x.loading?'&nbsp;':'Latest version'}</p>
<div class="gl-tourcta"><button class="tour-btn" id="gl-gTourBtn" type="button" data-tour${x.loading?' disabled':''}><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>Start the Guided Tour</button><p>About two minutes, read aloud with captions. Pause, go back or skip ahead at any point, or just scroll and read.</p></div>
</div>
<div class="gl-cards"><a class="gl-card" href="${DL_URL}" target="_blank" rel="noopener" title="Opens MISMO Connect. Signing in is required."><b>Download the Glossary</b><span>The full release workbook, ${x.loading?'':`version ${esc(x.label||'')} ${x.stage==='final'?'Final':x.stage==='comment-period'?'(30-Day Comment Period)':''}, `}with every term and its classifications.</span><span class="f"><span class="who">Members Only</span><span class="go">Download&nbsp;&rarr;</span></span></a><${SUGGEST_LIVE?'button type="button" data-suggest':'div aria-disabled="true"'} class="gl-card"><b>Suggest a Term</b><span>Missing a term, or one that could be clearer? Tell the glossary team.</span><span class="f"><span class="who">Open to Everyone</span><span class="go${SUGGEST_LIVE?'':' soon'}">${SUGGEST_LIVE?'Suggest&nbsp;&rarr;':'Coming Soon'}</span></span></${SUGGEST_LIVE?'button':'div'}></div>
</div>
</div>
    <section class="gl-sec"><div class="gl-head"><div><h2 class="mm-h2">Search the Glossary</h2><p class="mm-lede">Type a term, a phrase or an acronym, or browse by letter. <span id="gl-aStats"></span></p></div></div>
      <label class="search"><span class="vh">Search the glossary</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="gl-aQ" type="search" placeholder="${x.loading?'Search the glossary':`Search ${n(x.total)} terms and definitions`}" autocomplete="off"${x.loading?' disabled':''}><button type="button" class="qx" id="gl-aQx" aria-label="Clear the search" tabindex="-1"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></label>
      <div class="scope3" id="gl-aScope" role="group" aria-label="Search in"></div></section>
    <nav class="A-az" aria-label="Jump to a letter"><div class="in" id="gl-aAz"></div></nav>
    <div class="A-body"><section class="A-main" id="gl-aMain" aria-live="polite">${x.loading?'<div class="boot">Loading the glossary\u2026</div>':''}</section><aside class="A-side" id="gl-aSide" aria-label="Classifications"></aside></div>`+(OPT.embedded?'':footer);
$('gl-page').innerHTML=pageHTML({loading:true,thousands:8000});
let G,REF;
try{
  const opts={cache:'no-cache'};
  [G,REF]=await Promise.all(['data/glossary.json','data/reference.json'].map(u=>fetch(OPT.base+u,opts).then(r=>{ if(!r.ok) throw new Error(u+' returned '+r.status); return r.json(); })));
}catch(e){
  $('gl-aMain').innerHTML=`<div class="boot"><h2>The glossary could not be loaded</h2><p>${esc(e.message)}. Reload the page to try again.</p></div>`; return;
}
const vocabOf=(key,field)=>{ const s=Object.keys(REF[key]||{}); for(const x of G.terms) for(const v of String(x[field]||'').split('|')) if(v&&!s.includes(v)) s.push(v);
  return s.sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase())); };
const D={meta:G.meta||{},ref:REF,areas:vocabOf('focusAreas','focusArea'),types:vocabOf('termTypes','termType'),sources:vocabOf('sources','source')};
const ix=(list,val)=>String(val||'').split('|').filter(Boolean).map(v=>list.indexOf(v)).filter(x=>x>-1);
/* Plain alphabetical, not numeric: "203K" is a programme name, not a quantity. */
const flat=s=>String(s||'').replace(/\s+/g,' ').trim();
G.terms.sort((a,b)=>flat(a.term).toLowerCase().localeCompare(flat(b.term).toLowerCase(),'en'));
D.terms=G.terms.map(x=>[x.term,x.definition||'',ix(D.types,x.termType),ix(D.areas,x.focusArea),ix(D.sources,x.source),x.id,x.aka||[],x.related||[]]);
const V={fa:D.areas,tt:D.types,src:D.sources};
const DESC={fa:D.ref.focusAreas||{},tt:D.ref.termTypes||{},src:D.ref.sources||{}};
const KIND={fa:{label:'Focus Areas',one:'Focus Area'},tt:{label:'Term Types',one:'Term Type'},src:{label:'Sources',one:'Source'}};
const desc=(k,v)=>{ const d=DESC[k][v]; return d&&d!=='__UNDOCUMENTED__'?d:''; };
const slug=s=>flat(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const readable=v=>String(v).replace(/^#/,'').replace(/(?<=[a-z]{2})(?=[A-Z])/g,' ').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2');
const bySlug=new Map();
const T=D.terms.map((r,i)=>{ const t={i,term:r[0],def:r[1],tt:r[2],fa:r[3],src:r[4],id:r[5],akaIds:r[6],relIds:r[7]};
  t.lt=t.term.toLowerCase(); t.ld=t.def.toLowerCase(); let sl=slug(t.term); if(bySlug.has(sl)) sl=sl+'-'+String(t.id).slice(0,6); t.slug=sl; bySlug.set(sl,t);
  const c=t.term.replace(/^[^A-Za-z0-9]+/,'')[0]||'#'; t.letter=/[A-Za-z]/.test(c)?c.toUpperCase():'#'; return t; });
const byName=new Map(T.map(t=>[t.lt.replace(/\s+/g,' ').trim(),t]));
const byId=new Map(T.map(t=>[t.id,t]));
/* Links are stored as term IDs. An also-known-as can also be a plain name that is not a
   glossary term, which shows as text; an ID that no longer resolves is left out. */
const isId=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
T.forEach(t=>{ t.aka=t.akaIds.map(v=>byId.get(v)||(isId(v)?null:v)).filter(x=>x&&x!==t); t.rel=t.relIds.map(v=>byId.get(v)).filter(x=>x&&x!==t); });
/* Links are shown from both ends: a term another lists as related shows it back. */
T.forEach(t=>{ t.aka.forEach(a=>{ if(typeof a!=='string'&&!a.aka.includes(t)) a.akaBack=(a.akaBack||[]).concat([t]); });
  t.rel.forEach(r=>{ r.relBack=(r.relBack||[]).concat([t]); }); });
const COUNT={fa:V.fa.map(()=>0),tt:V.tt.map(()=>0),src:V.src.map(()=>0)};
T.forEach(t=>['fa','tt','src'].forEach(k=>t[k].forEach(x=>COUNT[k][x]++)));
const LETTERS=['#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const PUBLISHED=new Date(String(D.meta.published||D.meta.version||'').slice(0,10)+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

/* ---------- search and filters, shared by all three ---------- */
function rank(t,q){ if(!q) return 0; if(t.lt===q) return 0; if(t.lt.startsWith(q)) return 1;
  if(t.lt.includes(' '+q)) return 2; if(t.lt.includes(q)) return 3; if(t.ld.includes(q)) return 4; return -1; }
/* Search in term names only, or definitions only (Perry, 6 Nov 2026); 'all', the default, is the search as it always was.
   A name match still ranks first in Definitions Only when the definition matches too. */
const SCOPES=[['all','Terms and Definitions'],['term','Term Names Only'],['def','Definitions Only']];
function inScope(t,q,sc){ const r=rank(t,q); if(!q||r<0) return r;
  if(sc==='term') return r<4?r:-1;
  if(sc==='def') return t.ld.includes(q)?r:-1;
  return r; }
function run(st){
  const q=st.q.trim().toLowerCase();
  const picked=['fa','tt','src'].flatMap(k=>[...st.sel[k]].map(x=>[k,x]));
  const out=[];
  for(const t of T){
    const r=inScope(t,q,st.scope); if(r<0) continue;
    if(picked.length){ const has=picked.map(([k,x])=>t[k].includes(x)); if(st.mode==='any'?!has.some(Boolean):!has.every(Boolean)) continue; }
    if(st.letter&&t.letter!==st.letter) continue;
    out.push([r,t]);
  }
  if(q) out.sort((a,b)=>a[0]-b[0]||a[1].lt.localeCompare(b[1].lt));
  return out.map(x=>x[1]);
}
/* How many terms each value would give, with the search applied but not the value's own group. */
function facetCounts(st){
  const q=st.q.trim().toLowerCase(); const c={fa:V.fa.map(()=>0),tt:V.tt.map(()=>0),src:V.src.map(()=>0)};
  for(const t of T){ if(inScope(t,q,st.scope)<0) continue; if(st.letter&&t.letter!==st.letter) continue; ['fa','tt','src'].forEach(k=>t[k].forEach(x=>c[k][x]++)); }
  return c;
}
const newState=()=>({q:'',sel:{fa:new Set(),tt:new Set(),src:new Set()},mode:'all',letter:'',scope:'all'});
function hl(text,q){ q=(q||'').trim(); if(!q) return esc(text); const lo=text.toLowerCase(), ql=q.toLowerCase(); let out='',i=0,j;
  while((j=lo.indexOf(ql,i))>-1){ out+=esc(text.slice(i,j))+'<mark>'+esc(text.slice(j,j+q.length))+'</mark>'; i=j+q.length; } return out+esc(text.slice(i)); }
/* Definitions use the console's link syntax: [[Term]], [[Term|words]], [words](https://…), bare links. */
const LINK=/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]|\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]+)/g;
function renderDef(text,q){ let out='',last=0,m; LINK.lastIndex=0; const src=String(text||'');
  while((m=LINK.exec(src))){ out+=hl(src.slice(last,m.index),q);
    if(m[1]!==undefined){ const t=byName.get(m[1].toLowerCase().replace(/\s+/g,' ').trim()); out+=t?`<button type="button" class="tl" data-go="${t.i}">${esc(m[2]||m[1])}</button>`:esc(m[2]||m[1]); }
    else if(m[4]) out+=`<a href="${esc(m[4])}" target="_blank" rel="noopener">${esc(m[3])}</a>`;
    else out+=`<a href="${esc(m[5])}" target="_blank" rel="noopener">${esc(m[5])}</a>`;
    last=m.index+m[0].length; }
  return out+hl(src.slice(last),q); }
const pills=(k,t,attr)=>t[k].map(x=>`<button type="button" class="pill ${k}" ${attr||'data-pick'}="${k}:${x}" title="${esc(desc(k,V[k][x])||V[k][x])}">${esc(V[k][x])}</button>`).join('');
function toast(m){ const d=document.createElement('div'); d.className='gl-toast'; d.setAttribute('role','status'); d.textContent=m; ROOT.appendChild(d); setTimeout(()=>d.remove(),2200); }
function copyLink(t){ const url=location.origin+location.pathname+'#'+t.slug;
  (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast('Link copied: '+url),()=>toast(url)); }

/* ================================================================ the page */
const A={st:newState(),shown:40,open:null,v:'1',pop:null,popHover:null,tray:null,sideOpen:false};
/* How a term type reads inside a sentence: "Show documents in #Servicing". */
const PLURAL={Data:'data terms',Document:'documents',Process:'processes',Other:'other terms',Actor:'actors',Product:'products',Regulation:'regulations',Event:'events',Outcome:'outcomes'};
const plural=v=>PLURAL[v]||(v+' terms');
const joinWords=(a,w)=>a.length<=1?a.join(''):a.length===2?`${a[0]} ${w} ${a[1]}`:null;
const conj=()=>A.st.mode==='any'?'or':'and';
function blankLabel(k){
  const s=[...A.st.sel[k]], names=s.map(x=>V[k][x]);
  if(k==='tt'){ if(!s.length) return 'all terms'; return joinWords(names.map(plural),conj())||`${s.length} kinds of terms`; }
  if(!s.length) return k==='fa'?'any focus area':'any source';
  return joinWords(names,conj())||`${s.length} ${KIND[k].label.toLowerCase()}`;
}

function build(){
  const R=$('gl-page');
  R.innerHTML=pageHTML({thousands:Math.floor(T.length/1000)*1000,total:T.length,label:D.meta.label,stage:D.meta.stage});
  /* Phone and tablet menu: the hamburger opens the same menu as a panel under the header bar. */
if(!OPT.embedded) (function(){var h=ROOT.querySelector(".mm-header"),b=h.querySelector(".mm-burger");b.addEventListener("click",function(){var o=h.classList.toggle("is-open");b.setAttribute("aria-expanded",o?"true":"false");b.setAttribute("aria-label",o?"Close menu":"Open menu");});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&h.classList.contains("is-open")){h.classList.remove("is-open");b.setAttribute("aria-expanded","false");b.focus();}});})();
  const syncQx=()=>$('gl-aQx').classList.toggle('on',!!$('gl-aQ').value);
  const clearQ=()=>{ $('gl-aQ').value=''; syncQx(); A.st.q=''; A.shown=40; A.open=null; paint(); setHash(null); $('gl-aQ').focus(); };
  $('gl-aQx').addEventListener('click',e=>{ e.preventDefault(); clearQ(); });
  $('gl-aQ').addEventListener('keydown',e=>{ if(e.key==='Escape'&&$('gl-aQ').value){ e.preventDefault(); e.stopPropagation(); clearQ(); } });
  let tm; $('gl-aQ').addEventListener('input',e=>{ syncQx(); clearTimeout(tm); tm=setTimeout(()=>{ A.st.q=e.target.value; A.shown=40; A.open=null; paint(); },120); });
  R.addEventListener('click',e=>{
    const sgc=e.target.closest('[data-suggest]'); if(sgc){ openSuggest(sgc); return; }
    const L=e.target.closest('[data-letter]'); if(L){ A.st.letter=A.st.letter===L.dataset.letter?'':L.dataset.letter; A.shown=40; paint(); return; }
    const tg=e.target.closest('[data-toggle]'); if(tg){ const [k,x]=tg.dataset.toggle.split(':'); toggle(k,+x); A.popHover=tg.dataset.toggle; paint(true); return; }
    const p=e.target.closest('[data-pick]'); if(p){ const [k,x]=p.dataset.pick.split(':'); A.st.sel[k].add(+x); A.shown=40; paint(); window.scrollTo({top:docTop($('gl-aMain'))-hdr()-100,behavior:'smooth'}); return; }
    const un=e.target.closest('[data-unpick]'); if(un){ const [k,x]=un.dataset.unpick.split(':'); A.st.sel[k].delete(+x); paint(); return; }
    const h=e.target.closest('[data-row]'); if(h){ A.open=A.open===+h.dataset.row?null:+h.dataset.row; paintMain(); setHash(A.open==null?null:T[A.open]); return; }
    const g=e.target.closest('[data-go]'); if(g){ const t=T[+g.dataset.go]; A.st=newState(); A.st.q=t.term; $('gl-aQ').value=t.term; A.open=t.i; paint(); setHash(t); window.scrollTo({top:docTop($('gl-aMain'))-hdr()-80,behavior:'smooth'}); return; }
    const m=e.target.closest('[data-mode]'); if(m){ A.st.mode=m.dataset.mode; paint(true); return; }
    const qp=e.target.closest('[data-qpart]'); if(qp){ const k=qp.dataset.qpart;
      if(A.v==='3'){ A.tray=A.tray===k?null:k; A.popHover=null; paint(); return; }
      A.pop=A.pop===k?null:k; A.popHover=null; paint(); const f=ROOT.querySelector('.Q-pop .Q-opt'); if(f) f.focus({preventScroll:true}); return; }
    if(e.target.closest('[data-qdone]')){ const k=A.pop||A.tray; A.pop=null; A.tray=null; paint(); const b=ROOT.querySelector(`[data-qpart="${k}"]`); if(b) b.focus({preventScroll:true}); return; }
    const qa=e.target.closest('[data-qall]'); if(qa){ A.st.sel[qa.dataset.qall].clear(); paint(true); return; }
    if(e.target.closest('[data-fold]')){ A.sideOpen=!A.sideOpen; paintSide(); return; }
    if(e.target.closest('[data-clearcls]')){ ['fa','tt','src'].forEach(k=>A.st.sel[k].clear()); paint(); return; }
    { const sb=e.target.closest('[data-scope]'); if(sb){ A.st.scope=sb.dataset.scope; A.shown=40; A.open=null; paint(); const f=ROOT.querySelector(`[data-scope="${A.st.scope}"]`); if(f) f.focus({preventScroll:true}); return; } }
  if(e.target.closest('[data-clearall]')){ A.st=newState(); $('gl-aQ').value=''; A.open=null; A.pop=null; A.tray=null; paint(); return; }
    if(e.target.closest('#gl-aMore')){ A.shown+=40; paintMain(); return; }
    const cp=e.target.closest('[data-copy]'); if(cp){ copyLink(T[+cp.dataset.copy]); }
  });
  /* The meaning of a value follows the pointer and the keyboard: reading it never takes a click. */
  const hov=e=>{ const c=e.target.closest&&e.target.closest('[data-toggle]'); if(!c||A.popHover===c.dataset.toggle) return; A.popHover=c.dataset.toggle; paintQDesc(); };
  R.addEventListener('mouseover',hov); R.addEventListener('focusin',hov);
  document.addEventListener('mousedown',e=>{ if(A.pop&&!e.target.closest('.Q-part')){ A.pop=null; paint(); } });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&(A.pop||A.tray)){ const k=A.pop||A.tray; A.pop=null; A.tray=null; paint(); const b=ROOT.querySelector(`[data-qpart="${k}"]`); if(b) b.focus(); } });
}
function setHash(t){ try{ history.replaceState(null,'',t?'#'+t.slug:location.pathname+location.search); }catch(e){} }
function toggle(k,x){ A.st.sel[k].has(x)?A.st.sel[k].delete(x):A.st.sel[k].add(x); A.shown=40; }
/* keep: a tick inside an open panel redraws around it and keeps the focus where it was. */
function paint(keep){
  if($('gl-aQx')) $('gl-aQx').classList.toggle('on',!!$('gl-aQ').value);
  const f=keep&&document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.toggle:null;
  A.res=run(A.st); paintScope(); paintAz(); paintMain(); paintSide(); fitPop();
  if(f){ const el=ROOT.querySelector(`[data-toggle="${f}"]`); if(el) el.focus({preventScroll:true}); }
}
function paintScope(){
  const el=$('gl-aScope'); if(!el) return; const q=A.st.q.trim();
  el.innerHTML=SCOPES.map(([k,l])=>`<button type="button" data-scope="${k}" aria-pressed="${A.st.scope===k}">${l}${q?`<b>${n(run(Object.assign({},A.st,{scope:k})).length)}</b>`:''}</button>`).join('');
}
function paintAz(){
  const q=A.st.q.trim().toLowerCase(); const has=new Set(T.filter(t=>inScope(t,q,A.st.scope)>=0).map(t=>t.letter));
  $('gl-aAz').innerHTML=`<button type="button" data-letter="" aria-pressed="${!A.st.letter}">All</button>`+LETTERS.map(l=>`<button type="button" data-letter="${l}" aria-pressed="${A.st.letter===l}"${has.has(l)?'':' disabled'}>${l}</button>`).join('');
}
const picked=()=>['fa','tt','src'].reduce((s,k)=>s+A.st.sel[k].size,0);
const byCount=(k,c)=>V[k].map((v,x)=>({v,x,c:c[k][x],key:k+':'+x})).sort((a,b)=>b.c-a.c||a.v.localeCompare(b.v));
const noteHTML=`<div class="S-note"><b>Two similar names.</b> #MBAGlossary is a focus area and MBA Glossary is a source. Both come from the MBA glossary, recorded in two different fields.</div>`;
const GUIDE={tt:'What kind of thing a term is, such as Data, a Document, a Process, an Actor or a Regulation.',fa:'The part of the mortgage business a term belongs to. A term can have several focus areas.',src:'Where the definition comes from, such as MISMO’s Data Dictionary or the MBA Glossary.'};
/* When more than one thing is picked, "and" or "or" is itself a blank in the sentence. */
const modeBlank=()=>picked()>1?`<span class="Q-mode">matching <button type="button" data-mode="${A.st.mode==='all'?'any':'all'}" title="Switch between matching all and any">${A.st.mode==='all'?'all':'any'} ▾</button> of them</span>`:'';
const CHEV='<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5l3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function part(k){
  return `<span class="Q-part ${k}"><button type="button" data-qpart="${k}" aria-expanded="${A.pop===k||A.tray===k}" aria-haspopup="true"><span class="lbl">${esc(blankLabel(k))}</span>${CHEV}</button>${A.pop===k?popHTML(k):''}</span>`;
}
/* Read down the left: "Show / in / from", with the choices lined up beside them. */
const sentence=()=>`<span class="Q-w">Show</span>${part('tt')}<span class="Q-w">in</span>${part('fa')}<span class="Q-w">from</span>${part('src')}`+
  (picked()>1?`<span class="Q-w">matching</span><span class="Q-part md"><button type="button" data-mode="${A.st.mode==='all'?'any':'all'}" title="Switch between matching all and any of these"><span class="lbl">${A.st.mode==='all'?'all of these':'any of these'}</span>${CHEV}</button></span>`:'');
/* How a section's drop-down reads: nothing picked, one, two, or a count. */
function pickLabel(k){ const s=[...A.st.sel[k]].map(x=>V[k][x]);
  return !s.length?(k==='tt'?'All types':k==='fa'?'All focus areas':'All sources'):s.length<=2?s.join(', '):`${s.length} selected`; }
function sectionHTML(k){
  const s=[...A.st.sel[k]];
  return `<section class="C-sec ${k}"><div class="C-top"><h3><span class="dot ${k}"></span>${KIND[k].one}</h3>
      <span class="Q-part ${k}"><button type="button" data-qpart="${k}" aria-expanded="${A.pop===k}" aria-haspopup="true" aria-label="${KIND[k].one}: ${esc(pickLabel(k))}"><span class="lbl">${esc(pickLabel(k))}</span>${CHEV}</button>${A.pop===k?popHTML(k):''}</span></div>
    <p class="C-def">${GUIDE[k]}</p>
    ${s.map(x=>`<div class="C-pick"><div class="top"><b>${esc(V[k][x])}</b><span class="cnt">${n(COUNT[k][x])} terms</span><button type="button" class="x" data-unpick="${k}:${x}" aria-label="Remove ${esc(V[k][x])}">×</button></div><p>${esc(desc(k,V[k][x])||'No description has been published yet.')}</p></div>`).join('')}</section>`;
}
/* Only with more than one pick: whether a term must match all of them or any one. */
const modeRow=()=>picked()>1?`<div class="C-mode">Show terms that match<span class="sw"><button type="button" data-mode="all" aria-pressed="${A.st.mode==='all'}">all</button><button type="button" data-mode="any" aria-pressed="${A.st.mode==='any'}">any</button></span>of these<button type="button" class="S-clear" data-clearcls>Clear</button></div>`:'';
function aboutHTML(){
  const sel=['tt','fa','src'].flatMap(k=>[...A.st.sel[k]].map(x=>[k,x]));
  return `<div class="Q-about"><h3>${sel.length?'About your choices':'What the blanks mean'}</h3>${sel.length?sel.map(([k,x])=>`<div class="Q-item"><div class="top"><span class="dot ${k}"></span>${esc(V[k][x])}<span class="cnt">${n(COUNT[k][x])} terms</span><button type="button" class="x" data-unpick="${k}:${x}" aria-label="Remove ${esc(V[k][x])}">×</button></div><p>${esc(desc(k,V[k][x])||'No description has been published yet.')}</p></div>`).join('')
    :['tt','fa','src'].map(k=>`<div class="Q-item"><div class="top"><span class="dot ${k}"></span>${KIND[k].one}</div><p>${GUIDE[k]}</p></div>`).join('')}</div>`;
}
function popHTML(k){
  const c=facetCounts(A.st);
  return `<div class="Q-pop${k==='src'?' one':''}" role="dialog" aria-label="${KIND[k].label}"><div class="Q-grid">${byCount(k,c).map(o=>`<button type="button" class="Q-opt${o.c?'':' zero'}" data-toggle="${o.key}" aria-pressed="${A.st.sel[k].has(o.x)}"><span class="ck">✓</span><span class="nm">${esc(o.v)}</span><small>${n(o.c)}</small></button>`).join('')}</div>
    <div class="Q-desc" id="gl-qDesc" aria-live="polite">${qDescHTML(k)}</div>
    <div class="Q-foot"><button type="button" class="S-clear" style="margin:0" data-qall="${k}">${A.st.sel[k].size?'Clear these':''}</button><button type="button" class="btn sm p" data-qdone>Done</button></div></div>`;
}
function qDescHTML(k){ const key=A.popHover&&A.popHover.startsWith(k+':')?A.popHover:null;
  if(!key) return `Point at a ${KIND[k].one.toLowerCase()} to read what it means. Pick as many as you like.`;
  const [kk,x]=key.split(':'); return `<b>${esc(V[kk][+x])}.</b> ${esc(desc(kk,V[kk][+x])||'No description has been published yet.')}`; }
function paintQDesc(){ const el=$('gl-qDesc'); const k=A.pop||A.tray; if(el&&k) el.innerHTML=qDescHTML(k); }
/* A panel of choices never runs off either side of the screen. */
function fitPop(){ const p=ROOT.querySelector('.Q-pop'); if(!p) return; p.style.transform=''; const r=p.getBoundingClientRect(); let dx=0;
  if(r.right>innerWidth-12) dx=innerWidth-12-r.right; if(r.left+dx<12) dx=12-r.left; if(dx) p.style.transform=`translateX(${dx}px)`; }

function paintSide(){
  const S=$('gl-aSide');
  S.classList.toggle('stick',!A.pop);
  S.classList.toggle('after',A.v==='2');
  const hide='';
  if(A.v==='1') S.innerHTML=`<div class="S"><div class="S-h"><h2>Narrow the List${hide}</h2><p>Every term has a type, one or more focus areas, and a source.</p></div>${['tt','fa','src'].map(sectionHTML).join('')}${modeRow()}</div>`;
  if(A.v==='2') S.innerHTML=`<div class="S"><div class="S-h"><h2>Classifications</h2><p>Every term has a type, one or more focus areas, and a source.</p></div>${aboutHTML()}${guideLists()}${noteHTML}</div>`;
  if(A.v==='3') S.innerHTML=`<div class="S"><div class="S-h"><h2>Narrow the List${hide}</h2><p>Select a highlighted part to fill it in.</p></div><div class="Q Q3">${sentence()}</div>${A.tray?trayHTML(A.tray):''}${aboutHTML()}${noteHTML}</div>`;
}
/* Version 2 keeps the sentence with the list; this side lists every value to pick from. */
function guideLists(){
  const c=facetCounts(A.st);
  return ['tt','fa','src'].map(k=>`<div class="G-grp"><h3><span class="dot ${k}"></span>${KIND[k].label}</h3><div class="G-list">${byCount(k,c).map(o=>`<button type="button" class="G-v ${k}${o.c?'':' zero'}" data-toggle="${o.key}" aria-pressed="${A.st.sel[k].has(o.x)}" title="${esc(desc(k,o.v))}">${esc(o.v)}<small>${n(o.c)}</small></button>`).join('')}</div></div>`).join('');
}
/* Version 3: the choices open in place under the sentence, pushing the panel down rather than covering it. */
function trayHTML(k){
  const c=facetCounts(A.st);
  return `<div class="Q-tray"><div class="Q-trayh">Choose ${KIND[k].label.toLowerCase()}<button type="button" class="S-clear" data-qall="${k}">${A.st.sel[k].size?'Clear':''}</button></div>
    <div class="Q-chips">${byCount(k,c).map(o=>`<button type="button" class="Q-chip ${k}${o.c?'':' zero'}" data-toggle="${o.key}" aria-pressed="${A.st.sel[k].has(o.x)}">${esc(o.v)}<small>${n(o.c)}</small></button>`).join('')}</div>
    <div class="Q-desc" id="gl-qDesc" aria-live="polite">${qDescHTML(k)}</div>
    <div class="Q-foot"><span></span><button type="button" class="btn sm p" data-qdone>Done</button></div></div>`;
}

const akaAll=t=>t.aka.concat((t.akaBack||[]).filter(x=>!t.aka.includes(x)));
const relAll=t=>t.rel.concat((t.relBack||[]).filter(x=>!t.rel.includes(x)));
function linksHTML(t){
  const item=a=>typeof a==='string'?`<span class="lk-t">${esc(a)}</span>`:`<button type="button" class="lk" data-go="${a.i}">${esc(a.term)}</button>`;
  const aka=akaAll(t), rel=relAll(t);
  if(!aka.length&&!rel.length) return '';
  return `<dl class="A-links">${aka.length?`<div><dt>Also known as</dt><dd>${aka.map(item).join('<span class="sep">·</span>')}</dd></div>`:''}${rel.length?`<div><dt>Related terms</dt><dd>${rel.map(item).join('<span class="sep">·</span>')}</dd></div>`:''}</dl>`;
}
/* ----- the list: the count and the active filters are the box's own header ----- */
function paintMain(){
  const res=A.res, st=A.st, q=st.q.trim();
  const chips=['fa','tt','src'].flatMap(k=>[...st.sel[k]].map(x=>`<button type="button" class="pill ${k}" data-unpick="${k}:${x}" title="Remove this filter">${esc(V[k][x])}</button>`)).join('');
  const any=q||picked()||st.letter;
  const count=`<span class="L-n"><b>${n(res.length)}</b> ${res.length===1?'term':'terms'}${st.letter?` starting with ${st.letter}`:''}${q?` for “${esc(q)}”`:''}</span>`;
  const head=A.v==='2'
    ? `<div class="L-head L-sent"><div class="Q Q2">${sentence()}</div><div class="L-sub">${count}${any?'<button type="button" class="S-clear" data-clearall>Clear all</button>':''}</div></div>`
    : `<div class="L-head">${count}<span class="A-chips">${chips}</span>${any?'<button type="button" class="S-clear" data-clearall>Clear all</button>':''}</div>`;
  const rows=res.slice(0,A.shown).map(t=>{ const open=A.open===t.i;
    return `<div class="A-row${open?' open':''}"><button type="button" class="A-head" data-row="${t.i}" aria-expanded="${open}"><span class="t">${hl(t.term,q)}${akaAll(t).length&&!open?`<span class="aka">also ${esc(akaAll(t).map(a=>typeof a==='string'?a:a.term).join(', '))}</span>`:''}</span><span class="ty">${esc(t.tt.map(x=>V.tt[x]).join(', '))}</span><span class="sn">${hl(t.def,q)}</span></button>
      ${open?`<div class="A-open"><p class="def">${renderDef(t.def,q)}</p>${linksHTML(t)}
        <div class="A-tags">${['tt','fa','src'].map(k=>pills(k,t)).join('')}</div></div>`:''}</div>`; }).join('');
  $('gl-aMain').innerHTML=`<div class="A-list">${head}<div class="L-rows">${rows||`<div class="empty">No terms match. ${st.mode==='all'&&picked()>1?'Try matching any of them, or remove one.':'Try a different search.'}</div>`}</div>
    ${res.length>A.shown?`<div class="L-foot"><span>Showing ${n(A.shown)} of ${n(res.length)}</span><button type="button" class="btn sm" id="gl-aMore">Show ${n(Math.min(40,res.length-A.shown))} more</button></div>`:''}</div>`;
}

/* ---------- Suggest a Term (Perry, 2 Nov 2026; design A, a dialog over the page) ----------
   The card opens it while SUGGEST_LIVE is true. It sends to the relay's POST /glossary-data/suggestions/submit
   (relay request 10), with no sign-in; suggestions land in the private GitMISMO-glossary-data. The checks here are
   the relay's own, in the same words, so most problems are caught before sending. No link on each term (Perry). */
const SUGGEST_URL='https://rgvdi67cg27o5kcmiytcqbqnrm0hmztx.lambda-url.us-east-1.on.aws/glossary-data/suggestions/submit';
let sgStarted=0, sgBusy=false, sgPicked=null, sgOpener=null;
const SG_X='<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
const SG_OK='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function sgBuild(){
  if($('gl-sg')) return;
  ROOT.insertAdjacentHTML('beforeend',`<dialog class="sg" id="gl-sg" aria-labelledby="gl-sgTitle"><div class="sg-in">
<div class="sg-top"><div><h2 id="gl-sgTitle">Suggest a Term</h2><p>Missing a term, or one that could be clearer? Tell the glossary team.</p></div><button type="button" class="sg-x" id="gl-sgX" aria-label="Close">${SG_X}</button></div>
<form id="gl-sgForm" novalidate>
<div class="sg-msg" id="gl-sgMsg" role="alert" hidden></div>
<fieldset><legend>What are you suggesting?</legend><div class="sg-kinds">
<label class="sg-kind"><input type="radio" name="sgKind" id="gl-sgKindNew" value="new" checked autofocus><span class="box"><b>A new term</b><small>It isn’t in the glossary yet.</small></span></label>
<label class="sg-kind"><input type="radio" name="sgKind" id="gl-sgKindBetter" value="better"><span class="box"><b>An updated definition</b><small>For a term that’s already here.</small></span></label>
</div></fieldset>
<div class="sg-f" id="gl-sgNewF"><label for="gl-sgTerm">Term</label><input type="text" id="gl-sgTerm" maxlength="150" autocomplete="off"></div>
<div class="sg-f" id="gl-sgWhichF" hidden><label for="gl-sgWhich">Which term?</label><span class="sg-help" id="gl-sgWhichHelp">Start typing, then pick it from the list.</span><input type="search" id="gl-sgWhich" maxlength="150" autocomplete="off" aria-describedby="gl-sgWhichHelp" aria-controls="gl-sgMatches"><ul class="sg-matches" id="gl-sgMatches" aria-label="Matching terms" hidden></ul></div>
<div class="sg-today" id="gl-sgToday" hidden><span class="lbl">Today’s definition</span><p id="gl-sgTodayText"></p></div>
<div class="sg-f"><label for="gl-sgDef" id="gl-sgDefLabel">Definition</label><span class="sg-help" id="gl-sgDefHelp">How you’d define it, in a sentence or two.</span><textarea id="gl-sgDef" rows="4" maxlength="4000" aria-describedby="gl-sgDefHelp"></textarea></div>
<div class="sg-f"><label for="gl-sgWhy">Why <i>(optional)</i></label><span class="sg-help" id="gl-sgWhyHelp">Where the term is used, or what’s unclear today.</span><textarea id="gl-sgWhy" rows="2" maxlength="2000" aria-describedby="gl-sgWhyHelp"></textarea></div>
<div class="sg-f"><label for="gl-sgSrc">Source or reference <i>(optional)</i></label><span class="sg-help" id="gl-sgSrcHelp">A regulation, a document or a web page.</span><input type="text" id="gl-sgSrc" maxlength="500" aria-describedby="gl-sgSrcHelp"></div>
<fieldset class="sg-you"><legend>About you</legend>
<div class="sg-two"><div class="sg-f"><label for="gl-sgName">Your name</label><input type="text" id="gl-sgName" maxlength="120" autocomplete="name"></div><div class="sg-f"><label for="gl-sgOrg">Your organization</label><input type="text" id="gl-sgOrg" maxlength="150" autocomplete="organization"></div></div>
<div class="sg-f"><label for="gl-sgEmail">Email</label><span class="sg-help" id="gl-sgEmailHelp">For your receipt, and in case the glossary team has a question.</span><input type="email" id="gl-sgEmail" maxlength="200" autocomplete="email" aria-describedby="gl-sgEmailHelp"></div>
</fieldset>
<div class="hp" aria-hidden="true"><label for="gl-sgWebsite">Leave this empty</label><input type="text" id="gl-sgWebsite" tabindex="-1" autocomplete="off"></div>
<p class="sg-note">Only MISMO staff who look after the glossary see your name, organization and email.</p>
<div class="sg-acts"><button type="button" class="sg-btn sg-sec" id="gl-sgCancel">Cancel</button><button type="submit" class="sg-btn sg-pri" id="gl-sgGo">Send suggestion</button></div>
</form>
<div class="sg-done" id="gl-sgDone" tabindex="-1" hidden><span class="sg-ok">${SG_OK}</span><h3>Thank you</h3><p id="gl-sgDoneText"></p><p>The glossary team reviews every suggestion, and may write to you with a question.</p>
<div class="sg-acts"><button type="button" class="sg-btn sg-sec" id="gl-sgAgain">Suggest another</button><button type="button" class="sg-btn sg-pri" id="gl-sgClose">Close</button></div></div>
</div></dialog>`);
  const d=$('gl-sg');
  d.addEventListener('close',()=>{ if(sgOpener&&document.contains(sgOpener)) sgOpener.focus(); });
  d.addEventListener('click',e=>{ if(e.target===d) d.close(); });   /* a click on the dimmed page closes it; what was typed stays */
  ['gl-sgX','gl-sgCancel','gl-sgClose'].forEach(id=>$(id).addEventListener('click',()=>d.close()));
  $('gl-sgAgain').addEventListener('click',()=>{ sgReset(); $('gl-sgTerm').focus(); });
  d.querySelectorAll('input[name=sgKind]').forEach(r=>r.addEventListener('change',sgKind));
  $('gl-sgWhich').addEventListener('input',sgMatch);
  $('gl-sgWhich').addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){ const b=$('gl-sgMatches').querySelector('button'); if(b&&!$('gl-sgMatches').hidden){ e.preventDefault(); b.focus(); } } });
  $('gl-sgMatches').addEventListener('click',e=>{ const b=e.target.closest('[data-sgid]'); if(b) sgPick(T[+b.dataset.sgid]); });
  $('gl-sgMatches').addEventListener('keydown',e=>{ const bs=[...$('gl-sgMatches').querySelectorAll('button')], k=bs.indexOf(document.activeElement); if(k<0) return;
    if(e.key==='ArrowDown'&&k<bs.length-1){ e.preventDefault(); bs[k+1].focus(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); (k?bs[k-1]:$('gl-sgWhich')).focus(); } });
  $('gl-sgForm').addEventListener('submit',sgSend);
}
function openSuggest(from){
  sgBuild(); sgOpener=from||document.activeElement;
  if(!$('gl-sgDone').hidden) sgReset();
  if(!sgStarted) sgStarted=Date.now();
  $('gl-sg').showModal();
}
function sgKind(){
  const better=$('gl-sgKindBetter').checked;
  $('gl-sgNewF').hidden=better; $('gl-sgWhichF').hidden=!better; $('gl-sgToday').hidden=!(better&&sgPicked);
  $('gl-sgDefLabel').textContent=better?'Your suggested definition':'Definition';
  $('gl-sgDefHelp').textContent=better?'How you’d put it instead.':'How you’d define it, in a sentence or two.';
}
function sgMatch(){
  const v=$('gl-sgWhich').value, q=v.trim().toLowerCase(), L=$('gl-sgMatches');
  if(sgPicked&&v!==sgPicked.term){ sgPicked=null; $('gl-sgToday').hidden=true; }
  if(q.length<2||sgPicked){ L.hidden=true; L.innerHTML=''; return; }
  const a=[], b=[]; for(const t of T){ const x=t.term.toLowerCase(); if(x.startsWith(q)) a.push(t); else if(x.includes(q)) b.push(t); if(a.length>=8) break; }
  const hits=a.concat(b).slice(0,8);
  L.innerHTML=hits.length?hits.map(t=>`<li><button type="button" data-sgid="${t.i}">${esc(t.term)}<small>${esc(t.def)}</small></button></li>`).join('')
    :'<li class="none">No term by that name. If it’s new, choose “A new term” above.</li>';
  L.hidden=false;
}
function sgPick(t){
  sgPicked=t; $('gl-sgWhich').value=t.term; $('gl-sgMatches').hidden=true; $('gl-sgMatches').innerHTML='';
  $('gl-sgTodayText').textContent=t.def; $('gl-sgToday').hidden=false; $('gl-sgDef').focus();
}
function sgSay(html){ const m=$('gl-sgMsg'); m.innerHTML=html; m.hidden=false; m.scrollIntoView({block:'nearest'}); }
function sgReset(){
  $('gl-sgForm').reset(); sgPicked=null; $('gl-sgMatches').hidden=true; $('gl-sgMatches').innerHTML=''; sgKind();
  $('gl-sgMsg').hidden=true; $('gl-sgForm').hidden=false; $('gl-sgDone').hidden=true; sgStarted=Date.now();
}
const sgOne=v=>String(v||'').replace(/\s+/g,' ').trim();
function sgCheck(b){
  const p=[], len=(v,max,need,say,id)=>{ if(v.length>max) p.push([id,`${say} is too long (${max} characters at most).`]); else if(need&&v.length<need) p.push([id,v.length?`${say} is too short (${need} characters at least).`:`${say} is needed.`]); };
  len(b.term,150,2,'The term',b.kind==='better'?'gl-sgWhich':'gl-sgTerm');
  len(b.definition,4000,10,'The definition','gl-sgDef');
  len(b.why,2000,0,'Why','gl-sgWhy'); len(b.sourceRef,500,0,'The source or reference','gl-sgSrc');
  len(b.name,120,2,'Your name','gl-sgName'); len(b.organization,150,2,'Your organization','gl-sgOrg');
  if(!/^[^\s@]{1,64}@[^\s@]+\.[A-Za-z]{2,}$/.test(b.email)) p.push(['gl-sgEmail','An email address we can reply to is needed.']);
  return p;
}
function sgSend(e){
  e.preventDefault(); if(sgBusy) return;
  const better=$('gl-sgKindBetter').checked, multi=v=>String(v||'').replace(/\r\n?/g,'\n').trim();
  const b={ kind:better?'better':'new', term:sgOne($(better?'gl-sgWhich':'gl-sgTerm').value), definition:multi($('gl-sgDef').value), why:multi($('gl-sgWhy').value),
    sourceRef:sgOne($('gl-sgSrc').value), name:sgOne($('gl-sgName').value), organization:sgOne($('gl-sgOrg').value), email:sgOne($('gl-sgEmail').value),
    website:$('gl-sgWebsite').value, startedAt:sgStarted };
  if(better&&sgPicked&&sgPicked.term===b.term&&sgPicked.id) b.termId=sgPicked.id;
  const bad=sgCheck(b);
  if(bad.length){ sgSay('<b>A few things to finish:</b><ul>'+bad.map(x=>'<li>'+esc(x[1])+'</li>').join('')+'</ul>'); $(bad[0][0]).focus(); return; }
  sgBusy=true; $('gl-sgGo').disabled=true; $('gl-sgGo').textContent='Sending…'; $('gl-sgMsg').hidden=true;
  fetch(SUGGEST_URL,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(b)})
    .then(r=>r.json().catch(()=>({})).then(j=>({r,j})))
    .then(({r,j})=>{
      if(r.ok&&j.ok) return sgThanks(b,j);
      if(r.status===400&&Array.isArray(j.problems)) return sgSay('<b>A few things to finish:</b><ul>'+j.problems.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>');
      if(r.status===404) return sgSay('Suggest a Term isn’t switched on yet. Please try again in a few days. Your answers are still here.');
      sgSay(esc(j.message||`Your suggestion couldn’t be sent just now (${r.status}). Your answers are still here: please try again in a minute.`));
    },()=>sgSay('MISMO couldn’t be reached just now. Check your connection and try again; your answers are still here.'))
    .then(()=>{ sgBusy=false; $('gl-sgGo').disabled=false; $('gl-sgGo').textContent='Send suggestion'; });
}
function sgThanks(b,j){
  $('gl-sgDoneText').innerHTML='Your suggestion is in.'+(j.reference?' Your reference is <b>'+esc(j.reference)+'</b>, and a':' A')+' receipt is on its way to '+esc(b.email)+'.';
  $('gl-sgForm').hidden=true; $('gl-sgDone').hidden=false; $('gl-sgDone').focus();
}

/* ---------- start ---------- */
function openFromHash(){
  const h=decodeURIComponent((location.hash||'').replace(/^#/,'')); const t=h&&bySlug.get(h); if(!t) return;
  A.st=newState(); A.st.q=t.term; $('gl-aQ').value=t.term; A.open=t.i; paint();
  requestAnimationFrame(()=>{ const r=ROOT.querySelector('.A-row.open'); if(r) r.scrollIntoView({block:'center'}); });
}
window.addEventListener('hashchange',openFromHash);
build(); A.v='1'; paint();

/* ---------- the status of the latest version, and the three ways of showing it ---------- */
/* Set by the console when a version is published: Final, or out for a 30-Day Comment
   Period, and the date. A file published before that existed has neither, and the line then
   just gives the date. */
const STAGE_KEY={'final':'f','comment-period':'cp'};
const STATUS={stage:STAGE_KEY[D.meta.stage]||'',date:String(D.meta.published||D.meta.version||'').slice(0,10),sv:'c'};
const STAGE={f:{short:'Final',line:'as Final'},cp:{short:'30-Day Comment Period',line:'for a 30-Day Comment Period'}};
const statusDate=()=>new Date(STATUS.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const statusText=()=>STATUS.stage?`Latest version published ${STAGE[STATUS.stage].line} on ${statusDate()}`:`Latest version published on ${statusDate()}`;
const STATS=()=>[[n(T.length),'terms'],[V.fa.length,'focus areas'],[V.tt.length,'term types'],[V.src.length,'sources']];
function paintStats(){
  /* The hero says which version is out; the search section gives the counts (both from the published data). */
  const v=$('gl-aVer'); if(v) v.innerHTML=STATUS.stage?`Latest version published ${STATUS.stage==='f'?'as <b>Final</b>':'for a <b>30-Day Comment Period</b>'} on ${esc(statusDate())}.`:`Latest version published on ${esc(statusDate())}.`;
  const el=$('gl-aStats'); if(el) el.textContent=STATS().map(([x,l])=>`${x} ${l}`).join(' \u00b7 ')+'.';
  const f=$('gl-fStatus'); if(f) f.textContent=statusText();
}
paintStats();
openFromHash();
}

// Guided tour (Perry, 6 Nov 2026): reads the page aloud with captions and a moving spotlight; the same engine as the
// Business Domains page. The stops and their wording are in STOPS; each sentence lights up what it talks about.
function tour(ROOT,OPT){
  var STOPS = [["Welcome", [["Welcome to MISMO’s Business Glossary: standard definitions for more than eight thousand terms used across the mortgage industry. The terms grow out of the work of MISMO’s groups, and you’ll see some of those groups among the sources, such as the AI Community of Practice, Data Governance and Management, and Life of Loan. I’ll show you how to find what you need in about two minutes. You can pause, go back or skip ahead at any time.", [["#gl-page h1", 0], ["#gl-aVer", 0]]]]], ["The Latest Version", [["This line shows the glossary’s latest version, and whether it’s Final or out for a thirty-day comment period, when MISMO asks for feedback on the changes.", [["#gl-aVer", 0]]]]], ["Searching", [["Type a term, a phrase or an acronym here. The list narrows as you type, searching both the terms and their definitions.", [["label.search", 0]]], ["Under the box, you can search only term names, or only definitions. Each choice shows how many terms it finds.", [["#gl-aScope", 0]], ""]]], ["Browse by Letter", [["Or browse by letter: pick one to see every term that starts with it.", [["#gl-aAz", 0]]]]], ["Narrow the List", [["On the right, you can narrow the list. Every term has a type, one or more focus areas, and a source.", [["#gl-aSide", 0]], ""], ["Term Type is what kind of thing a term is. Most are data; others are documents, processes, actors, products, regulations and events. Each shows how many terms it has.", [["#gl-aSide .C-sec.tt", 0], ["#gl-aSide .C-sec.tt .Q-pop", 0]], "open:[data-qpart=tt]"], ["Focus Area is the part of the mortgage business a term belongs to, such as origination, servicing, loan delivery or credit reporting. A term can have several focus areas.", [["#gl-aSide .C-sec.fa", 0], ["#gl-aSide .C-sec.fa .Q-pop", 0]], "shut:[data-qpart=tt],open:[data-qpart=fa]"], ["Source is where a definition comes from, such as MISMO’s Logical Data Dictionary or the MBA Glossary.", [["#gl-aSide .C-sec.src", 0], ["#gl-aSide .C-sec.src .Q-pop", 0]], "shut:[data-qpart=fa],open:[data-qpart=src]"], ["Pick any of them, and the list shows only the terms that match.", [["#gl-aSide", 0]], "shut:[data-qpart=src]"]]], ["A Term", [["Open any term to see everything about it. Here’s the first one.", [["#gl-aMain .A-row", 0]], "open:#gl-aMain .A-row .A-head"], ["First, its full definition.", [["#gl-aMain .A-row.open .def", 0]], "open:#gl-aMain .A-row .A-head"], ["Then its term type.", [["#gl-aMain .A-row.open .pill.tt", 0]], "open:#gl-aMain .A-row .A-head"], ["Its focus areas: a term can have several.", [["#gl-aMain .A-row.open .pill.fa", 0]], "open:#gl-aMain .A-row .A-head"], ["And its source: where the definition comes from.", [["#gl-aMain .A-row.open .pill.src", 0]], "open:#gl-aMain .A-row .A-head"], ["Click any of these to see every other term that shares it.", [["#gl-aMain .A-row.open .A-tags", 0]], "open:#gl-aMain .A-row .A-head"], ["Opening a term also gives it its own link. Copy the address from your browser to share exactly the term you mean.", [["#gl-aMain .A-row.open .A-head", 0]], "open:#gl-aMain .A-row .A-head"]]], ["Download and Suggest", [["Members can download the full glossary in Excel. And anyone can suggest a new term, or a clearer definition, to the glossary team.", [[".gl-cards", 0]]]]], ["That’s It", [["That’s the glossary. Start the tour again any time from the button at the top of the page.", [["#gl-gTourBtn", 0]]]]]];
  var PLAY = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>', PAUSE = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z"/></svg>';
  var $ = function(s, r){ return (r || ROOT).querySelector(s); };
  var strip = $(".strip") || { offsetHeight: 0 };   // no sticky strip on this page
  var probe = document.createElement("div"); probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden"; ROOT.appendChild(probe);
  function topSafe(){ return probe.offsetHeight + strip.offsetHeight + headerOffset(OPT); }   // and the website’s sticky header, when embedded
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var dock = $("#gl-dock"), spot = $("#gl-spot"), cap = $("#gl-cap"), where = $("#gl-where"), count = $("#gl-count"), bar = $("#gl-prog");
  var bPlay = $("#gl-t-play"), bPrev = $("#gl-t-prev"), bNext = $("#gl-t-next"), bClose = $("#gl-t-close"), tVoice = $("#gl-t-voice"), sRate = $("#gl-t-rate"), sVoice = $("#gl-t-vsel"), note = $("#gl-t-note");
  var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
  var voices = [], voice = null, rate = 1, voiceOn = !!synth, playing = false, open = false, i = 0, sent = 0, seg = -1, timer = null, token = 0, parts = [];
  try{ var r0 = parseFloat(localStorage.getItem("mismo.tour.rate")); if(r0) rate = r0; if(localStorage.getItem("mismo.tour.voiceOn") === "0") voiceOn = false; }catch(e){}
  if(!synth){ tVoice.disabled = true; voiceOn = false; note.textContent = "This browser can’t read aloud, so the tour shows captions and moves on by itself."; note.classList.add("on"); }
  sRate.value = String(rate);

  // How the voice says things; the captions keep the written form.
  function say(t){ return t.replace(/\bCoP\b/g, "Community of Practice").replace(/\bMISMO\b/g, "Mismo").replace(/\bversion 2s\b/g, "version twos").replace(/\bversion 2\b/g, "version two"); }
  function split(t){ return (t.match(/[^.!?]+[.!?]+[’”]?(\s+|$)|[^.!?]+$/g) || [t]).map(function(s){ return s.trim(); }).filter(Boolean); }

  function pickVoice(){
    if(!synth) return;
    var all = synth.getVoices() || [];
    voices = all.filter(function(v){ return /^en([-_]|$)/i.test(v.lang); });
    var saved = null; try{ saved = localStorage.getItem("mismo.tour.voice"); }catch(e){}
    var pref = [/natural/i, /neural/i, /online/i, /google us english/i, /samantha/i, /\bava\b/i, /aria/i, /jenny/i, /allison/i, /daniel/i];
    function find(re, us){ return voices.find(function(v){ return re.test(v.name) && (!us || /en[-_]US/i.test(v.lang)); }); }
    voice = voices.find(function(v){ return v.name === saved; }) || pref.map(function(re){ return find(re, true); }).find(Boolean)
         || pref.map(function(re){ return find(re, false); }).find(Boolean) || voices.find(function(v){ return /en[-_]US/i.test(v.lang); }) || voices[0] || null;
    sVoice.innerHTML = "";
    voices.forEach(function(v){ var o = document.createElement("option"); o.value = v.name; o.textContent = v.name.replace(/^(Microsoft|Google)\s+/, "").replace(/\s*\(.*?\)\s*/g, " ").trim(); if(voice && v.name === voice.name) o.selected = true; sVoice.appendChild(o); });
    sVoice.parentNode.style.display = voices.length > 1 ? "" : "none";
  }
  if(synth){ pickVoice(); if(synth.addEventListener) synth.addEventListener("voiceschanged", pickVoice); else synth.onvoiceschanged = pickVoice; }

  // The From Idea to Publication switch
  function setSwitch(k){ var b = ROOT.querySelector('.sw button[data-k="' + k + '"]'); if(b && !b.classList.contains("on")) b.click(); }

  // What to light up
  function resolve(targets){ var out = []; targets.forEach(function(t){ var e = ROOT.querySelectorAll(t[0])[t[1] || 0]; if(e) out.push(e); }); return out; }
  function reveal(list){ // bring targets inside a sideways-scrolling block into view
    var done = [];
    list.forEach(function(e){ var sx = e.closest && e.closest(".lanes-wrap, .scroll"); if(!sx || done.indexOf(sx) >= 0 || sx.scrollWidth <= sx.clientWidth) return; done.push(sx);
      var mine = list.filter(function(x){ return sx.contains(x) && x !== sx; }); if(!mine.length) return;
      var c = sx.getBoundingClientRect(), l = Infinity, r = -Infinity;
      mine.forEach(function(x){ var q = x.getBoundingClientRect(); l = Math.min(l, q.left); r = Math.max(r, q.right); });
      var pin = sx.querySelector(".lname"), pinW = pin && getComputedStyle(pin).position === "sticky" ? pin.offsetWidth + 6 : 0;
      if(l < c.left + pinW + 8 || r > c.right - 8) sx.scrollLeft += (l - c.left) - pinW - 8; });
  }
  function box(list){ var t = Infinity, l = Infinity, b = -Infinity, r = -Infinity;
    list.forEach(function(e){ var q = e.getBoundingClientRect(); if(!q.width && !q.height) return; t = Math.min(t, q.top); l = Math.min(l, q.left); b = Math.max(b, q.bottom); r = Math.max(r, q.right); });
    var vw = document.documentElement.clientWidth; l = Math.max(l, 6); r = Math.min(r, vw - 6); if(r < l + 20){ r = l + 20; }
    return {top: t + window.scrollY, left: l + window.scrollX, w: r - l, h: b - t}; }
  // Where the spotlight's own top-left sits on the page: the page itself, or a positioned box around the glossary.
  function origin(){ var op = spot.offsetParent; if(!op || op === document.body || op === document.documentElement) return {x: 0, y: 0};
    var q = op.getBoundingClientRect(); return {x: q.left + window.scrollX + op.clientLeft, y: q.top + window.scrollY + op.clientTop}; }
  function place(targets, scroll){
    var list = resolve(targets); if(!list.length) return;
    reveal(list);
    var pad = 10, bx = box(list);
    var o = origin(); spot.style.top = (bx.top - pad - o.y) + "px"; spot.style.left = (bx.left - pad - o.x) + "px"; spot.style.width = (bx.w + pad * 2) + "px"; spot.style.height = (bx.h + pad * 2) + "px";
    spot.classList.add("on");
    if(!scroll) return;
    var ts = topSafe(), low = window.innerHeight - dock.offsetHeight - 28, avail = low - ts;
    var vTop = bx.top - pad - window.scrollY, vBot = vTop + bx.h + pad * 2;
    if(vTop >= ts + 4 && vBot <= low) return;                     // already in view: leave the page still
    var y = (bx.h + pad * 2 <= avail) ? bx.top - pad - ts - Math.max(8, (avail - bx.h - pad * 2) / 2) : bx.top - pad - ts - 12;
    window.scrollTo({top: Math.max(0, y), behavior: reduced ? "auto" : "smooth"});
  }
  /* What a sentence opens (Perry, 6 Nov 2026): "open:<selector>" clicks a closed button (a Narrow the List list, a term);
     "shut:<selector>" closes one the tour opened. Moving to another stop, or closing the tour, closes them all. */
  var opened = [];
  // What was opened is remembered by its selector: the page redraws a term when it opens, so the element itself changes.
  function act(a){ var k = a.indexOf(":"), how = a.slice(0, k), sel = a.slice(k + 1), el = ROOT.querySelector(sel); if(!el) return false;
    var isOpen = el.getAttribute("aria-expanded") === "true";
    if(how === "open" && !isOpen){ el.click(); if(opened.indexOf(sel) < 0) opened.push(sel); return true; }
    if(how === "shut" && isOpen){ el.click(); return true; }
    return false; }
  function shutAll(){ opened.forEach(function(sel){ var el = ROOT.querySelector(sel); if(el && el.getAttribute("aria-expanded") === "true") el.click(); }); opened = []; }
  function focusSeg(g, force){ if(g === seg && !force) return; seg = g; var sg = STOPS[i][1][g], acts = (sg[2] || "").split(",").filter(Boolean);
    var did = false; acts.forEach(function(a){ if(a.indexOf("sw:") === 0) setSwitch(a.slice(3)); else did = act(a) || did; });
    if(did) setTimeout(function(){ if(open) place(STOPS[i][1][seg][1], true); }, 150); else place(sg[1], true); }

  function renderCap(){ parts = []; cap.innerHTML = "";
    STOPS[i][1].forEach(function(sg, g){ split(sg[0]).forEach(function(p){ var s = document.createElement("span"); s.textContent = p + " "; s.setAttribute("data-k", parts.length); parts.push({t: p, g: g}); cap.appendChild(s); }); });
    mark(-1); }
  // The caption box shows about three lines: it keeps the sentence being read at the top,
  // and slides through a sentence too long to fit as the voice reaches its later words.
  function capTo(y){ cap.scrollTop = Math.max(0, Math.min(y, cap.scrollHeight - cap.clientHeight));
    cap.classList.toggle("end", cap.scrollTop >= cap.scrollHeight - cap.clientHeight - 2); }
  function spanBox(s){ var r = s.getBoundingClientRect(), c = cap.getBoundingClientRect(); return {top: r.top - c.top + cap.scrollTop, h: r.height}; }
  function follow(frac){ var now = cap.querySelector("span.now"); if(!now) return; var b = spanBox(now), over = b.h - cap.clientHeight;
    if(over > 0) capTo(b.top + over * Math.max(0, Math.min(1, frac))); }
  function mark(k){ Array.prototype.forEach.call(cap.children, function(s, n){ s.className = n < k ? "done" : (n === k ? "now" : ""); });
    var now = cap.children[k]; if(now) capTo(spanBox(now).top); else if(k < 0) capTo(0); }
  function ui(){ var end = i === STOPS.length - 1 && sent >= parts.length;
    bPlay.innerHTML = (playing ? PAUSE + "<span>Pause</span>" : PLAY + "<span>" + (end ? "Replay" : "Play") + "</span>");
    bPlay.setAttribute("aria-label", playing ? "Pause the tour" : "Play the tour");
    bPrev.disabled = i === 0; bNext.disabled = i === STOPS.length - 1;
    tVoice.setAttribute("aria-pressed", voiceOn ? "true" : "false"); tVoice.textContent = voiceOn ? "Voice On" : "Voice Off";
    where.textContent = STOPS[i][0]; count.textContent = (i + 1) + " of " + STOPS.length; bar.style.width = ((i + 1) / STOPS.length * 100) + "%"; }

  function stopSpeech(){ token++; clearTimeout(timer); if(synth){ try{ synth.cancel(); }catch(e){} } }
  function run(k){ var my = ++token; clearTimeout(timer);
    function step(j){ if(my !== token) return;
      if(j >= parts.length){ sent = parts.length; mark(parts.length); done(); return; }
      sent = j; mark(j); focusSeg(parts[j].g);
      if(voiceOn && synth){ var u = new SpeechSynthesisUtterance(say(parts[j].t)); if(voice){ u.voice = voice; u.lang = voice.lang; } else u.lang = "en-US"; u.rate = rate;
        var fired = false; u.onend = function(){ if(fired) return; fired = true; step(j + 1); };
        u.onboundary = function(ev){ if(my !== token || typeof ev.charIndex !== "number") return; follow((ev.charIndex - 25) / Math.max(1, u.text.length - 50)); };
        u.onerror = function(ev){ if(fired || my !== token) return; fired = true; if(ev && (ev.error === "interrupted" || ev.error === "canceled")) return; timed(j); };
        synth.speak(u);
        var guard = Math.max(4000, parts[j].t.length * 95 / rate); timer = setTimeout(function(){ if(!fired && my === token && !synth.speaking){ fired = true; step(j + 1); } }, guard);
      } else timed(j);
    }
    function timed(j){ var ms = Math.max(2200, parts[j].t.length * 62) / rate;
      setTimeout(function(){ if(my === token && sent === j) follow(0.5); }, ms * 0.4);
      setTimeout(function(){ if(my === token && sent === j) follow(1); }, ms * 0.75);
      timer = setTimeout(function(){ step(j + 1); }, ms); }
    step(k);
  }
  function done(){ if(!playing) return; if(i < STOPS.length - 1) timer = setTimeout(function(){ go(i + 1); }, 750); else { playing = false; ui(); } }
  function go(n){ stopSpeech(); shutAll(); i = Math.max(0, Math.min(STOPS.length - 1, n)); sent = 0; seg = -1; renderCap(); ui(); focusSeg(0, true); if(playing) run(0); }

  function quiet(){ var pop = $("#pop"), back = $("#back"); if(pop) pop.hidden = true; if(back) back.hidden = true; }
  function start(){ open = true; quiet(); ROOT.classList.add("touring"); dock.classList.add("on"); playing = true; if(synth){ try{ synth.cancel(); }catch(e){} } go(0); bPlay.focus({preventScroll:true}); }
  function close(){ stopSpeech(); shutAll(); playing = false; open = false; ROOT.classList.remove("touring"); dock.classList.remove("on"); spot.classList.remove("on"); }
  function toggle(){ if(playing){ playing = false; stopSpeech(); mark(sent); ui(); }
    else { playing = true; if(sent >= parts.length){ if(i === STOPS.length - 1){ go(0); return; } go(i + 1); return; } ui(); run(sent); } }

  // The header is drawn from a template after the glossary loads, so the button is found when it is clicked.
  ROOT.addEventListener("click", function(ev){ var b = ev.target && ev.target.closest && ev.target.closest("[data-tour]"); if(b && !b.disabled) start(); });
  bPlay.addEventListener("click", toggle);
  bNext.addEventListener("click", function(){ go(i + 1); });
  bPrev.addEventListener("click", function(){ go(i - 1); });
  bClose.addEventListener("click", close);
  cap.addEventListener("scroll", function(){ cap.classList.toggle("end", cap.scrollTop >= cap.scrollHeight - cap.clientHeight - 2); }, {passive:true});
  cap.addEventListener("click", function(ev){ var k = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-k"); if(k === null || k === undefined) return;
    stopSpeech(); sent = +k; mark(sent); focusSeg(parts[sent].g); if(playing) run(sent); });
  tVoice.addEventListener("click", function(){ voiceOn = !voiceOn; try{ localStorage.setItem("mismo.tour.voiceOn", voiceOn ? "1" : "0"); }catch(e){} var was = playing; stopSpeech(); ui(); if(was){ playing = true; run(sent); } });
  sRate.addEventListener("change", function(){ rate = parseFloat(sRate.value) || 1; try{ localStorage.setItem("mismo.tour.rate", String(rate)); }catch(e){} if(playing){ stopSpeech(); run(sent); } });
  sVoice.addEventListener("change", function(){ voice = voices.find(function(v){ return v.name === sVoice.value; }) || voice; try{ localStorage.setItem("mismo.tour.voice", voice ? voice.name : ""); }catch(e){} if(playing){ stopSpeech(); run(sent); } });
  document.addEventListener("keydown", function(ev){ if(!open) return; var tag = (ev.target && ev.target.tagName) || "";
    if(ev.key === "Escape"){ close(); }
    else if(tag === "SELECT") return;
    else if(ev.key === "ArrowRight"){ ev.preventDefault(); go(i + 1); }
    else if(ev.key === "ArrowLeft"){ ev.preventDefault(); go(i - 1); }
    else if(ev.key === " " && tag !== "BUTTON"){ ev.preventDefault(); toggle(); } });
  var rz; window.addEventListener("resize", function(){ if(!open || seg < 0) return; clearTimeout(rz); rz = setTimeout(function(){ place(STOPS[i][1][seg][1], false); }, 120); });
  var lw = $(".lanes-wrap"); if(lw) lw.addEventListener("scroll", function(){ if(open && seg >= 0) place(STOPS[i][1][seg][1], false); }, {passive:true});
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(open && seg >= 0) place(STOPS[i][1][seg][1], false); });
  ui();
}

/* ================================================================ mounting */
/* The tour’s spotlight and its controls, drawn into the box when the glossary mounts. */
const DOCK=`<div id="gl-spot" aria-hidden="true"></div>
<div id="gl-dock" role="region" aria-label="Guided tour">
  <div class="prog"><i id="gl-prog"></i></div>
  <div class="top"><span class="where" id="gl-where"></span><span class="count" id="gl-count"></span><button class="x" id="gl-t-close" type="button">Close Tour</button></div>
  <div id="gl-cap" aria-live="polite"></div>
  <div class="ctl">
    <button class="b" id="gl-t-prev" type="button" aria-label="Previous stop"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg><span>Back</span></button>
    <button class="b p" id="gl-t-play" type="button"></button>
    <button class="b" id="gl-t-next" type="button" aria-label="Next stop"><span>Next</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg></button>
    <span class="opts"><button class="tog" id="gl-t-voice" type="button" aria-pressed="true">Voice On</button>
      <label>Speed <select id="gl-t-rate"><option value="0.9">0.9×</option><option value="1">1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select></label>
      <label>Voice <select id="gl-t-vsel"></select></label></span>
  </div>
  <div class="note" id="gl-t-note"></div>
</div>`;
function mount(el, opts){
  if(!el) throw new Error('MISMO_GLOSSARY.mount needs the element to draw the glossary in');
  if(el.__mmGlossary) return el.__mmGlossary;   // mounted already: the first mount stands
  var OPT = Object.assign({ base: '', embedded: false, headerOffset: 0 }, opts || {});
  OPT.base = String(OPT.base || ''); if(OPT.base && !/\/$/.test(OPT.base)) OPT.base += '/';
  if(!el.id) el.id = 'mm-glossary';
  if(el.id !== 'mm-glossary') console.warn('MISMO_GLOSSARY: the glossary\u2019s styles apply only inside id="mm-glossary"');
  el.innerHTML = '<div id="gl-page"></div>' + DOCK;
  if(OPT.embedded){
    el.classList.add('embedded');
    /* The website's own font (Jonna, 10 Nov 2026): the glossary's font settings take whatever the page around it uses. */
    var ff = el.parentNode && el.parentNode.nodeType === 1 ? getComputedStyle(el.parentNode).fontFamily : '';
    if(ff) ['--mm-font', '--sans', '--serif'].forEach(function(k){ el.style.setProperty(k, ff); });
  }
  /* --gl-hdr keeps the sticky list header and side panel under the website's sticky header, which can change height. */
  var last = null, sync = function(){ var h = headerOffset(OPT) + 'px'; if(h !== last){ last = h; el.style.setProperty('--gl-hdr', h); } };
  sync(); window.addEventListener('resize', sync); window.addEventListener('scroll', sync, {passive: true});
  tour(el, OPT);              // its controls exist now; the stops it lights up are found as it plays
  var done = main(el, OPT);   // draws the page at once, then fills it in when the terms arrive
  el.__mmGlossary = done;
  return done;
}
G.app = { mount: mount };
})();
