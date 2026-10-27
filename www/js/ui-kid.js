/* =========================================================================
   TRIBE — carnet de l'enfant (onglets façonnés selon l'âge)
   ========================================================================= */
function kidTabs(c){
  if (isPrenatal(c)) return [["grossesse",T("Grossesse")],["conseils",T("Conseils")]].filter(t => t[0] !== "conseils" || feat("tips"));
  const m = ageMonths(c), tabs = [["quotidien",T("Quotidien")]];
  if (c.adult){ tabs.push(["repas",T("Repas")]); if (allow("health")) tabs.push(["sante",T("Santé")]); return tabs; }
  if (mod(c,"solids") || mod(c,"feeding")) tabs.push(["repas", m < 12 ? T("Boires et repas") : T("Repas")]);
  if (mod(c,"growth") && allow("health")) tabs.push(["croissance",T("Croissance")]);
  if (allow("health")) tabs.push(["sante",T("Santé")]);
  if (mod(c,"milestones") || mod(c,"older")) tabs.push(["dev", m < 72 ? T("Développement") : T("Repères")]);
  if (feat("tips")) tabs.push(["conseils",T("Conseils")]);
  return tabs;
}
function kidView(){
  const c = child(); if (!c) return homeView();
  const tabs = kidTabs(c);
  if (!tabs.some(t => t[0] === UI.kidTab)) UI.kidTab = tabs[0][0];
  const st = lookOf(c), m = ageMonths(c);
  let h = `<section class="hero"><div>${avatarOf(c, 84)}</div><div class="stack" style="gap:6px;min-width:0">
    <div class="row"><span class="chip ${stageKid(c).color}">${T(stageKid(c).label)}</span>${usesCorrected(c)?`<span class="chip lilac">${T("Prématuré·e")} · ${c.gaW} ${T("SA")} ${c.gaD||0} ${T("j")}</span>`:""}</div>
    <h1>${esc(c.nick||c.name)}</h1>
    <div class="age">${kidAge(c)}${usesCorrected(c)?` <span class="muted small">· ${T("âge corrigé")} ${ageLabel(effAge(c))}</span>`:""}</div>
    </div>${heroIllu(st.id)}
    ${isKidUser()?"":`<div class="hero-actions"><button class="btn sm ghost" data-act="kidForm" data-v="${c.id}">${icon("edit")}${T("Profil")}</button><button class="btn sm ghost" data-act="modules">${icon("sliders")}${T("Personnaliser")}</button>${isPrenatal(c)?"":`<button class="btn sm ghost" data-act="report">${icon("doc")}${T("Rapport")}</button>`}</div>`}</section>`;
  h += timerBar(c) + feverAlert(c) + goalBandNotice(c);
  if (tabs.length > 1) h += `<div class="seg" role="tablist">${tabs.map(([id,l]) => `<button data-act="kidTab" data-v="${id}" aria-pressed="${UI.kidTab===id}">${l}</button>`).join("")}</div>`;
  return h + ({quotidien, repas, croissance, sante, dev, conseils, grossesse}[UI.kidTab])(c) + tabTips(c, UI.kidTab);
}
/* conseils de la section en cours, cliquables pour plus de détails */
const TAB_TIPS = {quotidien:["sommeil","ecrans","sport","emotions"], repas:["alim"], croissance:["alim","sport","sante"], sante:["sante","secu"], dev:["dev","social","emotions","ecole","parler","puberte"]};
const tipsForAge = (c, cats) => { const m = isPrenatal(c) ? -1 : ageMonths(c); return ALL_TIPS.map((t, i) => ({t, i})).filter(({t}) => cats.includes(t[0]) && m >= t[1] && m < t[2]); };
const tipRow = ({t, i}) => `<button class="tip-row" data-act="tipOpen" data-v="${i}"><span class="tip-dot" style="background:var(--${TIPCAT[t[0]][1]})"></span><span class="grow"><b>${T(t[3])}</b><span class="small muted clamp2">${T(t[4])}</span></span>${icon("right")}</button>`;
function tabTips(c, tab){
  if (!feat("tips") || !TAB_TIPS[tab] || isPrenatal(c) || c.adult) return "";
  const list = tipsForAge(c, TAB_TIPS[tab]).filter(x => !(c.hideTips||[]).includes(x.t[0])); if (!list.length) return "";
  const seed = Math.floor(today() / DAY), n = tab === "repas" ? 5 : 3, pick = list.length <= n ? list : Array.from({length:n}, (_, k) => list[(seed + k * 7) % list.length]).filter((x, k, a) => a.indexOf(x) === k);
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Pour les parents")}</span><h2>${T("Conseils")}</h2></div><button class="btn sm ghost" data-act="kidTab" data-v="conseils">${T("Tous ({n})",{n:tipsForAge(c, Object.keys(TIPCAT)).length})}</button></div><div class="stack" style="gap:6px">${pick.map(tipRow).join("")}</div><p class="tiny muted">${T("Touchez un conseil pour plus de détails.")}</p></div>`;
}
function tipOpen(i){
  const t = ALL_TIPS[+i]; if (!t) return; const c = child(), key = "tip|" + t[3], more = (S.tipMore||{})[key];
  sheet(`${sheetHead(esc(T(t[3])))}<div class="row" style="gap:6px;flex-wrap:wrap"><span class="chip ${TIPCAT[t[0]][1]}">${T(TIPCAT[t[0]][0])}</span><span class="chip">${t[1] < 0 ? T("Grossesse") : t[2] >= 999 ? T("dès {a}",{a:mLabel(Math.max(0,t[1]))}) : T("{a} à {b}",{a:mLabel(Math.max(0,t[1])), b:mLabel(t[2])})}</span></div>
    <p>${T(t[4])}</p>${moreBlock(key, more)}
    <div class="row" style="flex-wrap:wrap">${feat("ai") && allow("ai") ? `<button class="btn ghost" data-act="aiAskQuick" data-v="${esc(T(t[3]) + " : " + T("explique-moi davantage pour mon enfant"))}">${icon("chat")}${T("Poser une question")}</button>` : ""}<a class="btn ghost" href="https://www.google.com/search?q=${encodeURIComponent(T(t[3]) + " site:naitreetgrandir.com OR site:soinsdenosenfants.cps.ca")}" target="_blank" rel="noopener">${icon("search")}${T("Sources fiables")}</a></div>`, "wide");
}
/* explication détaillée par l'IA, gardée pour la prochaine fois */
const moreBlock = (key, more) => more ? `<div class="banner soft" style="display:block"><b>${icon("spark").replace("<svg",'<svg style="width:14px;height:14px;vertical-align:-2px"')} ${T("En détail")}</b><div class="small">${md(more.text)}</div>${typeof srcList === "function" ? srcList(more.sources) : ""}</div>`
  : aiReady() && aiKey() ? `<button class="btn kid" data-act="tipMore" data-v="${esc(key)}" id="tipMoreBtn">${icon("spark")}${T("Plus de détails pour mon enfant")}</button>` : `<p class="tiny muted">${T("Ajoutez votre clé Gemini dans l'Assistant pour obtenir une explication détaillée et adaptée.")}</p>`;
