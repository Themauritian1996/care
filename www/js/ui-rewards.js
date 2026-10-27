/* =========================================================================
   TRIBE — défis et récompenses (système d'émulation)
   - chacun gagne des points (défis solo ou en équipe) et les dépense
   - un parent peut échanger au nom d'un enfant qui n'a pas de téléphone
   - mode enfant sur l'appareil d'un parent : on choisit « c'est qui ? »
   - équipe : objectifs communs où plusieurs enfants mettent leurs points
     ensemble, et dons de points entre membres
   - historique : calendrier du mois et liste des gains et dépenses
   Les dépenses, contributions et dons sont des documents « redemptions »
   (kind : reward | team | gift), donc synchronisés et permis aux enfants.
   ========================================================================= */
const rKind = x => x.kind || "reward";
/* qui utilise l'app en ce moment (en mode enfant : l'enfant choisi) */
const actor = () => (S.settings.parental.kidMode && member(S.settings.parental.kidAs)) || me();
const players = () => S.family.members.filter(m => S.tasks.some(t => (t.assignees||[]).includes(m.id)) || S.completions.some(c => c.memberId === m.id) || m.role === "enfant");
function pointsOf(mid){
  const ok = S.completions.filter(x => x.memberId === mid && x.status === "ok");
  const earned = sum(ok.map(x => x.points));
  const spent = sum(S.redemptions.filter(x => x.memberId === mid && x.status !== "refuse").map(x => x.cost));
  const received = sum(S.redemptions.filter(x => rKind(x) === "gift" && x.toId === mid && x.status !== "refuse").map(x => x.cost));
  const weekStart = iso(addDays(today(), -((today().getDay()+6)%7)));
  const week = sum(ok.filter(x => x.date >= weekStart).map(x => x.points));
  return {earned, spent, received, balance: earned + received - spent, week};
}
const teamTotal = r => sum(S.redemptions.filter(x => rKind(x) === "team" && x.rewardId === r.id && x.status !== "refuse").map(x => x.cost));
/* journal chronologique d'un membre (ou de tous) */
function pointsLog(mid){
  const L = [];
  S.completions.filter(x => (!mid || x.memberId === mid) && x.status !== "refuse").forEach(x => { const t = S.tasks.find(y => y.id === x.taskId);
    if (x.goal){ L.push({date:x.date, at:x.at||0, who:x.memberId, pts:0, amt:+x.amt||0, unit:t?.unit||"", kind:"goal", title:T("Objectif : {t}",{t:t?.title || "?"}), ic:t?.icon||"target"}); return; }
    L.push({date:x.date, at:x.at||0, who:x.memberId, pts:x.points, kind:"gain", bonus:!!x.bonus, goalDone:!!x.goalDone, pending:x.status === "pending", title:x.bonus ? T("Bonus : {b}",{b:T(BADGES.find(b => b.k === x.bonus)?.t || "")}) : x.goalDone ? T("Objectif atteint : {t}",{t:t?.title || "?"}) : t?.title || T("Défi"), team:!!x.team, ic:x.bonus ? "gift" : x.goalDone ? "trophy" : t?.icon||"star"}); });
  S.redemptions.filter(x => x.status !== "refuse").forEach(x => { const r = S.rewards.find(y => y.id === x.rewardId), k = rKind(x);
    if (k === "gift"){ if (!mid || x.memberId === mid) L.push({date:x.date, at:x.at||0, who:x.memberId, pts:-x.cost, kind:"gift-out", title:T("Don à {n}",{n:member(x.toId)?.name||"?"}), ic:"heart"});
      if (!mid || x.toId === mid) L.push({date:x.date, at:x.at||0, who:x.toId, pts:x.cost, kind:"gift-in", title:T("Cadeau de {n}",{n:member(x.memberId)?.name||"?"}), ic:"heart"}); return; }
    if (mid && x.memberId !== mid) return;
    L.push({date:x.date, at:x.at||0, who:x.memberId, pts:-x.cost, kind:k === "team" ? "team" : "spend", pending:x.status === "pending", title:k === "team" ? T("Mis dans « {r} »",{r:r?.title||"?"}) : (r?.title || T("Récompense")), ic:k === "team" ? "people" : "gift"}); });
  return L.sort((a,b) => a.date === b.date ? b.at - a.at : (a.date < b.date ? 1 : -1));
}

/* points personnalisables, niveaux avec titres, badges d'assiduité */
const ptsIc = () => S.settings.pts?.emoji || "⭐";
const LEVEL_TITLES = [
  {e:"🌱", t:"Petite pousse"}, {e:"🧭", t:"Explorateur"}, {e:"🎒", t:"Aventurier"}, {e:"🛠️", t:"Débrouillard"}, {e:"🏅", t:"Champion"},
  {e:"🦸", t:"Héros du quotidien"}, {e:"⚓", t:"Capitaine"}, {e:"🦉", t:"Sage"}, {e:"🌟", t:"Légende"}, {e:"👑", t:"Grand chef de la tribu"}];
const BADGES = [
  {k:"first", e:"🎈", t:"Premier défi", d:"Réussir un premier défi"},
  {k:"s3", e:"🔥", t:"En feu", d:"Au moins un défi 3 jours de suite"},
  {k:"s7", e:"📅", t:"Assidu", d:"Au moins un défi 7 jours de suite"},
  {k:"s14", e:"🚀", t:"Inarrêtable", d:"Au moins un défi 14 jours de suite"},
  {k:"s30", e:"🏆", t:"Marathonien", d:"Au moins un défi 30 jours de suite"},
  {k:"c10", e:"✅", t:"Bon départ", d:"10 défis réussis"},
  {k:"c50", e:"💪", t:"Pro des défis", d:"50 défis réussis"},
  {k:"c100", e:"💯", t:"Centurion", d:"100 défis réussis"},
  {k:"week", e:"⚡", t:"Super semaine", d:"100 points ou plus en une semaine"},
  {k:"team", e:"🤝", t:"Esprit d'équipe", d:"Un défi d'équipe ou des points mis dans un objectif commun"},
  {k:"gift", e:"💝", t:"Cœur généreux", d:"Offrir des points à quelqu'un"},
  {k:"l5", e:"🏅", t:"Niveau 5", d:"Atteindre le niveau 5"},
  {k:"l10", e:"👑", t:"Sommet", d:"Atteindre le niveau 10"}];
