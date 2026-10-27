/* =========================================================================
   TRIBE — socle de l'interface : rendu, navigation, feuilles, accueil, réglages
   ========================================================================= */
const UI = { view:"home", kidTab:null, sub:{sante:null, courbes:"weight", souv:"photos", tribu:null, agenda:"mois"}, msMode:"concis", msAll:false,
  chrono:false, zoom:null, range:null, calMonth:null, calSel:null, chat:"family", photoCat:"all", trendKey:null, trendDays:7 };
const ACT = {}, FORMS = {}, CHANGE = {};

/* ---------- petites aides d'interface ---------- */
let toastT;
function toast(msg){ clearTimeout(toastT); let el = $("#toast"); if (!el){ el = document.createElement("div"); el.id="toast"; el.className="toast"; el.setAttribute("role","status"); document.body.appendChild(el); } el.textContent = msg; el.hidden = false; toastT = setTimeout(()=>el.hidden = true, 2400); }
function commit(msg){ save(); render(); if (msg) toast(msg); }
function sheet(inner, cls=""){
  const prev = $("#layer .sheet");
  if (prev){ // mise à jour sur place : pas de nouvelle animation (évite l'effet transparent), garde la position si c'est la même fiche
    const oldT = prev.querySelector("h2")?.textContent || "", top = prev.scrollTop;
    prev.className = `sheet ${cls}`; prev.innerHTML = `<div class="sheet-grab"></div>${inner}`;
    if ((prev.querySelector("h2")?.textContent || "") === oldT) prev.scrollTop = top; else prev.scrollTop = 0;
  } else $("#layer").innerHTML = `<div class="scrim" data-act="closeSheet"><div class="sheet ${cls}" role="dialog" aria-modal="true"><div class="sheet-grab"></div>${inner}</div></div>`;
  centerPressed("#layer");
  if (!Native.isApp && window.matchMedia("(min-width:821px)").matches){ const f = $("#layer input:not([type=radio]):not([type=checkbox]):not([type=file]), #layer textarea"); if (f) setTimeout(()=>f.focus({preventScroll:true}), 60); }
}
/* barres défilantes : garde l'onglet choisi au centre (au lieu de revenir au début) */
function centerPressed(root){
  $$(`${root} .ai-tabs, ${root} .seg, ${root} .pick, ${root} .chips-scroll`).forEach(el => {
    if (el.scrollWidth <= el.clientWidth + 12) return; const on = el.querySelector('[aria-pressed="true"]'); if (!on) return;
    const a = el.getBoundingClientRect(), b = on.getBoundingClientRect(); el.scrollLeft += (b.left - a.left) - (a.width - b.width) / 2;
  });
}
function closeSheet(){ $("#layer").innerHTML = ""; if (typeof FAM !== "undefined" && FAM.on){ clearInterval(FAM.t); FAM.on = false; } if (typeof PL !== "undefined" && PL.on) stopPlay(); }
const fld = (id,l,inp) => `<div class="field"><label for="${id}">${l}</label>${inp}</div>`;
const inp = (id, val="", attrs="") => `<input class="inp" id="${id}" value="${esc(val)}" ${attrs}>`;
const radios = (name, opts, sel) => `<div class="radio-row" role="radiogroup">${opts.map(o => { const [v,l] = Array.isArray(o) ? o : [o,o]; return `<label><input type="radio" name="${name}" value="${esc(v)}" ${v===sel?"checked":""}><span>${esc(l)}</span></label>`; }).join("")}</div>`;
const checks = (name, opts, sel=[]) => `<div class="radio-row">${opts.map(o => { const [v,l] = Array.isArray(o) ? o : [o,o]; return `<label><input type="checkbox" name="${name}" value="${esc(v)}" ${sel.includes(v)?"checked":""}><span>${esc(l)}</span></label>`; }).join("")}</div>`;
const swatches = (name, sel) => `<div class="swatches" role="radiogroup">${COLORS.map(c => `<label title="${c}"><input type="radio" name="${name}" value="${c}" ${c===sel?"checked":""}><span style="background:var(--${c})"></span></label>`).join("")}</div>`;
const sheetHead = t => `<div class="row between"><h2>${t}</h2><button type="button" class="icon-btn" data-act="closeSheet" aria-label="${T("Fermer")}">${icon("x")}</button></div>`;
const numIn = (id, ph="", step=5, val="") => `<input class="inp" id="${id}" type="number" inputmode="decimal" min="0" step="${step}" placeholder="${ph}" value="${val}">`;
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
const radio = n => (document.querySelector(`input[name="${n}"]:checked`)||{}).value || "";
const checked = n => [...document.querySelectorAll(`input[name="${n}"]:checked`)].map(i => i.value);
const tsOf = id => { const v = val(id); return v ? new Date(v).getTime() : Date.now(); };
const numOf = id => Number(val(id).replace(",", ".")) || 0;
/* ---------- photo en plein écran : pincer pour zoomer, glisser pour se déplacer, toucher deux fois ---------- */
function closeViewer(){ $("#viewer")?.remove(); document.removeEventListener("keydown", viewerKey); }
const viewerKey = e => { if (e.key === "Escape") closeViewer(); };
function openViewer(src){
  if (!src || src.length < 30) return; closeViewer();
  const el = document.createElement("div"); el.id = "viewer"; el.className = "viewer"; el.setAttribute("role", "dialog");
  el.innerHTML = `<img src="${src}" alt="" draggable="false"><button class="viewer-x" aria-label="${T("Fermer")}">${icon("x")}</button><span class="viewer-hint">${T("Pincez pour zoomer · touchez deux fois")}</span>`;
  document.body.appendChild(el); document.addEventListener("keydown", viewerKey);
  const img = el.querySelector("img"), pts = new Map(); let s = 1, x = 0, y = 0, st = null, lastTap = 0, moved = false;
  const apply = () => { img.style.transform = `translate(${x}px,${y}px) scale(${s})`; };
  const snap = () => { const p = [...pts.values()]; return {s, x, y, p:p.map(q => ({...q})), d:p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0, c:p.length > 1 ? {x:(p[0].x + p[1].x)/2, y:(p[0].y + p[1].y)/2} : p[0]}; };
  const bound = () => { const r = img.getBoundingClientRect(), mx = Math.max(0, (r.width - innerWidth) / 2 + 40), my = Math.max(0, (r.height - innerHeight) / 2 + 40); x = clamp(x, -mx, mx); y = clamp(y, -my, my); };
  el.querySelector(".viewer-x").onclick = e => { e.stopPropagation(); closeViewer(); };
  el.addEventListener("pointerdown", e => { if (e.target.closest(".viewer-x")) return; try { el.setPointerCapture(e.pointerId); } catch(_){} pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); st = snap(); moved = false; });
  el.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); const p = [...pts.values()];
    if (p.length >= 2 && st?.d){ const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), c = {x:(p[0].x + p[1].x)/2, y:(p[0].y + p[1].y)/2}; s = clamp(st.s * d / st.d, 1, 6); x = st.x + (c.x - st.c.x); y = st.y + (c.y - st.c.y); moved = true; apply(); }
    else if (p.length === 1 && st){ const dx = p[0].x - st.p[0].x, dy = p[0].y - st.p[0].y; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; if (s > 1){ x = st.x + dx; y = st.y + dy; bound(); apply(); } else if (dy > 0){ img.style.transform = `translateY(${dy}px)`; el.style.background = `rgba(0,0,0,${Math.max(.3, 1 - dy/400)})`; } } });
  const up = e => { if (!pts.has(e.pointerId)) return; const one = pts.size === 1, p0 = st?.p?.[0]; pts.delete(e.pointerId);
    if (one && s <= 1 && p0 && e.clientY - p0.y > 120){ closeViewer(); return; }
    if (one && !moved){ const now = Date.now(); if (now - lastTap < 320){ if (s > 1){ s = 1; x = y = 0; } else { s = 2.5; const r = el.getBoundingClientRect(); x = (r.width/2 - e.clientX) * 1.5; y = (r.height/2 - e.clientY) * 1.5; bound(); } apply(); lastTap = 0; } else lastTap = now; }
    if (s <= 1.02){ s = 1; x = y = 0; el.style.background = ""; apply(); } st = pts.size ? snap() : null; };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", e => { e.preventDefault(); s = clamp(s * (e.deltaY < 0 ? 1.15 : 0.87), 1, 6); if (s === 1){ x = y = 0; } apply(); }, {passive:false});
}
const lookPick = (k, label, opts, def) => `<div class="field"><label>${label}</label><div class="pick">${opts.map(([v, l]) => `<button data-act="lookSet" data-v="${k}:${v}" aria-pressed="${((S.settings.look||{})[k]||def)===v}">${l}</button>`).join("")}</div></div>`;
Object.assign(ACT, {
  lookSet: v => { const [k, x] = v.split(":"); S.settings.look = {...(S.settings.look||{}), [k]:x}; commit(); },
  lookReset: () => { S.settings.look = {}; commit(T("Style par défaut")); },
});
Object.assign(CHANGE, {
  lookAccent: t => { S.settings.look = {...(S.settings.look||{}), accent:t.value || null}; commit(); },
  quoteOn: t => { S.settings.quoteOff = !t.checked; commit(); },
});
/* confirmation maison (les confirm() natifs sont parfois bloqués dans les applis installées) */
let CF = null;
function askConfirm(msg, okLabel, fn, danger = true){ CF = fn; sheet(`${sheetHead(T("Confirmer"))}<p>${esc(msg)}</p><div class="row"><button class="btn ${danger?"danger":"kid"} grow" data-act="cfOk">${esc(okLabel)}</button><button class="btn ghost" data-act="closeSheet">${T("Annuler")}</button></div>`); }
const empty = (ic, txt, btn="") => `<div class="empty">${icon(ic)}<p>${txt}</p>${btn}</div>`;
function confetti(){
  if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const cv = document.createElement("canvas"); cv.className = "confetti"; cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv);
  const ctx = cv.getContext("2d"); if (!ctx) { cv.remove(); return; } const cols = ["#FF9E7A","#FFD36E","#62C9A4","#7DB8F7","#A994F2","#F47FA3"];
  const ps = Array.from({length:90}, () => ({x:innerWidth/2, y:innerHeight*.45, vx:(Math.random()-.5)*12, vy:-Math.random()*12-4, r:Math.random()*6+4, c:cols[Math.floor(Math.random()*6)], a:Math.random()*6}));
  let f = 0; (function tick(){ ctx.clearRect(0,0,cv.width,cv.height); ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); ctx.restore(); }); if (++f < 90) requestAnimationFrame(tick); else cv.remove(); })();
}
/* mini-markdown sûr (réponses IA) */
function md(t){
  const inline = l => l.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, txt, url) => `<a href="${url.replace(/&amp;/g,"&").replace(/"/g,"%22")}" target="_blank" rel="noopener">${/google\.[a-z.]+\/maps|maps\.app/.test(url)?`${icon("pin").replace("<svg",'<svg style="width:14px;height:14px;vertical-align:-2px"')} `:""}${txt}</a>`)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");
  const lines = esc(t||"").split(/\n/); let out = "", list = null, i = 0;
  const close = () => { if (list){ out += `</${list}>`; list = null; } };
  while (i < lines.length){
    let l = lines[i];
    if (/^\s*\|.*\|\s*$/.test(l)){ close(); const rows = []; while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])){ rows.push(lines[i]); i++; }
      const cells = r => r.trim().replace(/^\||\|$/g, "").split("|").map(c => inline(c.trim())); const body = rows.filter(r => !/^\s*\|[\s:|-]+\|\s*$/.test(r));
      out += `<div class="tbl"><table><thead><tr>${cells(body[0]).map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body.slice(1).map(r => `<tr>${cells(r).map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; continue; }
    if (/^\s*[-*•]\s+/.test(l)){ if (list !== "ul"){ close(); out += "<ul>"; list = "ul"; } out += `<li>${inline(l.replace(/^\s*[-*•]\s+/, ""))}</li>`; i++; continue; }
    if (/^\s*\d+[.)]\s+/.test(l)){ if (list !== "ol"){ close(); out += "<ol>"; list = "ol"; } out += `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`; i++; continue; }
    close();
    if (/^#{1,4}\s/.test(l)) out += `<h4>${inline(l.replace(/^#{1,4}\s/, ""))}</h4>`; else if (/^```/.test(l)) {} else if (l.trim()) out += `<p>${inline(l)}</p>`;
    i++;
  }
  close(); return `<div class="md">${out}</div>`;
}
const mapsUrl = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const placeLink = (q, label) => q ? `<a class="place" href="${mapsUrl(q)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${icon("pin").replace("<svg",'<svg style="width:14px;height:14px;vertical-align:-2px"')} ${esc(label || q)}</a>` : "";

