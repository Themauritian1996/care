/* =========================================================================
   TRIBU — utilitaires, calculs cliniques, état et stockage
   ========================================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 9);
const DAY = 864e5, MONTH_DAYS = 30.4375;
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseD = s => { const [y,m,d] = String(s).split("-").map(Number); return new Date(y, m-1, d); };
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const addMonths = (d, m) => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmtD = (s, opt={day:"numeric",month:"short",year:"numeric"}) => (typeof s==="string"?parseD(s):s).toLocaleDateString(LOCALE(), opt);
const fmtT = ts => new Date(ts).toLocaleTimeString(LOCALE(),{hour:"2-digit",minute:"2-digit"});
const fmtDur = ms => { const m = Math.max(0, Math.round(ms/60000)); return m < 60 ? `${m} min` : `${Math.floor(m/60)} h ${pad(m%60)}`; };
const fmtMin = m => { m = Math.round(m||0); return m < 60 ? `${m} min` : `${Math.floor(m/60)} h${m%60?" "+pad(m%60):""}`; };
const localInput = ts => { const d = new Date(ts); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); };
const fmtNum = (v, dp=1) => Number(v).toLocaleString(LOCALE(),{minimumFractionDigits:dp,maximumFractionDigits:dp});
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const sum = a => a.reduce((s,x)=>s+(Number(x)||0),0);
const dayKey = ts => iso(new Date(ts));

/* ---------- âge ---------- */
// Âge en mois (jours / 30,4375). Bébé à naître : âge négatif calculé depuis la date prévue.
const birthOf = c => c.dob || c.dueDate || iso(today());
const isPrenatal = c => !c.dob && !!c.dueDate;
const ageMonths = (c, at = today()) => (at - parseD(birthOf(c))) / DAY / MONTH_DAYS;
function correction(c){ if (!c.dob) return 0; const g = (Number(c.gaW)||40)*7 + (Number(c.gaD)||0); return g >= 259 ? 0 : (280 - g)/MONTH_DAYS; }
const usesCorrected = (c, at = today()) => correction(c) > 0 && ageMonths(c, at) < 24;
const effAge = (c, at = today(), chrono=false) => { const a = ageMonths(c, at); return (!chrono && usesCorrected(c, at)) ? Math.max(0, a - correction(c)) : a; };
function pregWeek(c, at = today()){ const days = 280 - (parseD(c.dueDate) - at)/DAY; return {w:Math.floor(days/7), d:Math.floor(days%7), days}; }
function ageLabel(m){
  if (m < 0) return T("à naître");
  const days = Math.round(m * MONTH_DAYS);
  if (days < 14) return days > 1 ? T("{n} jours",{n:days}) : T("{n} jour",{n:days});
  if (m < 3) { const w = Math.floor(days/7); return w > 1 ? T("{n} semaines",{n:w}) : T("{n} semaine",{n:w}); }
  if (m < 24) { const mm = Math.floor(m), w = Math.floor((m-mm)*MONTH_DAYS/7); return T("{n} mois",{n:mm}) + (w ? " " + T("{n} sem.",{n:w}) : ""); }
  const y = Math.floor(m/12), r = Math.floor(m - y*12);
  return (y > 1 ? T("{n} ans",{n:y}) : T("{n} an",{n:y})) + (r && y<6 ? " " + T("{n} mois",{n:r}) : "");
}
const kidAge = c => isPrenatal(c) ? (()=>{ const p = pregWeek(c); return T("{n} sem. de grossesse",{n:p.w}); })() : ageLabel(ageMonths(c));
const mLabel = m => m < 24 ? T("{n} mois",{n:Math.round(m)}) : T("{n} ans",{n: m % 12 === 0 ? m/12 : fmtNum(m/12, 1)});
const stageOf = m => STAGES.find(s => m < s.max);
const stageKid = c => isPrenatal(c) ? STAGES[0] : stageOf(ageMonths(c));
const lookOf = c => { const s = (c && c.look && c.look !== "auto") ? STAGES.find(s => s.id === c.look) : c ? stageKid(c) : STAGES[1]; return s?.id === "adulte" ? STAGES.find(x => x.id === "ado") : s; };

