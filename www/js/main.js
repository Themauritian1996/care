/* =========================================================================
   TRIBE — actions, formulaires, rappels, données d'exemple, démarrage
   ========================================================================= */
const canEdit = () => !isKidUser();
function needParent(){ if (isKidUser()){ toast(T("Demande à un parent")); return true; } return false; }

/* ---------- rappels (notifications) ---------- */
function hashId(s){ let h = 0; for (const ch of s) h = (h*31 + ch.charCodeAt(0)) | 0; return Math.abs(h) % 2e9; }
function scheduleNotifications(){
  const N = S.settings.notif; if (!N.enabled) { Native.schedule([]); return; }
  const now = Date.now(), list = [], horizon = addDays(today(), 30);
  const at = (dateStr, hh, mm) => { const d = parseD(dateStr); d.setHours(hh, mm, 0, 0); return d.getTime(); };
  allEvents(today(), horizon).forEach(e => {
    if (N.events && !e.auto && e.type !== "note"){
      const evAt = e.time ? at(e.date, ...e.time.split(":").map(Number)) : at(e.date, 9, 0);
      const before = addDays(parseD(e.date), -1); before.setHours(19,0,0,0);
      if (before.getTime() > now) list.push({id:hashId(e.id+e.date+"v"), at:before.getTime(), title:T("Demain : {t}",{t:e.title}), body:e.time?T("à {h}",{h:e.time}):T("toute la journée")});
      if (e.time && evAt - 36e5 > now) list.push({id:hashId(e.id+e.date+"h"), at:evAt - 36e5, title:T("Dans 1 h : {t}",{t:e.title}), body:e.time});
    }
    if (N.vaccines && (e.type === "vaccin" || e.type === "visite")){ const t = at(e.date, 9, 0) - 3*DAY; if (t > now) list.push({id:hashId(e.id+"vx"), at:t, title:e.title, body:T("Pensez à prendre rendez-vous (Clic Santé ou votre clinique).")}); }
  });
  if (N.memories) S.memories.forEach(m => { for (let k = 0; k < 2; k++){ const d = new Date(today().getFullYear()+k, parseD(m.date).getMonth(), parseD(m.date).getDate(), 9, 0); if (d > now && d <= horizon && d.getFullYear() > parseD(m.date).getFullYear()) list.push({id:hashId(m.id+d.getFullYear()), at:d.getTime(), title:T("Il y a {n} an(s) aujourd'hui",{n:d.getFullYear()-parseD(m.date).getFullYear()}), body:m.title}); } });
  if (N.goals){ const [hh, mm] = (N.goalTime||"19:00").split(":").map(Number); for (let i = 0; i < 7; i++){ const d = addDays(today(), i); d.setHours(hh, mm, 0, 0); if (d > now) list.push({id:hashId("goal"+i), at:d.getTime(), title:T("Petit rappel {app}",{app:appName()}), body:T("Lecture, activité, écrans : où en est-on aujourd'hui ?")}); } }
  // défis à heure fixe
  if (N.tasks !== false && feat("rewards")) for (let i = 0; i < 3; i++){ const d = addDays(today(), i);
    S.tasks.filter(t => (t.times||[]).length && taskDueOn(t, d)).forEach(t => t.times.forEach(hm => { const [hh, mm] = hm.split(":").map(Number), w = new Date(d); w.setHours(hh, mm, 0, 0);
      if (w > now) list.push({id:hashId(t.id+iso(d)+hm), at:w.getTime(), title:T("Défi : {t}",{t:t.title}), body:(t.assignees||[]).map(a => member(a)?.name).filter(Boolean).join(", "), extra:{go:"tribu"}}); })); }
  // revue IA planifiée
  if (N.review !== false && aiKey() && S.settings.ai.freq !== "jamais" && S.children.length){ let d = nextReviewAt(); for (let k = 0; k < 3; k++){ list.push({id:hashId("review"+d.getTime()), at:d.getTime(), title:T("Revue de la semaine prête à générer"), body:T("Touchez pour lancer la revue de suivi avec Gemini."), extra:{go:"assistant", tab:"review", auto:true}}); d = nextReviewAt(new Date(d.getTime() + 60e3)); } }
  list.sort((a,b) => a.at - b.at);
  Native.schedule(list);
}

/* ---------- délégation des événements ---------- */
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v;
  if (a === "closeSheet"){ if (e.target === b || b.tagName === "BUTTON"){ closeSheet(); if (renderPending){ renderPending = false; } render(); } return; }
  if (b.tagName === "A") return;
  const f = ACT[a]; if (f) { e.preventDefault(); try { await f(v, b, e); } catch(err){ console.error(err); toast(err.message || String(err)); } }
});
document.addEventListener("submit", async e => {
  const f = e.target.closest("form[data-form]"); if (!f) return;
  e.preventDefault();
  const h = FORMS[f.dataset.form]; if (h) { try { await h(f, e); } catch(err){ console.error(err); toast(err.message || String(err)); } }
});
document.addEventListener("change", async e => {
  const t = e.target, k = t.dataset.change;
  if (k && CHANGE[k]) { try { await CHANGE[k](t); } catch(err){ toast(err.message); } return; }
  if (t.name === "born"){ $("#bornFields").hidden = t.value === "non"; $("#preFields").hidden = t.value !== "non"; }
});
document.addEventListener("input", e => { const t = e.target; if (t.dataset.meal != null && UI.meal){ delete UI.meal.items[+t.dataset.meal].nut; UI.meal.items[+t.dataset.meal][t.dataset.k] = t.value; } });
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSheet();
  if (e.key === "Enter" && !e.shiftKey && e.target.id === "chat-in"){ e.preventDefault(); e.target.closest("form").requestSubmit(); }
});

