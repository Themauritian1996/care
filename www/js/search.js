/* =========================================================================
   TRIBE — recherche globale avec filtres
   ========================================================================= */
const norm = s => String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const SEARCH_CATS = [["all","Tout"],["journal","Journal"],["agenda","Agenda"],["souvenirs","Souvenirs"],["defis","Défis"],["ia","Assistant"],["pages","Sections"]];
function searchIndex(){
  const out = [], add = (cat, ic, title, sub, act, v, extra = "") => out.push({cat, ic, title:String(title||""), sub:sub||"", act, v, text:norm(`${title} ${sub} ${extra}`)});
  S.children.forEach(c => {
    const nm = c.nick || c.name;
    add("pages", "kid", nm, T("Profil de l'enfant"), "openKid", c.id, `${c.allergies||""} ${c.conditions||""} ${c.meds||""}`);
    (c.logs||[]).slice(-1500).forEach(l => { const d = l.data || {};
      const txt = l.type === "solid" ? (d.items||[]).map(i => i.name).join(", ") : l.type === "note" ? d.text : l.type === "med" ? `${d.name} ${d.dose||""}` : l.type === "activity" ? d.what : l.type === "read" ? d.title : l.type === "mood" ? `${T(d.mood)} ${d.note||""}` : d.note;
      if (!txt) return;
      add("journal", LOGT[l.type]?.ic || "note", txt, `${nm} · ${T(LOGT[l.type]?.label || "Note")} · ${fmtD(new Date(l.t),{day:"numeric",month:"short",year:"numeric"})}`, "searchDay", `${c.id}|${iso(new Date(l.t))}`, l.type === "solid" ? T(d.meal||"") : "");
    });
    (c.activities||[]).forEach(a => add("agenda", "ball", a.name, `${nm} · ${a.days.map(x => WD()[x]).join(", ")}`, "searchKidTab", `${c.id}|quotidien`, a.place));
  });
  allEvents(addDays(today(), -400), addDays(today(), 400)).filter(e => e.type !== "photo" && e.type !== "souvenir").forEach(e => add("agenda", "cal", e.title, `${T((EVT[e.type]||EVT.autre)[1])} · ${fmtD(e.date,{day:"numeric",month:"short",year:"numeric"})}${e.time?" · "+e.time:""}`, "searchDate", e.date, `${e.notes||""} ${e.place||""}`));
  S.memories.forEach(m => add("souvenirs", "star", lockedMem(m) ? T("Lettre scellée") : m.title, `${T((SPECIAL.find(x => x.k === m.kind)||{l:"Moment précieux"}).l)} · ${fmtD(m.date,{day:"numeric",month:"short",year:"numeric"})}`, "openMemory", m.id, lockedMem(m) ? "" : `${m.text||""} ${Object.values(m.answers||{}).join(" ")}`));
  S.photos.forEach(p => add("souvenirs", "camera", p.caption || T("Photo du jour"), `${T(PHOTO_CATS.find(c => c.id === p.cat)?.l || "")} · ${fmtD(p.date,{day:"numeric",month:"short",year:"numeric"})}`, "openPhoto", p.id));
  S.tasks.forEach(t => add("defis", t.icon || "star", t.title, `+${t.points} ${T("pts")} · ${(t.assignees||[]).map(a => member(a)?.name).filter(Boolean).join(", ")}`, "searchGo", "tribu"));
  S.rewards.forEach(r => add("defis", "gift", r.title, `${r.cost} ${T("pts")}`, "searchGo", "tribu"));
  (S.aiHist||[]).forEach(e => add("ia", (AI_CATS[e.cat]||["","spark"])[1], e.title, `${T((AI_CATS[e.cat]||["Assistant"])[0])} · ${fmtD(new Date(e.at),{day:"numeric",month:"short"})}`, "aiHistOpen", e.id, (e.text||"").slice(0, 600)));
  (S.recipes||[]).forEach(r => add("ia", "dish", r.title, `${T("Recette")} · ${(r.labels||[]).map(T).join(", ")}`, "recipeOpen", r.id, (r.ingredients||[]).join(" ")));
  (S.stories||[]).forEach(s => add("ia", "moon", s.title, `${T("Histoire")} · ${s.characters.filter(x => x.id !== "narr").map(x => x.name).join(", ")}`, "storyOpen", s.id));
  [["home","Accueil"],["agenda","Agenda"],["tribu","Défis, discussion, groupes"],["souvenirs","Souvenirs et photos"],["plus","Réglages, notifications, unités, langue"],["assistant","Assistant IA"]].forEach(([v,l]) => add("pages", "right", T(l), T("Aller à la section"), "searchGo", v));
  [["quotidien","Quotidien, sommeil, activité, humeur"],["repas","Repas, nutrition, calendrier des repas"],["croissance","Croissance, courbes"],["sante","Santé, vaccins, dents, dossier"],["dev","Développement, jalons"],["conseils","Conseils"]].forEach(([v,l]) => add("pages", "kid", T(l), T("Onglet de l'enfant"), "searchKidTab", `${child()?.id||""}|${v}`));
  add("pages", "heart", T("Premiers soins : RCR, étouffement"), T("Urgence"), "firstAid", "");
  add("pages", "phone", T("Urgence et ressources (911, 811, centre antipoison)"), T("Urgence"), "urgence", "");
  return out;
}
function searchSheet(){
  UI.sq = UI.sq || ""; UI.scat = UI.scat || "all";
  sheet(`${sheetHead(T("Rechercher"))}<input class="inp" id="sq" type="search" placeholder="${T("Un mot : brocoli, vaccin, fête, histoire, sieste…")}" value="${esc(UI.sq)}" autocomplete="off" enterkeyhint="search">
    <div class="pick" id="scats">${SEARCH_CATS.map(([k,l]) => `<button data-act="searchCat" data-v="${k}" aria-pressed="${UI.scat===k}">${T(l)}</button>`).join("")}</div><div id="sres"></div>`, "wide");
  UI.sidx = searchIndex(); searchRun(); setTimeout(() => $("#sq")?.focus(), 80);
}
function searchRun(){
  const box = $("#sres"); if (!box) return; const q = norm(UI.sq).trim(), words = q.split(/\s+/).filter(Boolean);
  if (!words.length){ box.innerHTML = `<p class="small muted">${T("Cherchez dans le journal, l'agenda, les souvenirs, les défis, l'assistant et les sections de l'app.")}</p>`; return; }
  const res = UI.sidx.filter(r => (UI.scat === "all" || r.cat === UI.scat) && words.every(w => r.text.includes(w)));
  const counts = {}; UI.sidx.filter(r => words.every(w => r.text.includes(w))).forEach(r => counts[r.cat] = (counts[r.cat]||0) + 1);
  $$("#scats button").forEach(b => { const k = b.dataset.v, n = k === "all" ? sum(Object.values(counts)) : counts[k] || 0; b.textContent = `${T(SEARCH_CATS.find(x => x[0] === k)[1])}${n ? ` (${n})` : ""}`; });
  box.innerHTML = res.length ? `<div class="list">${res.slice(0, 80).map(r => `<button class="li rowbtn" data-act="searchOpen" data-v="${esc(r.act)}|${esc(r.v)}"><div class="ic" style="background:var(--surface2)">${icon(r.ic)}</div><div class="grow"><div class="li-title">${esc(r.title).slice(0, 120)}</div><div class="small muted">${esc(r.sub)}</div></div></button>`).join("")}</div>${res.length > 80 ? `<p class="tiny muted">${T("{n} résultats ; précisez la recherche.",{n:res.length})}</p>` : ""}` : `<p class="small muted">${T("Aucun résultat.")}</p>`;
}
document.addEventListener("input", e => { if (e.target.id === "sq"){ UI.sq = e.target.value; searchRun(); } });
Object.assign(ACT, {
  search: () => searchSheet(),
  searchCat: v => { UI.scat = v; $$("#scats button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v)); searchRun(); },
  searchOpen: v => { const i = v.indexOf("|"), act = v.slice(0, i), arg = v.slice(i + 1); closeSheet(); ACT[act]?.(arg); },
  searchGo: v => go(v),
  searchDate: v => { UI.calSel = v; const d = parseD(v); UI.calMonth = iso(new Date(d.getFullYear(), d.getMonth(), 1)); UI.sub.agenda = "mois"; go("agenda"); },
  searchDay: v => { const [cid, ds] = v.split("|"); S.active = cid; go("kid"); dayDetail(ds); },
  searchKidTab: v => { const [cid, tab] = v.split("|"); if (cid) S.active = cid; UI.kidTab = tab; go("kid"); },
});