async function tipMore(key){
  const c = child(), btn = $("#tipMoreBtn"); if (btn){ btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${T("Je prépare une explication…")}`; }
  const [kind, id] = key.split("|"); let subject = id;
  if (kind === "ms"){ const it = MS.find(x => x.k === id); subject = `Le jalon « ${it?.t} » (habituellement ${it ? rangeTxt(it) : ""}) n'est pas encore observé`; }
  try {
    const r = await gemini({search:true, system:AI_SYSTEM() + "\n" + kidContext(c), contents:[{role:"user", parts:[{text:`${kind === "ms" ? subject + ". Explique au parent, sans l'inquiéter : ce que veut dire ce jalon, pourquoi certains enfants y arrivent plus tard, 4 ou 5 activités concrètes au quotidien pour l'encourager, et quand et à qui en parler (médecin, infirmière du CLSC, programme Agir tôt)." : `Conseil « ${subject} ». Détaille-le pour ce parent : pourquoi c'est recommandé, comment le mettre en pratique concrètement à cet âge (4 ou 5 astuces), les erreurs fréquentes, et quand demander de l'aide.`} Titres courts, listes, 180 à 280 mots, sources reconnues (SCP, INSPQ, Naître et grandir, Santé Canada).`}]}]});
    S.tipMore = S.tipMore || {}; S.tipMore[key] = {text:r.text, sources:r.sources, at:Date.now()}; save();
    if (kind === "ms") msOpen(id); else tipOpen(ALL_TIPS.findIndex(t => "tip|" + t[3] === key));
  } catch(e){ if (btn){ btn.disabled = false; btn.textContent = e.message; } }
}
/* jalon « à mentionner » : explications et pistes */
function msOpen(k){
  const c = child(), it = MS.find(x => x.k === k); if (!it) return; const em = effAge(c), L = msLevel(c, it, em), key = "ms|" + k;
  sheet(`${sheetHead(esc(T(it.t)))}<div class="row" style="gap:6px;flex-wrap:wrap"><span class="chip ${L.c}">${L.l}</span><span class="chip" style="color:var(--${DOMAINS[it.d].color}-ink)">${T(DOMAINS[it.d].label)}</span></div>
    <div class="tbl"><table><tbody><tr><td>${T("La plupart des enfants")}</td><td class="num">${rangeTxt(it)}</td></tr><tr><td>${T("Médiane")}</td><td class="num">${mLabel(it.m50)}</td></tr>${it.al?`<tr><td>${T("À mentionner si pas acquis vers")}</td><td class="num">${mLabel(it.al)}</td></tr>`:""}<tr><td>${T("Âge de l'enfant")}</td><td class="num">${ageLabel(em)}</td></tr></tbody></table></div>
    ${L.tip ? `<p class="small">${L.tip}</p>` : ""}${moreBlock(key, (S.tipMore||{})[key])}
    <div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-act="ms" data-v="${esc(k)}">${icon("check")}${c.milestones[k] ? T("Décocher") : T("Je l'ai observé")}</button><a class="btn ghost" href="${AGIR_TOT}" target="_blank" rel="noopener">${T("Programme Agir tôt")}</a></div>`, "wide");
}
Object.assign(ACT, { tipOpen: v => tipOpen(v), tipMore: v => tipMore(v), msOpen: v => msOpen(v) });

/* ---------- minuteries (avec pause) ---------- */
const timerOf = c => (S.timers||{})[c.id];
const timerElapsed = t => (t.pausedAt || Date.now()) - t.start - (t.pausedMs||0);
function timerBar(c){
  const t = timerOf(c); if (!t) return "";
  const lbl = t.type === "sleep" ? (t.kind === "Sieste" ? T("Sieste en cours") : T("Dodo en cours")) : T("Tétée · {s}",{s:T(t.side)});
  return `<div class="timer"><span class="pulse ${t.pausedAt?"off":""}"></span><div class="grow"><div class="small" style="font-weight:700">${lbl}${t.pausedAt?" · "+T("en pause"):""}</div><div class="t num" id="timerVal" data-kid="${c.id}">${fmtDur(timerElapsed(t))}</div></div>
    <button class="btn sm ghost" data-act="pauseTimer">${icon(t.pausedAt?"play":"pause")}${t.pausedAt?T("Reprendre"):T("Pause")}</button><button class="btn sm" data-act="stopTimer">${T("Arrêter et noter")}</button></div>`;
}
function feverAlert(c){
  const r = (c.logs||[]).filter(l => l.type === "temp" && Date.now() - l.t < 24*36e5).sort((a,b)=>b.t-a.t)[0];
  if (!r) return "";
  const v = Number(r.data.temp), site = r.data.site, thr = site === "Buccale" ? 37.5 : site === "Axillaire" ? 37.3 : 38.0;
  if (!(v > thr)) return "";
  if (ageMonths(c) < 3) return `<div class="banner alert">${icon("alert")}<div><b>${T("Fièvre chez un bébé de moins de 3 mois ({v} °C).",{v:fmtNum(v)})}</b> ${T("Consultez rapidement à l'urgence, ou appelez le 811 pour être orienté.")}</div></div>`;
  return `<div class="banner warn">${icon("thermo")}<div><b>${T("Fièvre notée ({v} °C).",{v:fmtNum(v)})}</b> ${T("Consultez si l'enfant est très somnolent, respire difficilement, a des taches sur la peau, ou si la fièvre dure plus de 72 h. Info-Santé : 811.")}</div></div>`;
}
/* rappel quand l'âge change de tranche de recommandations */
function goalBandNotice(c){
  if (isPrenatal(c) || !c.goals || !Object.keys(c.goals).length) return "";
  const band = guide(ageMonths(c)).band; if (!c.goalBand || c.goalBand === band) return "";
  return `<div class="banner info">${icon("target")}<div class="grow">${T("{n} est maintenant dans la tranche {b} : les recommandations changent. Mettre à jour vos objectifs ?",{n:esc(c.nick||c.name), b:band})}</div><button class="btn sm ghost" data-act="goalsForm">${T("Revoir")}</button><button class="btn sm ghost" data-act="ackBand">${T("Garder")}</button></div>`;
}

/* ======== QUOTIDIEN ======== */
const LOGT = {
  feed:{label:"Boire", ic:"bottle", c:"peach", mod:"feeding"}, solid:{label:"Repas", ic:"spoon", c:"mint", mod:"solids"},
  sleep:{label:"Dodo", ic:"moon", c:"lilac"}, diaper:{label:"Couche", ic:"drop", c:"sky", mod:"diapers"},
  tummy:{label:"Sur le ventre", ic:"tummy", c:"butter", mod:"tummy"}, activity:{label:"Activité", ic:"run", c:"mint"},
  read:{label:"Lecture", ic:"book", c:"peach", mod:"reading"}, screen:{label:"Écran", ic:"screen", c:"sky", mod:"screen"},
  mood:{label:"Humeur", ic:"smile", c:"butter", mod:"mood"}, temp:{label:"Température", ic:"thermo", c:"rose"},
  med:{label:"Médicament", ic:"pill", c:"butter"}, note:{label:"Note", ic:"note", c:"lilac"},
};
const typesFor = c => Object.keys(LOGT).filter(t => !LOGT[t].mod || mod(c, LOGT[t].mod)).filter(t => !(t === "activity" && ageMonths(c) < 9 && mod(c,"tummy")));
const quickButtons = c => `<div class="quick">${typesFor(c).map(t => `<button class="qbtn" style="background:var(--${LOGT[t].c}-bg);color:var(--${LOGT[t].c}-ink)" data-act="log" data-v="${t}">${icon(LOGT[t].ic)}${T(LOGT[t].label)}</button>`).join("")}${(c.trackers||[]).map(t => `<button class="qbtn" style="background:var(--${t.color||"teal"}-bg);color:var(--${t.color||"teal"}-ink)" data-act="log" data-v="trk:${t.id}">${icon(t.icon||"target")}${esc(t.name)}</button>`).join("")}${isKidUser()?"":`<button class="qbtn" style="background:var(--surface2);color:var(--muted)" data-act="trackerForm">${icon("plus")}${T("Suivi perso")}</button>`}</div>`;
function ring(pct, col, over=false){
  const r = 20, C = 2*Math.PI*r, p = clamp(pct||0,0,1);
  return `<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="${r}" fill="none" stroke="var(--line)" stroke-width="6"/>${p<=0?"":`<circle cx="25" cy="25" r="${r}" fill="none" stroke="${over?"var(--danger)":`var(--${col})`}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 25 25)"/>`}</svg>`;
}
function ringsCard(c){
  const T0 = dayTotals(c, today()), G = goals(c), m = ageMonths(c), cells = [];
  const cell = (key, valTxt, sub, pct, col, over=false) => `<button class="ring" data-act="trend" data-v="${key}" aria-label="${T("Voir la tendance")}">${ring(pct,col,over)}<div><div class="tiny muted">${T(METRICS[key]?.l || "")}</div><div class="v num">${valTxt}</div><div class="tiny muted">${sub}</div></div></button>`;
  if (mod(c,"feeding")){ const lastF = c.logs.filter(l=>l.type==="feed").sort((a,b)=>b.t-a.t)[0]; cells.push(cell("feeds", `${T0.feeds}${T0.ml?` · ${T0.ml} ml`:""}`, lastF?T("dernier il y a {d}",{d:fmtDur(Date.now()-lastF.t)}):T("aucun"), T0.feeds/8, "peach")); }
  cells.push(cell("sleep", T0.sleep?fmtMin(T0.sleep):"—", T("objectif {v} h",{v:G.sleep}) + (T0.nap?` · ${T("siestes")} ${fmtMin(T0.nap)}`:""), T0.sleep/60/G.sleep, "lilac"));
  cells.push(`<button class="ring" data-act="trend" data-v="act">${ring(T0.act/G.act,"mint")}<div><div class="tiny muted">${m<12?T("Ventre / sol"):T("Activité")}</div><div class="v num">${fmtMin(T0.act)}</div><div class="tiny muted">${T("objectif {v}",{v:fmtMin(G.act)})}</div></div></button>`);
  if (mod(c,"screen")) cells.push(cell("screen", fmtMin(T0.screen), G.screen?T("max {v}",{v:fmtMin(G.screen)}):T("aucun avant 2 ans"), G.screen?T0.screen/G.screen:(T0.screen?1:0), "sky", T0.screen > G.screen));
  if (mod(c,"reading")) cells.push(cell("read", fmtMin(T0.read), T("objectif {v} min",{v:G.read}), T0.read/Math.max(1,G.read), "peach"));
  if (mod(c,"diapers")) cells.push(cell("diapers", String(T0.diapers), T("aujourd'hui"), T0.diapers/6, "sky"));
  (c.trackers||[]).forEach(t => { const v = T0.trk[t.id]||0; cells.push(`<button class="ring" data-act="trend" data-v="trk:${t.id}">${ring(t.goal?v/t.goal:(v?1:0), t.color||"teal", t.goalKind==="max" && t.goal && v>t.goal)}<div><div class="tiny muted">${esc(t.name)}</div><div class="v num">${fmtNum(v, v%1?1:0)} ${esc(t.unit||"")}</div><div class="tiny muted">${t.goal?(t.goalKind==="max"?T("max {v}",{v:t.goal}):T("objectif {v}",{v:t.goal})):""}</div></div></button>`); });
  return `<div class="rings">${cells.join("")}</div>`;
}
function quotidien(c){
  const m = ageMonths(c), G = goals(c);
  let h = `<div class="card"><div class="card-h"><h2>${T("Noter")}</h2>${isKidUser()?"":`<button class="btn sm ghost" data-act="modules">${icon("sliders")}${T("Choisir les boutons")}</button>`}</div>${quickButtons(c)}${m < 72 && !isKidUser() && aiReady() ? `<div class="row" style="margin-top:8px">${aiBtn("aiScan","daycare",T("Importer le rapport de garderie (IA)"),"doc")}</div>` : ""}</div>`;
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Touchez une mesure pour voir sa tendance")}</span><h2>${T("Bien-être d'aujourd'hui")}</h2></div>${isKidUser()?"":`<button class="btn sm ghost" data-act="goalsForm">${icon("target")}${T("Objectifs")}</button>`}</div>${ringsCard(c)}
    <p class="tiny muted">${T("Recommandations pour {b} (Directives canadiennes de mouvement sur 24 h) : sommeil {s1} à {s2} h, {a} {am}, écran {sc}.",{b:G.rec.band, s1:G.rec.sleep[0], s2:G.rec.sleep[1], a:T(G.rec.actLbl).toLowerCase(), am:fmtMin(G.rec.act), sc:G.rec.screen?T("au plus {v}",{v:fmtMin(G.rec.screen)}):T("aucun")})}</p></div>`;
  h += weeklyStats(c) + kidCalendarCard(c);
  if (mod(c,"mood")) h += moodCard(c);
  if (mod(c,"sports")) h += sportsCard(c);
  const days = [];
  for (let i=0;i<7;i++){ const d = addDays(today(), -i); const L = dayLogs(c, d); if (L.length) days.push([d,L]); }
  h += `<div class="card"><div class="card-h"><h2>${T("Journal, 7 derniers jours")}</h2></div>`;
  if (!days.length) h += empty("sunrise", T("Aucune entrée cette semaine. Utilisez les boutons ci-dessus."));
  days.forEach(([d,L]) => { h += `<button class="eyebrow linkish" data-act="dayDetail" data-v="${iso(d)}" style="margin-top:6px">${dayName(d)} ${icon("right").replace("<svg",'<svg style="width:12px;height:12px;vertical-align:-1px"')}</button><div class="list">${L.map(l => logLine(c,l)).join("")}</div>`; });
  return h + `</div>`;
}
const dayName = d => { const diff = Math.round((today()-d)/DAY); return diff===0?T("Aujourd'hui"):diff===1?T("Hier"):fmtD(d,{weekday:"long",day:"numeric",month:"long"}); };
/* statistiques hebdomadaires : cette semaine vs la précédente */
function weeklyStats(c){
  const keys = ["sleep","act"].concat(mod(c,"screen")?["screen"]:[]).concat(mod(c,"reading")?["read"]:[]).concat(mod(c,"feeding")?["feeds"]:[]).concat((c.trackers||[]).map(t=>"trk:"+t.id));
  const rows = keys.map(k => {
    const M = metricOf(c, k), a = series(c, k, 14), cur = a.slice(7), prev = a.slice(0,7);
    const avg = x => sum(x.map(p=>p.v))/7, A = avg(cur), B = avg(prev), goal = M.goal(c);
    const hit = goal ? cur.filter(p => M.kind === "max" ? p.v <= goal : p.v >= goal).length : null;
    const diff = B ? (A-B)/B : null, good = diff == null ? null : (M.kind === "max" ? diff <= 0 : diff >= 0);
    const fmt = v => k === "sleep" ? fmtNum(v,1)+" h" : M.u === "min" ? fmtMin(v) : fmtNum(v, v%1?1:0)+(M.u?" "+M.u:"");
    return `<tr data-act="trend" data-v="${k}" style="cursor:pointer"><td style="font-weight:600">${T(M.l)}</td><td><b>${fmt(A)}</b></td><td class="small">${diff==null?"—":`<span style="color:var(--${good?"mint":"rose"}-ink)">${diff>=0?"▲":"▼"} ${Math.abs(Math.round(diff*100))} %</span>`}</td><td class="small">${hit==null?"—":`${hit}/7`}</td></tr>`;
  }).join("");
  const ins = insights(c, keys);
  return `<div class="card"><div class="card-h"><h2>${T("Statistiques de la semaine")}</h2><span class="tiny muted">${T("moyenne par jour · touchez une ligne")}</span></div>${ins}<div class="tbl"><table><thead><tr><th>${T("Mesure")}</th><th>${T("7 jours")}</th><th>${T("vs sem. préc.")}</th><th>${T("Objectif atteint")}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
/* graphique en barres (tendance) */
function bars(pts, goal, col, kind, unitH, weekKey){
  const n = pts.length, max = Math.max(goal ? goal*1.25 : 0, ...pts.map(p=>p.v), 1), H = 74;
  const lbl = d => weekKey ? (pts.indexOf(pts.find(p => p.d === d)) % 2 === 0 ? `${d.getDate()} ${d.toLocaleDateString(LOCALE(),{month:"short"}).replace(".","")}` : "") : n <= 7 ? d.toLocaleDateString(LOCALE(),{weekday:"narrow"}) : n <= 31 ? (d.getDate()%5===1 ? d.getDate() : "") : (d.getDate()===1 ? d.toLocaleDateString(LOCALE(),{month:"short"}) : "");
  return `<div class="weekbars" style="--n:${n};gap:${n>40?1:n>14?2:5}px">${pts.map(p => { const bad = goal ? (kind === "max" ? p.v > goal : p.v < goal*0.8) : false;
    return `<button type="button" class="wb" data-act="${weekKey?"weekDetail":"dayDetail"}" data-v="${iso(p.d)}${weekKey?"|"+weekKey:""}" title="${weekKey?T("Semaine du {d}",{d:fmtD(p.d,{day:"numeric",month:"short"})}):fmtD(p.d,{weekday:"short",day:"numeric",month:"short"})} : ${unitH?fmtNum(p.v,1)+" h":fmtNum(p.v,p.v%1?1:0)}"><i style="height:${(p.v/max*H).toFixed(1)}px;background:var(--${bad&&kind==="max"?"danger":col});${bad&&kind!=="max"?"opacity:.5":""}"></i><span>${lbl(p.d)}</span></button>`; }).join("")}
    ${goal?`<div class="goal" style="bottom:${(18+goal/max*H).toFixed(1)}px" aria-hidden="true"></div>`:""}</div>`;
}
function trendSheet(key){
  const c = child(), M = metricOf(c, key); if (!M) return;
  UI.trendKey = key; const days = UI.trendDays || 7;
  const pts = series(c, key, days), goal = M.goal(c), unitH = key === "sleep";
  const vals = pts.map(p=>p.v), avg = sum(vals)/days, prev = series(c, key, days*2).slice(0, days), pavg = sum(prev.map(p=>p.v))/days;
  const hit = goal ? vals.filter(v => M.kind === "max" ? v <= goal : v >= goal).length : null;
  const fmt = v => unitH ? fmtNum(v,1)+" h" : M.u === "min" ? fmtMin(v) : fmtNum(v, v%1?1:0)+(M.u?" "+M.u:"");
  let extra = "";
  if (key === "sleep"){ const naps = sum(pts.map(p => dayTotals(c, p.d).nap))/days; extra = `<div class="stat"><span class="muted tiny">${T("Siestes / jour")}</span><div class="v">${fmtMin(naps)}</div></div>`; }
  sheet(`${sheetHead(T(M.l))}<div class="seg">${[7,30,90].map(n=>`<button data-act="trendDays" data-v="${n}" aria-pressed="${days===n}">${T("{n} jours",{n})}</button>`).join("")}</div>
    ${days >= 90 ? (() => { const w = []; for (let i = pts.length; i > 0; i -= 7){ const a = pts.slice(Math.max(0, i-7), i); w.unshift({d:a[0].d, v:sum(a.map(p => p.v))/a.length}); } return `<p class="tiny muted">${T("Moyenne par jour, semaine par semaine. Touchez une semaine pour voir ses jours.")}</p>${bars(w, goal, M.col, M.kind, unitH, key)}`; })() : bars(pts, goal, M.col, M.kind, unitH)}
    <div class="stats"><div class="stat"><span class="muted tiny">${T("Moyenne / jour")}</span><div class="v">${fmt(avg)}</div></div><div class="stat"><span class="muted tiny">${T("Période précédente")}</span><div class="v">${fmt(pavg)}</div></div><div class="stat"><span class="muted tiny">${T("Min · max")}</span><div class="v" style="font-size:1.1rem">${fmt(Math.min(...vals))} · ${fmt(Math.max(...vals))}</div></div>${hit!=null?`<div class="stat"><span class="muted tiny">${T("Jours où l'objectif est atteint")}</span><div class="v">${hit}/${days}</div></div>`:""}${extra}</div>
    ${goal?`<p class="tiny muted">${T("Ligne pointillée : objectif de {v}. Touchez une barre pour voir la journée.",{v:fmt(goal)})}</p>`:`<p class="tiny muted">${T("Touchez une barre pour voir la journée.")}</p>`}
    ${days <= 7 ? `<div class="list">${[...pts].reverse().map(p => `<button class="li rowbtn" data-act="dayDetail" data-v="${iso(p.d)}"><div class="grow"><div class="li-title cap">${fmtD(p.d,{weekday:"long",day:"numeric",month:"short"})}</div></div><b class="num" style="color:var(--${goal && (M.kind==="max" ? p.v > goal : p.v < goal) ? "rose" : "ink"}-ink, var(--ink))">${fmt(p.v)}</b>${icon("right")}</button>`).join("")}</div>`
      : `<div class="list">${Array.from({length:Math.ceil(days/7)}, (_,w) => pts.slice(Math.max(0, days-7*(w+1)), days-7*w)).filter(a => a.length).map(a => `<button class="li rowbtn" data-act="weekDetail" data-v="${iso(a[0].d)}|${key}"><div class="grow"><div class="li-title">${T("Semaine du {d}",{d:fmtD(a[0].d,{day:"numeric",month:"short"})})}</div><div class="small muted">${a.length} ${T("jours")}</div></div><b class="num">${fmt(sum(a.map(p=>p.v))/a.length)}</b>${icon("right")}</button>`).join("")}</div>`}`, "wide");
}
/* calendrier de l'enfant : un coup d'œil par jour (sommeil, repas, activité, humeur) */
function kidCalendarCard(c){
  const base = UI.kcMonth ? parseD(UI.kcMonth) : new Date(today().getFullYear(), today().getMonth(), 1);
  const first = new Date(base.getFullYear(), base.getMonth(), 1), start = addDays(first, -((first.getDay()+6)%7));
  const moods = {Difficile:"rose", Moyen:"butter", Bien:"mint", Super:"sky"};
  let cells = ""; const EV = allEvents(start, addDays(start, 43)).filter(e => (e.kidIds||[]).includes(c.id) && !["photo","souvenir"].includes(e.type));
  for (let i = 0; i < 42; i++){
    const d = addDays(start, i), ds = iso(d), out = d.getMonth() !== base.getMonth(); if (i >= 35 && out && d.getDay() === 1) break;
    const fut = d > today(), Tt = fut ? null : dayTotals(c, d), mood = fut ? null : dayLogs(c, d).find(l => l.type === "mood");
    const ev = EV.filter(e => e.date === ds);
    const dots = fut ? ev.slice(0,3).map(e => `<i style="background:var(--${(EVT[e.type]||EVT.autre)[0]})"></i>`).join("") : [Tt.sleep && "lilac", Tt.meals && "mint", Tt.act && "peach", Tt.read && "butter", mood && moods[mood.data.mood], ev.length && "sky"].filter(Boolean).map(col => `<i style="background:var(--${col})"></i>`).join("");
    cells += `<button class="day ${out?"out":""} ${ds===iso(today())?"today":""}" data-act="${fut?"searchDate":"dayDetail"}" data-v="${ds}"><span class="num">${d.getDate()}</span><span class="dots">${dots}</span></button>`;
  }
  const dow = LANG === "en" ? ["M","T","W","T","F","S","S"] : ["L","M","M","J","V","S","D"];
  return `<div class="card"><div class="calhead"><h2>${T("Calendrier de {n}",{n:esc(c.nick||c.name)})} · <span class="cap">${first.toLocaleDateString(LOCALE(),{month:"long"})}</span></h2><div class="row"><button class="icon-btn" data-act="kcNav" data-v="-1" aria-label="${T("Mois précédent")}">${icon("left")}</button><button class="icon-btn" data-act="kcNav" data-v="1" aria-label="${T("Mois suivant")}">${icon("right")}</button></div></div>
    <div class="cal">${dow.map(x => `<div class="dow">${x}</div>`).join("")}${cells}</div>
    <div class="legend">${[["lilac","Sommeil"],["mint","Repas"],["peach","Activité"],["butter","Lecture"],["sky","Événement"]].map(([col,l]) => `<span><i style="background:var(--${col});width:8px;height:8px;border-radius:50%"></i>${T(l)}</span>`).join("")}</div>
    <p class="tiny muted">${T("Touchez un jour pour voir et modifier tout ce qui a été noté.")}</p></div>`;
}
/* analyse simple et concrète de la semaine, par mesure */
function insights(c, keys){
  const out = [];
  keys.forEach(k => { const M = metricOf(c, k), goal = M?.goal(c); if (!M || !goal) return;
    const a = series(c, k, 7), noted = a.filter(p => p.v > 0).length; if (!noted && M.kind !== "max") return;
    const avg = sum(a.map(p => p.v)) / (M.kind === "max" ? 7 : Math.max(1, noted)), fmt = v => k === "sleep" ? fmtNum(v,1)+" h" : M.u === "min" ? fmtMin(v) : fmtNum(v,0)+(M.u?" "+M.u:"");
    const ok = M.kind === "max" ? avg <= goal : avg >= goal * 0.9;
    out.push(`<li class="${ok?"ok":"warn"}">${ok?"✓":"!"} <b>${T(M.l)}</b> : ${fmt(avg)} ${M.kind==="max"?T("par jour (max. {g})",{g:fmt(goal)}):T("par jour noté (objectif {g})",{g:fmt(goal)})}${noted < 4 && M.kind !== "max" ? ` · <span class="muted">${T("seulement {n} jour(s) noté(s)",{n:noted})}</span>` : ""}</li>`);
  });
  return out.length ? `<ul class="insights">${out.join("")}</ul>` : "";
}
function dayDetail(ds){
  const c = child(), d = parseD(ds), L = dayLogs(c, d).sort((a,b) => a.t - b.t), Tt = dayTotals(c, d), G = goals(c);
  const st = (l, v, g, max) => `<div class="stat"><span class="muted tiny">${l}</span><div class="v" style="font-size:1.15rem;color:${g ? ((max ? v > g : v < g) ? "var(--rose-ink)" : "var(--mint-ink)") : "inherit"}">${v}</div></div>`;
  sheet(`${sheetHead(`<span class="cap">${fmtD(d,{weekday:"long",day:"numeric",month:"long"})}</span>`)}
    <div class="row"><button class="icon-btn" data-act="dayDetail" data-v="${iso(addDays(d,-1))}" aria-label="${T("Jour précédent")}">${icon("left")}</button><span class="grow small muted center">${esc(c.nick||c.name)}</span><button class="icon-btn" data-act="dayDetail" data-v="${iso(addDays(d,1))}" aria-label="${T("Jour suivant")}" ${ds>=iso(today())?"disabled":""}>${icon("right")}</button></div>
    <div class="stats">${st(T("Sommeil"), fmtNum(Tt.sleep/60,1)+" h", G.sleep && Tt.sleep ? null : null)}${Tt.nap?st(T("dont siestes"), fmtMin(Tt.nap)):""}${st(T("Activité"), fmtMin(Tt.act))}${mod(c,"screen")?st(T("Écran"), fmtMin(Tt.screen)):""}${mod(c,"reading")?st(T("Lecture"), fmtMin(Tt.read)):""}${Tt.feeds?st(T("Boires"), Tt.feeds + (Tt.ml?` · ${fmtVol(Tt.ml)}`:"")):""}${Tt.diapers?st(T("Couches"), Tt.diapers):""}${Tt.meals?st(T("Repas"), Tt.meals):""}</div>
    ${(c.activities||[]).filter(a => a.dur && a.auto !== false && a.days.map(Number).includes(d.getDay()) && (!a.since || ds >= a.since) && d <= today()).map(a => { const skip = (c.sportSkip||{})[a.id+"|"+ds]; return `<div class="li"><div class="ic" style="background:var(--mint-bg);color:var(--mint-ink)">${icon("ball")}</div><div class="grow"><div class="li-title">${esc(a.name)} · ${fmtMin(a.dur)}</div><div class="small muted">${T("Activité à l'horaire")}${a.time?` · ${a.time}`:""}</div></div><button class="chip ${skip?"":"mint"}" data-act="sportToggle" data-v="${c.id}|${a.id}|${ds}">${skip?T("Pas fait"):"✓ "+T("Fait")}</button></div>`; }).join("")}
    ${L.length ? `<div class="list">${L.map(l => logLine(c, l)).join("")}</div>` : `<p class="muted small">${T("Rien de noté ce jour-là.")}</p>`}
    ${isKidUser() ? "" : `<p class="tiny muted">${T("Touchez une ligne pour la modifier.")}</p>`}`, "wide");
}
function weekDetail(v){
  const [ds, key] = v.split("|"), c = child(), d0 = parseD(ds), M = metricOf(c, key), unitH = key === "sleep";
  const pts = Array.from({length:7}, (_,i) => { const d = addDays(d0, i); return {d, v:M.get(dayTotals(c, d))}; }).filter(p => p.d <= today());
  const fmt = v => unitH ? fmtNum(v,1)+" h" : M.u === "min" ? fmtMin(v) : fmtNum(v, v%1?1:0)+(M.u?" "+M.u:"");
  sheet(`${sheetHead(`${T(M.l)} · ${T("Semaine du {d}",{d:fmtD(d0,{day:"numeric",month:"short"})})}`)}${bars(pts, M.goal(c), M.col, M.kind, unitH)}
    <div class="list">${pts.map(p => `<button class="li rowbtn" data-act="dayDetail" data-v="${iso(p.d)}"><div class="grow"><div class="li-title cap">${fmtD(p.d,{weekday:"long",day:"numeric"})}</div></div><b class="num">${fmt(p.v)}</b>${icon("right")}</button>`).join("")}</div>`, "wide");
}
function moodCard(c){
  const order = ["Difficile","Moyen","Bien","Super"], cols = ["rose","butter","mint","sky"];
  const days = Array.from({length:14}, (_,i) => addDays(today(), i-13));
  const cells = days.map(d => { const l = dayLogs(c, d).find(x => x.type==="mood"); const i = l ? order.indexOf(l.data.mood) : -1;
    return `<div title="${fmtD(d,{day:"numeric",month:"short"})}${l?` : ${T(l.data.mood)}`:""}" style="flex:1;min-width:0;height:${i<0?8:14+i*12}px;border-radius:6px;background:${i<0?"var(--surface2)":`var(--${cols[i]})`}"></div>`; }).join("");
  return `<div class="card"><div class="card-h"><h3>${T("Humeur, 14 jours")}</h3><div class="legend">${order.map((o,i)=>`<span><i style="background:var(--${cols[i]});width:10px;height:10px;border-radius:3px"></i>${T(o)}</span>`).join("")}</div></div><div style="display:flex;gap:4px;align-items:flex-end;height:56px">${cells}</div><p class="tiny muted">${T("Plusieurs jours difficiles de suite ? Prenez un moment pour en parler. LigneParents : 1-800-361-5085.")}</p></div>`;
}
const WD = () => LANG === "en" ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] : ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
function sportsCard(c){
  const m = ageMonths(c);
  const sugg = m < 72 ? T("Jeu libre dehors, natation parent-enfant, vélo à pousser, danse, parc") : m < 144 ? T("Varier : natation, vélo, soccer, gymnastique, arts martiaux, ski, escalade") : T("Un sport d'équipe, une activité d'endurance et du renforcement 3 fois par semaine");
  const weekMin = sum(Array.from({length:7},(_,i)=>dayTotals(c, addDays(today(), -i)).act));
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Sports et activités")}</span><h2>${T("Horaire de la semaine")}</h2></div>${isKidUser()?"":`<button class="btn sm kid" data-act="activityForm">${icon("plus")}${T("Activité")}</button>`}</div>
    ${c.activities.length?`<div class="list">${c.activities.map(a=>`<div class="li" ${isKidUser()?"":`data-act="activityForm" data-v="${a.id}" style="cursor:pointer"`}><div class="ic" style="background:var(--mint-bg);color:var(--mint-ink)">${icon("ball")}</div><div class="grow"><div class="li-title">${esc(a.name)}</div><div class="small muted">${a.days.map(d=>WD()[d]).join(", ")}${a.time?` · ${a.time}`:""}</div>${a.place?`<div class="small">${placeLink(a.place)}</div>`:""}</div>${isKidUser()?"":icon("edit").replace("<svg",'<svg style="width:18px;height:18px;color:var(--soft)"')}</div>`).join("")}</div>`:`<p class="small muted">${T("Aucune activité régulière. Elles apparaîtront aussi dans l'agenda.")}</p>`}
    <div class="banner ok">${icon("run")}<div><b class="num">${fmtMin(weekMin)}</b> ${T("d'activité notée sur 7 jours.")} ${T("Idées pour cet âge :")} ${sugg}.</div></div></div>`;
}
function logLine(c, l){
  let T0 = LOGT[l.type], tr = null;
  if (l.type === "trk"){ tr = (c.trackers||[]).find(x => x.id === l.data.tid); T0 = {label:tr?.name||T("Suivi"), ic:tr?.icon||"target", c:tr?.color||"teal"}; }
  T0 = T0 || LOGT.note; const d = l.data || {};
  let txt = T(T0.label), sub = "";
  if (l.type === "feed") { txt = T(d.mode || "Boire"); sub = [d.ml?fmtVol(d.ml):"", l.end?fmtDur(l.end-l.t-(d.pausedMin||0)*6e4):""].filter(Boolean).join(" · "); }
  if (l.type === "sleep") { txt = T(d.kind || "Dodo"); sub = l.end ? `${fmtT(l.t)} → ${fmtT(l.end)} · ${fmtDur(l.end-l.t-(d.pausedMin||0)*6e4)}${d.where?` · ${T(d.where)}`:""}` : T("en cours"); }
  if (l.type === "diaper") { txt = `${T("Couche")} · ${T(d.kind)}`; sub = [d.color, d.texture].filter(Boolean).map(T).join(", "); }
  if (l.type === "solid") { txt = (d.items||[]).map(i => i.name).join(", ") || d.food || T("Repas"); const kc = sum((d.items||[]).map(i => Number(i.nut?.kcal)||0)), pr = sum((d.items||[]).map(i => Number(i.nut?.prot)||0)); sub = [d.meal?T(d.meal):"", kc?`${Math.round(kc)} kcal · ${Math.round(pr)} g ${T("prot.")}`:"", d.allergen?T("Allergène : {a}",{a:T(d.allergen)}):"", d.reaction?T("réaction : {r}",{r:d.reaction}):""].filter(Boolean).join(" · "); }
  if (l.type === "temp") { txt = fmtTemp(d.temp); sub = T(d.site); }
  if (l.type === "med") { txt = d.name || T("Médicament"); sub = d.dose || ""; }
  if (l.type === "mood") txt = `${T("Humeur")} · ${T(d.mood)}`;
  if (l.type === "screen") txt = `${T("Écran")} · ${fmtMin(d.min)}`;
  if (l.type === "tummy") txt = `${T("Sur le ventre")} · ${fmtMin(d.min)}`;
  if (l.type === "read") { txt = `${T("Lecture")} · ${fmtMin(d.min)}`; sub = d.title || ""; }
  if (l.type === "activity") { txt = `${T(d.what || "Activité")} · ${fmtMin(d.min)}`; sub = T(d.intensity || ""); }
  if (l.type === "trk") { txt = `${esc(tr?.name||"")} · ${fmtNum(d.v, d.v%1?1:0)} ${tr?.unit||""}`; }
  if (l.type === "note") txt = d.text;
  if (d.note && l.type!=="note") sub = [sub, d.note].filter(Boolean).join(" · ");
  const canDel = !isKidUser() || allow("delete");
  return `<div class="li" ${canDel?`data-act="editLog" data-v="${l.id}" style="cursor:pointer"`:""}><div class="ic" style="background:var(--${T0.c}-bg);color:var(--${T0.c}-ink)">${icon(T0.ic)}</div><div class="grow"><div class="li-title">${esc(txt)}</div>${sub?`<div class="small muted">${esc(sub)}</div>`:""}</div><span class="small muted num">${fmtT(l.t)}</span>${canDel?`<button class="icon-btn flat" data-act="delLog" data-v="${l.id}" aria-label="${T("Supprimer")}">${icon("trash")}</button>`:""}</div>`;
}

/* ---------- formulaires du journal (choix rapides + note facultative) ---------- */
const pick = (name, opts, sel) => `<div class="pick" data-pick="${name}">${opts.map(o => `<button type="button" data-act="pickOpt" data-v="${esc(o)}" aria-pressed="${o===sel}">${esc(T(o))}</button>`).join("")}</div><input type="hidden" id="pk-${name}" value="${esc(sel||"")}">`;
const pickVal = name => val("pk-"+name);
function logForm(type, editId){
  const c = child(), m = ageMonths(c); let body = "", title;
  const L = editId ? c.logs.find(x => x.id === editId) : null, d = L?.data || {}, ed = !!L, mn = d.min ? String(d.min) : "";
  const time = fld("f-t",T("Heure"),`<input class="inp" id="f-t" type="datetime-local" value="${localInput(L?.t||Date.now())}">`);
  const note = fld("f-note",T("Note (facultatif)"),`<input class="inp" id="f-note" value="${esc(d.note||"")}">`);
  if (type.startsWith("trk:")){
    const t = c.trackers.find(x => "trk:"+x.id === type); title = t.name;
    body = t.type === "yesno" ? `<p class="small muted">${T("Touchez Enregistrer pour noter « oui » maintenant.")}</p>${time}${note}`
      : t.type === "scale" ? `${fld("f-v",T("Note de 1 à 5"),pick("scale",["1","2","3","4","5"],d.v?String(d.v):"3"))}${time}${note}`
      : `${fld("f-v",`${T("Valeur")}${t.unit?` (${esc(t.unit)})`:""}`,numIn("f-v","",t.type==="count"?1:"any", d.v ?? (t.type==="count"?1:"")))}${time}${note}`;
  } else {
    title = T(LOGT[type].label);
    if (type === "feed") body = `${pick("mode",QUICK.feedSide,d.mode||"Sein gauche")}<div class="fgrid">${fld("f-ml",`${T("Quantité")} (${volU()})`,numIn("f-ml",T("biberon"),1,d.ml?fmtVolIn(d.ml):""))}${fld("f-min",T("Durée (min)"),numIn("f-min","",1,L?.end?Math.round((L.end-L.t)/6e4):""))}</div>${time}${ed?"":`<button type="button" class="btn ghost" data-act="startTimer" data-v="feed">${icon("bottle")}${T("Démarrer une minuterie de tétée")}</button>`}`;
    if (type === "sleep") body = `${pick("kind",QUICK.sleepKind, d.kind || (new Date().getHours() >= 19 || new Date().getHours() < 6 ? "Nuit" : "Sieste"))}${ed?"":`<button type="button" class="btn kid" data-act="startTimer" data-v="sleep">${icon("moon")}${T("Démarrer maintenant (minuterie)")}</button><div class="sep"></div><p class="small muted">${T("Ou noter un sommeil terminé :")}</p>`}<div class="fgrid">${fld("f-t",T("Début"),`<input class="inp" id="f-t" type="datetime-local" value="${localInput(L?.t||Date.now()-(m>=36?9:1)*36e5)}">`)}${fld("f-end",T("Fin"),`<input class="inp" id="f-end" type="datetime-local" value="${localInput(L?.end||Date.now())}">`)}</div>${fld("x",T("Où (facultatif)"),pick("where",QUICK.sleepWhere,d.where||""))}`;
    if (type === "diaper") body = `${pick("kind",["Pipi","Selle","Pipi et selle"],d.kind||"Pipi")}<div class="field"><label>${T("Couleur (facultatif)")}</label>${pick("color",QUICK.diaperColor,d.color||"")}</div><div class="field"><label>${T("Consistance (facultatif)")}</label>${pick("texture",QUICK.diaperTexture,d.texture||"")}</div>${time}${note}`;
    if (type === "solid"){ mealForm(L ? {items:JSON.parse(JSON.stringify(d.items||[])), editId:L.id, t:L.t, meal:d.meal, reaction:d.reaction, allergen:d.allergen} : null); return; }
    if (type === "temp") body = `${fld("f-temp",`${T("Température")} (${tempU()})`,`<input class="inp" id="f-temp" type="number" inputmode="decimal" step="0.1" placeholder="${tempU()==="°F"?"100.8":"38,2"}" value="${d.temp?fmtTempIn(d.temp):""}">`)}${pick("site",["Rectale","Buccale","Axillaire","Tympanique"],d.site||(m<24?"Rectale":"Buccale"))}${time}<p class="tiny muted">${T("Avant 2 ans, la mesure rectale est la plus fiable.")}</p>`;
    if (type === "med") body = `${pick("name",QUICK.medCommon,"")}${fld("f-name",T("Ou un autre médicament"),`<input class="inp" id="f-name" value="${esc(d.name||"")}">`)}${fld("f-dose",T("Dose donnée (selon l'étiquette ou la prescription)"),`<input class="inp" id="f-dose" placeholder="${T("Ex. : 2,5 ml")}" value="${esc(d.dose||"")}">`)}${time}<p class="tiny muted">${T("Pour la dose, suivez l'étiquette selon le poids de l'enfant, ou demandez au pharmacien.")}</p>`;
    if (type === "mood") body = `${pick("mood",QUICK.mood,d.mood||"Bien")}${note}${time}`;
    if (type === "screen") body = `${pick("mins",["15","30","45","60","90","120"],"")}${fld("f-min",T("Ou minutes exactes"),numIn("f-min","60",5,mn))}${time}`;
    if (type === "tummy") body = `${pick("mins",["5","10","15","20","30"],"")}${fld("f-min",T("Ou minutes exactes"),numIn("f-min","10",5,mn))}${time}`;
    if (type === "read") body = `${pick("mins",["10","15","20","30","45"],"")}<div class="fgrid">${fld("f-min",T("Ou minutes exactes"),numIn("f-min","15",5,mn))}${fld("f-title",T("Livre (facultatif)"),acInput("f-title", d.title||"", {list:c.logs.filter(l=>l.type==="read"&&l.data.title).map(l=>l.data.title)}))}</div>${time}`;
    if (type === "activity") body = `${pick("what",[...new Set([...c.activities.map(a=>a.name), ...QUICK.activity])].slice(0,12),"")}${fld("f-what",T("Ou autre activité"),`<input class="inp" id="f-what" value="${esc(d.what||"")}">`)}${pick("mins",["15","30","45","60","90"],"")}${fld("f-min",T("Ou minutes exactes"),numIn("f-min","30",5,mn))}${pick("intensity",["Légère","Modérée","Intense"],d.intensity||"Modérée")}${time}`;
    if (type === "note") body = `${fld("f-text",T("Note"),`<textarea class="inp" id="f-text">${esc(d.text||"")}</textarea>`)}${time}`;
  }
  sheet(`<form class="stack" data-form="log" data-type="${type}" data-id="${ed?L.id:""}" style="gap:14px">${sheetHead(ed ? T("Modifier · {t}",{t:esc(title)}) : esc(title))}${body}<div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${ed?`<button type="button" class="btn danger" data-act="delLog" data-v="${L.id}">${icon("trash")}</button>`:""}</div></form>`);
}
function goalsForm(){
  const c = child(), G = goals(c), g = G.rec;
  sheet(`<form class="stack" data-form="goals" style="gap:14px">${sheetHead(T("Objectifs de {n}",{n:esc(c.nick||c.name)}))}
    <p class="small muted">${T("Recommandations usuelles pour {b} entre parenthèses. Modifiez selon votre famille ; l'app vous rappellera de les revoir quand l'âge changera de tranche.",{b:g.band})}</p>
    <div class="fgrid">${fld("g-sleep",`${T("Sommeil (h)")} <span class="muted">(${g.sleep[0]}-${g.sleep[1]})</span>`,numIn("g-sleep","",0.5,G.sleep))}${fld("g-act",`${T("Activité (min)")} <span class="muted">(${g.act})</span>`,numIn("g-act","",5,G.act))}${fld("g-screen",`${T("Écran max (min)")} <span class="muted">(${g.screen||0})</span>`,numIn("g-screen","",5,G.screen))}${fld("g-read",`${T("Lecture (min)")} <span class="muted">(${g.read})</span>`,numIn("g-read","",5,G.read))}</div>
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button><button type="button" class="btn ghost" data-act="resetGoals">${T("Recommandations")}</button></div></form>`);
}
function trackerForm(id){
  const c = child(), t = c.trackers.find(x => x.id === id) || {name:"", type:"count", unit:"", goal:"", goalKind:"min", color:"teal", icon:"target"};
  const ics = ["target","drop","pill","heart","star","book","run","smile","tooth","spoon","bed","note"];
  sheet(`<form class="stack" data-form="tracker" data-id="${id||""}" style="gap:14px">${sheetHead(id?T("Modifier le suivi"):T("Nouveau suivi personnalisé"))}
    <p class="small muted">${T("Ex. : verres d'eau, crises d'asthme, pipi au pot, minutes de piano, devoirs.")}</p>
    ${fld("t-name",T("Nom"),inp("t-name",t.name,"required"))}
    <div class="field"><label>${T("Type")}</label>${radios("ttype",[["count",T("Compteur (+1)")],["number",T("Nombre ou minutes")],["yesno",T("Oui / non")],["scale",T("Échelle 1 à 5")]],t.type)}</div>
    <div class="fgrid">${fld("t-unit",T("Unité (facultatif)"),inp("t-unit",t.unit))}${fld("t-goal",T("Objectif par jour (facultatif)"),numIn("t-goal","",1,t.goal||""))}</div>
    <div class="field"><label>${T("L'objectif est")}</label>${radios("tkind",[["min",T("un minimum")],["max",T("un maximum")]],t.goalKind)}</div>
    <div class="field"><label>${T("Couleur")}</label>${swatches("tcolor",t.color)}</div>
    <div class="field"><label>${T("Icône")}</label><div class="radio-row">${ics.map(i=>`<label><input type="radio" name="ticon" value="${i}" ${t.icon===i?"checked":""}><span style="display:grid;place-items:center;width:42px;height:38px;padding:0">${icon(i).replace("<svg",'<svg style="width:20px;height:20px"')}</span></label>`).join("")}</div></div>
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${id?`<button type="button" class="btn danger" data-act="delTracker" data-v="${id}">${T("Supprimer")}</button>`:""}</div></form>`);
}
function activityForm(id){
  const a = id ? child().activities.find(x => x.id === id) : null;
  sheet(`<form class="stack" data-form="activity" data-id="${a?.id||""}" style="gap:14px">${sheetHead(a ? T("Modifier l'activité") : T("Activité régulière"))}
    ${fld("a-name",T("Activité"),acInput("a-name", a?.name||"", {list:QUICK.activity.map(x => T(x)), placeholder:T("Soccer, natation, piano…")}, "required"))}
    <div class="field"><label>${T("Jours")}</label>${checks("days",[1,2,3,4,5,6,0].map(d=>[String(d),WD()[d]]),(a?.days||[]).map(String))}</div>
    <div class="fgrid">${fld("a-time",T("Heure"),`<input class="inp" id="a-time" type="time" value="${a?.time||""}">`)}${fld("a-dur",T("Durée (min)"),numIn("a-dur","60",5,a?.dur||""))}</div>
    <label class="switch"><input type="checkbox" id="a-auto" ${a?.auto===false?"":"checked"}><span class="tg"></span><span class="grow">${T("Compter automatiquement dans l'activité physique (vous pourrez marquer « pas fait » une journée)")}</span></label>
    <div class="fgrid">${fld("a-place",T("Lieu"),addrInput("a-place", a?.place||""))}</div>
    <div class="row"><button class="btn kid grow" type="submit">${a?T("Enregistrer"):T("Ajouter")}</button>${a?`<button type="button" class="btn danger" data-act="delActivity" data-v="${a.id}">${icon("trash")}</button>`:""}</div></form>`);
}

/* ======== REPAS ET BOIRES ======== */
function repas(c){
  const m = ageMonths(c);
  let h = "";
  if (mod(c,"feeding")){
    const days = Array.from({length:7},(_,i)=>dayTotals(c, addDays(today(), i-6)));
    h += `<div class="card"><div class="card-h"><h2>${T("Boires")}</h2><button class="btn sm kid" data-act="log" data-v="feed">${icon("plus")}${T("Boire")}</button></div>
      <div class="stats"><div class="stat"><span class="muted tiny">${T("Aujourd'hui")}</span><div class="v">${days[6].feeds}<small>${days[6].ml?days[6].ml+" ml":""}</small></div></div><div class="stat"><span class="muted tiny">${T("Moyenne 7 jours")}</span><div class="v">${fmtNum(sum(days.map(d=>d.feeds))/7,1)}</div></div></div>
      ${bars(days.map((d,i)=>({d:addDays(today(),i-6), v:d.feeds})), null, "peach")}</div>`;
  }
  if (!mod(c,"solids")) return h;
  const fav = c.foodFav || [];
  h += `<div class="card"><div class="card-h"><h2>${T("Noter un repas")}</h2><button class="btn sm kid" data-act="log" data-v="solid">${icon("plus")}${T("Repas")}</button></div>
    ${aiReady() && !isKidUser() ? `<span class="eyebrow">${icon("spark").replace("<svg",'<svg style="width:13px;height:13px;vertical-align:-2px"')} ${T("Avec Gemini")}</span><div class="row" style="flex-wrap:wrap;gap:6px">${aiBtn("aiMealPhoto",null,T("Photo du repas"),"camera")}${aiBtn("aiScan","label",T("Lire une étiquette"),"tag")}${m < 144 ? aiBtn("aiScan","menu",m < 60 ? T("Menu de la garderie") : T("Menu de l'école"),"dish") : ""}</div>` : ""}
    ${fav.length ? `<span class="eyebrow">${T("Favoris : touchez pour noter")}</span><div class="pick">${fav.map(f => `<button data-act="quickFood" data-v="${esc(f.name)}" style="border-color:var(--${FOOD_GROUPS[f.group]?.color||"line"})">${esc(f.name)}</button>`).join("")}</div>` : `<p class="small muted">${T("Les aliments marqués d'une étoile apparaîtront ici pour les noter en un geste.")}</p>`}
    <div class="banner soft">${icon("spoon")}<div class="small"><b>${T("Portions pour cet âge :")}</b> ${T(portionHint(m))}</div></div></div>`;
  // répartition par groupe sur 7 jours (semaine choisie)
  const wOff = UI.plateWeek || 0, wEnd = addDays(today(), -7 * wOff);
  const G = {}; for (let i=0;i<7;i++){ const t = dayTotals(c, addDays(wEnd, -i)); for (const k in t.groups) G[k] = (G[k]||0) + t.groups[k]; }
  const tot = sum(Object.values(G));
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${wOff ? T("Du {a} au {b}",{a:fmtD(addDays(wEnd,-6),{day:"numeric",month:"short"}), b:fmtD(wEnd,{day:"numeric",month:"short"})}) : T("7 derniers jours · Guide alimentaire canadien")}</span><h2>${T("L'assiette de la semaine")}</h2></div><div class="row"><button class="icon-btn" data-act="plateWeek" data-v="1" aria-label="${T("Semaine précédente")}">${icon("left")}</button><button class="icon-btn" data-act="plateWeek" data-v="-1" aria-label="${T("Semaine suivante")}" ${wOff?"":"disabled"}>${icon("right")}</button></div></div>
    ${plateStats(c, wEnd)}
    ${tot ? `<div class="stack" style="gap:8px">${Object.entries(FOOD_GROUPS).map(([k,g]) => { const p = (G[k]||0)/tot; return `<div><div class="row between small"><b style="color:var(--${g.color}-ink)">${T(g.label)}</b><span class="muted num">${Math.round(p*100)} %${g.target?` · ${T("cible")} ${Math.round(g.target*100)} %`:""}</span></div><div class="dombar" style="position:relative"><i style="width:${(p*100).toFixed(0)}%;background:var(--${g.color})"></i>${g.target?`<span style="position:absolute;top:-2px;bottom:-2px;left:${g.target*100}%;width:2px;background:var(--ink)"></span>`:""}</div></div>`; }).join("")}</div>` : `<p class="small muted">${T("Notez quelques repas pour voir l'équilibre de la semaine.")}</p>`}
    ${tot ? (() => { const low = Object.entries(FOOD_GROUPS).filter(([k,g]) => g.target && (G[k]||0)/tot < g.target*0.7).map(([k]) => k); return low.length ? `<div class="banner ok">${icon("bulb")}<div class="small"><b>${T("Idées pour équilibrer :")}</b> ${low.map(k => `${T(FOOD_GROUPS[k].label)} : ${FOOD_SUGG[k].slice(0,4).map(T).join(", ")}`).join(" · ")}</div></div>` : `<div class="banner ok">${icon("check")}<div class="small">${T("Belle variété cette semaine.")}</div></div>`; })() : ""}</div>`;
  h += nutritionCard(c);
  if (m < 36) h += allergenCard(c);
  const meals = c.logs.filter(l => l.type === "solid").sort((a,b)=>b.t-a.t).slice(0,12);
  h += mealJournalCard(c) + mealTrendsCard(c);
  return h;
}
/* menu déroulant : favoris, collations gardées, puis chaque groupe alimentaire (on peut aussi écrire) */
function foodSelect(c, attrs){
  const fav = (c?.foodFav||[]).map(f => f.name);
  return `<select class="inp food-select" ${attrs} aria-label="${T("Choisir dans la liste")}"><option value="">${T("Choisir dans la liste…")}</option>${fav.length ? `<optgroup label="${T("Favoris")}">${fav.map(n => `<option value="fav|${esc(n)}">${esc(n)}</option>`).join("")}</optgroup>` : ""}${Object.entries(FOOD_GROUPS).map(([g, G]) => `<optgroup label="${T(G.label)}">${foodOptions(g).map(n => `<option value="${g}|${esc(T(n))}">${T(n)}</option>`).join("")}</optgroup>`).join("")}</select>`;
}
function mealForm(prefill){
  const c = child(); UI.meal = prefill || {items:[{name:"", group:"legfruits", qty:""}]};
  const favNames = (c.foodFav||[]).map(f => f.name);
  const rows = UI.meal.items.map((it,i) => `<div class="stack" style="gap:6px;padding:10px;border-radius:14px;background:var(--surface2)">${foodSelect(c, `data-change="mealPick" data-i="${i}"`)}<div class="row"><div class="grow">${acInput("mi-"+i, it.name, {list:[...favNames, ...Object.values(FOOD_SUGG).flat().map(T)], placeholder:T("Aliment")}, `data-meal="${i}" data-k="name"`)}</div><input class="inp" style="width:110px" data-meal="${i}" data-k="qty" value="${esc(it.qty)}" placeholder="${T("Quantité")}"><button type="button" class="icon-btn flat" data-act="favFood" data-v="${i}" aria-label="${T("Favori")}" style="color:var(--butter-ink)">${icon("star").replace('fill="none"', favNames.includes(it.name)?'fill="currentColor"':'fill="none"')}</button>${UI.meal.items.length>1?`<button type="button" class="icon-btn flat" data-act="rmMealItem" data-v="${i}" aria-label="${T("Retirer")}">${icon("x")}</button>`:""}</div>
    <div class="pick">${Object.entries(FOOD_GROUPS).map(([k,g]) => `<button type="button" data-act="mealGroup" data-v="${i}:${k}" aria-pressed="${it.group===k}" style="font-size:.78rem;padding:5px 9px">${T(g.label)}</button>`).join("")}</div></div>`).join("");
  const M0 = UI.meal; sheet(`<form class="stack" data-form="meal" style="gap:12px">${sheetHead(M0.editId ? T("Modifier le repas") : T("Repas"))}
    <div class="row" style="flex-wrap:wrap;gap:6px"><button type="button" class="btn sm ghost" data-act="mealFormPhoto">${icon("camera")}${UI.meal.photo ? T("Changer la photo") : T("Ajouter une photo (facultatif)")}</button>${UI.meal.photo ? `<label class="switch" style="flex:1 1 200px"><input type="checkbox" id="f-keep" ${UI.meal.keep!==false?"checked":""}><span class="tg"></span><span class="grow small">${T("Garder aussi en souvenir")}</span></label>` : ""}</div>
    ${UI.meal.photo?`<img src="${UI.meal.photo}" alt="" data-act="viewImg" style="border-radius:16px;max-height:200px;object-fit:cover">`:""}
    ${UI.meal.comment?`<div class="banner soft">${icon("spark")}<div class="small">${esc(UI.meal.comment)}</div></div>`:""}
    <div id="mealItems" class="stack" style="gap:8px">${rows}</div>
    <button type="button" class="btn ghost" data-act="addMealItem">${icon("plus")}${T("Ajouter un aliment")}</button>
    ${ageMonths(c) < 36 ? fld("f-al",T("Contient un allergène ?"),`<select class="inp" id="f-al"><option value="">${T("Non")}</option>${ALLERGENS.map(a=>`<option value="${a}" ${M0.allergen===a?"selected":""}>${T(a)}</option>`).join("")}</select>`) : ""}
    <div class="field"><label>${T("Moment")}</label>${pick("mealk",["Déjeuner","Dîner","Souper","Collation"],M0.meal||mealKindAt(M0.t||Date.now()))}</div>
    ${fld("f-re",T("Réaction ou commentaire (facultatif)"),`<input class="inp" id="f-re" value="${esc(M0.reaction||"")}">`)}
    ${fld("f-t",T("Heure"),`<input class="inp" id="f-t" type="datetime-local" value="${localInput(M0.t||Date.now())}">`)}
    ${M0.items.some(i => i.nut) ? `<p class="tiny muted">${icon("spark").replace("<svg",'<svg style="width:12px;height:12px"')} ${T("Nutriments estimés : {k} kcal · {p} g protéines",{k:Math.round(sum(M0.items.map(i => Number(i.nut?.kcal)||0))), p:Math.round(sum(M0.items.map(i => Number(i.nut?.prot)||0)))})}</p>` : ""}
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${M0.editId?`<button type="button" class="btn danger" data-act="delLog" data-v="${M0.editId}">${icon("trash")}</button>`:""}</div></form>`);
}
/* indicateurs de la semaine : variété, nouveaux aliments, légumes et fruits, collations, sucres, boissons */
function plateStats(c, end){
  const from = addDays(end, -6).getTime(), to = addDays(end, 1).getTime(), L = c.logs.filter(l => l.type === "solid" && l.t >= from && l.t < to);
  if (!L.length) return "";
  const items = L.flatMap(l => l.data.items||[]), names = new Set(items.map(i => i.name.trim().toLowerCase()));
  const before = new Set(c.logs.filter(l => l.type === "solid" && l.t < from).flatMap(l => (l.data.items||[]).map(i => i.name.trim().toLowerCase())));
  const fresh = [...names].filter(n => !before.has(n)), days = new Set(L.map(l => dayKey(l.t))).size;
  const vegDays = new Set(L.filter(l => (l.data.items||[]).some(i => i.group === "legfruits")).map(l => dayKey(l.t))).size;
  const snacks = L.filter(l => mealKindOf(l) === "Collation").length, treats = items.filter(i => i.group === "autres").length;
  const sugar = sum(items.map(i => Number(i.nut?.sugar)||0)) / Math.max(1, days), drinks = items.filter(i => /jus|boisson gazeuse|liqueur|soda|juice/i.test(i.name)).length;
  const fish = items.filter(i => /saumon|truite|sardine|thon|poisson|hareng|maquereau|crevette|fish|salmon/i.test(i.name)).length, legumes = items.filter(i => /lentille|pois chiche|haricot|tofu|edamame|hoummos|bean|lentil/i.test(i.name)).length;
  const st = [[T("Aliments différents"), names.size, names.size >= 15 ? "mint" : "butter"], [T("Nouveaux aliments"), fresh.length, fresh.length ? "lilac" : ""], [T("Jours avec légumes ou fruits"), `${vegDays}/${days}`, vegDays >= days ? "mint" : "butter"], [T("Repas notés"), L.length, ""], [T("Collations"), snacks, ""], [T("Gâteries"), treats, treats > 5 ? "rose" : ""], [T("Poisson"), fish, fish >= 2 ? "mint" : ""], [T("Légumineuses ou tofu"), legumes, legumes ? "mint" : ""], [T("Jus ou boissons sucrées"), drinks, drinks > 3 ? "rose" : ""]];
  if (ageMonths(c) >= 12 && sugar) st.push([T("Sucres par jour"), `${Math.round(sugar)} g`, ""]);
  return `<div class="plate-stats">${st.map(([l, v, col]) => `<div class="pstat ${col?"c-"+col:""}"><b class="num">${v}</b><span class="tiny">${l}</span></div>`).join("")}</div>${fresh.length ? `<p class="tiny muted">${T("Nouveaux cette semaine")} : ${esc(fresh.slice(0, 8).join(", "))}</p>` : ""}`;
}
function allergenCard(c){
  const log = c.allergensLog || {};
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Introduction des allergènes")}</span><h2>${T("Exposition régulière")}</h2></div><span class="chip mint num">${ALLERGENS.filter(a=>(log[a]||[]).length).length}/${ALLERGENS.length}</span></div>
  <p class="small muted">${T("Une fois introduit sans réaction, gardez l'aliment au menu quelques fois par semaine. Urticaire étendue, vomissements répétés ou difficulté à respirer : 911.")}</p>
  <div class="list">${ALLERGENS.map(a => { const L = (log[a]||[]).slice().sort(); const last = L[L.length-1]; const stale = last && (today()-parseD(last))/DAY > 10;
    return `<div class="li"><div class="ic" style="background:var(--${L.length?"mint":"surface2"}-bg, var(--surface2));color:var(--${L.length?"mint":"muted"}-ink, var(--muted));font-weight:800">${L.length}</div><div class="grow"><div class="li-title">${T(a)}</div><div class="small" style="color:var(--${stale?"butter-ink":"muted"})">${last?T("Dernière fois : {d}",{d:fmtD(last,{day:"numeric",month:"short"})})+(stale?" · "+T("à redonner"):""):T("Pas encore introduit")}</div></div><button class="btn sm ghost" data-act="allergen" data-v="${esc(a)}" style="white-space:nowrap">+ ${T("Aujourd'hui")}</button></div>`; }).join("")}</div></div>`;
}

/* ======== CROISSANCE ======== */
function croissance(c){
  const m = ageMonths(c);
  const avail = Object.keys(MEAS).filter(k => k !== "ofc" || (mod(c,"ofc") && m < 66)).filter(k => k !== "weight" || m < 126);
  if (!avail.includes(UI.sub.courbes)) UI.sub.courbes = avail.includes("weight") ? "weight" : "height";
  const k = UI.sub.courbes, alerts = growthAlerts(c).filter(a => a.meas === k), vel = heightVelocity(c), mp = midParental(c);
  const G = [...c.growth].sort((a,b) => a.date < b.date ? 1 : -1), last = G[0];
  const lastOf = key => G.find(g => Number(g[key])), bmiOf = g => g && g.weight && g.height ? g.weight/Math.pow(g.height/100,2) : null;
  const tile = (key, v, date, dp) => { if (!v) return ""; const z = zScore(key, c.sex, effAge(c, parseD(date)), v); return `<button class="gtile ${UI.sub.courbes===key?"on":""}" data-act="meas" data-v="${key}"><span class="tiny muted">${T(MEAS[key].label)}</span><b>${fmtNum(cvM(key,v),dpM(key,dp))} <small>${muM(key)}</small></b>${z!=null?`<span class="chip ${Math.abs(z)>1.88?"butter":"mint"}">P${pctLabel(z)}</span>`:""}</button>`; };
  const lw = lastOf("weight"), lh = lastOf("height"), lo = lastOf("ofc"), bm = G.find(g => bmiOf(g));
  let h = `<div class="card"><div class="card-h"><div><span class="eyebrow">${last ? T("Dernière mesure : {d} · {a}",{d:fmtD(last.date), a:ageLabel(ageMonths(c, parseD(last.date)))}) : T("Croissance")}</span><h2>${T("Où en est {n}",{n:esc(c.nick||c.name)})}</h2></div>${isKidUser()?"":`<button class="btn kid sm" data-act="growthForm">${icon("plus")}${T("Mesure")}</button>`}</div>
    ${last ? `<div class="gtiles">${avail.includes("weight") && lw ? tile("weight", Number(lw.weight), lw.date, 2) : ""}${lh ? tile("height", Number(lh.height), lh.date, 1) : ""}${avail.includes("ofc") && lo ? tile("ofc", Number(lo.ofc), lo.date, 1) : ""}${bm ? tile("bmi", bmiOf(bm), bm.date, 1) : ""}</div>` : `<p class="small muted">${T("Ajoutez une première mesure pour voir les courbes et les percentiles.")}</p>`}</div>
  <div class="card"><div class="card-h"><h2>${T("Courbes de croissance OMS")}</h2></div>
    <div class="row between"><div class="seg">${avail.map(x=>`<button data-act="meas" data-v="${x}" aria-pressed="${x===k}">${T(MEAS[x].label)}</button>`).join("")}</div>
    ${correction(c)>0?`<div class="seg"><button data-act="chrono" data-v="0" aria-pressed="${!UI.chrono}">${T("Âge corrigé")}</button><button data-act="chrono" data-v="1" aria-pressed="${UI.chrono}">${T("Chronologique")}</button></div>`:""}</div>
    <div class="row between"><div class="seg" id="rangeSeg"></div><div class="chart-tools"><button class="icon-btn" data-act="zoom" data-v="in" aria-label="${T("Zoom avant")}">${icon("zoomin")}</button><button class="icon-btn" data-act="zoom" data-v="out" aria-label="${T("Zoom arrière")}">${icon("zoomout")}</button><button class="icon-btn" data-act="zoom" data-v="left" aria-label="${T("Plus tôt")}">${icon("left")}</button><button class="icon-btn" data-act="zoom" data-v="right" aria-label="${T("Plus tard")}">${icon("right")}</button><button class="icon-btn" data-act="chartFull" aria-label="${T("Agrandir")}">${icon("expand")}</button></div></div>
    <div class="chart-wrap" id="chart"></div>
    <div class="legend"><span><i style="background:var(--soft)"></i>3e · 97e</span><span><i style="background:var(--soft);opacity:.6"></i>15e · 85e</span><span><i style="background:var(--muted)"></i>50e</span><span><i style="background:var(--kid);height:8px;width:8px;border-radius:50%"></i>${esc(c.nick||c.name)}</span></div><p class="tiny muted" style="margin:0">${T("Glissez pour déplacer · pincez pour zoomer · touchez un point pour voir la mesure")}</p>
    <details class="lex"><summary class="small">${T("Lexique")}</summary><ul class="small"><li>${T("<b>P</b> = percentile : P75 veut dire que 75 % des enfants du même âge et du même sexe ont une valeur plus basse.")}</li><li>${T("<b>50e</b> = médiane ; la zone colorée va du 15e au 85e percentile ; les lignes pleines extérieures sont le 3e et le 97e.")}</li><li>${T("<b>z</b> = écart-type par rapport à la médiane (0 = médiane ; ±1,88 = 3e / 97e percentile).")}</li><li>${T("<b>IMC</b> = indice de masse corporelle (poids ÷ taille²). <b>PC</b> = périmètre crânien.")}</li><li>${T("Ce qui compte surtout : que la courbe suive son couloir dans le temps.")}</li></ul></details>
    ${alerts.map(a => a.out ? `<div class="banner warn">${icon("info")}<div>${a.last.z<0?T("La dernière mesure est sous le 3e percentile."):T("La dernière mesure est au-dessus du 97e percentile.")} ${T("Ce n'est pas forcément anormal ; montrez la courbe au médecin.")}</div></div>`
      : `<div class="banner warn">${icon("info")}<div><b>${T("Changement de couloir.")}</b> ${T("Depuis le {d}, la courbe a franchi {n} lignes de percentiles. À montrer au médecin à la prochaine visite.",{d:fmtD(a.from.date), n:a.n})}</div></div>`).join("")}
  </div>`;
  AFTER.push(() => { drawChart(c, "#chart"); bindChartPan("#chart", c); });
  h += `<div class="grid">`;
  if (vel) { const slow = m > 36 && m < 120 && vel.v < 4; h += `<div class="card c6"><span class="eyebrow">${T("Vitesse de croissance")}</span><div class="stat"><div class="v num">${fmtNum(vel.v,1)}<small>${T("cm / an")}</small></div><span class="small muted">${fmtD(vel.from.date)} → ${fmtD(vel.to.date)}</span></div>${slow?`<div class="banner warn">${icon("info")}<div>${T("Moins de 4 cm par an entre 3 ans et la puberté : à vérifier avec le médecin.")}</div></div>`:`<p class="small muted">${T("Repère : environ 25 cm la 1re année, 12 cm la 2e, puis 5 à 7 cm par an jusqu'à la puberté.")}</p>`}</div>`; }
  if (mp) h += `<div class="card c6"><span class="eyebrow">${T("Taille cible parentale")}</span><div class="stat"><div class="v num">${fmtNum(mp.t,0)}<small>cm</small></div><span class="small muted">${T("Intervalle habituel {a} à {b} cm",{a:fmtNum(mp.lo,0), b:fmtNum(mp.hi,0)})}</span></div></div>`;
  h += `</div>`;
  if (mod(c,"projection")){ h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Modèle prédictif")}</span><h2>${T("Projection de la taille adulte")}</h2></div></div><div id="proj"></div></div>`; AFTER.push(() => drawProjection(c)); }
  h += `<div class="card"><div class="card-h"><h2>${T("Historique des mesures")}</h2></div>`;
  if (!c.growth.length) h += empty("chart", T("Ajoutez une première mesure."));
  else h += `<div class="list">${G.map(g => {
    const am = effAge(c, parseD(g.date)), b = bmiOf(g);
    const chip = (key, v, dp) => { if (!v) return ""; const z = zScore(key, c.sex, am, v); return `<span class="gchip"><small>${T(MEAS[key].label)}</small><b>${fmtNum(cvM(key,v),dpM(key,dp))} ${muM(key)}</b>${z!=null?`<em>P${pctLabel(z)}</em>`:""}</span>`; };
    return `<div class="li" data-growth-row="${g.id}" ${isKidUser()?"":`data-act="growthForm" data-v="${g.id}" style="cursor:pointer"`}><div class="grow"><div class="li-title">${fmtD(g.date)} <span class="small muted">· ${ageLabel(ageMonths(c, parseD(g.date)))}</span></div><div class="gchips">${chip("weight",Number(g.weight),2)}${chip("height",Number(g.height),1)}${mod(c,"ofc")?chip("ofc",Number(g.ofc),1):""}${chip("bmi",b,1)}</div></div>${isKidUser()?"":icon("edit").replace("<svg",'<svg style="width:18px;height:18px;color:var(--soft)"')}</div>`; }).join("")}</div>`;
  return h + `<p class="tiny muted">${T("Normes OMS de croissance (0-5 ans) et référence OMS 2007 (5-19 ans), recommandées au Canada.")}</p></div>`;
}
function ranges(k){
  const r = [{id:"0-2", a:0, b:24, l:T("0-2 ans")}, {id:"2-5", a:24, b:60, l:T("2-5 ans")}];
  if (k === "weight") r.push({id:"5-10", a:60, b:120, l:T("5-10 ans")});
  if (k === "height" || k === "bmi") r.push({id:"5-19", a:60, b:228, l:T("5-19 ans")});
  return r;
}
const niceStep = v => { const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v/e; return (f<1.5?1:f<3.5?2:f<7.5?5:10)*e; };
function chartRange(c){
  const k = UI.sub.courbes, rs = ranges(k), am = effAge(c, today(), UI.chrono);
  const R0 = rs.find(r => r.id === UI.range) || rs.find(r => am < r.b) || rs[rs.length-1];
  const max = LMS[k][c.sex==="M"?"M":"F"].slice(-1)[0][0];
  return { rs, R0, R: UI.zoom ? {a:clamp(UI.zoom.a,0,max-1), b:clamp(UI.zoom.b,1,max)} : {a:R0.a, b:R0.b}, max };
}
function drawChart(c, sel, big=false){
  const el = $(sel); if (!el) return;
  const k = UI.sub.courbes, {rs, R0, R} = chartRange(c);
  if ($("#rangeSeg")) $("#rangeSeg").innerHTML = rs.map(r => `<button data-act="range" data-v="${r.id}" aria-pressed="${!UI.zoom && r.id===R0.id}">${r.l}</button>`).join("");
  const pts = growthPoints(c, k, UI.chrono).filter(p => p.m >= R.a - 0.01 && p.m <= R.b + 0.01);
  const narrow = window.innerWidth < 600, W = narrow ? 470 : 720, H = big ? (narrow && window.innerHeight > window.innerWidth ? 600 : 460) : (narrow ? 340 : 380), P = {l:46, r:44, t:18, b:34}, span = R.b - R.a, step = span <= 12 ? 0.25 : span <= 30 ? 0.5 : 1;
  const curves = PCT_LINES.map(L => { const arr=[]; for (let m=R.a; m<=R.b+1e-9; m+=step){ const p = lmsAt(k, c.sex, m); if (p) arr.push([m, xAtZ(p, L.z)]); } return {...L, arr}; });
  let lo = Infinity, hi = -Infinity;
  curves.forEach(cv => cv.arr.forEach(([,y]) => { lo = Math.min(lo,y); hi = Math.max(hi,y); }));
  pts.forEach(p => { lo = Math.min(lo,p.x); hi = Math.max(hi,p.x); });
  if (!isFinite(lo)) { el.innerHTML = ""; return; }
  const ys = niceStep((hi-lo)*1.12/6); lo = Math.max(0, Math.floor((lo-(hi-lo)*.06)/ys)*ys); hi = Math.ceil((hi+(hi-lo)*.06)/ys)*ys;
  const X = m => P.l + (m-R.a)/span*(W-P.l-P.r), Y = v => H-P.b - (v-lo)/(hi-lo)*(H-P.t-P.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T(MEAS[k].label)}" style="font-family:var(--body)">`;
  for (let v=lo; v<=hi+1e-9; v+=ys) s += `<line x1="${P.l}" x2="${W-P.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${P.l-8}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${fmtNum(cvM(k, v), (ys<1 || cvM(k,1)!==1)?1:0)}</text>`;
  const xs = span <= 6 ? 1 : span <= 24 ? 3 : span <= 36 ? 6 : 12;
  for (let m=Math.ceil(R.a/xs)*xs; m<=R.b; m+=xs) s += `<line x1="${X(m)}" x2="${X(m)}" y1="${P.t}" y2="${H-P.b}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${X(m)}" y="${H-P.b+18}" text-anchor="middle" font-size="11" fill="var(--muted)">${R.b<=30?m+" "+T("m"):fmtNum(m/12, m%12?1:0)+" "+T("a")}</text>`;
  const c15 = curves[1].arr, c85 = curves[3].arr;
  s += `<path d="M${c15.map(([m,v])=>`${X(m)},${Y(v)}`).join("L")}L${c85.slice().reverse().map(([m,v])=>`${X(m)},${Y(v)}`).join("L")}Z" fill="var(--kid-bg)"/>`;
  curves.forEach(cv => { const main = cv.p === 50, outer = cv.p === 3 || cv.p === 97;
    s += `<path d="M${cv.arr.map(([m,v])=>`${X(m).toFixed(1)},${Y(v).toFixed(1)}`).join("L")}" fill="none" stroke="${main?"var(--muted)":"var(--soft)"}" stroke-width="${main?2:outer?1.5:1.2}" ${outer||main?"":'stroke-dasharray="5 4"'}/>`;
    const last = cv.arr[cv.arr.length-1]; s += `<text x="${W-P.r+6}" y="${Y(last[1])+4}" font-size="11" fill="var(--muted)" font-weight="${main?700:500}">${cv.p}e</text>`; });
  if (pts.length){
    s += `<path d="M${pts.map(p=>`${X(p.m).toFixed(1)},${Y(p.x).toFixed(1)}`).join("L")}" fill="none" stroke="var(--kid-ink)" stroke-width="2.5" stroke-linejoin="round"/>`;
    pts.forEach((p,i) => { const last = i === pts.length-1;
      s += `<circle cx="${X(p.m)}" cy="${Y(p.x)}" r="16" fill="transparent" data-gid="${p.id}" style="cursor:pointer"/><circle cx="${X(p.m)}" cy="${Y(p.x)}" r="${last?7:5}" fill="var(--kid)" stroke="var(--surface)" stroke-width="2.5" pointer-events="none"><title>${fmtD(p.date)} · ${fmtNum(cvM(k,p.x), dpM(k,MEAS[k].dp))} ${muM(k)}${p.z!=null?` · P${pctLabel(p.z)}`:""}</title></circle>`;
      if (last || big) s += `<text x="${Math.min(X(p.m)+10, W-P.r-70)}" y="${Y(p.x)-12}" font-size="${big?11:12}" font-weight="700" fill="var(--kid-ink)">${fmtNum(cvM(k,p.x), dpM(k,MEAS[k].dp))}${p.z!=null?` · P${pctLabel(p.z)}`:""}</text>`; });
  } else s += `<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="14" fill="var(--muted)">${T("Aucune mesure dans cette période")}</text>`;
  el.innerHTML = s + `<text x="${P.l}" y="${P.t-6}" font-size="11" fill="var(--muted)">${muM(k)}</text></svg>`;
}
/* glisser pour déplacer, pincer (ou molette) pour zoomer */
function bindChartPan(sel, c){
  const el = $(sel); if (!el) return;
  const pts = new Map(); let start = null, pinch = null;
  const cur = () => { const {R} = chartRange(c); return {...R}; };
  const apply = z => { const {max} = chartRange(c); const w = Math.max(1, Math.min(max, z.b - z.a)); let a = clamp(z.a, 0, max - w); UI.zoom = {a, b:a + w}; drawChart(c, sel, sel !== "#chart"); };
  const dist = () => { const [p, q] = [...pts.values()]; return Math.hypot(p.x - q.x, p.y - q.y) || 1; };
  el.addEventListener("pointerdown", e => { pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); el.setPointerCapture?.(e.pointerId);
    if (pts.size === 2){ const r = el.getBoundingClientRect(), [p, q] = [...pts.values()]; pinch = {d:dist(), z:cur(), f:((p.x + q.x)/2 - r.left)/r.width}; start = null; }
    else if (pts.size === 1) start = {x:e.clientX, z:cur(), w:el.clientWidth}; });
  el.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (pinch && pts.size >= 2){ const k = pinch.d / dist(), span = (pinch.z.b - pinch.z.a) * k, anchor = pinch.z.a + (pinch.z.b - pinch.z.a) * pinch.f; apply({a:anchor - span*pinch.f, b:anchor + span*(1-pinch.f)}); return; }
    if (!start) return; const dx = e.clientX - start.x; if (Math.abs(dx) < 6) return; const span = start.z.b - start.z.a; apply({a:start.z.a - dx/start.w*span, b:start.z.b - dx/start.w*span}); });
  let down = null; el.addEventListener("pointerdown", e => { down = {x:e.clientX, y:e.clientY, t:Date.now(), id:e.target.closest?.("[data-gid]")?.dataset.gid}; }, true);
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) start = null;
    if (down?.id && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && Date.now() - down.t < 600){ const gid = down.id; down = null; growthJump(gid); } };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", e => { e.preventDefault(); const z = cur(), mid = (z.a+z.b)/2, half = (z.b-z.a)/2 * (e.deltaY > 0 ? 1.2 : 0.83); apply({a:mid-half, b:mid+half}); }, {passive:false});
}
/* toucher un point de la courbe : aller à cette mesure dans l'historique */
function growthJump(gid){
  if ($("#layer .sheet")) closeSheet();
  const row = $(`[data-growth-row="${gid}"]`); if (!row) return growthForm(gid);
  row.scrollIntoView({behavior:"smooth", block:"center"}); row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash");
}
function drawProjection(c){
  const el = $("#proj"); if (!el) return;
  const pj = heightProjection(c);
  if (!pj){ el.innerHTML = `<p class="small muted">${T("Ajoutez au moins une mesure de taille pour voir la projection.")}</p>`; return; }
  const W = 720, H = 360, P = {l:46, r:64, t:18, b:34};
  const ref = [-1.8808, 0, 1.8808].map(z => { const arr=[]; for (let m=0; m<=228; m+=2){ const p = lmsAt("height", c.sex, m); if (p) arr.push([m, xAtZ(p, z)]); } return arr; });
  const lo = 40, hi = Math.ceil(Math.max(ref[2][ref[2].length-1][1], pj.hi, pj.mp?pj.mp.hi:0)/10)*10 + 5;
  const X = m => P.l + m/228*(W-P.l-P.r), Y = v => H-P.b - (v-lo)/(hi-lo)*(H-P.t-P.b);
  const pts = growthPoints(c, "height");
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T("Projection de la taille adulte")}" style="font-family:var(--body)">`;
  for (let v=50; v<=hi; v+=20) s += `<line x1="${P.l}" x2="${W-P.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${P.l-8}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`;
  for (let m=0; m<=228; m+=24) s += `<text x="${X(m)}" y="${H-P.b+18}" text-anchor="middle" font-size="11" fill="var(--muted)">${m/12} ${T("a")}</text>`;
  ref.forEach((arr,i) => s += `<path d="M${arr.map(([m,v])=>`${X(m).toFixed(1)},${Y(v).toFixed(1)}`).join("L")}" fill="none" stroke="${i===1?"var(--muted)":"var(--soft)"}" stroke-width="${i===1?1.6:1.2}"/>`);
  s += `<path d="M${pj.curve.map(p=>`${X(p.m).toFixed(1)},${Y(p.lo).toFixed(1)}`).join("L")}L${pj.curve.slice().reverse().map(p=>`${X(p.m).toFixed(1)},${Y(p.hi).toFixed(1)}`).join("L")}Z" fill="var(--kid)" opacity=".22"/>`;
  s += `<path d="M${X(pj.last.m)},${Y(pj.last.x)}L${pj.curve.map(p=>`${X(p.m).toFixed(1)},${Y(p.x).toFixed(1)}`).join("L")}" fill="none" stroke="var(--kid-ink)" stroke-width="2" stroke-dasharray="6 5"/>`;
  if (pj.comb != null) s += `<path d="M${X(pj.last.m)},${Y(pj.last.x)}L${pj.curve.map(p=>`${X(p.m).toFixed(1)},${Y(p.comb).toFixed(1)}`).join("L")}" fill="none" stroke="var(--lilac-ink)" stroke-width="2" stroke-dasharray="2 4"/>`;
  if (pj.mp) s += `<rect x="${W-P.r+8}" y="${Y(pj.mp.hi)}" width="10" height="${Y(pj.mp.lo)-Y(pj.mp.hi)}" rx="5" fill="var(--lilac)" opacity=".7"/><circle cx="${W-P.r+13}" cy="${Y(pj.mp.t)}" r="5" fill="var(--lilac-ink)"/><text x="${W-P.r+24}" y="${Y(pj.mp.t)+4}" font-size="11" fill="var(--lilac-ink)" font-weight="700">${T("cible")}</text>`;
  s += `<path d="M${pts.map(p=>`${X(p.m).toFixed(1)},${Y(p.x).toFixed(1)}`).join("L")}" fill="none" stroke="var(--kid-ink)" stroke-width="2.5"/>`;
  pts.forEach(p => s += `<circle cx="${X(p.m)}" cy="${Y(p.x)}" r="4.5" fill="var(--kid)" stroke="var(--surface)" stroke-width="2"/>`);
  s += `<circle cx="${X(228)}" cy="${Y(pj.adult)}" r="6" fill="var(--kid-ink)"/><text x="${X(228)-8}" y="${Y(pj.adult)-10}" text-anchor="end" font-size="12" font-weight="700" fill="var(--kid-ink)">${fmtNum(pj.adult,0)} cm</text></svg>`;
  el.innerHTML = `<div class="stats"><div class="stat"><span class="muted tiny">${T("S'il garde son couloir (P{p})",{p:pctLabel(pj.last.z)})}</span><div class="v num">${fmtNum(pj.adult,0)}<small>cm</small></div><span class="small muted">${T("80 % de chances entre {a} et {b} cm",{a:fmtNum(pj.lo,0), b:fmtNum(pj.hi,0)})}</span></div>
    ${pj.mp?`<div class="stat"><span class="muted tiny">${T("Taille cible parentale")}</span><div class="v num">${fmtNum(pj.mp.t,0)}<small>cm</small></div><span class="small muted">± 8,5 cm</span></div>`:`<div class="stat"><span class="muted tiny">${T("Taille des parents")}</span><button class="btn sm ghost" data-act="kidForm" data-v="${c.id}">${T("Ajouter pour affiner")}</button></div>`}
    ${pj.comb!=null?`<div class="stat"><span class="muted tiny">${T("Estimation combinée")}</span><div class="v num" style="color:var(--lilac-ink)">${fmtNum(pj.comb,0)}<small>cm</small></div></div>`:""}</div>
    <div class="chart-wrap">${s}</div>
    <p class="tiny muted">${pj.last.m < 24 ? T("Avant 2 ans, la projection est peu fiable : les bébés changent souvent de couloir.")+" " : ""}${T("Modèle statistique simple fondé sur les courbes OMS et la taille des parents. La puberté peut modifier la trajectoire. Ce n'est pas une prédiction médicale.")}</p>`;
}
function growthForm(id){
  const c = child(), g = id ? c.growth.find(x => x.id === id) : null, v = (k, dp) => g && g[k] ? Math.round(cvM(k, Number(g[k])) * Math.pow(10, dp)) / Math.pow(10, dp) : "";
  sheet(`<form class="stack" data-form="growth" data-id="${g?.id||""}" style="gap:14px">${sheetHead(g ? T("Modifier la mesure") : T("Nouvelle mesure"))}
    ${fld("g-date",T("Date"),`<input class="inp" id="g-date" type="date" value="${g?.date||iso(today())}" required>`)}
    <div class="fgrid">${fld("g-w",`${T("Poids")} (${muM("weight")})`,`<input class="inp" id="g-w" type="number" inputmode="decimal" step="0.005" min="0.3" max="440" value="${v("weight",3)}">`)}${fld("g-h",`${T("Taille")} (${muM("height")})`,`<input class="inp" id="g-h" type="number" inputmode="decimal" step="0.1" min="9" max="230" value="${v("height",1)}">`)}${mod(c,"ofc")?fld("g-c",`${T("Périmètre crânien")} (${muM("ofc")})`,`<input class="inp" id="g-c" type="number" inputmode="decimal" step="0.1" min="7" max="65" value="${v("ofc",1)}">`):""}</div>
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${g?`<button type="button" class="btn danger" data-act="delGrowth" data-v="${g.id}">${icon("trash")}</button>`:""}</div></form>`);
}