/* ---------- apparence ---------- */
const isDark = () => S.settings.theme === "dark" || (!S.settings.theme && matchMedia("(prefers-color-scheme: dark)").matches);
function applyLook(){
  const r = document.documentElement, c = UI.view === "kid" ? child() : null;
  LANG = S.settings.lang || ((navigator.language||"fr").toLowerCase().startsWith("fr") ? "fr" : "en");
  r.lang = LANG === "en" ? "en-CA" : "fr-CA";
  const col = c?.color || me()?.color || "peach";
  r.style.setProperty("--kid", `var(--${col})`); r.style.setProperty("--kid-bg", `var(--${col}-bg)`); r.style.setProperty("--kid-ink", `var(--${col}-ink)`);
  const st = c ? lookOf(c).id : "fam";
  if (r.dataset.stage !== st){ r.dataset.stage = st; $("#deco").innerHTML = decoSVG(st); }
  if (S.settings.theme) r.dataset.theme = S.settings.theme; else delete r.dataset.theme;
  const L = S.settings.look || {}; r.dataset.card = L.card || "doux"; r.dataset.tabs = L.tabs || "pilule"; r.dataset.radius = L.radius || "rond";
  if (L.accent){ r.style.setProperty("--acc", `var(--${L.accent})`); r.style.setProperty("--acc-bg", `var(--${L.accent}-bg)`); r.style.setProperty("--acc-ink", `var(--${L.accent}-ink)`); }
  else ["--acc","--acc-bg","--acc-ink"].forEach(k => r.style.removeProperty(k));
  const bg = BGS.find(b => b.id === S.settings.bg) || (S.settings.bg?.startsWith?.("#") ? {light:S.settings.bg, dark:S.settings.bg} : BGS[0]);
  r.style.setProperty("--appbg", isDark() ? bg.dark : bg.light);
  document.title = appName();
  Native.statusBarTheme(isDark());
}

/* ---------- navigation : s'adapte à l'âge, aux fonctions choisies et au mode enfant ---------- */
function navItems(){
  const kid = isKidUser(), items = [{id:"home", label:T("Accueil"), ic:"home"}];
  if (S.children.length && !kid) items.push({id:"kid", label: S.children.length === 1 ? esc(child().nick||child().name) : T("Enfants"), ic:"kid"});
  if (feat("planner")) items.push({id:"agenda", label:T("Agenda"), ic:"cal"});
  if ((feat("rewards") || (feat("chat") && allow("chat")) || (feat("groups") && allow("groups")))) items.push({id:"tribu", label:appName(), ic:"people", badge:unreadCount()});
  if ((feat("memories") || feat("photos")) && allow("photos")) items.push({id:"souvenirs", label:T("Souvenirs"), ic:"camera"});
  return items;
}
function renderNav(){
  const items = navItems();
  const btn = n => `<button class="nav-btn" data-act="go" data-v="${n.id}" ${UI.view===n.id?'aria-current="page"':""}>${icon(n.ic)}<span>${n.label}</span>${n.badge?`<span class="badge">${n.badge}</span>`:""}</button>`;
  $("#sidenav").innerHTML = items.map(btn).join("") + (isKidUser() && !allow("settings") ? "" : btn({id:"plus", label:T("Réglages"), ic:"sliders"}));
  $("#bottomnav").innerHTML = items.slice(0,5).map(btn).join("");
  $("#brand").innerHTML = `${logo(40)}<span style="display:flex;flex-direction:column">${wordmark()}<span class="tiny muted">${esc(S.family.name || T("Ma famille"))}</span></span>`;
  $("#sidefoot").innerHTML = `${Cloud.user ? `<div class="row small muted" style="padding:0 8px">${icon("user").replace("<svg",'<svg style="width:16px;height:16px"')}${esc(Cloud.user.email||"")}</div>` : ""}<button class="nav-btn" data-act="urgence">${icon("phone")}<span>${T("Urgence")} · 811</span></button>`;
  const fab = $("#fab"); fab.hidden = !(feat("ai") && allow("ai")); fab.setAttribute("aria-label", T("Assistant IA"));
}
function go(v){ UI.view = v; closeSheet(); try { history.replaceState(null, "", "#" + v); } catch(e){} render(); window.scrollTo({top:0}); }
const themeIcon = () => S.settings.theme === "dark" ? "moon" : S.settings.theme === "light" ? "sun" : "auto";
function topbar(){
  const showKids = UI.view === "kid" && S.children.length;
  return `<div class="top">
    ${showKids ? `<div class="chips-scroll" role="group" aria-label="${T("Enfants")}">${S.children.map(c => `<button class="kid-pill" data-act="kid" data-v="${c.id}" aria-pressed="${c.id===S.active}">${avatarOf(c,30)}${esc(c.nick||c.name)}</button>`).join("")}${isKidUser()?"":`<button class="add-kid" data-act="kidForm">+ ${T("Enfant")}</button>`}</div>`
      : `<div class="grow row" style="gap:10px">${UI.view==="home"?"":`<h1 style="font-size:1.4rem">${esc({agenda:T("Agenda"), tribu:appName(), souvenirs:T("Souvenirs"), plus:T("Réglages")}[UI.view]||"")}</h1>`}</div>`}
    <button class="icon-btn" data-act="search" title="${T("Rechercher")}" aria-label="${T("Rechercher")}">${icon("search")}</button>
    <button class="icon-btn" data-act="theme" title="${T("Thème")}" aria-label="${T("Changer le thème")}">${icon(themeIcon())}</button>
    <button class="icon-btn" data-act="urgence" title="${T("Urgence et ressources")}" aria-label="${T("Urgence et ressources")}" style="color:var(--danger)">${icon("phone")}</button>
  </div>${isKidUser() ? `<div class="kidmode">${icon("lock").replace("<svg",'<svg style="width:18px;height:18px"')}<span class="grow">${S.settings.parental.kidMode ? T("Mode enfant activé") : T("Compte enfant")}</span>${S.settings.parental.kidMode?`<button class="btn sm ghost" data-act="exitKidMode">${T("Quitter")}</button>`:""}</div>` : ""}`;
}