/* ======== ACTIONS ======== */
Object.assign(ACT, {
  go: v => { if (v === "kid" && !S.children.length) return kidForm(); go(v); },
  openKid: v => { S.active = v; UI.kidTab = null; save(); go("kid"); },
  kid: v => { S.active = v; UI.zoom = null; UI.range = null; UI.kidTab = null; commit(); },
  kidTab: v => { UI.kidTab = v; render(); },
  sub: v => { UI.sub.sante = v; render(); },
  kidForm: v => { if (!needParent()) kidForm(v); },
  memberForm: v => memberForm(v), familySheet: () => familySheet(), modules: () => modulesSheet(),
  resetModules: () => { child().modules = {}; save(); modulesSheet(); toast(T("Choix selon l'âge rétablis")); },
  theme: () => { S.settings.theme = S.settings.theme == null ? "dark" : S.settings.theme === "dark" ? "light" : null; commit(S.settings.theme==="dark"?T("Thème sombre"):S.settings.theme==="light"?T("Thème clair"):T("Thème automatique")); },
  setTheme: v => { S.settings.theme = v === "auto" ? null : v; commit(); },
  setLang: v => { S.settings.lang = v; commit(); },
  setUnit: v => { const [k, u] = v.split(":"); S.settings.units = {...(S.settings.units||{}), [k]:u}; commit(); },
  setAppName: v => { S.settings.appName = v; S.settings.appNameLocal = true; commit(); },
  urgence: () => urgence(),
  clearDemo: () => { const keep = {theme:S.settings.theme, lang:S.settings.lang, bg:S.settings.bg}; S = blankState(); Object.assign(S.settings, keep); normalize(); save(); render(); memberForm(S.me); },
  report: () => reportSheet(),
  reportCopy: async () => { const t = reportText(UI.report) + (val("rep-q") ? `\n\n${T("Questions du parent")} :\n${val("rep-q")}` : ""); try { await navigator.clipboard.writeText(t); toast(T("Copié")); } catch(e){ Native.share({title:T("Rapport"), text:t}); } },
  reportMail: () => { const c = UI.report.c, t = reportText(UI.report) + (val("rep-q") ? `\n\n${T("Questions du parent")} :\n${val("rep-q")}` : ""); location.href = `mailto:${encodeURIComponent(c.doctorEmail||"")}?subject=${encodeURIComponent(T("Suivi de {n}",{n:c.name}))}&body=${encodeURIComponent(t)}`; },
  reportPdf: async () => { const url = await reportPdf(); if (url) Native.share({title:T("Rapport de suivi"), text:T("Rapport de suivi de {n}",{n:UI.report.c.name}), dataUrl:url, filename:`${T("rapport")}-${UI.report.c.name}-${iso(today())}.pdf`.replace(/\s+/g,"-"), mime:"application/pdf"}); },

  /* journal */
  log: v => logForm(v),
  pickOpt: (v, b) => { const box = b.closest("[data-pick]"); const name = box.dataset.pick, h = $("#pk-"+name), on = b.getAttribute("aria-pressed") === "true";
    box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed","false")); if (!on){ b.setAttribute("aria-pressed","true"); h.value = v; } else h.value = ""; },
  startTimer: v => { const c = child(); S.timers = S.timers || {}; S.timers[c.id] = {type:v, start:Date.now(), pausedMs:0, side: v === "feed" ? (pickVal("mode") === "Biberon" ? "Sein gauche" : pickVal("mode") || "Sein gauche") : "", kind: v === "sleep" ? (pickVal("kind") || "Nuit") : ""}; closeSheet(); commit(v === "sleep" ? T("Bonne nuit") : T("Minuterie lancée")); },
  pauseTimer: () => { const t = timerOf(child()); if (!t) return; if (t.pausedAt){ t.pausedMs += Date.now() - t.pausedAt; t.pausedAt = null; } else t.pausedAt = Date.now(); commit(); },
  stopTimer: () => { const c = child(), t = timerOf(c); if (!t) return; const end = t.pausedAt || Date.now(), paused = Math.round((t.pausedMs||0)/6e4);
    c.logs.push({id:uid(), type:t.type, t:t.start, end, data: t.type === "feed" ? {mode:t.side, pausedMin:paused} : {kind:t.kind, pausedMin:paused}}); delete S.timers[c.id]; commit(T("Noté")); },
  delLog: v => { const c = child(); c.logs = c.logs.filter(l => l.id !== v); closeSheet(); commit(T("Supprimé")); },
  editLog: v => { const c = child(), L = c.logs.find(x => x.id === v); if (!L) return; if (L.type === "trk") logForm("trk:" + L.data.tid, v); else logForm(L.type, v); },
  trend: v => trendSheet(v), trendDays: v => { UI.trendDays = +v; trendSheet(UI.trendKey); },
  goalsForm: () => goalsForm(), ackBand: () => { const c = child(); c.goalBand = guide(ageMonths(c)).band; commit(); },
  resetGoals: () => { const c = child(); c.goals = {}; c.goalBand = guide(ageMonths(c)).band; closeSheet(); commit(T("Recommandations rétablies")); },
  trackerForm: v => trackerForm(v), delTracker: v => { const c = child(); c.trackers = c.trackers.filter(t => t.id !== v); closeSheet(); commit(); },
  activityForm: v => activityForm(v), delActivity: v => { const c = child(); c.activities = c.activities.filter(x => x.id !== v); closeSheet(); commit(); },
  allergen: v => { const c = child(); (c.allergensLog[v] = c.allergensLog[v] || []).push(iso(today())); commit(T("{a} : exposition notée",{a:T(v)})); },
  quickFood: v => { const c = child(), f = c.foodFav.find(x => x.name === v); c.logs.push({id:uid(), type:"solid", t:Date.now(), data:{items:[{name:f.name, group:f.group, qty:f.qty||"", nut:f.nut||null}], meal:f.snack ? "Collation" : mealKindAt(Date.now())}}); commit(T("{a} noté",{a:v})); },
  addMealItem: () => { UI.meal.items.push({name:"", group:"legfruits", qty:""}); mealForm(UI.meal); },
  rmMealItem: v => { UI.meal.items.splice(+v, 1); mealForm(UI.meal); },
  mealGroup: v => { const [i, g] = v.split(":"); UI.meal.items[+i].group = g; mealForm(UI.meal); },
  favFood: v => { const c = child(), it = UI.meal.items[+v]; if (!it.name) return toast(T("Écrivez d'abord le nom de l'aliment")); const i = c.foodFav.findIndex(f => f.name === it.name); if (i >= 0) c.foodFav.splice(i,1); else c.foodFav.push({name:it.name, group:it.group, qty:it.qty}); save(); mealForm(UI.meal); },

  /* croissance */
  growthForm: v => growthForm(v),
  delGrowth: v => { const c = child(); c.growth = c.growth.filter(g => g.id !== v); closeSheet(); commit(T("Mesure supprimée")); },
  meas: v => { UI.sub.courbes = v; UI.range = null; UI.zoom = null; render(); },
  range: v => { UI.range = v; UI.zoom = null; drawChart(child(), "#chart"); },
  chrono: v => { UI.chrono = v === "1"; render(); },
  zoom: v => { const c = child(), {R, max} = chartRange(c), span = R.b - R.a, mid = (R.a+R.b)/2;
    let z = v === "in" ? {a:mid-span/4, b:mid+span/4} : v === "out" ? {a:mid-span, b:mid+span} : v === "left" ? {a:R.a-span/3, b:R.b-span/3} : {a:R.a+span/3, b:R.b+span/3};
    const w = clamp(z.b - z.a, 2, max); const a0 = clamp(z.a, 0, max - w); UI.zoom = {a:a0, b:a0 + w}; drawChart(c, "#chart"); if ($("#chartBig")) drawChart(c, "#chartBig", true); },
  chartFull: () => { const c = child(); sheet(`${sheetHead(T(MEAS[UI.sub.courbes].label))}<div class="chart-tools"><button class="icon-btn" data-act="zoom" data-v="in">${icon("zoomin")}</button><button class="icon-btn" data-act="zoom" data-v="out">${icon("zoomout")}</button><button class="icon-btn" data-act="zoom" data-v="left">${icon("left")}</button><button class="icon-btn" data-act="zoom" data-v="right">${icon("right")}</button><button class="btn sm ghost" data-act="zoomReset">${T("Réinitialiser")}</button></div><div class="chart-wrap" id="chartBig"></div>`, "wide"); drawChart(c, "#chartBig", true); bindChartPan("#chartBig", c); },
  zoomReset: () => { UI.zoom = null; const c = child(); drawChart(c, "#chart"); if ($("#chartBig")) drawChart(c, "#chartBig", true); },

  /* santé */
  vaxForm: v => vaxForm(v), delVax: v => { delete child().vaccines[v]; closeSheet(); commit(T("Retiré")); },
  tooth: v => { if (needParent()) return; const c = child(), base = v.slice(0,-1); if (c.teeth[base]){ c.teeth[base+"L"] = c.teeth[base]; c.teeth[base+"R"] = c.teeth[base]; delete c.teeth[base]; } if (c.teeth[v]) delete c.teeth[v]; else c.teeth[v] = iso(today()); commit(); },
  msMode: v => { UI.msMode = v; render(); }, msAll: () => { UI.msAll = !UI.msAll; render(); },
  ms: v => { const c = child(); if (c.milestones[v]){ delete c.milestones[v]; commit(); } else msDateSheet(v); },
  tipCat: v => { const c = child(); c.hideTips = c.hideTips.includes(v) ? c.hideTips.filter(x => x !== v) : [...c.hideTips, v]; commit(); },
  pregCheck: v => { const c = child(); const ck = c.prenatal.checks = c.prenatal.checks || {}; if (ck[v]) delete ck[v]; else ck[v] = iso(today()); commit(); },
  rmName: v => { child().prenatal.names.splice(+v,1); commit(); },
  bornForm: () => bornForm(),

  /* profils */
  pickPhoto: async v => { const d = await Native.takePhoto({source:"prompt"}); if (!d) return; const small = await shrinkImage(d, 200, 0.82, true); UI.photoDraft[v] = small; $(`#${v}Prev`).innerHTML = `<img class="avatar" src="${small}" alt="" style="width:64px;height:64px">`; },
  rmPhoto: (v, b) => { UI.photoDraft[v] = null; $(`#${v}Prev`).innerHTML = avatarOf({color:"peach"}, 64); b.remove(); },
  askDelKid: v => { $("#delConfirm").innerHTML = `<div class="banner alert"><div>${T("Supprimer ce profil et toutes ses données ?")} <div class="row" style="margin-top:8px"><button type="button" class="btn sm danger" data-act="delKid" data-v="${v}">${T("Oui, supprimer")}</button></div></div></div>`; },
  delKid: v => { S.children = S.children.filter(k => k.id !== v); S.family.members = S.family.members.filter(m => m.kidId !== v); S.active = S.children[0]?.id || null; closeSheet(); commit(T("Profil supprimé")); },
  delMember: v => { S.family.members = S.family.members.filter(m => m.id !== v); closeSheet(); commit(T("Membre retiré")); },
  invite: async v => { const code = await Cloud.invite(v); $("#inviteOut").innerHTML = `<div class="banner ok">${icon("key")}<div><div class="phone">${code}</div><div class="small">${v==="enfant"?T("Code pour un enfant"):T("Code pour un parent")} · ${T("à entrer dans Réglages > Ma famille après avoir créé un compte.")}</div><button class="btn sm ghost" data-act="shareText" data-v="${esc(T("Rejoins notre famille dans {app} avec le code {c}",{app:appName(), c:code}))}">${icon("share")}${T("Envoyer")}</button></div></div>`; },
  shareText: v => Native.share({title:appName(), text:v}),

  /* contrôle parental */
  pinForm: () => pinForm(),
  enterKidMode: () => { if (!S.settings.parental.pin) return pinForm(); S.settings.parental.kidMode = true; UI.view = "home"; commit(T("Mode enfant activé")); },
  exitKidMode: () => sheet(`<form class="stack" data-form="unlock" style="gap:14px">${sheetHead(T("NIP parental"))}${fld("unlock-pin",T("Entrez le NIP"),`<input class="inp" id="unlock-pin" type="password" inputmode="numeric" pattern="[0-9]*" required>`)}<button class="btn kid" type="submit">${icon("unlock")}${T("Déverrouiller")}</button></form>`),

  /* compte */
  googleLogin: () => Cloud.googleLogin(), skipLogin: () => Cloud.skip(), showLogin: () => Cloud.showLogin(),
  resetPass: () => { const e = val("a-email"); if (!e) return toast(T("Écrivez d'abord votre courriel")); Cloud.resetPass(e); },
  logout: async () => { await Cloud.logout(); toast(T("Déconnecté")); },

  /* données */
  exportJson: () => Native.saveText(JSON.stringify({...S, exportedAt:new Date().toISOString(), app:appName()}, null, 1), `${appName().toLowerCase()}-${iso(today())}.json`),
  exportCsv: () => {
    const rows = [["enfant","date","heure","type","detail","minutes","valeur"]];
    S.children.forEach(c => { (c.logs||[]).forEach(l => rows.push([c.name, dayKey(l.t), fmtT(l.t), l.type, (l.data.items||[]).map(i=>i.name).join(" + ") || l.data.mode || l.data.kind || l.data.name || l.data.what || l.data.text || l.data.title || "", l.end ? Math.round((l.end-l.t)/6e4) : (l.data.min||""), l.data.temp || l.data.ml || l.data.v || ""]));
      (c.growth||[]).forEach(g => rows.push([c.name, g.date, "", "mesure", `poids ${g.weight||""} kg / taille ${g.height||""} cm / PC ${g.ofc||""} cm`, "", ""])); });
    Native.saveText(rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n"), `${appName().toLowerCase()}-journal-${iso(today())}.csv`, "text/csv");
  },
  exportIcs: () => {
    const ev = allEvents(addDays(today(), -30), addDays(today(), 365)).filter(e => !["sport","photo"].includes(e.type));
    const d8 = s => s.replace(/-/g,""), L = ["BEGIN:VCALENDAR","VERSION:2.0",`PRODID:-//${appName()}//FR`];
    ev.forEach(e => { L.push("BEGIN:VEVENT", `UID:${e.id}-${e.date}@tribe`, e.time ? `DTSTART:${d8(e.date)}T${e.time.replace(":","")}00` : `DTSTART;VALUE=DATE:${d8(e.date)}`, `SUMMARY:${String(e.title).replace(/[,;]/g," ")}`, "END:VEVENT"); });
    L.push("END:VCALENDAR"); Native.saveText(L.join("\r\n"), `${appName().toLowerCase()}-agenda.ics`, "text/calendar");
  },
  askWipe: () => { $("#wipeConfirm").innerHTML = `<div class="banner alert" style="margin-top:8px"><div>${T("Effacer toutes les données de cet appareil ?")} <div class="row" style="margin-top:8px"><button class="btn sm danger" data-act="wipe">${T("Oui, tout effacer")}</button></div></div></div>`; },
  wipe: () => { const keep = {theme:S.settings.theme, lang:S.settings.lang}; S = blankState(); Object.assign(S.settings, keep); normalize(); commit(T("Données effacées")); },

  /* agenda */
  eventForm: v => { if (!needParent()) eventForm(v); },
  delEvent: v => { S.events = S.events.filter(e => e.id !== v); closeSheet(); commit(T("Supprimé")); },
  agTab: v => { UI.sub.agenda = v; render(); },
  day: v => { UI.calSel = v; render(); },
  calNav: v => { const base = UI.calMonth ? parseD(UI.calMonth) : new Date(today().getFullYear(), today().getMonth(), 1); UI.calMonth = iso(new Date(base.getFullYear(), base.getMonth()+Number(v), 1)); render(); },
  calToday: () => { UI.calMonth = null; UI.calSel = iso(today()); render(); },
  availWho: v => { UI.availWho = v; render(); },
  availToggle: async (v, b) => {
    if (b.dataset.group){ const g = S.groups.find(x => x.id === b.dataset.group); g.avail = g.avail || {}; const map = g.avail[Cloud.user.uid] = toggleAvail(g.avail[Cloud.user.uid], v); render(); await Cloud.groupAvail(g.id, map); return; }
    const who = b.dataset.who; if (isKidUser() && who !== S.me) return; S.avail[who] = toggleAvail(S.avail[who], v); commit();
  },
  planBest: v => { const wk = AW(); const d = wk === "type" ? addDays(today(), ((+v - today().getDay()) + 7) % 7 || 7) : addDays(parseD(wk), (+v + 6) % 7); eventForm(iso(d)); },
  availWeek: v => { UI.availWeek = v; render(); },
  availReset: v => { const pre = `W:${AW()}|`; S.avail[v] = Object.fromEntries(Object.entries(S.avail[v]||{}).filter(([k]) => !k.startsWith(pre))); commit(); },

  /* souvenirs */
  souvTab: v => { UI.sub.souv = v; render(); }, photoCat: v => { UI.photoCat = v; render(); },
  photoDay: v => photoDay(v), openPhoto: v => openPhoto(v), openMemory: v => openMemory(v),
  memoryForm: v => memoryForm(v), memoryEdit: v => { const m = S.memories.find(x => x.id === v); if (m?.kind && SPECIAL.some(k => k.k === m.kind)){ UI.specKid = (m.kidIds||[])[0]; specialForm(m.kind + "|" + (m.key||""), v); } else memoryForm(null, v); },
  memPhoto: async () => { const d = await Native.takePhoto({source:"prompt"}); if (!d) return; UI.photoDraft.mem2 = await shrinkImage(d, 1280, 0.82); $("#memPhotoPrev").innerHTML = `<img src="${UI.photoDraft.mem2}" alt="" style="border-radius:14px;max-height:180px;object-fit:cover">`; },
  delMemory: v => { driveQDel(S.memories.find(m => m.id === v)?.driveIds); S.memories = S.memories.filter(m => m.id !== v); closeSheet(); commit(T("Supprimé")); },
  photoEdit: v => photoDay(null, v),
  photoReplace: async () => { const data = await Native.takePhoto({source:"prompt"}); if (!data) return; UI.photoDraft.day = await shrinkImage(data, 1280, 0.82); const img = $("#layer form img"); if (img) img.src = UI.photoDraft.day; },
  delPhoto: async v => { driveQDel(S.photos.find(p => p.id === v)?.driveIds); S.photos = S.photos.filter(p => p.id !== v); await PhotoDB.del(v); closeSheet(); commit(T("Photo supprimée")); },
  sharePhoto: async v => { const p = S.photos.find(x => x.id === v), d = await PhotoDB.get(v); Native.share({title:p.caption || T("Photo du jour"), text:`${p.caption||""} · ${fmtD(p.date,{day:"numeric",month:"long",year:"numeric"})}`, dataUrl:d, filename:`photo-${p.date}.jpg`}); },
  shareMemory: async v => { const m = S.memories.find(x => x.id === v); if (lockedMem(m)) return; const d = m.photoId ? await PhotoDB.get(m.photoId) : null; Native.share({title:m.title, text:`${m.title} · ${fmtD(m.date,{day:"numeric",month:"long",year:"numeric"})}${m.text?"\n\n"+m.text:""}`, dataUrl:d, filename:`souvenir-${m.date}.jpg`}); },
  photoDrive: v => { S.driveQueue = (S.driveQueue||[]).filter(x => x.id !== v); S.driveQueue.push({op:"up", kind:"photo", id:v}); save(); toast(T("Envoi vers Google Drive…")); driveFlush(true); },
  memoryDrive: v => memoryToDrive(S.memories.find(x => x.id === v), true),

  /* défis */
  tribuTab: v => { UI.sub.tribu = v; UI.groupOpen = null; if (UI.view !== "tribu") go("tribu"); else render(); },
  taskForm: v => { if (!needParent()) taskForm(v); }, rewardForm: v => rewardForm(v),
  taskTpl: v => { const t = TASK_TPL[+v]; $("#tk-title").value = T(t.t); $("#tk-pts").value = t.p; const r = document.querySelector(`input[name="tkicon"][value="${t.ic}"]`); if (r) r.checked = true; },
  rewardTpl: v => { const t = REWARD_TPL[+v]; $("#rw-title").value = T(t.t); $("#rw-cost").value = t.cost; },
  delTask: v => { S.tasks = S.tasks.filter(t => t.id !== v); closeSheet(); commit(); },
  notifTest: async () => { if (!(await Native.notifPermission())) return toast(T("Notifications refusées par l'appareil")); await Native.notifyAt(T("Test {app}",{app:appName()}), T("Les rappels fonctionnent !"), Date.now() + 5000, {go:"home"}); toast(T("Notification dans 5 secondes : vous pouvez fermer l'app")); },
  driveTest: async () => { const out = $("#driveOut"); if (out) out.innerHTML = `<span class="spin"></span> ${T("Test en cours…")}`;
    try { const r = await Cloud.driveUpload(`${T("Test")} ${new Date().toLocaleString(LOCALE())}.txt`, "text/plain", btoa(unescape(encodeURIComponent(T("Fichier de test de {app}. Vous pouvez le supprimer.",{app:appName()})))), "", [T("Test")]);
      if (out) out.innerHTML = `<span style="color:var(--mint-ink)">✓ ${T("Ça marche : un fichier « Test » est dans votre Drive, dossier « {f} ».",{f:DRIVE_ROOT})}</span> ${r.webViewLink?`<a href="${esc(r.webViewLink)}" target="_blank" rel="noopener">${T("Ouvrir")}</a>`:""} ${S.settings.driveFolder?`<a href="https://drive.google.com/drive/folders/${esc(S.settings.driveFolder)}" target="_blank" rel="noopener">${T("Ouvrir le dossier")}</a>`:""}`; }
    catch(e){ if (out) out.innerHTML = `<span style="color:var(--danger)">${esc(e.message)}</span>`; } },
  famPhoto: async () => { const d = await Native.takePhoto({source:"prompt"}); if (!d) return; S.family.photo = await shrinkImage(d, 360, 0.8); save(); render(); familySheet(); toast(T("Photo de famille ajoutée")); },
  famPhotoDel: () => { S.family.photo = null; save(); render(); familySheet(); },
  groupPhoto: async v => { const d = await Native.takePhoto({source:"prompt"}); if (!d) return; const small = await shrinkImage(d, 360, 0.8); const g = S.groups.find(x => x.id === v); g.photo = small; render(); await Cloud.groupPhoto(v, small); toast(T("Photo du groupe ajoutée")); },
  delReward: v => { closeSheet(); const r = S.rewards.find(x => x.id === v); if (r?.team && !r.doneAt) S.redemptions = S.redemptions.filter(x => !(x.kind === "team" && x.rewardId === v)); S.rewards = S.rewards.filter(x => x.id !== v); commit(r?.team && !r.doneAt ? T("Objectif retiré : les points sont rendus") : undefined); },
  approve: v => { const x = S.completions.find(c => c.id === v); x.status = "ok"; commit(T("Validé")); confetti(); },
  refuse: v => { const x = S.completions.find(c => c.id === v); x.status = "refuse"; commit(); },
  redeemOk: v => { S.redemptions.find(x => x.id === v).status = "ok"; commit(); },
  redeemNo: v => { S.redemptions.find(x => x.id === v).status = "refuse"; commit(); },

  /* groupes */
  groupNew: () => sheet(`<form class="stack" data-form="groupNew" style="gap:14px">${sheetHead(T("Nouveau groupe"))}${fld("gn",T("Nom du groupe"),`<input class="inp" id="gn" required placeholder="${T("Cousins Tremblay")}">`)}<button class="btn kid" type="submit">${T("Créer")}</button></form>`),
  groupOpen: v => { UI.groupOpen = v; render(); }, groupClose: () => { UI.groupOpen = null; render(); },
  groupChat: v => { UI.groupOpen = null; $("#main").innerHTML = topbar() + chatView(v); afterRender(); },
  groupInvite: async v => { const code = await Cloud.groupInvite(v); $("#groupInviteOut").innerHTML = `<div class="banner ok">${icon("key")}<div><div class="phone">${code}</div><button class="btn sm ghost" data-act="shareText" data-v="${esc(T("Rejoins le groupe dans {app} avec le code {c}",{app:appName(), c:code}))}">${icon("share")}${T("Envoyer")}</button></div></div>`; },
  groupEvent: v => sheet(`<form class="stack" data-form="groupEvent" data-g="${v}" style="gap:14px">${sheetHead(T("Proposer une activité"))}${fld("ge-t",T("Activité"),`<input class="inp" id="ge-t" required placeholder="${T("Glissade au parc")}">`)}<div class="fgrid">${fld("ge-d",T("Date"),`<input class="inp" id="ge-d" type="date" value="${iso(addDays(today(),7))}" required>`)}${fld("ge-h",T("Heure"),`<input class="inp" id="ge-h" type="time">`)}</div>${fld("ge-p",T("Lieu"),addrInput("ge-p",""))}<button class="btn kid" type="submit">${T("Proposer")}</button></form>`),
  groupRsvp: async v => { const [g, e] = v.split("|"), ev = S.groups.find(x => x.id === g)?.events?.find(x => x.id === e); await Cloud.groupRsvp(g, e, !ev?.rsvp?.[Cloud.user.uid]?.ok); },
});
function memoryToDrive(m, verbose){
  if (!m || !Cloud.canDrive?.() || lockedMem(m)) return;
  S.driveQueue = (S.driveQueue||[]).filter(x => x.id !== m.id); S.driveQueue.push({op:"up", kind:"mem", id:m.id}); save();
  if (verbose) toast(T("Envoi vers Google Drive…")); driveFlush(!!verbose);
}

/* ======== CHANGEMENTS ======== */
Object.assign(CHANGE, {
  setBg: t => { S.settings.bg = t.value; commit(); },
  setBgCustom: t => { S.settings.bg = t.value; commit(); },
  feature: t => { S.settings.features[t.dataset.k] = t.checked; commit(); },
  allow: t => { S.settings.parental.allow[t.dataset.k] = t.checked; save(); },
  notif: t => { S.settings.notif[t.dataset.k] = t.checked; save(); },
  notifOn: async t => { if (t.checked && !(await Native.notifPermission())){ t.checked = false; toast(T("Notifications refusées par l'appareil")); return; } S.settings.notif.enabled = t.checked; commit(t.checked ? T("Rappels activés") : T("Rappels désactivés")); },
  goalTime: t => { S.settings.notif.goalTime = t.value; save(); },
  famName: t => { S.family.name = t.value.trim(); save(); renderNav(); },
  module: t => { child().modules[t.dataset.k] = t.checked; save(); render(); },
  importFile: async t => { const f = t.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.children)) throw 0; S = migrate(d); normalize(); commit(T("Sauvegarde restaurée")); } catch(e){ toast(T("Ce fichier n'est pas une sauvegarde valide")); } },
});