/* bonus de points quand un badge est gagné ; les séries rapportent à chaque fois qu'une série atteint le seuil */
const DEF_BONUS = {first:2, s3:5, s7:10, s14:15, s30:30, c10:10, c50:25, c100:50, week:10, team:5, gift:5, l5:20, l10:50};
const bonusOf = k => { const v = S.settings.bonus?.[k]; return v == null ? DEF_BONUS[k] : +v || 0; };
function streakRuns(days){ const runs = []; let cur = null, prev = null; days.forEach(d => { if (prev && (parseD(d) - parseD(prev)) / DAY < 1.5) cur.len++; else { cur = {start:d, len:1}; runs.push(cur); } prev = d; }); return runs; }
function awardBonuses(){
  if (isKidUser() || S.settings.bonusOff) return 0; let n = 0; const has = id => S.completions.some(x => x.id === id), td = iso(today());
  const give = (mid, k, key) => { const pts = bonusOf(k), id = `bn_${mid}_${k}_${key}`; if (pts <= 0 || has(id)) return; S.completions.push({id, taskId:null, memberId:mid, points:pts, status:"ok", date:td, at:Date.now(), bonus:k}); n++; };
  players().forEach(m => { const ok = S.completions.filter(x => x.memberId === m.id && x.status === "ok" && !x.bonus && !x.goal), days = [...new Set(ok.map(x => x.date))].sort();
    streakRuns(days).forEach(r => [["s3",3],["s7",7],["s14",14],["s30",30]].forEach(([k, len]) => { if (r.len >= len) give(m.id, k, r.start); }));
    [["first",1],["c10",10],["c50",50],["c100",100]].forEach(([k, c]) => { if (ok.length >= c) give(m.id, k, "1"); });
    const wk = {}; ok.forEach(x => { const d = parseD(x.date), k = iso(addDays(d, -((d.getDay()+6)%7))); wk[k] = (wk[k]||0) + (x.points||0); }); Object.entries(wk).forEach(([k, v]) => { if (v >= 100) give(m.id, "week", k); });
    const b = badgesOf(m.id); ["team","gift","l5","l10"].forEach(k => { if (b.find(x => x.k === k)?.got) give(m.id, k, "1"); }); });
  return n;
}
function badgesOf(mid){
  const ok = S.completions.filter(x => x.memberId === mid && x.status === "ok" && !x.bonus && !x.goal), days = [...new Set(ok.map(x => x.date))].sort();
  let best = 0, run = 0, prev = null; days.forEach(d => { run = prev && (parseD(d) - parseD(prev)) / DAY < 1.5 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  const wk = {}; ok.forEach(x => { const d = parseD(x.date), k = iso(addDays(d, -((d.getDay()+6)%7))); wk[k] = (wk[k]||0) + (x.points||0); });
  const lvl = levelOf(pointsOf(mid).earned).lvl, n = ok.length;
  const team = ok.some(x => x.team) || S.redemptions.some(x => rKind(x) === "team" && x.memberId === mid && x.status !== "refuse"), gift = S.redemptions.some(x => rKind(x) === "gift" && x.memberId === mid && x.status !== "refuse");
  const got = {first:n >= 1, s3:best >= 3, s7:best >= 7, s14:best >= 14, s30:best >= 30, c10:n >= 10, c50:n >= 50, c100:n >= 100, week:Object.values(wk).some(v => v >= 100), team, gift, l5:lvl >= 5, l10:lvl >= 10};
  return BADGES.map(b => ({...b, got:!!got[b.k], streak:best, bonus:bonusOf(b.k)}));
}
function levelsLegend(people){
  return `<div class="stack" style="gap:10px;margin-top:10px"><span class="eyebrow">${T("Niveaux")}</span><div class="list">${LEVEL_TITLES.map((L, i) => { const from = LEVELS[i] ?? 0, who = people.filter(p => levelOf(pointsOf(p.id).earned).lvl >= i + 1);
      return `<div class="li"><div class="ic" style="font-size:1.3rem;background:var(--surface2)">${L.e}</div><div class="grow"><div class="li-title">${T("Niveau {n}",{n:i+1})} · ${T(L.t)}</div><div class="tiny muted">${i === 0 ? T("Dès le départ") : T("À partir de {n} points",{n:from})}</div></div><div class="row" style="gap:2px">${who.map(p => avatarOf(p, 22)).join("")}</div></div>`; }).join("")}</div>
    <span class="eyebrow">${T("Badges")}</span><div class="badge-grid">${BADGES.map(b => { const who = people.filter(p => badgesOf(p.id).find(x => x.k === b.k)?.got);
      return `<div class="bdg ${who.length?"on":""}"><span class="be">${b.e}</span><b>${T(b.t)}</b><small>${T(b.d)}</small>${bonusOf(b.k)?`<span class="chip butter">+${bonusOf(b.k)} ${T("pts")}${/^s\d/.test(b.k)?" · "+T("à chaque série"):""}</span>`:""}${who.length?`<div class="row" style="gap:2px;justify-content:center">${who.map(p => avatarOf(p, 20)).join("")}</div>`:""}</div>`; }).join("")}</div>
    <p class="tiny muted">${T("Les niveaux comptent tout ce qui a été gagné depuis le début : dépenser ne fait pas perdre de niveau.")}</p></div>`;
}
function defisView(){
  const parent = !isKidUser(), viewer = actor();
  if (parent){ const nb = awardBonuses(); if (nb){ save(); setTimeout(() => { toast(T("Bonus de badge ajouté ({n})",{n:nb})); confetti?.(); }, 300); } }
  const tabs = [["jour",T("Aujourd'hui")],["recomp",T("Récompenses")],["equipe",T("Équipe")],["histo",T("Historique")]];
  if (!tabs.some(t => t[0] === UI.defTab)) UI.defTab = "jour";
  let h = "";
  // mode enfant sur un appareil partagé : « c'est qui ? »
  if (S.settings.parental.kidMode){ const kids = S.family.members.filter(m => m.role === "enfant");
    if (kids.length) h += `<div class="card tint"><div class="card-h"><h3>${T("C'est qui ?")}</h3></div><div class="pick">${kids.map(k => `<button data-act="kidAs" data-v="${k.id}" aria-pressed="${k.id===viewer.id}">${avatarOf(k,22)} ${esc(k.name)}</button>`).join("")}</div></div>`; }
  const people = parent ? players() : [viewer];
  h += `<div class="grid">${(people.length ? people : [viewer]).map(p => { const P = pointsOf(p.id), L = levelOf(P.earned);
    const LT = LEVEL_TITLES[Math.min(L.lvl, LEVEL_TITLES.length) - 1], B = badgesOf(p.id).filter(b => b.got);
    return `<button class="card c4" data-act="profOf" data-v="${p.id}" style="border:0;text-align:left;cursor:pointer;color:inherit;background:linear-gradient(160deg,var(--${p.color||"peach"}-bg),var(--surface))"><div class="row">${avatarOf(p,44)}<div class="grow" style="min-width:0"><b>${esc(p.name)}</b><div class="tiny muted">${LT.e} ${T("Niveau {n}",{n:L.lvl})} · ${T(LT.t)}</div><div class="tiny muted">${T("{n} pts cette semaine",{n:P.week})}</div></div><div style="text-align:right"><div class="points" style="color:var(--${p.color||"peach"}-ink)">${ptsIc()} ${P.balance}</div><span class="tiny muted">${T("à dépenser")}</span></div></div><div class="levelbar"><i style="width:${clamp((P.earned-L.from)/(L.to-L.from)*100,2,100).toFixed(0)}%"></i></div><span class="tiny muted">${L.lvl >= LEVELS.length ? T("Niveau maximal atteint !") : T("{n} points avant le niveau suivant",{n:Math.max(0,Math.round(L.to-P.earned))})} · <u>${T("Voir le profil")}</u></span>${B.length ? `<div class="badges-row">${B.map(b => `<span title="${esc(T(b.t))}">${b.e}</span>`).join("")}</div>` : ""}</button>`; }).join("")}</div>
  <details class="card lexcard"><summary><b>${icon("star")} ${T("Légende : niveaux et badges")}</b></summary>${levelsLegend(people.length ? people : [viewer])}</details>
  ${parent ? `<button class="btn sm ghost" data-act="ptsForm" style="align-self:flex-start">${icon("sliders")}${T("Points : nom, icône et bonus")}</button>` : ""}`;
  h += `<div class="seg">${tabs.map(([id,l]) => `<button data-act="defTab" data-v="${id}" aria-pressed="${UI.defTab===id}">${l}</button>`).join("")}</div>`;
  if (parent && people.length > 1 && UI.defTab !== "equipe") h += `<div class="pick chips-scroll" style="flex-wrap:nowrap;overflow-x:auto"><button data-act="defWho" data-v="" aria-pressed="${!UI.defWho}">${T("Tout le monde")}</button>${people.map(p => `<button data-act="defWho" data-v="${p.id}" aria-pressed="${UI.defWho===p.id}">${avatarOf(p,20)} ${esc(p.name)}</button>`).join("")}</div>`;
  if (UI.defTab === "histo") UI.histWho = parent ? (UI.defWho || "all") : viewer.id;
  return h + ({jour:defisJour, recomp:defisRecomp, equipe:defisEquipe, histo:defisHisto}[UI.defTab])(parent, viewer);
}

/* profil : niveau, expérience, badges, puis historique et calendrier filtrables */
function profileSheet(mid){
  const parent = !isKidUser(), viewer = actor(), p = member(mid); if (!p) return;
  sheet(`${sheetHead(esc(p.name))}${defisProfil(parent, viewer, mid)}<div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-act="profHist" data-v="${mid}">${icon("clock")}${T("Voir son historique")}</button></div>`, "wide");
}
function defisProfil(parent, viewer, forId){
  const mid = forId || (parent ? UI.defWho : viewer.id), p = member(mid);
  if (!p) return "";
  const P = pointsOf(mid), L = levelOf(P.earned), LT = LEVEL_TITLES[Math.min(L.lvl, LEVEL_TITLES.length) - 1], NX = LEVEL_TITLES[Math.min(L.lvl, LEVEL_TITLES.length - 1)], B = badgesOf(mid);
  const ok = S.completions.filter(x => x.memberId === mid && x.status === "ok" && !x.bonus && !x.goal), goals = S.tasks.filter(t => t.kind === "goal" && (t.assignees||[]).includes(mid) && goalActive(t));
  let h = `<div class="card" style="background:linear-gradient(160deg,var(--${p.color||"peach"}-bg),var(--surface))"><div class="row">${avatarOf(p,64)}<div class="grow" style="min-width:0"><h2>${esc(p.name)}</h2><div class="small">${LT.e} ${T("Niveau {n}",{n:L.lvl})} · <b>${T(LT.t)}</b></div></div><div style="text-align:right"><div class="points" style="color:var(--${p.color||"peach"}-ink)">${ptsIc()} ${P.balance}</div><span class="tiny muted">${T("à dépenser")}</span></div></div>
    <div class="levelbar"><i style="width:${clamp((P.earned-L.from)/(L.to-L.from)*100,2,100).toFixed(0)}%"></i></div><span class="tiny muted">${L.lvl >= LEVELS.length ? T("Niveau maximal atteint !") : T("{n} points d'expérience avant « {t} »",{n:Math.max(0,Math.round(L.to-P.earned)), t:T(NX.t)})}</span>
    <div class="plate-stats">${[[T("Expérience totale"), P.earned], [T("Cette semaine"), P.week], [T("Défis réussis"), ok.length], [T("Meilleure série"), T("{n} j",{n:B[0]?.streak||0})], [T("Dépensés"), P.spent], [T("Reçus en cadeau"), P.received]].map(([l, v]) => `<div class="pstat"><b class="num">${v}</b><span class="tiny">${l}</span></div>`).join("")}</div></div>
    <div class="card"><div class="card-h"><h2>${T("Badges")}</h2><span class="chip butter">${B.filter(b => b.got).length} / ${B.length}</span></div><div class="badge-grid">${B.map(b => `<div class="bdg ${b.got?"on":""}"><span class="be">${b.got ? b.e : "🔒"}</span><b>${T(b.t)}</b><small>${T(b.d)}</small>${b.bonus?`<span class="chip ${b.got?"butter":""}">+${b.bonus} ${T("pts")}</span>`:""}</div>`).join("")}</div></div>`;
  if (goals.length) h += `<div class="card"><div class="card-h"><h2>${T("Objectifs en cours")}</h2></div>${goals.map(g => goalRow(g, parent, viewer, mid)).join("")}</div>`;
  return h;
}

/* ---------- objectifs de la semaine, du mois, de l'année : progression par clics ---------- */
const fmtQ = x => fmtNum(x, Number(x) % 1 ? 1 : 0);
const GOAL_PER = () => ({week:T("Cette semaine"), month:T("Ce mois-ci"), year:T("Cette année"), once:T("Dates précises")});
function goalWindow(g, d = today()){
  if (g.period === "week"){ const s0 = addDays(d, -((d.getDay()+6)%7)); return [s0, addDays(s0, 6)]; }
  if (g.period === "month") return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth()+1, 0)];
  if (g.period === "year") return [new Date(d.getFullYear(), 0, 1), new Date(d.getFullYear(), 11, 31)];
  return [parseD(g.start || iso(d)), parseD(g.end || g.start || iso(d))];
}
const goalActive = (g, d = today()) => !(g.start && iso(d) < g.start) && !(g.period === "once" && g.end && iso(d) > g.end);
function goalProgress(g, mid, d = today()){ const [a, b] = goalWindow(g, d), A = iso(a), B = iso(b); return sum(S.completions.filter(x => x.taskId === g.id && x.goal && (g.team || x.memberId === mid) && x.date >= A && x.date <= B).map(x => +x.amt || 0)); }
const goalDoneId = (g, mid, d = today()) => `gd_${g.id}_${mid}_${iso(goalWindow(g, d)[0])}`;
function goalRow(g, parent, viewer, only){
  const who = g.team ? [null] : (g.assignees||[]).filter(a => (!only || a === only) && (parent || a === viewer.id || a === only)); if (!who.length) return "";
  const [a, b] = goalWindow(g), left = Math.max(0, Math.round((b - today()) / DAY)), canTap = parent || (g.assignees||[]).includes(viewer.id);
  return `<div class="goal"><div class="row between" style="gap:8px"><div class="row" style="gap:10px;min-width:0"><div class="ic" style="background:var(--teal-bg);color:var(--teal-ink)">${icon(g.icon||"target")}</div><div style="min-width:0"><b>${esc(g.title)}</b><div class="tiny muted">${GOAL_PER()[g.period] || ""}${g.period==="once" ? ` · ${fmtD(a,{day:"numeric",month:"short"})} → ${fmtD(b,{day:"numeric",month:"short"})}` : ""} · ${T("encore {n} j",{n:left})} · +${g.points} ${T("pts")}${g.team ? " · " + T("équipe") : ""}</div></div></div>${parent?`<button class="icon-btn flat" data-act="goalForm" data-v="${g.id}" aria-label="${T("Modifier")}">${icon("edit")}</button>`:""}</div>
    ${who.map(mid => { const pr = goalProgress(g, mid), pc = clamp(pr / g.target * 100, 0, 100), done = pr >= g.target, m = mid ? member(mid) : null, tag = mid || "team";
      return `<div class="goal-line"><div class="row between small"><span class="row" style="gap:6px;flex-wrap:nowrap">${m ? `${avatarOf(m, 20)} ${esc(m.name)}` : esc((g.assignees||[]).map(x => member(x)?.name).filter(Boolean).join(" + "))}</span><b class="num">${fmtQ(pr)} / ${fmtQ(g.target)} ${esc(g.unit||"")}</b></div>
        <div class="levelbar"><i style="width:${Math.max(2, pc).toFixed(0)}%;background:linear-gradient(90deg,var(--teal),var(--mint))"></i></div>
        <div class="row" style="gap:6px">${done ? `<span class="chip mint">${icon("trophy")} ${T("Objectif atteint !")}</span>` : ""}${canTap ? `<button class="btn sm ghost" data-act="goalStep" data-v="${g.id}|${tag}|-1" aria-label="${T("Retirer {s}",{s:g.step})}" ${pr<=0?"disabled":""}>−</button><button class="btn sm kid" data-act="goalStep" data-v="${g.id}|${tag}|1">${icon("plus")}${fmtQ(g.step)} ${esc(g.unit||"")}</button>` : ""}</div></div>`; }).join("")}</div>`;
}
const GOAL_TPL = [["Courir 10 km",10,"km",1,"week",30,"run"],["Lire 5 livres",5,"livres",1,"month",40,"book"],["150 min d'activité",150,"min",15,"week",25,"run"],["Ranger sa chambre 5 fois",5,"fois",1,"week",20,"broom"],["30 sorties à vélo",30,"sorties",1,"year",100,"target"],["Boire de l'eau 7 jours",7,"jours",1,"week",15,"drop"]];
function goalForm(id){
  const g = S.tasks.find(x => x.id === id) || {title:"", target:10, unit:"km", step:1, period:"week", points:30, assignees:[], team:false, icon:"target", start:iso(today())};
  sheet(`<form class="stack" data-form="goal" data-id="${id||""}" style="gap:14px">${sheetHead(id ? T("Modifier l'objectif") : T("Nouvel objectif"))}
    <p class="small muted">${T("Un défi qui dure (semaine, mois, année) : chaque clic fait avancer la barre (ex. 1 km par clic). Les points sont donnés quand l'objectif est atteint.")}</p>
    ${id ? "" : `<div class="pick">${GOAL_TPL.map((x, i) => `<button type="button" data-act="goalTpl" data-v="${i}">${T(x[0])}</button>`).join("")}</div>`}
    ${fld("gl-title",T("Objectif"),inp("gl-title",g.title,`required placeholder="${T("Courir 10 km")}"`))}
    <div class="fgrid">${fld("gl-target",T("À atteindre"),`<input class="inp" id="gl-target" type="number" min="0.1" step="any" value="${g.target}" required>`)}${fld("gl-unit",T("Unité"),inp("gl-unit",g.unit||"",`placeholder="${T("km, livres, fois…")}"`))}${fld("gl-step",T("Par clic"),`<input class="inp" id="gl-step" type="number" min="0.1" step="any" value="${g.step}">`)}${fld("gl-pts",T("Points à la fin"),`<input class="inp" id="gl-pts" type="number" min="1" step="1" value="${g.points}">`)}</div>
    <div class="field"><label>${T("Période")}</label>${radios("glper",[["week",T("Chaque semaine")],["month",T("Chaque mois")],["year",T("Chaque année")],["once",T("Une seule fois (dates)")]],g.period)}</div>
    <div class="fgrid">${fld("gl-start",T("Commence le"),`<input class="inp" id="gl-start" type="date" value="${g.start||iso(today())}">`)}${fld("gl-end",T("Se termine le (si une seule fois)"),`<input class="inp" id="gl-end" type="date" value="${g.end||iso(addDays(today(), 30))}">`)}</div>
    <div class="field"><label>${T("Pour qui ?")}</label>${checks("glwho",S.family.members.map(m=>[m.id,m.name]),g.assignees)}</div>
    <label class="switch"><input type="checkbox" id="gl-team" ${g.team?"checked":""}><span class="tg"></span><span class="grow"><b>${T("Objectif d'équipe")}</b><br><span class="small muted">${T("La progression de tous compte ensemble ; chacun reçoit les points à la fin.")}</span></span></label>
    <div class="field"><label>${T("Icône")}</label><div class="radio-row">${["target","run","book","broom","drop","star","heart","ball","spoon","bed"].map(i=>`<label><input type="radio" name="glicon" value="${i}" ${g.icon===i?"checked":""}><span style="display:grid;place-items:center;width:42px;height:38px;padding:0">${icon(i).replace("<svg",'<svg style="width:20px;height:20px"')}</span></label>`).join("")}</div></div>
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${id?`<button type="button" class="btn danger" data-act="delTask" data-v="${id}">${T("Supprimer")}</button>`:""}</div></form>`);
}