/* ---------- rendu ---------- */
let renderPending = false;
function render(){
  applyLook(); renderNav();
  if (Cloud.ready && Cloud.mustLogin()){ $("#main").innerHTML = authView(); return; }
  if (!navItems().some(n => n.id === UI.view) && !["plus","assistant"].includes(UI.view)) UI.view = "home";
  let html = UI.view === "assistant" ? "" : topbar();
  if (S.demo && !isKidUser()) html += `<div class="banner info">${icon("info")}<div>${T("Vous voyez des <b>données d'exemple</b>.")} <button class="btn sm ghost" data-act="clearDemo" style="margin-left:6px">${T("Commencer avec ma famille")}</button></div></div>`;
  try { html += ({home:homeView, kid:kidView, agenda:agendaView, tribu:tribuView, souvenirs:souvenirsView, plus:plusView, assistant:assistantView}[UI.view] || homeView)(); }
  catch(e){ console.error("view", UI.view, e); AFTER.length = 0; html += `<div class="card">${empty("alert", T("Cette page n'a pas pu s'afficher."), `<button class="btn kid" data-act="retryView">${T("Réessayer")}</button>`)}<p class="tiny muted" style="text-align:center">${esc(String(e.message||e))}</p></div>`; }
  $("#main").innerHTML = html;
  afterRender(); centerPressed("#main");
  if (!S.settings.onboarded && !UI.obShown) setTimeout(() => { if (!UI.obShown && !$("#layer .scrim") && !(Cloud.ready && Cloud.mustLogin()) && (Cloud.ready || !window.TRIBE_FIREBASE)){ UI.obShown = true; maybeOnboard(); } }, 700);
}
const AFTER = [];
function afterRender(){ AFTER.splice(0).forEach(f => { try { f(); } catch(e){ console.error(e); } }); }
/* rafraîchit seulement si l'utilisateur n'est pas en train d'écrire */
function softRender(){ if ($("#layer .scrim") || document.activeElement?.matches?.("input,textarea")) { renderPending = true; return; } render(); }

/* ======== PENSÉE DU JOUR (Gemini, sinon une pensée de la liste) ======== */
const QUOTE_THEMES = ["la sagesse","le bien-être","la gratitude","la patience","l'enfance","le temps qui passe","le bonheur simple","la bienveillance","le courage","l'émerveillement","la famille","la résilience","la présence à l'instant","la curiosité","l'amour","la nature","l'humour","la confiance en soi","apprendre","la paix intérieure"];
/* citations connues (secours sans IA) */
const QUOTES = [["On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.","Antoine de Saint-Exupéry","Le Petit Prince"],["Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.","Sénèque","Lettres à Lucilius"],["Un voyage de mille lieues commence toujours par un premier pas.","Lao Tseu","Tao-tö-king"],["Le rire est un soleil qui chasse l'hiver du visage humain.","Victor Hugo","Les Misérables"],["Le plus grand bien que nous puissions faire aux autres n'est pas de leur communiquer nos richesses, mais de leur faire découvrir les leurs.","Louis Lavelle",""],["La patience est amère, mais son fruit est doux.","Jean-Jacques Rousseau",""],["Le bonheur se trouve même dans les moments les plus sombres, il suffit de se souvenir d'allumer la lumière.","Albus Dumbledore","Harry Potter et le prisonnier d'Azkaban (film)"],["Ohana, ça veut dire famille. Famille veut dire que personne ne doit être abandonné, ni oublié.","Lilo et Stitch","film Disney, 2002"],["Profitez des petites choses, car un jour vous regarderez en arrière et vous comprendrez que c'étaient les grandes.","Robert Brault",""],["Le bonheur n'est pas quelque chose de tout fait. Il vient de vos propres actions.","Dalaï-lama",""],["Ce qui compte, ce n'est pas ce que l'on regarde, c'est ce que l'on voit.","Henry David Thoreau",""],["Il n'est pas nécessaire d'espérer pour entreprendre, ni de réussir pour persévérer.","Guillaume d'Orange",""],["Hakuna matata : ça veut dire pas de soucis.","Le Roi lion","film Disney, 1994"],["Chaque enfant qu'on enseigne est un homme qu'on gagne.","Victor Hugo",""]];
function quoteCard(){
  if (S.settings.quoteOff) return "";
  const td = iso(today()), q = S.quote?.date === td && S.quote.author ? S.quote : null;
  if (!q && aiReady() && aiKey() && !UI.quoteBusy) setTimeout(makeQuote, 800);
  const dayN = Math.floor(today() / DAY), f = QUOTES[dayN % QUOTES.length], text = q?.text || T(f[0]), author = q ? q.author : f[1], src = q ? q.source : f[2];
  return `<div class="quote-card"><span class="q-mark">“</span><p>${esc(text)}</p><div class="q-author">— ${esc(author)}${src ? `, <i>${esc(src)}</i>` : ""}</div><div class="row between" style="gap:6px"><span class="tiny muted">${q?.theme ? T("Pensée du jour · {t}",{t:esc(q.theme)}) : T("Pensée du jour")}</span>${aiReady() && aiKey() ? `<button class="icon-btn flat" data-act="quoteNew" aria-label="${T("Une autre pensée")}" title="${T("Une autre pensée")}">${icon("auto")}</button>` : ""}</div></div>`;
}
async function makeQuote(force){
  if (UI.quoteBusy || (!force && S.quote?.date === iso(today()) && S.quote.author)) return; UI.quoteBusy = true;
  try {
    const theme = QUOTE_THEMES[(Math.floor(today() / DAY) + (force ? Math.floor(Math.random()*9)+1 : 0)) % QUOTE_THEMES.length];
    const recent = (S.quoteSeen || []).slice(-30).join(" | ");
    const schema = {type:"OBJECT", properties:{quote:{type:"STRING"}, author:{type:"STRING"}, source:{type:"STRING"}}, required:["quote","author"]};
    const r = await gemini({tier:"fast", json:schema, temperature:0.9, contents:[{role:"user", parts:[{text:`Donne UNE citation réelle, connue et vérifiable, inspirante, philosophique ou de bien-être, sur le thème « ${theme} » : d'un philosophe, d'un écrivain, d'une personnalité, d'un film ou d'une série, d'un musicien (une parole prononcée en entrevue, jamais des paroles de chanson), ou un proverbe. Varie les époques et les origines. Courte (au plus 30 mots), en ${LANG==="en"?"anglais":"français"} (traduction usuelle si besoin). author = la personne, le personnage ou « Proverbe X » ; source = l'œuvre ou le film si pertinent, sinon vide. N'invente rien : si tu n'es pas sûr de l'auteur, choisis une citation dont tu es certain. Évite : ${recent || "rien"}.`}]}]});
    const o = parseJSON(r.text), text = String(o.quote||"").trim().replace(/^["«“\s]+|["»”\s]+$/g, "");
    if (text.length > 8 && o.author){ S.quote = {date:iso(today()), text, author:String(o.author).trim(), source:String(o.source||"").trim(), theme}; S.quoteSeen = [...(S.quoteSeen||[]), text.slice(0, 60)].slice(-40); save(); if (UI.view === "home") softRender(); }
  } catch(e){ console.warn("quote", e); }
  UI.quoteBusy = false;
}
Object.assign(ACT, { quoteNew: () => { toast(T("Nouvelle pensée…")); makeQuote(true); } });