/* ---------- moteur OMS (LMS) ---------- */
const MEAS = { weight:{label:"Poids", unit:"kg", dp:2}, height:{label:"Taille", unit:"cm", dp:1}, ofc:{label:"Périmètre crânien", unit:"cm", dp:1}, bmi:{label:"IMC", unit:"kg/m²", dp:1} };
function lmsAt(meas, sex, m){
  const t = LMS[meas]?.[sex === "M" ? "M" : "F"]; if (!t) return null;
  if (m < 0 || m > t[t.length-1][0]) return null;
  const i = Math.min(Math.floor(m), t.length-2), f = m - t[i][0], a = t[i], b = t[i+1];
  return { L: a[1] + (b[1]-a[1])*f, M: a[2] + (b[2]-a[2])*f, S: a[3] + (b[3]-a[3])*f };
}
// X = M·(1 + L·S·z)^(1/L), ou M·exp(S·z) si L = 0
const xAtZ = ({L,M,S}, z) => Math.abs(L) < 1e-7 ? M*Math.exp(S*z) : M*Math.pow(1 + L*S*z, 1/L);
// z = ((X/M)^L − 1)/(L·S), correction OMS au-delà de ±3 DS pour poids et IMC
function zScore(meas, sex, m, x){
  const p = lmsAt(meas, sex, m); if (!p || !(x > 0)) return null;
  const {L,M,S} = p;
  let z = Math.abs(L) < 1e-7 ? Math.log(x/M)/S : (Math.pow(x/M, L) - 1)/(L*S);
  if (meas === "weight" || meas === "bmi"){
    if (z > 3){ const s3 = xAtZ(p,3), s2 = xAtZ(p,2); z = 3 + (x - s3)/(s3 - s2); }
    else if (z < -3){ const s3 = xAtZ(p,-3), s2 = xAtZ(p,-2); z = -3 - (s3 - x)/(s2 - s3); }
  }
  return z;
}
function normCdf(z){ // Abramowitz & Stegun 7.1.26
  const t = 1/(1 + 0.3275911*Math.abs(z)/Math.SQRT2);
  const y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t*Math.exp(-z*z/2);
  return 0.5*(1 + Math.sign(z)*y);
}
const pctLabel = z => { const p = normCdf(z)*100; return p < 0.1 ? "<0,1" : p > 99.9 ? ">99,9" : fmtNum(p, p<1||p>99?1:0); };
const PCT_LINES = [{p:3,z:-1.8808},{p:15,z:-1.0364},{p:50,z:0},{p:85,z:1.0364},{p:97,z:1.8808}];
const linesCrossed = (z1, z2) => PCT_LINES.filter(l => l.z > Math.min(z1,z2) && l.z < Math.max(z1,z2)).length;
function growthPoints(c, meas, chrono=false){
  return (c.growth||[]).map(g => {
    let x = meas === "bmi" ? (g.weight && g.height ? g.weight / Math.pow(g.height/100, 2) : null) : g[meas];
    x = x ? Number(x) : null; if (!x) return null;
    const m = effAge(c, parseD(g.date), chrono);
    return { id:g.id, date:g.date, m, x, z: zScore(meas, c.sex, m, x) };
  }).filter(Boolean).sort((a,b) => a.m - b.m);
}
function growthAlerts(c){
  const out = [];
  for (const meas of ["weight","height","ofc","bmi"]){
    const pts = growthPoints(c, meas).filter(p => p.z != null);
    if (pts.length < 2) continue;
    const last = pts[pts.length-1];
    let worst = null;
    for (const p of pts.filter(p => last.m - p.m <= 12 && p !== last)){ const n = linesCrossed(p.z, last.z); if (n >= 2 && (!worst || n > worst.n)) worst = {n, from:p}; }
    if (worst) out.push({meas, n:worst.n, dir: last.z < worst.from.z ? "baisse" : "hausse", from:worst.from, last});
    if (last.z < -1.8808 || last.z > 1.8808) out.push({meas, out:true, last});
  }
  return out;
}
// Taille cible parentale (Tanner) : (père + mère ± 13)/2, ±8,5 cm
function midParental(c){
  const f = Number(c.hFather), m = Number(c.hMother); if (!f || !m) return null;
  const t = c.sex === "M" ? (f + m + 13)/2 : (f + m - 13)/2;
  return { t, lo: t - 8.5, hi: t + 8.5, z: zScore("height", c.sex, 228, t) };
}
/* Projection de la taille adulte : couloir OMS actuel prolongé jusqu'à 19 ans,
   incertitude = 1,28 × √(1 − r²) (r ≈ 0,6 avant 2 ans → 0,85 après 10 ans), combinée à la taille parentale si connue. */
