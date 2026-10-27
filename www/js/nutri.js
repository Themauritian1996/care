/* =========================================================================
   TRIBE — onglet Nutrition (façon journal alimentaire) :
   - base d'aliments courants avec unités (g, ml, unité, tasse, c. à soupe…)
     et valeurs nutritives approximatives par 100 g (Fichier canadien sur
     les éléments nutritifs / USDA, arrondies) : calcul immédiat, sans IA
   - résumé du jour : énergie, macronutriments, fibres, sucres, calcium, fer, sodium
   - portions du Guide alimentaire par groupe selon l'âge
   - graphiques par jour, semaine, mois, année + moyennes
   - aliments en découverte (essais), recommandations selon les données
   - ajout au journal depuis un menu ou une recette de l'IA (pour qui, combien)
   ========================================================================= */
/* nom : [groupe, unité par défaut, quantité par défaut, grammes par unité par défaut,
          kcal, prot, gluc, lip, fibres, sucres, calcium mg, fer mg, sodium mg] (par 100 g) */
const FOOD_DB = {
  "Bâtonnets de concombre":["legfruits","tasse",0.5,120, 15,0.7,3.6,0.1,0.5,1.7,16,0.3,2],
  "Petits fruits":["legfruits","tasse",0.5,150, 50,0.7,12,0.3,3,7,15,0.4,1],
  "Banane":["legfruits","unité",1,118, 89,1.1,23,0.3,2.6,12,5,0.3,1],
  "Brocoli vapeur":["legfruits","tasse",0.5,156, 35,2.4,7,0.4,3.3,1.4,40,0.7,41],
  "Purée de courge":["legfruits","tasse",0.5,245, 40,1,10,0.1,2,2,25,0.5,4],
  "Patate douce rôtie":["legfruits","unité",0.5,114, 90,2,21,0.2,3.3,6.5,38,0.7,36],
  "Pomme en lamelles":["legfruits","unité",1,182, 52,0.3,14,0.2,2.4,10,6,0.1,1],
  "Tomates cerises coupées en 4":["legfruits","tasse",0.5,149, 18,0.9,3.9,0.2,1.2,2.6,10,0.3,5],
  "Carottes":["legfruits","unité",1,61, 41,0.9,10,0.2,2.8,4.7,33,0.3,69],
  "Pomme":["legfruits","unité",1,182, 52,0.3,14,0.2,2.4,10,6,0.1,1],
  "Poire":["legfruits","unité",1,178, 57,0.4,15,0.1,3.1,10,9,0.2,1],
  "Orange":["legfruits","unité",1,131, 47,0.9,12,0.1,2.4,9,40,0.1,0],
  "Fraises":["legfruits","tasse",0.5,152, 32,0.7,7.7,0.3,2,4.9,16,0.4,1],
  "Bleuets":["legfruits","tasse",0.5,148, 57,0.7,14,0.3,2.4,10,6,0.3,1],
  "Raisins coupés en 4":["legfruits","tasse",0.5,151, 69,0.7,18,0.2,0.9,16,10,0.4,2],
  "Mangue":["legfruits","tasse",0.5,165, 60,0.8,15,0.4,1.6,14,11,0.2,1],
  "Avocat":["legfruits","unité",0.5,150, 160,2,8.5,15,6.7,0.7,12,0.6,7],
  "Petits pois":["legfruits","tasse",0.5,160, 84,5.4,16,0.2,5.5,5.9,27,1.5,3],
  "Haricots verts":["legfruits","tasse",0.5,125, 35,1.9,7.9,0.3,3.2,3.6,44,0.7,1],
  "Maïs":["legfruits","tasse",0.5,164, 96,3.4,21,1.5,2.4,4.5,3,0.5,1],
  "Épinards":["legfruits","tasse",0.5,180, 23,3,3.8,0.3,2.4,0.4,136,3.6,70],
  "Poivron":["legfruits","unité",0.5,119, 26,1,6,0.3,2.1,4.2,7,0.4,4],
  "Chou-fleur":["legfruits","tasse",0.5,124, 23,1.8,4.1,0.5,2.3,2,16,0.3,15],
  "Compote de pommes":["legfruits","portion",1,113, 42,0.2,11,0.1,1.1,9,3,0.1,2],
  "Salade":["legfruits","tasse",1,47, 15,1.4,2.9,0.2,1.3,0.8,36,0.9,28],
  "Melon":["legfruits","tasse",0.5,160, 34,0.8,8,0.2,0.9,8,9,0.2,16],
  "Œufs brouillés":["proteines","unité",1,61, 149,10,1.6,11,0,1.4,66,1.3,145],
  "Lentilles":["proteines","tasse",0.5,198, 116,9,20,0.4,7.9,1.8,19,3.3,2],
  "Poulet effiloché":["proteines","g",60,1, 165,31,0,3.6,0,0,15,1,74],
  "Tofu en cubes":["proteines","g",60,1, 144,15.8,2.8,8.7,2.3,0.6,350,2.7,14],
  "Saumon":["proteines","g",60,1, 206,22,0,12,0,0,15,0.3,61],
  "Beurre d'arachide (mince couche)":["proteines","c. à soupe",1,16, 588,25,20,50,6,9,49,1.9,17],
  "Pois chiches écrasés":["proteines","tasse",0.25,164, 164,8.9,27,2.6,7.6,4.8,49,2.9,7],
  "Yogourt nature":["laitiers","portion",1,175, 61,3.5,4.7,3.3,0,4.7,121,0.1,46],
  "Bœuf haché":["proteines","g",60,1, 250,26,0,15,0,0,20,2.6,75],
  "Porc":["proteines","g",60,1, 242,27,0,14,0,0,19,0.9,62],
  "Dinde":["proteines","g",60,1, 189,29,0,7,0,0,14,1.4,70],
  "Thon":["proteines","g",60,1, 116,26,0,0.8,0,0,11,1.5,247],
  "Crevettes":["proteines","g",60,1, 99,24,0.2,0.3,0,0,70,0.5,111],
  "Haricots noirs":["proteines","tasse",0.25,172, 132,8.9,24,0.5,8.7,0.3,27,2.1,1],
  "Hoummos":["proteines","c. à soupe",2,15, 166,7.9,14,9.6,6,0.3,38,2.4,379],
  "Edamames":["proteines","tasse",0.25,155, 121,12,8.9,5.2,5.2,2.2,63,2.3,6],
  "Œuf cuit dur":["proteines","unité",1,50, 155,13,1.1,11,0,1.1,50,1.2,124],
  "Jambon":["proteines","g",30,1, 145,21,1.5,5.5,0,1,8,0.9,1200],
  "Fromage cottage":["laitiers","portion",1,125, 98,11,3.4,4.3,0,2.7,83,0.1,364],
  "Noix moulues":["proteines","c. à soupe",1,7, 654,15,14,65,6.7,2.6,98,2.9,2],
  "Gruau":["grains","tasse",0.5,234, 71,2.5,12,1.5,1.7,0.3,9,0.9,4],
  "Pain de grains entiers":["grains","unité",1,32, 252,12,43,3.5,6,4.4,161,2.5,450],
  "Pâtes de blé entier":["grains","tasse",0.5,140, 149,6,30,1.7,3.9,0.8,15,1.7,4],
  "Riz brun":["grains","tasse",0.5,195, 123,2.7,26,1,1.6,0.2,3,0.6,4],
  "Quinoa":["grains","tasse",0.5,185, 120,4.4,21,1.9,2.8,0.9,17,1.5,7],
  "Orge":["grains","tasse",0.5,157, 123,2.3,28,0.4,3.8,0.3,11,1.3,3],
  "Galette de riz":["grains","unité",1,9, 387,8,81,2.8,4.2,0.9,11,1.5,29],
  "Céréales enrichies en fer":["grains","tasse",0.5,28, 376,12,73,6.7,10,4.4,357,29,500],
  "Bagel":["grains","unité",0.5,98, 257,10,50,1.6,2.2,5,20,3.4,450],
  "Pain pita":["grains","unité",0.5,60, 275,9,56,1.2,2.2,1.3,86,2.6,536],
  "Tortilla":["grains","unité",1,45, 304,8,50,8,3.5,2,120,3.5,600],
  "Couscous":["grains","tasse",0.5,157, 112,3.8,23,0.2,1.4,0.1,8,0.4,5],
  "Craquelins de blé entier":["grains","g",20,1, 440,9,70,14,10,1,30,3,600],
  "Muffin maison":["grains","unité",1,70, 370,6,52,15,2,25,80,1.5,350],
  "Crêpes":["grains","unité",1,40, 227,6.4,28,9.7,1,5,220,1.8,439],
  "Riz blanc":["grains","tasse",0.5,158, 130,2.7,28,0.3,0.4,0,10,0.2,1],
  "Pâtes":["grains","tasse",0.5,140, 158,5.8,31,0.9,1.8,0.6,7,1.3,1],
  "Pain blanc":["grains","unité",1,28, 266,8.9,49,3.3,2.7,5.7,151,3.6,490],
  "Lait 3,25 % (dès 9-12 mois)":["laitiers","ml",125,1, 61,3.2,4.8,3.3,0,5,113,0,43],
  "Fromage râpé":["laitiers","g",15,1, 403,25,1.3,33,0,0.5,721,0.7,621],
  "Yogourt":["laitiers","portion",1,100, 97,3.5,13,3,0,13,120,0.1,40],
  "Boisson de soya enrichie (après 2 ans)":["laitiers","ml",125,1, 33,2.8,1.8,1.6,0.4,0.6,120,0.4,38],
  "Lait 2 %":["laitiers","ml",125,1, 50,3.3,4.8,2,0,5,120,0,44],
  "Fromage cheddar":["laitiers","g",20,1, 403,25,1.3,33,0,0.5,721,0.7,621],
  "Fromage en ficelle":["laitiers","unité",1,21, 300,24,3,21,0,1,700,0.2,700],
  "Kéfir":["laitiers","ml",125,1, 52,3.6,4.5,2,0,4.5,120,0,40],
  "Boisson d'avoine enrichie":["laitiers","ml",125,1, 48,1,7,1.5,0.8,4,120,0.3,42],
  "Lait maternel":["laitiers","ml",120,1, 70,1,7,4.4,0,6.9,32,0.03,17],
  "Préparation pour nourrissons":["laitiers","ml",120,1, 67,1.4,7.3,3.5,0,7,53,1.2,18],
  "Biscuits":["autres","unité",1,15, 480,5,66,22,2,35,30,2,350],
  "Gâteau":["autres","portion",1,80, 370,4,53,16,1,35,60,1.5,300],
  "Crème glacée":["autres","tasse",0.5,140, 207,3.5,24,11,0.7,21,128,0.1,80],
  "Croustilles":["autres","g",20,1, 536,7,53,35,4.4,0.3,24,1.6,525],
  "Jus":["autres","ml",125,1, 46,0.5,11,0.1,0.2,9,10,0.2,1],
  "Bonbons":["autres","g",20,1, 380,0,95,0,0,70,0,0,30],
  "Chocolat":["autres","g",20,1, 535,7.7,59,30,3.4,52,190,2.4,79],
  "Pizza":["autres","unité",1,107, 266,11,33,10,2.3,3.6,188,2.5,598],
  "Frites":["autres","portion",1,70, 312,3.4,41,15,3.8,0.3,18,0.8,210],
  "Céréales sucrées":["autres","tasse",0.75,40, 390,6,85,4,4,35,200,15,450],
  "Boisson gazeuse":["autres","ml",250,1, 41,0,10.6,0,0,10.6,2,0,4],
};
const NUT_KEYS = ["kcal","prot","carb","fat","fiber","sugar","calcium","iron","sodium"];
const UNITS = ["g","ml","unité","tasse","c. à soupe","c. à thé","portion"];
let FOOD_IDX = null;
const foodKey = n => String(n||"").trim().toLowerCase();
function foodInfo(name){
  if (!FOOD_IDX){ FOOD_IDX = {}; Object.keys(FOOD_DB).forEach(k => { FOOD_IDX[foodKey(k)] = k; FOOD_IDX[foodKey(T(k))] = k; }); }
  const k = FOOD_IDX[foodKey(name)]; if (!k) return null; const r = FOOD_DB[k];
  return {key:k, group:r[0], unit:r[1], amt:r[2], gpu:r[3], per100:Object.fromEntries(NUT_KEYS.map((n, i) => [n, r[4 + i]]))};
}
/* grammes d'une quantité dans une unité, pour cet aliment */
function gramsOf(f, amt, unit){
  const a = Number(amt) || 0; if (!a) return 0;
  if (unit === "g" || unit === "ml") return a;
  if (unit === "c. à soupe") return a * 15; if (unit === "c. à thé") return a * 5;
  if (unit === f.unit) return a * f.gpu;
  if (unit === "tasse") return a * 240; if (unit === "unité" || unit === "portion") return a * (f.unit === "g" || f.unit === "ml" ? f.amt : f.gpu);
  return a * f.gpu;
}
function nutOfFood(name, amt, unit){
  const f = foodInfo(name); if (!f) return null; const g = gramsOf(f, amt, unit || f.unit);
  return Object.fromEntries(NUT_KEYS.map(k => [k, Math.round(f.per100[k] * g / 100 * 10) / 10]));
}
/* contrôle de vraisemblance des valeurs nutritives (estimations de l'IA) */
function cleanNut(n){
  if (!n) return n; const o = {}; NUT_KEYS.forEach(k => { const v = Number(n[k]); o[k] = isFinite(v) && v > 0 ? v : 0; });
  if (o.sugar > o.carb && o.carb) o.sugar = o.carb; if (o.fiber > o.carb && o.carb) o.fiber = o.carb;
  const at = 4 * o.prot + 4 * o.carb + 9 * o.fat;
  if (at > 0 && o.kcal > 0){ if (at > o.kcal * 1.6){ const f = o.kcal / at; ["prot","carb","fat","fiber","sugar"].forEach(k => o[k] *= f); } else if (at < o.kcal * 0.55) o.kcal = at; }
  else if (at > 0 && !o.kcal) o.kcal = at;
  if (o.sugar > 150) o.sugar = Math.min(o.carb || 0, o.sugar / 1000) || 0; if (o.prot > 200) o.prot /= 1000;
  NUT_KEYS.forEach(k => o[k] = Math.round(o[k] * 10) / 10); return o;
}
/* valeurs pour la portion : base de l'app si l'aliment est connu, sinon valeurs pour 100 g données par l'IA */
function nutFromPer100(name, grams, per100){
  const g = Number(grams) || 0, f = foodInfo(name), base = f ? f.per100 : per100; if (!base || !g) return null;
  return cleanNut(Object.fromEntries(NUT_KEYS.map(k => [k, (Number(base[k]) || 0) * g / 100])));
}
const qtyTxt = (amt, unit) => amt ? `${fmtNum(+amt, +amt % 1 ? 2 : 0)} ${T(unit||"")}`.trim() : "";