/* ======== ACCUEIL FAMILIAL ======== */
function homeView(){
  const h0 = new Date().getHours(), hello = h0 < 12 ? T("Bonjour") : h0 < 18 ? T("Bon après-midi") : T("Bonsoir");
  const m = me();
  let h = `<section class="hero" style="background:var(--surface)"><div>${S.family.photo || S.family.emoji ? familyPic(72) : logo(64)}</div><div class="stack" style="gap:4px;min-width:0"><span class="eyebrow">${fmtD(today(),{weekday:"long",day:"numeric",month:"long"})}</span><h1>${hello}${m?.name && m.name !== T("Moi") ? ", "+esc(m.name) : ""}</h1>
    <div class="row">${S.family.members.slice(0,8).map(x => `<span title="${esc(x.name)}">${avatarOf(x, 32)}</span>`).join("")}${isKidUser()?"":`<button class="btn sm ghost" data-act="go" data-v="plus">${icon("people")}${T("Ma famille")}</button>`}</div></div></section>`;
  h += quoteCard();
  const pj = (() => { try { return localStorage.getItem("tribe.join"); } catch(e){ return null; } })();
  if (pj && Cloud.configured !== false) h += `<div class="banner info">${icon("key")}<div class="grow small"><b>${T("Invitation reçue")}</b> · ${T("code {c}",{c:esc(pj)})}<br>${Cloud.user ? T("Touchez « Rejoindre » pour entrer dans la famille avec ce compte.") : T("Connectez-vous ou créez votre compte, puis touchez « Rejoindre ».")}</div><div class="stack" style="gap:4px">${Cloud.user ? `<button class="btn sm kid" data-act="joinPending">${T("Rejoindre")}</button>` : `<button class="btn sm kid" data-act="showLogin">${T("Se connecter")}</button>`}<button class="btn sm line" data-act="joinDismiss">${T("Ignorer")}</button></div></div>`;
  if (!S.children.length && !isKidUser() && !pj) h += `<div class="card"><div class="empty">${logo(72)}<h2>${T("Bienvenue dans {app}",{app:esc(appName())})}</h2><p>${T("L'app tout-en-un de la famille : suivi des enfants de la grossesse à 18 ans, agenda partagé, défis, souvenirs.")}</p><div class="row"><button class="btn kid" data-act="kidForm">${T("Ajouter un enfant")}</button><button class="btn ghost" data-act="kidForm" data-v="__pre">${T("Bébé à naître")}</button></div></div></div>`;
  h += `<div class="grid">`;
  // enfants
  S.children.forEach(c => {
    const st = stageKid(c), nv = nextVaccines(c);
    let line = "";
    if (isPrenatal(c)){ const p = pregWeek(c); line = T("{w} semaines · naissance prévue le {d}",{w:p.w, d:fmtD(c.dueDate,{day:"numeric",month:"long"})}); }
    else { const T0 = dayTotals(c, today()); line = [T0.sleep?T("Sommeil {v}",{v:fmtMin(T0.sleep)}):"", T0.feeds?T("{n} boires",{n:T0.feeds}):"", T0.act?T("Activité {v}",{v:fmtMin(T0.act)}):""].filter(Boolean).join(" · ") || T("Rien de noté aujourd'hui"); }
    h += `<button class="card c4" style="border:0;text-align:left;cursor:pointer;color:inherit" data-act="openKid" data-v="${c.id}"><div class="row">${avatarOf(c,48)}<div class="grow"><b style="font-family:var(--display);font-size:1.1rem">${esc(c.nick||c.name)}</b><div class="small muted">${kidAge(c)}</div></div><span class="chip ${st.color}">${T(st.label)}</span></div>
      <div class="small">${line}</div>${nv && nv.doses.some(d=>d.st!=="avenir") && feat("planner") ? `<span class="chip ${nv.doses.some(d=>d.st==="retard")?"danger":"butter"}">${icon("syringe")}${T("Vaccins {l}",{l:T(nv.group.label)})}</span>`:""}</button>`;
  });
  // défis du jour (cases à cocher directement depuis l'accueil)
  if (feat("rewards") && S.tasks.length){
    const par = !isKidUser(), vw = actor(), due = S.tasks.filter(t => taskDueOn(t, today())).map(t => taskBlock(t, today(), par, vw, null)).filter(Boolean);
    if (due.length) h += `<div class="card c6"><div class="card-h"><h2>${T("Défis du jour")}</h2><button class="btn sm ghost" data-act="tribuTab" data-v="defis">${T("Voir tout")}</button></div><div class="list">${due.slice(0,4).join("")}</div>${due.length > 4 ? `<p class="tiny muted">${T("+ {n} autres dans Défis",{n:due.length-4})}</p>` : ""}</div>`;
  }
  // aujourd'hui
  if (feat("planner")){
    const ev = allEvents().filter(e => e.date === iso(today()) && e.type !== "photo").sort(evSort);
    const up = allEvents().filter(e => e.date > iso(today()) && e.type !== "sport").sort(evSort).slice(0,4);
    h += `<div class="card c6"><div class="card-h"><h2>${T("Aujourd'hui")}</h2><button class="btn sm ghost" data-act="eventForm">${icon("plus")}${T("Ajouter")}</button></div>
      ${ev.length ? `<div class="list">${ev.map(eventRow).join("")}</div>` : `<p class="muted small">${T("Rien de prévu aujourd'hui.")}</p>`}
      ${up.length ? `<div class="sep"></div><span class="eyebrow">${T("Bientôt")}</span><div class="list">${up.map(eventRow).join("")}</div>` : ""}</div>`;
  }
  // souvenir ce jour-là + photo du jour
  if (feat("memories") || feat("photos")){
    const md0 = iso(today()).slice(5), past = S.memories.filter(x => x.date.slice(5) === md0 && x.date < iso(today()));
    const photosToday = S.photos.filter(p => p.date === iso(today()));
    h += `<div class="card c6"><div class="card-h"><h2>${T("Souvenirs")}</h2><button class="btn sm ghost" data-act="go" data-v="souvenirs">${T("Album")}</button></div>
      ${past.length ? past.map(x => `<div class="memory"><b>${T("Il y a {n} an(s) aujourd'hui",{n:today().getFullYear()-parseD(x.date).getFullYear()})}</b><div>${esc(x.title)}</div></div>`).join("") : ""}
      ${feat("photos") ? (photosToday.length ? `<div class="thumbs">${photosToday.map(p => `<button data-act="openPhoto" data-v="${p.id}" aria-label="${esc(p.caption||T("Photo"))}"><img data-photo="${p.id}" alt=""></button>`).join("")}<button class="add" data-act="photoDay" aria-label="${T("Ajouter une photo")}">${icon("plus")}</button></div>` : `<button class="btn kid" data-act="photoDay">${icon("camera")}${T("Prendre la photo du jour")}</button>`) : ""}
      ${feat("memories") ? `<button class="btn ghost" data-act="memoryForm">${icon("star")}${T("Noter un moment précieux")}</button>` : ""}</div>`;
    if (photosToday.length) AFTER.push(async () => { for (const el of $$(".thumbs img[data-photo]")){ const d = await PhotoDB.get(el.dataset.photo); if (d) el.src = d; } });
  }
  // défis
  if (feat("rewards") && S.tasks.length){
    const board = leaderboard().slice(0,4);
    h += `<div class="card c6"><div class="card-h"><h2>${T("Défis de la semaine")}</h2><button class="btn sm ghost" data-act="tribuTab" data-v="defis">${T("Voir")}</button></div>
      ${board.map((b,i) => `<div class="row">${avatarOf(b.m,32)}<span class="grow"><b>${esc(b.m.name)}</b></span><span class="chip butter">${icon("star")}${b.week} ${T("pts")}</span>${i===0&&b.week?icon("trophy").replace("<svg",'<svg style="width:20px;height:20px;color:var(--butter-ink)"'):""}</div>`).join("")}</div>`;
  }
  // discussion
  if (feat("chat") && allow("chat") && Cloud.user){
    const last = S.messages.slice(-2);
    h += `<div class="card c6"><div class="card-h"><h2>${T("Discussion de famille")}</h2><button class="btn sm ghost" data-act="tribuTab" data-v="chat">${T("Ouvrir")}</button></div>${last.length ? last.map(msgRow).join("") : `<p class="small muted">${T("Aucun message.")}</p>`}</div>`;
  }
  // conseil pour les parents
  if (feat("tips") && !isKidUser()){
    const ages = S.children.map(c => isPrenatal(c) ? -1 : ageMonths(c)); const minA = ages.length ? Math.min(...ages) : 24;
    const pt = TIPS.filter(t => t[0] === "parents" && minA >= t[1] && minA < t[2]); const tip = pt[Math.floor(today()/DAY) % Math.max(1,pt.length)];
    if (tip) h += `<div class="card c6">${tipCard(tip)}</div>`;
  }
  return h + `</div>`;
}
const tipCard = t => `<div class="tipcard" style="background:var(--${TIPCAT[t[0]][1]}-bg)"><span class="dom" style="color:var(--${TIPCAT[t[0]][1]}-ink)">${T(TIPCAT[t[0]][0])}</span><b>${T(t[3])}</b><p class="small">${T(t[4])}</p></div>`;

