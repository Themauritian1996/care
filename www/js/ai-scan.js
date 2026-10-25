/* =========================================================================
   TRIBE — Gemini : lecture de documents (OCR) et outils créatifs.
   Tout passe par la clé Gemini de l'appareil ; rien n'est enregistré sans
   confirmation du parent.
   ========================================================================= */
const SCAN_KINDS = {
  label:  {l:"Étiquette nutritionnelle", ic:"spoon", d:"Valeur nutritive et ingrédients : sucres, sodium, allergènes, convient à quel âge."},
  daycare:{l:"Rapport de garderie", ic:"doc", d:"La feuille de la journée : repas, siestes, couches, biberons, humeur."},
  carnet: {l:"Carnet de santé", ic:"syringe", d:"Vaccins reçus et mesures (poids, taille, tête) recopiés dans le profil."},
  events: {l:"Invitation ou horaire", ic:"cal", d:"Fête, rendez-vous, calendrier scolaire, horaire de sport : tout va à l'agenda."},
  menu:   {l:"Menu de la garderie ou de l'école", ic:"dish", d:"Le menu de la semaine, avec les allergènes de votre enfant signalés."},
};
const aiReady = () => feat("ai") && allow("ai");
const aiBtn = (act, v, label, ic = "spark") => aiReady() ? `<button class="btn sm ghost" data-act="${act}" ${v!=null?`data-v="${esc(v)}"`:""}>${icon(ic)}${label}</button>` : "";
const todayCtx = () => `Nous sommes le ${iso(today())} (${fmtD(today(),{weekday:"long"})}). Si une date n'a pas d'année, choisis la prochaine occurrence. Dates au format AAAA-MM-JJ, heures au format HH:MM (24 h). Écris le texte en ${LANG==="en"?"anglais":"français"}.`;