/* ---------- portions du Guide alimentaire (repères par âge, 2 ans et plus) ---------- */
const SERV = {legfruits:"Légumes et fruits", grains:"Produits céréaliers", laitiers:"Lait et substituts", proteines:"Viandes et substituts"};
function servTargets(c){
  const y = ageMonths(c) / 12, F = c.sex === "F";
  if (c.adult || y >= 19) return F ? {legfruits:7.5, grains:6.5, laitiers:2, proteines:2} : {legfruits:9, grains:8, laitiers:2, proteines:3};
  if (y < 4) return {legfruits:4, grains:3, laitiers:2, proteines:1};
  if (y < 9) return {legfruits:5, grains:4, laitiers:2, proteines:1};
  if (y < 14) return {legfruits:6, grains:6, laitiers:3.5, proteines:1.5};
  return F ? {legfruits:7, grains:6, laitiers:3.5, proteines:2} : {legfruits:8, grains:7, laitiers:3.5, proteines:3};
}
/* une portion ≈ 80 g de légumes ou fruits · 15 g de glucides de céréales · 300 mg de calcium (lait) · 12 g de protéines */
function servingsOf(it){
  const n = it.nut || {}, g = it.grams || (() => { const f = foodInfo(it.name); return f && it.amt ? gramsOf(f, it.amt, it.unit) : 0; })();
  if (it.group === "legfruits") return g ? g / 80 : 1;
  if (it.group === "grains") return n.carb ? n.carb / 15 : 1;
  if (it.group === "laitiers") return n.calcium ? n.calcium / 300 : 1;
  if (it.group === "proteines") return n.prot ? n.prot / 12 : 1;
  return 0;
}
function dayServ(c, d){ const S0 = {legfruits:0, grains:0, laitiers:0, proteines:0, autres:0}; dayLogs(c, d).filter(l => l.type === "solid").forEach(l => (l.data.items||[]).forEach(it => { if (it.group === "autres") S0.autres++; else if (S0[it.group] != null) S0[it.group] += servingsOf(it); })); return S0; }