/* ======== CONNEXION ======== */
function authView(){
  return `<div class="auth"><div class="card" style="align-items:stretch">
    <div class="row" style="justify-content:center">${logo(64)}</div>
    <h1 style="text-align:center;font-size:2.4rem">${wordmark()}</h1><p class="muted small" style="text-align:center">${T("L'app tout-en-un de la famille.")}</p>
    <button class="btn line block" data-act="googleLogin">${icon("google")}${T("Continuer avec Google")}</button>
    <div class="or">${T("ou avec un courriel")}</div>
    <form class="stack" data-form="emailAuth">
      ${fld("a-email",T("Courriel"),`<input class="inp" id="a-email" type="email" autocomplete="email" required>`)}
      ${fld("a-pass",T("Mot de passe (6 caractères ou plus)"),`<input class="inp" id="a-pass" type="password" autocomplete="current-password" minlength="6" required>`)}
      <div class="row"><button class="btn kid grow" type="submit" name="mode" value="login">${T("Se connecter")}</button><button class="btn ghost grow" type="submit" name="mode" value="signup">${T("Créer un compte")}</button></div>
      <button type="button" class="btn sm ghost" data-act="resetPass">${T("Mot de passe oublié")}</button>
    </form>
    <div class="sep"></div><button class="btn sm ghost" data-act="skipLogin">${T("Continuer sans compte (données sur cet appareil)")}</button>
  </div></div>`;
}

