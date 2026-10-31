/* =========================================================================
   TRIBU — widget Android « prise rapide » (écran d'accueil)
   Le widget natif note les touches dans une file ; l'app les lit ici,
   crée les entrées (et les minuteries), puis renvoie la configuration.
   ========================================================================= */
const WIDGET_BTNS = {
  feedL:{l:"Sein gauche", e:"🤱", type:"feed", timer:true, data:{mode:"Sein gauche"}, mod:"feeding"},
  feedR:{l:"Sein droit", e:"🤱", type:"feed", timer:true, data:{mode:"Sein droit"}, mod:"feeding"},
  bottle:{l:"Biberon", e:"🍼", type:"feed", data:{mode:"Biberon"}, mod:"feeding"},
  pump:{l:"Lait tiré", e:"🥛", type:"feed", timer:true, data:{mode:"Lait tiré"}, mod:"feeding"},
  pee:{l:"Pipi", e:"💧", type:"diaper", data:{kind:"Pipi"}, mod:"diapers"},
  poo:{l:"Selle", e:"💩", type:"diaper", data:{kind:"Selle"}, mod:"diapers"},
  both:{l:"Pipi + selle", e:"🧷", type:"diaper", data:{kind:"Pipi et selle"}, mod:"diapers"},
  nap:{l:"Sieste", e:"😴", type:"sleep", timer:true, data:{kind:"Sieste"}},
  night:{l:"Nuit", e:"🌙", type:"sleep", timer:true, data:{kind:"Nuit"}},
  tummy:{l:"Ventre", e:"🐢", type:"tummy", timer:true, data:{}, mod:"tummy"},
  read:{l:"Lecture", e:"📖", type:"read", timer:true, data:{}, mod:"reading"},
  screen:{l:"Écran", e:"📱", type:"screen", timer:true, data:{}, mod:"screen"},
};
const Widget = (() => {
  const P = () => Native.isApp ? window.Capacitor?.Plugins?.TribeWidget : null;
  const def = (c, key) => {
    if (key.startsWith("trk:")){ const t = (c.trackers||[]).find(x => "trk:"+x.id === key); return t && ["count","yesno"].includes(t.type) ? {l:t.name, e:t.type === "yesno" ? "✅" : "➕", type:"trk", data:{tid:t.id, v:1}} : null; }
    return WIDGET_BTNS[key] || null;
  };
  /* boutons proposés pour un enfant (les modules actifs d'abord) */
  const catalog = c => Object.keys(WIDGET_BTNS).filter(k => !WIDGET_BTNS[k].mod || mod(c, WIDGET_BTNS[k].mod)).concat(Object.keys(WIDGET_BTNS).filter(k => WIDGET_BTNS[k].mod && !mod(c, WIDGET_BTNS[k].mod)))
    .concat((c.trackers||[]).filter(t => ["count","yesno"].includes(t.type)).map(t => "trk:"+t.id));
  const defaults = c => { const m = ageMonths(c);
    const base = m < 18 ? ["feedL","feedR","bottle","pee","poo","nap","night"] : m < 48 ? ["pee","poo","nap","night"] : ["nap","night","read"];
    return base.filter(k => !WIDGET_BTNS[k].mod || mod(c, WIDGET_BTNS[k].mod)).slice(0, 8); };
  const keys = c => (c.widgetBtns || defaults(c)).filter(k => def(c, k)).slice(0, 8);
  const kids = () => S.children.filter(c => !c.adult);
  /* minuterie de l'app ↔ bouton du widget */
  const runKey = (c, t) => { if (!t) return null; if (t.wkey && def(c, t.wkey)) return t.wkey;
    return keys(c).find(k => { const d = def(c, k); return d.timer && d.type === t.type && (!d.data.mode || d.data.mode === t.side) && (!d.data.kind || d.data.kind === t.kind); }) || null; };
  /* termine une minuterie de l'app à l'heure donnée et crée l'entrée */
  function finish(c, t, end){
    const paused = Math.round(((t.pausedMs||0) + (t.pausedAt ? end - t.pausedAt : 0)) / 6e4), min = Math.max(1, Math.round((end - t.start) / 6e4) - paused);
    const data = t.type === "feed" ? {mode:t.side, pausedMin:paused} : t.type === "sleep" ? {kind:t.kind, pausedMin:paused} : {min};
    c.logs.push({id:uid(), type:t.type, t:t.start, end: t.pausedAt || end, data, via:"widget"});
  }
  function apply(ev){
    const c = kidById(ev.kid), d = c && def(c, ev.key); if (!c || !d) return 0; S.timers = S.timers || {};
    const cur = S.timers[c.id];
    if (ev.op === "log"){ c.logs.push({id:uid(), type:d.type, t:ev.t, data:{...d.data}, via:"widget"}); return 1; }
    if (ev.op === "start"){ if (cur) finish(c, cur, ev.t);
      S.timers[c.id] = {type:d.type, start:ev.t, pausedMs:0, side:d.data.mode || "", kind:d.data.kind || "", wkey:ev.key}; return 1; }
    if (ev.op === "stop"){
      if (cur && cur.type === d.type){ finish(c, cur, ev.t); delete S.timers[c.id]; return 1; }
      if (ev.start && ev.t > ev.start && !c.logs.some(l => l.type === d.type && Math.abs(l.t - ev.start) < 60e3)){ finish(c, {type:d.type, start:ev.start, side:d.data.mode || "", kind:d.data.kind || ""}, ev.t); return 1; }
    }
    return 0;
  }
  let busy = false;
  async function drain(){
    const p = P(); if (!p || busy) return 0; busy = true; let n = 0;
    try { const r = await p.drain(); const q = JSON.parse(r?.json || "[]"); q.sort((a, b) => a.t - b.t).forEach(ev => n += apply(ev)); if (n){ save(); render(); } } catch(e){}
    busy = false; return n;
  }
  function config(){
    return {kids: kids().map(c => ({id:c.id, name:c.nick || c.name, buttons: keys(c).map(k => { const d = def(c, k); return {key:k, l:T(d.l), e:d.e, timer:!!d.timer}; }),
        run: (() => { const t = (S.timers||{})[c.id], k = runKey(c, t); return k ? {key:k, start:t.start} : null; })() })),
      txt:{logged:T("{l} noté · {h}"), started:T("{l} : minuterie lancée à {h}"), stopped:T("{l} : {d} noté"), running:T("{l} en cours depuis {h} · touchez pour arrêter"), tap:T("Touchez un bouton pour noter"), setup:T("Ouvrez Tribe pour choisir les boutons du widget"), open:T("Ouvrir")}};
  }
  let pushT;
  function push(){ const p = P(); if (!p) return; clearTimeout(pushT); pushT = setTimeout(async () => { await drain(); try { await p.setConfig({json:JSON.stringify(config())}); } catch(e){} }, 300); }
  async function pin(){ const p = P(); if (!p) return toast(T("Le widget est offert dans l'app Android (APK).")); push();
    try { const r = await p.pin(); if (!r?.ok) toast(T("Ajoutez-le à la main : appui long sur l'écran d'accueil > Widgets > Tribe.")); } catch(e){ toast(T("Ajoutez-le à la main : appui long sur l'écran d'accueil > Widgets > Tribe.")); } }
  function init(){ const p = P(); if (!p) return;
    try { p.addListener("changed", () => drain()); } catch(e){}
    try { window.Capacitor.Plugins.App?.addListener("appStateChange", s => { if (s.isActive) drain(); else push(); }); } catch(e){}
    drain().then(push);
  }
  return {init, push, drain, pin, catalog, keys, def, defaults, apply, config, isOn: () => !!P()};
})();

