/* =========================================================================
   TRIBE — créations avec Gemini : histoires à chapitres (personnages, voix),
   recettes favorites avec étiquettes, menu de la semaine, idées d'activités,
   préparer une discussion. Chaque création est une tâche en arrière-plan :
   on peut en lancer plusieurs à la fois (onglet « En cours »).
   ========================================================================= */
const CREATE_KINDS = {
  story:{l:"Histoire du soir", ic:"moon", d:"Planifiez l'histoire (idées, ambiance, personnages), puis écrivez-la chapitre par chapitre. Chaque personnage a sa voix."},
  recipe:{l:"Recette", ic:"dish", d:"Une recette adaptée à l'âge et aux allergies, à garder en favori avec une étiquette."},
  plan:{l:"Menu de la semaine", ic:"spoon", d:"7 jours de repas selon l'âge, les favoris et les allergies, avec la liste d'épicerie."},
  ideas:{l:"Idées d'activités", ic:"run", d:"Jeux et sorties adaptés à l'âge, avec les lieux sur la carte."},
  talk:{l:"Préparer une discussion", ic:"chat", d:"Comment aborder un sujet délicat (deuil, puberté, écrans, consentement, drogues…)."},
};
const MOODS = ["Doux","Drôle","Aventure","Mystère","Magique","Éducatif"];
const MEAL_LABELS = ["Déjeuner","Dîner","Souper","Collation","Dessert","Boîte à lunch"];
const aiKidNow = () => kidById(UI.aiKid) || child();
const kidLine = c => c ? `${c.nick||c.name}${!isPrenatal(c)?`, ${ageLabel(ageMonths(c))}`:""}` : "un enfant";