function heightProjection(c){
  const pts = growthPoints(c, "height").filter(p => p.z != null);
  if (!pts.length) return null;
  const last = pts[pts.length-1];
  const r = last.m < 24 ? 0.6 : last.m < 48 ? 0.7 : last.m < 120 ? 0.8 : 0.85;
  const half = 1.28*Math.sqrt(1 - r*r);
  const adult = lmsAt("height", c.sex, 228), mp = midParental(c);
  const zComb = mp ? (last.z + mp.z)/2 : null;
  const curve = [];
  for (let m = Math.ceil(last.m); m <= 228; m += 1){
    const p = lmsAt("height", c.sex, m); if (!p) continue;
    const f = (m - last.m) / Math.max(1, 228 - last.m), w = half * f;
    curve.push({m, x:xAtZ(p, last.z), lo:xAtZ(p, last.z - w), hi:xAtZ(p, last.z + w), comb: zComb!=null ? xAtZ(p, last.z + (zComb-last.z)*f) : null});
  }
  return { last, r, adult:xAtZ(adult, last.z), lo:xAtZ(adult, last.z-half), hi:xAtZ(adult, last.z+half), comb: zComb!=null ? xAtZ(adult, zComb) : null, mp, curve };
}
function heightVelocity(c){
  const pts = growthPoints(c, "height", true); if (pts.length < 2) return null;
  const last = pts[pts.length-1], prev = [...pts].reverse().find(p => last.m - p.m >= 4); if (!prev) return null;
  return { v: (last.x - prev.x) / ((last.m - prev.m)/12), from:prev, to:last };
}

/* ---------- vaccins, visites ---------- */
function vaxStatus(c, g){
  const due = addMonths(parseD(birthOf(c)), g.age), lateAfter = addMonths(due, g.window || (g.age === 0 ? 3 : 1)), t = today();
  return g.doses.map(d => {
    const rec = c.vaccines?.[d.id]; let st;
    if (rec) st = "fait"; else if (d.seasonal && ageMonths(c) > 8) st = "na";
    else if (t > lateAfter) st = "retard"; else if (t >= addDays(due,-14)) st = "du"; else st = "avenir";
    return { ...d, due, st, rec };
  });
}
function nextVaccines(c){ if (isPrenatal(c)) return null; for (const g of PIQ){ const s = vaxStatus(c, g).filter(d => ["retard","du","avenir"].includes(d.st)); if (s.length) return { group:g, doses:s, due:s[0].due }; } return null; }
const vaccinesDone = c => !isPrenatal(c) && !nextVaccines(c);
function nextVisit(c){ if (isPrenatal(c)) return null; const m = ageMonths(c); const v = VISITS.find(a => a >= m - 0.3); return v == null ? null : { age:v, date: addDays(parseD(c.dob), Math.round(v*MONTH_DAYS)) }; }

/* ---------- jalons : niveau rassurant ---------- */
function msLevel(c, it, em){
  if (c.milestones?.[it.k]) return {id:"ok", l:T("Acquis"), c:"mint"};
  if (em < it.m50) return {id:"tot", l:T("Pas encore attendu"), c:"", tip:T("La plupart des enfants n'y sont pas encore à cet âge.")};
  if (em < it.b) return {id:"cours", l:T("En cours"), c:"sky", tip:T("Environ la moitié des enfants l'ont vers {a} ; d'autres plus tard, c'est normal.",{a:mLabel(it.m50)})};
  if (!it.al || em < it.al) return {id:"obs", l:T("À observer"), c:"butter", tip:T("La majorité des enfants l'ont déjà, mais plusieurs y arrivent un peu plus tard. Continuez d'offrir des occasions de pratiquer.")};
  return {id:"parler", l:T("À mentionner"), c:"rose", tip:T("À mentionner au médecin ou à l'infirmière à la prochaine visite. Ce n'est pas une urgence et souvent rien d'inquiétant.")};
}
const bandOf = it => BANDS.find(b => b >= it.b - 0.5) || 72;
const bandLabel = b => b < 24 ? T("{n} mois",{n:b}) : T("{n} ans",{n:b/12});
const rangeTxt = it => it.b < 24 ? T("{a} à {b} mois",{a:fmtNum(it.a, it.a%1?1:0), b:fmtNum(it.b, it.b%1?1:0)}) : T("{a} à {b}",{a:mLabel(it.a), b:mLabel(it.b)});