/* ======== FORMULAIRES ======== */
Object.assign(FORMS, {
  emailAuth: (f, e) => Cloud.emailAuth(val("a-email"), val("a-pass"), e.submitter?.value || "login"),
  kid: f => {
    const id = f.dataset.id, born = radio("born") !== "non", adult = radio("born") === "adulte";
    const d = {name:val("k-name"), nick:val("k-nick"), sex:radio("sex"), color:radio("color")||"mint", look:radio("look")||"auto", avatar:readAvatar("kid"), photo:UI.photoDraft.kid || null,
      hFather:numOf("k-hf")||null, hMother:numOf("k-hm")||null, allergies:val("k-al"), conditions:val("k-co"), meds:val("k-me"), doctor:val("k-dr"), doctorEmail:val("k-de"), pharmacy:val("k-ph")};
    if (born){ d.dob = val("k-dob"); d.gaW = Number(val("k-gaw"))||40; d.gaD = Number(val("k-gad"))||0; if (!d.dob) return toast(T("Date de naissance requise")); }
    else { d.dob = null; d.dueDate = val("k-due"); if (!d.dueDate) return toast(T("Date prévue requise")); }
    if (!d.name) return toast(T("Prénom requis"));
    d.adult = adult; if (adult && ageMonths({dob:d.dob}) < 216) return toast(T("Un profil adulte doit avoir 18 ans ou plus"));
    if (id) Object.assign(kidById(id), d); else { const k = {...blankKid(), id:uid(), ...d}; S.children.push(k); S.active = k.id; }
    normalize(); closeSheet(); UI.kidTab = null; commit(id ? T("Profil mis à jour") : T("Bienvenue {n}",{n:d.nick||d.name})); if (!id) go("kid");
  },
  member: f => {
    const id = f.dataset.id, d = {name:val("mb-name"), role:radio("role")||"parent", color:radio("mcolor")||"lilac", avatar:readAvatar("mem"), photo:UI.photoDraft.mem || null};
    if (!d.name) return toast(T("Nom requis"));
    if (id) Object.assign(member(id), d); else S.family.members.push({id:"m_"+uid(), ...d});
    closeSheet(); commit(T("Enregistré"));
  },
  joinFamily: async () => { const code = val("join-code"); if (!code) return; await Cloud.joinFamily(code); closeSheet(); toast(T("Bienvenue dans la famille !")); render(); },
  pin: async () => { const a = val("pin1"), b = val("pin2"); if (a.length < 4 || a !== b) return toast(T("Les NIP ne correspondent pas (4 chiffres ou plus)")); S.settings.parental.pin = await hashPin(a); closeSheet(); commit(T("NIP enregistré")); },
  unlock: async () => { if (await hashPin(val("unlock-pin")) === S.settings.parental.pin){ S.settings.parental.kidMode = false; closeSheet(); commit(T("Mode parent")); } else toast(T("NIP incorrect")); },
  log: f => {
    const c = child(), type = f.dataset.type, t = tsOf("f-t"); let data = {}, end;
    const mins = numOf("f-min") || Number(pickVal("mins")) || 0;
    if (type.startsWith("trk:")){ const tr = c.trackers.find(x => "trk:"+x.id === type); const v = tr.type === "yesno" ? 1 : tr.type === "scale" ? Number(pickVal("scale")) : numOf("f-v"); if (!v) return toast(T("Indiquez une valeur")); if (f.dataset.id){ const L = c.logs.find(x => x.id === f.dataset.id); Object.assign(L, {t, data:{tid:tr.id, v, note:val("f-note")}}); } else c.logs.push({id:uid(), type:"trk", t, data:{tid:tr.id, v, note:val("f-note")}}); closeSheet(); return commit(T("Noté")); }
    if (type === "feed"){ data = {mode:pickVal("mode")||"Sein gauche", ml:numOf("f-ml") ? volToMl(numOf("f-ml")) : ""}; if (numOf("f-min")) end = t + numOf("f-min")*6e4; }
    if (type === "sleep"){ end = tsOf("f-end"); if (end <= t) return toast(T("La fin doit être après le début")); data = {kind:pickVal("kind")||"Nuit", where:pickVal("where")}; }
    if (type === "diaper") data = {kind:pickVal("kind")||"Pipi", color:pickVal("color"), texture:pickVal("texture"), note:val("f-note")};
    if (type === "temp"){ const v = tempToC(numOf("f-temp")); if (!(v >= 34 && v <= 43)) return toast(T("Entrez une température plausible (34 à 43 °C / 93 à 109 °F)")); data = {temp:v, site:pickVal("site")||"Rectale"}; }
    if (type === "med"){ const name = val("f-name") || T(pickVal("name")); if (!name) return toast(T("Indiquez le médicament")); data = {name, dose:val("f-dose")}; }
    if (type === "mood") data = {mood:pickVal("mood")||"Bien", note:val("f-note")};
    if (["screen","tummy","read","activity"].includes(type) && !mins) return toast(T("Indiquez le nombre de minutes"));
    if (type === "screen" || type === "tummy") data = {min:mins};
    if (type === "read") data = {min:mins, title:val("f-title")};
    if (type === "activity") data = {what:val("f-what") || pickVal("what") || "Activité", min:mins, intensity:pickVal("intensity")||"Modérée"};
    if (type === "note"){ if (!val("f-text")) return toast(T("Écrivez une note")); data = {text:val("f-text")}; }
    if (f.dataset.id){ const L = c.logs.find(x => x.id === f.dataset.id); if (L){ Object.assign(L, {t, end, data:{...L.data, ...data}}); if (!end) delete L.end; } closeSheet(); return commit(T("Modifié")); }
    c.logs.push({id:uid(), type, t, end, data}); closeSheet(); commit(T("Noté"));
  },
  meal: async f => {
    const c = child(), items = UI.meal.items.filter(i => i.name.trim()); if (!items.length) return toast(T("Ajoutez au moins un aliment"));
    const t = tsOf("f-t"), al = val("f-al");
    if (al) (c.allergensLog[al] = c.allergensLog[al] || []).push(iso(new Date(t)));
    const ex = UI.meal.editId ? c.logs.find(x => x.id === UI.meal.editId) : null;
    const log = ex || {id:uid(), type:"solid"}; Object.assign(log, {t, data:{...(ex?.data||{}), items, allergen:al, reaction:val("f-re"), ai:!!UI.meal.ai, meal:pickVal("mealk")||mealKindAt(t)}}); if (!ex) c.logs.push(log);
    if (aiReady() && aiKey() && ageMonths(c) >= 12 && items.some(i => !i.nut)) nutEstimateJob(c, [log]);
    UI.meal = null; closeSheet(); commit(T("Repas noté"));
  },
  goals: () => { const c = child(), g = guide(ageMonths(c)); c.goals = {}; const set = (k, v, def) => { if (v && v !== def) c.goals[k] = v; };
    set("sleep", numOf("g-sleep"), g.sleep[0]); set("act", numOf("g-act"), g.act); set("screen", numOf("g-screen") || (val("g-screen")==="0"?0:null), g.screen); set("read", numOf("g-read"), g.read);
    c.goalBand = g.band; closeSheet(); commit(T("Objectifs enregistrés")); },
  tracker: f => { const c = child(), id = f.dataset.id; const d = {name:val("t-name"), type:radio("ttype")||"count", unit:val("t-unit"), goal:numOf("t-goal")||null, goalKind:radio("tkind")||"min", color:radio("tcolor")||"teal", icon:radio("ticon")||"target"};
    if (!d.name) return toast(T("Nom requis")); if (id) Object.assign(c.trackers.find(x => x.id === id), d); else c.trackers.push({id:uid(), ...d}); closeSheet(); commit(T("Suivi enregistré")); },
  activity: f => { const days = checked("days").map(Number); if (!days.length) return toast(T("Choisissez au moins un jour")); const c = child(), d = {name:val("a-name"), days, time:val("a-time"), place:val("a-place"), dur:numOf("a-dur")||0, auto:$("#a-auto").checked};
    if (f.dataset.id) Object.assign(c.activities.find(x => x.id === f.dataset.id), d); else c.activities.push({id:uid(), since:iso(today()), ...d}); closeSheet(); commit(f.dataset.id ? T("Modifié") : T("Activité ajoutée")); },
  sportToggle: v => { const [cid, aid, ds] = v.split("|"), c = kidById(cid); c.sportSkip = c.sportSkip || {}; const k = aid+"|"+ds; if (c.sportSkip[k]) delete c.sportSkip[k]; else c.sportSkip[k] = true; save(); if ($("#layer .sheet")) dayDetail(ds); else render(); },
  growth: f => { const c = child(), w = Math.round(toMetric("weight", numOf("g-w"))*1000)/1000 || 0, h = Math.round(toMetric("height", numOf("g-h"))*10)/10 || 0, oc = Math.round(toMetric("ofc", numOf("g-c"))*10)/10 || 0;
    if (!w && !h && !oc) return toast(T("Entrez au moins une mesure")); if (parseD(val("g-date")) < parseD(c.dob)) return toast(T("La date est avant la naissance"));
    const d = {date:val("g-date"), weight:w||null, height:h||null, ofc:oc||null};
    if (f?.dataset?.id){ Object.assign(c.growth.find(x => x.id === f.dataset.id), d); closeSheet(); return commit(T("Modifié")); }
    c.growth.push({id:uid(), ...d}); closeSheet(); commit(T("Mesure ajoutée")); },
  vax: f => { child().vaccines[f.dataset.id] = {date:val("v-date"), lot:val("v-lot"), site:pickVal("site"), reactions:val("v-re")}; closeSheet(); commit(T("Vaccin noté")); },
  msDate: f => { child().milestones[f.dataset.k] = val("ms-date") || iso(today()); closeSheet(); commit(T("Bravo !")); },
  babyName: () => { const n = val("bn"); if (!n) return; child().prenatal.names.push(n); commit(); },
  born: () => { const c = child(), dob = val("b-dob"); const gaDays = 280 - (parseD(c.dueDate) - parseD(dob))/DAY;
    Object.assign(c, {name:val("b-name")||c.name, dob, sex:radio("bsex")||"F", gaW:Math.floor(gaDays/7), gaD:Math.round(gaDays%7), look:"auto", avatar:{kind:"auto"}});
    const w = numOf("b-w"), h = numOf("b-h"), oc = numOf("b-c"); if (w||h||oc) c.growth.push({id:uid(), date:dob, weight:w||null, height:h||null, ofc:oc||null});
    S.memories.push({id:uid(), date:dob, title:T("Naissance de {n}",{n:c.name}), text:"", kidIds:[c.id]}); UI.kidTab = null; closeSheet(); commit(T("Bienvenue {n} !",{n:c.name})); confetti(); },
  event: f => { const id = f.dataset.id;
    const d = {title:val("e-title"), date:val("e-date"), time:val("e-time"), type:radio("etype")||"famille", recur:radio("erecur")||"none", pinned:$("#e-pin").checked, kidIds:checked("ekids"), memberIds:checked("emems"), notes:val("e-notes"), place:val("e-place")};
    if (id) Object.assign(S.events.find(e => e.id === id), d); else S.events.push({id:uid(), ...d});
    UI.calSel = d.date; closeSheet(); commit(T("Ajouté à l'agenda")); },
  photo: async () => { const d = {date:val("p-date")||iso(today()), cat:radio("pcat")||"autre", caption:val("p-cap"), kidIds:checked("pkids")};
    if (UI.photoDraft.edit){ const p = S.photos.find(x => x.id === UI.photoDraft.edit); Object.assign(p, d);
      if (UI.photoDraft.day){ await PhotoDB.put(p.id, UI.photoDraft.day); p.v = Date.now(); } closeSheet(); commit(T("Photo modifiée")); return driveQ("photo", p.id); }
    const id = uid(); await PhotoDB.put(id, UI.photoDraft.day); S.photos.push({id, ...d, by:S.me}); closeSheet(); commit(T("Photo enregistrée")); driveQ("photo", id); },
  memory: async f => { const id = f.dataset.id || uid(), ex = S.memories.find(m => m.id === id);
    const d = {id, title:val("m-title"), date:val("m-date"), text:val("m-text"), kidIds:checked("mkids"), drive:ex?.drive||false, photoId:ex?.photoId||null};
    if (UI.photoDraft.mem2){ d.photoId = d.photoId || uid(); await PhotoDB.put(d.photoId, UI.photoDraft.mem2); }
    if (ex) Object.assign(ex, d); else S.memories.push(d);
    const toDrive = $("#m-drive")?.checked !== false; closeSheet(); commit(T("Souvenir enregistré"));
    if (toDrive) driveQ("mem", id);
  },
  task: f => { const id = f.dataset.id; const d = {title:val("tk-title"), points:numOf("tk-pts")||5, assignees:checked("tkwho"), team:!!$("#tk-team")?.checked, times:[0,1,2,3].map(i => val("tk-h"+i)).filter(Boolean), perDay:Math.max(1, Math.min(8, +val("tk-per")||1)), recur:radio("tkrec")||"daily", days:checked("tkdays").map(Number), date:val("tk-date"), icon:radio("tkicon")||"star"};
    if (!d.assignees.length) return toast(T("Choisissez au moins une personne")); if (id) Object.assign(S.tasks.find(t => t.id === id), d); else S.tasks.push({id:uid(), ...d}); closeSheet(); commit(T("Défi enregistré")); },
  reward: f => { const d = {title:val("rw-title"), cost:numOf("rw-cost")||50}; if (f.dataset.id) Object.assign(S.rewards.find(r => r.id === f.dataset.id), d); else S.rewards.push({id:uid(), ...d}); closeSheet(); commit(f.dataset.id ? T("Modifié") : T("Récompense ajoutée")); },
  chat: async f => { const t = $("#chat-in").value.trim(); if (!t) return; $("#chat-in").value = ""; await Cloud.send(f.dataset.ch, t); },
  groupNew: async () => { const id = await Cloud.groupCreate(val("gn")); closeSheet(); UI.groupOpen = id; toast(T("Groupe créé")); },
  joinGroup: async () => { await Cloud.groupJoin(val("jg-code")); toast(T("Vous avez rejoint le groupe")); },
  groupEvent: async f => { await Cloud.groupEvent(f.dataset.g, {id:uid(), title:val("ge-t"), date:val("ge-d"), time:val("ge-h"), place:val("ge-p"), by:Cloud.user.uid, rsvp:{[Cloud.user.uid]:{ok:true, name:me()?.name||""}}}); closeSheet(); toast(T("Activité proposée")); },
});