function createPane(){
  const k = UI.createKind || "story", c = aiKidNow();
  let f = "";
  if (k === "story"){
    const lib = (S.stories||[]).flatMap(s => s.characters.filter(ch => ch.id !== "narr").map(ch => ({...ch, story:s.title})));
    f = `<div class="fgrid">${fld("st-hero",T("Héros"),inp("st-hero",c?(c.nick||c.name):"",""))}${fld("st-place",T("Lieu (facultatif)"),inp("st-place","",`placeholder="${T("Une forêt enchantée, l'espace…")}"`))}</div>
      ${fld("st-theme",T("Thème (facultatif)"),inp("st-theme","",`placeholder="${T("Dinosaures, téléportation, un chat qui parle…")}"`))}
      ${fld("st-msg",T("Ce qu'on veut transmettre (facultatif)"),inp("st-msg","",`placeholder="${T("Le courage, partager, s'endormir calme…")}"`))}
      <div class="field"><label>${T("Ambiance")}</label>${checks("st-mood", MOODS.map(x => [x, T(x)]), ["Doux"])}</div>
      <div class="field"><label>${T("Longueur")}</label>${radios("st-len",[["3",T("3 minutes")],["6",T("6 minutes")],["10",T("10 minutes")]],"3")}</div>
      ${fld("st-lvl",T("Niveau du livre (vocabulaire et style)"),lvlSelect("st-lvl",""))}
      ${lib.length ? `<div class="field"><label>${T("Reprendre des personnages")}</label>${checks("st-chars", lib.map(ch => [ch.id, `${ch.name} (${ch.story})`]), [])}</div>` : ""}
      ${fld("st-new",T("Nouveaux personnages (facultatif)"),inp("st-new","",`placeholder="${T("Ex. : Zara, une renarde qui adore les énigmes")}"`))}
      <div class="row" style="flex-wrap:wrap"><button type="button" class="btn ghost" data-act="storyIdeas">${icon("bulb")}${T("Proposer 3 idées d'abord")}</button><button class="btn kid" type="submit">${icon("spark")}${T("Écrire directement")}</button></div>
      <div id="storyIdeas"></div>`;
  }
  if (k === "recipe") f = `${fld("rc-want",T("Envie ou ingrédients disponibles"),inp("rc-want","",`placeholder="${T("Ex. : poulet, brocoli, riz ; ou « muffins sans sucre ajouté »")}" required`))}
      <div class="field"><label>${T("Moment")}</label>${radios("rc-label", MEAL_LABELS.map(x => [x, T(x)]), "Souper")}</div>
      <div class="fgrid">${fld("rc-time",T("Temps maximum"),`<select class="inp" id="rc-time"><option value="20">20 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="90">1 h 30</option></select>`)}${fld("rc-serv",T("Portions"),`<input class="inp" id="rc-serv" type="number" min="1" max="12" value="4">`)}</div>
      <button class="btn kid" type="submit">${icon("spark")}${T("Créer la recette")}</button>`;
  if (k === "plan") f = `${fld("pl-a",T("Contraintes (facultatif)"),inp("pl-a","",`placeholder="${T("Végé, budget serré, soupers en 20 min…")}"`))}<button class="btn kid" type="submit">${icon("spark")}${T("Créer le menu")}</button>`;
  if (k === "ideas") f = `<div class="field"><label>${T("Où ?")}</label>${radios("id-where",[["dedans",T("À l'intérieur")],["dehors",T("Dehors")],["sortie",T("Sortie près de chez nous")]],"dedans")}</div>
      ${fld("id-city",T("Ville, code postal ou adresse (pour les sorties)"),addrInput("id-city", S.settings.city||"Montréal"))}
      <div class="field"><label>${T("Temps disponible")}</label>${radios("id-time",[["15",T("15 min")],["60",T("1 h")],["jour",T("Une journée")]],"60")}</div><button class="btn kid" type="submit">${icon("spark")}${T("Trouver des idées")}</button>`;
  if (k === "talk") f = `${fld("tk-a",T("Sujet"),inp("tk-a","",`placeholder="${T("Ex. : parler de la mort de grand-papa")}" required`))}<button class="btn kid" type="submit">${icon("spark")}${T("Préparer")}</button>`;
  return `<div class="create-grid">${Object.entries(CREATE_KINDS).map(([id,x]) => `<button class="create-tile" data-act="createKind" data-v="${id}" aria-pressed="${id===k}">${icon(x.ic)}<b>${T(x.l)}</b></button>`).join("")}</div>
    <div class="card"><div class="card-h"><div><span class="eyebrow">${esc(kidLine(c))}</span><h2>${T(CREATE_KINDS[k].l)}</h2></div></div><p class="small muted">${T(CREATE_KINDS[k].d)}</p>
    <form class="stack" data-form="aiCreate" style="gap:12px">${f}</form></div>
    <p class="tiny muted center">${T("Vous pouvez lancer une autre création pendant que celle-ci se prépare : suivez-les dans « En cours ».")}</p>`;
}

/* ---------- histoires ---------- */
const STORY_SCHEMA = {type:"OBJECT", properties:{title:{type:"STRING"}, chapterTitle:{type:"STRING"}, summary:{type:"STRING"},
  characters:{type:"ARRAY", items:{type:"OBJECT", properties:{name:{type:"STRING"}, desc:{type:"STRING"}, kind:{type:"STRING", enum:["enfant","adulte","aine","animal","creature","robot"]}}, required:["name","desc","kind"]}},
  segments:{type:"ARRAY", items:{type:"OBJECT", properties:{speaker:{type:"STRING"}, text:{type:"STRING"}}, required:["speaker","text"]}}}, required:["title","chapterTitle","summary","characters","segments"]};
/* niveau de lecture : Gemini adapte vocabulaire, phrases et intrigue */
const READ_LEVELS = [["", "Selon l'âge de l'enfant"], ["2-3", "Tout-petits (2-3 ans) : mots simples, répétitions"], ["4-5", "4-5 ans : phrases courtes, album illustré"], ["6-7", "6-7 ans : premiers lecteurs"], ["8-9", "8-9 ans : petit roman"], ["10-12", "10-12 ans : roman jeunesse"], ["13+", "Ados : roman pour adolescents"]];
const lvlSelect = (id, sel) => `<select class="inp" id="${id}">${READ_LEVELS.map(([v, l]) => `<option value="${v}" ${v===sel?"selected":""}>${T(l)}</option>`).join("")}</select>`;
const LVL_HINT = {"2-3":"livre pour tout-petits de 2-3 ans : phrases de 3 à 6 mots, mots très concrets du quotidien, beaucoup de répétitions et d'onomatopées, aucune ambiguïté",
  "4-5":"album pour 4-5 ans : phrases courtes, vocabulaire simple avec un ou deux mots nouveaux expliqués par le contexte, structure répétitive, émotions nommées",
  "6-7":"livre pour premiers lecteurs de 6-7 ans : phrases simples et courtes, mots faciles à décoder, dialogues fréquents, un seul fil d'intrigue",
  "8-9":"petit roman pour 8-9 ans : phrases variées, vocabulaire plus riche, un peu de suspense, humour",
  "10-12":"roman jeunesse pour 10-12 ans : vocabulaire riche, phrases complexes, personnages nuancés, intrigue avec rebondissements",
  "13+":"roman pour adolescents : style littéraire, thèmes plus matures (amitié, identité, courage), dialogues naturels"};
const lvlOfAge = m => m < 48 ? "2-3" : m < 72 ? "4-5" : m < 96 ? "6-7" : m < 120 ? "8-9" : m < 156 ? "10-12" : "13+";
function storyOpts(){
  const lib = (S.stories||[]).flatMap(s => s.characters), picked = checked("st-chars").map(id => lib.find(x => x.id === id)).filter(Boolean);
  return {hero:val("st-hero"), place:val("st-place"), theme:val("st-theme"), msg:val("st-msg"), moods:checked("st-mood"), len:+radio("st-len")||3, level:val("st-lvl"), newChars:val("st-new"), chars:picked.map(x => ({name:x.name, desc:x.desc, kind:x.kind, voice:x.voice}))};
}
const optsText = o => `Héros : ${o.hero||"au choix"}. Lieu : ${o.place||"au choix"}. Thème : ${o.theme||"au choix"}. Message : ${o.msg||"au choix"}. Ambiance : ${(o.moods||[]).join(", ")||"douce"}. Personnages à reprendre : ${o.chars?.map(c => `${c.name} (${c.desc})`).join("; ")||"aucun"}. Nouveaux personnages souhaités : ${o.newChars||"au choix"}.`;
async function storyIdeas(){
  const o = storyOpts(), c = aiKidNow(), box = $("#storyIdeas"); UI.storyOpts = o;
  box.innerHTML = `<p class="muted small"><span class="spin"></span> ${T("Gemini imagine des idées…")}</p>`;
  try {
    const schema = {type:"OBJECT", properties:{ideas:{type:"ARRAY", items:{type:"OBJECT", properties:{title:{type:"STRING"}, pitch:{type:"STRING"}, characters:{type:"STRING"}}, required:["title","pitch","characters"]}}}, required:["ideas"]};
    const r = await gemini({tier:"fast", json:schema, temperature:0.9, contents:[{role:"user", parts:[{text:`Propose 3 idées d'histoire du soir différentes pour ${kidLine(c)}. ${optsText(o)} Pour chacune : un titre, un résumé de 2 à 3 phrases (début, problème, fin apaisante) et les personnages principaux. En ${LANG==="en"?"anglais":"français"}.`}]}]});
    UI.storyIdeasList = parseJSON(r.text).ideas || [];
    box.innerHTML = `<span class="eyebrow">${T("Choisissez une idée (modifiable)")}</span>` + UI.storyIdeasList.map((x,i) => `<button type="button" class="idea" data-act="storyPick" data-v="${i}"><b>${esc(x.title)}</b><span class="small">${esc(x.pitch)}</span><span class="tiny muted">${esc(x.characters)}</span></button>`).join("") + `<div id="storyPlan"></div>`;
  } catch(e){ box.innerHTML = `<p class="small" style="color:var(--danger)">${esc(e.message)}</p>`; }
}
function storyPick(i){
  const x = UI.storyIdeasList[+i]; if (!x) return;
  $("#storyPlan").innerHTML = `<div class="stack" style="gap:10px;margin-top:10px">${fld("st-plan",T("Plan de l'histoire (modifiez librement)"),`<textarea class="inp" id="st-plan" rows="4">${esc(`${x.title}\n${x.pitch}\n${T("Personnages")} : ${x.characters}`)}</textarea>`)}<button type="button" class="btn kid" data-act="storyWrite">${icon("spark")}${T("Écrire le chapitre 1")}</button></div>`;
  $("#st-plan").scrollIntoView({block:"center", behavior:"smooth"});
}
function storyGen(story, plan, direction, over = {}){
  const c = kidById(story?.kid) || aiKidNow(), o = {...(story?.opts || UI.storyOpts || storyOpts()), ...over}, n = (story?.chapters.length || 0) + 1;
  const words = Math.round((o.len||3) * 120);
  const title = story ? T("{t} · chapitre {n}",{t:story.title, n}) : T("Nouvelle histoire");
  return aiJob("story", title, async () => {
    const prev = story ? `Histoire existante « ${story.title} ». Personnages (garde leurs noms, caractères et façons de parler) : ${story.characters.filter(x => x.id !== "narr").map(x => `${x.name} — ${x.desc}`).join(" ; ")}.\nRésumé des chapitres précédents :\n${story.chapters.map(ch => `${ch.n}. ${ch.title} : ${ch.summary}`).join("\n")}\nFin du dernier chapitre : ${story.chapters.at(-1).segs.slice(-3).map(s => s.t).join(" ")}\nÉcris le chapitre ${n}, qui continue l'histoire. ${direction ? `Direction voulue : ${direction}.` : ""}` : `Plan : ${plan || "à inventer"}`;
    const r = await gemini({tier:"fast", json:STORY_SCHEMA, temperature:0.85, timeout:90000, contents:[{role:"user", parts:[{text:`Écris une histoire du soir pour ${kidLine(c)} (rythme apaisant, fin calme). Niveau du texte : ${LVL_HINT[o.level || lvlOfAge(c && !isPrenatal(c) ? ageMonths(c) : 48)]}. Respecte strictement ce niveau de langue. ${optsText(o)}\n${prev}\nLongueur : environ ${words} mots. Découpe le texte en segments : la narration avec speaker « Narrateur », chaque réplique d'un personnage dans un segment séparé avec son nom exact comme speaker (sans tiret ni guillemets, ni « dit-il » dans la réplique). Liste dans characters tous les personnages qui parlent (pas le narrateur), avec une description courte et leur type. summary : 2 phrases qui résument ce chapitre. En ${LANG==="en"?"anglais":"français"}.`}]}]});
    const out = parseJSON(r.text);
    const st = story || {id:uid(), kid:c?.id||null, title:out.title, opts:o, characters:[{id:"narr", name:T("Narrateur"), desc:"", kind:"narrateur", voice:autoVoice("narrateur", 0)}], chapters:[], fav:false, at:Date.now(), engine:"device"};
    if (!story){ (o.chars||[]).forEach((ch,i) => st.characters.push({id:uid(), name:ch.name, desc:ch.desc, kind:ch.kind||"enfant", voice:ch.voice || autoVoice(ch.kind, i+1)})); }
    (out.characters||[]).forEach(ch => { if (!st.characters.some(x => x.name.toLowerCase() === ch.name.toLowerCase())) st.characters.push({id:uid(), name:ch.name, desc:ch.desc, kind:ch.kind, voice:autoVoice(ch.kind, st.characters.length)}); });
    const idOf = name => { name = String(name||"").trim(); if (!name || /narra/i.test(name)) return "narr";
      let ch = st.characters.find(x => x.name.toLowerCase() === name.toLowerCase()); if (!ch){ ch = {id:uid(), name, desc:name === o.hero ? T("le héros") : "", kind:"enfant", voice:autoVoice("enfant", st.characters.length)}; st.characters.push(ch); } return ch.id; };
    st.chapters.push({n, title:out.chapterTitle, summary:out.summary, segs:(out.segments||[]).map(s => ({c:idOf(s.speaker), t:s.text})), at:Date.now(), direction:direction||""});
    S.stories = S.stories || []; if (!story) S.stories.unshift(st);
    const e = aiHist("story", `${st.title} · ${T("chapitre {n}",{n})}`, st.chapters.at(-1).segs.map(s => s.t).join("\n\n"), {kid:st.kid, storyId:st.id}); save(); driveQ("story", st.id);
    return {histId:e.id, open:() => storyOpen(st.id)};
  }, {kid:c?.id, open:() => storyOpen((story||S.stories[0]).id)});
}
const GV = {narrateur:["Sulafat","Achernar","Vindemiatrix"], enfant:["Leda","Puck","Laomedeia","Zephyr"], adulte:["Charon","Kore","Iapetus","Achird"], aine:["Gacrux","Sadaltager"], animal:["Fenrir","Sadachbia","Autonoe"], creature:["Algenib","Enceladus","Umbriel"], robot:["Schedar","Rasalgethi"]};
const PITCH = {narrateur:1, enfant:1.35, adulte:0.95, aine:0.8, animal:1.2, creature:0.7, robot:0.85};
function autoVoice(kind = "enfant", i = 0){ const list = GV[kind] || GV.enfant; return {gv:list[i % list.length], pitch:PITCH[kind] ?? 1, rate:kind === "narrateur" ? 0.92 : 1, dv:""}; }
const CH_COLORS = ["lilac","peach","mint","sky","butter","rose","teal","coral"];
const chColor = (st, id) => id === "narr" ? "surface2" : CH_COLORS[st.characters.findIndex(x => x.id === id) % CH_COLORS.length];