/* ======== RÉGLAGES ======== */
function plusView(){
  const m = me(), P = S.settings.parental;
  const row = (act, ic, t, s, extra="") => `<button class="li" data-act="${act}" ${extra}><div class="ic" style="background:var(--kid-bg);color:var(--kid-ink)">${icon(ic)}</div><div class="grow"><div class="li-title">${t}</div><div class="small muted">${s}</div></div>${icon("right").replace("<svg",'<svg style="width:18px;height:18px;color:var(--soft)"')}</button>`;
  return `<div class="grid">
    <div class="card c6"><div class="card-h"><h2>${T("Compte")}</h2></div>
      ${Cloud.user ? `<div class="row">${avatarOf(m,44)}<div class="grow"><b>${esc(m?.name||"")}</b><div class="small muted">${esc(Cloud.user.email||"")}</div></div><button class="btn sm ghost" data-act="logout">${icon("logout")}${T("Déconnexion")}</button></div>`
        : Cloud.configured ? `<p class="small muted">${T("Créez un compte pour partager avec la famille, discuter, et retrouver vos données sur tous vos appareils.")}</p><button class="btn kid" data-act="showLogin">${T("Se connecter ou créer un compte")}</button>`
        : `<div class="banner soft">${icon("info")}<div class="small">${T("Les comptes seront actifs dès que la configuration Firebase sera ajoutée à l'app. Pour l'instant, tout reste sur cet appareil.")}</div></div>`}
      <div class="list">${row("memberForm","user",T("Mon profil"),T("Nom, avatar, couleur"),`data-v="${S.me}"`)}${row("familySheet","people",T("Ma famille"),T("Membres, invitation, rôles"))}</div>
      ${Cloud.user ? `<div class="sep"></div><h3>${icon("drive").replace("<svg",'<svg style="width:18px;height:18px;vertical-align:-3px"')} Google Drive</h3>${Cloud.canDrive?.() ? `<p class="small muted">${T("Tout est rangé dans le dossier « Tribe » de votre Drive : Photos du jour, Moments, Spéciaux, Histoires et Suivi (un document par enfant). Les textes sont des documents Google Docs bien mis en page, à ouvrir ou télécharger en Word ou PDF. Une modification remplace la copie ; une suppression la retire du Drive. Les lettres scellées restent privées.")}</p><label class="switch"><input type="checkbox" data-change="driveAuto" ${S.settings.driveAuto!==false?"checked":""}><span class="tg"></span><span class="grow">${T("Copie automatique dans Google Drive")}</span></label>${driveSettings()}${driveBanner()}<div class="row" style="flex-wrap:wrap"><button class="btn sm ghost" data-act="driveAll">${icon("auto")}${T("Copier tout ce qui manque")}</button><button class="btn sm kid" data-act="driveTest">${icon("drive")}${T("Tester Google Drive")}</button>${S.settings.driveFolder?`<a class="btn sm ghost" href="https://drive.google.com/drive/folders/${esc(S.settings.driveFolder)}" target="_blank" rel="noopener">${T("Ouvrir le dossier")}</a>`:""}</div><div id="driveOut" class="small">${S.settings.driveErr?`<span style="color:var(--danger)">${esc(S.settings.driveErr)}</span>`:""}</div>` : `<p class="small muted">${T("Pour copier les souvenirs dans Google Drive, connectez-vous avec Google (pas seulement par courriel).")}</p>`}` : ""}</div>
    <div class="card c6"><div class="card-h"><h2>${T("Apparence")}</h2></div>
      <div class="field"><label>${T("Langue")}</label><div class="pick">${[["fr","Français"],["en","English"]].map(([k,l])=>`<button data-act="setLang" data-v="${k}" aria-pressed="${LANG===k}">${l}</button>`).join("")}</div></div>
      <div class="field"><label>${T("Unités")}</label><div class="stack" style="gap:6px">${[["w",T("Poids"),[["kg","kg"],["lb","lb"]]],["l",T("Taille"),[["cm","cm"],["in",T("pouces")]]],["v",T("Volumes"),[["ml","ml"],["oz","oz"]]],["t",T("Température"),[["C","°C"],["F","°F"]]]].map(([k,l,opts]) => `<div class="row" style="gap:8px"><span class="small muted" style="width:96px">${l}</span><div class="seg" style="width:auto">${opts.map(([v,lb]) => `<button data-act="setUnit" data-v="${k}:${v}" aria-pressed="${UN()[k]===v}">${lb}</button>`).join("")}</div></div>`).join("")}<p class="tiny muted">${T("Les courbes OMS restent calculées en métrique ; seul l'affichage change.")}</p></div></div>
      <div class="field"><label>${T("Nom de l'app")}</label><div class="pick">${["Tribe","Tribu"].map(k=>`<button data-act="setAppName" data-v="${k}" aria-pressed="${appName()===k}">${k}</button>`).join("")}</div></div>
      <div class="field"><label>${T("Thème")}</label><div class="pick">${[["auto",T("Automatique")],["light",T("Clair")],["dark",T("Sombre")]].map(([k,l])=>`<button data-act="setTheme" data-v="${k}" aria-pressed="${(S.settings.theme||"auto")===k}">${l}</button>`).join("")}</div></div>
      <div class="field"><label>${T("Couleur de fond")}</label><div class="swatches">${BGS.map(b=>`<label title="${T(b.l)}"><input type="radio" name="bg" value="${b.id}" ${S.settings.bg===b.id?"checked":""} data-change="setBg"><span style="background:${isDark()?b.dark:b.light};border:1px solid var(--line)"></span></label>`).join("")}<label title="${T("Personnalisée")}"><input type="color" value="${S.settings.bg?.startsWith?.("#")?S.settings.bg:"#F6F4FB"}" data-change="setBgCustom" style="width:38px;height:38px;border:0;border-radius:50%;padding:0;background:none;cursor:pointer;position:static;opacity:1;pointer-events:auto"></label></div></div></div>
    <div class="card c6"><div class="card-h"><h2>${T("Style")}</h2>${icon("sliders")}</div><p class="small muted">${T("S'applique en mode clair comme en mode sombre : les couleurs s'adaptent toutes seules.")}</p>
      ${lookPick("card", T("Encadrés"), [["doux",T("Doux (ombre)")],["contour",T("Contour")],["plat",T("Plat")],["teinte",T("Teinté")],["verre",T("Verre")],["pastel",T("Arc-en-ciel")]], "doux")}
      ${lookPick("tabs", T("Onglets"), [["pilule",T("Pilule")],["plein",T("Plein")],["souligne",T("Souligné")]], "pilule")}
      <div class="field"><label>${T("Couleur des onglets et encadrés")}</label><div class="swatches">${[["", T("Automatique (couleur du membre)")], ...["lilac","peach","mint","sky","rose","teal","coral","butter"].map(k => [k, k])].map(([k, l]) => `<label title="${esc(l)}"><input type="radio" name="acc" value="${k}" ${(S.settings.look?.accent||"")===k?"checked":""} data-change="lookAccent"><span style="background:${k ? `var(--${k})` : "conic-gradient(var(--peach),var(--mint),var(--sky),var(--lilac),var(--peach))"};border:1px solid var(--line)"></span></label>`).join("")}</div></div>
      ${lookPick("radius", T("Coins"), [["rond",T("Arrondis")],["moyen",T("Moyens")],["droit",T("Droits")]], "rond")}
      <label class="switch"><input type="checkbox" data-change="quoteOn" ${S.settings.quoteOff?"":"checked"}><span class="tg"></span><span class="grow">${T("Pensée du jour à l'accueil")}</span></label>
      <div class="pick"><button data-act="lookReset">${T("Style par défaut")}</button></div></div>
    <div class="card c6"><div class="card-h"><h2>${T("Fonctions")}</h2></div><p class="small muted">${T("Affichez seulement ce qui vous est utile.")}</p>
      <div>${FEATURES.map(f => `<label class="switch"><input type="checkbox" data-change="feature" data-k="${f.k}" ${feat(f.k)?"checked":""}><span class="tg"></span><span class="grow"><b>${T(f.l)}</b><span class="tiny muted" style="display:block">${T(f.d)}</span></span></label>`).join("")}</div></div>
    <div class="card c6"><div class="card-h"><h2>${T("Contrôle parental")}</h2>${icon("lock")}</div>
      <p class="small muted">${T("Le mode enfant limite l'app sur cet appareil. Les comptes enfants ont toujours ces limites.")}</p>
      ${P.pin ? "" : `<div class="banner warn">${icon("key")}<div class="small">${T("Choisissez d'abord un NIP parental pour pouvoir quitter le mode enfant.")}</div></div>`}
      <div class="row"><button class="btn ghost" data-act="pinForm">${icon("key")}${P.pin?T("Changer le NIP"):T("Choisir un NIP")}</button><button class="btn kid" data-act="enterKidMode" ${P.pin?"":"disabled"}>${icon("lock")}${T("Activer le mode enfant")}</button></div>
      <div>${[["chat",T("Discussions")],["groups",T("Groupes d'amis")],["photos",T("Photos et souvenirs")],["ai",T("Assistant IA")],["health",T("Voir la santé et la croissance")],["selfApprove",T("Valider ses propres défis")],["delete",T("Supprimer des éléments")],["settings",T("Modifier les réglages")]].map(([k,l]) => `<label class="switch"><input type="checkbox" data-change="allow" data-k="${k}" ${P.allow[k]?"checked":""}><span class="tg"></span><span class="grow">${T("Permettre aux enfants")} : <b>${l}</b></span></label>`).join("")}</div></div>
    <div class="card c6"><div class="card-h"><h2>${T("Notifications")}</h2>${icon("bell")}</div>${notifSettings()}</div>
    <div class="card c6"><div class="card-h"><h2>${T("Assistant IA")}</h2>${icon("spark")}</div>${aiSettings()}</div>
    <div class="card c12"><div class="card-h"><h2>${T("Mes données")}</h2>${icon("db")}</div>
      ${Cloud.user && Cloud.syncLine?.() ? `<div class="row" style="flex-wrap:wrap;gap:8px"><span class="small ${Cloud.status?.ok===false?"":"muted"}" style="${Cloud.status?.ok===false?"color:var(--danger)":""}">${esc(Cloud.syncLine())}</span><button class="btn sm ghost" data-act="resync">${icon("auto")}${T("Resynchroniser (photos incluses)")}</button></div>` : ""}
      <p class="small muted">${Cloud.user ? T("Vos données sont sauvegardées dans votre compte et sur cet appareil.") : T("Les données restent sur cet appareil. Exportez-les régulièrement.")}</p>
      <div class="row"><button class="btn ghost" data-act="exportJson">${icon("db")}${T("Tout exporter (JSON)")}</button><button class="btn ghost" data-act="exportCsv">${icon("doc")}${T("Journal et mesures (CSV)")}</button><button class="btn ghost" data-act="exportIcs">${icon("cal")}${T("Agenda (.ics)")}</button><label class="btn line" style="cursor:pointer">${T("Importer")}<input type="file" id="impFile" accept=".json,application/json" hidden data-change="importFile"></label></div>
      <div class="sep"></div><button class="btn danger" data-act="askWipe" style="align-self:flex-start">${T("Tout effacer sur cet appareil")}</button><div id="wipeConfirm"></div></div>
    <div class="card c12"><div class="row" style="gap:14px">${logo(48)}<div><h2>${wordmark()}</h2><p class="small muted">${T("Suivi des enfants, agenda, défis et souvenirs pour toute la famille.")} · v4.0</p></div></div></div>
  </div>`;
}
function notifSettings(){
  const N = S.settings.notif;
  const sw = (k, l) => `<label class="switch"><input type="checkbox" data-change="notif" data-k="${k}" ${N[k]?"checked":""} ${N.enabled?"":"disabled"}><span class="tg"></span><span class="grow">${l}</span></label>`;
  return `<label class="switch"><input type="checkbox" data-change="notifOn" ${N.enabled?"checked":""}><span class="tg"></span><span class="grow"><b>${T("Activer les rappels")}</b><span class="tiny muted" style="display:block">${Native.isApp ? T("Rappels sur le téléphone, même app fermée.") : T("Dans le navigateur, seulement quand la page est ouverte. L'APK les envoie en tout temps.")}</span></span></label>
    ${sw("events",T("Rendez-vous et événements (la veille et 1 h avant)"))}${sw("vaccines",T("Vaccins et visites à prévoir"))}${sw("memories",T("Souvenirs « ce jour-là »"))}${sw("review",T("Revue IA (au jour et à l'heure choisis dans l'Assistant)"))}${sw("tasks",T("Défis à heure fixe"))}${sw("chat",T("Messages et mentions @ dans la discussion"))}
    <label class="switch"><input type="checkbox" data-change="notif" data-k="goals" ${N.goals?"checked":""} ${N.enabled?"":"disabled"}><span class="tg"></span><span class="grow">${T("Rappel quotidien des objectifs (lecture, activité)")}</span><input class="inp" type="time" value="${N.goalTime}" data-change="goalTime" style="width:auto"></label>
    ${N.enabled?`<button class="btn sm ghost" data-act="notifTest">${icon("bell")}${T("Envoyer une notification test (dans 5 s)")}</button>`:""}`;
}