function defisJour(parent, viewer){
  const d = today(), ds = iso(d); let h = "";
  const pending = S.completions.filter(x => x.status === "pending");
  if (parent && pending.length) h += `<div class="card"><div class="card-h"><h2>${T("À valider")}</h2><span class="chip butter">${pending.length}</span></div>${pending.map(x => { const t = S.tasks.find(y => y.id === x.taskId), m = member(x.memberId);
    return `<div class="taskrow">${avatarOf(m,32)}<div class="grow"><b>${esc(t?.title||"")}</b><div class="tiny muted">${esc(m?.name||"")} · ${fmtD(x.date,{day:"numeric",month:"short"})} · +${x.points}${x.team?` · ${T("en équipe")}`:""}</div></div><button class="btn sm kid" data-act="approve" data-v="${x.id}" aria-label="${T("Valider")}">${icon("check")}</button><button class="btn sm ghost" data-act="refuse" data-v="${x.id}" aria-label="${T("Refuser")}">${icon("x")}</button></div>`; }).join("")}</div>`;
  const fw = parent ? UI.defWho : null, list = S.tasks.filter(t => taskDueOn(t, d) && (!fw || (t.assignees||[]).includes(fw)));
  h += `<div class="card"><div class="card-h"><h2>${T("Défis d'aujourd'hui")}</h2>${parent?`<button class="btn sm kid" data-act="taskForm">${icon("plus")}${T("Défi")}</button>`:""}</div>
    ${list.length ? list.map(t => taskBlock(t, d, parent, viewer, fw)).join("") : empty("star", parent ? T("Créez des défis : lit fait, lecture, devoirs, ménage… Les parents peuvent aussi s'en donner !") : T("Aucun défi aujourd'hui."))}</div>`;
  const goals = S.tasks.filter(t => t.kind === "goal" && goalActive(t) && (!fw || (t.assignees||[]).includes(fw)) && (parent || (t.assignees||[]).includes(viewer.id)));
  const later = parent ? S.tasks.filter(t => t.kind === "goal" && !goalActive(t) && t.start > iso(today())) : [];
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Semaine · mois · année")}</span><h2>${T("Objectifs")}</h2></div>${parent?`<button class="btn sm kid" data-act="goalForm">${icon("plus")}${T("Objectif")}</button>`:""}</div>
    ${goals.length ? goals.map(g => goalRow(g, parent, viewer, fw)).join("") : `<p class="small muted">${parent ? T("Ex. : courir 10 km cette semaine (1 km par clic), lire 5 livres ce mois-ci, 30 sorties à vélo cette année.") : T("Aucun objectif en cours.")}</p>`}
    ${later.length ? `<p class="tiny muted">${T("À venir")} : ${later.map(g => `${esc(g.title)} (${fmtD(g.start,{day:"numeric",month:"short"})})`).join(", ")}</p>` : ""}</div>`;
  if (parent && S.tasks.length) h += `<div class="card"><div class="card-h"><h2>${T("Tous les défis")}</h2></div><div class="list">${S.tasks.filter(t => !fw || (t.assignees||[]).includes(fw)).map(t => t.kind === "goal" ? `<button class="li" data-act="goalForm" data-v="${t.id}"><div class="ic" style="background:var(--teal-bg);color:var(--teal-ink)">${icon(t.icon||"target")}</div><div class="grow"><div class="li-title">${esc(t.title)}</div><div class="small muted">${T("Objectif")} · ${GOAL_PER()[t.period]||""} · ${fmtQ(t.target)} ${esc(t.unit||"")} · +${t.points} · ${esc((t.assignees||[]).map(a=>member(a)?.name).filter(Boolean).join(", "))}</div></div></button>` : `<button class="li" data-act="taskForm" data-v="${t.id}"><div class="ic" style="background:var(--surface2)">${icon(t.icon||"star")}</div><div class="grow"><div class="li-title">${esc(t.title)}${t.team?` · ${T("équipe")}`:""}</div><div class="small muted">+${t.points} · ${t.recur==="daily"?T("chaque jour"):t.recur==="weekly"?(t.days||[]).map(d=>WD()[d]).join(", "):fmtD(t.date)} · ${esc((t.assignees||[]).map(a=>member(a)?.name).filter(Boolean).join(", "))}</div></div></button>`).join("")}</div></div>`;
  return h;
}

/* une ligne par personne (ou équipe) et par moment de la journée ; cochable aussi depuis l'agenda */
function taskRows(t, who, ds, parent){
  const ms = who.map(member).filter(Boolean); if (!ms.length) return "";
  const team = t.team && ms.length > 1, col = ms[0].color || "peach", future = ds > iso(today());
  return taskSlots(t).map(sl => { const cps = ms.map(m => completionOf(t.id, m.id, ds, sl)), cp = cps.find(Boolean), lab = slotLabel(t, sl);
    const mine = cp && (parent || (cp.status === "pending" && cp.memberId === actor().id));
    return `<div class="taskrow"><div class="ic" style="background:var(--${col}-bg);color:var(--${col}-ink)">${icon(t.icon||"star")}</div><div class="grow"><b>${esc(t.title)}</b>${lab?` <span class="chip">${icon("clock").replace("<svg",'<svg style="width:12px;height:12px;vertical-align:-2px"')} ${esc(lab)}</span>`:""}${team?` <span class="chip teal">${T("équipe")}</span>`:""}<div class="tiny muted">${team ? ms.map(m => esc(m.name)).join(" + ") : esc(ms[0].name)} · +${t.points} ${T("pts")}${team?" "+T("chacun"):""}</div></div>${cp ? `<button class="chip ${cp.status==="ok"?"mint":cp.status==="pending"?"butter":"rose"}" ${mine?`data-act="taskUndo" data-v="${t.id}|${ms.map(m=>m.id).join(",")}|${ds}|${sl}" title="${T("Toucher pour décocher")}"`:""}>${icon("check").replace("<svg",'<svg style="width:13px;height:13px;vertical-align:-2px"')} ${cp.status==="ok"?T("Fait !"):cp.status==="pending"?T("À valider"):T("Refusé")}</button>` : future ? `<span class="chip">${T("À venir")}</span>` : `<button class="btn sm kid" data-act="taskDone" data-v="${t.id}|${team ? ms.map(m=>m.id).join(",") : ms[0].id}|${ds}|${sl}">${icon("check")}${team?T("Fait ensemble"):T("Fait")}</button>`}</div>`; }).join("");
}
/* un seul bloc par défi : en équipe, une ligne commune ; sinon une ligne avec une case par personne (plus de doublons) */
function taskBlock(t, d, parent, viewer, only){
  let who = (t.assignees||[]).filter(a => parent || a === viewer.id || (t.team && (t.assignees||[]).includes(viewer.id)));
  if (only) who = who.filter(a => a === only);
  if (!who.length) return ""; const ds = iso(d);
  if (t.team && t.assignees.length > 1) return taskRows(t, only ? who : t.assignees, ds, parent);
  if (who.length === 1) return taskRows(t, who, ds, parent);
  const ms = who.map(member).filter(Boolean), future = ds > iso(today());
  return taskSlots(t).map(sl => { const lab = slotLabel(t, sl);
    return `<div class="taskrow"><div class="ic" style="background:var(--surface2)">${icon(t.icon||"star")}</div><div class="grow" style="min-width:0"><b>${esc(t.title)}</b>${lab?` <span class="chip">${icon("clock").replace("<svg",'<svg style="width:12px;height:12px;vertical-align:-2px"')} ${esc(lab)}</span>`:""}<div class="tiny muted">+${t.points} ${T("pts")} ${T("chacun")}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${ms.map(m => { const cp = completionOf(t.id, m.id, ds, sl), undo = cp && (parent || (cp.status === "pending" && cp.memberId === actor().id));
        if (cp) return `<button class="chip ${cp.status==="ok"?"mint":cp.status==="pending"?"butter":"rose"}" ${undo?`data-act="taskUndo" data-v="${t.id}|${m.id}|${ds}|${sl}"`:""}>${avatarOf(m,18)} ${cp.status==="ok"?"✓":cp.status==="pending"?"…":"✗"} ${esc(m.name)}</button>`;
        return future ? `<span class="chip">${avatarOf(m,18)} ${esc(m.name)}</span>` : `<button class="chip" style="border:1px dashed var(--line)" data-act="taskDone" data-v="${t.id}|${m.id}|${ds}|${sl}">${avatarOf(m,18)} ${esc(m.name)} · ${T("Fait")}</button>`; }).join("")}</div></div></div>`; }).join("");
}
function tasksForDay(d, parent, viewer){
  return S.tasks.filter(t => taskDueOn(t, d)).map(t => taskBlock(t, d, parent, viewer, null)).join("");
}
function defisRecomp(parent, viewer){
  const fw = parent ? UI.defWho : viewer.id, solo = S.rewards.filter(r => !r.team && (!fw || !(r.for||[]).length || r.for.includes(fw)));
  let h = `<div class="card"><div class="card-h"><h2>${T("Récompenses")}</h2>${parent?`<button class="btn sm ghost" data-act="rewardForm">${icon("plus")}${T("Récompense")}</button>`:""}</div>
    <p class="small muted">${parent ? T("Touchez « Échanger » puis choisissez qui dépense ses points (utile pour les enfants sans téléphone).") : T("Choisis une récompense : tes points seront dépensés quand un parent aura confirmé.")}</p>
    ${solo.length ? `<div class="grid">${solo.map(r => { const bal = pointsOf(viewer.id).balance, can = parent ? players().some(p => pointsOf(p.id).balance >= r.cost) : bal >= r.cost;
      return `<div class="reward c4">${icon("gift").replace("<svg",'<svg style="width:28px;height:28px;color:var(--peach-ink)"')}<b>${esc(r.title)}</b><span class="chip butter">${r.cost} ${T("pts")}</span>${!parent && !can ? `<div class="levelbar"><i style="width:${clamp(bal/r.cost*100,2,100).toFixed(0)}%"></i></div><span class="tiny muted">${T("Encore {n} points",{n:r.cost-Math.max(0,bal)})}</span>` : ""}<button class="btn sm ${can?"kid":"ghost"}" data-act="redeem" data-v="${r.id}" ${can?"":"disabled"}>${can?T("Échanger"):T("Pas encore assez de points")}</button>${parent?`<button class="btn sm line" data-act="rewardForm" data-v="${r.id}">${icon("edit")}${T("Modifier")}</button>`:""}</div>`; }).join("")}</div>` : `<p class="small muted">${T("Ajoutez des récompenses à échanger contre des points.")}</p>`}`;
  const pend = S.redemptions.filter(x => x.status === "pending");
  if (pend.length && parent) h += `<div class="sep"></div><b>${T("Échanges à confirmer")}</b>${pend.map(x => `<div class="taskrow">${avatarOf(member(x.memberId),30)}<div class="grow">${esc(S.rewards.find(r=>r.id===x.rewardId)?.title||"")} · ${esc(member(x.memberId)?.name||"")} · −${x.cost}</div><button class="btn sm kid" data-act="redeemOk" data-v="${x.id}" aria-label="${T("Confirmer")}">${icon("check")}</button><button class="btn sm ghost" data-act="redeemNo" data-v="${x.id}" aria-label="${T("Refuser")}">${icon("x")}</button></div>`).join("")}`;
  const mine = S.redemptions.filter(x => rKind(x) === "reward" && (parent ? (!UI.defWho || x.memberId === UI.defWho) : x.memberId === viewer.id)).sort((a,b) => (b.at||0) - (a.at||0)).slice(0, 12);
  if (mine.length) h += `<div class="sep"></div><b>${T("Derniers échanges")}</b><div class="list">${mine.map(x => `<div class="li">${avatarOf(member(x.memberId),30)}<div class="grow"><div class="li-title">${esc(S.rewards.find(r=>r.id===x.rewardId)?.title||T("Récompense"))}</div><div class="small muted">${esc(member(x.memberId)?.name||"")} · ${fmtD(x.date,{day:"numeric",month:"short"})}</div></div><span class="chip ${x.status==="ok"?"mint":x.status==="pending"?"butter":"rose"}">${x.status==="ok"?`−${x.cost}`:x.status==="pending"?T("En attente"):x.cancel?T("Annulé"):T("Refusé")}</span>${parent && x.status !== "refuse" ? `<button class="icon-btn flat" data-act="redeemCancel" data-v="${x.id}" aria-label="${T("Annuler l'échange")}" title="${T("Annuler l'échange : les points sont rendus")}">${icon("x")}</button>` : ""}</div>`).join("")}</div>`;
  return h + `</div>`;
}

function defisEquipe(parent, viewer){
  const goals = S.rewards.filter(r => r.team);
  let h = `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Travail d'équipe")}</span><h2>${T("Objectifs communs")}</h2></div>${parent?`<button class="btn sm kid" data-act="teamGoalForm">${icon("plus")}${T("Objectif")}</button>`:""}</div>
    <p class="small muted">${T("Une grosse récompense pour toute la famille (sortie au zoo, soirée pizza-film…) : chacun y met des points, et on l'obtient ensemble quand le total est atteint.")}</p>
    ${goals.length ? goals.map(r => { const tot = teamTotal(r), done = tot >= r.cost, contrib = {}; S.redemptions.filter(x => rKind(x) === "team" && x.rewardId === r.id && x.status !== "refuse").forEach(x => contrib[x.memberId] = (contrib[x.memberId]||0) + x.cost);
      return `<div class="reward" style="background:linear-gradient(160deg,var(--teal-bg),var(--mint-bg));margin-top:10px"><div class="row between"><b style="font-size:1.05rem">${icon("people").replace("<svg",'<svg style="width:20px;height:20px;vertical-align:-4px"')} ${esc(r.title)}</b><span class="chip ${done?"mint":"teal"}">${tot} / ${r.cost}</span></div>
        <div class="levelbar"><i style="width:${clamp(tot/r.cost*100,2,100).toFixed(0)}%;background:linear-gradient(90deg,var(--teal),var(--mint))"></i></div>
        <div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(contrib).map(([mid,v]) => `<span class="chip">${avatarOf(member(mid),18)} ${esc(member(mid)?.name||"?")} · ${v}</span>`).join("") || `<span class="tiny muted">${T("Personne n'a encore contribué.")}</span>`}</div>
        ${r.doneAt ? `<span class="chip mint">${icon("trophy")} ${T("Obtenu le {d}",{d:fmtD(r.doneAt,{day:"numeric",month:"long"})})}</span>` : done ? `<div class="banner ok">${icon("trophy")}<div class="small"><b>${T("Objectif atteint, bravo l'équipe !")}</b></div></div>${parent?`<button class="btn sm kid" data-act="teamDone" data-v="${r.id}">${icon("check")}${T("C'est fait, on l'a eu !")}</button>`:""}` : `<button class="btn sm kid" data-act="contribForm" data-v="${r.id}">${icon("plus")}${T("Mettre des points")}</button>`}
        ${parent?`<button class="btn sm line" data-act="rewardForm" data-v="${r.id}">${icon("edit")}${T("Modifier")}</button>`:""}</div>`; }).join("") : empty("people", parent ? T("Créez un objectif d'équipe pour que les enfants s'entraident.") : T("Pas encore d'objectif d'équipe."))}</div>`;
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Entraide")}</span><h2>${T("Donner des points")}</h2></div><button class="btn sm kid" data-act="giftForm">${icon("heart")}${T("Donner")}</button></div><p class="small muted">${T("Un grand qui aide un plus petit à obtenir sa récompense, un merci pour un coup de main : on peut offrir une partie de ses points.")}</p></div>`;
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Défis d'équipe")}</span><h2>${T("Gagner ensemble")}</h2></div></div><p class="small muted">${T("Dans un défi, cochez « Défi d'équipe » : quand les enfants le font ensemble, chacun reçoit les points.")}</p>${S.tasks.filter(t => t.team).map(t => `<div class="taskrow">${icon(t.icon||"star")}<div class="grow"><b>${esc(t.title)}</b><div class="tiny muted">${esc((t.assignees||[]).map(a=>member(a)?.name).filter(Boolean).join(" + "))} · +${t.points} ${T("chacun")}</div></div></div>`).join("")}</div>`;
  return h;
}

