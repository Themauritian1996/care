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
    L.push({date:x.date, at:x.at||0, who:x.memberId, pts:x.points, kind:"gain", pending:x.status === "pending", title:t?.title || T("Défi"), team:!!x.team, ic:t?.icon||"star"}); });
  S.redemptions.filter(x => x.status !== "refuse").forEach(x => { const r = S.rewards.find(y => y.id === x.rewardId), k = rKind(x);
    if (k === "gift"){ if (!mid || x.memberId === mid) L.push({date:x.date, at:x.at||0, who:x.memberId, pts:-x.cost, kind:"gift-out", title:T("Don à {n}",{n:member(x.toId)?.name||"?"}), ic:"heart"});
      if (!mid || x.toId === mid) L.push({date:x.date, at:x.at||0, who:x.toId, pts:x.cost, kind:"gift-in", title:T("Cadeau de {n}",{n:member(x.memberId)?.name||"?"}), ic:"heart"}); return; }
    if (mid && x.memberId !== mid) return;
    L.push({date:x.date, at:x.at||0, who:x.memberId, pts:-x.cost, kind:k === "team" ? "team" : "spend", pending:x.status === "pending", title:k === "team" ? T("Mis dans « {r} »",{r:r?.title||"?"}) : (r?.title || T("Récompense")), ic:k === "team" ? "people" : "gift"}); });
  return L.sort((a,b) => a.date === b.date ? b.at - a.at : (a.date < b.date ? 1 : -1));
}

function defisView(){
  const parent = !isKidUser(), viewer = actor();
  const tabs = [["jour",T("Aujourd'hui")],["recomp",T("Récompenses")],["equipe",T("Équipe")],["histo",T("Historique")]];
  if (!tabs.some(t => t[0] === UI.defTab)) UI.defTab = "jour";
  let h = "";
  // mode enfant sur un appareil partagé : « c'est qui ? »
  if (S.settings.parental.kidMode){ const kids = S.family.members.filter(m => m.role === "enfant");
    if (kids.length) h += `<div class="card tint"><div class="card-h"><h3>${T("C'est qui ?")}</h3></div><div class="pick">${kids.map(k => `<button data-act="kidAs" data-v="${k.id}" aria-pressed="${k.id===viewer.id}">${avatarOf(k,22)} ${esc(k.name)}</button>`).join("")}</div></div>`; }
  const people = parent ? players() : [viewer];
  h += `<div class="grid">${(people.length ? people : [viewer]).map(p => { const P = pointsOf(p.id), L = levelOf(P.earned);
    return `<button class="card c4" data-act="histOf" data-v="${p.id}" style="border:0;text-align:left;cursor:pointer;color:inherit;background:linear-gradient(160deg,var(--${p.color||"peach"}-bg),var(--surface))"><div class="row">${avatarOf(p,44)}<div class="grow"><b>${esc(p.name)}</b><div class="tiny muted">${T("Niveau {n}",{n:L.lvl})} · ${T("{n} pts cette semaine",{n:P.week})}</div></div><div style="text-align:right"><div class="points" style="color:var(--${p.color||"peach"}-ink)">${P.balance}</div><span class="tiny muted">${T("à dépenser")}</span></div></div><div class="levelbar"><i style="width:${clamp((P.earned-L.from)/(L.to-L.from)*100,2,100).toFixed(0)}%"></i></div><span class="tiny muted">${T("{n} points avant le niveau suivant",{n:Math.max(0,Math.round(L.to-P.earned))})} · ${T("Voir l'historique")}</span></button>`; }).join("")}</div>`;
  h += `<div class="seg">${tabs.map(([id,l]) => `<button data-act="defTab" data-v="${id}" aria-pressed="${UI.defTab===id}">${l}</button>`).join("")}</div>`;
  return h + ({jour:defisJour, recomp:defisRecomp, equipe:defisEquipe, histo:defisHisto}[UI.defTab])(parent, viewer);
}