/* ======== DONNÉES D'EXEMPLE ======== */
/* ======== DÉMARRAGE ======== */
(function boot(){
  const stored = loadLocal();
  LANG = (stored?.settings?.lang) || ((navigator.language||"fr").toLowerCase().startsWith("fr") ? "fr" : "en");
  S = stored ? migrate(stored) : blankState();
  if (isDemoData(S)) S = freshFrom(S);
  normalize();
  try { const h = location.hash.slice(1); if (["home","kid","agenda","tribu","souvenirs","plus","assistant"].includes(h)) UI.view = h; } catch(e){}
  $("#fab").addEventListener("click", () => { if (UI.view === "assistant") go("home"); else aiSheet(); });
  Native.initKeyboard(); Native.initApp();
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => render());
  render(); save();
  setInterval(() => { const el = $("#timerVal"); if (el){ const t = (S.timers||{})[el.dataset.kid]; if (t) el.textContent = fmtDur(timerElapsed(t)); } }, 15000);
  setTimeout(maybeAutoReview, 3000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && renderPending && !$("#layer .scrim")){ renderPending = false; render(); } });
})();
Object.assign(ACT, { dayDetail: v => dayDetail(v), weekDetail: v => weekDetail(v) });
Object.assign(ACT, { kcNav: v => { const b = UI.kcMonth ? parseD(UI.kcMonth) : new Date(today().getFullYear(), today().getMonth(), 1); UI.kcMonth = iso(addMonths(b, +v)); render(); } });