function defisHisto(parent, viewer){
  const who = parent ? (UI.histWho || "all") : viewer.id, ty = UI.histType || "all";
  const TYPES = [["all",T("Tout")],["defi",T("Défis")],["goal",T("Objectifs")],["bonus",T("Bonus")],["spend",T("Récompenses")],["gift",T("Dons")]];
  const keep = e => ty === "all" || (ty === "defi" && e.kind === "gain" && !e.bonus && !e.goalDone) || (ty === "goal" && (e.kind === "goal" || e.goalDone)) || (ty === "bonus" && e.bonus) || (ty === "spend" && (e.kind === "spend" || e.kind === "team")) || (ty === "gift" && e.kind.startsWith("gift"));
  const from = UI.histFrom || "", to = UI.histTo || "", view = UI.histView || "cal";
  const log = pointsLog(who === "all" ? null : who).filter(keep);
  const base = UI.histMonth ? parseD(UI.histMonth) : new Date(today().getFullYear(), today().getMonth(), 1);
  const first = new Date(base.getFullYear(), base.getMonth(), 1), start = addDays(first, -((first.getDay()+6)%7));
  const mo = iso(first).slice(0,7), inMonth = log.filter(e => e.date.startsWith(mo) && !e.pending);
  const real = who === "all" ? inMonth.filter(e => !e.kind.startsWith("gift")) : inMonth;
  const gained = sum(real.filter(e => e.pts > 0).map(e => e.pts)), spent = -sum(real.filter(e => e.pts < 0).map(e => e.pts)), nTasks = inMonth.filter(e => e.kind === "gain").length;
  const sel = UI.histSel;
  let cells = "";
  // (les objectifs ne comptent pas comme défis réussis dans le calendrier)
  for (let i = 0; i < 42; i++){
    const d = addDays(start, i), ds = iso(d), out = d.getMonth() !== base.getMonth(); if (i >= 35 && out && d.getDay() === 1) break;
    const de = log.filter(e => e.date === ds && !e.pending), g = de.filter(e => e.kind === "gain").length, sp = de.some(e => e.pts < 0 && e.kind !== "gift-out");
    cells += `<button class="day ${out?"out":""} ${ds===iso(today())?"today":""} ${ds===sel?"sel":""}" data-act="histDay" data-v="${ds}"><span class="num">${d.getDate()}</span><span class="dots">${g?`<i style="background:var(--mint);width:${g>2?14:6}px;border-radius:3px"></i>`:""}${sp?`<i style="background:var(--coral)"></i>`:""}${de.some(e => e.kind.startsWith("gift"))?`<i style="background:var(--rose)"></i>`:""}</span>${g?`<span class="tiny" style="color:var(--mint-ink);font-weight:800;position:relative">✓${g}</span>`:""}</button>`;
  }
  const dow = LANG === "en" ? ["M","T","W","T","F","S","S"] : ["L","M","M","J","V","S","D"];
  const shown = sel ? log.filter(e => e.date === sel) : log.filter(e => e.date.startsWith(mo));
  let h = `<div class="card hist-filters"><div class="pick chips-scroll" style="flex-wrap:nowrap;overflow-x:auto">${TYPES.map(([k, l]) => `<button data-act="histType" data-v="${k}" aria-pressed="${ty===k}">${l}</button>`).join("")}</div>
    <div class="seg" style="width:auto">${[["cal",T("Calendrier")],["list",T("Liste")]].map(([k, l]) => `<button data-act="histView" data-v="${k}" aria-pressed="${view===k}">${l}</button>`).join("")}</div>
    ${view === "list" ? `<div class="row" style="gap:6px;flex-wrap:wrap"><input class="inp" type="date" value="${from}" data-change="histFrom" aria-label="${T("Du")}" style="width:auto"><span class="small muted">→</span><input class="inp" type="date" value="${to}" data-change="histTo" aria-label="${T("Au")}" style="width:auto"><button class="btn sm ${!from && !to ? "kid" : "ghost"}" data-act="histRange" data-v="all">${T("Depuis le début")}</button><button class="btn sm ghost" data-act="histRange" data-v="30">${T("30 jours")}</button><button class="btn sm ghost" data-act="histRange" data-v="year">${T("Cette année")}</button></div>` : ""}</div>`;
  if (view === "list"){
    const L = log.filter(e => (!from || e.date >= from) && (!to || e.date <= to)), R = who === "all" ? L.filter(e => !e.kind.startsWith("gift")) : L;
    const gain = sum(R.filter(e => e.pts > 0).map(e => e.pts)), lost = -sum(R.filter(e => e.pts < 0).map(e => e.pts)), nT = L.filter(e => e.kind === "gain" && !e.bonus && !e.pending).length;
    const byMonth = {}; L.forEach(e => (byMonth[e.date.slice(0, 7)] = byMonth[e.date.slice(0, 7)] || []).push(e));
    return h + `<div class="card"><div class="stats"><div class="stat"><span class="muted tiny">${T("Défis réussis")}</span><div class="v" style="color:var(--mint-ink)">${nT}</div></div><div class="stat"><span class="muted tiny">${T("Points gagnés")}</span><div class="v">+${gain}</div></div><div class="stat"><span class="muted tiny">${T("Points dépensés")}</span><div class="v" style="color:var(--coral-ink)">−${lost}</div></div><div class="stat"><span class="muted tiny">${T("Entrées")}</span><div class="v">${L.length}</div></div></div>
      ${L.length ? Object.entries(byMonth).map(([mo, arr]) => `<div class="eyebrow" style="margin-top:8px">${fmtD(mo + "-01",{month:"long",year:"numeric"})} · ${arr.length}</div><div class="list">${arr.map(e => histRow(e, who)).join("")}</div>`).join("") : empty("clock", T("Rien pour cette période."))}</div>`;
  }
  h += `<div class="card"><div class="row between"><h2>${fmtD(first,{month:"long",year:"numeric"})}</h2><div class="row"><button class="icon-btn" data-act="histNav" data-v="-1" aria-label="${T("Mois précédent")}">${icon("left")}</button><button class="icon-btn" data-act="histNav" data-v="1" aria-label="${T("Mois suivant")}">${icon("right")}</button></div></div>
    <div class="stats"><div class="stat"><span class="muted tiny">${T("Défis réussis")}</span><div class="v" style="color:var(--mint-ink)">${nTasks}</div></div><div class="stat"><span class="muted tiny">${T("Points gagnés")}</span><div class="v">+${gained}</div></div><div class="stat"><span class="muted tiny">${T("Points dépensés")}</span><div class="v" style="color:var(--coral-ink)">−${spent}</div></div></div>
    <div class="cal">${dow.map(x => `<span class="dow">${x}</span>`).join("")}${cells}</div>
    <div class="row tiny muted" style="gap:12px;flex-wrap:wrap"><span><i class="lgd" style="background:var(--mint)"></i> ${T("défis réussis")}</span><span><i class="lgd" style="background:var(--coral)"></i> ${T("points dépensés")}</span><span><i class="lgd" style="background:var(--rose)"></i> ${T("dons")}</span></div></div>`;
  h += `<div class="card"><div class="card-h"><h2>${sel ? fmtD(sel,{weekday:"long",day:"numeric",month:"long"}) : T("Ce mois-ci")}</h2>${sel?`<button class="btn sm ghost" data-act="histDay" data-v="">${T("Tout le mois")}</button>`:""}</div>
    ${shown.length ? `<div class="list">${shown.map(e => histRow(e, who)).join("")}</div>` : empty("cal", T("Rien ce mois-ci."))}</div>`;
  return h;
}

