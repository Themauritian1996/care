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
    ${aiReady() && !isKidUser() ? `<div class="row" style="flex-wrap:wrap">${miss ? `<button class="btn sm ghost" data-act="nutEstimateAll">${icon("spark")}${T("Estimer {n} repas sans nutriments",{n:miss})}</button>` : ""}<button class="btn sm kid" data-act="nutAdvice">${icon("spark")}${T("Conseils nutrition (IA)")}</button></div>` : ""}</div>`;
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
async function nutAdvice(c){
  return aiJob("nutrition", T("Conseils nutrition · {n}",{n:c.nick||c.name}), async () => {
    const foods = c.logs.filter(l => l.type === "solid" && Date.now() - l.t < 7*DAY).flatMap(l => (l.data.items||[]).map(i => i.name)).slice(0, 60).join(", ");
    const r = await gemini({system:AI_SYSTEM(), contents:[{role:"user", parts:[{text:`${kidContext(c)}\nApports moyens sur 7 jours vs cibles : ${nutSummary(c)}.\nAliments notés : ${foods||"peu"}.\nDonne : 1) ce qui va bien, 2) les écarts importants (seulement s'ils sont nets, en tenant compte que l'estimation est approximative et que des repas peuvent manquer), 3) 4 idées concrètes de repas ou collations adaptées à l'âge et au Guide alimentaire canadien pour combler les écarts, 4) portions indicatives pour l'âge. Rassurant, sans culpabiliser, pas de régime restrictif. 200 à 300 mots.`}]}]});
    const e = aiHist("nutrition", T("Conseils nutrition · {n}",{n:c.nick||c.name}), r.text, {kid:c.id}); return {histId:e.id};
  }, {kid:c.id});
}
Object.assign(ACT, {
  nutMode: v => { UI.nutMode = v; render(); },
  nutEstimateAll: () => { const c = child(); const logs = c.logs.filter(l => l.type === "solid" && Date.now() - l.t < 7*DAY && (l.data.items||[]).some(i => !i.nut)); if (logs.length) nutEstimateJob(c, logs); },
  nutAdvice: () => nutAdvice(child()),
});
const mealKindAt = t => { const h = new Date(t).getHours(); return h < 10 ? "Déjeuner" : h >= 11 && h < 14 ? "Dîner" : h >= 17 && h < 21 ? "Souper" : "Collation"; };