/* ---------- état ---------- */
const KEY = "tribe.v3", OLD_KEYS = ["care.v1", "poussin.v1"];
const blankKid = () => ({vaccines:{}, milestones:{}, teeth:{}, allergensLog:{}, growth:[], logs:[], firsts:[], events:[], activities:[],
  modules:{}, hideTips:[], look:"auto", photo:null, nick:"", avatar:{kind:"auto"}, goals:{}, goalBand:null, trackers:[], foodFav:[], prenatal:{checks:{}, names:[]}});
const blankState = () => ({ v:3, demo:false, active:null, children:[], timer:null,
  family:{name:"", members:[]}, me:null,
  settings:{theme:null, bg:"lavande", lang:null, appName:"Tribe", features:Object.fromEntries(FEATURES.map(f=>[f.k,true])),
    notif:{enabled:false, events:true, vaccines:true, memories:true, goals:false, goalTime:"19:00", review:true},
    ai:{model:"", speed:"rapide", topics:["sommeil","alimentation","activite"], freq:"semaine", reviewDay:0, reviewTime:"19:00", lastReview:null, search:true},
    parental:{pin:null, kidMode:false, allow:{chat:true, groups:false, photos:true, ai:false, health:false, delete:false, settings:false, selfApprove:false}}},
  events:[], memories:[], photos:[], tasks:[], completions:[], rewards:[], redemptions:[], avail:{}, messages:[], groups:[], reviews:[], aiChat:[], kidevents:[], stories:[], recipes:[], aiHist:[] });
let S;
function migrate(old){
  const s = blankState();
  if (old && old.v === 3) return {...s, ...old, settings:{...s.settings, ...old.settings, notif:{...s.settings.notif, ...(old.settings?.notif||{})}, ai:{...s.settings.ai, ...(old.settings?.ai||{})}, parental:{...s.settings.parental, ...(old.settings?.parental||{}), allow:{...s.settings.parental.allow, ...(old.settings?.parental?.allow||{})}}, features:{...s.settings.features, ...(old.settings?.features||{})}}};
  if (old && Array.isArray(old.children)){ // reprise des données Care / Poussin
    s.children = old.children; s.active = old.active; s.timer = old.timer; s.settings.theme = old.theme || null; s.demo = !!old.demo;
    s.children.forEach(c => { (c.events||[]).forEach(e => s.events.push({...e, kidIds:[c.id]})); c.events = []; (c.firsts||[]).forEach(f => s.memories.push({id:f.id, date:f.date, title:f.title, text:f.note||"", kidIds:[c.id]})); c.firsts = []; });
  }
  return s;
}
/* anciennes données d'exemple (Léa, Noah, « Petit pois », Alex et Sam) : on repart à neuf */
const DEMO_KIDS = ["k_lea","k_noah","k_bebe"];
const isDemoData = s => !!s && (s.demo || (s.children||[]).some(c => DEMO_KIDS.includes(c.id)) || (s.family?.members||[]).some(m => m.id === "m_p2" && m.name === "Sam" && !m.uid));
function freshFrom(old){
  const s = blankState(); ["theme","lang","bg","appName","appNameLocal"].forEach(k => { if (old.settings?.[k] != null) s.settings[k] = old.settings[k]; });
  if (old.settings?.ai) s.settings.ai = {...s.settings.ai, ...old.settings.ai};
  const mine = (old.family?.members||[]).find(m => m.id === old.me && m.uid);
  if (mine) s.family.members = [{...mine, name: mine.name === "Alex" ? T("Moi") : mine.name, avatar: mine.name === "Alex" ? {kind:"auto"} : mine.avatar}];
  s.me = s.family.members[0]?.id || null; return s;
}
function normalize(){
  S.children.forEach(c => { const b = blankKid(); for (const k in b) if (c[k] === undefined) c[k] = b[k]; });
  if (!S.family.members.length) S.family.members = [{id:"m_"+uid(), name:T("Moi"), role:"parent", color:"lilac", avatar:{kind:"symbole", id:"coeur"}}];
  if (!S.me || !S.family.members.some(m => m.id === S.me)) S.me = S.family.members[0].id;
  S.children.forEach(c => { if (!c.adult && !S.family.members.some(m => m.kidId === c.id) && ageMonths(c) >= 36) S.family.members.push({id:"m_"+c.id, name:c.nick||c.name, role:"enfant", kidId:c.id, color:c.color}); });
}
function loadLocal(){
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch(e){}
  for (const k of OLD_KEYS){ try { const r = localStorage.getItem(k); if (r) return JSON.parse(r); } catch(e){} }
  return null;
}
let saveT;
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){ toast(T("Stockage plein : exportez vos données ou retirez des photos")); }
  clearTimeout(saveT); saveT = setTimeout(() => { try { window.Cloud?.push?.(); } catch(e){} try { scheduleNotifications(); } catch(e){} try { typeof driveWatch === "function" && driveWatch(); } catch(e){} }, 600);
}
const child = () => S.children.find(c => c.id === S.active) || S.children[0];
const kidById = id => S.children.find(c => c.id === id);
const member = id => S.family.members.find(m => m.id === id);
const me = () => member(S.me) || S.family.members[0];
const feat = k => S.settings.features[k] !== false;
const ADULT_MODS = ["solids","sports","reading","screen","mood"];
const mod = (c, k) => { const o = c.modules?.[k]; if (o === true || o === false) return o; if (c.adult) return ADULT_MODS.includes(k); const M = MODULES.find(x => x.k === k); return M ? M.def(isPrenatal(c) ? -1 : ageMonths(c)) : true; };