function defisJour(parent, viewer){
  const d = today(), ds = iso(d); let h = "";
  const pending = S.completions.filter(x => x.status === "pending");
  if (parent && pending.length) h += `<div class="card"><div class="card-h"><h2>${T("À valider")}</h2><span class="chip butter">${pending.length}</span></div>${pending.map(x => { const t = S.tasks.find(y => y.id === x.taskId), m = member(x.memberId);
    return `<div class="taskrow">${avatarOf(m,32)}<div class="grow"><b>${esc(t?.title||"")}</b><div class="tiny muted">${esc(m?.name||"")} · ${fmtD(x.date,{day:"numeric",month:"short"})} · +${x.points}${x.team?` · ${T("en équipe")}`:""}</div></div><button class="btn sm kid" data-act="approve" data-v="${x.id}" aria-label="${T("Valider")}">${icon("check")}</button><button class="btn sm ghost" data-act="refuse" data-v="${x.id}" aria-label="${T("Refuser")}">${icon("x")}</button></div>`; }).join("")}</div>`;
  const list = S.tasks.filter(t => taskDueOn(t, d));
  const row = (t, who) => { const ms = who.map(member).filter(Boolean); if (!ms.length) return "";
    const cps = ms.map(m => completionOf(t.id, m.id, ds)), cp = cps.find(Boolean), team = t.team && ms.length > 1;
    const col = ms[0].color || "peach";
    return `<div class="taskrow"><div class="ic" style="background:var(--${col}-bg);color:var(--${col}-ink)">${icon(t.icon||"star")}</div><div class="grow"><b>${esc(t.title)}</b>${team?` <span class="chip teal">${icon("people").replace("<svg",'<svg style="width:13px;height:13px;vertical-align:-2px"')} ${T("équipe")}</span>`:""}<div class="tiny muted">${team ? ms.map(m => esc(m.name)).join(" + ") : esc(ms[0].name)} · +${t.points} ${T("pts")}${team?" "+T("chacun"):""}</div></div>${cp ? `<span class="chip ${cp.status==="ok"?"mint":cp.status==="pending"?"butter":"rose"}">${cp.status==="ok"?T("Fait !"):cp.status==="pending"?T("À valider"):T("Refusé")}</span>` : `<button class="btn sm kid" data-act="taskDone" data-v="${t.id}|${team ? ms.map(m=>m.id).join(",") : ms[0].id}">${icon("check")}${team?T("Fait ensemble"):T("Fait")}</button>`}</div>`; };
  h += `<div class="card"><div class="card-h"><h2>${T("Défis d'aujourd'hui")}</h2>${parent?`<button class="btn sm kid" data-act="taskForm">${icon("plus")}${T("Défi")}</button>`:""}</div>
    ${list.length ? list.map(t => { const who = (t.assignees||[]).filter(a => parent || a === viewer.id || (t.team && (t.assignees||[]).includes(viewer.id)));
      if (!who.length) return ""; return t.team && t.assignees.length > 1 ? row(t, t.assignees) : who.map(a => row(t, [a])).join(""); }).join("") : empty("star", parent ? T("Créez des défis : lit fait, lecture, devoirs, ménage… Les parents peuvent aussi s'en donner !") : T("Aucun défi aujourd'hui."))}</div>`;
  if (parent && S.tasks.length) h += `<div class="card"><div class="card-h"><h2>${T("Tous les défis")}</h2></div><div class="list">${S.tasks.map(t => `<button class="li" data-act="taskForm" data-v="${t.id}"><div class="ic" style="background:var(--surface2)">${icon(t.icon||"star")}</div><div class="grow"><div class="li-title">${esc(t.title)}${t.team?` · ${T("équipe")}`:""}</div><div class="small muted">+${t.points} · ${t.recur==="daily"?T("chaque jour"):t.recur==="weekly"?(t.days||[]).map(d=>WD()[d]).join(", "):fmtD(t.date)} · ${esc((t.assignees||[]).map(a=>member(a)?.name).filter(Boolean).join(", "))}</div></div></button>`).join("")}</div></div>`;
  return h;
}

