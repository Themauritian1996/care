/* =========================================================================
   TRIBE — agenda, disponibilités, souvenirs, photos, défis, discussions, groupes, rapport
   ========================================================================= */

/* ======== ÉVÉNEMENTS ======== */
const evSort = (a,b) => (a.date+(a.time||"")) < (b.date+(b.time||"")) ? -1 : 1;
function expandRecur(e, from, to){
  if (!e.recur || e.recur === "none") return [e];
  const out = [], start = parseD(e.date), until = e.until ? parseD(e.until) : to;
  for (let i = 0; i < 800; i++){
    const d = e.recur === "weekly" ? addDays(start, 7*i) : e.recur === "monthly" ? addMonths(start, i) : e.recur === "daily" ? addDays(start, i) : addMonths(start, 12*i);
    if (d > until || d > to) break;
    if (d >= from) out.push({...e, date:iso(d), occ:true});
  }
  return out;
}
function allEvents(from = addDays(today(), -60), to = addDays(today(), 400)){
  const ev = [];
  S.events.forEach(e => expandRecur(e, from, to).forEach(x => ev.push(x)));
  S.children.forEach(c => {
    const nm = c.nick || c.name;
    if (isPrenatal(c)) { ev.push({id:"due"+c.id, date:c.dueDate, title:T("Date prévue : {n}",{n:nm}), type:"anniv", auto:true, kidIds:[c.id]}); return; }
    PIQ.forEach(g => { const ds = vaxStatus(c, g).filter(d => d.st==="avenir"||d.st==="du"); if (ds.length && ds[0].due - today() < 365*DAY) ev.push({id:"v"+c.id+g.age, date:iso(ds[0].due), title:T("Vaccins {g} · {n}",{g:T(g.label), n:nm}), type:"vaccin", auto:true, kidIds:[c.id]}); });
    const b = parseD(c.dob), y = today().getFullYear();
    [y, y+1].forEach(yy => { const d = new Date(yy, b.getMonth(), b.getDate()); if (d > b) ev.push({id:"b"+c.id+yy, date:iso(d), title:T("Anniversaire de {n} · {a} an(s)",{n:nm, a:yy-b.getFullYear()}), type:"anniv", auto:true, kidIds:[c.id]}); });
    const nv = nextVisit(c); if (nv && !S.events.some(e => e.type==="medecin" && (e.kidIds||[]).includes(c.id) && Math.abs(parseD(e.date) - nv.date) < 45*DAY)) ev.push({id:"vis"+c.id, date:iso(nv.date), title:T("Visite de suivi à planifier · {n}",{n:nm}), type:"visite", auto:true, kidIds:[c.id]});
    if (mod(c,"sports")) (c.activities||[]).forEach(a => { for (let i = -7; i <= 60; i++){ const d = addDays(today(), i); if (a.days.map(Number).includes(d.getDay())) ev.push({id:"a"+a.id+iso(d), date:iso(d), time:a.time, title:`${a.name} · ${nm}`, type:"sport", auto:true, kidIds:[c.id]}); } });
  });
  if (feat("memories")) S.memories.forEach(m => ev.push({id:"mem"+m.id, date:m.date, title:m.title, type:"souvenir", auto:true, memId:m.id}));
  if (feat("photos")) S.photos.forEach(p => ev.push({id:"ph"+p.id, date:p.date, title:p.caption || T("Photo du jour"), type:"photo", auto:true, photoId:p.id}));
  (S.groups||[]).forEach(g => (g.events||[]).forEach(e => ev.push({...e, type:"groupe", auto:true, title:`${e.title} · ${g.name}`})));
  return ev;
}
function eventRow(e){
  const [col, lbl] = EVT[e.type] || EVT.autre, d = parseD(e.date);
  const who = (e.kidIds||[]).map(id => kidById(id)).filter(Boolean).map(k => k.nick||k.name).concat((e.memberIds||[]).map(id => member(id)?.name).filter(Boolean));
  const act = e.memId ? `data-act="openMemory" data-v="${e.memId}"` : e.photoId ? `data-act="openPhoto" data-v="${e.photoId}"` : e.auto ? "" : `data-act="eventForm" data-v="edit:${e.id}"`;
  return `<div class="li" ${act} style="${act?"cursor:pointer":""}"><div class="ic" style="background:var(--${col}-bg);color:var(--${col}-ink);display:flex;flex-direction:column;justify-content:center;line-height:1"><b style="font-family:var(--display);font-size:1rem">${d.getDate()}</b><span style="font-size:.6rem;text-transform:uppercase;font-weight:700">${d.toLocaleDateString(LOCALE(),{month:"short"}).replace(".","")}</span></div>
    <div class="grow"><div class="li-title">${e.pinned?icon("pin").replace("<svg",'<svg style="width:14px;height:14px;vertical-align:-2px"')+" ":""}${esc(e.title)}</div><div class="small muted">${T(lbl)}${e.time?` · ${e.time}`:""}${e.recur&&e.recur!=="none"?` · ${T({daily:"chaque jour",weekly:"chaque semaine",monthly:"chaque mois",yearly:"chaque année"}[e.recur])}`:""}${who.length?` · ${esc(who.join(", "))}`:""}</div></div></div>`;
}