/* ---------- contrôle parental ---------- */
const isKidUser = () => S.settings.parental.kidMode || me()?.role === "enfant";
const allow = k => !isKidUser() || !!S.settings.parental.allow[k];
async function hashPin(p){ try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tribu:"+p)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""); } catch(e){ return "p"+p; } }

/* ---------- photos : IndexedDB (gros volumes hors du stockage local) ---------- */
const PhotoDB = (() => {
  let dbp = null; const mem = new Map();
  const open = () => dbp || (dbp = new Promise((res, rej) => { try { const r = indexedDB.open("tribu-photos", 1); r.onupgradeneeded = () => r.result.createObjectStore("p"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch(e){ rej(e); } }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("p", mode), st = t.objectStore("p"); const r = fn(st); t.oncomplete = () => res(r?.result); t.onerror = () => rej(t.error); }); };
  return {
    async put(id, data){ mem.set(id, data); try { await tx("readwrite", s => s.put(data, id)); } catch(e){} },
    async get(id){ if (mem.has(id)) return mem.get(id); try { const v = await tx("readonly", s => s.get(id)); if (v) mem.set(id, v); return v || null; } catch(e){ return null; } },
    async del(id){ mem.delete(id); try { await tx("readwrite", s => s.delete(id)); } catch(e){} },
    cached: id => mem.get(id),
  };
})();
// Réduit une image (data URL) à `max` px, JPEG
function shrinkImage(dataUrl, max = 1200, q = 0.82, square = false){
  return new Promise(res => { const img = new Image(); img.onload = () => {
    let w = img.width, h = img.height, sx = 0, sy = 0, sw = w, sh = h;
    if (square){ const s = Math.min(w,h); sx = (w-s)/2; sy = (h-s)/2; sw = sh = s; w = h = Math.min(max, s); }
    else { const k = Math.min(1, max/Math.max(w,h)); w = Math.round(w*k); h = Math.round(h*k); }
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    res(cv.toDataURL("image/jpeg", q)); }; img.onerror = () => res(dataUrl); img.src = dataUrl; });
}
const readFile = f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });

