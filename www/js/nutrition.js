/* =========================================================================
   TRIBE — nutrition : nutriments estimés par repas, cibles selon l'âge,
   le sexe et le poids (apports nutritionnels de référence, Santé Canada /
   National Academies), suivi quotidien et hebdomadaire, conseils de Gemini.
   ========================================================================= */
const NUTS = [
  {k:"kcal", l:"Énergie", u:"kcal", d:0, c:"peach"},
  {k:"prot", l:"Protéines", u:"g", d:0, c:"coral"},
  {k:"carb", l:"Glucides", u:"g", d:0, c:"butter"},
  {k:"fat", l:"Lipides", u:"g", d:0, c:"lilac"},
  {k:"fiber", l:"Fibres", u:"g", d:0, c:"mint"},
  {k:"sugar", l:"Sucres", u:"g", d:0, c:"rose"},
  {k:"calcium", l:"Calcium", u:"mg", d:0, c:"sky"},
  {k:"iron", l:"Fer", u:"mg", d:1, c:"teal"},
  {k:"sodium", l:"Sodium", u:"mg", d:0, c:"butter", max:true},
];
/* Cibles par jour. Énergie : équations EER (IOM 2005, activité « peu active ») si poids et taille connus, sinon valeurs typiques. */
function nutTargets(c){
  const m = ageMonths(c), y = m / 12, F = c.sex === "F";
  const g = [...(c.growth||[])].sort((a,b) => a.date < b.date ? 1 : -1), wt = Number(g.find(x => x.weight)?.weight) || null, ht = Number(g.find(x => x.height)?.height) / 100 || null;
  let kcal;
  if (wt && ht && y >= 3){ const PA = F ? 1.16 : 1.13; kcal = F ? 135.3 - 30.8*y + PA*(10*wt + 934*ht) + (y < 9 ? 20 : 25) : 88.5 - 61.9*y + PA*(26.7*wt + 903*ht) + (y < 9 ? 20 : 25); }
  else if (wt && y >= 1) kcal = 89*wt - 100 + 20;
  else kcal = y < 4 ? 1000 + (y-1)*150 : y < 9 ? 1400 : y < 14 ? (F ? 1600 : 1800) : (F ? 1800 : 2400);
  kcal = Math.round(kcal / 10) * 10;
  const protPerKg = y < 4 ? 1.05 : y < 14 ? 0.95 : 0.85;
  const prot = wt ? Math.round(protPerKg * wt) : (y < 4 ? 13 : y < 9 ? 19 : y < 14 ? 34 : F ? 46 : 52);
  const fatPct = y < 4 ? [0.30, 0.40] : [0.25, 0.35];
  return {
    kcal, prot,
    carb:[Math.round(kcal*0.45/4), Math.round(kcal*0.65/4)], fat:[Math.round(kcal*fatPct[0]/9), Math.round(kcal*fatPct[1]/9)],
    fiber: y < 4 ? 19 : y < 9 ? 25 : y < 14 ? (F ? 26 : 31) : (F ? 26 : 38),
    sugar: y < 2 ? 0 : Math.round(kcal*0.10/4),
    calcium: y < 4 ? 700 : y < 9 ? 1000 : 1300,
    iron: y < 4 ? 7 : y < 9 ? 10 : y < 14 ? 8 : (F ? 15 : 11),
    sodium: y < 4 ? 1200 : y < 9 ? 1500 : y < 14 ? 1800 : 2300,
    basis: wt ? T("selon {w} kg{h}",{w:fmtNum(wt,1), h:ht?` · ${Math.round(ht*100)} cm`:""}) : T("valeurs typiques pour l'âge (ajoutez poids et taille pour plus de précision)"),
  };
}
function dayNut(c, d){
  const t = {n:0, miss:0}; NUTS.forEach(x => t[x.k] = 0);
  dayLogs(c, d).filter(l => l.type === "solid").forEach(l => (l.data.items||[]).forEach(it => { if (it.nut){ t.n++; NUTS.forEach(x => t[x.k] += Number(it.nut[x.k])||0); } else t.miss++; }));
  return t;
}
function weekNut(c){ const days = Array.from({length:7}, (_,i) => dayNut(c, addDays(today(), -i))).filter(d => d.n > 0); const a = {days:days.length}; NUTS.forEach(x => a[x.k] = days.length ? sum(days.map(d => d[x.k])) / days.length : 0); return a; }
function nutSummary(c){ const w = weekNut(c), t = nutTargets(c); if (!w.days) return "aucun repas avec nutriments"; return NUTS.map(x => `${x.k} ${Math.round(w[x.k])}${x.u} (cible ${Array.isArray(t[x.k]) ? t[x.k].join("-") : t[x.k]}${x.max?" max":""})`).join(", ") + ` sur ${w.days} jour(s)`; }
const tgtVal = (t, k) => Array.isArray(t[k]) ? (t[k][0] + t[k][1]) / 2 : t[k];
function nutBar(x, v, t){
  const tv = tgtVal(t, x.k), p = tv ? v / tv : 0, over = x.max ? p > 1 : (x.k === "sugar" && tv === 0 ? v > 0 : p > 1.35);
  const label = Array.isArray(t[x.k]) ? `${t[x.k][0]}–${t[x.k][1]}` : (x.k === "sugar" && !tv ? T("éviter les sucres ajoutés") : `${x.max ? "≤ " : ""}${fmtNum(t[x.k], x.d)}`);
  return `<div class="nutrow"><div class="row between small"><b>${T(x.l)}</b><span class="num ${over?"warn":""}">${fmtNum(v, x.d)} / ${label} ${x.u}</span></div><div class="dombar"><i style="width:${clamp(p*100,1,100).toFixed(0)}%;background:var(--${over?"danger":x.c})"></i></div></div>`;
}
function nutritionCard(c){
  const m = ageMonths(c);
  if (m < 12) return `<div class="card"><div class="card-h"><h2>${T("Nutrition")}</h2></div><p class="small muted">${T("Avant 1 an, le lait (maternel ou préparation) couvre l'essentiel des besoins ; les aliments servent surtout à découvrir textures et goûts, et à apporter du fer. Le suivi des nutriments s'active à 1 an.")}</p></div>`;
  const t = nutTargets(c), mode = UI.nutMode || "jour", d = mode === "jour" ? dayNut(c, today()) : weekNut(c);
  const miss = c.logs.filter(l => l.type === "solid" && Date.now() - l.t < 7*DAY && (l.data.items||[]).some(i => !i.nut)).length;
  const macro = d.kcal ? [["prot",4,"coral"],["carb",4,"butter"],["fat",9,"lilac"]].map(([k,f,col]) => ({k, col, p:d[k]*f/Math.max(1, d.prot*4+d.carb*4+d.fat*9)})) : [];
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Nutriments estimés")}</span><h2>${T("Nutrition")}</h2></div><div class="seg" style="width:auto"><button data-act="nutMode" data-v="jour" aria-pressed="${mode==="jour"}">${T("Aujourd'hui")}</button><button data-act="nutMode" data-v="semaine" aria-pressed="${mode==="semaine"}">${T("Moy. 7 j")}</button></div></div>
    ${(mode === "jour" ? d.n : d.days) ? `${macro.length ? `<div class="macro">${macro.map(x => `<i style="flex:${x.p.toFixed(3)};background:var(--${x.col})" title="${T(NUTS.find(n=>n.k===x.k).l)} ${Math.round(x.p*100)} %"></i>`).join("")}</div><div class="row tiny muted" style="gap:12px;flex-wrap:wrap">${macro.map(x => `<span><i class="lgd" style="background:var(--${x.col})"></i>${T(NUTS.find(n=>n.k===x.k).l)} ${Math.round(x.p*100)} %</span>`).join("")}</div>` : ""}
      <div class="stack" style="gap:8px">${NUTS.map(x => nutBar(x, d[x.k]||0, t)).join("")}</div>`
      : `<p class="small muted">${T("Notez des repas : les nutriments sont estimés automatiquement avec Gemini (photo, étiquette ou saisie).")}</p>`}
    <p class="tiny muted">${T("Cibles quotidiennes : {b}. Apports nutritionnels de référence (Santé Canada) ; ce sont des moyennes sur plusieurs jours, pas des objectifs à atteindre chaque jour.",{b:t.basis})}</p>
    ${aiReady() && !isKidUser() ? `<div class="sep"></div><span class="eyebrow">${icon("spark").replace("<svg",'<svg style="width:12px;height:12px;vertical-align:-1px"')} ${T("Avis nutrition de Gemini")}</span>
      <div class="row" style="flex-wrap:wrap;gap:6px"><span class="small muted">${T("Période")}</span>${[7,14,30].map(d => `<button class="chip ${(UI.nutDays||7)===d?"lilac":""}" data-act="nutPeriod" data-v="${d}">${T("{n} j",{n:d})}</button>`).join("")}</div>
      <div class="row" style="flex-wrap:wrap">${miss ? `<button class="btn sm ghost" data-act="nutEstimateAll">${icon("spark")}${T("Estimer {n} repas sans nutriments",{n:miss})}</button>` : ""}<button class="btn sm kid" data-act="nutAdvice">${icon("spark")}${T("Avoir un avis maintenant")}</button></div>
      <div class="row" style="flex-wrap:wrap;gap:6px"><span class="small muted">${T("Avis automatique pour {n}",{n:esc(c.nick||c.name)})}</span>${[["jamais",T("Jamais")],["semaine",T("Chaque semaine")],["mois",T("Chaque mois")]].map(([k,l]) => `<button class="chip ${(c.nutAuto||"jamais")===k?"lilac":""}" data-act="nutAutoSet" data-v="${k}">${l}</button>`).join("")}</div>
      ${(S.aiHist||[]).filter(e => e.cat === "nutrition" && e.kid === c.id && e.text).slice(0,1).map(e => `<button class="li" data-act="aiHistOpen" data-v="${e.id}" style="width:100%;text-align:left;background:none;border-left:0;border-right:0;border-bottom:0;color:inherit;font:inherit;cursor:pointer"><div class="ic" style="background:var(--lilac-bg);color:var(--lilac-ink)">${icon("spark")}</div><div class="grow"><div class="li-title">${T("Dernier avis")}</div><div class="small muted">${fmtD(new Date(e.at),{day:"numeric",month:"long"})}</div></div>${icon("right")}</button>`).join("")}` : ""}</div>`;
}
/* estimation des nutriments d'un repas noté à la main */
async function nutEstimate(c, log){
  const items = (log.data.items||[]).filter(i => !i.nut); if (!items.length) return;
  const schema = {type:"OBJECT", properties:{items:{type:"ARRAY", items:{type:"OBJECT", properties:{name:{type:"STRING"}, nut:NUT_SCHEMA}, required:["name","nut"]}}}, required:["items"]};
  const r = await gemini({tier:"fast", json:schema, temperature:0.2, contents:[{role:"user", parts:[{text:`Estime les nutriments de chaque aliment pour la quantité indiquée (portion d'un enfant de ${ageLabel(ageMonths(c))} si la quantité manque), avec le Fichier canadien sur les éléments nutritifs comme référence. ${NUT_HELP}\nAliments : ${items.map(i => `${i.name} — ${i.qty||"portion habituelle"}`).join(" ; ")}`}]}]});
  const out = parseJSON(r.text).items || [];
  items.forEach((it, i) => { const o = out.find(x => x.name?.toLowerCase() === it.name.toLowerCase()) || out[i]; if (o?.nut) it.nut = o.nut; });
}
function nutEstimateJob(c, logs){
  return aiJob("nutrition", T("Nutriments de {n} repas",{n:logs.length}), async () => { for (const l of logs) await nutEstimate(c, l); save(); if (UI.view === "kid") softRender(); return {open:() => { go("kid"); UI.kidTab = "repas"; render(); }}; }, {kid:c.id});
}
async function nutAdvice(c, days = UI.nutDays || 7, quiet){
  return aiJob("nutrition", T("Conseils nutrition · {n}",{n:c.nick||c.name}), async () => {
    const L = c.logs.filter(l => l.type === "solid" && Date.now() - l.t < days*DAY);
    const foods = L.map(l => `${iso(new Date(l.t))} ${mealKindOf(l)} : ${(l.data.items||[]).map(i => `${i.name}${i.qty?` (${i.qty})`:""}`).join(", ")}`).slice(-80).join("\n");
    const r = await gemini({system:AI_SYSTEM(), contents:[{role:"user", parts:[{text:`${kidContext(c)}\nPériode : ${days} jours. Apports moyens sur 7 jours vs cibles : ${nutSummary(c)}.\nRepas notés (date, moment, aliments) :\n${foods||"peu"}\nDonne : 1) ce qui va bien, 2) les écarts importants (seulement s'ils sont nets, en tenant compte que l'estimation est approximative et que des repas peuvent manquer), 3) 4 idées concrètes de repas ou collations adaptées à l'âge et au Guide alimentaire canadien pour combler les écarts, 4) portions indicatives pour l'âge. Rassurant, sans culpabiliser, pas de régime restrictif. 200 à 300 mots.`}]}]});
    const e = aiHist("nutrition", T("Conseils nutrition · {n}",{n:c.nick||c.name}), r.text, {kid:c.id}); return {histId:e.id};
  }, {kid:c.id, quiet});
}
Object.assign(ACT, {
  nutMode: v => { UI.nutMode = v; render(); },
  nutEstimateAll: () => { const c = child(); const logs = c.logs.filter(l => l.type === "solid" && Date.now() - l.t < 7*DAY && (l.data.items||[]).some(i => !i.nut)); if (logs.length) nutEstimateJob(c, logs); },
  nutAdvice: () => nutAdvice(child()),
});
const mealKindAt = t => { const h = new Date(t).getHours(); return h < 10 ? "Déjeuner" : h >= 11 && h < 14 ? "Dîner" : h >= 17 && h < 21 ? "Souper" : "Collation"; };

/* ---------- journal des repas : calendrier par jour, classé par moment ---------- */
const MEAL_KINDS = ["Déjeuner","Dîner","Souper","Collation"];
const mealKindOf = l => MEAL_KINDS.includes(l.data?.meal) ? l.data.meal : mealKindAt(l.t);
const logKcal = l => sum((l.data?.items||[]).map(i => Number(i.nut?.kcal)||0));
function mealJournalCard(c){
  const sel = UI.mealDay || iso(today()), selD = parseD(sel), w0 = addDays(selD, -((selD.getDay()+6)%7));
  const days = Array.from({length:7}, (_,i) => addDays(w0, i));
  const meals = d => dayLogs(c, d).filter(l => l.type === "solid");
  const strip = days.map(d => { const ms = meals(d), k = sum(ms.map(logKcal)), ds = iso(d);
    return `<button class="mday ${ds===sel?"on":""} ${ds===iso(today())?"today":""}" data-act="mealDay" data-v="${ds}"><span class="tiny">${d.toLocaleDateString(LOCALE(),{weekday:"short"}).replace(".","")}</span><b>${d.getDate()}</b><span class="tiny">${ms.length ? (k ? Math.round(k) : ms.length+" ✓") : "·"}</span></button>`; }).join("");
  const ms = meals(selD), N = dayNut(c, selD), t = nutTargets(c), kids = ageMonths(c) >= 12;
  const groups = MEAL_KINDS.map(k => [k, ms.filter(l => mealKindOf(l) === k).sort((a,b) => a.t - b.t)]);
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Calendrier des repas")}</span><h2 class="cap">${fmtD(selD,{weekday:"long",day:"numeric",month:"long"})}</h2></div><div class="row"><button class="icon-btn" data-act="mealWeek" data-v="-7" aria-label="${T("Semaine précédente")}">${icon("left")}</button><button class="icon-btn" data-act="mealWeek" data-v="7" aria-label="${T("Semaine suivante")}">${icon("right")}</button></div></div>
    <div class="mstrip">${strip}</div>
    ${ms.length ? groups.filter(([,L]) => L.length).map(([k, L]) => `<div><span class="eyebrow">${T(k)}</span><div class="list">${L.map(l => `<button class="li" data-act="editLog" data-v="${l.id}" style="width:100%;text-align:left;background:none;border-left:0;border-right:0;border-bottom:0;color:inherit;font:inherit;cursor:pointer"><div class="ic" style="background:var(--mint-bg);color:var(--mint-ink)">${icon("spoon")}</div><div class="grow"><div class="li-title">${esc((l.data.items||[]).map(i => i.name).join(", "))}</div><div class="small muted">${fmtT(l.t)}${(l.data.items||[]).some(i=>i.qty)?" · "+esc(l.data.items.map(i => i.qty).filter(Boolean).join(", ")):""}</div></div>${logKcal(l)?`<span class="small num">${Math.round(logKcal(l))} kcal</span>`:""}</button>`).join("")}</div></div>`).join("")
      + (kids && N.n ? `<div class="row tiny muted" style="flex-wrap:wrap;gap:10px"><span><b>${Math.round(N.kcal)}</b> / ${t.kcal} kcal</span><span><b>${Math.round(N.prot)}</b> / ${t.prot} g ${T("prot.")}</span><span><b>${Math.round(N.fiber)}</b> / ${t.fiber} g ${T("fibres")}</span><span><b>${fmtNum(N.iron,1)}</b> / ${t.iron} mg ${T("fer")}</span><span><b>${Math.round(N.calcium)}</b> / ${t.calcium} mg ${T("calcium")}</span></div>` : "")
      : `<p class="small muted">${T("Aucun repas noté ce jour-là.")}</p>`}
    ${isKidUser() ? "" : `<button class="btn sm ghost" data-act="mealAddDay" data-v="${sel}">${icon("plus")}${T("Ajouter un repas ce jour-là")}</button>`}</div>`;
}
/* tendances sur plusieurs semaines : par moment, par groupe alimentaire, aliments les plus fréquents */
function mealTrendsCard(c){
  const n = UI.mealSpan || 30, since = Date.now() - n*DAY, L = c.logs.filter(l => l.type === "solid" && l.t >= since);
  if (!L.length) return "";
  const byKind = MEAL_KINDS.map(k => { const x = L.filter(l => mealKindOf(l) === k); return {k, n:x.length, kcal: x.length ? sum(x.map(logKcal))/x.length : 0}; });
  const G = {}, foods = {}; L.forEach(l => (l.data.items||[]).forEach(i => { G[i.group] = (G[i.group]||0) + 1; const nm = i.name.trim().toLowerCase(); foods[nm] = (foods[nm]||0) + 1; }));
  const tot = sum(Object.values(G)) || 1, top = Object.entries(foods).sort((a,b) => b[1] - a[1]).slice(0, 10);
  const daysWith = new Set(L.map(l => dayKey(l.t))).size;
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Au long cours")}</span><h2>${T("Tendances des repas")}</h2></div><div class="seg" style="width:auto">${[30,90,365].map(d => `<button data-act="mealSpan" data-v="${d}" aria-pressed="${n===d}">${d===365?T("1 an"):T("{n} j",{n:d})}</button>`).join("")}</div></div>
    <p class="small muted">${T("{m} repas notés sur {d} jours ({p} % des jours).",{m:L.length, d:n, p:Math.round(daysWith/n*100)})}</p>
    <div class="tbl"><table><thead><tr><th>${T("Moment")}</th><th>${T("Repas")}</th><th>${T("kcal moy.")}</th></tr></thead><tbody>${byKind.map(x => `<tr><td>${T(x.k)}</td><td class="num">${x.n}</td><td class="num">${x.kcal?Math.round(x.kcal):"—"}</td></tr>`).join("")}</tbody></table></div>
    <div class="stack" style="gap:6px">${Object.entries(FOOD_GROUPS).map(([k,g]) => { const p = (G[k]||0)/tot; return `<div><div class="row between small"><b style="color:var(--${g.color}-ink)">${T(g.label)}</b><span class="muted num">${Math.round(p*100)} %</span></div><div class="dombar"><i style="width:${(p*100).toFixed(0)}%;background:var(--${g.color})"></i></div></div>`; }).join("")}</div>
    <div><span class="eyebrow">${T("Aliments les plus fréquents")}</span><div class="pick" style="margin-top:6px">${top.map(([nm, k]) => `<span class="chip">${esc(nm)} · ${k}</span>`).join("")}</div></div></div>`;
}
Object.assign(ACT, {
  mealDay: v => { UI.mealDay = v; render(); },
  mealWeek: v => { UI.mealDay = iso(addDays(parseD(UI.mealDay || iso(today())), +v)); render(); },
  mealSpan: v => { UI.mealSpan = +v; render(); },
  mealAddDay: v => { const d = parseD(v); d.setHours(12, 0, 0, 0); mealForm({items:[{name:"", group:"legfruits", qty:""}], t:Math.min(Date.now(), d.getTime())}); },
  nutPeriod: v => { UI.nutDays = +v; render(); },
  nutAutoSet: v => { const c = child(); c.nutAuto = v; commit(v === "jamais" ? T("Avis automatique désactivé") : T("Avis nutrition automatique activé")); },
});