/* ---------- l'onglet ---------- */
const NUT_METRICS = () => [["kcal",T("Énergie"),"kcal","peach"],["prot",T("Protéines"),"g","coral"],["carb",T("Glucides"),"g","butter"],["fat",T("Lipides"),"g","lilac"],["fiber",T("Fibres"),"g","mint"],["sugar",T("Sucres"),"g","rose"],["calcium",T("Calcium"),"mg","sky"],["iron",T("Fer"),"mg","teal"],["sodium",T("Sodium"),"mg","butter"],["legfruits",T("Portions de légumes et fruits"),"",  "mint"]];
function nutritionTab(c){
  const m = ageMonths(c), ds = UI.nutDay || iso(today()), d = parseD(ds); let h = "";
  // boires (bébés)
  if (mod(c,"feeding")){ const days = Array.from({length:7},(_,i)=>dayTotals(c, addDays(today(), i-6)));
    h += `<div class="card"><div class="card-h"><h2>${T("Boires")}</h2><button class="btn sm kid" data-act="log" data-v="feed">${icon("plus")}${T("Boire")}</button></div><div class="stats"><div class="stat"><span class="muted tiny">${T("Aujourd'hui")}</span><div class="v">${days[6].feeds}<small>${days[6].ml?" · "+fmtVol(days[6].ml):""}</small></div></div><div class="stat"><span class="muted tiny">${T("Moyenne 7 jours")}</span><div class="v">${fmtNum(sum(days.map(x=>x.feeds))/7,1)}</div></div></div>${bars(days.map((x,i)=>({d:addDays(today(),i-6), v:x.feeds})), null, "peach")}</div>`; }
  if (!mod(c,"solids")) return h;
  // en-tête : jour choisi
  h += `<div class="card nut-day"><div class="row between"><button class="icon-btn" data-act="nutDay" data-v="-1" aria-label="${T("Jour précédent")}">${icon("left")}</button><div style="text-align:center"><b class="cap">${dayName(d)}</b><div class="tiny muted">${fmtD(d,{day:"numeric",month:"long",year:"numeric"})}</div></div><button class="icon-btn" data-act="nutDay" data-v="1" aria-label="${T("Jour suivant")}" ${ds >= iso(today()) ? "disabled" : ""}>${icon("right")}</button></div>
    ${m >= 12 ? nutSummaryCard(c, d) : `<p class="small muted">${T("Avant 1 an, le lait (maternel ou préparation) couvre l'essentiel des besoins ; les aliments servent surtout à découvrir textures et goûts, et à apporter du fer.")}</p>`}
    ${nutMeals(c, d)}
    ${aiReady() && !isKidUser() ? `<div class="row" style="flex-wrap:wrap;gap:6px">${aiBtn("aiMealPhoto",null,T("Photo du repas"),"camera")}${aiBtn("aiScan","label",T("Lire une étiquette"),"tag")}${m < 144 ? aiBtn("aiScan","menu",m < 60 ? T("Menu de la garderie") : T("Menu de l'école"),"dish") : ""}</div>` : ""}
    ${(c.foodFav||[]).length ? `<div><span class="eyebrow">${T("Favoris : touchez pour noter")}</span><div class="pick">${c.foodFav.map(f => `<button data-act="quickFood" data-v="${esc(f.name)}" style="border-color:var(--${FOOD_GROUPS[f.group]?.color||"line"})">${esc(f.name)}</button>`).join("")}</div></div>` : ""}</div>`;
  if (m >= 12 || m >= 24) h += guideCard(c, d);
  if (m >= 12) h += nutChartCard(c);
  h += triesCard(c);
  if (m >= 12) h += recoCard(c);
  if (m < 36) h += allergenCard(c);
  if (m >= 12) h += nutAiCard(c);
  h += `<div class="banner soft">${icon("spoon")}<div class="small"><b>${T("Portions pour cet âge :")}</b> ${T(portionHint(m))}</div></div>`;
  return h;
}
/* résumé du jour : énergie restante, macros, micronutriments */
function nutSummaryCard(c, d){
  const t = nutTargets(c), N = dayNut(c, d), kc = Math.round(N.kcal||0), left = t.kcal - kc;
  const miss = dayLogs(c, d).filter(l => l.type === "solid" && (l.data.items||[]).some(i => !i.nut)).length;
  const mac = [["prot","Protéines","coral",4],["carb","Glucides","butter",4],["fat","Lipides","lilac",9]].map(([k, l, col, f]) => { const tv = tgtVal(t, k), v = N[k] || 0; return `<div class="macro-col"><b class="num">${Math.round(v)}<small> / ${Math.round(tv)} g</small></b><div class="dombar"><i style="width:${clamp(v/tv*100,2,100).toFixed(0)}%;background:var(--${col})"></i></div><span class="tiny muted">${T(l)} · ${kc ? Math.round(v*f/Math.max(1,kc)*100) : 0} %</span></div>`; }).join("");
  return `<div class="nut-sum"><div class="kc-ring">${ring(kc / t.kcal, "peach", kc > t.kcal * 1.25)}<div><b class="num">${kc}</b><span class="tiny muted">/ ${t.kcal} kcal</span></div></div>
      <div class="grow"><div class="small">${left >= 0 ? T("Il reste environ {n} kcal",{n:left}) : T("{n} kcal au-dessus de la moyenne",{n:-left})}</div><div class="tiny muted">${T("Repère quotidien ; l'appétit d'un enfant varie beaucoup d'un jour à l'autre.")}</div></div></div>
    <div class="macro-row">${mac}</div>
    <div class="micro-row">${[["fiber","Fibres","g"],["sugar","Sucres","g"],["calcium","Calcium","mg"],["iron","Fer","mg"],["sodium","Sodium","mg"]].map(([k, l, u]) => { const tv = tgtVal(t, k), v = N[k] || 0, max = k === "sugar" || k === "sodium", bad = max ? (tv ? v > tv : v > 0) : v < tv * 0.5; return `<div class="micro ${bad && N.n ? (max ? "over" : "low") : ""}"><span class="tiny muted">${T(l)}</span><b class="num">${fmtNum(v, k === "iron" ? 1 : 0)}</b><span class="tiny muted">${max ? "≤ " : "/ "}${fmtNum(tv, k === "iron" ? 1 : 0)} ${u}</span></div>`; }).join("")}</div>
    ${miss && aiReady() && aiKey() ? `<button class="btn sm ghost" data-act="nutEstDay" data-v="${iso(d)}">${icon("spark")}${T("Estimer {n} repas sans valeurs",{n:miss})}</button>` : ""}`;
}
/* repas du jour, par moment, avec un + pour chacun */
function nutMeals(c, d){
  const L = dayLogs(c, d).filter(l => l.type === "solid");
  return `<div class="nut-meals">${MEAL_KINDS.map(k => { const ms = L.filter(l => mealKindOf(l) === k).sort((a, b) => a.t - b.t), kc = sum(ms.map(logKcal));
    return `<div class="nut-meal"><div class="row between"><b>${T(k)}</b><div class="row" style="gap:6px"><span class="small muted num">${kc ? Math.round(kc) + " kcal" : ""}</span>${isKidUser() ? "" : `<button class="icon-btn flat" data-act="mealAddAt" data-v="${iso(d)}|${k}" aria-label="${T("Ajouter")}">${icon("plus")}</button>`}</div></div>
      ${ms.length ? ms.flatMap(l => (l.data.items||[]).map(it => `<button class="nut-item" data-act="editLog" data-v="${l.id}"><span class="dot" style="background:var(--${FOOD_GROUPS[it.group]?.color||"line"})"></span><span class="grow"><span>${esc(it.name)}</span>${it.qty ? `<span class="tiny muted"> · ${esc(it.qty)}</span>` : ""}</span><span class="small num muted">${it.nut?.kcal ? Math.round(it.nut.kcal) : "—"}</span></button>`)).join("") : `<div class="tiny muted">${T("Rien de noté")}</div>`}</div>`; }).join("")}</div>`;
}
/* Guide alimentaire : proportions de l'assiette et portions du jour selon l'âge */
function guideCard(c, d){
  const S0 = dayServ(c, d), tg = servTargets(c), wk = Array.from({length:7}, (_, i) => dayServ(c, addDays(d, -i))), days = Math.max(1, wk.filter(x => sum(Object.values(x)) > 0).length);
  const avg = k => sum(wk.map(x => x[k])) / days;
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Guide alimentaire canadien")}</span><h2>${T("Portions du jour")}</h2></div><span class="tiny muted">${T("repères pour {a}",{a:ageLabel(ageMonths(c))})}</span></div>
    <div class="stack" style="gap:10px">${Object.entries(SERV).map(([k, l]) => { const v = S0[k], t = tg[k], col = FOOD_GROUPS[k]?.color || "mint"; return `<div><div class="row between small"><b style="color:var(--${col}-ink)">${T(l)}</b><span class="num"><b>${fmtNum(v, 1)}</b> / ${fmtNum(t, t % 1 ? 1 : 0)} ${T("portions")} <span class="tiny muted">· ${T("moy. 7 j")} ${fmtNum(avg(k), 1)}</span></span></div><div class="dombar"><i style="width:${clamp(v/t*100,2,100).toFixed(0)}%;background:var(--${col})"></i></div></div>`; }).join("")}
      <div class="row between small"><b style="color:var(--rose-ink)">${T("Gâteries et autres")}</b><span class="num">${S0.autres} ${T("aujourd'hui")} · ${T("moy. 7 j")} ${fmtNum(avg("autres"), 1)}</span></div></div>
    <p class="tiny muted">${T("Une portion ≈ ½ tasse de légumes ou 1 fruit · 1 tranche de pain ou ½ tasse de pâtes · 1 tasse de lait ou ¾ tasse de yogourt · 75 g de viande, 2 œufs ou ¾ tasse de légumineuses. Repères du Guide alimentaire (2007) ; le guide actuel recommande surtout l'assiette : ½ légumes et fruits, ¼ protéines, ¼ grains entiers.")}</p></div>`;
}
/* graphique : un nutriment, par jour ou par semaine, avec moyennes */
function nutSeries(c, key, days){ return Array.from({length:days}, (_, i) => { const d = addDays(today(), i - days + 1); return {d, v:key === "legfruits" ? dayServ(c, d).legfruits : (dayNut(c, d)[key] || 0), has:dayLogs(c, d).some(l => l.type === "solid")}; }); }
function nutChartCard(c){
  const M = NUT_METRICS(), key = UI.nutKey || "kcal", met = M.find(x => x[0] === key) || M[0], span = UI.nutSpan || 7, t = nutTargets(c), goal = key === "legfruits" ? servTargets(c).legfruits : tgtVal(t, key);
  let pts = nutSeries(c, key, span); const avgOf = n => { const a = nutSeries(c, key, n).filter(p => p.has); return a.length ? sum(a.map(p => p.v)) / a.length : null; };
  if (span > 31){ const w = []; for (let i = 0; i < pts.length; i += 7){ const a = pts.slice(i, i + 7), h = a.filter(p => p.has); w.push({d:a[0].d, v:h.length ? sum(h.map(p => p.v)) / h.length : 0, has:!!h.length}); } pts = w; }
  const max = Math.max(goal * 1.3, ...pts.map(p => p.v), 1), Hh = 90, fmt = v => v == null ? "—" : fmtNum(v, key === "iron" ? 1 : v < 10 && key === "legfruits" ? 1 : 0) + (met[2] ? " " + met[2] : "");
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Tendances")}</span><h2>${esc(met[1])}</h2></div><select class="inp" style="width:auto;padding:6px 10px" data-change="nutKey" aria-label="${T("Mesure")}">${M.map(x => `<option value="${x[0]}" ${x[0]===key?"selected":""}>${esc(x[1])}</option>`).join("")}</select></div>
    <div class="seg" style="width:auto">${[[7,T("Semaine")],[30,T("Mois")],[90,T("3 mois")],[365,T("Année")]].map(([n, l]) => `<button data-act="nutSpan" data-v="${n}" aria-pressed="${span===n}">${l}</button>`).join("")}</div>
    <div class="nbars" style="--n:${pts.length}">${pts.map(p => `<button type="button" class="nb" data-act="${span > 31 ? "nutWeek" : "nutDayGo"}" data-v="${iso(p.d)}" title="${fmtD(p.d,{day:"numeric",month:"short"})} : ${fmt(p.v)}"><i style="height:${(p.v/max*Hh).toFixed(1)}px;background:var(--${met[3]});${p.has?"":"opacity:.25"}"></i></button>`).join("")}<div class="goal" style="bottom:${(goal/max*Hh).toFixed(1)}px"></div></div>
    <div class="row between tiny muted"><span>${fmtD(pts[0].d,{day:"numeric",month:"short"})}</span><span>${T("pointillé : repère {g}",{g:fmt(goal)})}</span><span>${T("aujourd'hui")}</span></div>
    <div class="stats">${[[T("Moyenne 7 jours"), avgOf(7)],[T("Moyenne 30 jours"), avgOf(30)],[T("Moyenne 1 an"), avgOf(365)]].map(([l, v]) => `<div class="stat"><span class="muted tiny">${l}</span><div class="v" style="font-size:1.15rem">${fmt(v)}</div></div>`).join("")}</div>
    <p class="tiny muted">${T("Moyennes sur les jours où des repas sont notés. Valeurs approximatives : base d'aliments et estimations de l'IA.")}</p></div>`;
}
/* aliments en découverte : nombre d'essais (il en faut souvent 10 à 15) */
function triesCard(c){
  const L = c.logs.filter(l => l.type === "solid"), cnt = {}, first = {}, last = {};
  L.forEach(l => (l.data.items||[]).forEach(it => { const k = foodKey(it.name); if (!k) return; cnt[k] = (cnt[k]||0) + 1; first[k] = Math.min(first[k] || Infinity, l.t); last[k] = Math.max(last[k] || 0, l.t); }));
  const names = Object.keys(cnt); if (!names.length) return "";
  const disc = names.filter(k => cnt[k] < 15 && Date.now() - last[k] < 90*DAY).sort((a, b) => last[b] - last[a]).slice(0, 12), fresh = names.filter(k => Date.now() - first[k] < 7*DAY);
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Essais")}</span><h2>${T("Aliments en découverte")}</h2></div><span class="chip lilac">${names.length} ${T("aliments")}</span></div>
    <p class="small muted">${T("Il faut souvent 10 à 15 essais avant d'aimer un aliment. Continuez d'offrir, en petite quantité et sans pression.")}${fresh.length ? " " + T("Nouveaux cette semaine : {l}.",{l:esc(fresh.slice(0, 8).join(", "))}) : ""}</p>
    <div class="stack" style="gap:6px">${disc.map(k => `<div><div class="row between small"><span class="cap">${esc(k)}</span><span class="num muted">${T("{n} essai(s)",{n:cnt[k]})}</span></div><div class="dombar"><i style="width:${clamp(cnt[k]/12*100,4,100).toFixed(0)}%;background:var(--${cnt[k] >= 10 ? "mint" : "lilac"})"></i></div></div>`).join("")}</div></div>`;
}
/* recommandations selon les données de la semaine et l'âge */
function recoCard(c){
  const t = nutTargets(c), tg = servTargets(c), days = Array.from({length:7}, (_, i) => addDays(today(), -i)).filter(d => dayLogs(c, d).some(l => l.type === "solid"));
  if (days.length < 2) return `<div class="card"><h2>${T("Recommandations")}</h2><p class="small muted">${T("Notez des repas sur au moins 2 jours pour recevoir des recommandations adaptées.")}</p></div>`;
  const N = {}; NUT_KEYS.forEach(k => N[k] = sum(days.map(d => dayNut(c, d)[k] || 0)) / days.length);
  const Sv = {}; ["legfruits","grains","laitiers","proteines","autres"].forEach(k => Sv[k] = sum(days.map(d => dayServ(c, d)[k])) / days.length);
  const items = c.logs.filter(l => l.type === "solid" && Date.now() - l.t < 7*DAY).flatMap(l => l.data.items||[]), variety = new Set(items.map(i => foodKey(i.name))).size;
  const R = [];
  if (Sv.legfruits < tg.legfruits * 0.7) R.push(["mint", T("Plus de légumes et fruits"), T("{v} portions par jour en moyenne pour un repère de {t}. Ajoutez-en un à chaque repas et collation : bâtonnets, petits fruits, soupe, smoothie.",{v:fmtNum(Sv.legfruits,1), t:tg.legfruits})]);
  if (N.iron < tgtVal(t, "iron") * 0.7) R.push(["teal", T("Le fer est un peu bas"), T("Environ {v} mg par jour pour {t} mg. Viande, œufs, légumineuses, tofu, céréales enrichies, avec un fruit riche en vitamine C pour mieux l'absorber.",{v:fmtNum(N.iron,1), t:tgtVal(t,"iron")})]);
  if (N.calcium < tgtVal(t, "calcium") * 0.7) R.push(["sky", T("Plus de calcium"), T("Environ {v} mg par jour pour {t} mg : lait, yogourt, fromage, boisson de soya enrichie, tofu au calcium.",{v:Math.round(N.calcium), t:tgtVal(t,"calcium")})]);
  if (N.fiber < tgtVal(t, "fiber") * 0.6) R.push(["mint", T("Plus de fibres"), T("Grains entiers, légumineuses, fruits et légumes avec la pelure ; et de l'eau.")]);
  if (N.prot < tgtVal(t, "prot") * 0.7) R.push(["coral", T("Un aliment protéiné à chaque repas"), T("Œufs, poisson, poulet, légumineuses, tofu, yogourt ou fromage.")]);
  if (t.sugar ? N.sugar > t.sugar : N.sugar > 5) R.push(["rose", T("Moins de sucres"), T("Environ {v} g de sucres par jour. Limitez jus, boissons sucrées et desserts ; offrez des fruits entiers.",{v:Math.round(N.sugar)})]);
  if (N.sodium > tgtVal(t, "sodium")) R.push(["butter", T("Un peu trop de sel"), T("Environ {v} mg de sodium par jour. Moins de charcuteries, croustilles, soupes et sauces du commerce.",{v:Math.round(N.sodium)})]);
  if (Sv.autres > 1.5) R.push(["rose", T("Gâteries fréquentes"), T("Environ {v} par jour. Gardez-les pour des occasions, sans en faire une récompense.",{v:fmtNum(Sv.autres,1)})]);
  if (variety < 12) R.push(["lilac", T("Plus de variété"), T("{n} aliments différents cette semaine. Essayez une nouvelle couleur de légume ou une nouvelle céréale chaque semaine.",{n:variety})]);
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Selon les 7 derniers jours")}</span><h2>${T("Recommandations")}</h2></div></div>
    ${R.length ? `<div class="stack" style="gap:8px">${R.map(([col, t1, t2]) => `<div class="reco"><span class="tip-dot" style="background:var(--${col})"></span><div><b>${t1}</b><div class="small muted">${t2}</div></div></div>`).join("")}</div>` : `<div class="banner ok">${icon("check")}<div class="small">${T("Belle semaine : les repères sont bien respectés. Continuez !")}</div></div>`}
    <p class="tiny muted">${T("Basé sur les repas notés (parfois incomplets) ; à interpréter sur plusieurs jours, sans régime restrictif.")}</p></div>`;
}
/* avis de l'IA (garde l'existant : période, date, automatique) */
function nutAiCard(c){
  if (!aiReady() || isKidUser()) return "";
  const html = nutritionCard(c), i = html.indexOf('<div class="sep"></div>');
  return i < 0 ? "" : `<div class="card"><div class="card-h"><h2>${icon("spark")} ${T("Avis nutrition de Gemini")}</h2></div>${html.slice(i + 23)}`;
}

