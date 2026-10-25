/* =========================================================================
   TRIBE — assistant IA (Gemini, facultatif). La clé reste sur l'appareil.
   - plusieurs modèles de repli : si l'un est surchargé, on passe au suivant
   - réponses en continu (streaming) pour les questions
   - tâches en parallèle (onglet « En cours ») et historique par catégorie
   - page Assistant complète (le bouton ✦ l'ouvre)
   ========================================================================= */
const AI_KEY = "tribe.aikey";
const aiKey = () => { try { return localStorage.getItem(AI_KEY) || ""; } catch(e){ return ""; } };
const AI_TOPICS = [["sommeil","Sommeil"],["alimentation","Alimentation"],["activite","Activité physique"],["ecrans","Écrans"],["croissance","Croissance"],["developpement","Développement"],["humeur","Humeur"],["lecture","Lecture"]];
const AI_MODELS = {
  fast:    ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"],
  quality: ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"],
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
function modelChain(tier){
  const t = tier || (S.settings.ai.speed === "qualite" ? "quality" : "fast");
  const custom = (S.settings.ai.model || "").trim();
  const base = AI_MODELS[t] || AI_MODELS.fast;
  return [...new Set([...(custom && !Object.values(AI_MODELS).flat().includes(custom) ? [custom] : []), ...base])];
}
const AI_RETRY = /overload|high demand|unavailable|exhausted|quota|rate|try again|internal|deadline|timeout|abort|503|500|502|504|429|failed to fetch|network/i;
const AI_BADMODEL = /not found|is not supported|404|unknown model|does not exist|no longer available|deprecated/i;
function aiFriendly(e){
  const m = String(e?.message || e || "");
  if (/api key|API_KEY|permission|401|403/i.test(m)) return T("Clé Gemini refusée : vérifiez-la dans l'Assistant (onglet Réglages).");
  if (AI_RETRY.test(m)) return T("Gemini est très sollicité en ce moment. Réessayez dans une minute (l'app a déjà essayé d'autres modèles).");
  return m || T("Erreur Gemini");
}
async function geminiCall(model, {contents, system, json, search, onText, temperature, timeout}){
  const key = aiKey();
  const body = { contents, generationConfig:{temperature} };
  if (system) body.systemInstruction = {parts:[{text:system}]};
  if (json){ body.generationConfig.responseMimeType = "application/json"; body.generationConfig.responseSchema = json; }
  if (search && !json) body.tools = [{google_search:{}}];
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeout);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${onText ? "streamGenerateContent?alt=sse" : "generateContent"}`;
  try {
    const r = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json", "x-goog-api-key":key}, body:JSON.stringify(body), signal:ctl.signal});
    if (!r.ok){ const d = await r.json().catch(() => ({})); const err = new Error(d.error?.message || `Gemini ${r.status}`); err.status = r.status; throw err; }
    const srcs = [], addSrc = cand => (cand?.groundingMetadata?.groundingChunks||[]).map(g => g.web).filter(Boolean).forEach(w => { if (!srcs.some(s => s.uri === w.uri)) srcs.push({title:w.title, uri:w.uri}); });
    if (!onText){
      const d = await r.json(), cand = d.candidates?.[0];
      const text = (cand?.content?.parts||[]).map(p => p.text||"").join("");
      if (!text && cand?.finishReason && cand.finishReason !== "STOP") throw new Error(`Gemini : ${cand.finishReason}`);
      addSrc(cand); return {text, sources:srcs, model};
    }
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "", text = "";
    for (;;){
      const {done, value} = await rd.read(); if (done) break;
      buf += dec.decode(value, {stream:true});
      let i; while ((i = buf.indexOf("\n")) >= 0){
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        try { const d = JSON.parse(line.slice(5)), cand = d.candidates?.[0]; const t = (cand?.content?.parts||[]).map(p => p.text||"").join(""); if (t){ text += t; onText(text); } addSrc(cand); } catch(e){}
      }
    }
    if (!text) throw new Error("Gemini : réponse vide");
    return {text, sources:srcs, model};
  } finally { clearTimeout(to); }
}
/* appel avec repli automatique sur d'autres modèles */
async function gemini({contents, system, json = null, search = false, tier, onText, temperature = 0.5, timeout = 70000}){
  if (!aiKey()) throw new Error(T("Ajoutez d'abord votre clé Gemini dans l'Assistant."));
  const chain = modelChain(tier); let lastErr;
  for (let pass = 0; pass < 2; pass++){
    for (const model of chain){
      try { return await geminiCall(model, {contents, system, json, search, onText, temperature, timeout}); }
      catch(e){
        lastErr = e; const m = String(e.message||"");
        if (/api key|API_KEY_INVALID|PERMISSION_DENIED/i.test(m) || e.status === 401 || e.status === 403) throw new Error(aiFriendly(e));
        if (search && /tool|search|grounding/i.test(m)){ try { return await geminiCall(model, {contents, system, json, search:false, onText, temperature, timeout}); } catch(e2){ lastErr = e2; } }
        if (!AI_RETRY.test(m) && !AI_BADMODEL.test(m) && e.status !== 400) throw new Error(aiFriendly(e));
      }
    }
    await sleep(1500);
  }
  throw new Error(aiFriendly(lastErr));
}
const parseJSON = t => { try { return JSON.parse(t); } catch(e){ const m = String(t).match(/\{[\s\S]*\}|\[[\s\S]*\]/); if (m) return JSON.parse(m[0]); throw new Error(T("Réponse illisible de Gemini, réessayez")); } };

/* contexte de l'enfant (données agrégées seulement) */
function kidContext(c){
  if (!c) return "";
  if (isPrenatal(c)) return `Grossesse : ${pregWeek(c).w} semaines.`;
  const m = ageMonths(c), wk = Array.from({length:7},(_,i)=>dayTotals(c, addDays(today(), -i))), avg = k => sum(wk.map(t=>t[k]))/7;
  const lastG = [...c.growth].sort((a,b)=>a.date<b.date?1:-1)[0];
  const z = lastG ? ["weight","height"].filter(k=>lastG[k]).map(k => `${k} ${lastG[k]} (P${pctLabel(zScore(k,c.sex,effAge(c,parseD(lastG.date)),Number(lastG[k])) ?? 0)})`).join(", ") : "aucune mesure";
  return `Enfant : ${c.nick||c.name}, ${ageLabel(m)}${usesCorrected(c)?` (âge corrigé ${ageLabel(effAge(c))}, né à ${c.gaW} SA)`:""}, sexe ${c.sex||"?"}. Allergies : ${c.allergies||"aucune connue"}. Conditions : ${c.conditions||"aucune"}. Dernières mesures : ${z}. Moyennes 7 jours : sommeil ${fmtNum(avg("sleep")/60,1)} h, activité ${Math.round(avg("act"))} min, écran ${Math.round(avg("screen"))} min, lecture ${Math.round(avg("read"))} min, repas notés ${sum(wk.map(t=>t.meals))}.`;
}
const AI_SYSTEM = () => `Tu es l'assistant parental de l'app ${appName()}, pour des familles du Québec. Réponds en ${LANG==="en"?"anglais":"français"}, avec chaleur et clarté.
Appuie-toi sur les données probantes et les lignes directrices reconnues (Société canadienne de pédiatrie, INSPQ, Santé Canada, OMS, AAP, Directives canadiennes de mouvement sur 24 h). Cite les organismes ou études. Distingue ce qui est bien établi de ce qui est incertain.
Ne pose pas de diagnostic, ne donne pas de dose de médicament : renvoie à l'étiquette, au pharmacien ou au médecin. Si la question évoque un signe d'urgence (difficulté à respirer, lèvres bleues, convulsion, fièvre chez un bébé de moins de 3 mois, déshydratation, idées suicidaires), dis d'appeler le 911 ou le 811 (Info-Santé), ou le 988 au besoin, en premier.
Rassure sans minimiser ; évite de culpabiliser les parents. Quand tu proposes un lieu réel, écris-le comme lien Markdown vers Google Maps : [Nom du lieu](https://www.google.com/maps/search/?api=1&query=Nom+du+lieu+Ville).`;

/* ---------- tâches en parallèle ---------- */
const AIJ = [];
const AI_CATS = {question:["Questions","chat"], scan:["Documents lus","doc"], story:["Histoires","moon"], recipe:["Recettes","dish"], menu:["Menus","spoon"], ideas:["Activités","run"], talk:["Discussions","heart"], review:["Revues","spark"], nutrition:["Nutrition","target"], memory:["Souvenirs","star"]};
function aiHist(cat, title, text, extra = {}){
  S.aiHist = S.aiHist || [];
  const e = {id:uid(), cat, title, text, kid:extra.kid ?? UI.aiKid ?? null, at:Date.now(), ...extra};
  S.aiHist.unshift(e); if (S.aiHist.length > 150) S.aiHist.length = 150; save(); return e;
}
function aiJob(kind, title, fn, opts = {}){
  const j = {id:uid(), kind, title, st:"run", at:Date.now(), kid:opts.kid ?? UI.aiKid};
  AIJ.unshift(j); if (AIJ.length > 30) AIJ.length = 30; aiBadge(); aiRefreshJobs();
  toast(T("Lancé : {t} (onglet En cours)",{t:title}));
  Promise.resolve().then(() => fn(j)).then(res => {
    j.st = "ok"; j.res = res; j.done = Date.now();
    readyChip(T("Prêt : {t}",{t:title}), () => opts.open ? opts.open(res, j) : aiOpenJob(j.id));
    if (document.hidden || !document.hasFocus?.()) Native.notifyNow(T("Prêt : {t}",{t:title}), T("Touchez pour ouvrir l'assistant"), {go:"assistant", tab:"jobs"});
  }).catch(e => { j.st = "err"; j.err = aiFriendly(e); toast(j.err); })
    .finally(() => { aiBadge(); aiRefreshJobs(); });
  return j;
}
function aiBadge(){ const f = $("#fab"); if (!f) return; const n = AIJ.filter(j => j.st === "run").length; f.dataset.count = n || ""; f.classList.toggle("busy", n > 0); }
function aiRefreshJobs(){ const box = $("#aiJobs"); if (box) box.innerHTML = jobsList(); const t = $("#aiTabJobs"); if (t) t.textContent = AIJ.filter(j => j.st === "run").length || ""; }
let readyT;
function readyChip(msg, fn){
  let el = $("#ready"); if (!el){ el = document.createElement("button"); el.id = "ready"; el.className = "ready"; document.body.appendChild(el); }
  el.innerHTML = `${icon("check")} ${esc(msg)} · <u>${T("Ouvrir")}</u>`; el.hidden = false; el.onclick = () => { el.hidden = true; fn(); };
  clearTimeout(readyT); readyT = setTimeout(() => el.hidden = true, 9000);
}
const jobsList = () => AIJ.length ? `<div class="list">${AIJ.map(j => `<button class="li" data-act="aiOpenJob" data-v="${j.id}" ${j.st==="run"?"disabled":""}><div class="ic" style="background:var(--${j.st==="err"?"rose":j.st==="ok"?"mint":"lilac"}-bg);color:var(--${j.st==="err"?"rose":j.st==="ok"?"mint":"lilac"}-ink)">${j.st==="run"?`<span class="spin"></span>`:icon(j.st==="ok"?"check":"alert")}</div><div class="grow"><div class="li-title">${esc(j.title)}</div><div class="small muted">${j.st==="run"?T("En cours… {s} s",{s:Math.round((Date.now()-j.at)/1000)}):j.st==="ok"?T("Prêt · touchez pour ouvrir"):esc(j.err||"")}</div></div></button>`).join("")}</div>` : empty("spark", T("Rien en cours. Lancez plusieurs créations à la fois : elles apparaissent ici."));
function aiOpenJob(id){ const j = AIJ.find(x => x.id === id); if (!j || j.st !== "ok") return; if (j.res?.histId) return aiHistOpen(j.res.histId); if (j.res?.open) return j.res.open(); }

/* ---------- page Assistant ---------- */
const AI_TABS = () => [["ask",T("Demander"),"chat"],["scan",T("Lire"),"camera"],["create",T("Créer"),"spark"],["stories",T("Histoires"),"moon"],["recipes",T("Recettes"),"dish"],["review",T("Revues"),"chart"],["hist",T("Historique"),"clock"],["jobs",T("En cours"),"play"],["set",T("Réglages"),"sliders"]];
function aiSheet(tab){ if (tab) UI.aiTab = tab; go("assistant"); }
function assistantView(){
  if (!UI.aiTab) UI.aiTab = "ask";
  const kids = S.children; if (!kids.some(k => k.id === UI.aiKid)) UI.aiKid = (UI.view === "kid" ? child()?.id : null) || kids[0]?.id || null;
  const run = AIJ.filter(j => j.st === "run").length;
  let h = `<div class="top"><div class="grow row" style="gap:10px;min-width:0"><span class="ai-mark">${icon("spark")}</span><h1 style="font-size:1.4rem">${T("Assistant")}</h1></div>
    <button class="icon-btn" data-act="go" data-v="home" aria-label="${T("Fermer")}">${icon("x")}</button></div>`;
  if (!aiKey()) return h + `<div class="card"><div class="banner info">${icon("key")}<div class="small">${T("L'assistant utilise Gemini avec votre propre clé (gratuite pour un usage personnel). Créez-la sur aistudio.google.com/apikey puis collez-la ci-dessous. Elle reste sur cet appareil.")}</div></div>${aiKeyForm()}</div>`;
  h += `<div class="ai-tabs" role="tablist">${AI_TABS().map(([k,l,ic]) => `<button role="tab" data-act="aiTab" data-v="${k}" aria-pressed="${UI.aiTab===k}">${icon(ic)}<span>${l}</span>${k==="jobs"?`<b class="badge" id="aiTabJobs">${run||""}</b>`:""}</button>`).join("")}</div>`;
  if (kids.length > 1 && !["hist","jobs","set","recipes"].includes(UI.aiTab)) h += `<div class="pick">${kids.map(k => `<button data-act="aiKid" data-v="${k.id}" aria-pressed="${k.id===UI.aiKid}">${avatarOf(k,20)} ${esc(k.nick||k.name)}</button>`).join("")}</div>`;
  return h + ({ask:askPane, scan:scanPane, create:createPane, stories:storiesPane, recipes:recipesPane, review:reviewPane, hist:histPane, jobs:() => `<div class="card"><div class="card-h"><h2>${T("En cours et terminés")}</h2></div><div id="aiJobs">${jobsList()}</div></div>`, set:setPane}[UI.aiTab] || askPane)();
}
function askPane(){
  const c = kidById(UI.aiKid), hist = (S.aiChat||[]).filter(x => x.kid === (c?.id||null)).slice(-12);
  const ex = [T("Comment savoir s'il dort assez ?"), T("Idées de repas avec du fer"), T("Comment parler des écrans ?"), T("Fièvre : quand consulter ?")];
  return `<div class="card ai-chat"><div class="stack" id="aiThread">${hist.length ? hist.map(qa).join("") : `<div class="stack small muted">${T("Exemples :")}<div class="pick">${ex.map(e => `<button data-act="aiAskQuick" data-v="${esc(e)}">${e}</button>`).join("")}</div></div>`}</div>
    <form class="composer" data-form="aiAsk"><textarea class="inp" id="ai-q" rows="2" placeholder="${T("Votre question…")}"></textarea><button class="btn kid" type="submit" aria-label="${T("Envoyer")}">${icon("send")}</button></form>
    <p class="tiny muted">${T("Réponses fondées sur la littérature, avec sources quand c'est possible. Ne remplace pas un avis médical. Urgence : 911 · Info-Santé : 811.")}</p></div>`;
}
const srcList = s => s?.length ? `<div class="tiny" style="margin-top:6px"><b>${T("Sources")}</b> : ${s.slice(0,6).map(x => `<a href="${esc(x.uri)}" target="_blank" rel="noopener">${esc(x.title||"lien")}</a>`).join(" · ")}</div>` : "";
const qa = x => `<div class="msg mine">${esc(x.q)}</div><div class="msg ai">${md(x.a)}${srcList(x.sources)}</div>`;
async function aiAsk(q){
  const c = kidById(UI.aiKid), th = $("#aiThread");
  if (th){ if (!(S.aiChat||[]).some(x => x.kid === (c?.id||null))) th.innerHTML = ""; th.insertAdjacentHTML("beforeend", `<div class="msg mine">${esc(q)}</div><div class="msg ai" id="aiWait"><span class="spin"></span> ${T("Je cherche dans la littérature…")}</div>`); $("#aiWait")?.scrollIntoView({block:"nearest"}); }
  try {
    const prev = (S.aiChat||[]).filter(x => x.kid === (c?.id||null)).slice(-4).flatMap(x => [{role:"user", parts:[{text:x.q}]}, {role:"model", parts:[{text:x.a}]}]);
    const r = await gemini({system: AI_SYSTEM() + " Réponds en 120 à 250 mots.\n" + kidContext(c), contents:[...prev, {role:"user", parts:[{text:q}]}], search:S.settings.ai.search !== false, onText: t => { const w = $("#aiWait"); if (w) w.innerHTML = md(t); }});
    S.aiChat = S.aiChat || []; S.aiChat.push({kid:c?.id||null, q, a:r.text, sources:r.sources, at:Date.now()}); if (S.aiChat.length > 80) S.aiChat.splice(0, S.aiChat.length-80);
    aiHist("question", q, r.text, {sources:r.sources, kid:c?.id||null});
    const w = $("#aiWait"); if (w){ w.removeAttribute("id"); w.innerHTML = md(r.text) + srcList(r.sources); }
  } catch(e){ const w = $("#aiWait"); if (w){ w.removeAttribute("id"); w.innerHTML = `<span style="color:var(--danger)">${esc(e.message)}</span>`; } }
}
function scanPane(){
  const c = kidById(UI.aiKid), m = c && !isPrenatal(c) ? ageMonths(c) : 0;
  const kinds = Object.entries(SCAN_KINDS).filter(([k]) => scanAllowed(k, m));
  return `<div class="card"><p class="small muted">${T("Photographiez un document : Gemini le lit et vous propose de remplir l'app. Rien n'est enregistré sans votre accord.")}</p><div class="list">${kinds.map(([k,x]) => `<button class="li" data-act="aiScan" data-v="${k}"><div class="ic" style="background:var(--lilac-bg);color:var(--lilac-ink)">${icon(x.ic)}</div><div class="grow"><div class="li-title">${T(x.l)}</div><div class="small muted">${T(x.d)}</div></div>${icon("right")}</button>`).join("")}
    <button class="li" data-act="aiMealPhoto"><div class="ic" style="background:var(--mint-bg);color:var(--mint-ink)">${icon("camera")}</div><div class="grow"><div class="li-title">${T("Photo de repas")}</div><div class="small muted">${T("Aliments, groupes, quantités et nutriments estimés.")}</div></div>${icon("right")}</button></div></div>`;
}
const scanAllowed = (k, m) => k === "daycare" ? m < 72 : k === "menu" ? m < 144 : true;
function histPane(){
  const cat = UI.histCat || "all", list = (S.aiHist||[]).filter(e => (cat === "all" || e.cat === cat) && (!UI.histFav || e.fav));
  const counts = {}; (S.aiHist||[]).forEach(e => counts[e.cat] = (counts[e.cat]||0) + 1);
  return `<div class="card"><div class="pick"><button data-act="histCat" data-v="all" aria-pressed="${cat==="all"}">${T("Tout")} (${(S.aiHist||[]).length})</button>${Object.entries(AI_CATS).filter(([k]) => counts[k]).map(([k,[l,ic]]) => `<button data-act="histCat" data-v="${k}" aria-pressed="${cat===k}">${icon(ic)} ${T(l)} (${counts[k]})</button>`).join("")}<button data-act="histFav" aria-pressed="${!!UI.histFav}">${icon("star")} ${T("Favoris")}</button></div>
    ${list.length ? `<div class="list">${list.map(e => `<button class="li" data-act="aiHistOpen" data-v="${e.id}"><div class="ic" style="background:var(--surface2)">${icon((AI_CATS[e.cat]||["","spark"])[1])}</div><div class="grow"><div class="li-title">${esc(e.title)}</div><div class="small muted">${T((AI_CATS[e.cat]||["Autre"])[0])} · ${fmtD(new Date(e.at),{day:"numeric",month:"short"})}${e.kid&&kidById(e.kid)?" · "+esc(kidById(e.kid).nick||kidById(e.kid).name):""}</div></div>${e.fav?icon("star").replace("<svg",'<svg style="width:16px;height:16px;color:var(--butter-ink)" ').replace('fill="none"','fill="currentColor"'):""}</button>`).join("")}</div>` : empty("clock", T("L'historique de l'assistant apparaîtra ici, classé par catégorie."))}</div>`;
}
function aiHistOpen(id){
  const e = (S.aiHist||[]).find(x => x.id === id); if (!e) return;
  if (e.cat === "story" && e.storyId && S.stories?.some(s => s.id === e.storyId)) return storyOpen(e.storyId);
  if (e.cat === "recipe" && e.recipe) return recipeSheet(e.recipe, e.id);
  sheet(`${sheetHead(esc(e.title))}<span class="small muted">${T((AI_CATS[e.cat]||["Autre"])[0])} · ${fmtD(new Date(e.at),{day:"numeric",month:"long",year:"numeric"})}</span><div>${md(e.text||"")}${srcList(e.sources)}</div>
    <div class="row"><button class="btn ghost" data-act="histFavT" data-v="${e.id}">${icon("star")}${e.fav?T("Retirer des favoris"):T("Favori")}</button><button class="btn ghost" data-act="histShare" data-v="${e.id}">${icon("share")}${T("Partager")}</button><button class="btn danger" data-act="histDel" data-v="${e.id}">${icon("trash")}</button></div>`, "wide");
}
function reviewPane(){
  const c = kidById(UI.aiKid), A = S.settings.ai, revs = (S.reviews||[]).filter(r => r.kid === c?.id).slice(-6).reverse();
  return `<div class="card"><div class="card-h"><h2>${T("Revue automatique")}</h2></div><p class="small muted">${T("Une revue des données de l'enfant avec des recommandations, au jour et à l'heure choisis. Vous recevez une notification quand c'est le moment.")}</p>
    <div class="field"><label>${T("Sujets")}</label>${checks("aitopics", AI_TOPICS.map(([k,l])=>[k,T(l)]), A.topics)}</div>
    <div class="field"><label>${T("Fréquence")}</label>${radios("aifreq",[["semaine",T("Chaque semaine")],["mois",T("Chaque mois")],["jamais",T("Seulement sur demande")]],A.freq)}</div>
    <div class="fgrid">${fld("ai-rday",T("Jour"),`<select class="inp" id="ai-rday">${[1,2,3,4,5,6,0].map(d => `<option value="${d}" ${+A.reviewDay===d?"selected":""}>${WDL()[d]}</option>`).join("")}</select>`)}${fld("ai-rtime",T("Heure"),`<input class="inp" id="ai-rtime" type="time" value="${A.reviewTime||"19:00"}">`)}</div>
    <div class="row"><button class="btn ghost" data-act="aiReviewSave">${icon("check")}${T("Enregistrer l'horaire")}</button><button class="btn kid" data-act="aiReview">${icon("spark")}${T("Faire la revue maintenant")}</button></div>
    ${A.lastReview?`<p class="tiny muted">${T("Dernière revue : {d}",{d:fmtD(A.lastReview)})} · ${T("Prochaine : {d}",{d:fmtD(nextReviewAt(),{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})})}</p>`:""}</div>
    ${revs.map(r => `<div class="card"><span class="eyebrow">${fmtD(r.date,{day:"numeric",month:"long",year:"numeric"})}</span>${md(r.text)}</div>`).join("")}`;
}
const WDL = () => LANG === "en" ? ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] : ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
function nextReviewAt(from = new Date()){
  const A = S.settings.ai, [hh, mm] = (A.reviewTime||"19:00").split(":").map(Number), d = new Date(from);
  d.setHours(hh, mm, 0, 0); const add = ((+A.reviewDay||0) - d.getDay() + 7) % 7; d.setDate(d.getDate() + add);
  if (d <= from) d.setDate(d.getDate() + 7);
  if (A.freq === "mois"){ const last = A.lastReview ? parseD(A.lastReview) : null; while (last && (d - last) / DAY < 27) d.setDate(d.getDate() + 7); }
  return d;
}
function lastReviewSlot(){ const n = nextReviewAt(); const p = new Date(n); p.setDate(p.getDate() - (S.settings.ai.freq === "mois" ? 28 : 7)); return p; }
function setPane(){
  const has = !!aiKey(), A = S.settings.ai;
  return `<div class="card"><div class="card-h"><h2>${T("Réglages de l'assistant")}</h2></div>
    ${has ? `<div class="row"><span class="chip mint">${icon("check")}${T("Clé enregistrée")}</span><button class="btn sm ghost" data-act="aiForget">${T("Retirer la clé")}</button></div>` : aiKeyForm()}
    <div class="field"><label>${T("Vitesse")}</label>${radios("aispeed",[["rapide",T("Rapide (Flash-Lite, recommandé)")],["qualite",T("Plus détaillé (Flash)")]],A.speed||"rapide")}</div>
    <label class="switch"><input type="checkbox" id="ai-search" ${A.search!==false?"checked":""} data-change="aiSearch"><span class="tg"></span><span class="grow">${T("Chercher des sources sur le Web pour les questions")}</span></label>
    ${fld("ai-model",T("Modèle personnalisé (facultatif)"),`<input class="inp" id="ai-model" value="${esc(Object.values(AI_MODELS).flat().includes(A.model)?"":A.model||"")}" placeholder="gemini-3.8-flash" data-change="aiModel">`)}
    <p class="tiny muted">${T("Si un modèle est surchargé, l'app essaie automatiquement : {m}.",{m:modelChain().join(", ")})}</p></div>`;
}
const aiKeyForm = () => `<form class="stack" data-form="aiKey">${fld("ai-key",T("Clé API Gemini"),`<input class="inp" id="ai-key" type="password" autocomplete="off" placeholder="AIza…">`)}<button class="btn kid" type="submit">${T("Enregistrer la clé")}</button></form>`;
function aiSettings(){
  return `<p class="small muted">${T("Facultatif. Fonctionne avec votre clé Gemini, conservée seulement sur cet appareil.")}</p>
    <ul class="small" style="margin:0;padding-left:18px;line-height:1.6">${[T("Questions avec sources scientifiques"),T("Photo de repas → aliments, groupes, quantités et nutriments"),T("Lecture d'étiquettes, de rapports de garderie, du carnet de santé, d'invitations et de menus"),T("Histoires à chapitres avec personnages et voix, recettes favorites, menus, activités"),T("Texte des souvenirs et récit de l'année"),T("Revues automatiques au jour et à l'heure choisis")].map(x=>`<li>${x}</li>`).join("")}</ul>
    <div class="row"><button class="btn sm kid" data-act="ai">${icon("spark")}${T("Ouvrir l'assistant")}</button>${aiKey()?`<span class="chip mint">${icon("check")}${T("Clé enregistrée")}</span>`:""}</div>`;
}

/* ---------- repas en photo (avec nutriments estimés) ---------- */
const NUT_SCHEMA = {type:"OBJECT", properties:{kcal:{type:"NUMBER"}, prot:{type:"NUMBER"}, carb:{type:"NUMBER"}, fat:{type:"NUMBER"}, fiber:{type:"NUMBER"}, sugar:{type:"NUMBER"}, sodium:{type:"NUMBER"}, calcium:{type:"NUMBER"}, iron:{type:"NUMBER"}}};
const NUT_HELP = "nut = nutriments estimés pour la quantité indiquée : kcal, prot (g), carb (g), fat (g), fiber (g), sugar (g de sucres), sodium (mg), calcium (mg), iron (mg).";
async function aiMealPhoto(){
  if (!aiKey()){ aiSheet("set"); return; }
  const c = child(); if (!c) return toast(T("Ajoutez d'abord un enfant"));
  const data = await Native.takePhoto({source:"prompt"}); if (!data) return;
  const small = await shrinkImage(data, 1024, 0.8);
  sheet(`${sheetHead(T("Analyse du repas"))}<img src="${small}" alt="" style="border-radius:16px;max-height:240px;object-fit:cover"><p class="muted"><span class="spin"></span> ${T("Analyse en cours…")}</p>`);
  const m = ageMonths(c);
  try {
    const schema = {type:"OBJECT", properties:{items:{type:"ARRAY", items:{type:"OBJECT", properties:{name:{type:"STRING"}, group:{type:"STRING", enum:Object.keys(FOOD_GROUPS)}, qty:{type:"STRING"}, nut:NUT_SCHEMA}, required:["name","group","qty"]}}, comment:{type:"STRING"}}, required:["items","comment"]};
    const r = await gemini({tier:"quality", json:schema, system:`Tu analyses une photo de repas pour un enfant de ${ageLabel(m)}. Liste chaque aliment visible en ${LANG==="en"?"anglais":"français"}, son groupe (legfruits = légumes et fruits, proteines, grains, laitiers, autres = gâteries, boissons sucrées) et une quantité estimée (c. à soupe, tasse, morceaux, g). ${NUT_HELP} Dans comment, une ou deux phrases utiles sur l'équilibre selon le Guide alimentaire canadien et, avant 4 ans, signale tout aliment à risque d'étouffement (raisins entiers, noix, maïs soufflé, saucisses en rondelles).`,
      contents:[{role:"user", parts:[{inline_data:{mime_type:"image/jpeg", data:small.split(",")[1]}}, {text:"Analyse ce repas."}]}]});
    const out = parseJSON(r.text), thumb = await shrinkImage(small, 480, 0.75);
    aiHist("scan", T("Repas : {i}",{i:(out.items||[]).map(i => i.name).join(", ")}), `${(out.items||[]).map(i => `- ${i.name} (${i.qty})`).join("\n")}\n\n${out.comment||""}`, {kid:c.id});
    mealForm({items:(out.items||[]).map(i => ({name:i.name, group:FOOD_GROUPS[i.group]?i.group:"autres", qty:i.qty, nut:i.nut||null})), comment:out.comment, photo:thumb, ai:true});
  } catch(e){ toast(e.message); closeSheet(); }
}

/* ---------- revues ---------- */
async function aiReview(kidId, silent){
  const c = kidById(kidId) || child(); if (!c || !aiKey()) return;
  const run = async () => {
    const topics = S.settings.ai.topics.map(k => T(AI_TOPICS.find(t=>t[0]===k)?.[1]||k)).join(", ");
    const days = S.settings.ai.freq === "mois" ? 30 : 7;
    const sumUp = k => { const s = series(c, k, days); return `${k}: ${s.map(p => Math.round(p.v*10)/10).join(",")}`; };
    const dev = isPrenatal(c) ? "" : `Jalons à mentionner : ${MS.filter(it => msLevel(c,it,effAge(c)).id==="parler").map(it=>it.t).join("; ")||"aucun"}.`;
    const nut = isPrenatal(c) || ageMonths(c) < 12 ? "" : `Nutrition 7 jours (moyenne/jour vs cible) : ${nutSummary(c)}.`;
    const r = await gemini({system: AI_SYSTEM() + "\nFais une revue de suivi structurée : 1) ce qui va bien, 2) points à surveiller, 3) 2 ou 3 recommandations concrètes et réalistes, fondées sur les lignes directrices. Titres courts. 200 à 350 mots.",
      contents:[{role:"user", parts:[{text:`${kidContext(c)}\nPériode : ${days} jours. Sujets demandés : ${topics}.\nSéries quotidiennes : ${["sleep","act","screen","read"].map(sumUp).join(" | ")}.\nObjectifs : ${JSON.stringify(goals(c).custom)}. Recommandations : ${JSON.stringify(goals(c).rec)}.\n${dev}\n${nut}`}]}]});
    S.reviews = S.reviews || []; S.reviews.push({id:uid(), kid:c.id, date:iso(today()), text:r.text}); S.settings.ai.lastReview = iso(today());
    const e = aiHist("review", T("Revue de {n}",{n:c.nick||c.name}), r.text, {kid:c.id}); save();
    if (silent && S.settings.notif.enabled && S.settings.notif.review) Native.notifyNow(T("Revue prête"), T("La revue de {n} est disponible dans l'assistant.",{n:c.nick||c.name}), {go:"assistant", tab:"review"});
    return {histId:e.id};
  };
  return aiJob("review", T("Revue de {n}",{n:c.nick||c.name}), run, {kid:c.id});
}
/* revue automatique : si l'heure prévue est passée depuis la dernière revue */
function maybeAutoReview(){
  const A = S.settings.ai; if (!aiKey() || A.freq === "jamais" || !feat("ai")) return;
  if (!A.lastReview){ A.lastReview = iso(today()); save(); return; } // première fois : on attend le prochain rendez-vous prévu
  const slot = lastReviewSlot(), last = parseD(A.lastReview);
  if (Date.now() >= slot.getTime() && (!last || last < new Date(slot.getFullYear(), slot.getMonth(), slot.getDate())))
    S.children.filter(c => !isPrenatal(c)).forEach((c,i) => setTimeout(() => aiReview(c.id, true), 2500 + i*1500));
}

Object.assign(ACT, {
  ai: () => aiSheet(), aiTab: v => { UI.aiTab = v; if (UI.view !== "assistant") go("assistant"); else render(); },
  aiKid: v => { UI.aiKid = v; render(); }, aiAskQuick: v => aiAsk(v), aiMealPhoto: () => aiMealPhoto(),
  aiReview: () => { S.settings.ai.topics = checked("aitopics"); S.settings.ai.freq = radio("aifreq") || S.settings.ai.freq; save(); return aiReview(UI.aiKid); },
  aiReviewSave: () => { const A = S.settings.ai; A.topics = checked("aitopics"); A.freq = radio("aifreq") || A.freq; A.reviewDay = +val("ai-rday"); A.reviewTime = val("ai-rtime") || "19:00";
    if (A.freq !== "jamais" && !S.settings.notif.enabled){ S.settings.notif.enabled = true; Native.notifPermission(); } S.settings.notif.review = true;
    commit(T("Revue prévue le {d}",{d:fmtD(nextReviewAt(),{weekday:"long",hour:"2-digit",minute:"2-digit"})})); },
  aiOpenJob: v => aiOpenJob(v), aiHistOpen: v => aiHistOpen(v),
  histCat: v => { UI.histCat = v; render(); }, histFav: () => { UI.histFav = !UI.histFav; render(); },
  histFavT: v => { const e = S.aiHist.find(x => x.id === v); e.fav = !e.fav; save(); aiHistOpen(v); },
  histShare: v => { const e = S.aiHist.find(x => x.id === v); Native.share({title:e.title, text:`${e.title}\n\n${e.text}`}); },
  histDel: v => { S.aiHist = S.aiHist.filter(x => x.id !== v); closeSheet(); commit(); },
  aiForget: () => { try { localStorage.removeItem(AI_KEY); } catch(e){} commit(T("Clé retirée")); },
});
Object.assign(FORMS, {
  aiAsk: () => { const q = val("ai-q"); if (!q) return; $("#ai-q").value = ""; aiAsk(q); },
  aiKey: () => { const k = val("ai-key"); if (!k) return; try { localStorage.setItem(AI_KEY, k.trim()); } catch(e){} closeSheet(); commit(T("Clé enregistrée")); },
});
Object.assign(CHANGE, {
  aiModel: t => { S.settings.ai.model = t.value.trim(); save(); },
  aiSearch: t => { S.settings.ai.search = t.checked; save(); },
});
document.addEventListener("change", e => { if (e.target.name === "aispeed"){ S.settings.ai.speed = e.target.value; save(); } });