/* ---------- lecture d'un document ---------- */
async function aiScan(kind, retryImg){
  if (!aiKey()){ aiSheet(); return; }
  const c = child(), K = SCAN_KINDS[kind]; if (!K) return;
  if (kind !== "events" && !c) return toast(T("Ajoutez d'abord un enfant"));
  let img = retryImg; if (!img){ const data = await Native.takePhoto({source:"prompt"}); if (!data) return; img = await shrinkImage(data, 1600, 0.85); }
  UI.scanImg = {kind, img};
  sheet(`${sheetHead(T(K.l))}<img src="${img}" alt="" style="border-radius:16px;max-height:240px;object-fit:contain;background:var(--surface2)"><p class="muted"><span class="spin"></span> ${T("Lecture du document…")}</p>`);
  const m = c && !isPrenatal(c) ? ageMonths(c) : null;
  const who = c ? `Enfant : ${esc(c.nick||c.name)}, ${m != null ? ageLabel(m) : "à naître"}. Allergies connues : ${c.allergies||"aucune"}.` : "";
  const S_ = (type, extra = {}) => ({type, ...extra}), STR = S_("STRING"), NUM = S_("NUMBER");
  const P = {
    label: {
      prompt:`Lis cette étiquette d'aliment (tableau de valeur nutritive canadien et liste d'ingrédients). ${who}
Donne : product (nom du produit), portion (portion indiquée), calories, nutrients (chaque ligne du tableau : name, amount avec unité, dv = % valeur quotidienne si présent), ingredients (texte), allergens (parmi : ${ALLERGENS.join(", ")}, plus tout autre allergène prioritaire mentionné, y compris « peut contenir »), sugarsAdded (vrai si sucre, sirop, miel, jus concentré parmi les ingrédients), sodiumMg, group (groupe du Guide alimentaire canadien : legfruits, proteines, grains, laitiers ou autres), flags (mises en garde courtes pour CET enfant : miel avant 12 mois, sucres ajoutés avant 2 ans, sodium élevé > 15 % VQ, risque d'étouffement avant 4 ans, allergène connu, boisson sucrée, caféine), verdict (une ou deux phrases rassurantes et concrètes : convient-il, à quelle fréquence, meilleure alternative si besoin), nut (valeurs pour UNE portion : kcal, prot g, carb g, fat g, fiber g, sugar g, sodium mg, calcium mg, iron mg ; convertis les % VQ en quantités).`,
      schema:{type:"OBJECT", properties:{product:STR, portion:STR, calories:NUM, nutrients:{type:"ARRAY", items:{type:"OBJECT", properties:{name:STR, amount:STR, dv:STR}, required:["name","amount"]}}, ingredients:STR, allergens:{type:"ARRAY", items:STR}, sugarsAdded:S_("BOOLEAN"), sodiumMg:NUM, group:{type:"STRING", enum:Object.keys(FOOD_GROUPS)}, flags:{type:"ARRAY", items:STR}, verdict:STR, nut:NUT_SCHEMA}, required:["product","group","verdict"]}},
    daycare: {
      prompt:`Lis ce rapport quotidien de garderie (souvent manuscrit). ${who}
Donne : date (si visible), meals (time, items : name, group parmi legfruits/proteines/grains/laitiers/autres, qty ; note sur la quantité mangée), naps (start, end), diapers (time, kind : « Pipi », « Selle » ou « Pipi et selle »), bottles (time, ml), mood (un mot), notes (le reste : activités, messages de l'éducatrice). N'invente rien : laisse vide ce qui n'est pas écrit.`,
      schema:{type:"OBJECT", properties:{date:STR, meals:{type:"ARRAY", items:{type:"OBJECT", properties:{time:STR, items:{type:"ARRAY", items:{type:"OBJECT", properties:{name:STR, group:{type:"STRING", enum:Object.keys(FOOD_GROUPS)}, qty:STR}, required:["name","group"]}}, note:STR}}}, naps:{type:"ARRAY", items:{type:"OBJECT", properties:{start:STR, end:STR}, required:["start","end"]}}, diapers:{type:"ARRAY", items:{type:"OBJECT", properties:{time:STR, kind:{type:"STRING", enum:["Pipi","Selle","Pipi et selle"]}}}}, bottles:{type:"ARRAY", items:{type:"OBJECT", properties:{time:STR, ml:NUM}}}, mood:STR, notes:STR}}},
    carnet: {
      prompt:`Lis cette page de carnet de santé ou de carnet de vaccination québécois. ${who} Date de naissance : ${c?.dob||"inconnue"}.
Pour chaque vaccin inscrit : name (tel qu'écrit), date, lot, et id = la dose correspondante du Programme québécois d'immunisation parmi : ${PIQ.flatMap(g => g.doses.map(d => `${d.id} (${d.name}, ${g.label})`)).join("; ")}. Utilise l'âge à la date du vaccin pour choisir la bonne dose ; si rien ne correspond, id = « autre ».
Pour chaque mesure : date, weight en kg, height en cm, ofc (périmètre crânien) en cm. Convertis livres et pouces. N'invente rien.`,
      schema:{type:"OBJECT", properties:{vaccines:{type:"ARRAY", items:{type:"OBJECT", properties:{id:{type:"STRING", enum:[...PIQ.flatMap(g => g.doses.map(d => d.id)), "autre"]}, name:STR, date:STR, lot:STR}, required:["id","name","date"]}}, measures:{type:"ARRAY", items:{type:"OBJECT", properties:{date:STR, weight:NUM, height:NUM, ofc:NUM}, required:["date"]}}}}},
    events: {
      prompt:`Lis ce document (invitation, carte de rendez-vous, calendrier scolaire, horaire d'activité, affiche). Extrais chaque événement à mettre à l'agenda familial : title (court et clair), date, time (si indiquée), type parmi famille, medecin, dentiste, vaccin, garde, therapie, sport, autre ; place ; notes (ce qu'il faut apporter, RSVP, coût, contact).`,
      schema:{type:"OBJECT", properties:{events:{type:"ARRAY", items:{type:"OBJECT", properties:{title:STR, date:STR, time:STR, type:{type:"STRING", enum:["famille","medecin","dentiste","vaccin","garde","therapie","sport","autre"]}, place:STR, notes:STR}, required:["title","date","type"]}}}}},
    menu: {
      prompt:`Lis ce menu de garderie ou d'école. ${who} Pour chaque jour : date (si un jour de la semaine sans date, prends la semaine en cours ou la prochaine), meal (le repas du midi et les collations, en une ligne), allergens (allergènes probables parmi : ${ALLERGENS.join(", ")}), flag (court avertissement si un allergène connu de l'enfant est probable, sinon vide).`,
      schema:{type:"OBJECT", properties:{days:{type:"ARRAY", items:{type:"OBJECT", properties:{date:STR, meal:STR, allergens:{type:"ARRAY", items:STR}, flag:STR}, required:["date","meal"]}}}}},
  }[kind];
  try {
    const r = await gemini({tier:"quality", system:todayCtx(), json:P.schema, contents:[{role:"user", parts:[{inline_data:{mime_type:"image/jpeg", data:img.split(",")[1]}}, {text:P.prompt}]}]});
    UI.scan = {kind, out:parseJSON(r.text), kid:c?.id}; aiHist("scan", T(K.l), "```\n"+JSON.stringify(UI.scan.out, null, 1).slice(0, 3000)+"\n```", {kid:c?.id||null});
    scanResult();
  } catch(e){ sheet(`${sheetHead(T(K.l))}<img src="${img}" alt="" style="border-radius:16px;max-height:200px;object-fit:contain;background:var(--surface2)"><div class="banner alert">${icon("alert")}<div class="small">${esc(e.message)}<div class="tiny muted">${esc(AI_LAST_ERR)}</div></div></div><div class="row"><button class="btn kid" data-act="scanRetry">${icon("auto")}${T("Réessayer avec la même photo")}</button><button class="btn ghost" data-act="aiScan" data-v="${kind}">${icon("camera")}${T("Autre photo")}</button></div>`); }
}
const okDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d||"") ? d : "";
const atTime = (date, hhmm) => { const d = parseD(date); const [h, m] = (hhmm||"").split(/[:h]/).map(Number); d.setHours(isNaN(h)?12:h, isNaN(m)?0:m, 0, 0); return d.getTime(); };
const scanRow = (i, title, sub, on = true) => `<label class="li" style="cursor:pointer"><input type="checkbox" name="scan" value="${i}" ${on?"checked":""} style="width:20px;height:20px;accent-color:var(--kid)"><div class="grow"><div class="li-title">${title}</div>${sub?`<div class="small muted">${sub}</div>`:""}</div></label>`;