/* ======== SANTÉ ======== */
function sante(c){
  const tabs = [];
  if (mod(c,"vaccines") && (!vaccinesDone(c) || c.modules?.vaccines === true)) tabs.push(["vaccins",T("Vaccins")]);
  tabs.push(["dossier",T("Dossier")]);
  if (mod(c,"teeth")) tabs.push(["dents",T("Dents")]);
  if (!tabs.some(t => t[0] === UI.sub.sante)) UI.sub.sante = tabs[0][0];
  let h = tabs.length > 1 ? `<div class="seg">${tabs.map(([id,l])=>`<button data-act="sub" data-v="${id}" aria-pressed="${UI.sub.sante===id}">${l}</button>`).join("")}</div>` : "";
  return h + ({vaccins, dossier, dents}[UI.sub.sante])(c);
}
function vaccins(c){
  const all = PIQ.flatMap(g => vaxStatus(c, g)), done = all.filter(d => d.st === "fait").length, total = all.filter(d => d.st !== "na").length;
  let h = `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Programme québécois d'immunisation")}</span><h2>${T("Carnet de vaccination")}</h2></div><span class="chip mint num">${done}/${total}</span></div>
  <div class="row"><a class="btn sm kid" href="https://portal3.clicsante.ca/" target="_blank" rel="noopener">${T("Rendez-vous · Clic Santé")}</a><a class="btn sm ghost" href="https://www.quebec.ca/sante/conseils-et-prevention/vaccination/programme-quebecois-d-immunisation" target="_blank" rel="noopener">${T("Calendrier officiel")}</a></div><div>`;
  PIQ.forEach(g => { const ds = vaxStatus(c, g);
    h += `<div class="vgroup"><div><div class="vage">${T(g.label)}</div><div class="tiny muted">${fmtD(ds[0].due,{month:"short",year:"numeric"})}</div></div><div>${g.note?`<p class="small muted" style="margin-bottom:6px">${T(g.note)}</p>`:""}
      ${ds.map(d => `<div class="vdose"><div class="grow"><div style="font-weight:700">${esc(d.name)}</div><div class="tiny muted">${esc(T(d.short))}${d.rec?` · ${fmtD(d.rec.date)}${d.rec.lot?` · ${T("lot")} ${esc(d.rec.lot)}`:""}${d.rec.site?` · ${esc(T(d.rec.site))}`:""}`:""}</div>${d.rec?.reactions?`<div class="tiny" style="color:var(--rose-ink)">${T("Réaction :")} ${esc(d.rec.reactions)}</div>`:""}</div>
        <span class="chip ${VSTAT[d.st][0]}">${T(VSTAT[d.st][1])}</span>${isKidUser()?"":`<button class="btn sm ${d.rec?"ghost":"line"}" data-act="vaxForm" data-v="${d.id}">${d.rec?T("Modifier"):T("Noter")}</button>`}</div>`).join("")}</div></div>`; });
  if ((c.vaxOther||[]).length) h += `<div class="vgroup"><div><div class="vage">${T("Autres vaccins")}</div></div><div>${c.vaxOther.map(v => `<div class="vdose"><div class="grow"><div style="font-weight:700">${esc(v.name)}</div><div class="tiny muted">${fmtD(v.date)}${v.lot?` · ${T("lot")} ${esc(v.lot)}`:""}</div></div><span class="chip mint">${T("Reçu")}</span></div>`).join("")}</div></div>`;
  return h + `</div>${isKidUser()?"":`<div class="row">${aiBtn("aiScan","carnet",T("Lire le carnet papier (IA)"),"camera")}</div>`}<p class="tiny muted">${T("Dates approximatives selon la date de naissance. En cas de retard, le CLSC établit le rattrapage selon les intervalles minimaux du PIQ.")}</p></div>`;
}
function vaxForm(doseId){
  const c = child(), g = PIQ.find(g => g.doses.some(d=>d.id===doseId)), d = g.doses.find(d=>d.id===doseId);
  const r = c.vaccines[doseId] || {date:iso(today()), lot:"", site:"", reactions:""};
  sheet(`<form class="stack" data-form="vax" data-id="${doseId}" style="gap:14px">${sheetHead(esc(d.name))}<p class="small muted">${T(g.label)} · ${esc(T(d.short))}</p>
    <div class="fgrid">${fld("v-date",T("Date"),`<input class="inp" id="v-date" type="date" value="${r.date}" required>`)}${fld("v-lot",T("Numéro de lot"),inp("v-lot",r.lot))}</div>
    <div class="field"><label>${T("Site")}</label>${pick("site",["Cuisse gauche","Cuisse droite","Bras gauche","Bras droit","Oral"],r.site||"")}</div>
    ${fld("v-re",T("Réactions observées"),inp("v-re",r.reactions,`placeholder="${T("Fièvre, rougeur…")}"`))}
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${c.vaccines[doseId]?`<button type="button" class="btn danger" data-act="delVax" data-v="${doseId}">${T("Retirer")}</button>`:""}</div></form>`);
}
function dossier(c){
  const f = (l,v) => `<div class="li"><div class="grow"><div class="tiny muted" style="font-weight:700">${l}</div><div class="li-title">${v?esc(v):'<span class="muted">—</span>'}</div></div></div>`;
  return `<div class="grid"><div class="card c6"><div class="card-h"><h2>${T("Dossier santé")}</h2>${isKidUser()?"":`<button class="btn sm ghost" data-act="kidForm" data-v="${c.id}">${icon("edit")}${T("Modifier")}</button>`}</div>
    ${c.allergies?`<div class="banner alert">${icon("alert")}<div><b>${T("Allergies :")}</b> ${esc(c.allergies)}</div></div>`:""}
    <div class="list">${f(T("Allergies"),c.allergies)}${f(T("Problèmes de santé"),c.conditions)}${f(T("Médicaments réguliers"),c.meds)}${f(T("Médecin ou IPS"),c.doctor)}${f(T("Pharmacie"),c.pharmacy)}${f(T("Naissance"),`${fmtD(c.dob)} · ${c.gaW} ${T("SA")} ${c.gaD||0} ${T("j")}`)}</div></div>
    <div class="card c6"><div class="card-h"><h2>${T("Rapport pour la visite")}</h2>${icon("doc")}</div><p class="small muted">${T("Un résumé clair pour le médecin ou l'IPS : croissance et percentiles, vaccins, développement, habitudes, fièvre et médicaments récents. En PDF, à partager ou à envoyer par courriel.")}</p><button class="btn kid" data-act="report">${T("Préparer le rapport")}</button>
      ${Cloud.canDrive?.() ? `<div class="sep"></div><p class="small muted">${T("Document « Suivi de {n} » dans Google Drive (dossier Tribe / Suivi), mis à jour automatiquement : croissance, vaccins, jalons, dents, habitudes par mois et notes.",{n:esc(c.nick||c.name)})}</p><div class="row" style="flex-wrap:wrap"><button class="btn sm ghost" data-act="driveSuiviNow" data-v="${c.id}">${icon("drive")}${T("Mettre à jour maintenant")}</button>${S.settings.driveSuivi?.[c.id]?.id ? `<a class="btn sm line" href="https://docs.google.com/document/d/${esc(S.settings.driveSuivi[c.id].id)}/edit" target="_blank" rel="noopener">${T("Ouvrir le document")}</a>` : ""}</div>` : ""}</div></div>`;
}
/* dents : schéma cliquable des deux arcades, dents de lait et permanentes, numérotation FDI */
function dents(c){
  c.teethLost = c.teethLost || {}; c.permTeeth = c.permTeeth || {};
  const m = ageMonths(c), perm = (UI.dentMode || (m >= 72 ? "perm" : "lait")) === "perm";
  const has = (id, sd) => !!(c.teeth[id] || c.teeth[id+sd]), lost = (id, sd) => !!c.teethLost[id+sd];
  const list = perm ? PERM_TEETH : TEETH, total = perm ? 32 : 20;
  const keyOf = (t, sd) => perm ? fdi(true, t.jaw, sd, t.k) : t.id + sd;
  const state = (t, sd) => perm ? (c.permTeeth[keyOf(t, sd)] ? "on" : "") : lost(t.id, sd) ? "lost" : has(t.id, sd) ? "on" : "";
  const n = list.reduce((s, t) => s + ["L","R"].filter(sd => state(t, sd) === "on").length, 0), nl = perm ? 0 : TEETH.reduce((s, t) => s + ["L","R"].filter(sd => lost(t.id, sd)).length, 0);
  const jaw = upper => {
    const L = list.filter(t => t.jaw === (upper ? "u" : "l")), cnt = L.length, cx = 180, cy = upper ? 150 : 20, rx = perm ? 152 : 140, ry = perm ? 124 : 118;
    const a0 = perm ? 0.09 : 0.17, st = perm ? 0.178 : 0.29; let g = "";
    L.forEach((t, i) => [-1, 1].forEach(side => {
      const ang = a0 + i * st, px = cx + side * Math.sin(ang) * rx, py = upper ? cy - Math.cos(ang) * ry : cy + Math.cos(ang) * ry;
      const sd = side < 0 ? "R" : "L", stt = state(t, sd), molar = perm ? t.k >= 6 : t.k >= 4;
      const w = perm ? (molar ? 24 : t.k >= 4 ? 19 : t.k === 3 ? 17 : 16) : (molar ? 30 : t.k === 3 ? 22 : 20), hh = perm ? (molar ? 24 : 22) : (molar ? 30 : 26);
      const fill = stt === "on" ? "var(--mint)" : stt === "lost" ? "var(--surface2)" : "var(--surface)", stroke = stt === "on" ? "var(--mint-ink)" : "var(--soft)";
      g += `<g class="t" tabindex="0" role="button" aria-pressed="${stt === "on"}" aria-label="${esc(T(t.n))} ${sd==="L"?T("gauche"):T("droite")} (${fdi(perm, t.jaw, sd, t.k)})" data-act="tooth" data-v="${perm ? "P" + keyOf(t, sd) : keyOf(t, sd)}"><path d="M${px-w/2} ${py-hh/2+6}q0-6 6-6h${w-12}q6 0 6 6v${hh-12}q0 6-${w/2} 8q-${w/2}-2-${w/2}-8z" fill="${fill}" stroke="${stroke}" stroke-width="2" ${stt==="lost"?'stroke-dasharray="3 3"':""}/><text x="${px}" y="${py+4}" text-anchor="middle" font-size="${perm?9:10}" font-weight="700" fill="${stt==="on"?"var(--mint-ink)":"var(--muted)"}" pointer-events="none">${fdi(perm, t.jaw, sd, t.k)}</text></g>`;
    }));
    return g;
  };
  const chip = (t, sd) => { const st = state(t, sd), lbl = `${fdi(perm, t.jaw, sd, t.k)}`; return st === "on" ? `<span class="chip mint">${lbl} ✓</span>` : st === "lost" ? `<span class="chip">${lbl} ${T("tombée")}</span>` : `<span class="chip muted-chip">${lbl}</span>`; };
  const rows = [...list].sort((a, b) => parseFloat(a.age) - parseFloat(b.age) || (a.jaw < b.jaw ? 1 : -1));
  return `<div class="card"><div class="seg"><button data-act="dentMode" data-v="lait" aria-pressed="${!perm}">${T("Dents de lait (20)")}</button><button data-act="dentMode" data-v="perm" aria-pressed="${perm}">${T("Dents permanentes (32)")}</button></div>
    <div class="card-h"><div><span class="eyebrow">${perm ? T("Dents permanentes") : T("Dents de lait")}</span><h2>${T("{n} dents sur {t}",{n, t:total})}${nl ? ` <small class="muted">· ${T("{n} tombée(s)",{n:nl})}</small>` : ""}</h2></div>${icon("tooth")}</div>
    <p class="small muted">${perm ? T("Touchez une dent quand elle sort.") : T("Touchez une dent : 1re fois = sortie, 2e fois = tombée, 3e fois = effacer.")} ${T("Vue de face : la gauche de l'enfant est à droite de l'écran. Numéros FDI, ceux qu'utilisent les dentistes.")}</p>
    <div class="jaw"><svg viewBox="0 0 360 330" aria-label="${T("Schéma des dents")}"><text x="180" y="18" text-anchor="middle" font-size="12" fill="var(--muted)" font-weight="700">${T("Haut")}</text><g transform="translate(0,30)">${jaw(true)}</g><text x="180" y="182" text-anchor="middle" font-size="12" fill="var(--muted)" font-weight="700">${T("Bas")}</text><g transform="translate(0,160)">${jaw(false)}</g></svg></div>
    <div class="list">${rows.map(t => `<div class="li"><div class="grow"><div class="li-title">${T(t.n)}</div><div class="small muted">${T("Sortie : {a}",{a:T(t.age)})}${t.lost ? ` · ${T("Chute : {a}",{a:T(t.lost)})}` : ""}</div></div><div class="row" style="gap:4px;flex-wrap:nowrap">${chip(t, "R")}${chip(t, "L")}</div></div>`).join("")}</div>
    <details class="lex"><summary class="small">${T("Lexique")}</summary><ul class="small"><li>${T("<b>Numéros FDI</b> : le 1er chiffre est le quadrant (lait : 5 haut droite, 6 haut gauche, 7 bas gauche, 8 bas droite ; permanentes : 1 à 4 dans le même ordre), le 2e la dent en partant du centre.")}</li><li>${T("Les premières molaires permanentes (16, 26, 36, 46) sortent vers 6 ans derrière les dents de lait, sans qu'aucune dent ne tombe.")}</li><li>${T("Les âges sont des moyennes : quelques mois d'écart sont normaux.")}</li></ul></details></div>
    <div class="card"><h3>${T("Conseils pour les dents")}</h3><ul class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">${TEETH_TIPS.map(t=>`<li>${T(t)}</li>`).join("")}</ul></div>`;
}
const AGIR_TOT = "https://www.quebec.ca/famille-et-soutien-aux-personnes/enfance/developpement-des-enfants/outils-ressources-developpement-enfants/programme-agir-tot-depister-tot-pour-mieux-repondre-aux-besoins-des-enfants";
function dev(c){
  const m = ageMonths(c), em = effAge(c);
  let h = "";
  if (mod(c,"older") && m >= 60){ const k = m >= 144 ? "ado" : "scol";
    h += `<div class="card"><div class="card-h"><h2>${k==="ado"?T("Adolescence : repères"):T("Âge scolaire : repères")}</h2></div><div class="list">${OLDER[k].map(o=>`<div class="li"><div class="grow"><div class="li-title">${T(o.t)}</div><p class="small muted">${T(o.d)}</p></div></div>`).join("")}</div></div>`; }
  if (!mod(c,"milestones")) return h;
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Jalons 0-6 ans")}</span><h2>${T("Développement")}</h2></div>
    <div class="seg"><button data-act="msMode" data-v="concis" aria-pressed="${UI.msMode==="concis"}">${T("Concis")}</button><button data-act="msMode" data-v="detail" aria-pressed="${UI.msMode==="detail"}">${T("Détaillé")}</button></div></div>
    <div class="banner ok">${icon("heart")}<div class="small">${T("Chaque enfant a son rythme. Les plages montrent l'âge où la plupart des enfants acquièrent une habileté : un enfant en fin de plage est tout à fait normal.")} ${usesCorrected(c)?`<b>${T("Âge corrigé utilisé : {a}",{a:ageLabel(em)})}</b>`:""}</div></div>
    ${domainSummary(c, em)}</div>`;
  const talk = MS.filter(it => msLevel(c, it, em).id === "parler");
  const band = UI.msBand || "auto";
  h += `<div class="card" style="padding:12px 14px"><span class="eyebrow">${T("Filtrer par âge")}</span><div class="pick chips-scroll" style="flex-wrap:nowrap;overflow-x:auto"><button data-act="msBand" data-v="auto" aria-pressed="${band==="auto"}">${T("Autour de maintenant")}</button>${BANDS.map(b => `<button data-act="msBand" data-v="${b}" aria-pressed="${String(band)===String(b)}">${bandLabel(b)}</button>`).join("")}<button data-act="msBand" data-v="all" aria-pressed="${band==="all"}">${T("Tous")}</button></div></div>`;
  h += UI.msMode === "detail" ? msDetail(c, em) : msConcise(c, em);
  h += `<div class="card"><h3>${T("Signes à surveiller à tout âge")}</h3><ul class="small" style="margin:0;padding-left:18px">${GENERAL_FLAGS.map(f=>`<li>${T(f)}</li>`).join("")}</ul></div>`;
  if (talk.length) h += `<div class="card mention-card"><div class="card-h"><h2>${icon("info")} ${T("À mentionner")}</h2><span class="chip rose">${talk.length}</span></div><p class="small">${T("À mentionner calmement à la prochaine visite")} ${T("(rien d'urgent ; souvent l'enfant y arrive peu après) :")}</p><div class="stack" style="gap:4px">${talk.map(it=>`<button class="tip-row" data-act="msOpen" data-v="${esc(it.k)}"><span class="tip-dot" style="background:var(--rose)"></span><span class="grow">${esc(T(it.t))}</span>${icon("right")}</button>`).join("")}</div><p class="tiny muted">${T("Touchez un élément : ce que ça veut dire, comment l'encourager, à qui en parler.")}</p></div>`;
  h += `<div class="card tint"><h3>${T("Une inquiétude ?")}</h3><p class="small">${T("Le programme Agir tôt offre dépistage et services aux 0-5 ans, sans attendre un diagnostic. Communiquez avec votre CLSC, ou demandez au médecin ou à l'éducatrice de vous y diriger.")}</p><a class="btn sm kid" style="align-self:flex-start" href="${AGIR_TOT}" target="_blank" rel="noopener">${T("Programme Agir tôt")}</a></div>`;
  return h;
}
function domainSummary(c, em){
  return `<div class="stack" style="gap:8px">${Object.entries(DOMAINS).map(([d,D]) => {
    const exp = MS.filter(it => it.d === d && it.b <= em), ok = exp.filter(it => c.milestones[it.k]).length, cur = MS.filter(it => it.d === d && it.a <= em && it.b > em).length;
    return `<div><div class="row between small"><b style="color:var(--${D.color}-ink)">${T(D.label)}</b><span class="muted num">${exp.length?T("{a}/{b} habituellement acquis",{a:ok,b:exp.length}):T("rien d'attendu encore")}${cur?` · ${T("{n} en cours",{n:cur})}`:""}</span></div><div class="dombar"><i style="width:${exp.length?(ok/exp.length*100).toFixed(0):100}%;background:var(--${D.color})"></i></div></div>`; }).join("")}</div>`;
}
function msRow(c, it, em){
  const on = !!c.milestones[it.k], L = msLevel(c, it, em);
  return `<div class="ms"><button class="check" role="checkbox" aria-checked="${on}" aria-label="${esc(T(it.t))}" data-act="ms" data-v="${esc(it.k)}">${on?icon("check"):""}</button><div class="grow"><div class="row between" style="gap:6px"><span class="dom" style="color:var(--${DOMAINS[it.d].color}-ink)">${T(DOMAINS[it.d].label)}</span>${L.id!=="tot"?`<span class="chip ${L.c}">${L.l}</span>`:""}</div><div>${esc(T(it.t))}</div>
    <div class="tiny muted">${on ? `${T("Observé le {d}",{d:fmtD(c.milestones[it.k])})} · ` : ""}${T("Habituellement")} ${rangeTxt(it)} · ${T("médiane")} ${mLabel(it.m50)}</div>${!on && (L.id==="obs"||L.id==="parler") ? `<div class="tiny" style="color:var(--${L.c}-ink)">${L.tip}</div>`:""}${msInfo(it)}</div></div>`;
}
/* détails d'un jalon (plages usuelles) */
const msInfo = it => `<details class="msinfo"><summary class="tiny">${T("Plages usuelles")}</summary><div class="tiny"><div>${T("La plupart des enfants (25e → 90e percentile) : {r}",{r:rangeTxt(it)})}</div><div>${T("Médiane (la moitié des enfants) : {m}",{m:mLabel(it.m50)})}</div>${it.al?`<div>${T("À mentionner au médecin si pas acquis vers {a}",{a:mLabel(it.al)})}</div>`:""}<div class="muted">${T(DOMAINS[it.d].label)}</div></div></details>`;
function msConcise(c, em){
  const cur = BANDS.find(b => b >= em) || 72, idx = BANDS.indexOf(cur), band = UI.msBand || "auto";
  const show = band === "all" || UI.msAll ? BANDS : band !== "auto" ? [+band] : BANDS.slice(Math.max(0, idx-1), idx+2);
  return show.map(b => { const items = MS.filter(it => bandOf(it) === b); if (!items.length) return "";
    const done = items.filter(it => c.milestones[it.k]).length;
    return `<div class="card" ${b===cur?'style="outline:2px solid var(--kid)"':""}><div class="card-h"><h2>${T("D'ici {a}",{a:bandLabel(b)})}</h2><div class="row">${b===cur?`<span class="chip peach">${T("Maintenant")}</span>`:""}<span class="chip mint num">${done}/${items.length}</span></div></div><div>${items.map(it => msRow(c,it,em)).join("")}</div></div>`; }).join("")
    + `<button class="btn ghost" data-act="msAll">${UI.msAll?T("Voir seulement autour de l'âge actuel"):T("Voir tous les âges (2 mois à 6 ans)")}</button>`;
}
function msDetail(c, em){
  const band = UI.msBand || "auto", all = band === "all" || UI.msAll;
  let items = all ? MS : band !== "auto" ? MS.filter(it => bandOf(it) === +band) : MS.filter(it => it.a <= em + 12 && it.b >= em - 10); if (!items.length) items = MS;
  const a0 = all ? 0 : Math.max(0, Math.floor(Math.min(...items.map(i=>i.a)))), b0 = all ? 72 : Math.ceil(Math.max(...items.map(i=>i.al||i.b), band === "auto" ? em + 2 : 0));
  const X = m => clamp((m - a0)/(b0 - a0)*100, 0, 100), step = (b0-a0) <= 18 ? 3 : (b0-a0) <= 36 ? 6 : 12;
  const ticks = []; for (let t = Math.ceil(a0/step)*step; t <= b0; t += step) ticks.push(t);
  const axis = `<div class="axis">${ticks.map(t=>`<span style="left:${X(t)}%">${t<24?t+" "+T("m"):t/12+" "+T("a")}</span>`).join("")}</div>`;
  return `<div class="legend"><span><i style="background:var(--ink);width:3px;height:14px"></i>${T("Âge actuel")}</span><span><i style="background:var(--mint)"></i>${T("Acquis")}</span><span><i style="background:var(--soft)"></i>${T("Plage habituelle (25e → 90e percentile)")}</span><span><i style="background:var(--surface);border:1px solid var(--soft);width:4px;height:12px"></i>${T("Médiane")}</span><span><i style="background:var(--rose);width:3px;height:14px"></i>${T("À mentionner si pas acquis")}</span></div>`
    + Object.entries(DOMAINS).map(([d,D]) => { const rows = items.filter(it => it.d === d).sort((a,b)=>a.a-b.a); if (!rows.length) return "";
      return `<div class="card"><div class="card-h"><h2 style="color:var(--${D.color}-ink)">${T(D.label)}</h2></div>${axis}
        ${rows.map(it => { const on = !!c.milestones[it.k], L = msLevel(c, it, em), col = on ? "var(--mint)" : L.id === "parler" ? "var(--rose)" : em >= it.a ? `var(--${D.color})` : "var(--soft)";
          return `<div class="tl-row"><button class="check" role="checkbox" aria-checked="${on}" aria-label="${esc(T(it.t))}" data-act="ms" data-v="${esc(it.k)}">${on?icon("check"):""}</button>
            <div style="min-width:0"><div class="row between" style="gap:6px"><span style="font-weight:600">${esc(T(it.t))}</span><span class="tiny muted num">${rangeTxt(it)}</span></div>
            <div class="track"><div class="bar" style="left:${X(it.a)}%;width:${Math.max(1.5, X(it.b)-X(it.a))}%;background:${col};opacity:${on?1:.75}"></div><div class="med" style="left:calc(${X(it.m50)}% - 1px)"></div>${it.al && it.al<=b0?`<div class="flag" style="left:calc(${X(it.al)}% - 1px)"></div>`:""}<div class="now" style="left:calc(${X(em)}% - 1px)"></div></div>
            ${on?`<div class="tiny muted">${T("Observé le {d}",{d:fmtD(c.milestones[it.k])})}</div>`:L.tip&&L.id!=="tot"?`<div class="tiny muted">${L.tip}</div>`:""}${msInfo(it)}</div></div>`; }).join("")}</div>`; }).join("")
    + `<button class="btn ghost" data-act="msAll">${UI.msAll?T("Voir seulement autour de l'âge actuel"):T("Voir toute la période 0-6 ans")}</button>
    <p class="tiny muted">${T("Motricité globale : fenêtres d'acquisition de l'OMS (2006). Autres sphères : plages inspirées du Denver II, du CDC et de la grille Rourke. Indicatif, ne remplace pas une évaluation.")}</p>`;
}
function msDateSheet(k){
  const c = child(), it = MS.find(x => x.k === k);
  sheet(`<form class="stack" data-form="msDate" data-k="${esc(k)}" style="gap:14px">${sheetHead(T("Jalon observé"))}<p><b>${esc(T(it.t))}</b></p>
    ${fld("ms-date",T("Observé le (vous pouvez choisir une date passée)"),`<input class="inp" id="ms-date" type="date" value="${iso(today())}" max="${iso(today())}" min="${c.dob}">`)}
    <button class="btn kid" type="submit">${T("Enregistrer")}</button></form>`);
}

/* ======== CONSEILS ======== */
function conseils(c){
  const m = isPrenatal(c) ? -1 : ageMonths(c), hidden = c.hideTips || [];
  const inAge = t => m >= t[1] && m < t[2];
  const order = m >= 144 ? ["parler","social","sport","emotions","puberte","sommeil","sante","ecrans","alim","ecole","secu","parents"] : Object.keys(TIPCAT);
  const cats = order.filter(k => ALL_TIPS.some(t => t[0]===k && inAge(t)));
  let h = `<div class="card"><div class="card-h"><div><span class="eyebrow">${isPrenatal(c)?T("Grossesse"):T("Pour {a}",{a:ageLabel(m)})}</span><h2>${T("Conseils")}</h2></div></div><p class="small muted">${T("Touchez une catégorie pour la masquer ou l'afficher.")}</p>
    <div class="row">${cats.map(k=>`<button class="chip ${TIPCAT[k][1]}" data-act="tipCat" data-v="${k}" aria-pressed="${!hidden.includes(k)}">${T(TIPCAT[k][0])}</button>`).join("")}</div></div>`;
  h += cats.filter(k => !hidden.includes(k)).map(k => `<div class="card"><h3 style="color:var(--${TIPCAT[k][1]}-ink)">${T(TIPCAT[k][0])}</h3><div class="stack" style="gap:6px">${ALL_TIPS.map((t, i) => ({t, i})).filter(({t}) => t[0]===k && inAge(t)).map(tipRow).join("")}</div></div>`).join("");
  const futur = TIPS.filter(t => t[1] > m && t[1] <= m + 12 && !hidden.includes(t[0]));
  if (futur.length) h += `<div class="card tint"><h3>${T("Pour les prochains mois")}</h3><div class="stack">${futur.slice(0,4).map(t=>`<div><span class="dom" style="color:var(--${TIPCAT[t[0]][1]}-ink)">${T(TIPCAT[t[0]][0])} · ${t[1] < 0 ? "" : T("dès {a}",{a:mLabel(t[1])})}</span><div><b>${T(t[3])}</b></div><p class="small">${T(t[4])}</p></div>`).join("")}</div></div>`;
  if (feat("ai") && allow("ai")) h += `<button class="btn ghost" data-act="ai" style="align-self:flex-start">${icon("spark")}${T("Poser une question à l'assistant")}</button>`;
  return h;
}

/* ======== GROSSESSE ======== */
function grossesse(c){
  const p = pregWeek(c), left = Math.max(0, Math.round((parseD(c.dueDate) - today())/DAY)), size = PREG_SIZE.filter(s => s[0] <= p.w).pop();
  const ck = c.prenatal.checks || {};
  let h = `<div class="card"><div class="stats"><div class="stat"><span class="muted tiny">${T("Semaine de grossesse")}</span><div class="v">${p.w}<small>+${p.d} ${T("j")}</small></div></div><div class="stat"><span class="muted tiny">${T("Jours avant la date prévue")}</span><div class="v">${left}</div></div><div class="stat"><span class="muted tiny">${T("Trimestre")}</span><div class="v">${p.w < 14 ? 1 : p.w < 28 ? 2 : 3}</div></div></div>
    <div class="dombar" style="height:12px"><i style="width:${clamp(p.days/280*100,0,100).toFixed(0)}%;background:var(--rose)"></i></div>
    ${size?`<p class="small">${T("Bébé a environ la taille d'{s}.",{s:T(size[1])})}</p>`:""}
    ${isKidUser()?"":`<button class="btn kid" data-act="bornForm">${icon("baby")}${T("Bébé est né !")}</button>`}</div>`;
  h += `<div class="card"><div class="card-h"><h2>${T("À prévoir")}</h2><span class="tiny muted">${T("selon les semaines")}</span></div>${PREG_CHECK.map((x,i) => { const on = !!ck[i], late = !on && p.w > x.w + 2;
    return `<div class="ms"><button class="check" role="checkbox" aria-checked="${on}" data-act="pregCheck" data-v="${i}" aria-label="${esc(T(x.t))}">${on?icon("check"):""}</button><div class="grow"><div>${T(x.t)}</div><div class="tiny muted">${T("vers {w} semaines",{w:x.w})}${on?` · ${T("fait le {d}",{d:fmtD(ck[i])})}`:""}</div></div>${late?`<span class="chip butter">${T("à vérifier")}</span>`:p.w >= x.w - 2 && !on?`<span class="chip sky">${T("bientôt")}</span>`:""}</div>`; }).join("")}</div>`;
  h += `<div class="card"><div class="card-h"><h2>${T("Idées de prénoms")}</h2></div><form class="row" data-form="babyName">${inp("bn","", `placeholder="${T("Ajouter un prénom")}"`)}<button class="btn ghost" type="submit">${icon("plus")}</button></form>
    <div class="row">${(c.prenatal.names||[]).map((n,i)=>`<span class="chip rose">${esc(n)} <button class="icon-btn flat" style="width:20px;height:20px" data-act="rmName" data-v="${i}" aria-label="${T("Retirer")}">${icon("x")}</button></span>`).join("") || `<span class="small muted">${T("Aucune idée pour l'instant.")}</span>`}</div></div>`;
  return h;
}
function bornForm(){
  const c = child();
  sheet(`<form class="stack" data-form="born" style="gap:14px">${sheetHead(T("Bienvenue, bébé !"))}
    ${fld("b-name",T("Prénom"),inp("b-name",c.name,"required"))}
    ${fld("b-dob",T("Date de naissance"),`<input class="inp" id="b-dob" type="date" value="${iso(today())}" max="${iso(today())}" required>`)}
    <div class="field"><label>${T("Sexe biologique")}</label>${radios("bsex",[["F",T("Fille")],["M",T("Garçon")]],c.sex||"F")}</div>
    <div class="fgrid">${fld("b-w",T("Poids (kg)"),`<input class="inp" id="b-w" type="number" inputmode="decimal" step="0.005">`)}${fld("b-h",T("Taille (cm)"),`<input class="inp" id="b-h" type="number" inputmode="decimal" step="0.1">`)}${fld("b-c",T("Périmètre crânien (cm)"),`<input class="inp" id="b-c" type="number" inputmode="decimal" step="0.1">`)}</div>
    <p class="tiny muted">${T("L'âge gestationnel est calculé à partir de la date prévue ; vous pourrez le corriger dans le profil.")}</p>
    <button class="btn kid" type="submit">${T("Enregistrer la naissance")}</button></form>`);
}