/* ---------- journal : totaux et statistiques ---------- */
function dayLogs(c, d){ const s = d.getTime(), e = addDays(d,1).getTime(); return (c.logs||[]).filter(l => l.t >= s && l.t < e).sort((a,b)=>b.t-a.t); }
function dayTotals(c, d){
  const s = d.getTime(), e = addDays(d,1).getTime(), T = {sleep:0, nap:0, night:0, act:0, screen:0, read:0, feeds:0, ml:0, diapers:0, meals:0, groups:{}, trk:{}};
  (c.logs||[]).forEach(l => {
    const mins = Number(l.data?.min)||0;
    if (l.type === "sleep" && l.end && l.end >= s && l.end < e){ const v = (l.end - l.t)/6e4 - (Number(l.data?.pausedMin)||0); T.sleep += v; if (l.data?.kind === "Sieste") T.nap += v; else T.night += v; }
    if (l.t < s || l.t >= e) return;
    if (l.type === "activity" || l.type === "tummy") T.act += mins;
    if (l.type === "screen") T.screen += mins;
    if (l.type === "read") T.read += mins;
    if (l.type === "feed"){ T.feeds++; T.ml += Number(l.data.ml)||0; }
    if (l.type === "diaper") T.diapers++;
    if (l.type === "solid"){ T.meals++; (l.data.items||[]).forEach(it => T.groups[it.group||"autres"] = (T.groups[it.group||"autres"]||0) + 1); }
    if (l.type === "trk"){ const id = l.data.tid; T.trk[id] = (T.trk[id]||0) + (Number(l.data.v)||1); }
  });
  // sports à l'horaire : comptés automatiquement (sauf si marqués « pas fait »)
  const ds = iso(d); T.sport = 0;
  if (d <= today()) (c.activities||[]).forEach(a => { if (!a.dur || a.auto === false || !a.days.map(Number).includes(d.getDay()) || (a.since && ds < a.since) || (c.sportSkip||{})[a.id+"|"+ds]) return; T.act += a.dur; T.sport += a.dur; });
  return T;
}
/* objectifs : valeur personnalisée ou recommandation de l'âge */
function goals(c){
  const g = guide(Math.max(0, ageMonths(c))), o = c.goals || {};
  return { sleep: o.sleep ?? g.sleep[0], act: o.act ?? g.act, screen: o.screen ?? g.screen, read: o.read ?? g.read, rec:g, custom:o };
}
/* métriques du bien-être (clé → libellé, unité, accès) */
const METRICS = {
  sleep:{l:"Sommeil", u:"h", col:"lilac", get:T=>T.sleep/60, goal:c=>goals(c).sleep, kind:"min"},
  act:{l:"Activité", u:"min", col:"mint", get:T=>T.act, goal:c=>goals(c).act, kind:"min"},
  screen:{l:"Écran", u:"min", col:"sky", get:T=>T.screen, goal:c=>goals(c).screen, kind:"max"},
  read:{l:"Lecture", u:"min", col:"peach", get:T=>T.read, goal:c=>goals(c).read, kind:"min"},
  feeds:{l:"Boires", u:"", col:"peach", get:T=>T.feeds, goal:()=>null},
  diapers:{l:"Couches", u:"", col:"sky", get:T=>T.diapers, goal:()=>null},
};
function metricOf(c, key){
  if (METRICS[key]) return METRICS[key];
  const t = (c.trackers||[]).find(x => "trk:"+x.id === key); if (!t) return null;
  return {l:t.name, u:t.unit||"", col:t.color||"teal", get:T=>T.trk[t.id]||0, goal:()=>t.goal||null, kind:t.goalKind||"min"};
}
function series(c, key, days){
  const M = metricOf(c, key); if (!M) return [];
  return Array.from({length:days}, (_,i) => { const d = addDays(today(), i-days+1); return {d, v:M.get(dayTotals(c, d))}; });
}

/* ---------- unités d'affichage (les données restent en métrique) ---------- */
const UN = () => ({w:"kg", l:"cm", v:"ml", t:"C", ...(S?.settings?.units||{})});
const volU = () => UN().v === "oz" ? "oz" : "ml";
const fmtVolIn = ml => UN().v === "oz" ? Math.round(ml/29.5735*10)/10 : ml;
const volToMl = x => UN().v === "oz" ? Math.round(x*29.5735) : x;
const fmtVol = ml => UN().v === "oz" ? `${fmtNum(ml/29.5735,1)} oz` : `${Math.round(ml)} ml`;
const tempU = () => UN().t === "F" ? "°F" : "°C";
const fmtTempIn = c => UN().t === "F" ? Math.round((c*9/5+32)*10)/10 : c;
const tempToC = x => UN().t === "F" ? Math.round((x-32)*5/9*10)/10 : x;
const fmtTemp = c => UN().t === "F" ? `${fmtNum(c*9/5+32,1)} °F` : `${fmtNum(c,1)} °C`;
/* mesures de croissance : poids, taille, périmètre crânien */
const cvM = (k, v) => v == null || isNaN(v) ? v : k === "weight" && UN().w === "lb" ? v*2.20462 : (k === "height" || k === "ofc") && UN().l === "in" ? v/2.54 : v;
const toMetric = (k, v) => !v ? v : k === "weight" && UN().w === "lb" ? v/2.20462 : (k === "height" || k === "ofc") && UN().l === "in" ? v*2.54 : v;
const muM = k => k === "weight" ? (UN().w === "lb" ? "lb" : "kg") : k === "bmi" ? "kg/m²" : (UN().l === "in" ? "po" : "cm");
const dpM = (k, d) => (k === "weight" && UN().w === "lb") ? 1 : d;