function scanResult(){
  const {kind, out} = UI.scan, c = kidById(UI.scan.kid);
  let body = "", rows = [], actions = "";
  if (kind === "label"){
    const mine = (c?.allergies||"").toLowerCase(), hit = (out.allergens||[]).filter(a => mine && mine.includes(a.toLowerCase().slice(0,5)));
    body = `<div class="row between"><div><b style="font-size:1.1rem">${esc(out.product||T("Produit"))}</b><div class="small muted">${esc(out.portion||"")}${out.calories?` · ${Math.round(out.calories)} kcal`:""}</div></div><span class="chip ${FOOD_GROUPS[out.group]?.color||""}">${T(FOOD_GROUPS[out.group]?.label||"Autres")}</span></div>
      ${hit.length?`<div class="banner danger">${icon("alert")}<div class="small"><b>${T("Allergène connu de {n} :",{n:esc(c.nick||c.name)})}</b> ${hit.map(esc).join(", ")}</div></div>`:""}
      ${(out.flags||[]).length?`<div class="banner info">${icon("info")}<div class="small">${out.flags.map(esc).join("<br>")}</div></div>`:""}
      <div class="banner soft">${icon("spark")}<div class="small">${esc(out.verdict||"")}</div></div>
      ${(out.nutrients||[]).length?`<div class="tbl"><table><tbody>${out.nutrients.map(n => `<tr><td>${esc(n.name)}</td><td class="num">${esc(n.amount||"")}</td><td class="num muted">${esc(n.dv||"")}</td></tr>`).join("")}</tbody></table></div>`:""}
      ${(out.allergens||[]).length?`<div class="field"><label>${T("Allergènes")}</label><div class="pick">${out.allergens.map(a => `<span class="chip ${hit.includes(a)?"danger":"butter"}">${esc(a)}</span>`).join("")}</div></div>`:""}
      ${out.ingredients?`<details><summary class="small">${T("Ingrédients")}</summary><p class="small">${esc(out.ingredients)}</p></details>`:""}`;
    actions = c && !isPrenatal(c) ? `<button class="btn kid" data-act="scanMeal">${icon("spoon")}${T("Noter comme repas")}</button><button class="btn ghost" data-act="scanFav">${icon("star")}${T("Ajouter aux favoris")}</button>` : "";
  } else if (kind === "daycare"){
    const date = okDate(out.date) || iso(today());
    (out.meals||[]).forEach(m => rows.push({t:"meal", d:m, title:`${icon("spoon")} ${m.time||""} ${(m.items||[]).map(i=>esc(i.name)).join(", ")}`, sub:esc(m.note||"")}));
    (out.naps||[]).forEach(n => rows.push({t:"nap", d:n, title:`${icon("moon")} ${T("Sieste")} ${esc(n.start)} – ${esc(n.end)}`}));
    (out.diapers||[]).forEach(d => rows.push({t:"diaper", d, title:`${icon("drop")} ${T("Couche")} ${esc(d.time||"")}`, sub:T(d.kind||"Pipi")}));
    (out.bottles||[]).forEach(b => rows.push({t:"bottle", d:b, title:`${icon("bottle")} ${T("Biberon")} ${esc(b.time||"")}`, sub:b.ml?b.ml+" ml":""}));
    if (out.mood || out.notes) rows.push({t:"note", d:out, title:`${icon("note")} ${T("Note de la garderie")}`, sub:esc([out.mood, out.notes].filter(Boolean).join(" · "))});
    body = fld("scan-date", T("Date du rapport"), `<input class="inp" id="scan-date" type="date" value="${date}">`);
  } else if (kind === "carnet"){
    (out.vaccines||[]).forEach(v => { const known = v.id !== "autre", has = known && c?.vaccines?.[v.id]?.date;
      rows.push({t:"vax", d:v, on:!has, title:`${icon("syringe")} ${esc(v.name)} · ${esc(v.date)}`, sub: known ? (has ? T("Déjà noté") : T("Dose {d}",{d:esc(PIQ.flatMap(g=>g.doses).find(d=>d.id===v.id)?.name||"")})) : T("Hors calendrier : gardé en note")}); });
    (out.measures||[]).forEach(g => rows.push({t:"growth", d:g, on:!c?.growth?.some(x => x.date === g.date), title:`${icon("chart")} ${esc(g.date)}`, sub:[g.weight&&`${g.weight} kg`, g.height&&`${g.height} cm`, g.ofc&&`${T("tête")} ${g.ofc} cm`].filter(Boolean).join(" · ")}));
  } else if (kind === "events"){
    (out.events||[]).forEach(e => rows.push({t:"event", d:e, title:`${icon("cal")} ${esc(e.title)}`, sub:[fmtD(okDate(e.date)||iso(today()),{weekday:"short",day:"numeric",month:"long"}), e.time, e.place].filter(Boolean).map(esc).join(" · ")}));
  } else if (kind === "menu"){
    (out.days||[]).forEach(d => rows.push({t:"menu", d, title:`${icon("dish")} ${okDate(d.date)?fmtD(d.date,{weekday:"short",day:"numeric",month:"short"}):esc(d.date)}`, sub:`${esc(d.meal)}${d.flag?` · <b style="color:var(--danger)">${esc(d.flag)}</b>`:""}`}));
  }
  UI.scan.rows = rows;
  if (kind !== "label"){
    body += rows.length ? `<p class="small muted">${T("Vérifiez et décochez ce qui est faux, puis importez.")}</p><div class="list">${rows.map((r,i) => scanRow(i, r.title, r.sub, r.on !== false)).join("")}</div>` : `<p class="muted">${T("Rien de lisible trouvé. Essayez une photo plus nette, bien à plat et éclairée.")}</p>`;
    if (rows.length) actions = `<button class="btn kid" data-act="scanImport">${icon("check")}${T("Importer la sélection")}</button>`;
  }
  sheet(`${sheetHead(T(SCAN_KINDS[kind].l))}${c?`<span class="small muted">${esc(c.nick||c.name)}</span>`:""}${body}<div class="row">${actions}<button class="btn ghost" data-act="aiScan" data-v="${kind}">${icon("camera")}${T("Reprendre")}</button></div><p class="tiny muted">${T("Lu par Gemini : relisez avant d'enregistrer.")}</p>`, "wide");
}
function scanImport(){
  const {kind, rows} = UI.scan, c = kidById(UI.scan.kid), sel = checked("scan").map(Number).map(i => rows[i]);
  if (!sel.length) return toast(T("Rien de sélectionné"));
  let n = 0;
  if (kind === "daycare"){
    const date = val("scan-date") || iso(today());
    sel.forEach(r => {
      if (r.t === "meal" && (r.d.items||[]).length){ c.logs.push({id:uid(), type:"solid", t:atTime(date, r.d.time), data:{items:r.d.items.map(i => ({name:i.name, group:FOOD_GROUPS[i.group]?i.group:"autres", qty:i.qty||""})), reaction:r.d.note||"", ai:true}}); n++; }
      if (r.t === "nap"){ const t = atTime(date, r.d.start), end = atTime(date, r.d.end); if (end > t){ c.logs.push({id:uid(), type:"sleep", t, end, data:{kind:"Sieste", where:T("Garderie")}}); n++; } }
      if (r.t === "diaper"){ c.logs.push({id:uid(), type:"diaper", t:atTime(date, r.d.time), data:{kind:r.d.kind||"Pipi"}}); n++; }
      if (r.t === "bottle"){ c.logs.push({id:uid(), type:"feed", t:atTime(date, r.d.time), data:{mode:"Biberon", ml:r.d.ml||""}}); n++; }
      if (r.t === "note"){ c.logs.push({id:uid(), type:"note", t:atTime(date, "17:00"), data:{text:`${T("Garderie")} : ${[r.d.mood, r.d.notes].filter(Boolean).join(" · ")}`}}); n++; }
    });
  } else if (kind === "carnet"){
    sel.forEach(r => {
      if (r.t === "vax" && okDate(r.d.date)){ if (r.d.id !== "autre") c.vaccines[r.d.id] = {date:r.d.date, lot:r.d.lot||"", site:"", reactions:""}; else (c.vaxOther = c.vaxOther || []).push({id:uid(), name:r.d.name, date:r.d.date, lot:r.d.lot||""}); n++; }
      if (r.t === "growth" && okDate(r.d.date) && (r.d.weight || r.d.height || r.d.ofc)){ c.growth.push({id:uid(), date:r.d.date, weight:r.d.weight||null, height:r.d.height||null, ofc:r.d.ofc||null}); n++; }
    });
  } else if (kind === "events"){
    sel.forEach(r => { S.events.push({id:uid(), title:r.d.title, date:okDate(r.d.date)||iso(today()), time:/^\d{1,2}:\d{2}$/.test(r.d.time||"")?r.d.time.padStart(5,"0"):"", type:EVT[r.d.type]?r.d.type:"autre", recur:"none", pinned:false, kidIds:c?[c.id]:[], memberIds:[], notes:[r.d.place, r.d.notes].filter(Boolean).join("\n")}); n++; });
  } else if (kind === "menu"){
    sel.forEach(r => { if (!okDate(r.d.date)) return; S.events.push({id:uid(), title:`${T("Menu")} : ${r.d.meal}`.slice(0,140), date:r.d.date, time:"", type:"note", recur:"none", pinned:false, kidIds:c?[c.id]:[], memberIds:[], notes:[(r.d.allergens||[]).length?`${T("Allergènes possibles")} : ${r.d.allergens.join(", ")}`:"", r.d.flag].filter(Boolean).join("\n")}); n++; });
  }
  closeSheet(); commit(T("{n} élément(s) importé(s)",{n}));
}