function defisRecomp(parent, viewer){
  const solo = S.rewards.filter(r => !r.team);
  let h = `<div class="card"><div class="card-h"><h2>${T("Récompenses")}</h2>${parent?`<button class="btn sm ghost" data-act="rewardForm">${icon("plus")}${T("Récompense")}</button>`:""}</div>
    <p class="small muted">${parent ? T("Touchez « Échanger » puis choisissez qui dépense ses points (utile pour les enfants sans téléphone).") : T("Choisis une récompense : tes points seront dépensés quand un parent aura confirmé.")}</p>
    ${solo.length ? `<div class="grid">${solo.map(r => { const bal = pointsOf(viewer.id).balance, can = parent ? players().some(p => pointsOf(p.id).balance >= r.cost) : bal >= r.cost;
      return `<div class="reward c4">${icon("gift").replace("<svg",'<svg style="width:28px;height:28px;color:var(--peach-ink)"')}<b>${esc(r.title)}</b><span class="chip butter">${r.cost} ${T("pts")}</span>${!parent && !can ? `<div class="levelbar"><i style="width:${clamp(bal/r.cost*100,2,100).toFixed(0)}%"></i></div><span class="tiny muted">${T("Encore {n} points",{n:r.cost-Math.max(0,bal)})}</span>` : ""}<button class="btn sm ${can?"kid":"ghost"}" data-act="redeem" data-v="${r.id}" ${can?"":"disabled"}>${can?T("Échanger"):T("Pas encore assez de points")}</button>${parent?`<button class="btn sm line" data-act="delReward" data-v="${r.id}">${T("Retirer")}</button>`:""}</div>`; }).join("")}</div>` : `<p class="small muted">${T("Ajoutez des récompenses à échanger contre des points.")}</p>`}`;
  const pend = S.redemptions.filter(x => x.status === "pending");
  if (pend.length && parent) h += `<div class="sep"></div><b>${T("Échanges à confirmer")}</b>${pend.map(x => `<div class="taskrow">${avatarOf(member(x.memberId),30)}<div class="grow">${esc(S.rewards.find(r=>r.id===x.rewardId)?.title||"")} · ${esc(member(x.memberId)?.name||"")} · −${x.cost}</div><button class="btn sm kid" data-act="redeemOk" data-v="${x.id}" aria-label="${T("Confirmer")}">${icon("check")}</button><button class="btn sm ghost" data-act="redeemNo" data-v="${x.id}" aria-label="${T("Refuser")}">${icon("x")}</button></div>`).join("")}`;
  const mine = S.redemptions.filter(x => rKind(x) === "reward" && (parent || x.memberId === viewer.id)).sort((a,b) => (b.at||0) - (a.at||0)).slice(0, 8);
  if (mine.length) h += `<div class="sep"></div><b>${T("Derniers échanges")}</b><div class="list">${mine.map(x => `<div class="li">${avatarOf(member(x.memberId),30)}<div class="grow"><div class="li-title">${esc(S.rewards.find(r=>r.id===x.rewardId)?.title||T("Récompense"))}</div><div class="small muted">${esc(member(x.memberId)?.name||"")} · ${fmtD(x.date,{day:"numeric",month:"short"})}</div></div><span class="chip ${x.status==="ok"?"mint":x.status==="pending"?"butter":"rose"}">${x.status==="ok"?`−${x.cost}`:x.status==="pending"?T("En attente"):T("Refusé")}</span></div>`).join("")}</div>`;
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
        ${parent?`<button class="btn sm line" data-act="delReward" data-v="${r.id}">${T("Retirer")}</button>`:""}</div>`; }).join("") : empty("people", parent ? T("Créez un objectif d'équipe pour que les enfants s'entraident.") : T("Pas encore d'objectif d'équipe."))}</div>`;
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Entraide")}</span><h2>${T("Donner des points")}</h2></div><button class="btn sm kid" data-act="giftForm">${icon("heart")}${T("Donner")}</button></div><p class="small muted">${T("Un grand qui aide un plus petit à obtenir sa récompense, un merci pour un coup de main : on peut offrir une partie de ses points.")}</p></div>`;
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Défis d'équipe")}</span><h2>${T("Gagner ensemble")}</h2></div></div><p class="small muted">${T("Dans un défi, cochez « Défi d'équipe » : quand les enfants le font ensemble, chacun reçoit les points.")}</p>${S.tasks.filter(t => t.team).map(t => `<div class="taskrow">${icon(t.icon||"star")}<div class="grow"><b>${esc(t.title)}</b><div class="tiny muted">${esc((t.assignees||[]).map(a=>member(a)?.name).filter(Boolean).join(" + "))} · +${t.points} ${T("chacun")}</div></div></div>`).join("")}</div>`;
  return h;
}

