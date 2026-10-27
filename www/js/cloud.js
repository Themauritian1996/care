/* =========================================================================
   TRIBE — comptes et partage (Firebase). Chargé seulement si www/firebase-config.js est rempli.
   Modèle : families/{fid} (+ kids, logs, events, memories, photos, tasks, completions, rewards,
   redemptions, avail, messages, reviews), groups/{gid} (+ events, messages), codes/{CODE}, users/{uid}.
   ========================================================================= */
const V = "11.10.0", B = `https://www.gstatic.com/firebasejs/${V}/`;
const cfg = window.TRIBE_FIREBASE;
const C = window.Cloud;
if (cfg && cfg.apiKey){
  const [{initializeApp}, A, F] = await Promise.all([import(B+"firebase-app.js"), import(B+"firebase-auth.js"), import(B+"firebase-firestore.js")]);
  const app = initializeApp(cfg);
  const auth = A.initializeAuth(app, {persistence:[A.indexedDBLocalPersistence, A.browserLocalPersistence], popupRedirectResolver:A.browserPopupRedirectResolver});
  let db;
  try { db = F.initializeFirestore(app, {localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})}); } catch(e){ db = F.getFirestore(app); }
  const {doc, collection, setDoc, deleteDoc, getDoc, updateDoc, addDoc, onSnapshot, query, where, orderBy, limitToLast, deleteField, arrayUnion, serverTimestamp, writeBatch} = F;
  const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
  const NativeAuth = Native.isApp ? window.Capacitor?.Plugins?.FirebaseAuthentication : null;
  let fid = null, role = "parent", purging = false, unsubs = [], groupUnsubs = {}, last = {}, pushing = false, pushAgain = false;
  C.configured = true;

  const skipKey = "tribe.skipLogin";
  C.mustLogin = () => C.ready && !C.user && !(() => { try { return localStorage.getItem(skipKey); } catch(e){ return null; } })();
  C.skip = () => { try { localStorage.setItem(skipKey, "1"); } catch(e){} render(); };
  C.showLogin = () => { try { localStorage.removeItem(skipKey); } catch(e){} render(); };
  C.canDrive = () => !!C.user && C.user.providerData?.some(p => p.providerId === "google.com");

  /* ---------- connexion ---------- */
  C.googleLogin = async () => {
    try {
      if (Native.isApp && !NativeAuth){ toast(T("Connexion Google pas encore activée dans l'APK : utilisez votre courriel pour l'instant")); return; }
      if (NativeAuth){
        const r = await NativeAuth.signInWithGoogle({scopes:[DRIVE_SCOPE], useCredentialManager:false});
        const cred = A.GoogleAuthProvider.credential(r.credential?.idToken, r.credential?.accessToken);
        C.googleToken = r.credential?.accessToken || null; C.tokenAt = Date.now();
        await A.signInWithCredential(auth, cred);
      } else {
        const p = new A.GoogleAuthProvider(); p.addScope(DRIVE_SCOPE); p.setCustomParameters({prompt:"select_account"});
        const r = await A.signInWithPopup(auth, p);
        C.googleToken = A.GoogleAuthProvider.credentialFromResult(r)?.accessToken || null; C.tokenAt = Date.now();
      }
    } catch(e){ toast(authError(e)); }
  };
  C.emailAuth = async (email, pass, mode) => {
    try { if (mode === "signup") await A.createUserWithEmailAndPassword(auth, email, pass); else await A.signInWithEmailAndPassword(auth, email, pass); }
    catch(e){ toast(authError(e)); }
  };
  C.resetPass = async email => { try { await A.sendPasswordResetEmail(auth, email); toast(T("Courriel de réinitialisation envoyé")); } catch(e){ toast(authError(e)); } };
  C.logout = async () => { unsubs.forEach(u => u()); unsubs = []; Object.values(groupUnsubs).flat().forEach(u => u()); groupUnsubs = {}; fid = null; last = {}; try { if (NativeAuth) await NativeAuth.signOut(); } catch(e){} await A.signOut(auth); };
  function authError(e){
    const c = e?.code || "";
    if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return T("Courriel ou mot de passe incorrect");
    if (c.includes("email-already-in-use")) return T("Ce courriel a déjà un compte : connectez-vous");
    if (c.includes("weak-password")) return T("Mot de passe trop court (6 caractères ou plus)");
    if (c.includes("popup-closed") || c.includes("cancel")) return T("Connexion annulée");
    if (c.includes("unauthorized-domain")) return T("Ce site n'est pas autorisé dans Firebase (Domaines autorisés)");
    return (e?.message || String(e)).replace("Firebase: ", "");
  }

  /* ---------- état de connexion ---------- */
  A.onAuthStateChanged(auth, async user => {
    C.user = user; C.ready = true;
    if (!user){ render(); return; }
    try {
      const uref = doc(db, "users", user.uid), us = await getDoc(uref);
      fid = us.exists() ? us.data().fid : null;
      if (fid){ const fs = await getDoc(doc(db, "families", fid)).catch(() => null); if (!fs?.exists?.() || !(fs.data().memberIds||[]).includes(user.uid)) fid = null; }
      if (!fid) fid = await createFamilyFromLocal(user);
      await setDoc(uref, {fid, email:user.email||"", name:user.displayName||me()?.name||"", at:serverTimestamp()}, {merge:true});
      subscribe();
      subscribeGroups();
    } catch(e){ console.error(e); toast(T("Synchronisation impossible pour l'instant : {e}",{e:e.message})); }
    render();
  });

  async function createFamilyFromLocal(user){
    const ref = doc(collection(db, "families"));
    const meM = me(); meM.uid = user.uid; meM.email = user.email || ""; if (!meM.name || meM.name === T("Moi")) meM.name = user.displayName || (user.email||"").split("@")[0];
    if (isDemoData(S)){ S = freshFrom(S); normalize(); }
    await setDoc(ref, {name:S.family.name||"", memberIds:[user.uid], roles:{[user.uid]:"parent"}, members:membersObj(), shared:sharedSettings(), at:serverTimestamp()});
    fid = ref.id; last = {}; await C.push(true);
    return ref.id;
  }
  const rolesObj = () => Object.fromEntries(S.family.members.filter(m => m.uid).map(m => [m.uid, m.role === "enfant" ? "enfant" : "parent"]));
  const membersObj = () => Object.fromEntries(S.family.members.map(m => [m.id, m]));
  const sharedSettings = () => ({features:S.settings.features, parental:{allow:S.settings.parental.allow, pin:S.settings.parental.pin}, appName:S.settings.appName, driveKeeper:S.settings.driveKeeper||null, threads:S.settings.threads||[]});

  /* ---------- envoi des changements (diff par document) ---------- */
  const J = o => JSON.stringify(o);
  const COLS = ["events","memories","tasks","completions","rewards","redemptions","reviews","kidevents","stories","recipes"];
  C.push = async (force) => {
    if (!fid || !C.user) return;
    if (pushing){ pushAgain = true; return; }
    pushing = true;
    try {
      const batch = []; const isParent = role === "parent";
      const put = (path, data, merge) => { const k = J(data); if (!force && last[path] === k) return; last[path] = k; batch.push({path, data, merge}); };
      if (isParent){
        put(`families/${fid}`, {name:S.family.name||"", members:membersObj(), shared:sharedSettings(), roles:rolesObj(), photo:S.family.photo||null}, "fields");
        S.children.forEach(c => { const {logs, ...rest} = c; put(`families/${fid}/kids/${c.id}`, rest); });
        Object.keys(last).filter(p => p.startsWith(`families/${fid}/kids/`) && !S.children.some(c => p.endsWith("/"+c.id))).forEach(p => { delete last[p]; batch.push({path:p, del:true}); });
        COLS.forEach(col => { (S[col]||[]).forEach(x => put(`families/${fid}/${col}/${x.id}`, x)); Object.keys(last).filter(p => p.startsWith(`families/${fid}/${col}/`) && !(S[col]||[]).some(x => p.endsWith("/"+x.id))).forEach(p => { delete last[p]; batch.push({path:p, del:true}); }); });
      } else {
        ["completions","redemptions"].forEach(col => (S[col]||[]).filter(x => x.memberId === S.me).forEach(x => put(`families/${fid}/${col}/${x.id}`, x)));
        (S.kidevents||[]).filter(x => x.by === S.me).forEach(x => put(`families/${fid}/kidevents/${x.id}`, x));
      }
      // journal : un document par enfant et par mois, fusion champ par champ
      S.children.forEach(c => {
        const months = {}; (c.logs||[]).forEach(l => { const k = dayKey(l.t).slice(0,7); (months[k] = months[k] || {})[l.id] = l; });
        const prevKeys = Object.keys(last).filter(p => p.startsWith(`families/${fid}/logs/${c.id}_`));
        Object.entries(months).forEach(([mo, items]) => {
          const path = `families/${fid}/logs/${c.id}_${mo}`, k = J(items);
          if (!force && last[path] === k) return;
          const prev = last[path] ? JSON.parse(last[path]) : {}; const upd = {};
          Object.entries(items).forEach(([id, l]) => { if (force || J(prev[id]) !== J(l)) upd[id] = l; });
          Object.keys(prev).filter(id => !items[id]).forEach(id => upd[id] = deleteField());
          last[path] = k; batch.push({path, data:{cid:c.id, month:mo, items:upd}, merge:true});
        });
        prevKeys.filter(p => !months[p.split("_").pop()]).forEach(p => { const prev = JSON.parse(last[p]); const upd = {}; Object.keys(prev).forEach(id => upd[id] = deleteField()); last[p] = "{}"; batch.push({path:p, data:{items:upd}, merge:true}); });
      });
      // disponibilités (chacun la sienne ; les parents celles de tous)
      Object.entries(S.avail||{}).forEach(([mid, map]) => { if (isParent || mid === S.me) put(`families/${fid}/avail/${mid}`, {map}); });
      // photos (image comprise, réduite)
      for (const p of S.photos){ const path = `families/${fid}/photos/${p.id}`, k = J(p); if (!force && last[path] === k) continue; if (!isParent && p.by !== S.me) continue; let data = await PhotoDB.get(p.id, true); if (!data) continue; if (data.length > 900000) data = await shrinkImage(data, 1000, 0.7); last[path] = k; batch.push({path, data:{...p, data}}); }
      // images des souvenirs, spéciaux et histoires : même collection, marquées « blob » (pas dans l'album)
      const blobIds = new Set();
      S.memories.forEach(m => { if (isParent || m.by === S.me) [m.photoId, ...(m.photoIds||[])].filter(Boolean).forEach(id => blobIds.add(id)); });
      (S.stories||[]).forEach(st => (st.chapters||[]).forEach(ch => ch.img && isParent && blobIds.add(ch.img)));
      for (const id of blobIds){ const path = `families/${fid}/photos/${id}`; let data = await PhotoDB.get(id, true); if (!data) continue; if (data.length > 900000) data = await shrinkImage(data, 1000, 0.7); if (data.length > 900000) data = await shrinkImage(data, 760, 0.6); if (data.length > 1000000) continue; const k = J({id, blob:true, h:data.length + data.slice(-24)}); if (!force && last[path] === k) continue; last[path] = k; batch.push({path, data:{id, blob:true, data}}); }
      Object.keys(last).filter(p => p.startsWith(`families/${fid}/photos/`) && !S.photos.some(x => p.endsWith("/"+x.id)) && !blobIds.has(p.split("/").pop()) && !(last[p]||"").includes('"blob":true')).forEach(p => { delete last[p]; batch.push({path:p, del:true}); });
      // lots limités en nombre ET en poids (un commit dépasse vite 10 Mo avec des photos)
      const chunks = []; let cur = [], w = 0;
      for (const b of batch){ const sz = b.del ? 100 : (b.data?.data && typeof b.data.data === "string" ? b.data.data.length : J(b.data||{}).length) + 200; if (cur.length && (cur.length >= 400 || w + sz > 3e6)){ chunks.push(cur); cur = []; w = 0; } cur.push(b); w += sz; }
      if (cur.length) chunks.push(cur);
      let done = 0;
      try {
        for (const ch of chunks){
          const wb = writeBatch(db);
          ch.forEach(b => { const r = doc(db, b.path); if (b.del) wb.delete(r); else wb.set(r, b.data, b.merge === "fields" ? {mergeFields:Object.keys(b.data)} : b.merge ? {merge:true} : undefined); });
          await wb.commit(); done++;
        }
      } catch(err){ // ce qui n'est pas parti sera renvoyé à la prochaine synchro
        chunks.slice(done).flat().forEach(b => { delete last[b.path]; }); throw err;
      }
      C.status = {ok:true, at:Date.now(), n:batch.length}; C._retry = 0;
    } catch(e){ console.error("push", e); C.status = {ok:false, at:Date.now(), err:e.code || e.message}; if (String(e.code||"").includes("permission")) toast(T("Certaines modifications demandent un compte parent")); else if ((C._retry = (C._retry||0) + 1) <= 3) setTimeout(() => C.push(), 20000 * C._retry); }
    pushing = false;
    if (pushAgain){ pushAgain = false; C.push(); }
  };

  /* ---------- réception (temps réel) ---------- */
  const applyRemote = () => { try { fixDates(); } catch(e){} try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} softRender(); };
  function subscribe(){
    unsubs.forEach(u => u()); unsubs = [];
    const fam = doc(db, "families", fid);
    unsubs.push(onSnapshot(fam, s => {
      const d = s.data(); if (!d) return;
      role = d.roles?.[C.user.uid] || "parent";
      S.family.name = d.name || ""; S.family.photo = d.photo || null; const mems = Object.values(d.members || {});
      if (mems.length) S.family.members = mems;
      const mine = S.family.members.find(m => m.uid === C.user.uid); if (mine) S.me = mine.id;
      if (d.shared){ S.settings.features = {...S.settings.features, ...d.shared.features}; if (d.shared.parental){ S.settings.parental.allow = {...S.settings.parental.allow, ...d.shared.parental.allow}; if (d.shared.parental.pin) S.settings.parental.pin = d.shared.parental.pin; } if (d.shared.appName && !S.settings.appNameLocal) S.settings.appName = d.shared.appName; if ("driveKeeper" in d.shared) S.settings.driveKeeper = d.shared.driveKeeper; if (Array.isArray(d.shared.threads)) S.settings.threads = d.shared.threads; }
      if (role === "enfant" && mine) mine.role = "enfant";
      last[`families/${fid}`] = J({name:S.family.name||"", members:membersObj(), shared:sharedSettings(), roles:rolesObj(), photo:S.family.photo||null});
      applyRemote();
    }));
    unsubs.push(onSnapshot(collection(fam, "kids"), qs => {
      const kids = qs.docs.map(d => d.data());
      kids.forEach(k => { const local = kidById(k.id); last[`families/${fid}/kids/${k.id}`] = J(k); if (local){ const logs = local.logs; Object.keys(local).forEach(x => delete local[x]); Object.assign(local, k, {logs}); } else S.children.push({...blankKid(), ...k, logs:[]}); });
      S.children = S.children.filter(c => kids.some(k => k.id === c.id)); if (!S.children.some(c => c.id === S.active)) S.active = S.children[0]?.id || null;
      normalize(); applyRemote();
      if (role === "parent" && isDemoData(S) && !purging){ purging = true; setTimeout(async () => { const mine = me(); S = freshFrom(S); if (mine?.uid){ S.family.members = [{...mine, name: mine.name === "Alex" ? (C.user.displayName || T("Moi")) : mine.name}]; S.me = mine.id; } normalize(); await C.push(); purging = false; render(); toast(T("Données d'exemple retirées : votre espace est prêt")); }, 2500); }
    }));
    unsubs.push(onSnapshot(collection(fam, "logs"), qs => {
      qs.docChanges().forEach(ch => {
        const d = ch.doc.data(), c = kidById(d.cid); if (!c) return;
        const items = d.items || {}; const mo = d.month || ch.doc.id.split("_").pop();
        c.logs = (c.logs||[]).filter(l => dayKey(l.t).slice(0,7) !== mo).concat(Object.values(items));
        last[`families/${fid}/logs/${ch.doc.id}`] = J(items);
      });
      applyRemote();
    }));
    COLS.forEach(col => unsubs.push(onSnapshot(collection(fam, col), qs => {
      S[col] = qs.docs.map(d => d.data()); S[col].forEach(x => last[`families/${fid}/${col}/${x.id}`] = J(x));
      applyRemote();
    })));
    unsubs.push(onSnapshot(collection(fam, "avail"), qs => { S.avail = S.avail || {}; qs.docs.forEach(d => { S.avail[d.id] = d.data().map || {}; last[`families/${fid}/avail/${d.id}`] = J({map:S.avail[d.id]}); }); applyRemote(); }));
    unsubs.push(onSnapshot(collection(fam, "photos"), async qs => {
      for (const ch of qs.docChanges()){
        const d = ch.doc.data();
        if (ch.type === "removed"){ if (!d.blob && d.date) S.photos = S.photos.filter(p => p.id !== d.id); continue; }
        const {data, ...meta} = d; if (data) await PhotoDB.put(d.id, data);
        if (d.blob || !d.date){ if (data) last[`families/${fid}/photos/${d.id}`] = J({id:d.id, blob:true, h:data.length + data.slice(-24)}); continue; }
        const i = S.photos.findIndex(p => p.id === d.id); if (i >= 0) S.photos[i] = meta; else S.photos.push(meta);
        last[`families/${fid}/photos/${d.id}`] = J(meta);
      }
      applyRemote();
    }));
    let first = true;
    unsubs.push(onSnapshot(query(collection(fam, "messages"), orderBy("at"), limitToLast(300)), qs => {
      const before = S.messages.length; S.messages = qs.docs.map(d => d.data());
      if (!first && S.messages.length > before){ const m = S.messages[S.messages.length-1]; if (m.uid !== C.user.uid && threadVisible("family", m.th)) chatNotify(m, T("Famille")); }
      first = false; applyRemote();
    }));
  }
  const chatNotify = (m, where) => {
    const mentioned = (m.mentions||[]).includes(C.user.uid) || (m.mentions||[]).includes("all");
    if (mentioned){ Native.notifyNow(T("{n} vous a mentionné · {w}",{n:m.name||"", w:where}), m.text, {go:"tribu"}, true); if (!document.hidden) toast(T("{n} vous a mentionné",{n:m.name||""})); }
    else if (S.settings.notif.chat !== false) Native.notifyNow(`${where} · ${m.name||""}`, m.text, {go:"tribu"});
  };
  C.send = async (channel, text, th) => {
    const people = mentionables(channel), low = text.toLowerCase();
    const mentions = /@(tous|all|everyone)\b/i.test(text) ? ["all"] : people.filter(p => p.uid && low.includes("@" + p.name.toLowerCase().split(" ")[0])).map(p => p.uid);
    const m = {text, uid:C.user.uid, name:me()?.name || C.user.displayName || "", at:Date.now(), mentions}; if (th && th !== "main") m.th = th;
    if (channel === "family") await addDoc(collection(db, "families", fid, "messages"), m);
    else await addDoc(collection(db, "groups", channel, "messages"), m);
  };

  /* ---------- invitations ---------- */
  const newCode = () => Array.from({length:6}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
  C.invite = async (roleWanted, mid = null) => { const code = newCode(); await setDoc(doc(db, "codes", code), {kind:"family", id:fid, role:roleWanted, by:C.user.uid, at:Date.now(), ...(mid ? {mid} : {})}); return code; };
  C.familyId = () => fid;
  C.syncLine = () => !C.user || !fid ? "" : !C.status ? "" : C.status.ok ? `${T("Synchronisé")} · ${new Date(C.status.at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}` : `${T("Synchro en attente")} · ${C.status.err}`;
  /* renvoie tout, puis récupère les images manquantes */
  C.resync = async () => {
    phWait.clear(); await C.push(true);
    const ids = new Set(); S.photos.forEach(p => ids.add(p.id)); S.memories.forEach(m => [m.photoId, ...(m.photoIds||[])].filter(Boolean).forEach(i => ids.add(i)));
    let got = 0; for (const id of ids){ if (!(await PhotoDB.get(id, true))){ if (await C.fetchPhoto(id)) got++; } }
    softRender(); return got;
  };
  /* va chercher une image absente de cet appareil (souvenir d'un autre membre arrivé avant sa photo) */
  const phWait = new Map();
  C.fetchPhoto = async id => {
    if (!fid || !C.user || !id) return null;
    const miss = phWait.get(id); if (miss && typeof miss === "number" && Date.now() - miss < 45000) return null; if (miss && miss.then) return miss;
    const pr = getDoc(doc(db, "families", fid, "photos", id)).then(async s => { const d = s.exists() ? s.data().data : null; if (d){ await PhotoDB.put(id, d); phWait.delete(id); return d; } phWait.set(id, Date.now()); return null; }).catch(() => { phWait.set(id, Date.now()); return null; });
    phWait.set(id, pr); return pr;
  };
  C.joinFamily = async code => {
    const cs = await getDoc(doc(db, "codes", code.toUpperCase())); if (!cs.exists() || cs.data().kind !== "family") throw new Error(T("Code invalide"));
    const {id, role:r, mid:target} = cs.data(), mid = target || "m_" + C.user.uid.slice(0,10), rr = r === "enfant" ? "enfant" : "parent";
    // un code lié à un profil existant (ex. l'enfant qui reçoit son propre accès) : on relie ce compte à ce profil
    const memberData = target ? {[`members.${mid}.uid`]:C.user.uid, [`members.${mid}.email`]:C.user.email||""}
      : {[`members.${mid}`]:{id:mid, uid:C.user.uid, name:C.user.displayName || (C.user.email||"").split("@")[0], email:C.user.email||"", role:rr, color:"sky", avatar:{kind:"auto"}}};
    await updateDoc(doc(db, "families", id), {memberIds:arrayUnion(C.user.uid), [`roles.${C.user.uid}`]:rr, ...memberData, joinCode:code.toUpperCase()});
    try { localStorage.removeItem("tribe.join"); } catch(e){}
    await setDoc(doc(db, "users", C.user.uid), {fid:id}, {merge:true});
    fid = id; last = {}; const keep = {settings:S.settings}; S = {...blankState(), ...keep, me:mid}; S.family.members = [];
    subscribe();
  };

  /* ---------- groupes d'amis ---------- */
  function subscribeGroups(){
    unsubs.push(onSnapshot(query(collection(db, "groups"), where("memberIds", "array-contains", C.user.uid)), qs => {
      const ids = qs.docs.map(d => d.id);
      S.groups = qs.docs.map(d => ({...(S.groups||[]).find(g => g.id === d.id), ...d.data(), id:d.id}));
      ids.forEach(id => { if (groupUnsubs[id]) return; groupUnsubs[id] = [
        onSnapshot(collection(db, "groups", id, "events"), q2 => { const g = S.groups.find(x => x.id === id); if (g){ g.events = q2.docs.map(d => ({...d.data(), id:d.id})); softRender(); } }),
        onSnapshot(query(collection(db, "groups", id, "messages"), orderBy("at"), limitToLast(200)), q2 => { const g = S.groups.find(x => x.id === id); if (g){ const before = (g.messages||[]).length; g.messages = q2.docs.map(d => d.data()); if (before && g.messages.length > before){ const m = g.messages[g.messages.length-1]; if (m.uid !== C.user.uid && threadVisible(id, m.th)) chatNotify(m, g.name); } softRender(); } }),
      ]; });
      Object.keys(groupUnsubs).filter(id => !ids.includes(id)).forEach(id => { groupUnsubs[id].forEach(u => u()); delete groupUnsubs[id]; });
      softRender();
    }));
  }
  const myName = () => me()?.name || C.user.displayName || (C.user.email||"").split("@")[0];
  C.groupCreate = async name => { const ref = doc(collection(db, "groups")); await setDoc(ref, {name, memberIds:[C.user.uid], members:{[C.user.uid]:{name:myName()}}, avail:{}, at:Date.now(), owner:C.user.uid}); return ref.id; };
  C.groupLeave = async gid => { await updateDoc(doc(db, "groups", gid), {memberIds:F.arrayRemove(C.user.uid), [`members.${C.user.uid}`]:deleteField(), [`avail.${C.user.uid}`]:deleteField()}); S.groups = S.groups.filter(g => g.id !== gid); };
  /* supprimer pour tout le monde : le groupe est vidé et marqué supprimé (il disparaît chez chacun) */
  C.groupDelete = async gid => { await updateDoc(doc(db, "groups", gid), {memberIds:[], deleted:true, deletedBy:C.user.uid, joinCode:deleteField()}); S.groups = S.groups.filter(g => g.id !== gid); };
  C.groupInvite = async gid => { const code = newCode(); await setDoc(doc(db, "codes", code), {kind:"group", id:gid, by:C.user.uid, at:Date.now()}); return code; };
  C.groupJoin = async code => {
    const cs = await getDoc(doc(db, "codes", code.toUpperCase())); if (!cs.exists() || cs.data().kind !== "group") throw new Error(T("Code invalide"));
    await updateDoc(doc(db, "groups", cs.data().id), {memberIds:arrayUnion(C.user.uid), [`members.${C.user.uid}`]:{name:myName()}, joinCode:code.toUpperCase()});
  };
  C.groupUpdate = async (gid, data) => { await updateDoc(doc(db, "groups", gid), data); };
  C.groupEventDel = async (gid, eid) => { await deleteDoc(doc(db, "groups", gid, "events", eid)); };
  C.groupEvent = async (gid, e) => { await setDoc(doc(db, "groups", gid, "events", e.id), e); };
  C.groupRsvp = async (gid, eid, ok) => { await updateDoc(doc(db, "groups", gid, "events", eid), {[`rsvp.${C.user.uid}`]:{ok, name:myName()}}); };
  C.groupPhoto = async (gid, photo) => { await updateDoc(doc(db, "groups", gid), {photo}); };
  C.groupAvail = async (gid, map) => { await updateDoc(doc(db, "groups", gid), {[`avail.${C.user.uid}`]:map}); };

  /* ---------- Google Drive (souvenirs) ---------- */
  async function driveToken(){
    if (C.googleToken && Date.now() - C.tokenAt < 50*60e3) return C.googleToken;
    if (NativeAuth){ const r = await NativeAuth.signInWithGoogle({scopes:[DRIVE_SCOPE], useCredentialManager:false}); C.googleToken = r.credential?.accessToken; C.tokenAt = Date.now();
      if (!C.googleToken) throw new Error(T("Google n'a pas donné l'accès à Drive. Réessayez et acceptez l'autorisation « Google Drive »."));
      return C.googleToken; }
    const p = new A.GoogleAuthProvider(); p.addScope(DRIVE_SCOPE);
    const r = await A.reauthenticateWithPopup(auth.currentUser, p).catch(() => A.linkWithPopup(auth.currentUser, p));
    C.googleToken = A.GoogleAuthProvider.credentialFromResult(r)?.accessToken; C.tokenAt = Date.now(); return C.googleToken;
  }
  async function driveFolder(tok){
    const name = DRIVE_ROOT;
    if (S.settings.driveRoot !== name){ S.settings.driveFolder = null; S.settings.driveDirs = {}; S.settings.driveRoot = name; }
    if (S.settings.driveFolder) return S.settings.driveFolder;
    const q = encodeURIComponent(`name='${name.replace(/'/g,"\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const l = await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {headers:{Authorization:"Bearer "+tok}})).json();
    let id = l.files?.[0]?.id;
    if (!id){ const r = await (await fetch("https://www.googleapis.com/drive/v3/files", {method:"POST", headers:{Authorization:"Bearer "+tok, "Content-Type":"application/json"}, body:JSON.stringify({name, mimeType:"application/vnd.google-apps.folder"})})).json(); id = r.id; }
    S.settings.driveFolder = id; save(); return id;
  }
  /* sous-dossiers : catégorie / sous-catégorie / date (créés au besoin, mémorisés) */
  async function driveSub(tok, parent, name){
    const dirs = S.settings.driveDirs = S.settings.driveDirs || {}, key = parent + "/" + name; if (dirs[key]) return dirs[key];
    const q = encodeURIComponent(`name='${name.replace(/\\/g,"\\\\").replace(/'/g,"\\'")}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const l = await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {headers:{Authorization:"Bearer "+tok}})).json();
    let id = l.files?.[0]?.id;
    if (!id){ const r = await (await fetch("https://www.googleapis.com/drive/v3/files", {method:"POST", headers:{Authorization:"Bearer "+tok, "Content-Type":"application/json"}, body:JSON.stringify({name, mimeType:"application/vnd.google-apps.folder", parents:[parent]})})).json(); id = r.id; }
    if (!id) throw new Error("Drive"); dirs[key] = id; save(); return id;
  }
  /* partager le dossier « Tribe » avec un autre membre (même dossier pour les deux parents) */
  C.driveShare = async email => { const tok = await driveToken(), folder = await driveFolder(tok);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${folder}/permissions?sendNotificationEmail=true`, {method:"POST", headers:{Authorization:"Bearer "+tok, "Content-Type":"application/json"}, body:JSON.stringify({role:"writer", type:"user", emailAddress:email})});
    if (!r.ok){ const d = await r.json().catch(() => ({})); throw new Error(d.error?.message || `Drive ${r.status}`); } return folder; };
  C.driveReady = () => !!C.googleToken && Date.now() - C.tokenAt < 50*60e3;
  C.driveDelete = async id => { if (!id) return; const tok = await driveToken();
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`, {method:"DELETE", headers:{Authorization:"Bearer "+tok}});
    if (!r.ok && r.status !== 404 && r.status !== 403){ if (r.status === 401) C.googleToken = null; throw new Error(`Drive ${r.status}`); } };
  C.driveUpload = async (name, mime, base64, description = "", path = [], asMime = null) => {
    const tok = await driveToken(); if (!tok) throw new Error(T("Connexion Google requise"));
    let folder = await driveFolder(tok); for (const p of path.filter(Boolean)) folder = await driveSub(tok, folder, String(p).replace(/[\/]/g, "-").slice(0, 100));
    const bnd = "tribe" + Date.now();
    const meta = {name, parents:[folder], description}; if (asMime) meta.mimeType = asMime;
    const body = `--${bnd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${bnd}\r\nContent-Type: ${mime}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64}\r\n--${bnd}--`;
    const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {method:"POST", headers:{Authorization:"Bearer "+tok, "Content-Type":`multipart/related; boundary=${bnd}`}, body});
    const d = await r.json();
    if (!r.ok){ if (r.status === 401) C.googleToken = null; if (r.status === 404 && !path.retried){ S.settings.driveFolder = null; S.settings.driveDirs = {}; save(); path.retried = true; return C.driveUpload(name, mime, base64, description, path, asMime); }
      const msg = d.error?.message || `Drive ${r.status}`; S.settings.driveErr = /has not been used|disabled|accessNotConfigured/i.test(msg) ? T("L'API Google Drive n'est pas activée dans le projet Firebase. Ouvrez console.cloud.google.com/apis/library/drive.googleapis.com?project=tribe-26d85 et touchez « Activer ».") : msg; save(); throw new Error(S.settings.driveErr); }
    if (S.settings.driveErr){ S.settings.driveErr = null; save(); }
    return d;
  };
  render();
} else {
  C.configured = false;
}