const histRow = (e, who) => { const m = member(e.who); return `<div class="li"><div class="ic" style="background:var(--${e.kind==="goal"?"teal":e.pts>0?"mint":"coral"}-bg);color:var(--${e.kind==="goal"?"teal":e.pts>0?"mint":"coral"}-ink)">${icon(e.ic)}</div><div class="grow"><div class="li-title">${esc(e.title)}${e.team?` · ${T("en équipe")}`:""}</div><div class="small muted">${who==="all"&&m?esc(m.name)+" · ":""}${fmtD(e.date,{day:"numeric",month:"short",year:"numeric"})}${e.pending?" · "+T("en attente"):""}</div></div>${e.kind === "goal" ? `<span class="chip teal num">${e.amt > 0 ? "+" : ""}${fmtQ(e.amt)} ${esc(e.unit)}</span>` : `<b class="num" style="color:var(--${e.pts>0?"mint":"coral"}-ink)">${e.pts>0?"+":"−"}${Math.abs(e.pts)}</b>`}</div>`; };
/* ---------- formulaires ---------- */
function redeemSheet(rid){
  const r = S.rewards.find(x => x.id === rid); if (!r) return;
  const can = players().filter(p => pointsOf(p.id).balance >= r.cost);
  sheet(`${sheetHead(T("Qui échange ?"))}<p class="small muted">${esc(r.title)} · ${r.cost} ${T("pts")}</p><div class="list">${players().map(p => { const b = pointsOf(p.id).balance, ok = b >= r.cost;
    return `<button class="li" data-act="redeemFor" data-v="${rid}|${p.id}" ${ok?"":"disabled"} style="${ok?"":"opacity:.5"}">${avatarOf(p,36)}<div class="grow"><div class="li-title">${esc(p.name)}</div><div class="small muted">${T("{n} points",{n:b})}${ok?"":" · "+T("pas assez")}</div></div>${ok?icon("right"):""}</button>`; }).join("")}</div>${can.length?"":`<p class="small muted">${T("Personne n'a encore assez de points.")}</p>`}`);
}
function contribForm(rid){
  const r = S.rewards.find(x => x.id === rid), parent = !isKidUser(), who = parent ? players() : [actor()], left = r.cost - teamTotal(r);
  sheet(`<form class="stack" data-form="contrib" data-id="${rid}" style="gap:14px">${sheetHead(T("Mettre des points"))}<p class="small muted">${esc(r.title)} · ${T("il manque {n} points",{n:left})}</p>
    <div class="field"><label>${T("Qui donne ?")}</label>${radios("cwho", who.map(p => [p.id, `${p.name} (${pointsOf(p.id).balance})`]), who[0]?.id)}</div>
    ${fld("c-pts",T("Combien de points ?"),`<input class="inp" id="c-pts" type="number" inputmode="numeric" min="1" value="${Math.min(left, Math.max(1, Math.min(...who.map(p => pointsOf(p.id).balance).filter(b => b > 0), left)))}" required>`)}
    <button class="btn kid" type="submit">${icon("people")}${T("Ajouter à l'objectif")}</button></form>`);
}
function giftForm(){
  const parent = !isKidUser(), from = parent ? players() : [actor()];
  sheet(`<form class="stack" data-form="gift" style="gap:14px">${sheetHead(T("Donner des points"))}
    <div class="field"><label>${T("De")}</label>${radios("gfrom", from.map(p => [p.id, `${p.name} (${pointsOf(p.id).balance})`]), from[0]?.id)}</div>
    <div class="field"><label>${T("À")}</label>${radios("gto", S.family.members.filter(p => !from.length || from.length > 1 || p.id !== from[0].id).map(p => [p.id, p.name]), "")}</div>
    ${fld("g-pts",T("Combien de points ?"),`<input class="inp" id="g-pts" type="number" inputmode="numeric" min="1" value="10" required>`)}
    ${fld("g-why",T("Pourquoi ? (facultatif)"),`<input class="inp" id="g-why" placeholder="${T("Merci de m'avoir aidé à ranger !")}">`)}
    <button class="btn kid" type="submit">${icon("heart")}${T("Donner")}</button></form>`);
}
function teamGoalForm(){
  sheet(`<form class="stack" data-form="teamGoal" style="gap:14px">${sheetHead(T("Objectif d'équipe"))}
    <div class="pick">${[["Sortie au zoo",400],["Soirée pizza et film",200],["Journée au parc aquatique",600],["Camping en famille",800],["Nouveau jeu de société",250]].map(([t,c]) => `<button type="button" data-act="teamTpl" data-v="${c}">${T(t)}</button>`).join("")}</div>
    ${fld("tg-title",T("Récompense commune"),inp("tg-title","","required"))}${fld("tg-cost",T("Points à rassembler"),numIn("tg-cost","",10,300))}
    <button class="btn kid" type="submit">${T("Créer")}</button></form>`);
}
function addRedemption(o){ S.redemptions.push({id:uid(), date:iso(today()), at:Date.now(), status:"ok", kind:"reward", ...o}); }

Object.assign(ACT, {
  defTab: v => { UI.defTab = v; UI.histSel = null; render(); },
  defWho: v => { UI.defWho = v || null; UI.histWho = v || null; render(); },
  ptsForm: () => { const P = S.settings.pts || {};
    sheet(`<form class="stack" data-form="ptsForm" style="gap:14px">${sheetHead(T("Personnaliser les points"))}<p class="small muted">${T("Donnez un nom qui motive votre tribu : étoiles, pièces d'or, glands, cristaux…")}</p>
      <div class="fgrid">${fld("pt-name",T("Nom (pluriel)"),inp("pt-name",P.name||"",`placeholder="${T("étoiles")}"`))}${fld("pt-short",T("Abréviation (facultatif)"),inp("pt-short",P.short||"",`placeholder="${T("ét.")}"`))}</div>
      <div class="field"><label>${T("Icône")}</label><div class="emopick">${["⭐","🪙","💎","🌰","🍀","🔥","🎟️","🧩","🍪","🚀","🌈","❤️"].map(e => `<label><input type="radio" name="ptemo" value="${e}" ${(P.emoji||"⭐")===e?"checked":""}><span>${e}</span></label>`).join("")}</div></div>
      <h3>${T("Bonus quand un badge est gagné")}</h3><p class="small muted">${T("Points ajoutés automatiquement. Les séries (3, 7, 14, 30 jours) rapportent leur bonus à chaque nouvelle série. Mettez 0 pour aucun bonus.")}</p>
      <div class="bonus-grid">${BADGES.map(b => `<label class="bonus-row"><span>${b.e} ${T(b.t)}</span><input class="inp" type="number" min="0" step="1" inputmode="numeric" name="bonus" data-k="${b.k}" value="${bonusOf(b.k)}"></label>`).join("")}</div>
      <label class="switch"><input type="checkbox" id="bonus-off" ${S.settings.bonusOff?"checked":""}><span class="tg"></span><span class="grow">${T("Désactiver tous les bonus")}</span></label>
      <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${P.name?`<button type="button" class="btn line" data-act="ptsReset">${T("Revenir à « points »")}</button>`:""}</div></form>`); },
  ptsReset: () => { S.settings.pts = {emoji:S.settings.pts?.emoji}; save(); closeSheet(); render(); },
  histOf: v => { UI.defTab = "histo"; UI.histWho = v; UI.histSel = null; render(); },
  histWho: v => { UI.histWho = v; render(); }, histDay: v => { UI.histSel = v || null; render(); },
  histType: v => { UI.histType = v; UI.histSel = null; render(); },
  profOf: v => profileSheet(v),
  profHist: v => { closeSheet(); UI.defTab = "histo"; UI.defWho = v; UI.histWho = v; UI.histSel = null; render(); },
  histView: v => { UI.histView = v; render(); },
  histRange: v => { const t = iso(today()); if (v === "all"){ UI.histFrom = ""; UI.histTo = ""; } else if (v === "30"){ UI.histFrom = iso(addDays(today(), -29)); UI.histTo = t; } else { UI.histFrom = `${today().getFullYear()}-01-01`; UI.histTo = t; } render(); },
  goalForm: v => { if (!isKidUser()) goalForm(v); },
  goalTpl: v => { const x = GOAL_TPL[+v]; $("#gl-title").value = T(x[0]); $("#gl-target").value = x[1]; $("#gl-unit").value = T(x[2]); $("#gl-step").value = x[3]; $("#gl-pts").value = x[5]; const r = $(`input[name=glper][value=${x[4]}]`); if (r) r.checked = true; const ic = $(`input[name=glicon][value=${x[6]}]`); if (ic) ic.checked = true; },
  goalStep: v => { const [gid, tag, sg] = v.split("|"), g = S.tasks.find(x => x.id === gid); if (!g) return; const mid = tag === "team" ? actor().id : tag;
    const before = goalProgress(g, tag === "team" ? null : mid), amt = (+g.step || 1) * (+sg); if (before + amt < 0) return;
    S.completions.push({id:uid(), taskId:g.id, memberId:mid, date:iso(today()), at:Date.now(), amt, points:0, status:"ok", goal:true});
    const after = before + amt, winners = tag === "team" ? (g.assignees||[]) : [mid], auto = !isKidUser() || S.settings.parental.allow.selfApprove;
    if (after >= g.target && before < g.target){ winners.forEach(w => { const id = goalDoneId(g, w); if (!S.completions.some(x => x.id === id)) S.completions.push({id, taskId:g.id, memberId:w, date:iso(today()), at:Date.now(), points:g.points, status:auto ? "ok" : "pending", goalDone:true, team:tag === "team"}); });
      commit(auto ? T("Objectif atteint ! +{n} points",{n:g.points}) : T("Objectif atteint ! Envoyé au parent pour validation")); confetti(); return; }
    if (after < g.target && before >= g.target){ const ids = winners.map(w => goalDoneId(g, w)); S.completions = S.completions.filter(x => !ids.includes(x.id)); }
    commit(sg > 0 ? T("+{a} {u} · {p} / {t}",{a:fmtQ(amt), u:g.unit||"", p:fmtQ(after), t:fmtQ(g.target)}) : T("Corrigé")); },
  histNav: v => { const b = UI.histMonth ? parseD(UI.histMonth) : new Date(today().getFullYear(), today().getMonth(), 1); UI.histMonth = iso(addMonths(b, +v)); UI.histSel = null; render(); },
  taskUndo: v => { const [tid, ids, ds, sl = ""] = v.split("|"); const mids = ids.split(","); S.completions = S.completions.filter(x => !(x.taskId === tid && mids.includes(x.memberId) && x.date === ds && (x.slot||"") === sl)); commit(T("Décoché")); },
  kidAs: v => { S.settings.parental.kidAs = v; commit(); },
  redeem: v => { const r = S.rewards.find(x => x.id === v); if (!r) return;
    if (!isKidUser()) return redeemSheet(v);
    const a = actor(); if (pointsOf(a.id).balance < r.cost) return toast(T("Pas encore assez de points"));
    addRedemption({rewardId:v, memberId:a.id, cost:r.cost, status:"pending"}); commit(T("Demande envoyée au parent")); confetti(); },
  redeemFor: v => { const [rid, mid] = v.split("|"), r = S.rewards.find(x => x.id === rid); if (pointsOf(mid).balance < r.cost) return toast(T("Pas encore assez de points"));
    addRedemption({rewardId:rid, memberId:mid, cost:r.cost}); closeSheet(); commit(T("{n} a échangé « {r} » !",{n:member(mid)?.name||"", r:r.title})); confetti(); },
  contribForm: v => contribForm(v), giftForm: () => giftForm(), teamGoalForm: () => teamGoalForm(),
  teamTpl: v => { const b = document.querySelector(`[data-act=teamTpl][data-v="${v}"]`); $("#tg-title").value = b.textContent; $("#tg-cost").value = v; },
  teamDone: v => { const r = S.rewards.find(x => x.id === v); r.doneAt = iso(today()); commit(T("Bravo l'équipe !")); confetti(); },
  taskDone: v => { const [tid, ids, dd, sl = ""] = v.split("|"), ds = dd || iso(today()), t = S.tasks.find(x => x.id === tid), mids = ids.split(","), auto = !isKidUser() || S.settings.parental.allow.selfApprove;
    mids.forEach(mid => { if (!completionOf(tid, mid, ds, sl)) S.completions.push({id:uid(), taskId:tid, memberId:mid, date:ds, slot:sl, points:t.points, status: auto ? "ok" : "pending", at:Date.now(), team: mids.length > 1}); });
    commit(auto ? (mids.length > 1 ? T("+{n} points chacun, bravo l'équipe !",{n:t.points}) : T("+{n} points !",{n:t.points})) : T("Envoyé au parent pour validation")); if (auto) confetti(); },
});
Object.assign(FORMS, {
  contrib: f => { const r = S.rewards.find(x => x.id === f.dataset.id), mid = radio("cwho"), n = Math.round(numOf("c-pts")); if (!mid || !(n > 0)) return toast(T("Indiquez un nombre de points"));
    if (pointsOf(mid).balance < n) return toast(T("Pas assez de points")); const left = r.cost - teamTotal(r);
    addRedemption({kind:"team", rewardId:r.id, memberId:mid, cost:Math.min(n, left)}); closeSheet(); commit(teamTotal(r) >= r.cost ? T("Objectif atteint, bravo l'équipe !") : T("Merci pour l'équipe !")); confetti(); },
  gift: () => { const from = radio("gfrom"), to = radio("gto"), n = Math.round(numOf("g-pts")); if (!from || !to) return toast(T("Choisissez qui donne et qui reçoit")); if (from === to) return toast(T("Choisissez une autre personne"));
    if (!(n > 0)) return toast(T("Indiquez un nombre de points")); if (pointsOf(from).balance < n) return toast(T("Pas assez de points"));
    addRedemption({kind:"gift", memberId:from, toId:to, cost:n, note:val("g-why")}); closeSheet(); commit(T("{a} a donné {n} points à {b}",{a:member(from)?.name||"", n, b:member(to)?.name||""})); confetti(); },
  teamGoal: () => { S.rewards.push({id:uid(), title:val("tg-title"), cost:numOf("tg-cost")||300, team:true}); closeSheet(); commit(T("Objectif d'équipe créé")); },
});
Object.assign(FORMS, { goal: f => { const id = f.dataset.id, d = {kind:"goal", title:val("gl-title"), target:Math.max(0.1, +val("gl-target") || 1), unit:val("gl-unit"), step:Math.max(0.1, +val("gl-step") || 1), points:Math.max(1, Math.round(+val("gl-pts") || 1)), period:radio("glper") || "week", start:val("gl-start") || iso(today()), end:val("gl-end") || null, assignees:checked("glwho"), team:!!$("#gl-team")?.checked, icon:radio("glicon") || "target", recur:"none"};
  if (!d.title) return toast(T("Nom requis")); if (!d.assignees.length) return toast(T("Choisissez au moins une personne")); if (d.period === "once" && d.end && d.end < d.start) return toast(T("La fin doit suivre le début"));
  if (id) Object.assign(S.tasks.find(t => t.id === id), d); else S.tasks.push({id:uid(), ...d}); closeSheet(); commit(T("Objectif enregistré")); } });
Object.assign(FORMS, { ptsForm: () => { S.settings.bonus = Object.fromEntries($$("input[name=bonus]").map(i => [i.dataset.k, Math.max(0, Math.round(+i.value || 0))])); S.settings.bonusOff = !!$("#bonus-off")?.checked; const name = val("pt-name").trim(); S.settings.pts = {name, short:val("pt-short").trim() || "", emoji:radio("ptemo") || "⭐"}; if (!name) delete S.settings.pts.name; save(); closeSheet(); render(); toast(T("Enregistré")); } });

Object.assign(CHANGE, { histFrom: t => { UI.histFrom = t.value; render(); }, histTo: t => { UI.histTo = t.value; render(); } });