function defisHisto(parent, viewer){
  const who = parent ? (UI.histWho || "all") : viewer.id;
  const log = pointsLog(who === "all" ? null : who);
  const base = UI.histMonth ? parseD(UI.histMonth) : new Date(today().getFullYear(), today().getMonth(), 1);
  const first = new Date(base.getFullYear(), base.getMonth(), 1), start = addDays(first, -((first.getDay()+6)%7));
  const mo = iso(first).slice(0,7), inMonth = log.filter(e => e.date.startsWith(mo) && !e.pending);
  const real = who === "all" ? inMonth.filter(e => !e.kind.startsWith("gift")) : inMonth;
  const gained = sum(real.filter(e => e.pts > 0).map(e => e.pts)), spent = -sum(real.filter(e => e.pts < 0).map(e => e.pts)), nTasks = inMonth.filter(e => e.kind === "gain").length;
  const sel = UI.histSel;
  let cells = "";
  for (let i = 0; i < 42; i++){
    const d = addDays(start, i), ds = iso(d), out = d.getMonth() !== base.getMonth(); if (i >= 35 && out && d.getDay() === 1) break;
    const de = log.filter(e => e.date === ds && !e.pending), g = de.filter(e => e.kind === "gain").length, sp = de.some(e => e.pts < 0 && e.kind !== "gift-out");
    cells += `<button class="day ${out?"out":""} ${ds===iso(today())?"today":""} ${ds===sel?"sel":""}" data-act="histDay" data-v="${ds}"><span class="num">${d.getDate()}</span><span class="dots">${g?`<i style="background:var(--mint);width:${g>2?14:6}px;border-radius:3px"></i>`:""}${sp?`<i style="background:var(--coral)"></i>`:""}${de.some(e => e.kind.startsWith("gift"))?`<i style="background:var(--rose)"></i>`:""}</span>${g?`<span class="tiny" style="color:var(--mint-ink);font-weight:800;position:relative">✓${g}</span>`:""}</button>`;
  }
  const dow = LANG === "en" ? ["M","T","W","T","F","S","S"] : ["L","M","M","J","V","S","D"];
  const shown = sel ? log.filter(e => e.date === sel) : log.filter(e => e.date.startsWith(mo));
  let h = parent ? `<div class="pick"><button data-act="histWho" data-v="all" aria-pressed="${who==="all"}">${T("Tout le monde")}</button>${players().map(p => `<button data-act="histWho" data-v="${p.id}" aria-pressed="${who===p.id}">${avatarOf(p,20)} ${esc(p.name)}</button>`).join("")}</div>` : "";
  h += `<div class="card"><div class="row between"><h2>${fmtD(first,{month:"long",year:"numeric"})}</h2><div class="row"><button class="icon-btn" data-act="histNav" data-v="-1" aria-label="${T("Mois précédent")}">${icon("left")}</button><button class="icon-btn" data-act="histNav" data-v="1" aria-label="${T("Mois suivant")}">${icon("right")}</button></div></div>
    <div class="stats"><div class="stat"><span class="muted tiny">${T("Défis réussis")}</span><div class="v" style="color:var(--mint-ink)">${nTasks}</div></div><div class="stat"><span class="muted tiny">${T("Points gagnés")}</span><div class="v">+${gained}</div></div><div class="stat"><span class="muted tiny">${T("Points dépensés")}</span><div class="v" style="color:var(--coral-ink)">−${spent}</div></div></div>
    <div class="cal">${dow.map(x => `<span class="dow">${x}</span>`).join("")}${cells}</div>
    <div class="row tiny muted" style="gap:12px;flex-wrap:wrap"><span><i class="legend" style="background:var(--mint)"></i> ${T("défis réussis")}</span><span><i class="legend" style="background:var(--coral)"></i> ${T("points dépensés")}</span><span><i class="legend" style="background:var(--rose)"></i> ${T("dons")}</span></div></div>`;
  h += `<div class="card"><div class="card-h"><h2>${sel ? fmtD(sel,{weekday:"long",day:"numeric",month:"long"}) : T("Ce mois-ci")}</h2>${sel?`<button class="btn sm ghost" data-act="histDay" data-v="">${T("Tout le mois")}</button>`:""}</div>
    ${shown.length ? `<div class="list">${shown.map(e => { const m = member(e.who); return `<div class="li"><div class="ic" style="background:var(--${e.pts>0?"mint":"coral"}-bg);color:var(--${e.pts>0?"mint":"coral"}-ink)">${icon(e.ic)}</div><div class="grow"><div class="li-title">${esc(e.title)}${e.team?` · ${T("en équipe")}`:""}</div><div class="small muted">${who==="all"&&m?esc(m.name)+" · ":""}${fmtD(e.date,{day:"numeric",month:"short"})}${e.pending?" · "+T("en attente"):""}</div></div><b class="num" style="color:var(--${e.pts>0?"mint":"coral"}-ink)">${e.pts>0?"+":"−"}${Math.abs(e.pts)}</b></div>`; }).join("")}</div>` : empty("cal", T("Rien ce mois-ci."))}</div>`;
  return h;
}

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
  histOf: v => { UI.defTab = "histo"; UI.histWho = v; UI.histSel = null; render(); },
  histWho: v => { UI.histWho = v; render(); }, histDay: v => { UI.histSel = v || null; render(); },
  histNav: v => { const b = UI.histMonth ? parseD(UI.histMonth) : new Date(today().getFullYear(), today().getMonth(), 1); UI.histMonth = iso(addMonths(b, +v)); UI.histSel = null; render(); },
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
  taskDone: v => { const [tid, ids] = v.split("|"), t = S.tasks.find(x => x.id === tid), mids = ids.split(","), auto = !isKidUser() || S.settings.parental.allow.selfApprove;
    mids.forEach(mid => { if (!completionOf(tid, mid, iso(today()))) S.completions.push({id:uid(), taskId:tid, memberId:mid, date:iso(today()), points:t.points, status: auto ? "ok" : "pending", at:Date.now(), team: mids.length > 1}); });
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
