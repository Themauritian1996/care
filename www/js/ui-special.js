/* =========================================================================
   TRIBE — souvenirs spéciaux : premières fois, mots d'enfant, entrevue
   d'anniversaire, lettres scellées, créations, voyages.
   Tout est rangé dans S.memories (champ kind), donc synchronisé, visible
   dans l'agenda et copiable dans Google Drive.
   ========================================================================= */
const specialKid = () => kidById(UI.specKid) || child();
const lockedMem = m => m.kind === "letter" && m.unlock && m.unlock > iso(today());
const kidMems = (c, kind) => S.memories.filter(m => m.kind === kind && (m.kidIds||[]).includes(c.id)).sort((a,b) => a.date < b.date ? 1 : -1);
const ageAt = (c, date) => isPrenatal(c) || date < c.dob ? T("avant la naissance") : ageLabel(ageMonths(c, parseD(date)));
const SPEC = k => SPECIAL.find(x => x.k === k) || {l:"Souvenir", ic:"star", c:"butter"};

function specialView(){
  const c = specialKid();
  if (!c) return `<div class="card">${empty("star", T("Ajoutez un enfant pour commencer ses souvenirs spéciaux."), `<button class="btn kid" data-act="kidForm">${T("Ajouter un enfant")}</button>`)}</div>`;
  const k = UI.specTab || "first", K = SPEC(k), canAdd = !isKidUser() || allow("photos");
  let h = S.children.length > 1 ? `<div class="pick">${S.children.map(x => `<button data-act="specKid" data-v="${x.id}" aria-pressed="${x.id===c.id}">${avatarOf(x,22)} ${esc(x.nick||x.name)}</button>`).join("")}</div>` : "";
  h += `<div class="spec-grid">${SPECIAL.map(x => { const n = kidMems(c, x.k).length; return `<button class="spec-tile" data-act="specTab" data-v="${x.k}" aria-pressed="${x.k===k}" style="--c:var(--${x.c});--cb:var(--${x.c}-bg);--ci:var(--${x.c}-ink)">${icon(x.ic)}<b>${T(x.s)}</b><span class="tiny">${n}</span></button>`; }).join("")}</div>`;
  h += `<div class="card"><div class="card-h"><div><span class="eyebrow">${esc(c.nick||c.name)}</span><h2>${T(K.l)}</h2></div>${canAdd && k !== "first" ? `<button class="btn kid" data-act="specForm" data-v="${k}">${icon("plus")}${T("Ajouter")}</button>` : ""}</div><p class="small muted">${T(K.d)}</p>`;
  h += ({first:firstsPane, quote:quotesPane, interview:interviewPane, letter:lettersPane, art:artPane, trip:tripsPane}[k])(c) + `</div>`;
  if (aiReady() && !isKidUser()){
    const years = [...new Set(S.memories.filter(m => (m.kidIds||[]).includes(c.id)).map(m => m.date.slice(0,4)))].sort().reverse();
    if (years.length) h += `<div class="card tint"><div class="card-h"><div><span class="eyebrow">${T("Avec Gemini")}</span><h2>${T("Le récit de l'année")}</h2></div></div><p class="small muted">${T("Gemini rassemble les souvenirs, jalons et mesures de l'année en une page d'album à garder ou partager.")}</p><div class="pick">${years.map(y => `<button data-act="aiYear" data-v="${c.id}|${y}">${icon("spark")} ${y}</button>`).join("")}</div></div>`;
  }
  return h;
}
const memLi = (m, sub, ic, col) => `<button class="li" data-act="openMemory" data-v="${m.id}"><div class="ic" style="background:var(--${col}-bg);color:var(--${col}-ink)">${icon(ic)}</div><div class="grow"><div class="li-title">${esc(m.title)}</div><div class="small muted">${sub}</div></div>${m.photoId?icon("camera").replace("<svg",'<svg style="width:18px;height:18px;color:var(--soft)"'):""}</button>`;

