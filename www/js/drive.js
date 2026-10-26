/* =========================================================================
   TRIBE — copie automatique dans Google Drive
   Dossier « Tribe » / Photos du jour / AAAA-MM            (photos .jpg)
                    / Moments / date titre                 (Google Doc + photos)
                    / Spéciaux / type / date titre         (Google Doc + photos)
                    / Histoires / titre                    (Google Doc + images)
                    / Suivi / Prénom                       (Google Doc « Suivi de … » : croissance,
                                                            vaccins, jalons, dents, habitudes par mois, notes)
   Les documents sont créés au format Google Docs (bien mis en page,
   téléchargeables en Word ou PDF depuis Drive).
   Ajout : envoyé ; modification : l'ancienne copie est remplacée ;
   suppression : retirée du Drive. Les lettres scellées restent privées.
   ========================================================================= */
const DRIVE_ROOT = "Tribe";
const GDOC = "application/vnd.google-apps.document";
const DRIVE_KINDS = [
  ["photos", "Photos du jour", "Chaque photo, rangée par mois"],
  ["moments", "Moments précieux", "Texte mis en page et photo"],
  ["speciaux", "Souvenirs spéciaux", "Premières fois, lettres ouvertes, voyages, créations…"],
  ["histoires", "Histoires", "Chaque histoire avec ses chapitres et ses images"],
  ["suivi", "Suivi de chaque enfant", "Un document par enfant mis à jour : croissance, vaccins, jalons, dents, habitudes par mois, notes, fièvre et médicaments"],
];
/* une seule personne de la famille garde la copie (pas de doublons) ; elle peut partager le dossier avec l'autre parent */
const driveKeeperOk = () => !S.settings.driveKeeper || S.settings.driveKeeper === Cloud.user?.uid;
const driveOn = () => Cloud.canDrive?.() && S.settings.driveAuto !== false && driveKeeperOk();
const driveWants = k => driveOn() && (S.settings.driveSync?.[k] ?? true);
const b64txt = t => btoa(unescape(encodeURIComponent(t)));
const safeName = (t, n = 80) => String(t||"").replace(/[\/\\:*?"<>|]/g, "-").trim().slice(0, n) || "Tribe";
const memKind = m => SPECIAL.find(x => x.k === m.kind) ? "speciaux" : ["story","yearbook"].includes(m.kind) ? "histoires" : "moments";
function driveQ(kind, id, force){
  const k = kind === "photo" ? "photos" : kind === "mem" ? memKind(S.memories.find(m => m.id === id) || {}) : kind === "story" ? "histoires" : kind;
  if (!(force ? Cloud.canDrive?.() : driveWants(k))) return;
  S.driveQueue = (S.driveQueue||[]).filter(x => !(x.op === "up" && x.kind === kind && x.id === id)); S.driveQueue.push({op:"up", kind, id}); save(); driveFlush();
}
function driveQDel(ids){ ids = (ids||[]).filter(Boolean); if (!ids.length || !Cloud.canDrive?.()) return; S.driveQueue = S.driveQueue||[]; ids.forEach(f => S.driveQueue.push({op:"del", f})); save(); driveFlush(); }
const drivePending = () => (S.driveQueue||[]).length;
function memDrivePath(m){
  const sp = SPECIAL.find(x => x.k === m.kind), dir = safeName(`${m.date} ${m.title||""}`);
  return sp ? ["Spéciaux", sp.l, dir] : ["story","yearbook"].includes(m.kind) ? ["Histoires", dir] : ["Moments", dir]; // noms fixes : pas de doublons si la langue change
}

/* ---------- mise en page HTML → Google Docs ---------- */
const DOC_CSS = `body{font-family:Arial,sans-serif;font-size:11pt;color:#2A2340}h1{color:#C2457A;font-size:22pt;margin:0 0 4pt}h2{color:#6A55C9;font-size:15pt;margin:16pt 0 6pt;border-bottom:1px solid #DDD6F3}h3{color:#2A2340;font-size:12pt;margin:10pt 0 4pt}
  .sub{color:#7A7290;font-size:10pt}table{border-collapse:collapse;width:100%;margin:4pt 0}th{background:#EFEAFB;color:#4B3DA0;text-align:left;font-size:9.5pt;padding:4pt 6pt;border:1px solid #DDD6F3}td{padding:4pt 6pt;border:1px solid #E6E1F5;font-size:10pt;vertical-align:top}
  .q{color:#6A55C9;font-weight:bold;margin-top:8pt}.box{background:#FFF5E6;border-left:4px solid #F0A04B;padding:6pt 10pt}.who{color:#C2457A;font-weight:bold}`;
const H = t => esc(String(t ?? ""));
const paras = t => String(t||"").split(/\n{2,}/).map(p => `<p>${H(p).replace(/\n/g, "<br>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")}</p>`).join("");
const docHTML = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><title>${H(title)}</title><style>${DOC_CSS}</style></head><body>${body}<p class="sub" style="margin-top:18pt">${H(T("Créé avec {app} le {d}",{app:appName(), d:fmtD(today(),{day:"numeric",month:"long",year:"numeric"})}))}</p></body></html>`;
const tbl = (head, rows) => rows.length ? `<table><tr>${head.map(h => `<th>${H(h)}</th>`).join("")}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? "—"}</td>`).join("")}</tr>`).join("")}</table>` : `<p class="sub">${H(T("Rien d'enregistré."))}</p>`;
async function upDoc(name, html, desc, path){ return Cloud.driveUpload(safeName(name), "text/html", b64txt(html), desc||"", path, GDOC); }

function memoryDoc(m){
  const kids = (m.kidIds||[]).map(id => kidById(id)?.name).filter(Boolean).join(", "), sp = SPECIAL.find(x => x.k === m.kind);
  return docHTML(m.title, `<h1>${H(m.title)}</h1><p class="sub">${H(fmtD(m.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"}))}${kids?` · ${H(kids)}`:""}${sp?` · ${H(T(sp.l))}`:""}</p>
    ${paras(m.text)}${m.answers ? Object.entries(m.answers).filter(([,a]) => a).map(([q, a]) => `<p class="q">${H(T(q))}</p>${paras(a)}`).join("") : ""}${m.place?`<p class="sub">${H(m.place)}</p>`:""}${m.end?`<p class="sub">${H(T("Jusqu'au {d}",{d:fmtD(m.end)}))}</p>`:""}`);
}
function storyDoc(s){
  const ch = id => s.characters.find(x => x.id === id);
  return docHTML(s.title, `<h1>${H(s.title)}</h1><p class="sub">${H(T("{n} chapitre(s)",{n:s.chapters.length}))}${s.kid && kidById(s.kid) ? ` · ${H(T("pour {n}",{n:kidById(s.kid).name}))}` : ""}</p>
    <h3>${H(T("Personnages"))}</h3><ul>${s.characters.filter(x => x.id !== "narr").map(x => `<li><b>${H(x.name)}</b>${x.desc?` : ${H(x.desc)}`:""}</li>`).join("")}</ul>
    ${s.chapters.map(c => `<h2>${H(T("Chapitre {n}",{n:c.n}))} · ${H(c.title)}</h2>${c.img?`<p class="sub">${H(T("Illustration : {f}",{f:`${T("Chapitre")} ${c.n}.jpg`}))}</p>`:""}${c.segs.map(sg => sg.c === "narr" ? `<p>${H(sg.t)}</p>` : `<p><span class="who">${H(ch(sg.c)?.name||"")} :</span> ${H(sg.t)}</p>`).join("")}`).join("")}`);
}
function suiviDoc(c){
  const R = reportData(c), nm = c.nick || c.name, G = [...(c.growth||[])].sort((a, b) => a.date < b.date ? 1 : -1);
  const pc = (k, v, am) => { if (!v) return "—"; const z = zScore(k, c.sex, am, Number(v)); return `${fmtNum(cvM(k, Number(v)), dpM(k, k === "weight" ? 2 : 1))} ${muM(k)}${z != null ? ` <span class="sub">(P${pctLabel(z)})</span>` : ""}`; };
  const growth = tbl([T("Date"), T("Âge"), T("Poids"), T("Taille"), T("PC"), T("IMC")], G.map(g => { const am = effAge(c, parseD(g.date)), b = g.weight && g.height ? g.weight / Math.pow(g.height/100, 2) : null;
    return [H(fmtD(g.date)), H(ageLabel(ageMonths(c, parseD(g.date)))), pc("weight", g.weight, am), pc("height", g.height, am), pc("ofc", g.ofc, am), b ? pc("bmi", b, am) : "—"]; }));
  const ms = MS.filter(it => c.milestones?.[it.k]).sort((a, b) => c.milestones[a.k] < c.milestones[b.k] ? -1 : 1);
  const teeth = [...TEETH.flatMap(t => ["R","L"].map(sd => ({n:`${fdi(false, t.jaw, sd, t.k)} · ${T(t.n)} (${sd === "L" ? T("gauche") : T("droite")})`, on:c.teeth?.[t.id+sd] || c.teeth?.[t.id], lost:c.teethLost?.[t.id+sd]}))).filter(x => x.on || x.lost),
    ...PERM_TEETH.flatMap(t => ["R","L"].map(sd => ({n:`${fdi(true, t.jaw, sd, t.k)} · ${T(t.n)} (${sd === "L" ? T("gauche") : T("droite")})`, on:c.permTeeth?.[fdi(true, t.jaw, sd, t.k)]}))).filter(x => x.on)];
  // habitudes par mois (12 derniers mois)
  const months = []; for (let i = 0; i < 12; i++){ const d = new Date(today().getFullYear(), today().getMonth() - i, 1); months.push(d); }
  const born = parseD(birthOf(c));
  const monthly = months.map(d0 => { const days = []; for (let d = new Date(d0); d.getMonth() === d0.getMonth() && d <= today(); d = addDays(d, 1)) if (d >= born) days.push(dayTotals(c, d));
    if (!days.length) return null; const n = days.length, avg = k => sum(days.map(t => t[k] || 0)) / n, meals = c.logs.filter(l => l.type === "solid" && new Date(l.t).getMonth() === d0.getMonth() && new Date(l.t).getFullYear() === d0.getFullYear()).length;
    if (!sum(days.map(t => (t.sleep||0) + (t.act||0) + (t.screen||0) + (t.read||0))) && !meals) return null;
    return [H(fmtD(d0, {month:"long", year:"numeric"})), `${fmtNum(avg("sleep")/60, 1)} h`, fmtMin(avg("act")), fmtMin(avg("screen")), fmtMin(avg("read")), String(meals)]; }).filter(Boolean);
  const since = Date.now() - 365 * DAY, logs = (c.logs||[]).filter(l => l.t >= since).sort((a, b) => b.t - a.t);
  const notes = logs.filter(l => l.type === "note" || (l.type === "mood" && l.data?.note) || l.data?.note && !["sleep"].includes(l.type));
  const when = l => `${fmtD(new Date(l.t),{day:"numeric",month:"short",year:"numeric"})} ${fmtT(l.t)}`;
  const health = logs.filter(l => l.type === "temp" || l.type === "med").slice(0, 120);
  const alg = Object.entries(c.allergensLog||{}).filter(([, L]) => L.length).map(([a, L]) => [H(T(a)), String(L.length), H(fmtD(L.slice().sort().at(-1)))]);
  return docHTML(T("Suivi de {n}",{n:nm}), `<h1>${H(T("Suivi de {n}",{n:nm}))}</h1>
    <p class="sub">${H(T("Né·e le {d}",{d:fmtD(c.dob)}))} · ${H(ageLabel(R.m))}${c.sex ? ` · ${H(c.sex === "M" ? T("garçon") : T("fille"))}` : ""} · ${H(T("Mis à jour le {d}",{d:fmtD(today(),{day:"numeric",month:"long",year:"numeric"})}))}</p>
    ${c.allergies || c.conditions || c.meds ? `<p class="box">${c.allergies?`<b>${H(T("Allergies"))} :</b> ${H(c.allergies)}<br>`:""}${c.conditions?`<b>${H(T("Problèmes de santé"))} :</b> ${H(c.conditions)}<br>`:""}${c.meds?`<b>${H(T("Médicaments réguliers"))} :</b> ${H(c.meds)}`:""}</p>` : ""}
    <h2>${H(T("Croissance (OMS)"))}</h2>${growth}${R.vel ? `<p>${H(T("Vitesse de croissance"))} : ${fmtNum(R.vel.v, 1)} ${H(T("cm / an"))}</p>` : ""}${R.mp ? `<p>${H(T("Taille cible parentale"))} : ${fmtNum(R.mp.t, 0)} cm</p>` : ""}
    <h2>${H(T("Vaccination (PIQ)"))}</h2>${tbl([T("Âge"), T("Vaccin"), T("Statut"), T("Détails")], R.vax.map(v => [H(v.grp), H(v.name), H(v.st), H(v.det)]))}
    <h2>${H(T("Développement : jalons observés"))}</h2>${tbl([T("Date"), T("Sphère"), T("Jalon")], ms.map(it => [H(fmtD(c.milestones[it.k])), H(T(DOMAINS[it.d].label)), H(T(it.t))]))}
    <h2>${H(T("Dents"))}</h2>${tbl([T("Dent (FDI)"), T("Sortie"), T("Tombée")], teeth.map(t => [H(t.n), t.on ? H(fmtD(t.on)) : "—", t.lost ? H(fmtD(t.lost)) : "—"]))}
    <h2>${H(T("Habitudes, moyenne par jour selon le mois"))}</h2>${tbl([T("Mois"), T("Sommeil"), T("Activité"), T("Écran"), T("Lecture"), T("Repas notés")], monthly)}
    ${alg.length ? `<h2>${H(T("Allergènes introduits"))}</h2>${tbl([T("Aliment"), T("Fois"), T("Dernière fois")], alg)}` : ""}
    <h2>${H(T("Notes de suivi (12 derniers mois)"))}</h2>${tbl([T("Date"), T("Type"), T("Note")], notes.map(l => [H(when(l)), H(T(LOGT[l.type]?.label || "Note")), H(l.data?.text || [l.data?.mood ? T(l.data.mood) : "", l.data?.note].filter(Boolean).join(" · "))]))}
    <h2>${H(T("Fièvre et médicaments (12 derniers mois)"))}</h2>${tbl([T("Date"), T("Détail")], health.map(l => [H(when(l)), l.type === "temp" ? H(`${fmtTemp(l.data.temp)} (${T(l.data.site||"")})`) : H(`${l.data.name}${l.data.dose ? " · " + l.data.dose : ""}`)]))}`);
}

async function driveUpOne(x){
  if (x.kind === "photo"){
    const p = S.photos.find(y => y.id === x.id); if (!p) return; const d = await PhotoDB.get(p.id); if (!d) return;
    for (const f of p.driveIds||[]) await Cloud.driveDelete(f).catch(() => {});
    const kids = (p.kidIds||[]).map(id => kidById(id)?.name).filter(Boolean).join(", ");
    const r = await Cloud.driveUpload(safeName(`${p.date} ${p.caption||T("Photo du jour")}`, 86) + ".jpg", "image/jpeg", d.split(",")[1], [T(PHOTO_CATS.find(c => c.id === p.cat)?.l||""), kids, p.caption].filter(Boolean).join(" · "), ["Photos du jour", p.date.slice(0, 7)]);
    p.driveIds = [r.id]; p.drive = true;
  } else if (x.kind === "mem"){
    const m = S.memories.find(y => y.id === x.id); if (!m || lockedMem(m)) return;
    for (const f of m.driveIds||[]) await Cloud.driveDelete(f).catch(() => {});
    const path = memDrivePath(m), ids = [(await upDoc(m.title || T("Souvenir"), memoryDoc(m), m.title, path)).id];
    for (const pid of [m.photoId, ...(m.photoIds||[])].filter(Boolean)){ const d = await PhotoDB.get(pid); if (d) ids.push((await Cloud.driveUpload(`${T("Photo")} ${ids.length}.jpg`, "image/jpeg", d.split(",")[1], m.title, path)).id); }
    m.driveIds = ids.filter(Boolean); m.drive = true;
  } else if (x.kind === "story"){
    const s = (S.stories||[]).find(y => y.id === x.id); if (!s) return;
    for (const f of s.driveIds||[]) await Cloud.driveDelete(f).catch(() => {});
    const path = ["Histoires", safeName(s.title)], ids = [(await upDoc(s.title, storyDoc(s), T("Histoire"), path)).id];
    for (const c of s.chapters) if (c.img){ const d = await PhotoDB.get(c.img); if (d) ids.push((await Cloud.driveUpload(`${T("Chapitre")} ${c.n}.jpg`, d.startsWith("data:image/png") ? "image/png" : "image/jpeg", d.split(",")[1], c.title, path)).id); }
    s.driveIds = ids.filter(Boolean);
  } else if (x.kind === "suivi"){
    const c = kidById(x.id); if (!c || isPrenatal(c)) return;
    S.settings.driveSuivi = S.settings.driveSuivi || {}; const old = S.settings.driveSuivi[c.id];
    if (old?.id) await Cloud.driveDelete(old.id).catch(() => {});
    const r = await upDoc(T("Suivi de {n}",{n:c.nick || c.name}), suiviDoc(c), T("Suivi mis à jour automatiquement"), ["Suivi", safeName(c.name)]);
    S.settings.driveSuivi[c.id] = {id:r.id, at:Date.now(), h:suiviHash(c)};
  }
}
let driveBusy = false;
async function driveFlush(interactive){
  if (driveBusy || !drivePending() || !Cloud.canDrive?.()) return;
  if (!interactive && !Cloud.driveReady?.()) { softRender?.(); return; }
  driveBusy = true; let done = 0;
  try {
    while (S.driveQueue.length){
      const x = S.driveQueue[0];
      if (x.op === "del") await Cloud.driveDelete(x.f); else await driveUpOne(x);
      S.driveQueue.shift(); done++; save();
    }
    if (interactive) toast(T("Google Drive à jour ({n})",{n:done}));
  } catch(e){ if (interactive) toast(T("Google Drive : {e}",{e:e.message})); }
  finally { driveBusy = false; save(); softRender?.(); }
}
/* suivi longitudinal : on renvoie le document d'un enfant quand ses données changent (au plus toutes les 2 minutes) */
const suiviHash = c => { const L = c.logs||[]; return [L.length, L.at(-1)?.t || 0, L.at(-1)?.id || "", JSON.stringify(c.growth||[]).length, Object.keys(c.milestones||{}).length, JSON.stringify(c.teeth||{}).length, JSON.stringify(c.permTeeth||{}).length, JSON.stringify(c.vaccines||{}).length, JSON.stringify(c.allergensLog||{}).length, c.allergies||"", c.conditions||"", c.meds||""].join("|"); };
let suiviTimer;
function driveWatch(){
  clearTimeout(suiviTimer);
  suiviTimer = setTimeout(() => {
    if (driveOn() && S.settings.driveKeeper){ // la personne qui garde la copie envoie aussi ce que les autres ajoutent
      const Q = S.driveQueue = S.driveQueue || [], add = (kind, id) => { if (!Q.some(x => x.kind === kind && x.id === id)){ Q.push({op:"up", kind, id}); } }, since = S.settings.driveKeeperSince || 0;
      if (driveWants("photos")) S.photos.filter(p => !p.driveIds?.length && p.date >= iso(new Date(since))).forEach(p => add("photo", p.id));
      S.memories.filter(m => !m.driveIds?.length && !lockedMem(m) && driveWants(memKind(m)) && m.date >= iso(new Date(since - 365*DAY))).forEach(m => add("mem", m.id));
      if (drivePending()) { save(); driveFlush(); } }
    if (!driveWants("suivi")) return; const D = S.settings.driveSuivi || {};
    S.children.filter(c => !isPrenatal(c)).forEach(c => { const h = suiviHash(c); if (D[c.id]?.h !== h && !(S.driveQueue||[]).some(x => x.kind === "suivi" && x.id === c.id)) driveQ("suivi", c.id); }); }, 120000);
}
/* tout envoyer ce qui n'a jamais été copié (selon les choix des réglages) */
function driveBackfill(){
  const Q = S.driveQueue = S.driveQueue || [], add = (kind, id) => { if (!Q.some(x => x.kind === kind && x.id === id)) Q.push({op:"up", kind, id}); };
  const want = k => S.settings.driveSync?.[k] ?? true;
  if (want("photos")) S.photos.filter(p => !p.driveIds?.length).forEach(p => add("photo", p.id));
  S.memories.filter(m => !m.driveIds?.length && !lockedMem(m) && want(memKind(m))).forEach(m => add("mem", m.id));
  if (want("histoires")) (S.stories||[]).filter(s => !s.driveIds?.length).forEach(s => add("story", s.id));
  if (want("suivi")) S.children.filter(c => !isPrenatal(c)).forEach(c => add("suivi", c.id));
  save(); driveFlush(true);
}
const driveBanner = () => Cloud.canDrive?.() && drivePending() && !driveBusy ? `<div class="banner info">${icon("drive")}<div class="grow small">${T("{n} élément(s) à copier dans Google Drive (dossier « Tribe »).",{n:drivePending()})}</div><button class="btn sm kid" data-act="driveSync">${T("Synchroniser")}</button></div>` : "";
const driveSettings = () => { const parents = S.family.members.filter(m => m.uid && m.role !== "enfant"), mine = Cloud.user?.uid, keeper = S.settings.driveKeeper;
  return `${parents.length > 1 ? `<div class="field"><label>${T("Dans quel Drive garder la copie ?")}</label><p class="tiny muted">${T("Choisissez un seul compte : il copie tout ce que la famille ajoute (photos et souvenirs de chacun), puis partage le dossier « Tribe » avec l'autre parent. Ainsi les deux voient les mêmes éléments, sans doublons.")}</p>
    <div class="pick">${parents.map(m => `<button data-act="driveKeeper" data-v="${m.uid}" aria-pressed="${keeper===m.uid}">${avatarOf(m,20)} ${esc(m.name)}${m.uid===mine?` (${T("moi")})`:""}</button>`).join("")}<button data-act="driveKeeper" data-v="" aria-pressed="${!keeper}">${T("Chacun son Drive")}</button></div>
    ${keeper && keeper !== mine ? `<p class="small">${T("La copie est faite par {n}. Demandez-lui de partager le dossier avec vous (bouton ci-dessous sur son téléphone).",{n:esc(parents.find(m => m.uid===keeper)?.name||"")})}</p>` : ""}
    ${keeper === mine ? `<div class="row" style="flex-wrap:wrap">${parents.filter(m => m.uid !== mine && m.email).map(m => `<button class="btn sm ghost" data-act="driveShareWith" data-v="${esc(m.email)}">${icon("share")}${T("Partager le dossier avec {n}",{n:esc(m.name)})}</button>`).join("")}</div>` : ""}</div>` : ""}
  <div class="field"><label>${T("Copier automatiquement")}</label><div class="list">${DRIVE_KINDS.map(([k, l, d]) => `<label class="switch"><input type="checkbox" data-change="driveKind" data-k="${k}" ${(S.settings.driveSync?.[k] ?? true)?"checked":""} ${S.settings.driveAuto===false?"disabled":""}><span class="tg"></span><span class="grow"><b>${T(l)}</b><span class="tiny muted" style="display:block">${T(d)}</span></span></label>`).join("")}</div></div>`; };
Object.assign(ACT, {
  driveKeeper: v => { S.settings.driveKeeper = v || null; S.settings.driveKeeperSince = Date.now() - 30*DAY; commit(v ? T("Copie Drive confiée à un seul compte") : T("Chacun garde sa copie")); },
  driveShareWith: async v => { try { toast(T("Partage du dossier…")); await Cloud.driveShare(v); toast(T("Dossier « Tribe » partagé avec {e} : il apparaîtra dans « Partagés avec moi » de son Drive.",{e:v})); } catch(e){ toast(T("Google Drive : {e}",{e:e.message})); } },
  driveSync: () => driveFlush(true),
  driveAll: () => driveBackfill(),
  driveSuiviNow: v => { driveQ("suivi", v || child()?.id, true); driveFlush(true); },
});
Object.assign(CHANGE, {
  driveAuto: t => { S.settings.driveAuto = t.checked; save(); toast(t.checked ? T("Copie automatique activée") : T("Copie automatique désactivée")); render(); if (t.checked) driveFlush(); },
  driveKind: t => { S.settings.driveSync = {...(S.settings.driveSync||{}), [t.dataset.k]:t.checked}; save(); if (t.checked && t.dataset.k === "suivi") driveWatch(); },
});