/* ======== AGENDA ======== */
function agendaView(){
  const tabs = [["mois",T("Calendrier")],["dispo",T("Disponibilités")],["liste",T("À venir")]];
  let h = `<div class="seg">${tabs.map(([id,l])=>`<button data-act="agTab" data-v="${id}" aria-pressed="${UI.sub.agenda===id}">${l}</button>`).join("")}</div>`;
  const pins = S.events.filter(e => e.pinned);
  if (pins.length && UI.sub.agenda !== "dispo") h += `<div class="card"><div class="card-h"><h3>${icon("pin").replace("<svg",'<svg style="width:18px;height:18px;vertical-align:-3px"')} ${T("Notes épinglées")}</h3></div><div class="list">${pins.map(eventRow).join("")}</div></div>`;
  if (UI.sub.agenda === "dispo") return h + availView();
  if (UI.sub.agenda === "liste"){
    const up = allEvents().filter(e => e.date >= iso(today()) && e.type !== "sport" && e.type !== "photo").sort(evSort).slice(0,40);
    return h + `<div class="card"><div class="card-h"><h2>${T("À venir")}</h2><button class="btn sm kid" data-act="eventForm">${icon("plus")}${T("Ajouter")}</button></div>${up.length?`<div class="list">${up.map(eventRow).join("")}</div>`:empty("cal",T("Rien de prévu."))}</div>`;
  }
  const base = UI.calMonth ? parseD(UI.calMonth) : new Date(today().getFullYear(), today().getMonth(), 1);
  const from = addDays(base, -7), to = addDays(addMonths(base,1), 7), ev = allEvents(from, to);
  const first = new Date(base.getFullYear(), base.getMonth(), 1), start = addDays(first, -((first.getDay()+6)%7));
  const sel = UI.calSel || iso(today());
  let cells = "";
  for (let i=0;i<42;i++){
    const d = addDays(start, i), ds = iso(d), out = d.getMonth() !== base.getMonth();
    if (i >= 35 && out && d.getDay()===1) break;
    const de = ev.filter(e => e.date === ds), ph = de.find(e => e.type === "photo");
    cells += `<button class="day ${out?"out":""} ${ds===iso(today())?"today":""} ${ds===sel?"sel":""}" data-act="day" data-v="${ds}" aria-label="${fmtD(ds,{weekday:"long",day:"numeric",month:"long"})}">${ph?`<span class="thumb" data-photo="${ph.photoId}"></span>`:""}<span class="num">${d.getDate()}</span><span class="dots">${de.filter(e=>e.type!=="photo").slice(0,4).map(e=>`<i style="background:var(--${(EVT[e.type]||EVT.autre)[0]})"></i>`).join("")}</span></button>`;
  }
  AFTER.push(async () => { for (const el of $$(".day .thumb")){ const d = await PhotoDB.get(el.dataset.photo); if (d) el.style.backgroundImage = `url(${d})`; } });
  const selEv = ev.filter(e => e.date === sel).sort(evSort);
  const dow = LANG === "en" ? ["M","T","W","T","F","S","S"] : ["L","M","M","J","V","S","D"];
  return h + `<div class="grid"><div class="card c7"><div class="card-h"><h2 style="text-transform:capitalize">${base.toLocaleDateString(LOCALE(),{month:"long",year:"numeric"})}</h2><div class="row"><button class="icon-btn" data-act="calNav" data-v="-1" aria-label="${T("Mois précédent")}">${icon("left")}</button><button class="btn sm ghost" data-act="calToday">${T("Aujourd'hui")}</button><button class="icon-btn" data-act="calNav" data-v="1" aria-label="${T("Mois suivant")}">${icon("right")}</button></div></div>
    <div class="cal">${dow.map(d=>`<div class="dow">${d}</div>`).join("")}${cells}</div>
    <div class="legend">${["medecin","vaccin","garde","sport","famille","groupe","souvenir"].map(k=>`<span><i style="background:var(--${EVT[k][0]});width:8px;height:8px;border-radius:50%"></i>${T(EVT[k][1])}</span>`).join("")}</div></div>
    <div class="card c5"><div class="card-h"><h2 style="text-transform:capitalize">${fmtD(sel,{weekday:"long",day:"numeric",month:"long"})}</h2></div>
      <div class="row">${isKidUser()?"":`<button class="btn sm kid" data-act="eventForm" data-v="${sel}">${icon("plus")}${T("Événement")}</button>${aiBtn("aiScan","events",T("Lire une invitation (IA)"),"camera")}`}${feat("memories")?`<button class="btn sm ghost" data-act="memoryForm" data-v="${sel}">${icon("star")}${T("Souvenir")}</button>`:""}${feat("photos")&&allow("photos")?`<button class="btn sm ghost" data-act="photoDay" data-v="${sel}">${icon("camera")}${T("Photo")}</button>`:""}</div>
      ${selEv.length?`<div class="list">${selEv.map(eventRow).join("")}</div>`:`<p class="muted small">${T("Rien ce jour-là.")}</p>`}</div></div>`;
}
function eventForm(v){
  let e = {title:"", date:v && !v.startsWith("edit:") ? v : iso(today()), time:"", type:"famille", kidIds:[], memberIds:[], recur:"none", pinned:false, notes:""};
  if (v && v.startsWith("edit:")) e = {...S.events.find(x => x.id === v.slice(5))};
  sheet(`<form class="stack" data-form="event" data-id="${e.id||""}" style="gap:14px">${sheetHead(e.id?T("Modifier"):T("Nouvel événement"))}
    ${fld("e-title",T("Titre"),inp("e-title",e.title,`required placeholder="${T("Ex. : souper chez grand-maman")}"`))}
    <div class="fgrid">${fld("e-date",T("Date"),inp("e-date",e.date,'type="date" required'))}${fld("e-time",T("Heure (facultatif)"),inp("e-time",e.time,'type="time"'))}</div>
    <div class="field"><label>${T("Type")}</label>${radios("etype",["famille","medecin","dentiste","vaccin","garde","therapie","sport","note","autre"].map(k=>[k,T(EVT[k][1])]),e.type)}</div>
    <div class="field"><label>${T("Répéter")}</label>${radios("erecur",[["none",T("Jamais")],["daily",T("Chaque jour")],["weekly",T("Chaque semaine")],["monthly",T("Chaque mois")],["yearly",T("Chaque année")]],e.recur||"none")}</div>
    <label class="switch"><input type="checkbox" id="e-pin" ${e.pinned?"checked":""}><span class="tg"></span><span class="grow"><b>${T("Épingler (reste visible en haut de l'agenda)")}</b></span></label>
    ${S.children.length?`<div class="field"><label>${T("Enfants concernés")}</label>${checks("ekids",S.children.map(k=>[k.id,k.nick||k.name]),e.kidIds||[])}</div>`:""}
    ${S.family.members.length>1?`<div class="field"><label>${T("Membres concernés")}</label>${checks("emems",S.family.members.filter(m=>!m.kidId).map(m=>[m.id,m.name]),e.memberIds||[])}</div>`:""}
    ${fld("e-notes",T("Notes"),`<textarea class="inp" id="e-notes">${esc(e.notes||"")}</textarea>`)}
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${e.id?`<button type="button" class="btn danger" data-act="delEvent" data-v="${e.id}">${T("Supprimer")}</button>`:""}</div></form>`);
}

