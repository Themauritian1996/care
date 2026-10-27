/* =========================================================================
   TRIBU — fonctions natives (APK Capacitor) avec repli web
   ========================================================================= */
const Native = (() => {
  const C = window.Capacitor;
  const isApp = !!(C && C.isNativePlatform && C.isNativePlatform());
  const P = name => isApp ? C.Plugins?.[name] : null;

  /* Photo : appareil photo ou galerie. Repli web : champ fichier avec capture. */
  /* choix appareil photo / galerie : petite fenêtre maison, plus jolie que celle du système */
  function pickSource(){
    return new Promise(res => {
      const el = document.createElement("div"); el.className = "pk-scrim";
      el.innerHTML = `<div class="pk" role="dialog" aria-modal="true"><div class="sheet-grab"></div><h3>${T("Ajouter une photo")}</h3><div class="pk-grid"><button type="button" data-pk="camera"><span class="pk-ic cam">${icon("camera")}</span><b>${T("Prendre une photo")}</b><small>${T("Appareil photo")}</small></button><button type="button" data-pk="photos"><span class="pk-ic gal">${icon("image")}</span><b>${T("Galerie")}</b><small>${T("Choisir une photo existante")}</small></button></div><button type="button" class="btn line" data-pk="">${T("Annuler")}</button></div>`;
      const done = v => { el.classList.add("out"); setTimeout(() => el.remove(), 180); res(v); };
      el.addEventListener("click", e => { const b = e.target.closest("[data-pk]"); if (b) return done(b.dataset.pk || null); if (e.target === el) done(null); });
      document.body.appendChild(el);
    });
  }
  async function takePhoto({source = "prompt"} = {}){
    if (source === "prompt"){ source = await pickSource(); if (!source) return null; }
    const cam = P("Camera");
    if (cam){
      try {
        const r = await cam.getPhoto({ resultType:"dataUrl", quality:82, width:1600, correctOrientation:true, source: source === "camera" ? "CAMERA" : source === "photos" ? "PHOTOS" : "PROMPT", promptLabelHeader:T("Photo"), promptLabelPhoto:T("Choisir dans la galerie"), promptLabelPicture:T("Prendre une photo"), promptLabelCancel:T("Annuler") });
        return r.dataUrl;
      } catch(e){ return null; }
    }
    return new Promise(res => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      if (source === "camera") inp.capture = "environment";
      inp.onchange = async () => res(inp.files[0] ? await readFile(inp.files[0]) : null);
      inp.click();
    });
  }

  /* Partage : feuille de partage Android, Web Share, ou téléchargement */
  async function share({title = "Tribe", text = "", dataUrl = null, filename = "tribe.jpg", mime = "image/jpeg"} = {}){
    const sh = P("Share"), fs = P("Filesystem");
    if (sh){
      try {
        let files;
        if (dataUrl && fs){ const w = await fs.writeFile({path:filename, data:dataUrl.split(",")[1], directory:"CACHE"}); files = [w.uri]; }
        await sh.share({title, text, files, dialogTitle:T("Partager")}); return true;
      } catch(e){ return false; }
    }
    try {
      if (dataUrl && navigator.canShare){
        const blob = await (await fetch(dataUrl)).blob(), file = new File([blob], filename, {type:mime});
        if (navigator.canShare({files:[file]})){ await navigator.share({title, text, files:[file]}); return true; }
      }
      if (navigator.share){ await navigator.share({title, text}); return true; }
    } catch(e){ if (e?.name === "AbortError") return false; }
    if (dataUrl) { download(dataUrl, filename); return true; }
    try { await navigator.clipboard.writeText(text); toast(T("Texte copié, collez-le où vous voulez")); } catch(e){}
    return false;
  }
  function download(dataUrl, filename){ const a = document.createElement("a"); a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }
  /* Enregistre un fichier texte (export) */
  async function saveText(text, filename, mime = "application/json"){
    const url = "data:" + mime + ";charset=utf-8;base64," + btoa(unescape(encodeURIComponent(text)));
    if (isApp) return share({title:filename, text:"", dataUrl:url, filename, mime});
    download(url, filename); return true;
  }

  /* Notifications locales (APK) ; dans le navigateur, seulement quand la page est ouverte */
  const webTimers = [];
  let channelOk = false;
  async function channel(ln){ if (channelOk) return; channelOk = true; try { await ln.createChannel({id:"tribe", name:"Tribe", description:T("Rappels et messages"), importance:4, visibility:1, vibration:true}); } catch(e){} }
  async function notifPermission(){
    const ln = P("LocalNotifications");
    if (ln){ try { let r = await ln.checkPermissions(); if (r.display !== "granted") r = await ln.requestPermissions(); await channel(ln);
      try { const ex = await ln.checkExactNotificationSetting?.(); if (ex && ex.exact_alarm && ex.exact_alarm !== "granted") toast(T("Pour des rappels à l'heure exacte, autorisez « Alarmes et rappels » (Réglages → Notifications).")); } catch(e){}
      return r.display === "granted"; } catch(e){ return false; } }
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    try { return (await Notification.requestPermission()) === "granted"; } catch(e){ return false; }
  }
  async function schedule(list){
    const ln = P("LocalNotifications");
    if (ln){
      try {
        let prev = []; try { prev = JSON.parse(localStorage.getItem("tribe.nids") || "null"); } catch(e){}
        const pend = await ln.getPending(), mine = (pend.notifications||[]).filter(n => !prev || prev.includes(n.id));
        if (mine.length) await ln.cancel({notifications:mine.map(n => ({id:n.id}))});
        try { localStorage.setItem("tribe.nids", JSON.stringify(list.slice(0, 60).map(n => n.id))); } catch(e){}
        await channel(ln);
        if (list.length) await ln.schedule({notifications:list.slice(0, 60).map(n => ({id:n.id, title:n.title, body:n.body, channelId:"tribe", extra:n.extra||null, schedule:{at:new Date(n.at), allowWhileIdle:true}}))});
      } catch(e){}
      return;
    }
    webTimers.splice(0).forEach(clearTimeout);
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    list.filter(n => n.at - Date.now() < 864e5*1.2 && n.at > Date.now()).forEach(n => webTimers.push(setTimeout(() => { try { new Notification(n.title, {body:n.body, icon:"icon-192.png"}); } catch(e){} }, n.at - Date.now())));
  }
  async function notifyNow(title, body, extra = null, force = false){
    const ln = P("LocalNotifications");
    if (ln){ try { await channel(ln); await ln.schedule({notifications:[{id:Math.floor(Math.random()*1e8), title, body, channelId:"tribe", extra, schedule:{at:new Date(Date.now()+800), allowWhileIdle:true}}]}); } catch(e){} return; }
    if ("Notification" in window && Notification.permission === "granted" && (document.hidden || force)){ try { const n = new Notification(title, {body, icon:"icon-192.png"}); n.onclick = () => { window.focus(); if (extra) openFromNotif(extra); }; } catch(e){} }
  }
  async function notifyAt(title, body, at, extra = null){
    const ln = P("LocalNotifications");
    if (ln){ await channel(ln); return ln.schedule({notifications:[{id:Math.floor(Math.random()*1e8), title, body, channelId:"tribe", extra, schedule:{at:new Date(at), allowWhileIdle:true}}]}); }
    setTimeout(() => notifyNow(title, body, extra, true), at - Date.now());
  }
  function openFromNotif(x){ if (!x) return; if (x.go === "assistant"){ UI.aiTab = x.tab || "ask"; go("assistant"); if (x.auto) maybeAutoReview(); } else if (x.go) go(x.go); }

  /* Clavier : garde le champ actif visible au-dessus du clavier */
  function initKeyboard(){
    const root = document.documentElement;
    const setKb = (h, shift = true) => { root.style.setProperty("--kb", (shift ? Math.max(0, h) : 0) + "px"); document.body.classList.toggle("kb-open", h > 80); };
    const kb = P("Keyboard");
    if (kb){ // l'APK redimensionne déjà la vue (resize « native ») : on ne décale pas une 2e fois
      kb.addListener("keyboardWillShow", i => setKb(i.keyboardHeight, false));
      kb.addListener("keyboardDidShow", i => { setKb(i.keyboardHeight, false); keepFocusVisible(); });
      kb.addListener("keyboardWillHide", () => setKb(0));
    } else if (window.visualViewport){
      const vv = window.visualViewport;
      const upd = () => setKb(window.innerHeight - vv.height - vv.offsetTop);
      vv.addEventListener("resize", upd); vv.addEventListener("scroll", upd);
    }
    document.addEventListener("focusin", e => { if (e.target.matches("input,textarea,select")) setTimeout(keepFocusVisible, 320); });
  }
  function keepFocusVisible(){ const el = document.activeElement; if (el && el.matches("input,textarea,select")) el.scrollIntoView({block:"center", behavior:"smooth"}); }

  function initApp(){
    const app = P("App");
    const ln = P("LocalNotifications");
    if (ln){ try { ln.addListener("localNotificationActionPerformed", a => setTimeout(() => openFromNotif(a.notification?.extra), 300)); } catch(e){} }
    if (app) app.addListener("backButton", () => { if (document.querySelector("#viewer")) { closeViewer(); } else if (document.querySelector("#flip")) { closeFlip(); } else if (document.querySelector("#layer .scrim")) { closeSheet(); } else if (UI.view !== "home") { if (typeof stopPlay === "function") stopPlay(); go("home"); } else app.exitApp(); });
    const sb = P("StatusBar");
    if (sb){ try { sb.setOverlaysWebView({overlay:false}); } catch(e){} }
  }
  function statusBarTheme(dark){ const sb = P("StatusBar"); if (sb){ try { sb.setStyle({style: dark ? "DARK" : "LIGHT"}); sb.setBackgroundColor({color: getComputedStyle(document.body).backgroundColor.startsWith("rgb") ? rgbHex(getComputedStyle(document.body).backgroundColor) : "#F6F4FB"}); } catch(e){} } }
  const rgbHex = s => "#" + (s.match(/\d+/g)||[246,244,251]).slice(0,3).map(n => (+n).toString(16).padStart(2,"0")).join("");

  return { isApp, P, notifyAt, openFromNotif, takePhoto, share, saveText, download, notifPermission, schedule, notifyNow, initKeyboard, initApp, statusBarTheme };
})();
