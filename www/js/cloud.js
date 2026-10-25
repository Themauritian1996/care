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
  let fid = null, role = "parent", unsubs = [], groupUnsubs = {}, last = {}, pushing = false, pushAgain = false;
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
        const r = await NativeAuth.signInWithGoogle({scopes:[DRIVE_SCOPE]});
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
    if (S.demo){ S.demo = false; }
    await setDoc(ref, {name:S.family.name||"", memberIds:[user.uid], roles:{[user.uid]:"parent"}, members:membersObj(), shared:sharedSettings(), at:serverTimestamp()});
    fid = ref.id; last = {}; await C.push(true);
    return ref.id;
  }
  const rolesObj = () => Object.fromEntries(S.family.members.filter(m => m.uid).map(m => [m.uid, m.role === "enfant" ? "enfant" : "parent"]));
  const membersObj = () => Object.fromEntries(S.family.members.map(m => [m.id, m]));
  const sharedSettings = () => ({features:S.settings.features, parental:{allow:S.settings.parental.allow, pin:S.settings.parental.pin}, appName:S.settings.appName});

  /* ---------- envoi des changements (diff par document) ---------- */
  const J = o => JSON.stringify(o);
  const COLS = ["events","memories","tasks","completions","rewards","redemptions","reviews"];
  C.push = async (force) => {
    if (!fid || !C.user) return;
    if (pushing){ pushAgain = true; return; }
    pushing = true;
    try {
      const batch = []; const isParent = role === "parent";
      const put = (path, data, merge) => { const k = J(data); if (!force && last[path] === k) return; last[path] = k; batch.push({path, data, merge}); };
      if (isParent){
        put(`families/${fid}`, {name:S.family.name||"", members:membersObj(), shared:sharedSettings(), roles:rolesObj()}, true);
        S.children.forEach(c => { const {logs, ...rest} = c; put(`families/${fid}/kids/${c.id}`, rest); });
        Object.keys(last).filter(p => p.startsWith(`families/${fid}/kids/`) && !S.children.some(c => p.endsWith("/"+c.id))).forEach(p => { delete last[p]; batch.push({path:p, del:true}); });
        COLS.forEach(col => { (S[col]||[]).forEach(x => put(`families/${fid}/${col}/${x.id}`, x)); Object.keys(last).filter(p => p.startsWith(`families/${fid}/${col}/`) && !(S[col]||[]).some(x => p.endsWith("/"+x.id))).forEach(p => { delete last[p]; batch.push({path:p, del:true}); }); });
      } else {
        ["completions","redemptions"].forEach(col => (S[col]||[]).filter(x => x.memberId === S.me).forEach(x => put(`families/${fid}/${col}/${x.id}`, x)));
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
      for (const p of S.photos){ const path = `families/${fid}/photos/${p.id}`; if (!force && last[path]) continue; const data = await PhotoDB.get(p.id); if (!data) continue; last[path] = "1"; batch.push({path, data:{...p, data}}); }
      Object.keys(last).filter(p => p.startsWith(`families/${fid}/photos/`) && !S.photos.some(x => p.endsWith("/"+x.id))).forEach(p => { delete last[p]; batch.push({path:p, del:true}); });
      for (let i = 0; i < batch.length; i += 400){
        const wb = writeBatch(db);
        batch.slice(i, i+400).forEach(b => { const r = doc(db, b.path); if (b.del) wb.delete(r); else wb.set(r, b.data, b.merge ? {merge:true} : undefined); });
        await wb.commit();
      }
    } catch(e){ console.error("push", e); if (String(e.code||"").includes("permission")) toast(T("Certaines modifications demandent un compte parent")); }
    pushing = false;
    if (pushAgain){ pushAgain = false; C.push(); }
  };

  /* ---------- réception (temps réel) ---------- */
  const applyRemote = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} softRender(); };
  function subscribe(){
    unsubs.forEach(u => u()); unsubs = [];
    const fam = doc(db, "families", fid);
    unsubs.push(onSnapshot(fam, s => {
      const d = s.data(); if (!d) return;
      role = d.roles?.[C.user.uid] || "parent";
      S.family.name = d.name || ""; const mems = Object.values(d.members || {});
      if (mems.length) S.family.members = mems;
      const mine = S.family.members.find(m => m.uid === C.user.uid); if (mine) S.me = mine.id;
      if (d.shared){ S.settings.features = {...S.settings.features, ...d.shared.features}; if (d.shared.parental){ S.settings.parental.allow = {...S.settings.parental.allow, ...d.shared.parental.allow}; if (d.shared.parental.pin) S.settings.parental.pin = d.shared.parental.pin; } if (d.shared.appName && !S.settings.appNameLocal) S.settings.appName = d.shared.appName; }
      if (role === "enfant" && mine) mine.role = "enfant";
      last[`families/${fid}`] = J({name:S.family.name||"", members:membersObj(), shared:sharedSettings(), roles:rolesObj()});
      applyRemote();
    }));
    unsubs.push(onSnapshot(collection(fam, "kids"), qs => {
      const kids = qs.docs.map(d => d.data());
      kids.forEach(k => { const local = kidById(k.id); last[`families/${fid}/kids/${k.id}`] = J(k); if (local){ const logs = local.logs; Object.keys(local).forEach(x => delete local[x]); Object.assign(local, k, {logs}); } else S.children.push({...blankKid(), ...k, logs:[]}); });
      S.children = S.children.filter(c => kids.some(k => k.id === c.id)); if (!S.children.some(c => c.id === S.active)) S.active = S.children[0]?.id || null;
      normalize(); applyRemote();
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
        if (ch.type === "removed"){ S.photos = S.photos.filter(p => p.id !== d.id); continue; }
        const {data, ...meta} = d; if (data) await PhotoDB.put(d.id, data);
        const i = S.photos.findIndex(p => p.id === d.id); if (i >= 0) S.photos[i] = meta; else S.photos.push(meta);
        last[`families/${fid}/photos/${d.id}`] = "1";
      }
      applyRemote();
    }));
    let first = true;
    unsubs.push(onSnapshot(query(collection(fam, "messages"), orderBy("at"), limitToLast(300)), qs => {
      const before = S.messages.length; S.messages = qs.docs.map(d => d.data());
      if (!first && S.messages.length > before){ const m = S.messages[S.messages.length-1]; if (m.uid !== C.user.uid) Native.notifyNow(m.name || appName(), m.text); }
      first = false; applyRemote();
    }));
  }
  C.send = async (channel, text) => {
    const m = {text, uid:C.user.uid, name:me()?.name || C.user.displayName || "", at:Date.now()};
    if (channel === "family") await addDoc(collection(db, "families", fid, "messages"), m);
    else await addDoc(collection(db, "groups", channel, "messages"), m);
  };

  /* ---------- invitations ---------- */
  const newCode = () => Array.from({length:6}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
  C.invite = async (roleWanted) => { const code = newCode(); await setDoc(doc(db, "codes", code), {kind:"family", id:fid, role:roleWanted, by:C.user.uid, at:Date.now()}); return code; };
  C.joinFamily = async code => {
    const cs = await getDoc(doc(db, "codes", code.toUpperCase())); if (!cs.exists() || cs.data().kind !== "family") throw new Error(T("Code invalide"));
    const {id, role:r} = cs.data(), mid = "m_" + C.user.uid.slice(0,10);
    await updateDoc(doc(db, "families", id), {memberIds:arrayUnion(C.user.uid), [`roles.${C.user.uid}`]: r === "enfant" ? "enfant" : "parent", [`members.${mid}`]:{id:mid, uid:C.user.uid, name:C.user.displayName || (C.user.email||"").split("@")[0], email:C.user.email||"", role:r === "enfant" ? "enfant" : "parent", color:"sky", avatar:{kind:"auto"}}, joinCode:code.toUpperCase()});
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
        onSnapshot(query(collection(db, "groups", id, "messages"), orderBy("at"), limitToLast(200)), q2 => { const g = S.groups.find(x => x.id === id); if (g){ const before = (g.messages||[]).length; g.messages = q2.docs.map(d => d.data()); if (before && g.messages.length > before){ const m = g.messages[g.messages.length-1]; if (m.uid !== C.user.uid) Native.notifyNow(`${g.name} · ${m.name}`, m.text); } softRender(); } }),
      ]; });
      Object.keys(groupUnsubs).filter(id => !ids.includes(id)).forEach(id => { groupUnsubs[id].forEach(u => u()); delete groupUnsubs[id]; });
      softRender();
    }));
  }
  const myName = () => me()?.name || C.user.displayName || (C.user.email||"").split("@")[0];
  C.groupCreate = async name => { const ref = doc(collection(db, "groups")); await setDoc(ref, {name, memberIds:[C.user.uid], members:{[C.user.uid]:{name:myName()}}, avail:{}, at:Date.now()}); return ref.id; };
  C.groupInvite = async gid => { const code = newCode(); await setDoc(doc(db, "codes", code), {kind:"group", id:gid, by:C.user.uid, at:Date.now()}); return code; };
  C.groupJoin = async code => {
    const cs = await getDoc(doc(db, "codes", code.toUpperCase())); if (!cs.exists() || cs.data().kind !== "group") throw new Error(T("Code invalide"));
    await updateDoc(doc(db, "groups", cs.data().id), {memberIds:arrayUnion(C.user.uid), [`members.${C.user.uid}`]:{name:myName()}, joinCode:code.toUpperCase()});
  };
  C.groupEvent = async (gid, e) => { await setDoc(doc(db, "groups", gid, "events", e.id), e); };
  C.groupRsvp = async (gid, eid, ok) => { await updateDoc(doc(db, "groups", gid, "events", eid), {[`rsvp.${C.user.uid}`]:{ok, name:myName()}}); };
  C.groupAvail = async (gid, map) => { await updateDoc(doc(db, "groups", gid), {[`avail.${C.user.uid}`]:map}); };

  /* ---------- Google Drive (souvenirs) ---------- */
  async function driveToken(){
    if (C.googleToken && Date.now() - C.tokenAt < 50*60e3) return C.googleToken;
    if (NativeAuth){ const r = await NativeAuth.signInWithGoogle({scopes:[DRIVE_SCOPE]}); C.googleToken = r.credential?.accessToken; C.tokenAt = Date.now(); return C.googleToken; }
    const p = new A.GoogleAuthProvider(); p.addScope(DRIVE_SCOPE);
    const r = await A.reauthenticateWithPopup(auth.currentUser, p).catch(() => A.linkWithPopup(auth.currentUser, p));
    C.googleToken = A.GoogleAuthProvider.credentialFromResult(r)?.accessToken; C.tokenAt = Date.now(); return C.googleToken;
  }
  async function driveFolder(tok){
    if (S.settings.driveFolder) return S.settings.driveFolder;
    const name = `${appName()} – ${T("Souvenirs")}`;
    const q = encodeURIComponent(`name='${name.replace(/'/g,"\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const l = await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {headers:{Authorization:"Bearer "+tok}})).json();
    let id = l.files?.[0]?.id;
    if (!id){ const r = await (await fetch("https://www.googleapis.com/drive/v3/files", {method:"POST", headers:{Authorization:"Bearer "+tok, "Content-Type":"application/json"}, body:JSON.stringify({name, mimeType:"application/vnd.google-apps.folder"})})).json(); id = r.id; }
    S.settings.driveFolder = id; save(); return id;
  }
  C.driveUpload = async (name, mime, base64, description = "") => {
    const tok = await driveToken(); if (!tok) throw new Error(T("Connexion Google requise"));
    const folder = await driveFolder(tok), bnd = "tribe" + Date.now();
    const meta = {name, parents:[folder], description};
    const body = `--${bnd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${bnd}\r\nContent-Type: ${mime}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64}\r\n--${bnd}--`;
    const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {method:"POST", headers:{Authorization:"Bearer "+tok, "Content-Type":`multipart/related; boundary=${bnd}`}, body});
    const d = await r.json(); if (!r.ok) { if (r.status === 401) C.googleToken = null; throw new Error(d.error?.message || "Drive"); }
    return d;
  };
  render();
} else {
  C.configured = false;
}