/* ---------- souvenirs : texte et récit de l'année ---------- */
async function aiMemoryText(targetId, titleId){
  if (!aiKey()){ aiSheet(); return; }
  const ta = $("#"+targetId), title = val(titleId), c = specialKid?.() || child(), photo = UI.photoDraft?.mem2;
  if (!title && !photo) return toast(T("Écrivez d'abord un titre ou ajoutez une photo"));
  ta.value = T("Écriture…");
  try {
    const parts = []; if (photo) parts.push({inline_data:{mime_type:"image/jpeg", data:photo.split(",")[1]}});
    parts.push({text:`Écris 2 à 4 phrases chaleureuses et simples, comme un parent dans un album de bébé, pour ce souvenir de ${c?(c.nick||c.name):"notre enfant"}${c&&!isPrenatal(c)?`, ${ageLabel(ageMonths(c))}`:""} : « ${title||"(voir la photo)"} ». ${photo?"Décris ce qu'on voit sur la photo sans inventer de détails.":""} Pas de titre, pas d'emoji excessif. En ${LANG==="en"?"anglais":"français"}.`});
    const r = await gemini({tier:"fast", contents:[{role:"user", parts}]}); ta.value = r.text.trim();
  } catch(e){ ta.value = ""; toast(e.message); }
}
async function aiYearStory(kidId, year){
  if (!aiKey()){ aiSheet(); return; }
  const c = kidById(kidId); if (!c) return;
  const mems = S.memories.filter(m => (m.kidIds||[]).includes(c.id) && m.date.startsWith(year) && !lockedMem(m)).sort((a,b)=>a.date<b.date?-1:1);
  const ms = Object.entries(c.milestones||{}).filter(([,d]) => d.startsWith(year)).map(([k,d]) => `${MS.find(x=>x.k===k)?.t||k} (${d})`);
  const gr = (c.growth||[]).filter(g => g.date.startsWith(year)).sort((a,b)=>a.date<b.date?-1:1);
  const photos = S.photos.filter(p => p.date.startsWith(year) && (p.kidIds||[]).includes(c.id)).length;
  if (!mems.length && !ms.length) return toast(T("Ajoutez quelques souvenirs de {y} d'abord",{y:year}));
  sheet(`${sheetHead(T("L'année {y} de {n}",{y:year, n:esc(c.nick||c.name)}))}<p class="muted">${T("Écriture du récit…")}</p>`);
  try {
    const data = mems.map(m => `- ${m.date} [${m.kind||"moment"}] ${m.title}${m.text?` : ${m.text.slice(0,300)}`:""}${m.answers?` : ${Object.entries(m.answers).map(([q,a])=>`${q} ${a}`).join("; ")}`:""}`).join("\n");
    const r = await gemini({contents:[{role:"user", parts:[{text:`Écris le récit de l'année ${year} de ${c.nick||c.name} (né·e le ${c.dob}), comme une page d'album de famille : 250 à 400 mots, chronologique, tendre, avec des intertitres courts par saison. N'invente aucun fait : utilise seulement ces éléments.\nSouvenirs :\n${data||"aucun"}\nJalons atteints : ${ms.join("; ")||"aucun"}\nMesures : ${gr.length>1?`de ${gr[0].weight||"?"} kg / ${gr[0].height||"?"} cm à ${gr[gr.length-1].weight||"?"} kg / ${gr[gr.length-1].height||"?"} cm`:"non"}\nPhotos du jour prises : ${photos}. En ${LANG==="en"?"anglais":"français"}.`}]}]});
    UI.aiOut = {kind:"year", text:r.text, kid:c.id, year}; aiHist("memory", T("L'année {y} de {n}",{y:year, n:c.nick||c.name}), r.text, {kid:c.id});
    sheet(`${sheetHead(T("L'année {y} de {n}",{y:year, n:esc(c.nick||c.name)}))}<div>${md(r.text)}</div><div class="row"><button class="btn kid" data-act="aiOutKeep">${icon("star")}${T("Garder dans les souvenirs")}</button><button class="btn ghost" data-act="aiOutShare">${icon("share")}${T("Partager")}</button></div>`, "wide");
  } catch(e){ closeSheet(); toast(e.message); }
}