/* ---------- ajouter un repas d'un menu ou d'une recette au journal ---------- */
function logRecipeSheet(rec){
  const profiles = S.children.filter(k => !isPrenatal(k) && ageMonths(k) >= 6); UI.logRec = rec;
  const def = UI.view === "kid" && child() ? [child().id] : profiles.slice(0, 1).map(k => k.id);
  sheet(`<form class="stack" data-form="logRecipe" style="gap:12px">${sheetHead(T("Ajouter au journal"))}<p><b>${esc(rec.title)}</b>${rec.nut?.kcal ? ` <span class="small muted">· ${T("{k} kcal par portion d'enfant",{k:Math.round(rec.nut.kcal)})}</span>` : ""}</p>
    <div class="field"><label>${T("Pour qui ?")}</label>${checks("lrwho", profiles.map(k => [k.id, k.nick || k.name]), def)}</div>
    <div class="field"><label>${T("Combien ?")}</label>${radios("lrpor", PORTIONS.map(([f, l]) => [String(f), T("{p} portion(s)",{p:l})]), "1")}</div>
    <div class="fgrid"><div class="field"><label>${T("Moment")}</label>${radios("lrmeal", MEAL_KINDS.map(k => [k, T(k)]), rec.label && MEAL_KINDS.includes(rec.label) ? rec.label : mealKindAt(Date.now()))}</div>${fld("lr-t",T("Quand"),`<input class="inp" id="lr-t" type="datetime-local" value="${localInput(Date.now())}">`)}</div>
    ${rec.nut ? "" : `<p class="tiny muted">${T("Les valeurs nutritives seront estimées par l'IA après l'ajout.")}</p>`}
    <button class="btn kid" type="submit">${icon("plus")}${T("Ajouter")}</button></form>`);
}
Object.assign(FORMS, { logRecipe: () => { const rec = UI.logRec, who = checked("lrwho"), f = +(radio("lrpor") || 1), meal = radio("lrmeal") || "Souper", t = tsOf("lr-t"); if (!who.length) return toast(T("Choisissez au moins une personne"));
  const grp = (rec.labels||[]).includes("Collation") ? "autres" : "proteines";
  who.forEach(id => { const c = kidById(id); if (!c) return; const it = {name:rec.title, group:rec.group || grp, qty:T("{p} portion(s)",{p:PORTIONS.find(p => p[0] === f)?.[1] || f}), nut:rec.nut ? scaleNut(rec.nut, f) : null, mixed:true};
    const L = {id:uid(), type:"solid", t, data:{items:[it], meal, ai:true, recipe:rec.id || null}}; c.logs.push(L);
    if (!it.nut && aiKey() && ageMonths(c) >= 12) nutEstimateJob(c, [L]); });
  closeSheet(); commit(T("Ajouté au journal de {n}",{n:who.map(id => kidById(id)?.nick || kidById(id)?.name).join(", ")})); } });

