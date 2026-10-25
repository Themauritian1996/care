/* =========================================================================
   TRIBE — copie automatique dans Google Drive
   Dossier « Tribe » / Photos du jour / AAAA-MM
                    / Moments / date titre
                    / Spéciaux / type / date titre
                    / Histoires / date titre
   Ajout : envoyé ; modification : l'ancienne copie est remplacée ;
   suppression : retirée du Drive. Les lettres scellées restent privées.
   ========================================================================= */
const DRIVE_ROOT = "Tribe";
const driveOn = () => Cloud.canDrive?.() && S.settings.driveAuto !== false;
const b64txt = t => btoa(unescape(encodeURIComponent(t)));
function driveQ(kind, id){ if (!driveOn()) return; S.driveQueue = (S.driveQueue||[]).filter(x => !(x.op === "up" && x.kind === kind && x.id === id)); S.driveQueue.push({op:"up", kind, id}); save(); driveFlush(); }
function driveQDel(ids){ ids = (ids||[]).filter(Boolean); if (!ids.length || !Cloud.canDrive?.()) return; S.driveQueue = S.driveQueue||[]; ids.forEach(f => S.driveQueue.push({op:"del", f})); save(); driveFlush(); }
const drivePending = () => (S.driveQueue||[]).length;
function memDrivePath(m){
  const sp = SPECIAL.find(x => x.k === m.kind), dir = `${m.date} ${m.title||""}`.trim().slice(0, 80);
  return sp ? ["Spéciaux", sp.l, dir] : ["story","yearbook"].includes(m.kind) ? ["Histoires", dir] : ["Moments", dir]; // noms fixes : pas de doublons si la langue change
}
async function driveUpOne(x){
  if (x.kind === "photo"){
    const p = S.photos.find(y => y.id === x.id); if (!p) return; const d = await PhotoDB.get(p.id); if (!d) return;
    for (const f of p.driveIds||[]) await Cloud.driveDelete(f).catch(() => {});
    const kids = (p.kidIds||[]).map(id => kidById(id)?.name).filter(Boolean).join(", ");
    const r = await Cloud.driveUpload(`${p.date} ${p.caption||T("Photo du jour")}.jpg`.replace(/[\/\\]/g, "-").slice(0, 90), "image/jpeg", d.split(",")[1], [T(PHOTO_CATS.find(c => c.id === p.cat)?.l||""), kids, p.caption].filter(Boolean).join(" · "), ["Photos du jour", p.date.slice(0, 7)]);
    p.driveIds = [r.id]; p.drive = true;
  } else {
    const m = S.memories.find(y => y.id === x.id); if (!m || lockedMem(m)) return;
    for (const f of m.driveIds||[]) await Cloud.driveDelete(f).catch(() => {});
    const path = memDrivePath(m), kids = (m.kidIds||[]).map(id => kidById(id)?.name).filter(Boolean).join(", ");
    const body = `${m.text||""}${m.answers?Object.entries(m.answers).filter(([,a]) => a).map(([q,a]) => `\n\n${T(q)}\n${a}`).join(""):""}`;
    const txt = `${m.title}\n${fmtD(m.date,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}${kids?`\n${kids}`:""}\n\n${body}`;
    const ids = [(await Cloud.driveUpload(`${(m.title||T("Souvenir")).replace(/[\/\\]/g, "-").slice(0, 70)}.txt`, "text/plain", b64txt(txt), m.title, path)).id];
    for (const pid of [m.photoId, ...(m.photoIds||[])].filter(Boolean)){ const d = await PhotoDB.get(pid); if (d) ids.push((await Cloud.driveUpload(`${T("Photo")} ${ids.length}.jpg`, "image/jpeg", d.split(",")[1], m.title, path)).id); }
    m.driveIds = ids.filter(Boolean); m.drive = true;
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
/* tout envoyer ce qui n'a jamais été copié */
function driveBackfill(){
  S.photos.filter(p => !p.driveIds?.length).forEach(p => (S.driveQueue = S.driveQueue||[]).push({op:"up", kind:"photo", id:p.id}));
  S.memories.filter(m => !m.driveIds?.length && !lockedMem(m)).forEach(m => (S.driveQueue = S.driveQueue||[]).push({op:"up", kind:"mem", id:m.id}));
  save(); driveFlush(true);
}
const driveBanner = () => Cloud.canDrive?.() && drivePending() && !driveBusy ? `<div class="banner info">${icon("drive")}<div class="grow small">${T("{n} élément(s) à copier dans Google Drive (dossier « Tribe »).",{n:drivePending()})}</div><button class="btn sm kid" data-act="driveSync">${T("Synchroniser")}</button></div>` : "";
Object.assign(ACT, {
  driveSync: () => driveFlush(true),
  driveAll: () => driveBackfill(),
});
Object.assign(CHANGE, { driveAuto: t => { S.settings.driveAuto = t.checked; save(); toast(t.checked ? T("Copie automatique activée") : T("Copie automatique désactivée")); if (t.checked) driveFlush(); } });