/* ---------- profils ---------- */
function avatarPicker(p, prefix){
  const kind = p.avatar?.kind || "auto", id = p.avatar?.id || "";
  const grid = list => `<div class="avgrid">${list.map(a => `<label><input type="radio" name="${prefix}av" value="${a}" ${id===a&&kind!=="auto"&&!p.photo?"checked":""}><svg viewBox="0 0 64 64" width="44" height="44">${avatarArt(a, p.color||"peach")}</svg>${T(AV_LABEL[a])}</label>`).join("")}</div>`;
  return `<div class="field"><label>${T("Avatar")}</label>
    <div class="row"><div id="${prefix}Prev">${avatarOf(p,64)}</div><div class="stack" style="gap:6px"><button type="button" class="btn sm ghost" data-act="pickPhoto" data-v="${prefix}">${icon("camera")}${T("Photo (facultatif)")}</button>${p.photo?`<button type="button" class="btn sm line" data-act="rmPhoto" data-v="${prefix}">${T("Retirer la photo")}</button>`:""}<label class="row small" style="gap:6px"><input type="radio" name="${prefix}av" value="__auto" ${kind==="auto"&&!p.photo?"checked":""}>${T("Automatique selon l'âge")}</label></div></div>
    <details ${kind!=="auto"?"open":""}><summary class="small" style="cursor:pointer;font-weight:700">${T("Animaux")}</summary>${grid(AVATARS.animaux)}</details>
    <details ${kind==="symbole"?"open":""}><summary class="small" style="cursor:pointer;font-weight:700">${T("Symboles")}</summary>${grid(AVATARS.symboles)}</details></div>`;
}
function readAvatar(prefix){
  const v = radio(prefix+"av");
  if (!v || v === "__auto") return {kind:"auto"};
  return {kind: AVATARS.animaux.includes(v) ? "animal" : "symbole", id:v};
}
function kidForm(id){
  const pre = id === "__pre";
  const c = S.children.find(k => k.id === id) || {...blankKid(), name:"", dob:pre?null:"", dueDate:pre?iso(addDays(today(),120)):null, sex:"", gaW:40, gaD:0, color:"mint"};
  const prenatal = pre || isPrenatal(c);
  UI.photoDraft = {kid: c.photo || null};
  sheet(`<form class="stack" data-form="kid" data-id="${S.children.includes(c)?c.id:""}" style="gap:14px">${sheetHead(S.children.includes(c)?T("Profil"):prenatal?T("Bébé à naître"):T("Nouvel enfant"))}
    <div class="field"><label>${T("Statut")}</label>${radios("born",[["oui",T("Né·e")],["non",T("À naître")],["adulte",T("Adulte (parent qui veut se suivre)")]], c.adult?"adulte":prenatal?"non":"oui")}<p class="tiny muted">${T("Un profil adulte permet au parent de montrer l'exemple : activités et sports, nutrition, lecture, écrans, humeur et défis.")}</p></div>
    <div class="fgrid">${fld("k-name",T("Prénom (ou surnom en attendant)"),inp("k-name",c.name,"required"))}${fld("k-nick",T("Surnom affiché (facultatif)"),inp("k-nick",c.nick||""))}</div>
    <div class="fgrid" id="bornFields" ${prenatal?"hidden":""}>${fld("k-dob",T("Date de naissance"),inp("k-dob",c.dob||"",`type="date" max="${iso(today())}"`))}${fld("k-gaw",T("Âge gestationnel (semaines)"),inp("k-gaw",c.gaW||40,'type="number" inputmode="numeric" min="22" max="44"'))}${fld("k-gad",T("+ jours"),inp("k-gad",c.gaD||0,'type="number" inputmode="numeric" min="0" max="6"'))}</div>
    <div class="fgrid" id="preFields" ${prenatal?"":"hidden"}>${fld("k-due",T("Date prévue d'accouchement"),inp("k-due",c.dueDate||"",'type="date"'))}</div>
    <div class="field"><label>${T("Sexe biologique (pour les courbes OMS)")}</label>${radios("sex",[["F",T("Fille")],["M",T("Garçon")],["",T("Inconnu")]],c.sex||"")}</div>
    <div class="field"><label>${T("Couleur")}</label>${swatches("color", c.color)}</div>
    ${avatarPicker(c, "kid")}
    <div class="field"><label>${T("Ambiance de l'app")}</label>${radios("look",[["auto",T("Selon l'âge")],["pre",T("Grossesse")],["nour",T("Bébé")],["bamb",T("Bambin")],["pres",T("Préscolaire")],["scol",T("Scolaire")],["ado",T("Ado")]],c.look||"auto")}</div>
    <details><summary class="small" style="cursor:pointer;font-weight:700">${T("Santé et taille des parents")}</summary><div class="stack" style="margin-top:10px">
      <div class="fgrid">${fld("k-hf",T("Taille du père (cm)"),numIn("k-hf","",1,c.hFather||""))}${fld("k-hm",T("Taille de la mère (cm)"),numIn("k-hm","",1,c.hMother||""))}</div>
      ${fld("k-al",T("Allergies"),inp("k-al",c.allergies||""))}${fld("k-co",T("Problèmes de santé"),inp("k-co",c.conditions||""))}
      <div class="fgrid">${fld("k-me",T("Médicaments réguliers"),inp("k-me",c.meds||""))}${fld("k-dr",T("Médecin ou IPS"),inp("k-dr",c.doctor||""))}${fld("k-de",T("Courriel du médecin (pour les rapports)"),inp("k-de",c.doctorEmail||"",'type="email"'))}${fld("k-ph",T("Pharmacie"),inp("k-ph",c.pharmacy||""))}</div></div></details>
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${S.children.includes(c)?`<button type="button" class="btn danger" data-act="askDelKid" data-v="${c.id}">${T("Supprimer")}</button>`:""}</div><div id="delConfirm"></div></form>`);
}
/* accès personnel d'un enfant : lien ou code qui relie son propre compte à son profil */
function accessBlock(m){
  const c = m.kidId ? kidById(m.kidId) : null, age = c ? ageMonths(c) : null;
  if (m.uid) return `<div class="banner ok">${icon("check")}<div class="small">${T("{n} a son propre accès ({e}).",{n:esc(m.name), e:esc(m.email||T("compte relié"))})} ${T("Ce que les enfants peuvent faire se règle dans Réglages > Contrôle parental.")}</div></div>`;
  return `<div class="card tint" style="padding:12px 14px"><h3>${T("Son propre accès")}</h3>
    <p class="small muted">${age != null && age < 96 ? T("Conseillé vers 8 ans et plus, quand l'enfant a son téléphone ou sa tablette.") : T("{n} peut avoir l'app sur son téléphone : ses défis, son agenda, la discussion de famille. Vous gardez le contrôle parental.",{n:esc(m.name)})}</p>
    ${Cloud.user ? `<button type="button" class="btn sm kid" data-act="kidAccess" data-v="${m.id}">${icon("share")}${T("Créer un lien d'accès")}</button><div id="kidAccessOut"></div>` : `<p class="tiny muted">${T("Connectez-vous d'abord à un compte pour inviter.")}</p>`}</div>`;
}
const joinLink = code => `${location.origin}${location.pathname.replace(/index\.html$/, "")}?join=${code}`.replace(/^(capacitor|https?):\/\/localhost(:\d+)?\/?/, "https://themauritian1996.github.io/care/");
function memberForm(id){
  const m = member(id) || {id:null, name:"", role:"parent", color:"lilac", avatar:{kind:"auto"}};
  UI.photoDraft = {mem: m.photo || null};
  sheet(`<form class="stack" data-form="member" data-id="${m.id||""}" style="gap:14px">${sheetHead(m.id?T("Profil"):T("Nouveau membre"))}
    ${fld("mb-name",T("Nom"),inp("mb-name",m.name,"required"))}
    <div class="field"><label>${T("Rôle")}</label>${radios("role",[["parent",T("Parent")],["enfant",T("Enfant")],["autre",T("Autre (grand-parent, gardien)")]],m.role)}</div>
    <div class="field"><label>${T("Couleur")}</label>${swatches("mcolor", m.color)}</div>
    ${avatarPicker(m, "mem")}
    ${m.id && m.role === "enfant" ? accessBlock(m) : ""}
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${m.id && m.id !== S.me ? `<button type="button" class="btn danger" data-act="delMember" data-v="${m.id}">${T("Retirer")}</button>`:""}</div></form>`);
}
const familyPic = (sz = 64) => S.family.photo ? `<img src="${S.family.photo}" alt="${esc(S.family.name||T("Ma famille"))}" class="fampic" style="width:${sz}px;height:${sz}px">` : S.family.emoji ? `<span class="fampic emo" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.55)}px">${S.family.emoji}</span>` : `<span class="fampic empty" style="width:${sz}px;height:${sz}px">${icon("people")}</span>`;
const EMOJIS = ["🏡","👨‍👩‍👧‍👦","❤️","🌳","⭐","🌈","⚽","🏒","🎒","🏖️","🏕️","🎉","🐾","🎨","🎵","🍕","🧩","🚲","🦊","🐻","🐢","🦄","🚀","🌻"];
const emojiPick = (name, sel, change = "") => `<div class="emopick">${EMOJIS.map(e => `<label><input type="radio" name="${name}" value="${e}" ${sel===e?"checked":""} ${change?`data-change="${change}"`:""}><span>${e}</span></label>`).join("")}<label><input type="radio" name="${name}" value="" ${!sel?"checked":""} ${change?`data-change="${change}"`:""}><span class="tiny">${T("Aucun")}</span></label></div>`;
function familySheet(){
  sheet(`${sheetHead(T("Ma famille"))}
    <div class="row">${familyPic(72)}<div class="stack" style="gap:6px"><button class="btn sm ghost" data-act="famPhoto">${icon("camera")}${S.family.photo?T("Changer la photo de famille"):T("Ajouter une photo de famille")}</button>${S.family.photo?`<button class="btn sm line" data-act="famPhotoDel">${T("Retirer")}</button>`:""}</div></div>
    ${fld("fam-name",T("Nom de la famille"),inp("fam-name",S.family.name,`placeholder="${T("Famille Tremblay")}" data-change="famName"`))}
    <div class="field"><label>${T("Icône de la famille (si pas de photo)")}</label>${emojiPick("famemo", S.family.emoji||"", "famEmoji")}</div>
    <div class="list">${S.family.members.map(m => `<button class="li" data-act="memberForm" data-v="${m.id}">${avatarOf(m,40)}<div class="grow"><div class="li-title">${esc(m.name)}${m.id===S.me?` <span class="chip">${T("moi")}</span>`:""}</div><div class="small muted">${T({parent:"Parent",enfant:"Enfant",autre:"Autre"}[m.role]||"")}${m.email?` · ${esc(m.email)}`:""}</div></div></button>`).join("")}</div>
    <button class="btn ghost" data-act="memberForm">${icon("plus")}${T("Ajouter un membre sans compte")}</button>
    <div class="sep"></div>
    ${Cloud.user ? `<h3>${T("Inviter dans la famille")}</h3><p class="small muted">${T("La personne crée un compte puis entre ce code dans Réglages > Ma famille.")}</p>
      <div class="row"><button class="btn kid" data-act="invite" data-v="parent">${T("Code pour un parent")}</button><button class="btn ghost" data-act="invite" data-v="enfant">${T("Code pour un enfant")}</button></div><div id="inviteOut"></div>
      <form class="row" data-form="joinFamily">${inp("join-code","",`placeholder="${T("Code reçu")}" style="text-transform:uppercase;max-width:180px"`)}<button class="btn ghost" type="submit">${T("Rejoindre une famille")}</button></form>`
      : `<div class="banner soft">${icon("info")}<div class="small">${T("Avec un compte, vous pouvez inviter l'autre parent et les enfants pour partager le même carnet sur plusieurs téléphones.")}</div></div>`}`);
}
function modulesSheet(){
  const c = child(), m = ageMonths(c);
  sheet(`${sheetHead(T("Personnaliser pour {n}",{n:esc(c.nick||c.name)}))}
    <p class="small muted">${T("Par défaut, l'app affiche ce qui convient à l'âge. Masquez ou ajoutez ce que vous voulez.")}</p>
    <div>${MODULES.map(M => `<label class="switch"><input type="checkbox" data-change="module" data-k="${M.k}" ${mod(c,M.k)?"checked":""}><span class="tg"></span><span class="grow"><b>${T(M.l)}</b><span class="tiny muted" style="display:block">${T(M.d)}${c.modules[M.k]!==undefined?" · "+T("réglé à la main"):""}</span></span></label>`).join("")}</div>
    <div class="row"><button class="btn ghost" data-act="resetModules">${T("Revenir aux choix selon l'âge")}</button><button class="btn kid grow" data-act="closeSheet">${T("Terminé")}</button></div>`);
}
function pinForm(){
  sheet(`<form class="stack" data-form="pin" style="gap:14px">${sheetHead(T("NIP parental"))}<p class="small muted">${T("4 chiffres ou plus. Il sert à quitter le mode enfant.")}</p>
    ${fld("pin1",T("Nouveau NIP"),`<input class="inp" id="pin1" type="password" inputmode="numeric" pattern="[0-9]*" minlength="4" required>`)}${fld("pin2",T("Confirmer"),`<input class="inp" id="pin2" type="password" inputmode="numeric" pattern="[0-9]*" minlength="4" required>`)}
    <button class="btn kid" type="submit">${T("Enregistrer")}</button></form>`);
}
function urgence(){
  const n = (l, num, sub, col) => `<div class="li"><div class="ic" style="background:var(--${col}-bg);color:var(--${col}-ink)">${icon("phone")}</div><div class="grow"><div class="small muted" style="font-weight:700">${l}</div><div class="phone num">${num}</div>${sub?`<div class="tiny muted">${sub}</div>`:""}</div><a class="btn sm ${col==="rose"?"danger":"ghost"}" href="tel:${num.replace(/[^0-9]/g,"")}">${T("Appeler")}</a></div>`;
  sheet(`${sheetHead(T("Urgence et ressources"))}
    <div class="banner alert">${icon("alert")}<div>${T("Difficulté à respirer, lèvres bleues, convulsion, perte de conscience, étouffement : <b>911</b> immédiatement.")}</div></div>
    <button class="btn kid wrap" data-act="firstAid">${icon("heart")}<span class="grow" style="text-align:left">${T("Premiers soins : RCR, étouffement, position de sécurité (selon l'âge)")}</span>${icon("right")}</button>
    <div class="list">${n(T("Urgence"),"911","","rose")}${n(T("Info-Santé · Info-Social"),"811",T("Infirmière 24 h/24 (option 1), intervenant psychosocial (option 2)"),"sky")}${n(T("Centre antipoison du Québec"),"1-800-463-5060",T("24 h/24"),"butter")}${n("Tel-jeunes","1-800-263-2266",T("Pour les jeunes. Texto : 514-600-1002"),"lilac")}${n("LigneParents","1-800-361-5085",T("Soutien aux parents, 24 h/24"),"mint")}${n(T("Ligne de crise suicide"),"988",T("Appel ou texto, 24 h/24"),"rose")}</div>`);
}