Object.assign(ACT, {
  aiScan: v => aiScan(v), scanRetry: () => aiScan(UI.scanImg.kind, UI.scanImg.img), scanImport: () => scanImport(),
  scanMeal: () => { const o = UI.scan.out; mealForm({items:[{name:o.product||"", group:FOOD_GROUPS[o.group]?o.group:"autres", qty:o.portion||"", nut:o.nut||null}], comment:o.verdict, ai:true}); },
  scanFav: () => { const o = UI.scan.out, c = kidById(UI.scan.kid); if (!c.foodFav.some(f => f.name === o.product)) c.foodFav.push({name:o.product, group:FOOD_GROUPS[o.group]?o.group:"autres"}); commit(T("Ajouté aux favoris")); },
  aiOutShare: () => Native.share({title:appName(), text:UI.aiOut?.text||""}),
  aiOutKeep: () => { const o = UI.aiOut; if (!o) return; const title = (o.text.match(/^#+\s*(.+)$/m)||[])[1] || (o.kind === "year" ? T("Notre année {y}",{y:o.year}) : T("Histoire du soir"));
    S.memories.push({id:uid(), kind:o.kind === "year" ? "yearbook" : "story", date:o.kind === "year" ? `${o.year}-12-31` > iso(today()) ? iso(today()) : `${o.year}-12-31` : iso(today()), title, text:o.text, kidIds:o.kid?[o.kid]:[]}); commit(T("Souvenir enregistré")); },
  aiMemText: v => { const [a, b] = (v||"m-text|m-title").split("|"); aiMemoryText(a, b); },
  aiYear: v => { const [kid, y] = v.split("|"); aiYearStory(kid, y); },
});