Object.assign(ACT, {
  nutDay: v => { const d = addDays(parseD(UI.nutDay || iso(today())), +v); if (d > today()) return; UI.nutDay = iso(d); render(); },
  nutDayGo: v => { UI.nutDay = v; render(); $(".nut-day")?.scrollIntoView({behavior:"smooth", block:"start"}); },
  nutWeek: v => { UI.nutSpan = 30; UI.nutDay = v; render(); },
  nutSpan: v => { UI.nutSpan = +v; render(); },
  mealAddAt: v => { const [ds, k] = v.split("|"), d = parseD(ds), h = {Déjeuner:8, Dîner:12, Souper:18, Collation:15}[k] || 12; d.setHours(h, 0, 0, 0); mealForm({items:[{name:"", group:"legfruits", qty:""}], t:Math.min(Date.now(), d.getTime()), meal:k}); },
  nutEstDay: v => { const c = child(), L = dayLogs(c, parseD(v)).filter(l => l.type === "solid" && (l.data.items||[]).some(i => !i.nut)); if (L.length) nutEstimateJob(c, L); },
  logRecipe: () => { const r = UI.recipeView; if (r) logRecipeSheet(r); },
});
Object.assign(CHANGE, { nutKey: t => { UI.nutKey = t.value; render(); } });