/* ---------- premier lancement : créer son profil (aucun enfant par défaut) ---------- */
function maybeOnboard(){
  if (S.settings.onboarded || isKidUser() || $("#layer .scrim") || (Cloud.ready && Cloud.mustLogin())) return;
  try { if (localStorage.getItem("tribe.join")) return; } catch(e){}
  const m = me(); if (S.children.length && m && m.name && m.name !== T("Moi")){ S.settings.onboarded = true; save(); return; }
  sheet(`<form class="stack" data-form="onboard" style="gap:14px"><div class="center">${logo(72)}<div style="font-size:2rem">${wordmark()}</div></div><h2 class="center">${T("Bienvenue dans {app} !",{app:esc(appName())})}</h2>
    <p class="small muted center">${T("Commençons par votre profil. Vous ajouterez ensuite vos enfants (ou un bébé à naître) et, si vous voulez, l'autre parent.")}</p>
    ${fld("ob-name",T("Votre prénom"),inp("ob-name", m?.name && m.name !== T("Moi") ? m.name : (Cloud.user?.displayName||""), `required autocomplete="given-name"`))}
    ${fld("ob-fam",T("Nom de la famille (facultatif)"),inp("ob-fam", S.family.name||"", `placeholder="${T("Famille Tremblay")}"`))}
    <div class="field"><label>${T("Votre couleur")}</label>${swatches("obcolor", m?.color || "lilac")}</div>
    <button class="btn kid" type="submit">${T("Continuer")}</button></form>`);
}
function onboardKids(){
  sheet(`${sheetHead(T("Vos enfants"))}<p class="small muted">${T("Ajoutez un enfant ou un bébé à naître. Vous pourrez en ajouter d'autres plus tard.")}</p>
    <div class="stack"><button class="btn kid" data-act="kidForm">${icon("kid")}${T("Ajouter un enfant")}</button><button class="btn ghost" data-act="kidForm" data-v="__pre">${icon("baby")}${T("Bébé à naître")}</button><button class="btn line" data-act="closeSheet">${T("Plus tard")}</button></div>`);
}
Object.assign(FORMS, { onboard: () => { const m = me(), n = val("ob-name"); if (!n) return toast(T("Votre prénom")); m.name = n; m.color = radio("obcolor") || m.color || "lilac"; if (val("ob-fam")) S.family.name = val("ob-fam"); S.settings.onboarded = true; save(); render(); if (!S.children.length) onboardKids(); else closeSheet(); } });

/* aperçu en direct quand on change la couleur ou l'avatar d'un profil */
document.addEventListener("change", e => {
  const t = e.target; if (t.type !== "radio") return;
  const form = t.closest("form"); if (!form) return;
  const prefix = form.querySelector("#kidPrev") ? "kid" : form.querySelector("#memPrev") ? "mem" : null; if (!prefix) return;
  if (!["color","mcolor",prefix+"av"].includes(t.name)) return;
  const color = radio(prefix === "kid" ? "color" : "mcolor") || "peach", av = readAvatar(prefix);
  const base = prefix === "kid" ? (S.children.find(k => k.id === form.dataset.id) || {dob:val("k-dob")||iso(today())}) : (member(form.dataset.id) || {role:"parent"});
  const prev = $("#"+prefix+"Prev"); if (prev) prev.innerHTML = avatarOf({...base, color, avatar:av, photo:UI.photoDraft?.[prefix] ?? base.photo}, 64);
  form.querySelectorAll(`input[name="${prefix}av"]`).forEach(r => { const svg = r.parentElement.querySelector("svg"); if (svg) svg.innerHTML = avatarArt(r.value, color); });
});