function storiesPane(){
  const mode = UI.stMode || "stories", fav = !!UI.stFav, list = (S.stories||[]).filter(s => !fav || s.fav);
  let h = `<div class="card"><div class="row between" style="flex-wrap:wrap;gap:8px"><div class="seg" style="width:auto"><button data-act="stMode" data-v="stories" aria-pressed="${mode==="stories"}">${T("Par histoire")}</button><button data-act="stMode" data-v="chars" aria-pressed="${mode==="chars"}">${T("Personnages")}</button></div><div class="row"><button class="btn sm ghost" data-act="stFav" aria-pressed="${fav}">${icon("star")}${T("Favoris")}</button><button class="btn sm kid" data-act="createKind" data-v="story">${icon("plus")}${T("Nouvelle")}</button></div></div></div>`;
  if (!list.length) return h + `<div class="card">${empty("moon", T("Vos histoires apparaîtront ici, avec leurs chapitres et leurs personnages."))}</div>`;
  if (mode === "stories") return h + list.map(s => `<div class="story-row"><button class="card story-card" data-act="storyOpen" data-v="${s.id}"><div class="row between"><div class="grow" style="min-width:0"><span class="eyebrow">${s.kid&&kidById(s.kid)?esc(kidById(s.kid).nick||kidById(s.kid).name)+" · ":""}${T("{n} chapitre(s)",{n:s.chapters.length})}</span><h3>${esc(s.title)}</h3></div>${s.fav?icon("star").replace('fill="none"','fill="currentColor"').replace("<svg",'<svg style="width:20px;height:20px;color:var(--butter-ink)"'):""}</div><p class="small muted clamp2">${esc(s.chapters.at(-1)?.summary||"")}</p><div class="row" style="flex-wrap:wrap;gap:6px">${s.characters.filter(x => x.id !== "narr").map(x => `<span class="chip ${chColor(s, x.id)}">${esc(x.name)}</span>`).join("")}</div></button><button class="story-next" data-act="storyNextSheet" data-v="${s.id}" aria-label="${T("Chapitre suivant")}">${icon("spark")}<span>${T("Chapitre {n}",{n:s.chapters.length+1})}</span></button></div>`).join("");
  return h + list.map(s => `<div class="card"><div class="card-h"><h3>${esc(s.title)}</h3><button class="btn sm ghost" data-act="storyOpen" data-v="${s.id}">${T("Ouvrir")}</button></div><div class="list">${s.characters.map(x => `<button class="li" data-act="charForm" data-v="${s.id}|${x.id}"><div class="ic" style="background:var(--${chColor(s,x.id)}-bg, var(--surface2));color:var(--${chColor(s,x.id)}-ink, var(--ink))">${icon(x.id==="narr"?"book":"user")}</div><div class="grow"><div class="li-title">${esc(x.name)}${x.fav?" ★":""}</div><div class="small muted">${esc(x.desc||T("Narrateur"))} · ${T("voix")} ${esc((s.engine==="gemini"?x.voice?.gv:voiceLabel(x.voice?.dv))||T("auto"))}</div></div>${icon("sliders")}</button>`).join("")}</div></div>`).join("");
}
function storyOpen(id){
  const s = (S.stories||[]).find(x => x.id === id); if (!s) return;
  UI.storyId = id;
  const playing = PL.story === id && PL.on;
  sheet(`${sheetHead(esc(s.title))}<div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn sm ghost" data-act="storyFav" data-v="${id}">${icon("star")}${s.fav?T("Favori ✓"):T("Favori")}</button>
      <div class="seg" style="width:auto"><button data-act="storyEngine" data-v="device" aria-pressed="${s.engine!=="gemini"}">${T("Voix de l'appareil")}</button><button data-act="storyEngine" data-v="gemini" aria-pressed="${s.engine==="gemini"}">${T("Voix Gemini")}</button></div></div>
    <p class="tiny muted">${s.engine==="gemini" ? T("Voix naturelles générées par Gemini (quelques secondes par réplique, utilise votre clé).") : T("Voix intégrées au téléphone : instantanées et gratuites. Réglez la voix de chaque personnage ci-dessous.")}</p>
    <div class="row" style="flex-wrap:wrap;gap:6px">${s.characters.map(x => `<button class="chip ${chColor(s,x.id)}" data-act="charForm" data-v="${id}|${x.id}">${icon("sliders").replace("<svg",'<svg style="width:13px;height:13px;vertical-align:-2px"')} ${esc(x.name)}</button>`).join("")}</div>
    ${s.chapters.map((ch, ci) => `<div class="chapter"><div class="row between"><h3>${T("Chapitre {n}",{n:ch.n})} · ${esc(ch.title)}</h3><button class="btn sm kid" data-act="storyPlay" data-v="${id}|${ci}">${icon(playing && PL.ch === ci ? "pause" : "play")}${playing && PL.ch === ci ? T("Arrêter") : T("Écouter")}</button></div>
      ${ch.img ? `<img class="story-img" data-stimg="${ch.img}" alt="${esc(ch.title)}">` : ""}<div class="row" style="gap:6px"><button class="btn sm ghost" data-act="storyImg" data-v="${id}|${ci}">${icon("camera")}${ch.img?T("Nouvelle image"):T("Illustrer ce chapitre")}</button></div>
      ${ch.segs.map((sg, si) => `<p class="seg-line ${sg.c==="narr"?"narr":""}" id="sg-${ci}-${si}">${sg.c!=="narr"?`<b class="who" style="color:var(--${chColor(s,sg.c)}-ink)">${esc(s.characters.find(x=>x.id===sg.c)?.name||"")}</b> `:""}${esc(sg.t)}</p>`).join("")}</div>`).join("")}
    <div class="card tint"><h3>${T("Chapitre suivant")}</h3><div class="stack" style="gap:10px">${fld("st-dir",T("Où va l'histoire ? (facultatif)"),inp("st-dir","",`placeholder="${T("Ex. : ils trouvent une carte au trésor")}"`))}
      <div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-act="storyNextIdeas" data-v="${id}">${icon("bulb")}${T("Proposer des suites")}</button><button class="btn kid" data-act="storyNext" data-v="${id}">${icon("spark")}${T("Écrire le chapitre {n}",{n:s.chapters.length+1})}</button></div><div id="nextIdeas"></div></div></div>
    <div class="row"><button class="btn ghost" data-act="storyShare" data-v="${id}">${icon("share")}${T("Partager")}</button>${feat("memories")?`<button class="btn ghost" data-act="storyKeep" data-v="${id}">${icon("star")}${T("Garder dans les souvenirs")}</button>`:""}<button class="btn danger" data-act="storyDel" data-v="${id}">${icon("trash")}</button></div>`, "wide");
  $$("#layer img[data-stimg]").forEach(async im => { const d = await PhotoDB.get(im.dataset.stimg); if (d) im.src = d; else im.remove(); });
}
/* page « chapitre suivant » : précisions ou surprise */
function storyNextSheet(id){
  const s = S.stories.find(x => x.id === id); if (!s) return; const o = s.opts || {};
  sheet(`<form class="stack" data-form="storyNextGo" data-id="${id}" style="gap:12px">${sheetHead(T("{t} · chapitre {n}",{t:esc(s.title), n:s.chapters.length+1}))}
    <p class="small muted clamp2">${esc(s.chapters.at(-1)?.summary||"")}</p>
    ${fld("sn-dir",T("Où va l'histoire ? (facultatif)"),inp("sn-dir","",`placeholder="${T("Ex. : ils trouvent une carte au trésor")}"`))}
    <div id="nextIdeas"></div><button type="button" class="btn sm ghost" data-act="storyNextIdeas" data-v="${id}">${icon("bulb")}${T("Proposer des suites")}</button>
    ${fld("sn-new",T("Nouveau personnage (facultatif)"),inp("sn-new","",`placeholder="${T("Ex. : un hibou qui a peur du noir")}"`))}
    <div class="field"><label>${T("Ambiance")}</label>${checks("sn-mood", MOODS.map(x => [x, T(x)]), o.moods?.length ? o.moods : ["Doux"])}</div>
    <div class="field"><label>${T("Longueur")}</label>${radios("sn-len",[["3",T("3 minutes")],["6",T("6 minutes")],["10",T("10 minutes")]], String(o.len||3))}</div>
    ${fld("sn-lvl",T("Niveau du livre (vocabulaire et style)"),lvlSelect("sn-lvl", o.level||""))}
    <label class="switch"><input type="checkbox" id="sn-img"><span class="tg"></span><span class="grow">${T("Illustrer le chapitre (image)")}</span></label>
    <div class="row" style="flex-wrap:wrap"><button type="button" class="btn ghost" data-act="storySurprise" data-v="${id}">${icon("auto")}${T("Surprise !")}</button><button class="btn kid grow" type="submit">${icon("spark")}${T("Écrire le chapitre {n}",{n:s.chapters.length+1})}</button></div></form>`);
}
function storyNextRun(id, surprise){
  const s = S.stories.find(x => x.id === id); if (!s) return;
  const dir = surprise ? T("surprends-nous : une suite inattendue mais douce") : [val("sn-dir"), val("sn-new") ? `introduis ce nouveau personnage : ${val("sn-new")}` : ""].filter(Boolean).join(" ; ");
  const over = surprise ? {} : {moods:checked("sn-mood"), len:+radio("sn-len") || s.opts?.len || 3, level:val("sn-lvl")}, img = !!$("#sn-img")?.checked;
  closeSheet(); const n = s.chapters.length; if (!surprise){ s.opts = {...(s.opts||{}), ...over}; save(); }
  const p = storyGen(s, null, dir, over);
  if (img) Promise.resolve(p).then(() => { const t = setInterval(() => { if (s.chapters.length > n){ clearInterval(t); storyImage(id, n, true); } }, 1500); setTimeout(() => clearInterval(t), 180000); });
}
/* ---------- images d'histoire (modèle image de Gemini) ---------- */
async function imageModels(){
  if (S.settings.ai.imgModels?.at && Date.now() - S.settings.ai.imgModels.at < 7*864e5) return S.settings.ai.imgModels.list;
  let list = [];
  try { const d = await (await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {headers:{"x-goog-api-key":aiKey()}})).json();
    list = (d.models||[]).filter(m => /image/i.test(m.name) && /gemini/i.test(m.name) && (m.supportedGenerationMethods||[]).includes("generateContent")).map(m => m.name.replace(/^models\//, ""))
      .sort((a, b) => (parseFloat(b.match(/(\d+(\.\d+)?)/)?.[1])||0) - (parseFloat(a.match(/(\d+(\.\d+)?)/)?.[1])||0)); } catch(e){}
  list = [...new Set([...list, "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image"])];
  S.settings.ai.imgModels = {at:Date.now(), list}; save(); return list;
}
async function storyLooks(s){
  const need = s.characters.filter(x => x.id !== "narr" && !x.look); if (!need.length) return;
  const schema = {type:"OBJECT", properties:{looks:{type:"ARRAY", items:{type:"OBJECT", properties:{name:{type:"STRING"}, look:{type:"STRING"}}, required:["name","look"]}}}, required:["looks"]};
  const r = await gemini({tier:"fast", json:schema, temperature:0.4, contents:[{role:"user", parts:[{text:`Histoire pour enfants « ${s.title} ». Pour chaque personnage, écris une description visuelle fixe et précise en anglais (espèce, âge, taille, couleurs de peau/pelage/cheveux, coiffure, vêtements et accessoires toujours portés), pour qu'un illustrateur le dessine toujours pareil. Personnages : ${need.map(x => `${x.name} (${x.kind}) : ${x.desc}`).join(" ; ")}. Résumé : ${s.chapters.map(c => c.summary).join(" ")}`}]}]});
  (parseJSON(r.text).looks||[]).forEach(l => { const ch = s.characters.find(x => x.name.toLowerCase() === String(l.name).toLowerCase()); if (ch) ch.look = l.look; });
  need.forEach(ch => { if (!ch.look) ch.look = ch.desc || ch.name; }); s.style = s.style || "soft watercolor children's picture book illustration, warm gentle light, rounded friendly shapes"; save();
}
function storyImage(sid, ci, quiet){
  const s = S.stories.find(x => x.id === sid), ch = s?.chapters[+ci]; if (!ch) return;
  return aiJob("story", T("Image · {t}",{t:ch.title}), async () => {
    await storyLooks(s);
    const prevCh = s.chapters.slice(0, +ci).reverse().find(x => x.img) || s.chapters.find((x, i) => i !== +ci && x.img), ref = prevCh ? await PhotoDB.get(prevCh.img) : null;
    const who = s.characters.filter(x => x.id !== "narr" && ch.segs.some(sg => sg.c === x.id) || x.desc === T("le héros")).filter(x => x.look);
    const cast = (who.length ? who : s.characters.filter(x => x.id !== "narr" && x.look)).slice(0, 5);
    const prompt = `${s.style}. One single illustration for the chapter "${ch.title}" of the bedtime story "${s.title}". Scene: ${ch.summary}. Characters (draw them EXACTLY like this, same look in every picture): ${cast.map(x => `${x.name}: ${x.look}`).join(" | ")}. ${ref ? "Keep the characters' appearance and the art style identical to the reference image provided." : ""} No text, no letters, no words in the image. Child-friendly, calm.`;
    const parts = [...(ref ? [{inline_data:{mime_type:"image/jpeg", data:ref.split(",")[1]}}] : []), {text:prompt}];
    let lastErr;
    for (const model of await imageModels()){
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {method:"POST", headers:{"Content-Type":"application/json", "x-goog-api-key":aiKey()}, body:JSON.stringify({contents:[{role:"user", parts}], generationConfig:{responseModalities:["IMAGE","TEXT"]}})});
        const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || `Gemini ${r.status}`);
        const img = (d.candidates?.[0]?.content?.parts||[]).find(p => p.inlineData || p.inline_data); const id2 = img?.inlineData || img?.inline_data;
        if (!id2?.data) throw new Error(d.candidates?.[0]?.finishReason || T("pas d'image"));
        const small = await shrinkImage(`data:${id2.mimeType||id2.mime_type||"image/png"};base64,${id2.data}`, 1024, 0.85);
        if (ch.img) await PhotoDB.del(ch.img).catch(() => {});
        ch.img = "stimg-" + uid(); await PhotoDB.put(ch.img, small); ch.imgModel = model; save(); driveQ("story", sid);
        return {open:() => storyOpen(sid)};
      } catch(e){ lastErr = e; AI_LAST_ERR = `${model} : ${e.message}`.slice(0, 300); if (/API_KEY_INVALID|PERMISSION_DENIED/i.test(e.message)) break; }
    }
    throw new Error(T("Image impossible : {e}",{e:lastErr?.message||"?"}));
  }, {kid:s.kid, open:() => storyOpen(sid)});
}
async function storyNextIdeas(id){
  const s = S.stories.find(x => x.id === id), box = $("#nextIdeas");
  box.innerHTML = `<p class="small muted"><span class="spin"></span> ${T("Gemini imagine des suites…")}</p>`;
  try {
    const schema = {type:"OBJECT", properties:{ideas:{type:"ARRAY", items:{type:"STRING"}}}, required:["ideas"]};
    const r = await gemini({tier:"fast", json:schema, temperature:0.9, contents:[{role:"user", parts:[{text:`Histoire « ${s.title} ». Personnages : ${s.characters.filter(x=>x.id!=="narr").map(x=>x.name).join(", ")}. Résumé : ${s.chapters.map(c => c.summary).join(" ")}. Propose 3 directions différentes pour le prochain chapitre, une phrase chacune. En ${LANG==="en"?"anglais":"français"}.`}]}]});
    box.innerHTML = (parseJSON(r.text).ideas||[]).map(x => `<button type="button" class="idea" data-act="storyDir" data-v="${esc(x)}"><span class="small">${esc(x)}</span></button>`).join("");
  } catch(e){ box.innerHTML = `<p class="small" style="color:var(--danger)">${esc(e.message)}</p>`; }
}
function charForm(v){
  const [sid, cid] = v.split("|"), s = S.stories.find(x => x.id === sid), ch = s?.characters.find(x => x.id === cid); if (!ch) return;
  const vc = ch.voice || autoVoice(ch.kind); stopPlay();
  TTS.voices().then(list => { const sel = $("#cv-dv"); if (sel) sel.innerHTML = `<option value="">${T("Automatique")}</option>` + list.map(x => `<option value="${esc(x.id)}" ${x.id===vc.dv?"selected":""}>${esc(x.name)} (${esc(x.lang)})</option>`).join(""); });
  sheet(`<form class="stack" data-form="charSave" data-id="${v}" style="gap:12px">${sheetHead(esc(ch.name))}
    ${cid==="narr"?"":`${fld("cv-name",T("Nom"),inp("cv-name",ch.name,"required"))}${fld("cv-desc",T("Description"),inp("cv-desc",ch.desc||""))}`}
    <label class="switch"><input type="checkbox" id="cv-fav" ${ch.fav?"checked":""}><span class="tg"></span><span class="grow">${T("Personnage favori")}</span></label>
    <h3>${T("Voix de l'appareil")}</h3>${fld("cv-dv",T("Voix"),`<select class="inp" id="cv-dv"><option value="">${T("Chargement…")}</option></select>`)}
    <div class="fgrid">${fld("cv-pitch",T("Hauteur"),`<input type="range" id="cv-pitch" min="0.5" max="2" step="0.05" value="${vc.pitch??1}">`)}${fld("cv-rate",T("Vitesse"),`<input type="range" id="cv-rate" min="0.6" max="1.4" step="0.05" value="${vc.rate??1}">`)}</div>
    <h3>${T("Voix Gemini")}</h3>${fld("cv-gv",T("Voix"),`<select class="inp" id="cv-gv">${GEMINI_VOICES.map(([n,d]) => `<option value="${n}" ${n===vc.gv?"selected":""}>${n} · ${T(d)}</option>`).join("")}</select>`)}
    ${fld("cv-style",T("Façon de parler (Gemini, facultatif)"),inp("cv-style",vc.style||"",`placeholder="${T("Ex. : voix douce et enjouée, un peu essoufflée")}"`))}
    <div class="row"><button type="button" class="btn ghost" data-act="charTest" data-v="device">${icon("play")}${T("Tester (appareil)")}</button><button type="button" class="btn ghost" data-act="charTest" data-v="gemini">${icon("play")}${T("Tester (Gemini)")}</button></div>
    <button class="btn kid" type="submit">${T("Enregistrer")}</button></form>`);
}
const readVoice = () => ({dv:val("cv-dv"), pitch:+$("#cv-pitch").value, rate:+$("#cv-rate").value, gv:val("cv-gv"), style:val("cv-style")});