/* ---------- disponibilités : grille hebdo + chevauchement ---------- */
const SLOTS = [["am","Matin"],["pm","Après-midi"],["ev","Soir"]];
const dayOrder = [1,2,3,4,5,6,0];
function availGrid(map, editable, whoAttr){
  const wd = WD();
  return `<div class="avail"><span></span>${dayOrder.map(d=>`<span class="h">${wd[d]}</span>`).join("")}${SLOTS.map(([s,l]) => `<span class="h" style="text-align:left">${T(l)}</span>${dayOrder.map(d => { const k = `${d}-${s}`, on = !!map[k]; return editable ? `<button data-act="availToggle" data-v="${k}" ${whoAttr} aria-pressed="${on}">${on?T("Libre"):""}</button>` : `<span class="heat" style="background:${on?"var(--mint)":"var(--surface2)"}">${on?"✓":""}</span>`; }).join("")}`).join("")}</div>`;
}
function heatGrid(people, getMap){
  const wd = WD(), n = people.length || 1;
  return `<div class="avail"><span></span>${dayOrder.map(d=>`<span class="h">${wd[d]}</span>`).join("")}${SLOTS.map(([s,l]) => `<span class="h" style="text-align:left">${T(l)}</span>${dayOrder.map(d => { const k = `${d}-${s}`, free = people.filter(p => getMap(p)[k]); const all = free.length === n && n > 1;
    return `<span class="heat" title="${esc(free.map(p=>p.name).join(", "))}" style="background:${all?"var(--mint)":free.length?`color-mix(in srgb, var(--mint) ${Math.round(free.length/n*70)}%, var(--surface2))`:"var(--surface2)"};color:${all?"#0E3B2A":"inherit"}">${free.length?`${free.length}/${n}`:""}</span>`; }).join("")}`).join("")}</div>`;
}
function bestSlots(people, getMap){
  const n = people.length, out = [];
  dayOrder.forEach(d => SLOTS.forEach(([s,l]) => { const k = `${d}-${s}`, free = people.filter(p => getMap(p)[k]).length; if (free && free >= Math.max(2, n-1)) out.push({d, s:l, free}); }));
  return out.sort((a,b)=>b.free-a.free).slice(0,5);
}
function availView(){
  const editId = UI.availWho || S.me, editable = !isKidUser() || editId === S.me;
  const people = S.family.members, map = S.avail[editId] || {};
  const best = bestSlots(people, p => S.avail[p.id] || {});
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Horaire type de la semaine")}</span><h2>${T("Mes moments libres")}</h2></div></div>
    <div class="pick">${people.map(p => `<button data-act="availWho" data-v="${p.id}" aria-pressed="${p.id===editId}">${esc(p.name)}</button>`).join("")}</div>
    <p class="small muted">${T("Touchez les cases où {n} est libre. Chacun peut remplir les siennes depuis son téléphone.",{n:esc(member(editId)?.name||"")})}</p>
    ${availGrid(map, editable, `data-who="${editId}"`)}</div>
    <div class="card"><div class="card-h"><h2>${T("Quand tout le monde est libre")}</h2></div>${heatGrid(people, p => S.avail[p.id] || {})}
    ${best.length?`<div class="banner ok">${icon("people")}<div class="small"><b>${T("Meilleurs moments :")}</b> ${best.map(b => `${WD()[b.d]} ${T(b.s).toLowerCase()} (${b.free}/${people.length})`).join(" · ")}</div></div>`:`<p class="small muted">${T("Remplissez les disponibilités de chacun pour trouver un moment commun.")}</p>`}
    ${best.length && !isKidUser() ? `<button class="btn kid" data-act="planBest" data-v="${best[0].d}">${icon("cal")}${T("Planifier une activité à ce moment")}</button>`:""}</div>`;
}

/* ======== SOUVENIRS ET PHOTOS ======== */
function souvenirsView(){
  const tabs = [feat("photos")&&["photos",T("Photos")], feat("memories")&&["speciaux",T("Spéciaux")], feat("memories")&&["moments",T("Moments")]].filter(Boolean);
  if (!tabs.some(t=>t[0]===UI.sub.souv)) UI.sub.souv = tabs[0][0];
  let h = tabs.length > 1 ? `<div class="seg">${tabs.map(([id,l])=>`<button data-act="souvTab" data-v="${id}" aria-pressed="${UI.sub.souv===id}">${l}</button>`).join("")}</div>` : "";
  if (UI.sub.souv === "speciaux") return h + specialView();
  if (UI.sub.souv === "photos"){
    const list = S.photos.filter(p => UI.photoCat === "all" || p.cat === UI.photoCat).sort((a,b)=>a.date<b.date?1:-1);
    h += `<div class="card"><div class="card-h"><h2>${T("Album")}</h2><button class="btn kid" data-act="photoDay">${icon("camera")}${T("Photo du jour")}</button></div>
      <div class="pick"><button data-act="photoCat" data-v="all" aria-pressed="${UI.photoCat==="all"}">${T("Toutes")} (${S.photos.length})</button>${PHOTO_CATS.map(c=>`<button data-act="photoCat" data-v="${c.id}" aria-pressed="${UI.photoCat===c.id}">${T(c.l)} (${S.photos.filter(p=>p.cat===c.id).length})</button>`).join("")}</div>
      ${list.length ? `<div class="gallery">${list.map(p => `<button data-act="openPhoto" data-v="${p.id}" aria-label="${esc(p.caption||T("Photo"))}"><img data-photo="${p.id}" alt=""><span class="cap"><span class="chip ${PHOTO_CATS.find(c=>c.id===p.cat)?.c||""}">${fmtD(p.date,{day:"numeric",month:"short"})}</span></span></button>`).join("")}</div>` : empty("camera", T("Une photo par jour, classée par catégorie : un bel album qui se remplit tout seul."))}</div>`;
    AFTER.push(async () => { for (const el of $$("img[data-photo]")){ const d = await PhotoDB.get(el.dataset.photo); if (d) el.src = d; } });
  } else {
    const byYear = {}; [...S.memories].sort((a,b)=>a.date<b.date?1:-1).forEach(m => (byYear[m.date.slice(0,4)] = byYear[m.date.slice(0,4)] || []).push(m));
    const md0 = iso(today()).slice(5), onThisDay = S.memories.filter(x => x.date.slice(5) === md0 && x.date < iso(today()));
    h += `${onThisDay.length?`<div class="card tint"><h2>${T("Ce jour-là")}</h2>${onThisDay.map(m=>`<button class="memory" style="border-top:0;border-right:0;border-bottom:0;text-align:left;cursor:pointer;color:inherit" data-act="openMemory" data-v="${m.id}"><b>${T("Il y a {n} an(s)",{n:today().getFullYear()-parseD(m.date).getFullYear()})}</b> · ${esc(m.title)}</button>`).join("")}</div>`:""}
      <div class="card"><div class="card-h"><h2>${T("Moments précieux")}</h2><button class="btn kid" data-act="memoryForm">${icon("plus")}${T("Ajouter")}</button></div>
      ${Object.keys(byYear).length ? Object.entries(byYear).map(([y, arr]) => `<div class="eyebrow" style="margin-top:6px">${y}</div><div class="list">${arr.map(m => `<button class="li" data-act="openMemory" data-v="${m.id}"><div class="ic" style="background:var(--butter-bg);color:var(--butter-ink)">${icon("star")}</div><div class="grow"><div class="li-title">${esc(m.title)}</div><div class="small muted">${fmtD(m.date)}${(m.kidIds||[]).length?" · "+esc(m.kidIds.map(id=>kidById(id)?.nick||kidById(id)?.name).filter(Boolean).join(", ")):""}${m.drive?" · "+T("dans Drive"):""}</div></div>${m.photoId?icon("camera").replace("<svg",'<svg style="width:18px;height:18px;color:var(--soft)"'):""}</button>`).join("")}</div>`).join("") : empty("star", T("Premier sourire, premiers pas, une phrase drôle, un voyage : gardez les moments précieux. Ils réapparaissent chaque année à la même date."))}</div>`;
  }
  return h;
}
async function photoDay(date){
  const data = await Native.takePhoto({source:"prompt"}); if (!data) return;
  const small = await shrinkImage(data, 1280, 0.82);
  UI.photoDraft = {day: small};
  sheet(`<form class="stack" data-form="photo" style="gap:14px">${sheetHead(T("Photo du jour"))}<img src="${small}" alt="" style="border-radius:16px;max-height:280px;object-fit:cover">
    ${fld("p-cap",T("Légende (facultatif)"),`<input class="inp" id="p-cap">`)}
    <div class="field"><label>${T("Catégorie")}</label>${radios("pcat",PHOTO_CATS.map(c=>[c.id,T(c.l)]),"cute")}</div>
    ${S.children.length?`<div class="field"><label>${T("Qui est sur la photo ?")}</label>${checks("pkids",S.children.map(k=>[k.id,k.nick||k.name]),S.children.length===1?[S.children[0].id]:[])}</div>`:""}
    ${fld("p-date",T("Date"),`<input class="inp" id="p-date" type="date" value="${date||iso(today())}">`)}
    <button class="btn kid" type="submit">${T("Enregistrer")}</button></form>`);
}
async function openPhoto(id){
  const p = S.photos.find(x => x.id === id); if (!p) return;
  const d = await PhotoDB.get(id) || (await Cloud.fetchPhoto?.(id));
  sheet(`${sheetHead(esc(p.caption || T("Photo du jour")))}${d?`<img src="${d}" alt="" style="border-radius:16px;width:100%;max-height:60vh;object-fit:contain;background:var(--surface2)">`:`<p class="muted">${T("Photo non disponible sur cet appareil.")}</p>`}
    <div class="row"><span class="chip ${PHOTO_CATS.find(c=>c.id===p.cat)?.c||""}">${T(PHOTO_CATS.find(c=>c.id===p.cat)?.l||"")}</span><span class="small muted">${fmtD(p.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span></div>
    <div class="row"><button class="btn kid" data-act="sharePhoto" data-v="${id}">${icon("share")}${T("Partager")}</button>${Cloud.canDrive?.()?`<button class="btn ghost" data-act="photoDrive" data-v="${id}">${icon("drive")}${T("Google Drive")}</button>`:""}${!isKidUser()||allow("delete")?`<button class="btn danger" data-act="delPhoto" data-v="${id}">${icon("trash")}</button>`:""}</div>`, "wide");
}
function memoryForm(date, id){
  const m = S.memories.find(x => x.id === id) || {title:"", date:date||iso(today()), text:"", kidIds:S.children.length===1?[S.children[0].id]:[]};
  UI.photoDraft = {mem2: null};
  sheet(`<form class="stack" data-form="memory" data-id="${m.id||""}" style="gap:14px">${sheetHead(m.id?T("Modifier le souvenir"):T("Un moment précieux"))}
    ${fld("m-title",T("Quoi ?"),inp("m-title",m.title,`required placeholder="${T("Premiers pas, première dent, une phrase drôle…")}"`))}
    ${fld("m-date",T("Date (même passée)"),inp("m-date",m.date,'type="date" required'))}
    ${fld("m-text",T("Raconte (facultatif)"),`<textarea class="inp" id="m-text">${esc(m.text||"")}</textarea>`)}${aiReady()?`<button type="button" class="btn sm ghost" data-act="aiMemText" data-v="m-text|m-title" style="align-self:flex-start">${icon("spark")}${T("Écrire avec l'IA")}</button>`:""}
    ${S.children.length?`<div class="field"><label>${T("Enfants")}</label>${checks("mkids",S.children.map(k=>[k.id,k.nick||k.name]),m.kidIds||[])}</div>`:""}
    <button type="button" class="btn ghost" data-act="memPhoto">${icon("camera")}${T("Ajouter une photo (facultatif)")}</button><div id="memPhotoPrev"></div>
    ${Cloud.canDrive?.() ? `<label class="switch"><input type="checkbox" id="m-drive" checked><span class="tg"></span><span class="grow">${T("Garder aussi une copie dans Google Drive")}</span></label>` : ""}
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${m.id?`<button type="button" class="btn danger" data-act="delMemory" data-v="${m.id}">${T("Supprimer")}</button>`:""}</div></form>`);
}
async function openMemory(id){
  const m = S.memories.find(x => x.id === id); if (!m) return;
  const ph = m.photoId ? await PhotoDB.get(m.photoId) : null;
  const lk = lockedMem(m), canMod = !isKidUser() && (m.kind !== "letter" || !lk || m.by === S.me);
  sheet(`${sheetHead(esc(m.kind === "quote" ? T("Mot d'enfant") : m.title))}<span class="small muted">${fmtD(m.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>${ph && !lk?`<img src="${ph}" alt="" style="border-radius:16px;max-height:50vh;object-fit:contain">`:""}${m.kind ? specialDetail(m) : m.text?`<p>${esc(m.text)}</p>`:""}
    ${lk ? (canMod ? `<div class="row"><button class="btn ghost" data-act="memoryEdit" data-v="${id}">${icon("edit")}${T("Relire ou modifier ma lettre")}</button></div>` : "") : `<div class="row"><button class="btn kid" data-act="shareMemory" data-v="${id}">${icon("share")}${T("Partager")}</button>${Cloud.canDrive?.()?`<button class="btn ghost" data-act="memoryDrive" data-v="${id}">${icon("drive")}${m.drive?T("Mettre à jour dans Drive"):T("Google Drive")}</button>`:""}${canMod?`<button class="btn ghost" data-act="memoryEdit" data-v="${id}">${icon("edit")}${T("Modifier")}</button>`:""}</div>`}`, m.kind === "story" || m.kind === "yearbook" ? "wide" : "");
}

/* ======== DÉFIS ET RÉCOMPENSES ======== */
function taskDueOn(t, d){
  if (t.recur === "daily") return true;
  if (t.recur === "weekly") return (t.days||[]).map(Number).includes(d.getDay());
  return t.date === iso(d);
}
const completionOf = (taskId, memberId, date) => S.completions.find(x => x.taskId === taskId && x.memberId === memberId && x.date === date);
const levelOf = pts => { let i = LEVELS.findIndex(l => pts < l); if (i < 0) i = LEVELS.length; return {lvl:i, from:LEVELS[i-1]||0, to:LEVELS[i]||LEVELS[LEVELS.length-1]*1.5}; };
const leaderboard = () => S.family.members.filter(m => S.tasks.some(t => (t.assignees||[]).includes(m.id))).map(m => ({m, ...pointsOf(m.id)})).sort((a,b)=>b.week-a.week);
function unreadCount(){ if (!Cloud.user) return 0; const lr = (S.lastRead||{}).family || 0; return S.messages.filter(x => x.at > lr && x.uid !== Cloud.user.uid).length + sum((S.groups||[]).map(g => (g.messages||[]).filter(x => x.at > ((S.lastRead||{})[g.id]||0) && x.uid !== Cloud.user.uid).length)); }
function tribuView(){
  const tabs = [feat("rewards")&&["defis",T("Défis")], feat("chat")&&allow("chat")&&["chat",T("Discussion")], feat("groups")&&allow("groups")&&["groupes",T("Groupes")]].filter(Boolean);
  if (!tabs.some(t=>t[0]===UI.sub.tribu)) UI.sub.tribu = tabs[0]?.[0];
  let h = tabs.length > 1 ? `<div class="seg">${tabs.map(([id,l])=>`<button data-act="tribuTab" data-v="${id}" aria-pressed="${UI.sub.tribu===id}">${l}</button>`).join("")}</div>` : "";
  if (UI.sub.tribu === "defis") return h + defisView();
  if (UI.sub.tribu === "chat") return h + chatView("family");
  return h + groupsView();
}
function taskForm(id){
  const t = S.tasks.find(x => x.id === id) || {title:"", points:10, assignees:[], recur:"daily", days:[1,2,3,4,5], icon:"star"};
  const ics = ["star","bed","broom","book","pencil","spoon","dish","tooth","trash","note","run","screen","heart"];
  sheet(`<form class="stack" data-form="task" data-id="${id||""}" style="gap:14px">${sheetHead(id?T("Modifier le défi"):T("Nouveau défi"))}
    ${id?"":`<div class="field"><label>${T("Idées")}</label><div class="pick">${TASK_TPL.map((x,i)=>`<button type="button" data-act="taskTpl" data-v="${i}">${T(x.t)}</button>`).join("")}</div></div>`}
    ${fld("tk-title",T("Défi"),inp("tk-title",t.title,"required"))}
    ${fld("tk-pts",T("Points"),numIn("tk-pts","",5,t.points))}
    <div class="field"><label>${T("Pour qui ?")}</label>${checks("tkwho",S.family.members.map(m=>[m.id,m.name]),t.assignees)}</div>
    <label class="switch"><input type="checkbox" id="tk-team" ${t.team?"checked":""}><span class="tg"></span><span class="grow"><b>${T("Défi d'équipe")}</b><br><span class="small muted">${T("Fait ensemble : chaque personne cochée reçoit les points en un seul geste.")}</span></span></label>
    <div class="field"><label>${T("Quand ?")}</label>${radios("tkrec",[["daily",T("Chaque jour")],["weekly",T("Certains jours")],["once",T("Une fois")]],t.recur)}</div>
    <div class="field"><label>${T("Jours (si certains jours)")}</label>${checks("tkdays",[1,2,3,4,5,6,0].map(d=>[String(d),WD()[d]]),(t.days||[]).map(String))}</div>
    ${fld("tk-date",T("Date (si une fois)"),inp("tk-date",t.date||iso(today()),'type="date"'))}
    <div class="field"><label>${T("Icône")}</label><div class="radio-row">${ics.map(i=>`<label><input type="radio" name="tkicon" value="${i}" ${t.icon===i?"checked":""}><span style="display:grid;place-items:center;width:42px;height:38px;padding:0">${icon(i).replace("<svg",'<svg style="width:20px;height:20px"')}</span></label>`).join("")}</div></div>
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${id?`<button type="button" class="btn danger" data-act="delTask" data-v="${id}">${T("Supprimer")}</button>`:""}</div></form>`);
}
function rewardForm(){
  sheet(`<form class="stack" data-form="reward" style="gap:14px">${sheetHead(T("Nouvelle récompense"))}
    <div class="pick">${REWARD_TPL.map((x,i)=>`<button type="button" data-act="rewardTpl" data-v="${i}">${T(x.t)}</button>`).join("")}</div>
    ${fld("rw-title",T("Récompense"),inp("rw-title","","required"))}${fld("rw-cost",T("Coût en points"),numIn("rw-cost","",5,50))}
    <button class="btn kid" type="submit">${T("Ajouter")}</button></form>`);
}

/* ======== DISCUSSIONS ======== */
const msgRow = x => { const mine = Cloud.user && x.uid === Cloud.user.uid; return `<div class="msg ${mine?"mine":""}">${mine?"":`<div class="who">${esc(x.name||"")}</div>`}${esc(x.text)}<div class="tiny" style="opacity:.6;text-align:right">${fmtT(x.at)}</div></div>`; };
function chatView(channel){
  if (!Cloud.user) return `<div class="card">${empty("chat", T("La discussion de famille et de groupe demande un compte, pour que chacun la voie sur son téléphone."), Cloud.configured?`<button class="btn kid" data-act="showLogin">${T("Se connecter")}</button>`:"")}</div>`;
  const g = channel === "family" ? null : S.groups.find(x => x.id === channel);
  const msgs = g ? (g.messages||[]) : S.messages;
  S.lastRead = S.lastRead || {}; S.lastRead[g ? g.id : "family"] = Date.now();
  AFTER.push(() => { const b = $("#chatbox"); if (b) b.scrollTop = b.scrollHeight; });
  return `<div class="card"><div class="card-h"><h2>${g ? esc(g.name) : T("Famille")}</h2>${g?`<button class="btn sm ghost" data-act="tribuTab" data-v="groupes">${icon("left")}${T("Groupes")}</button>`:""}</div>
    <div class="chatbox" id="chatbox">${msgs.length ? msgs.slice(-200).map(msgRow).join("") : `<p class="small muted" style="text-align:center">${T("Écrivez le premier message.")}</p>`}</div>
    <form class="composer" data-form="chat" data-ch="${channel}"><textarea class="inp" id="chat-in" rows="1" placeholder="${T("Message")}" enterkeyhint="send"></textarea><button class="btn kid" type="submit" aria-label="${T("Envoyer")}">${icon("send")}</button></form></div>`;
}
function groupsView(){
  if (UI.groupOpen) return groupDetail(UI.groupOpen);
  if (!Cloud.user) return `<div class="card">${empty("people", T("Les groupes permettent de planifier des activités avec des amis ou des cousins et d'en discuter. Il faut un compte."), Cloud.configured?`<button class="btn kid" data-act="showLogin">${T("Se connecter")}</button>`:"")}</div>`;
  return `<div class="card"><div class="card-h"><h2>${T("Mes groupes")}</h2><button class="btn sm kid" data-act="groupNew">${icon("plus")}${T("Créer")}</button></div>
    ${S.groups.length ? `<div class="list">${S.groups.map(g => `<button class="li" data-act="groupOpen" data-v="${g.id}"><div class="ic" style="background:var(--teal-bg);color:var(--teal-ink)">${icon("people")}</div><div class="grow"><div class="li-title">${esc(g.name)}</div><div class="small muted">${Object.keys(g.members||{}).length} ${T("membres")} · ${(g.events||[]).filter(e=>e.date>=iso(today())).length} ${T("activités à venir")}</div></div></button>`).join("")}</div>` : `<p class="small muted">${T("Ex. : « Cousins Tremblay », « Amis du soccer ». Planifiez des dates communes et discutez.")}</p>`}
    <form class="row" data-form="joinGroup">${inp("jg-code","",`placeholder="${T("Code d'invitation")}" style="text-transform:uppercase;max-width:200px"`)}<button class="btn ghost" type="submit">${T("Rejoindre")}</button></form></div>`;
}
function groupDetail(id){
  const g = S.groups.find(x => x.id === id); if (!g) { UI.groupOpen = null; return groupsView(); }
  const people = Object.entries(g.members||{}).map(([uid, m]) => ({id:uid, name:m.name}));
  const myAvail = (g.avail||{})[Cloud.user.uid] || {};
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${T("Groupe")}</span><h2>${esc(g.name)}</h2></div><div class="row"><button class="btn sm ghost" data-act="groupClose">${icon("left")}</button><button class="btn sm ghost" data-act="groupInvite" data-v="${id}">${T("Inviter")}</button><button class="btn sm kid" data-act="groupChat" data-v="${id}">${icon("chat")}${T("Discussion")}</button></div></div>
    <div class="row">${people.map(p=>`<span class="chip teal">${esc(p.name)}</span>`).join("")}</div><div id="groupInviteOut"></div></div>
    <div class="card"><div class="card-h"><h2>${T("Activités communes")}</h2><button class="btn sm kid" data-act="groupEvent" data-v="${id}">${icon("plus")}${T("Proposer")}</button></div>
    ${(g.events||[]).filter(e=>e.date>=iso(today())).sort(evSort).map(e => `<div class="taskrow"><div class="ic" style="background:var(--teal-bg);color:var(--teal-ink)">${icon("cal")}</div><div class="grow"><b>${esc(e.title)}</b><div class="tiny muted">${fmtD(e.date,{weekday:"long",day:"numeric",month:"long"})}${e.time?" · "+e.time:""}${e.place?" · "+esc(e.place):""}</div><div class="tiny">${T("Présents")} : ${Object.values(e.rsvp||{}).filter(r=>r.ok).map(r=>esc(r.name)).join(", ")||"—"}</div></div><button class="btn sm ${e.rsvp?.[Cloud.user.uid]?.ok?"kid":"ghost"}" data-act="groupRsvp" data-v="${id}|${e.id}">${e.rsvp?.[Cloud.user.uid]?.ok?T("J'y serai"):T("Je viens")}</button></div>`).join("") || `<p class="small muted">${T("Aucune activité prévue.")}</p>`}</div>
    <div class="card"><div class="card-h"><h2>${T("Mes disponibilités pour ce groupe")}</h2></div>${availGrid(myAvail, true, `data-group="${id}"`)}
    <h3>${T("Quand le groupe est libre")}</h3>${heatGrid(people, p => (g.avail||{})[p.id] || {})}</div>`;
}

/* ======== RAPPORT POUR LE MÉDECIN ======== */
function reportData(c){
  const m = ageMonths(c), em = effAge(c), g = goals(c);
  const growth = [...c.growth].sort((a,b)=>a.date<b.date?1:-1).slice(0,5).map(x => { const am = effAge(c, parseD(x.date)); return {date:x.date, age:ageLabel(ageMonths(c, parseD(x.date))), cells:["weight","height","ofc"].map(k => { if (!x[k]) return "—"; const z = zScore(k,c.sex,am,Number(x[k])); return `${fmtNum(x[k],k==="weight"?2:1)}${z!=null?` (P${pctLabel(z)})`:""}`; })}; });
  const vax = PIQ.flatMap(gr => vaxStatus(c,gr).filter(d => d.st!=="na" && (d.st!=="avenir" || gr.age <= m+6)).map(d => ({grp:T(gr.label), name:d.name, st:T(VSTAT[d.st][1]), det:d.rec?`${fmtD(d.rec.date)}${d.rec.lot?" · "+T("lot")+" "+d.rec.lot:""}${d.rec.reactions?" · "+d.rec.reactions:""}`:""})));
  const wk = Array.from({length:7},(_,i)=>dayTotals(c, addDays(today(), -i))), avg = k => sum(wk.map(t=>t[k]))/7;
  const last7 = c.logs.filter(l => Date.now()-l.t < 7*DAY);
  const devTalk = em < 78 ? MS.filter(it => msLevel(c, it, em).id === "parler").map(it => T(it.t)) : [];
  const devDom = em < 78 ? Object.entries(DOMAINS).map(([d,D]) => { const exp = MS.filter(it => it.d===d && it.b <= em); return exp.length ? `${T(D.short)} : ${exp.filter(it=>c.milestones[it.k]).length}/${exp.length}` : null; }).filter(Boolean) : [];
  return { c, m, em, growth, vax, vel:heightVelocity(c), mp:midParental(c), alerts:growthAlerts(c), devTalk, devDom,
    habits:{sleep:avg("sleep")/60, act:avg("act"), screen:avg("screen"), read:avg("read")}, g,
    temps:last7.filter(l=>l.type==="temp"), meds:last7.filter(l=>l.type==="med") };
}
function reportText(R){
  const c = R.c, L = [];
  L.push(T("RAPPORT DE SUIVI — {n}",{n:c.name.toUpperCase()}), `${T("Préparé par le parent le {d}",{d:fmtD(today(),{day:"numeric",month:"long",year:"numeric"})})}`, "");
  L.push(`${T("Naissance")} : ${fmtD(c.dob)} · ${c.sex==="M"?T("garçon"):T("fille")} · ${T("AG")} ${c.gaW} ${T("SA")} ${c.gaD||0} ${T("j")}`, `${T("Âge")} : ${ageLabel(R.m)}${usesCorrected(c)?` (${T("corrigé")} ${ageLabel(R.em)})`:""}`);
  if (c.allergies) L.push(`${T("ALLERGIES")} : ${c.allergies}`); if (c.conditions) L.push(`${T("Problèmes de santé")} : ${c.conditions}`); if (c.meds) L.push(`${T("Médicaments")} : ${c.meds}`);
  L.push("", `— ${T("CROISSANCE (OMS)")} —`); R.growth.forEach(g => L.push(`${fmtD(g.date)} (${g.age}) : ${T("poids")} ${g.cells[0]} kg · ${T("taille")} ${g.cells[1]} cm · ${T("PC")} ${g.cells[2]} cm`));
  if (R.vel) L.push(`${T("Vitesse de croissance")} : ${fmtNum(R.vel.v,1)} ${T("cm/an")}`); if (R.mp) L.push(`${T("Taille cible parentale")} : ${fmtNum(R.mp.t,0)} cm`);
  L.push("", `— ${T("VACCINATION (PIQ)")} —`); R.vax.forEach(v => L.push(`${v.grp} · ${v.name} : ${v.st}${v.det?` (${v.det})`:""}`));
  if (R.devDom.length) { L.push("", `— ${T("DÉVELOPPEMENT")} —`, R.devDom.join(" · ")); if (R.devTalk.length) L.push(`${T("À discuter")} : ${R.devTalk.join(" ; ")}`); }
  L.push("", `— ${T("HABITUDES (moyenne 7 jours)")} —`, `${T("Sommeil")} ${fmtNum(R.habits.sleep,1)} h · ${T("activité")} ${fmtMin(R.habits.act)} · ${T("écran")} ${fmtMin(R.habits.screen)} · ${T("lecture")} ${fmtMin(R.habits.read)}`);
  if (R.temps.length || R.meds.length){ L.push("", `— ${T("FIÈVRE ET MÉDICAMENTS, 7 JOURS")} —`); R.temps.forEach(l => L.push(`${fmtD(new Date(l.t),{day:"numeric",month:"short"})} ${fmtT(l.t)} · ${fmtNum(l.data.temp)} °C (${T(l.data.site)})`)); R.meds.forEach(l => L.push(`${fmtD(new Date(l.t),{day:"numeric",month:"short"})} ${fmtT(l.t)} · ${l.data.name}${l.data.dose?` ${l.data.dose}`:""}`)); }
  return L.join("\n");
}
function reportSheet(){
  const c = child(), R = reportData(c); UI.report = R;
  const sec = (t, body) => `<div class="stack" style="gap:6px"><h3 style="color:var(--kid-ink)">${t}</h3>${body}</div>`;
  sheet(`${sheetHead(T("Rapport pour la visite"))}
    <div class="row">${avatarOf(c,48)}<div class="grow"><b style="font-size:1.1rem">${esc(c.name)}</b><div class="small muted">${ageLabel(R.m)} · ${c.sex==="M"?T("garçon"):T("fille")} · ${T("né·e le {d}",{d:fmtD(c.dob)})}${usesCorrected(c)?` · ${T("AG")} ${c.gaW} ${T("SA")}`:""}</div></div></div>
    ${c.allergies?`<div class="banner alert">${icon("alert")}<div><b>${T("Allergies :")}</b> ${esc(c.allergies)}</div></div>`:""}
    ${sec(T("Croissance (OMS)"), R.growth.length?`<div class="tbl"><table><thead><tr><th>${T("Date")}</th><th>${T("Poids (kg)")}</th><th>${T("Taille (cm)")}</th><th>${T("PC (cm)")}</th></tr></thead><tbody>${R.growth.map(g=>`<tr><td>${fmtD(g.date)}</td>${g.cells.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${R.vel?`<p class="small">${T("Vitesse de croissance")} : <b>${fmtNum(R.vel.v,1)} ${T("cm/an")}</b>${R.mp?` · ${T("taille cible parentale")} ${fmtNum(R.mp.t,0)} cm`:""}</p>`:""}${R.alerts.length?`<div class="banner warn">${icon("info")}<div class="small">${R.alerts.map(a=>a.out?T("{m} hors 3e-97e percentile",{m:T(MEAS[a.meas].label)}):T("{m} : {n} lignes de percentiles franchies",{m:T(MEAS[a.meas].label),n:a.n})).join(" · ")}</div></div>`:""}`:`<p class="small muted">${T("Aucune mesure.")}</p>`)}
    ${sec(T("Vaccination"), `<div class="tbl"><table><tbody>${R.vax.map(v=>`<tr><td class="small">${v.grp}</td><td>${esc(v.name)}</td><td><span class="chip">${v.st}</span></td><td class="tiny muted">${esc(v.det)}</td></tr>`).join("")}</tbody></table></div>`)}
    ${R.devDom.length?sec(T("Développement"), `<p class="small">${R.devDom.join(" · ")}</p>${R.devTalk.length?`<p class="small"><b>${T("À discuter :")}</b> ${esc(R.devTalk.join(" ; "))}</p>`:""}`):""}
    ${sec(T("Habitudes (moyenne 7 jours)"), `<p class="small">${T("Sommeil")} ${fmtNum(R.habits.sleep,1)} h (${T("cible")} ${R.g.rec.sleep[0]}-${R.g.rec.sleep[1]}) · ${T("activité")} ${fmtMin(R.habits.act)} · ${T("écran")} ${fmtMin(R.habits.screen)} · ${T("lecture")} ${fmtMin(R.habits.read)}</p>`)}
    ${R.temps.length||R.meds.length?sec(T("Fièvre et médicaments, 7 jours"), `<p class="small">${R.temps.map(l=>`${fmtD(new Date(l.t),{day:"numeric",month:"short"})} ${fmtT(l.t)} · ${fmtNum(l.data.temp)} °C`).concat(R.meds.map(l=>`${fmtD(new Date(l.t),{day:"numeric",month:"short"})} · ${esc(l.data.name)} ${esc(l.data.dose||"")}`)).join("<br>")}</p>`):""}
    ${fld("rep-q",T("Questions du parent (ajoutées au rapport)"),`<textarea class="inp" id="rep-q"></textarea>`)}
    <div class="row"><button class="btn kid" data-act="reportPdf">${icon("share")}${T("PDF : partager")}</button><button class="btn ghost" data-act="reportMail">${icon("mail")}${T("Courriel au médecin")}</button><button class="btn ghost" data-act="reportCopy">${icon("copy")}${T("Copier le texte")}</button></div>
    <p class="tiny muted">${T("Le courriel s'ouvre dans votre application de courriel avec le résumé ; joignez le PDF si vous voulez la version mise en page.")}</p>`, "wide");
}
async function reportPdf(){
  const R = UI.report, c = R.c;
  if (!window.jspdf){ toast(T("Chargement du module PDF…")); await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "js/vendor/jspdf.umd.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); }).catch(()=>{}); }
  if (!window.jspdf){ toast(T("Impossible de créer le PDF ici")); return null; }
  const doc = new jspdf.jsPDF({unit:"pt", format:"letter"}), W = 612, M = 48; let y = 0;
  const peach = [255,158,122], ink = [42,35,64], muted = [115,107,138];
  const txt = (s, x, size=10, style="normal", col=ink) => { doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...col); doc.text(String(s), x, y); };
  const need = h => { if (y + h > 740){ doc.addPage(); y = 56; } };
  const strip = s => String(s).normalize("NFC");
  doc.setFillColor(...peach); doc.rect(0, 0, W, 86, "F");
  y = 40; txt(strip(T("Rapport de suivi")), M, 20, "bold", [42,26,16]);
  y = 62; txt(strip(`${c.name} · ${ageLabel(R.m)} · ${c.sex==="M"?T("garçon"):T("fille")} · ${T("né·e le {d}",{d:fmtD(c.dob)})}`), M, 11, "normal", [42,26,16]);
  y = 108; txt(strip(`${T("Préparé par le parent le {d}",{d:fmtD(today(),{day:"numeric",month:"long",year:"numeric"})})} · ${appName()}`), M, 9, "normal", muted);
  const section = t => { need(40); y += 26; doc.setDrawColor(...peach); doc.setLineWidth(2); doc.line(M, y+6, W-M, y+6); txt(strip(t), M, 13, "bold"); y += 22; };
  const line = (s, size=10, style="normal") => { const parts = doc.splitTextToSize(strip(s), W-2*M); parts.forEach(p => { need(16); txt(p, M, size, style); y += 14; }); };
  const table = (head, rows, widths) => { need(20); let x = M; head.forEach((h,i) => { txt(strip(h), x, 9, "bold", muted); x += widths[i]; }); y += 14; rows.forEach(r => { need(16); let x2 = M; r.forEach((cell,i) => { const p = doc.splitTextToSize(strip(cell), widths[i]-6)[0] || ""; txt(p, x2, 9.5); x2 += widths[i]; }); y += 15; doc.setDrawColor(228,223,240); doc.setLineWidth(.5); doc.line(M, y-11, W-M, y-11); }); };
  if (c.allergies || c.conditions || c.meds){ section(T("Santé")); if (c.allergies) line(`${T("ALLERGIES")} : ${c.allergies}`, 10, "bold"); if (c.conditions) line(`${T("Problèmes de santé")} : ${c.conditions}`); if (c.meds) line(`${T("Médicaments")} : ${c.meds}`); }
  section(T("Croissance (normes OMS)"));
  if (R.growth.length) table([T("Date"),T("Âge"),T("Poids (kg)"),T("Taille (cm)"),T("PC (cm)")], R.growth.map(g => [fmtD(g.date), g.age, ...g.cells]), [90,100,110,110,106]); else line(T("Aucune mesure."));
  if (R.vel) line(`${T("Vitesse de croissance")} : ${fmtNum(R.vel.v,1)} ${T("cm/an")}${R.mp?` · ${T("taille cible parentale")} ${fmtNum(R.mp.t,0)} cm`:""}`);
  R.alerts.forEach(a => line(a.out ? T("{m} hors 3e-97e percentile",{m:T(MEAS[a.meas].label)}) : T("{m} : {n} lignes de percentiles franchies",{m:T(MEAS[a.meas].label),n:a.n}), 10, "bold"));
  section(T("Vaccination (PIQ)")); table([T("Âge"),T("Vaccin"),T("Statut"),T("Détails")], R.vax.map(v => [v.grp, v.name, v.st, v.det]), [110,130,80,196]);
  if (R.devDom.length){ section(T("Développement")); line(R.devDom.join(" · ")); if (R.devTalk.length) line(`${T("À discuter")} : ${R.devTalk.join(" ; ")}`, 10, "bold"); }
  section(T("Habitudes (moyenne 7 jours)")); line(`${T("Sommeil")} ${fmtNum(R.habits.sleep,1)} h (${T("cible")} ${R.g.rec.sleep[0]}-${R.g.rec.sleep[1]}) · ${T("activité")} ${fmtMin(R.habits.act)} · ${T("écran")} ${fmtMin(R.habits.screen)} · ${T("lecture")} ${fmtMin(R.habits.read)}`);
  if (R.temps.length || R.meds.length){ section(T("Fièvre et médicaments, 7 jours")); R.temps.forEach(l => line(`${fmtD(new Date(l.t),{day:"numeric",month:"short"})} ${fmtT(l.t)} · ${fmtNum(l.data.temp)} °C (${T(l.data.site)})`)); R.meds.forEach(l => line(`${fmtD(new Date(l.t),{day:"numeric",month:"short"})} ${fmtT(l.t)} · ${l.data.name} ${l.data.dose||""}`)); }
  const q = val("rep-q"); if (q){ section(T("Questions du parent")); line(q); }
  const pages = doc.getNumberOfPages(); for (let i=1;i<=pages;i++){ doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...muted); doc.text(strip(T("Document préparé par le parent. Ne remplace pas le dossier médical.")) + `  ·  ${i}/${pages}`, M, 770); }
  return doc.output("datauristring");
}