/* réglages du widget */
function widgetCard(){
  const kidsAll = S.children.filter(c => !c.adult); if (!kidsAll.length) return "";
  const c = kidById(UI.wKid) || child(); const on = Widget.keys(c);
  const chip = k => { const d = Widget.def(c, k), i = on.indexOf(k); return `<button class="chip ${i >= 0 ? "lilac" : ""}" data-act="wBtn" data-v="${esc(k)}">${d.e} ${esc(T(d.l))}${i >= 0 ? ` <b class="tiny">${i + 1}</b>` : ""}</button>`; };
  return `<div class="card c6"><div class="card-h"><h2>${T("Widget prise rapide")}</h2><span class="tiny muted">Android</span></div>
    <p class="small muted">${T("Un widget sur l'écran d'accueil pour noter en un toucher : boire, couche, dodo… Un bouton avec minuterie démarre au premier toucher et s'arrête au second. Touchez le nom de l'enfant sur le widget pour passer à un autre enfant.")}</p>
    ${kidsAll.length > 1 ? `<div class="seg" style="width:auto;margin:8px 0">${kidsAll.map(k => `<button data-act="wKid" data-v="${k.id}" aria-pressed="${k.id === c.id}">${esc(k.nick || k.name)}</button>`).join("")}</div>` : ""}
    <div class="tiny muted" style="margin:6px 0">${T("Boutons de {n} (jusqu'à 8, dans l'ordre touché)",{n:esc(c.nick || c.name)})}</div>
    <div class="row" style="flex-wrap:wrap;gap:6px">${Widget.catalog(c).map(chip).join("")}</div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm" data-act="wPin">${icon("plus")}${T("Ajouter à l'écran d'accueil")}</button>${c.widgetBtns ? `<button class="btn sm ghost" data-act="wReset">${T("Boutons par défaut")}</button>` : ""}</div>
    ${Widget.isOn() ? "" : `<p class="tiny muted" style="margin-top:6px">${T("Le widget est offert dans l'app Android (APK).")}</p>`}</div>`;
}
Object.assign(ACT, {
  wKid: v => { UI.wKid = v; render(); },
  wBtn: v => { const c = kidById(UI.wKid) || child(), k = Widget.keys(c); c.widgetBtns = k.includes(v) ? k.filter(x => x !== v) : k.length >= 8 ? (toast(T("8 boutons au maximum")), k) : [...k, v]; commit(); },
  wReset: () => { const c = kidById(UI.wKid) || child(); delete c.widgetBtns; commit(); },
  wPin: () => Widget.pin(),
});