/* ---------- synthèse vocale : appareil (plugin natif ou Web Speech) et Gemini ---------- */
const GEMINI_VOICES = [["Sulafat","Chaleureuse"],["Achernar","Douce"],["Vindemiatrix","Gentille"],["Leda","Jeune"],["Puck","Enjouée"],["Laomedeia","Enjouée"],["Zephyr","Lumineuse"],["Autonoe","Lumineuse"],["Kore","Ferme"],["Charon","Posée"],["Iapetus","Claire"],["Achird","Amicale"],["Gacrux","Mûre"],["Sadaltager","Savante"],["Fenrir","Excitée"],["Sadachbia","Vive"],["Algenib","Rocailleuse"],["Enceladus","Soufflée"],["Umbriel","Décontractée"],["Schedar","Égale"],["Rasalgethi","Informative"],["Aoede","Légère"],["Callirrhoe","Calme"],["Despina","Fluide"],["Algieba","Fluide"],["Orus","Ferme"],["Erinome","Claire"],["Pulcherrima","Directe"],["Zubenelgenubi","Décontractée"],["Alnilam","Ferme"]];
const voiceLabel = id => (TTS._cache||[]).find(x => x.id === id)?.name || "";
const TTS = {
  _cache:null,
  plugin(){ return Native.P("TextToSpeech"); },
  async voices(){
    if (this._cache) return this._cache;
    const lang = LANG === "en" ? "en" : "fr", p = this.plugin(); let list = [];
    if (p){ try { const r = await p.getSupportedVoices(); list = (r.voices||[]).map((v,i) => ({id:String(i), name:v.name, lang:v.lang})); } catch(e){} }
    else if ("speechSynthesis" in window){
      let v = speechSynthesis.getVoices(); if (!v.length) v = await new Promise(res => { speechSynthesis.onvoiceschanged = () => res(speechSynthesis.getVoices()); setTimeout(() => res(speechSynthesis.getVoices()), 1500); });
      list = v.map(x => ({id:x.voiceURI, name:x.name, lang:x.lang}));
    }
    const pref = list.filter(x => (x.lang||"").toLowerCase().startsWith(lang)); this._cache = pref.length ? pref : list; return this._cache;
  },
  async speakDevice(text, vc = {}){
    const lang = LANG === "en" ? "en-CA" : "fr-CA", p = this.plugin();
    if (p){ const opt = {text, lang, rate:vc.rate ?? 1, pitch:vc.pitch ?? 1, volume:1, category:"playback"}; if (vc.dv !== "" && vc.dv != null) opt.voice = +vc.dv; return p.speak(opt); }
    if (!("speechSynthesis" in window)) throw new Error(T("La synthèse vocale n'est pas disponible ici"));
    return new Promise(res => { const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = vc.rate ?? 1; u.pitch = vc.pitch ?? 1; const v = speechSynthesis.getVoices().find(x => x.voiceURI === vc.dv); if (v) u.voice = v; u.onend = res; u.onerror = res; speechSynthesis.speak(u); });
  },
  stopDevice(){ const p = this.plugin(); if (p){ try { p.stop(); } catch(e){} } else if ("speechSynthesis" in window) speechSynthesis.cancel(); },
  _audio:new Map(),
  async gemini(text, vc = {}){
    const key = `${vc.gv}|${vc.style||""}|${text}`; if (this._audio.has(key)) return this._audio.get(key);
    const pr = geminiTTS(text, vc.gv || "Sulafat", vc.style); this._audio.set(key, pr); pr.catch(() => this._audio.delete(key)); return pr;
  },
};
const b64bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
function pcmToWav(pcm, rate = 24000){
  const h = new ArrayBuffer(44), v = new DataView(h), w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o+i, ch.charCodeAt(0)));
  w(0,"RIFF"); v.setUint32(4, 36 + pcm.length, true); w(8,"WAVE"); w(12,"fmt "); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,rate,true); v.setUint32(28,rate*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,"data"); v.setUint32(40, pcm.length, true);
  return new Blob([h, pcm], {type:"audio/wav"});
}
function findAudio(o){ if (!o || typeof o !== "object") return null; if (typeof o.data === "string" && o.data.length > 200 && (/audio/.test(o.type||o.mime_type||o.mimeType||"") || o.type === "audio")) return o; for (const k in o){ const r = findAudio(o[k]); if (r) return r; } return null; }
async function geminiTTS(text, voice, style){
  const key = aiKey(); if (!key) throw new Error(T("Ajoutez d'abord votre clé Gemini dans l'Assistant."));
  let lastErr;
  for (const model of ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"]){
    try {
      const content = {type:"text", text}; if (style) content.annotations = [{type:"speech_metadata", style}];
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {method:"POST", headers:{"Content-Type":"application/json", "x-goog-api-key":key}, body:JSON.stringify({model, input:[{type:"user_input", content:[content]}], response_format:{type:"audio"}, generation_config:{speech_config:[{voice}]}})});
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error?.message || `TTS ${r.status}`);
      const a = findAudio(d); if (!a) throw new Error("TTS : pas d'audio");
      const bytes = b64bytes(a.data), isWav = bytes[0] === 82 && bytes[1] === 73;
      return URL.createObjectURL(isWav ? new Blob([bytes], {type:"audio/wav"}) : pcmToWav(bytes));
    } catch(e){ lastErr = e; }
    try { // ancienne interface generateContent
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {method:"POST", headers:{"Content-Type":"application/json", "x-goog-api-key":key}, body:JSON.stringify({contents:[{parts:[{text: style ? `${style} : ${text}` : text}]}], generationConfig:{responseModalities:["AUDIO"], speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}})});
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error?.message || `TTS ${r.status}`);
      const part = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData); if (!part) throw new Error("TTS : pas d'audio");
      const bytes = b64bytes(part.inlineData.data), rate = +(part.inlineData.mimeType.match(/rate=(\d+)/)||[])[1] || 24000;
      return URL.createObjectURL(bytes[0] === 82 && bytes[1] === 73 ? new Blob([bytes], {type:"audio/wav"}) : pcmToWav(bytes, rate));
    } catch(e){ lastErr = e; }
  }
  throw new Error(aiFriendly(lastErr));
}
/* lecteur : enchaîne les répliques avec la voix de chaque personnage */
const PL = {on:false, story:null, ch:0, i:0, audio:null, run:0};
function stopPlay(){ PL.on = false; PL.run++; TTS.stopDevice(); if (PL.audio){ PL.audio.pause(); PL.audio = null; } $$(".seg-line.now").forEach(e => e.classList.remove("now")); }
async function playChapter(sid, ci){
  stopPlay(); const s = S.stories.find(x => x.id === sid), ch = s?.chapters[ci]; if (!ch) return;
  Object.assign(PL, {on:true, story:sid, ch:ci, i:0}); const run = ++PL.run; storyOpenKeepScroll(sid);
  const vcOf = sg => (s.characters.find(x => x.id === sg.c) || s.characters[0]).voice || {};
  for (let i = 0; i < ch.segs.length && PL.on && PL.run === run; i++){
    PL.i = i; $$(".seg-line.now").forEach(e => e.classList.remove("now")); const el = $(`#sg-${ci}-${i}`); if (el){ el.classList.add("now"); el.scrollIntoView({block:"center", behavior:"smooth"}); }
    const sg = ch.segs[i], vc = vcOf(sg);
    try {
      if (s.engine === "gemini"){
        const url = await TTS.gemini(sg.t, vc); if (ch.segs[i+1]) TTS.gemini(ch.segs[i+1].t, vcOf(ch.segs[i+1])).catch(() => {});
        if (!PL.on || PL.run !== run) break;
        await new Promise(res => { const a = new Audio(url); PL.audio = a; a.onended = res; a.onerror = res; a.play().catch(res); });
      } else await TTS.speakDevice(sg.t, vc);
    } catch(e){ toast(e.message); break; }
  }
  if (PL.run === run){ PL.on = false; $$(".seg-line.now").forEach(e => e.classList.remove("now")); storyOpenKeepScroll(sid); }
}
function storyOpenKeepScroll(sid){ const sh = $("#layer .sheet"), top = sh?.scrollTop; if (UI.storyId === sid && sh){ storyOpen(sid); const n = $("#layer .sheet"); if (n) n.scrollTop = top; } }