function firstsPane(c){
  const done = kidMems(c, "first"), keys = new Set(done.map(m => m.key)), m = isPrenatal(c) ? -1 : ageMonths(c);
  const avail = FIRSTS.filter(([k,,a]) => !keys.has(k) && a <= m + 8), near = avail.filter(([,,a]) => a >= m - 18);
  const next = UI.firstAll ? avail : (near.length ? near : avail.slice(-8)), more = avail.length - next.length;
  let h = done.length ? `<div class="list">${done.map(x => memLi(x, `${fmtD(x.date)} · ${ageAt(c, x.date)}`, "star", "butter")).join("")}</div>` : `<p class="small muted">${T("Aucune première fois notée. Touchez une suggestion ci-dessous.")}</p>`;
  if (!isKidUser()){
    h += `<div class="sep"></div><span class="eyebrow">${m < 0 ? T("Bientôt") : T("À noter quand ça arrive (ou déjà arrivé)")}</span><div class="pick">${next.map(([k,l]) => `<button data-act="specForm" data-v="first|${k}">${icon("plus")} ${T(l)}</button>`).join("")}<button data-act="specForm" data-v="first|autre">${icon("plus")} ${T("Autre première fois")}</button>${more > 0 ? `<button data-act="firstAll">${T("Voir les {n} autres",{n:more})}</button>` : ""}</div>`;
  }
  return h;
}
function quotesPane(c){
  const q = kidMems(c, "quote");
  return q.length ? `<div class="stack">${q.map(x => `<button class="quote" data-act="openMemory" data-v="${x.id}"><span class="qmark">“</span>${esc(x.title)}<span class="small muted">${ageAt(c, x.date)} · ${fmtD(x.date,{day:"numeric",month:"short",year:"numeric"})}${x.text?` · ${esc(x.text)}`:""}</span></button>`).join("")}</div>` : empty("chat", T("« Maman, les nuages, c'est de la vapeur de ciel ? » Notez ces perles avant de les oublier."));
}
function interviewPane(c){
  const list = kidMems(c, "interview").slice().reverse();
  if (!list.length) return empty("gift", T("Chaque anniversaire, posez les mêmes questions. Dans 10 ans, comparez : c'est magique."));
  const cols = list.slice(-4), qs = INTERVIEW_Q.filter(q => cols.some(m => m.answers?.[q]));
  return `<div class="tbl"><table><thead><tr><th></th>${cols.map(m => `<th><button class="btn sm ghost" data-act="openMemory" data-v="${m.id}">${ageAt(c, m.date)}</button></th>`).join("")}</tr></thead><tbody>${qs.map(q => `<tr><td class="small" style="font-weight:600">${T(q)}</td>${cols.map(m => `<td class="small">${esc(m.answers?.[q]||"—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${list.length > 4 ? `<p class="tiny muted">${T("Les 4 dernières entrevues sont comparées ; touchez une année pour la revoir.")}</p>` : ""}<div class="list">${list.slice().reverse().map(m => memLi(m, fmtD(m.date), "gift", "peach")).join("")}</div>`;
}
function lettersPane(c){
  const L = kidMems(c, "letter");
  return L.length ? `<div class="list">${L.map(m => memLi(m, lockedMem(m) ? `${icon("lock").replace("<svg",'<svg style="width:14px;height:14px;vertical-align:-2px"')} ${T("Scellée jusqu'au {d}",{d:fmtD(m.unlock)})}` : `${T("Ouverte")} · ${T("écrite le {d}",{d:fmtD(m.date)})}`, lockedMem(m) ? "lock" : "mail", "lilac")).join("")}</div>` : empty("mail", T("Écrivez à votre enfant aujourd'hui ; la lettre restera scellée jusqu'à ses 18 ans (ou la date de votre choix)."));
}
function artPane(c){
  const A = kidMems(c, "art");
  if (!A.length) return empty("pencil", T("Photographiez dessins et bricolages : ils prennent moins de place ici que sur le frigo."));
  AFTER.push(async () => { for (const el of $$("img[data-mphoto]")){ const d = await PhotoDB.get(el.dataset.mphoto); if (d) el.src = d; } });
  return `<div class="gallery">${A.map(m => `<button data-act="openMemory" data-v="${m.id}" aria-label="${esc(m.title)}">${m.photoId?`<img data-mphoto="${m.photoId}" alt="">`:`<span class="empty">${icon("pencil")}</span>`}<span class="cap"><span class="chip mint">${esc(m.title).slice(0,24)}</span></span></button>`).join("")}</div>`;
}
function tripsPane(c){
  const L = kidMems(c, "trip");
  return L.length ? `<div class="list">${L.map(m => memLi(m, `${fmtD(m.date,{day:"numeric",month:"short",year:"numeric"})}${m.end?` → ${fmtD(m.end,{day:"numeric",month:"short"})}`:""} · ${ageAt(c, m.date)}`, "pin", "coral")).join("")}</div>` : empty("pin", T("Premier camping, la mer, chez grand-maman en Gaspésie… gardez la trace des lieux et de ce qu'on a aimé."));
}

/* ---------- formulaire unique, champs selon le type ---------- */
function specialForm(v, id){
  const [kind, key] = (v||"").split("|"), c = specialKid(); if (!c) return;
  const m = S.memories.find(x => x.id === id) || {kind, key, date:iso(today()), title:"", text:"", kidIds:[c.id]};
  const K = SPEC(m.kind); UI.photoDraft = {mem2:null};
  const first = FIRSTS.find(f => f.k === m.key || f[0] === m.key);
  const aiText = aiReady() ? `<button type="button" class="btn sm ghost" data-act="aiMemText" data-v="sp-text|sp-title">${icon("spark")}${T("Écrire avec l'IA")}</button>` : "";
  const photoBtn = `<button type="button" class="btn ghost" data-act="memPhoto">${icon("camera")}${m.kind === "art" ? T("Photographier la création") : T("Ajouter une photo (facultatif)")}</button><div id="memPhotoPrev"></div>`;
  let f = "";
  if (m.kind === "first") f = `${first && !id ? `<h3>${T(first[1])}</h3><input type="hidden" id="sp-title" value="${esc(T(first[1]))}">` : fld("sp-title",T("Quelle première fois ?"),inp("sp-title",m.title,`required placeholder="${T("Premier tour de manège…")}"`))}
    ${fld("sp-date",T("Quand ?"),inp("sp-date",m.date,'type="date" required'))}${fld("sp-text",T("Comment c'était ? (facultatif)"),`<textarea class="inp" id="sp-text">${esc(m.text||"")}</textarea>`)}${aiText}${photoBtn}`;
  if (m.kind === "quote") f = `${fld("sp-title",T("La phrase, mot pour mot"),`<textarea class="inp" id="sp-title" required placeholder="${T("« Quand je serai grand, je serai un dinosaure pompier. »")}">${esc(m.title)}</textarea>`)}
    ${fld("sp-text",T("Contexte (facultatif)"),inp("sp-text",m.text,`placeholder="${T("En regardant la pluie, au souper…")}"`))}${fld("sp-date",T("Date"),inp("sp-date",m.date,'type="date" required'))}`;
  if (m.kind === "interview"){ const a = m.answers || {};
    f = `<p class="small muted">${T("Posez les questions à {n} et notez ses réponses telles quelles.",{n:esc(c.nick||c.name)})}</p>${INTERVIEW_Q.map((q,i) => fld("sp-q"+i, T(q), inp("sp-q"+i, a[q]||""))).join("")}
    ${fld("sp-date",T("Date"),inp("sp-date",m.date,'type="date" required'))}${photoBtn}`; }
  if (m.kind === "letter"){ const b = isPrenatal(c) ? parseD(c.dueDate) : parseD(c.dob), d18 = iso(addMonths(b, 216));
    f = `${fld("sp-title",T("Titre"),inp("sp-title",m.title||T("Pour tes 18 ans"),"required"))}
    ${fld("sp-text",T("Ta lettre"),`<textarea class="inp" id="sp-text" rows="9" required>${esc(lockedMem(m) && m.by !== S.me ? "" : m.text||"")}</textarea>`)}
    <div class="fgrid">${fld("sp-unlock",T("Scellée jusqu'au"),inp("sp-unlock",m.unlock||(d18 > iso(today()) ? d18 : iso(addMonths(today(),12))),'type="date" required'))}${fld("sp-date",T("Écrite le"),inp("sp-date",m.date,'type="date" required'))}</div>
    <div class="pick">${[[T("18 ans"),216],[T("10 ans"),120],[T("Fin du primaire"),144]].map(([l,mo]) => `<button type="button" data-act="setUnlock" data-v="${iso(addMonths(b,mo))}">${l}</button>`).join("")}</div>
    <p class="tiny muted">${T("Le texte reste masqué dans l'app jusqu'à cette date, même pour {n}.",{n:esc(c.nick||c.name)})}</p>`; }
  if (m.kind === "art") f = `${photoBtn}${fld("sp-title",T("Titre de l'œuvre"),inp("sp-title",m.title,`required placeholder="${T("Ex. : la famille en arc-en-ciel")}"`))}${fld("sp-text",T("Ce que {n} en dit (facultatif)",{n:esc(c.nick||c.name)}),`<textarea class="inp" id="sp-text">${esc(m.text||"")}</textarea>`)}${aiText}${fld("sp-date",T("Date"),inp("sp-date",m.date,'type="date" required'))}`;
  if (m.kind === "trip") f = `${fld("sp-title",T("Où ?"),inp("sp-title",m.title,`required placeholder="${T("Ex. : Parc national de la Jacques-Cartier")}"`))}
    <div class="fgrid">${fld("sp-date",T("Du"),inp("sp-date",m.date,'type="date" required'))}${fld("sp-end",T("Au (facultatif)"),inp("sp-end",m.end||"",'type="date"'))}</div>
    ${fld("sp-text",T("Ce qu'on a aimé"),`<textarea class="inp" id="sp-text">${esc(m.text||"")}</textarea>`)}${aiText}${photoBtn}`;
  sheet(`<form class="stack" data-form="special" data-id="${m.id||""}" data-kind="${m.kind}" data-key="${esc(m.key||"")}" style="gap:14px">${sheetHead(`${icon(K.ic).replace("<svg",'<svg style="width:22px;height:22px;vertical-align:-4px"')} ${T(K.l)}`)}${f}
    ${Cloud.canDrive?.() ? `<label class="switch"><input type="checkbox" id="m-drive" ${m.kind==="letter"?"":"checked"}><span class="tg"></span><span class="grow">${T("Garder aussi une copie dans Google Drive")}</span></label>` : ""}
    <div class="row"><button class="btn kid grow" type="submit">${T("Enregistrer")}</button>${m.id?`<button type="button" class="btn danger" data-act="delMemory" data-v="${m.id}">${T("Supprimer")}</button>`:""}</div></form>`);
}
async function saveSpecial(f){
  const c = specialKid(), kind = f.dataset.kind, id = f.dataset.id || uid(), ex = S.memories.find(m => m.id === id);
  const d = {id, kind, key:f.dataset.key || null, date:val("sp-date") || iso(today()), title:val("sp-title"), text:val("sp-text"), kidIds:ex?.kidIds || [c.id], photoId:ex?.photoId || null, drive:ex?.drive || false, by:ex?.by || S.me};
  if (kind === "first" && d.key === "autre") d.key = null;
  if (kind === "interview"){ d.answers = {}; INTERVIEW_Q.forEach((q,i) => { const a = val("sp-q"+i); if (a) d.answers[q] = a; }); if (!Object.keys(d.answers).length) return toast(T("Notez au moins une réponse")); d.title = T("Entrevue de {n} · {a}",{n:c.nick||c.name, a:ageAt(c, d.date)}); }
  if (kind === "letter"){ d.unlock = val("sp-unlock"); if (!d.text) return toast(T("La lettre est vide")); if (ex && lockedMem(ex) && ex.by !== S.me && !val("sp-text")) d.text = ex.text; }
  if (kind === "trip") d.end = val("sp-end") || null;
  if (!d.title) return toast(T("Titre requis"));
  if (kind === "art" && !UI.photoDraft.mem2 && !d.photoId) return toast(T("Ajoutez la photo de la création"));
  if (UI.photoDraft.mem2){ d.photoId = d.photoId || uid(); await PhotoDB.put(d.photoId, UI.photoDraft.mem2); }
  if (ex) Object.assign(ex, d); else S.memories.push(d);
  const toDrive = !!$("#m-drive")?.checked; closeSheet(); commit(kind === "letter" ? T("Lettre scellée") : T("Souvenir enregistré")); if (kind === "first" && !ex) confetti();
  if (toDrive) driveQ("mem", id);
}
/* affichage détaillé selon le type (appelé par openMemory) */
function specialDetail(m){
  const c = kidById((m.kidIds||[])[0]), K = SPEC(m.kind);
  if (lockedMem(m)) return `<div class="empty">${icon("lock")}<h3>${T("Lettre scellée")}</h3><p>${T("Elle s'ouvrira le {d}.",{d:fmtD(m.unlock,{day:"numeric",month:"long",year:"numeric"})})}</p><p class="small muted">${T("Écrite le {d}",{d:fmtD(m.date)})}${member(m.by)?` · ${esc(member(m.by).name)}`:""}</p></div>`;
  let h = `<div class="row"><span class="chip ${K.c}">${T(K.l)}</span>${c?`<span class="small muted">${esc(c.nick||c.name)} · ${ageAt(c, m.date)}</span>`:""}</div>`;
  if (m.kind === "quote") h += `<blockquote class="quote big"><span class="qmark">“</span>${esc(m.title)}</blockquote>${m.text?`<p class="small muted">${esc(m.text)}</p>`:""}`;
  else if (m.kind === "interview") h += `<div class="list">${Object.entries(m.answers||{}).map(([q,a]) => `<div class="li"><div class="grow"><div class="small muted">${T(q)}</div><div class="li-title">${esc(a)}</div></div></div>`).join("")}</div>`;
  else if (m.kind === "story" || m.kind === "yearbook") h += `<div>${md(m.text||"")}</div>`;
  else if (m.text) h += `<p style="white-space:pre-wrap">${esc(m.text)}</p>`;
  return h;
}

Object.assign(ACT, {
  specTab: v => { UI.specTab = v; render(); }, specKid: v => { UI.specKid = v; render(); },
  specForm: v => specialForm(v), firstAll: () => { UI.firstAll = true; render(); }, setUnlock: v => { $("#sp-unlock").value = v; },
});
Object.assign(FORMS, { special: f => saveSpecial(f) });