/* ---------- recettes ---------- */
const RECIPE_SCHEMA = {type:"OBJECT", properties:{title:{type:"STRING"}, labels:{type:"ARRAY", items:{type:"STRING"}}, servings:{type:"NUMBER"}, minutes:{type:"NUMBER"}, ingredients:{type:"ARRAY", items:{type:"STRING"}}, steps:{type:"ARRAY", items:{type:"STRING"}}, kidTips:{type:"STRING"}, allergens:{type:"ARRAY", items:{type:"STRING"}}, nut:NUT_SCHEMA}, required:["title","servings","minutes","ingredients","steps","nut"]};
function recipeJob(want, label, minutes, servings){
  const c = aiKidNow();
  return aiJob("recipe", T("Recette : {w}",{w:want.slice(0,40)}), async () => {
    const r = await gemini({tier:"fast", json:RECIPE_SCHEMA, temperature:0.7, contents:[{role:"user", parts:[{text:`Crée une recette familiale (${label||"repas"}) : ${want}. Pour ${servings||4} portions, ${minutes||30} minutes maximum, adaptée à ${kidLine(c)} (textures sûres, peu de sel, pas de sucre ajouté avant 2 ans, pas de miel avant 1 an). Allergies à éviter : ${c?.allergies||"aucune connue"}. Guide alimentaire canadien. Ingrédients avec quantités en unités canadiennes. Étapes courtes. labels parmi : ${MEAL_LABELS.join(", ")}. kidTips : comment l'adapter ou faire participer l'enfant. nut = nutriments pour UNE portion. En ${LANG==="en"?"anglais":"français"}.`}]}]});
    const rec = {...parseJSON(r.text), id:uid(), kid:c?.id||null, at:Date.now()}; if (label && !(rec.labels||[]).includes(label)) rec.labels = [label, ...(rec.labels||[])];
    const e = aiHist("recipe", rec.title, recipeText(rec), {recipe:rec, kid:c?.id||null}); return {histId:e.id};
  }, {kid:c?.id});
}
const recipeText = r => `${r.title}\n${r.servings} ${T("portions")} · ${r.minutes} min\n\n${T("Ingrédients")} :\n${(r.ingredients||[]).map(i => "- " + i).join("\n")}\n\n${T("Étapes")} :\n${(r.steps||[]).map((s,i) => `${i+1}. ${s}`).join("\n")}${r.kidTips?`\n\n${r.kidTips}`:""}`;
function recipeSheet(rec, histId){
  const saved = (S.recipes||[]).find(x => x.id === rec.id); UI.recipeView = rec;
  const labels = saved?.labels || rec.labels || [];
  sheet(`${sheetHead(esc(rec.title))}<div class="row" style="flex-wrap:wrap;gap:6px"><span class="chip">${icon("clock")} ${rec.minutes} min</span><span class="chip">${rec.servings} ${T("portions")}</span>${rec.nut?.kcal?`<span class="chip peach">${Math.round(rec.nut.kcal)} kcal · ${Math.round(rec.nut.prot||0)} g ${T("prot.")} / ${T("portion")}</span>`:""}${(rec.allergens||[]).map(a => `<span class="chip butter">${esc(a)}</span>`).join("")}</div>
    <div class="field"><label>${T("Étiquettes")}</label>${checks("rc-lab", MEAL_LABELS.map(x => [x, T(x)]), labels)}</div>
    <h3>${T("Ingrédients")}</h3><ul class="ing">${(rec.ingredients||[]).map(i => `<li>${esc(i)}</li>`).join("")}</ul>
    <h3>${T("Étapes")}</h3><ol class="steps">${(rec.steps||[]).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    ${rec.kidTips?`<div class="banner soft">${icon("kid")}<div class="small">${esc(rec.kidTips)}</div></div>`:""}
    <div class="row" style="flex-wrap:wrap"><button class="btn kid" data-act="recipeSave">${icon("star")}${saved?T("Mettre à jour"):T("Garder en favori")}</button>${child()&&ageMonths(child())>=6?`<button class="btn ghost" data-act="recipeLog">${icon("spoon")}${T("Noter comme repas")}</button>`:""}<button class="btn ghost" data-act="recipeShare">${icon("share")}${T("Partager")}</button>${saved?`<button class="btn danger" data-act="recipeDel" data-v="${rec.id}">${icon("trash")}</button>`:""}</div>`, "wide");
}
function recipesPane(){
  const lab = UI.rcLabel || "all", q = (UI.rcQ||"").toLowerCase(), all = S.recipes||[];
  const list = all.filter(r => (lab === "all" || (r.labels||[]).includes(lab)) && (!q || r.title.toLowerCase().includes(q) || (r.ingredients||[]).join(" ").toLowerCase().includes(q)));
  return `<div class="card"><div class="card-h"><h2>${T("Recettes favorites")}</h2><button class="btn sm kid" data-act="createKind" data-v="recipe">${icon("plus")}${T("Nouvelle (IA)")}</button></div>
    <div class="pick"><button data-act="rcLabel" data-v="all" aria-pressed="${lab==="all"}">${T("Toutes")} (${all.length})</button>${MEAL_LABELS.map(l => `<button data-act="rcLabel" data-v="${l}" aria-pressed="${lab===l}">${T(l)} (${all.filter(r => (r.labels||[]).includes(l)).length})</button>`).join("")}</div>
    ${all.length > 5 ? `<input class="inp" placeholder="${T("Chercher une recette ou un ingrédient")}" value="${esc(UI.rcQ||"")}" data-change="rcQ">` : ""}
    ${list.length ? `<div class="list">${list.map(r => `<button class="li" data-act="recipeOpen" data-v="${r.id}"><div class="ic" style="background:var(--peach-bg);color:var(--peach-ink)">${icon("dish")}</div><div class="grow"><div class="li-title">${esc(r.title)}</div><div class="small muted">${(r.labels||[]).map(T).join(", ")} · ${r.minutes} min${r.nut?.kcal?` · ${Math.round(r.nut.kcal)} kcal`:""}</div></div></button>`).join("")}</div>` : empty("dish", T("Créez une recette avec l'IA, puis touchez « Garder en favori » : elle apparaîtra ici, classée par étiquette."))}</div>`;
}

Object.assign(ACT, {
  createKind: v => { UI.createKind = v; UI.aiTab = "create"; closeSheet(); if (UI.view !== "assistant") go("assistant"); else render(); },
  storyIdeas: () => storyIdeas(), storyPick: v => storyPick(v),
  storyWrite: () => { const plan = val("st-plan"); UI.storyOpts = UI.storyOpts || storyOpts(); storyGen(null, plan); },
  storyOpen: v => storyOpen(v), stMode: v => { UI.stMode = v; render(); }, stFav: () => { UI.stFav = !UI.stFav; render(); },
  storyFav: v => { const s = S.stories.find(x => x.id === v); s.fav = !s.fav; save(); storyOpenKeepScroll(v); },
  storyEngine: v => { const s = S.stories.find(x => x.id === UI.storyId); s.engine = v; save(); stopPlay(); storyOpenKeepScroll(s.id); },
  storyPlay: v => { const [sid, ci] = v.split("|"); if (PL.on && PL.story === sid && PL.ch === +ci){ stopPlay(); storyOpenKeepScroll(sid); } else playChapter(sid, +ci); },
  storyNext: v => { const s = S.stories.find(x => x.id === v); storyGen(s, null, val("st-dir")); },
  storyNextIdeas: v => storyNextIdeas(v), storyDir: v => { const i = $("#sn-dir") || $("#st-dir"); if (i){ i.value = v; i.focus(); } },
  storyNextSheet: v => storyNextSheet(v), storySurprise: v => storyNextRun(v, true),
  storyImg: v => { const [sid, ci] = v.split("|"); storyImage(sid, +ci); },
  storyShare: v => { const s = S.stories.find(x => x.id === v); Native.share({title:s.title, text:`${s.title}\n\n${s.chapters.map(ch => `${T("Chapitre {n}",{n:ch.n})} · ${ch.title}\n\n${ch.segs.map(sg => (sg.c!=="narr"?`${s.characters.find(x=>x.id===sg.c)?.name} : `:"") + sg.t).join("\n")}`).join("\n\n")}`}); },
  storyKeep: v => { const s = S.stories.find(x => x.id === v); S.memories.push({id:uid(), kind:"story", date:iso(today()), title:s.title, text:s.chapters.map(ch => `## ${ch.title}\n${ch.segs.map(sg => sg.t).join("\n")}`).join("\n\n"), kidIds:s.kid?[s.kid]:[]}); save(); driveQ("mem", S.memories.at(-1).id); toast(T("Souvenir enregistré")); },
  storyDel: v => { if (!confirmDel()) return; stopPlay(); (S.stories.find(x => x.id === v)?.chapters||[]).forEach(ch => ch.img && PhotoDB.del(ch.img).catch(() => {})); driveQDel(S.stories.find(x => x.id === v)?.driveIds); S.stories = S.stories.filter(x => x.id !== v); closeSheet(); commit(); },
  charForm: v => charForm(v),
  charTest: async v => { const vc = readVoice(), txt = LANG === "en" ? "Hello! Here is my voice for the story." : "Bonjour ! Voici ma voix pour l'histoire."; stopPlay();
    try { if (v === "gemini"){ toast(T("Génération de la voix…")); const url = await TTS.gemini(txt, vc); const a = new Audio(url); PL.audio = a; a.play(); } else await TTS.speakDevice(txt, vc); } catch(e){ toast(e.message); } },
  rcLabel: v => { UI.rcLabel = v; render(); }, recipeOpen: v => recipeSheet(S.recipes.find(x => x.id === v)),
  recipeSave: () => { const r = UI.recipeView; r.labels = checked("rc-lab"); S.recipes = S.recipes || []; const i = S.recipes.findIndex(x => x.id === r.id); if (i >= 0) S.recipes[i] = {...S.recipes[i], ...r}; else S.recipes.unshift({...r, fav:true}); save(); toast(T("Recette gardée en favori")); recipeSheet(r); },
  recipeDel: v => { S.recipes = S.recipes.filter(x => x.id !== v); closeSheet(); commit(T("Supprimé")); },
  recipeShare: () => { const r = UI.recipeView; Native.share({title:r.title, text:recipeText(r)}); },
  recipeLog: () => { const r = UI.recipeView, c = child(); closeSheet(); mealForm({items:[{name:r.title, group:"autres", qty:T("1 portion"), nut:r.nut||null}], comment:"", ai:true}); },
});
const confirmDel = () => { try { return confirm(T("Supprimer définitivement ?")); } catch(e){ return true; } };
Object.assign(FORMS, {
  aiCreate: () => {
    const k = UI.createKind || "story", c = aiKidNow();
    if (k === "story"){ UI.storyOpts = storyOpts(); return storyGen(null, ""); }
    if (k === "recipe"){ const w = val("rc-want"); if (!w) return toast(T("Indiquez une envie ou des ingrédients")); return recipeJob(w, radio("rc-label"), +val("rc-time"), +val("rc-serv")); }
    const fav = (c?.foodFav||[]).map(f => f.name).join(", "), age = c && !isPrenatal(c) ? ageLabel(ageMonths(c)) : "";
    const P = {
      plan:[T("Menu de la semaine"), "menu", `Propose un menu de 7 jours (déjeuner, dîner, souper, 1 ou 2 collations) pour une famille avec ${kidLine(c)}. Guide alimentaire canadien, textures sûres pour l'âge, portions de l'enfant indiquées. Aliments aimés : ${fav||"inconnus"}. Allergies : ${c?.allergies||"aucune connue"}. Contraintes : ${val("pl-a")||"aucune"}. Présente les repas dans un tableau Markdown (Jour | Déjeuner | Dîner | Souper | Collation), puis la liste d'épicerie groupée par rayon.`, false],
      ideas:[T("Idées d'activités"), "ideas", `Donne 6 idées d'activités pour ${kidLine(c)}, ${{dedans:"à l'intérieur", dehors:"dehors", sortie:`en sortie près de ${val("id-city")||"Montréal"}`}[radio("id-where")]||"à l'intérieur"}, durée ${radio("id-time")==="jour"?"une journée":radio("id-time")+" minutes"}, en ${fmtD(today(),{month:"long"})}. Pour chacune : titre en gras, matériel, déroulement en 2 phrases, ce que ça développe. Pour les sorties, donne de vrais lieux (adresse) sous forme de liens Google Maps, et rappelle de vérifier les horaires.`, radio("id-where") === "sortie"],
      talk:[T("Discussion : {s}",{s:val("tk-a")}), "talk", `Aide un parent à préparer une discussion avec ${kidLine(c)}, sur : ${val("tk-a")}. Donne : ce que l'enfant comprend à cet âge, 4 ou 5 phrases simples à dire, les questions probables et comment y répondre, ce qu'il vaut mieux éviter, et quand demander de l'aide (CLSC, psychologue, 811, Tel-jeunes, LigneParents). Appuie-toi sur des sources reconnues (SCP, Naître et grandir, Tel-jeunes, INSPQ).`, true],
    }[k];
    if (!P || (k === "talk" && !val("tk-a"))) return toast(T("Indiquez le sujet"));
    if (k === "ideas" && val("id-city")){ S.settings.city = val("id-city"); save(); }
    aiJob(P[1], P[0], async () => { const r = await gemini({system:AI_SYSTEM() + "\n" + kidContext(c), search:P[3], contents:[{role:"user", parts:[{text:P[2]}]}]}); const e = aiHist(P[1], P[0], r.text, {sources:r.sources, kid:c?.id||null}); return {histId:e.id}; }, {kid:c?.id});
  },
  charSave: f => { const [sid, cid] = f.dataset.id.split("|"), s = S.stories.find(x => x.id === sid), ch = s.characters.find(x => x.id === cid);
    if (cid !== "narr"){ ch.name = val("cv-name") || ch.name; ch.desc = val("cv-desc"); } ch.fav = $("#cv-fav").checked; ch.voice = readVoice(); save(); toast(T("Voix enregistrée")); storyOpen(sid); },
});
Object.assign(CHANGE, { rcQ: t => { UI.rcQ = t.value; render(); } });
Object.assign(FORMS, { storyNextGo: f => storyNextRun(f.dataset.id, false) });
