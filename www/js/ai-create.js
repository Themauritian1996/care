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
const RAND_THEMES = ["Un dragon qui a peur du noir","Une cabane dans les nuages","Le jour où les jouets ont parlé","Un voyage sous la mer en sous-marin jaune","Une licorne qui perd ses couleurs","Des pirates qui cherchent une chaussette","Une fusée en carton qui décolle vraiment","Un hérisson qui veut un câlin","La forêt des lucioles musiciennes","Un robot qui apprend à rire"];
const RAND_MSGS = ["Oser demander de l'aide","Partager, c'est doubler la joie","On a le droit de se tromper","Être gentil avec les autres","Croire en soi","Dire ce qu'on ressent","La patience récompense","Accepter les différences","Prendre soin de la nature","Se calmer avant de dormir"];
const MEAL_LABELS = ["Déjeuner","Dîner","Souper","Collation","Dessert","Boîte à lunch"];
const aiKidNow = () => kidById(UI.aiKid) || child();
const kidLine = c => c ? `${c.nick||c.name}${!isPrenatal(c)?`, ${ageLabel(ageMonths(c))}`:""}` : "un enfant";

const CREATE_TAB = {plan:"menus", ideas:"ideas", talk:"talk"};
function createPane(){
  if (!["story","recipe"].includes(UI.createKind)) UI.createKind = "story";
  return `<div class="create-grid">${Object.entries(CREATE_KINDS).map(([id,x]) => `<button class="create-tile" data-act="createKind" data-v="${id}" aria-pressed="${id===UI.createKind}">${icon(x.ic)}<b>${T(x.l)}</b></button>`).join("")}</div>` + createForm(UI.createKind)
    + `<p class="tiny muted center">${T("Vous pouvez lancer une autre création pendant que celle-ci se prépare : suivez-les dans « En cours ».")}</p>`;
}
function createForm(k){
  UI.createKind = k; const c = aiKidNow();
  let f = "";
  if (k === "story"){
    const lib = (S.stories||[]).flatMap(s => s.characters.filter(ch => ch.id !== "narr").map(ch => ({...ch, story:s.title})));
    f = `<div class="fgrid">${fld("st-hero",T("Héros"),inp("st-hero",c?(c.nick||c.name):"",""))}${fld("st-place",T("Lieu (facultatif)"),inp("st-place","",`placeholder="${T("Une forêt enchantée, l'espace…")}"`))}</div>
      <div class="field"><label for="st-theme">${T("Thème (facultatif)")}</label><div class="row" style="gap:6px">${inp("st-theme","",`placeholder="${T("Dinosaures, téléportation, un chat qui parle…")}"`)}<button type="button" class="btn ghost rand-btn" data-act="storyRand" data-v="theme" aria-label="${T("Thème au hasard")}" title="${T("Thème au hasard")}">🎲</button></div></div>
      <div class="field"><label for="st-msg">${T("Ce qu'on veut transmettre (facultatif)")}</label><div class="row" style="gap:6px">${inp("st-msg","",`placeholder="${T("Le courage, partager, s'endormir calme…")}"`)}<button type="button" class="btn ghost rand-btn" data-act="storyRand" data-v="msg" aria-label="${T("Leçon au hasard")}" title="${T("Leçon au hasard")}">🎲</button></div></div>
      <div class="field"><label>${T("Ambiance")}</label>${checks("st-mood", MOODS.map(x => [x, T(x)]), ["Doux"])}</div>
      <div class="field"><label>${T("Longueur")}</label>${radios("st-len",[["3",T("3 minutes")],["6",T("6 minutes")],["10",T("10 minutes")]],"3")}</div>
      ${fld("st-lvl",T("Niveau du livre (vocabulaire et style)"),lvlSelect("st-lvl",""))}
      ${charLibrary()}
      ${fld("st-new",T("Nouveaux personnages (facultatif)"),inp("st-new","",`placeholder="${T("Ex. : Zara, une renarde qui adore les énigmes")}"`))}
      <div class="row" style="flex-wrap:wrap"><button type="button" class="btn ghost" data-act="storyIdeas">${icon("bulb")}${T("Proposer 3 idées d'abord")}</button><button class="btn kid" type="submit">${icon("spark")}${T("Écrire directement")}</button></div>
      <div id="storyIdeas"></div>`;
  }
  if (k === "recipe") f = `${fld("rc-want",T("Envie ou ingrédients disponibles"),inp("rc-want","",`placeholder="${T("Ex. : poulet, brocoli, riz ; ou « muffins sans sucre ajouté »")}" required`))}
      <div class="field"><label>${T("Moment")}</label>${radios("rc-label", MEAL_LABELS.map(x => [x, T(x)]), "Souper")}</div>
      <div class="fgrid">${fld("rc-time",T("Temps maximum"),`<select class="inp" id="rc-time"><option value="20">20 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="90">1 h 30</option></select>`)}${fld("rc-serv",T("Portions"),`<input class="inp" id="rc-serv" type="number" min="1" max="12" value="4">`)}</div>
      <button class="btn kid" type="submit">${icon("spark")}${T("Créer la recette")}</button>`;
  if (k === "plan") f = `${fld("pl-a",T("Contraintes (facultatif)"),inp("pl-a","",`placeholder="${T("Végé, budget serré, soupers en 20 min…")}"`))}
      <div class="field"><label>${T("Repas à prévoir")}</label>${checks("pl-meals", ["Déjeuner","Dîner","Souper","Collation"].map(x => [x, T(x)]), S.settings.menuMeals || ["Déjeuner","Dîner","Souper","Collation"])}</div>
      <div class="field"><label>${T("Nombre de jours")}</label>${radios("pl-days",[["5",T("5 jours")],["7",T("7 jours")]],"7")}</div>
      ${(S.recipes||[]).length ? `<label class="switch"><input type="checkbox" id="pl-fav" checked><span class="tg"></span><span class="grow">${T("Inclure quelques recettes favorites")}</span></label>` : ""}
      <button class="btn kid" type="submit">${icon("spark")}${T("Créer le menu")}</button>`;
  if (k === "ideas") f = `<div class="field"><label>${T("Où ?")}</label>${radios("id-where",[["dedans",T("À l'intérieur")],["dehors",T("Dehors")],["sortie",T("Sortie près de chez nous")]],"dedans")}</div>
      ${fld("id-city",T("Ville, code postal ou adresse (pour les sorties)"),addrInput("id-city", S.settings.city||"Montréal"))}
      <div class="field"><label>${T("Temps disponible")}</label>${radios("id-time",[["15",T("15 min")],["60",T("1 h")],["jour",T("Une journée")]],"60")}</div><button class="btn kid" type="submit">${icon("spark")}${T("Trouver des idées")}</button>`;
  if (k === "talk") f = `${fld("tk-a",T("Sujet"),inp("tk-a","",`placeholder="${T("Ex. : parler de la mort de grand-papa")}" required`))}<button class="btn kid" type="submit">${icon("spark")}${T("Préparer")}</button>`;
  return `<div class="card"><div class="card-h"><div><span class="eyebrow">${esc(kidLine(c))}</span><h2>${T(CREATE_KINDS[k].l)}</h2></div></div><p class="small muted">${T(CREATE_KINDS[k].d)}</p>
    <form class="stack" data-form="aiCreate" style="gap:12px">${f}</form></div>`;
}
/* onglets dédiés : menus de la semaine, idées d'activités, préparer une discussion */
const histOfCat = (cat, empty0) => { const L = (S.aiHist||[]).filter(e => e.cat === cat); return L.length ? `<div class="card"><div class="card-h"><h2>${T("Déjà préparés")}</h2><span class="chip">${L.length}</span></div><div class="list">${L.slice(0, 30).map(e => `<button class="li" data-act="aiHistOpen" data-v="${e.id}"><div class="ic" style="background:var(--surface2)">${icon((AI_CATS[e.cat]||["","spark"])[1])}</div><div class="grow"><div class="li-title">${esc(e.title)}</div><div class="small muted">${fmtD(new Date(e.at),{day:"numeric",month:"short",year:"numeric"})}${e.kid&&kidById(e.kid)?" · "+esc(kidById(e.kid).nick||kidById(e.kid).name):""}</div></div>${e.fav?"★":""}${icon("right")}</button>`).join("")}</div></div>` : `<div class="card">${empty("spark", empty0)}</div>`; };
function ideasPane(){ return createForm("ideas") + histOfCat("ideas", T("Vos idées d'activités apparaîtront ici.")); }
function talkPane(){ return createForm("talk") + histOfCat("talk", T("Vos discussions préparées apparaîtront ici.")); }
function menusPane(){
  const M = (S.menus||[]).slice().sort((a,b) => b.at - a.at), liked = (S.recipes||[]).filter(r => r.fromMenu);
  return createForm("plan") + (M.length ? `<div class="card"><div class="card-h"><h2>${T("Mes menus")}</h2><span class="chip">${M.length}</span></div><div class="list">${M.map(m => `<button class="li" data-act="menuOpen" data-v="${m.id}"><div class="ic" style="background:var(--mint-bg);color:var(--mint-ink)">${icon("spoon")}</div><div class="grow"><div class="li-title">${esc(m.title || T("Menu de la semaine"))}</div><div class="small muted">${fmtD(new Date(m.at),{day:"numeric",month:"long"})} · ${T("{n} jours",{n:m.days.length})} · ${T("{n} aimé(s)",{n:m.days.flatMap(d => d.meals).filter(x => x.liked).length})}</div></div>${icon("right")}</button>`).join("")}</div></div>` : `<div class="card">${empty("spoon", T("Créez un menu : chaque repas pourra être aimé (♥) pour le garder dans vos recettes favorites."))}</div>`)
    + (liked.length ? `<div class="card"><div class="card-h"><h2>${T("Repas aimés")}</h2><button class="btn sm ghost" data-act="aiTab" data-v="recipes">${T("Recettes")}</button></div><div class="pick">${liked.slice(0, 20).map(r => `<button data-act="recipeOpen" data-v="${r.id}">♥ ${esc(r.title)}</button>`).join("")}</div></div>` : "")
    + histOfCat("menu", T("Les anciens menus (texte) apparaissent ici."));
}
const MENU_SCHEMA = {type:"OBJECT", properties:{title:{type:"STRING"}, days:{type:"ARRAY", items:{type:"OBJECT", properties:{day:{type:"STRING"}, meals:{type:"ARRAY", items:{type:"OBJECT", properties:{label:{type:"STRING", enum:["Déjeuner","Dîner","Souper","Collation"]}, name:{type:"STRING"}, note:{type:"STRING"}}, required:["label","name"]}}}, required:["day","meals"]}}, grocery:{type:"ARRAY", items:{type:"OBJECT", properties:{aisle:{type:"STRING"}, items:{type:"ARRAY", items:{type:"OBJECT", properties:{name:{type:"STRING"}, qty:{type:"STRING"}}, required:["name","qty"]}}}, required:["aisle","items"]}}, tips:{type:"STRING"}}, required:["title","days","grocery"]};
function menuJob(c){
  const meals = checked("pl-meals"), nd = +(radio("pl-days") || 7), cons = val("pl-a"), favs = $("#pl-fav")?.checked ? (S.recipes||[]).slice(0, 12).map(r => r.title).join(", ") : "";
  if (!meals.length) return toast(T("Choisissez au moins un repas")); S.settings.menuMeals = meals; save();
  const foods = (c?.foodFav||[]).map(f => f.name).join(", ");
  return aiJob("menu", T("Menu de la semaine"), async () => {
    const r = await gemini({json:MENU_SCHEMA, temperature:0.8, timeout:120000, system:AI_SYSTEM(), contents:[{role:"user", parts:[{text:`Propose un menu de ${nd} jours pour une famille avec ${kidLine(c)}${S.children.length > 1 ? ` (autres enfants : ${S.children.filter(k => k.id !== c?.id && !isPrenatal(k)).map(kidLine).join(", ")})` : ""}. Repas à prévoir chaque jour : ${meals.join(", ")}. Guide alimentaire canadien, textures sûres pour l'âge, variété, restes réutilisés intelligemment. Aliments aimés : ${foods||"inconnus"}. Allergies : ${c?.allergies||"aucune connue"}. Contraintes : ${cons||"aucune"}.${favs ? ` Intègre 2 ou 3 de ces recettes favorites : ${favs}.` : ""} Pour chaque repas : un nom court et appétissant (name) et une note très brève (portion de l'enfant ou astuce). Jours nommés (Lundi…). Puis la liste d'épicerie groupée par rayon, avec pour chaque article la quantité totale à acheter pour toute la semaine et pour ${Math.max(2, S.family.members.length)} personnes (ex. « 1 kg », « 2 boîtes de 540 ml », « 1 douzaine », « 3 »), et 2 phrases d'astuces de préparation. En ${LANG==="en"?"anglais":"français"}.`}]}]});
    const out = parseJSON(r.text), m = {id:uid(), at:Date.now(), kid:c?.id||null, title:out.title || T("Menu de la semaine"), days:(out.days||[]).map(d => ({day:d.day, meals:(d.meals||[]).map(x => ({label:x.label, name:x.name, note:x.note||""}))})), grocery:out.grocery||[], tips:out.tips||""};
    if (!m.days.length) throw new Error(T("Réponse incomplète, réessayez"));
    S.menus = [m, ...(S.menus||[])].slice(0, 40); save(); if (UI.aiTab === "menus") softRender(); return {open:() => menuOpen(m.id)};
  }, {kid:c?.id, open:(res) => res?.open?.()});
}
function menuOpen(id){
  const m = (S.menus||[]).find(x => x.id === id); if (!m) return; UI.menuId = id;
  sheet(`${sheetHead(esc(m.title))}<p class="small muted">${T("Touchez ♥ sur un repas que vous avez aimé : il va dans vos recettes favorites (la recette complète est préparée par l'IA).")}</p>
    ${m.days.map((d, di) => `<div class="menu-day"><h3>${esc(d.day)}</h3>${d.meals.map((x, xi) => `<div class="menu-meal"><span class="chip ${x.label==="Souper"?"peach":x.label==="Dîner"?"mint":x.label==="Déjeuner"?"butter":"sky"}">${T(x.label)}</span><button class="grow menu-name" data-act="menuMeal" data-v="${id}|${di}|${xi}"><b>${esc(x.name)}</b>${x.note?`<span class="tiny muted">${esc(x.note)}</span>`:""}<span class="tiny" style="color:var(--lilac-ink)">${x.recipe || x.liked ? T("Voir la recette") : T("Recette ›")}</span></button><button class="icon-btn flat" data-act="menuLog" data-v="${id}|${di}|${xi}" aria-label="${T("Ajouter au journal")}" title="${T("Ajouter au journal")}">${icon("plus")}</button><button class="icon-btn flat like ${x.liked?"on":""}" data-act="menuLike" data-v="${id}|${di}|${xi}" aria-pressed="${!!x.liked}" aria-label="${x.liked?T("Ne plus aimer"):T("J'aime : garder en favori")}">${x.liked?"♥":"♡"}</button></div>`).join("")}</div>`).join("")}
    ${m.grocery?.length ? `<details class="card lexcard"><summary><b>${icon("note")} ${T("Liste d'épicerie")}</b></summary>${m.grocery.map(g => `<div><span class="eyebrow">${esc(g.aisle)}</span><ul class="ing grocery">${(g.items||[]).map(i => typeof i === "string" ? `<li>${esc(i)}</li>` : `<li><span class="qty">${esc(i.qty||"")}</span> ${esc(i.name)}</li>`).join("")}</ul></div>`).join("")}</details>` : ""}
    ${m.tips ? `<div class="banner soft">${icon("bulb")}<div class="small">${esc(m.tips)}</div></div>` : ""}
    <div class="row"><button class="btn ghost" data-act="menuShare" data-v="${id}">${icon("share")}${T("Partager")}</button><button class="btn danger" data-act="menuDel" data-v="${id}">${icon("trash")}</button></div>`, "wide");
}
const menuText = m => `${m.title}\n\n${m.days.map(d => `${d.day}\n${d.meals.map(x => `- ${T(x.label)} : ${x.name}`).join("\n")}`).join("\n\n")}${m.grocery?.length ? `\n\n${T("Liste d'épicerie")}\n${m.grocery.map(g => `${g.aisle} : ${(g.items||[]).map(i => typeof i === "string" ? i : `${i.qty} ${i.name}`).join(", ")}`).join("\n")}` : ""}`;

/* ---------- histoires ---------- */
/* personnages à reprendre : classés par livre, filtrables, on peut en retirer de la liste */
function charLibrary(){
  const books = (S.stories||[]).map(st => ({st, chars:st.characters.filter(ch => ch.id !== "narr" && !ch.libHide)})).filter(b => b.chars.length);
  if (!books.length) return "";
  const hidden = sum((S.stories||[]).map(st => st.characters.filter(ch => ch.libHide).length));
  return `<div class="field"><label>${T("Reprendre des personnages")}</label>
    ${books.length > 1 || books[0].chars.length > 6 ? `<input class="inp" id="st-charq" placeholder="${T("Filtrer par nom ou par livre")}" autocomplete="off">` : ""}
    <div class="stack char-lib" style="gap:6px">${books.map(({st, chars}, bi) => `<details class="char-book" data-book="${esc(st.title.toLowerCase())}" ${books.length <= 2 || bi === 0 ? "open" : ""}><summary><b>${esc(st.title)}</b> <span class="tiny muted">${chars.length}${st.kid && kidById(st.kid) ? " · " + T("pour {n}",{n:esc(kidById(st.kid).nick||kidById(st.kid).name)}) : ""}</span></summary>
      <div class="stack" style="gap:4px;margin-top:6px">${chars.map(ch => `<div class="char-pick" data-name="${esc(ch.name.toLowerCase())}"><label class="grow"><input type="checkbox" name="st-chars" value="${esc(ch.id)}"> <b>${esc(ch.name)}</b>${ch.fav?" ★":""} <span class="tiny muted">${esc((ch.desc||"").slice(0, 60))}</span></label><button type="button" class="icon-btn flat" data-act="charHide" data-v="${st.id}|${ch.id}" aria-label="${T("Retirer de la liste")}" title="${T("Retirer de la liste")}">${icon("x")}</button></div>`).join("")}</div></details>`).join("")}</div>
    ${hidden ? `<button type="button" class="btn sm line" data-act="charUnhide" style="align-self:flex-start">${T("Réafficher les personnages retirés ({n})",{n:hidden})}</button>` : ""}</div>`;
}
document.addEventListener("input", e => { if (e.target.id !== "st-charq") return; const q = e.target.value.trim().toLowerCase();
  $$(".char-book").forEach(b => { const bookHit = b.dataset.book.includes(q); let any = false; b.querySelectorAll(".char-pick").forEach(c => { const hit = !q || bookHit || c.dataset.name.includes(q); c.hidden = !hit; any = any || hit; }); b.hidden = !any; if (q && any) b.open = true; }); });
const STORY_SCHEMA = {type:"OBJECT", properties:{title:{type:"STRING"}, chapterTitle:{type:"STRING"}, summary:{type:"STRING"},
  characters:{type:"ARRAY", items:{type:"OBJECT", properties:{name:{type:"STRING"}, desc:{type:"STRING"}, kind:{type:"STRING", enum:["enfant","adulte","aine","animal","creature","robot"]}, gender:{type:"STRING", enum:["fille","garcon","neutre"]}}, required:["name","desc","kind"]}},
  segments:{type:"ARRAY", items:{type:"OBJECT", properties:{speaker:{type:"STRING"}, text:{type:"STRING"}}, required:["speaker","text"]}}}, required:["title","chapterTitle","summary","characters","segments"]};
/* niveau de lecture : Gemini adapte vocabulaire, phrases et intrigue */
const READ_LEVELS = [["", "Selon l'âge de l'enfant"], ["2-3", "Tout-petits (2-3 ans) : mots simples, répétitions"], ["4-5", "4-5 ans : phrases courtes, album illustré"], ["6-7", "6-7 ans : premiers lecteurs"], ["8-9", "8-9 ans : petit roman"], ["10-12", "10-12 ans : roman jeunesse"], ["13+", "Ados : roman pour adolescents"]];
const lvlSelect = (id, sel) => `<select class="inp" id="${id}">${READ_LEVELS.map(([v, l]) => `<option value="${v}" ${v===sel?"selected":""}>${T(l)}</option>`).join("")}</select>`;
const LVL_HINT = {"2-3":"livre pour tout-petits de 2-3 ans. Phrases de 3 à 6 mots. Uniquement des mots du quotidien d'un enfant de 2 ans (maman, dodo, chat, balle, manger, gros, petit). Beaucoup de répétitions et d'onomatopées (boum, miaou). Aucun mot abstrait, aucune métaphore, aucun passé simple.",
  "4-5":"album pour 4-5 ans. Phrases de 5 à 10 mots, une idée par phrase. Vocabulaire concret qu'un enfant de maternelle comprend seul ; au plus un mot nouveau, expliqué tout de suite par la phrase suivante. Présent ou passé composé (pas de passé simple). Pas de métaphores, pas de mots comme « majestueux, scintillant, mystérieux, s'émerveiller, contempler, murmurer ».",
  "6-7":"livre pour premiers lecteurs de 6-7 ans. Phrases courtes (moins de 12 mots), mots faciles à lire et fréquents, dialogues simples. Passé composé ou présent. Évite les adjectifs recherchés et les tournures littéraires.",
  "8-9":"petit roman pour 8-9 ans. Phrases variées mais claires (moins de 18 mots), vocabulaire courant avec quelques mots nouveaux compréhensibles par le contexte, un peu de suspense et d'humour.",
  "10-12":"roman jeunesse pour 10-12 ans : vocabulaire riche mais naturel, phrases complexes possibles, personnages nuancés, intrigue avec rebondissements.",
  "13+":"roman pour adolescents : style littéraire, thèmes plus matures (amitié, identité, courage), dialogues naturels."};
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
    const prev = story ? `Histoire existante « ${story.title} ». Personnages (garde leurs noms, caractères et façons de parler) : ${story.characters.filter(x => x.id !== "narr").map(x => `${x.name} — ${x.desc}`).join(" ; ")}.${story.removed?.length ? ` Ne fais plus apparaître : ${story.removed.join(", ")}.` : ""}\nRésumé des chapitres précédents :\n${story.chapters.map(ch => `${ch.n}. ${ch.title} : ${ch.summary}`).join("\n")}\nFin du dernier chapitre : ${story.chapters.at(-1).segs.slice(-3).map(s => s.t).join(" ")}\nÉcris le chapitre ${n}, qui continue l'histoire. ${direction ? `Direction voulue : ${direction}.` : ""}` : `Plan : ${plan || "à inventer"}`;
    const lv = o.level || lvlOfAge(c && !isPrenatal(c) ? ageMonths(c) : 48);
    const r = await gemini({tier:"fast", json:STORY_SCHEMA, temperature:0.7, timeout:90000, system:`Tu es un auteur de livres jeunesse spécialiste du niveau ${lv} ans. RÈGLE ABSOLUE : ${LVL_HINT[lv]} Avant de répondre, relis chaque phrase : si un enfant de ${lv.split("-")[0].replace("+","")} ans ne comprendrait pas un mot sans aide, remplace-le par un mot plus simple. La simplicité du vocabulaire passe avant le style.`, contents:[{role:"user", parts:[{text:`Écris une histoire du soir pour ${kidLine(c)} (rythme apaisant, fin calme). Niveau du texte : ${LVL_HINT[lv]} ${optsText(o)}\n${prev}\nLongueur : environ ${words} mots. Découpe le texte en segments : la narration avec speaker « Narrateur », chaque réplique d'un personnage dans un segment séparé avec son nom exact comme speaker (sans tiret ni guillemets, ni « dit-il » dans la réplique). Liste dans characters tous les personnages qui parlent (pas le narrateur), avec une description courte, leur type et leur genre (fille, garcon ou neutre). summary : 2 phrases qui résument ce chapitre. En ${LANG==="en"?"anglais":"français"}.`}]}]});
    const out = parseJSON(r.text);
    const st = story || {id:uid(), kid:c?.id||null, title:out.title, opts:o, characters:[{id:"narr", name:T("Narrateur"), desc:"", kind:"narrateur", gender:"fille", voice:autoVoice("narrateur", 0, "fille")}], chapters:[], fav:false, at:Date.now(), engine:"device"};
    if (!story){ (o.chars||[]).forEach((ch,i) => st.characters.push({id:uid(), name:ch.name, desc:ch.desc, kind:ch.kind||"enfant", gender:ch.gender, voice:ch.voice || autoVoice(ch.kind, i+1, ch.gender || guessGender(ch.name, ch.desc))})); }
    (out.characters||[]).forEach(ch => { if (!st.characters.some(x => x.name.toLowerCase() === ch.name.toLowerCase())) { const g = ch.gender && ch.gender !== "neutre" ? ch.gender : guessGender(ch.name, ch.desc); st.characters.push({id:uid(), name:ch.name, desc:ch.desc, kind:ch.kind, gender:g, voice:autoVoice(ch.kind, st.characters.length, g)}); } });
    const idOf = name => { name = String(name||"").trim(); if (!name || /narra/i.test(name)) return "narr";
      let ch = st.characters.find(x => x.name.toLowerCase() === name.toLowerCase()); if (!ch){ { const g = name === o.hero && c && !isPrenatal(c) ? (c.sex === "F" ? "fille" : "garcon") : guessGender(name); ch = {id:uid(), name, desc:name === o.hero ? T("le héros") : "", kind:"enfant", gender:g, voice:autoVoice("enfant", st.characters.length, g)}; } st.characters.push(ch); } return ch.id; };
    st.chapters.push({n, title:out.chapterTitle, summary:out.summary, segs:(out.segments||[]).map(s => ({c:idOf(s.speaker), t:s.text})), at:Date.now(), direction:direction||""});
    S.stories = S.stories || []; if (!story) S.stories.unshift(st);
    const e = aiHist("story", `${st.title} · ${T("chapitre {n}",{n})}`, st.chapters.at(-1).segs.map(s => s.t).join("\n\n"), {kid:st.kid, storyId:st.id}); save(); driveQ("story", st.id);
    return {histId:e.id, open:() => storyOpen(st.id)};
  }, {kid:c?.id, open:() => storyOpen((story||S.stories[0]).id)});
}
/* voix Gemini selon le type ET le genre du personnage (Kore, Leda… féminines ; Puck, Charon… masculines) */
const GV = {narrateur:{f:["Sulafat","Achernar","Vindemiatrix"], m:["Iapetus","Achird"]},
  enfant:{f:["Leda","Laomedeia","Zephyr","Aoede"], m:["Puck","Fenrir","Orus"]}, adulte:{f:["Kore","Despina","Callirrhoe"], m:["Charon","Iapetus","Alnilam"]},
  aine:{f:["Gacrux","Pulcherrima"], m:["Sadaltager","Algieba"]}, animal:{f:["Autonoe","Erinome"], m:["Sadachbia","Fenrir"]},
  creature:{f:["Erinome","Umbriel"], m:["Algenib","Enceladus"]}, robot:{f:["Schedar","Despina"], m:["Rasalgethi","Schedar"]}};
const PITCH = {narrateur:{f:1.05, m:0.95}, enfant:{f:1.5, m:1.3}, adulte:{f:1.1, m:0.85}, aine:{f:0.95, m:0.75}, animal:{f:1.3, m:1.1}, creature:{f:0.85, m:0.65}, robot:{f:0.95, m:0.8}};
/* genre deviné d'après le prénom si Gemini ne l'a pas donné (prénoms en -a, -e, -ie, -ine, -elle… = féminin) */
const FEM = /^(léa|lea|emma|chloé|chloe|zoé|zoe|alice|rose|jade|lou|inès|ines|manon|camille|sarah|eva|ève|eve|nora|mia|lily|anna|julie|marie|sophie|clara|olivia|charlotte|florence|béatrice|maman|mamie|grand-maman|reine|princesse|fée|madame|mme|tante|sœur|soeur|grenouille|tortue|souris|chouette|girafe|licorne)\b/i;
const MASC = /^(léo|leo|louis|lucas|noah|nathan|hugo|arthur|jules|thomas|william|liam|félix|felix|gabriel|adam|théo|theo|paul|jacques|papa|papi|grand-papa|roi|prince|monsieur|m\.|oncle|frère|frere|loup|ours|lion|renard|dragon|hibou|chat|chien|robot)\b/i;
function guessGender(name = "", desc = ""){
  const n = String(name).trim().toLowerCase(), d = String(desc).toLowerCase();
  if (FEM.test(n) || /\b(une|elle|fille|petite|maman|reine|princesse|sœur|grand-mère|tante)\b/.test(d)) return "fille";
  if (MASC.test(n) || /\b(un|il|garçon|garcon|petit|papa|roi|prince|frère|grand-père|oncle)\b/.test(d)) return "garcon";
  return /(a|e|ie|ine|elle|ette)$/.test(n.split(" ")[0]) ? "fille" : "garcon";
}
function autoVoice(kind = "enfant", i = 0, gender = "garcon"){
  const g = gender === "fille" ? "f" : gender === "neutre" ? (i % 2 ? "f" : "m") : "m", set = GV[kind] || GV.enfant, list = set[g] || set.m;
  return {gv:list[i % list.length], pitch:(PITCH[kind] || PITCH.enfant)[g], rate:kind === "narrateur" ? 0.92 : 1, dv:"", g};
}
const CH_COLORS = ["lilac","peach","mint","sky","butter","rose","teal","coral"];
const chColor = (st, id) => id === "narr" ? "surface2" : CH_COLORS[st.characters.findIndex(x => x.id === id) % CH_COLORS.length];

function storiesPane(){
  const mode = UI.stMode || "stories", fav = !!UI.stFav, fk = UI.stKid || "", q = (UI.stQ||"").trim().toLowerCase(), fc = UI.stChar || "", sort = S.settings.stSort || "new";
  const allChars = [...new Set((S.stories||[]).flatMap(s => s.characters.filter(c => c.id !== "narr").map(c => c.name)))].sort((a, b) => a.localeCompare(b));
  const list = (S.stories||[]).filter(s => (!fav || s.fav) && (!fk || (fk === "fam" ? !s.kid : s.kid === fk)) && (!fc || s.characters.some(c => c.name === fc))
      && (!q || s.title.toLowerCase().includes(q) || s.characters.some(c => c.name.toLowerCase().includes(q)) || s.chapters.some(ch => ch.title.toLowerCase().includes(q))))
    .sort(sort === "az" ? (a, b) => a.title.localeCompare(b.title) : sort === "za" ? (a, b) => b.title.localeCompare(a.title) : sort === "old" ? (a, b) => (a.at||0) - (b.at||0) : (a, b) => (b.at||0) - (a.at||0));
  const kidsWith = S.children.filter(k => (S.stories||[]).some(s => s.kid === k.id));
  let h = `<div class="card"><div class="row between" style="flex-wrap:wrap;gap:8px"><div class="seg" style="width:auto"><button data-act="stMode" data-v="stories" aria-pressed="${mode==="stories"}">${T("Par histoire")}</button><button data-act="stMode" data-v="chars" aria-pressed="${mode==="chars"}">${T("Personnages")}</button></div><div class="row"><button class="btn sm ghost" data-act="stFav" aria-pressed="${fav}">${icon("star")}${T("Favoris")}</button><button class="btn sm kid" data-act="createKind" data-v="story">${icon("plus")}${T("Nouvelle")}</button></div></div>
    ${(S.stories||[]).length > 1 ? `<div class="story-filters"><input class="inp" id="st-q" type="search" placeholder="${T("Chercher une histoire, un personnage…")}" value="${esc(UI.stQ||"")}" data-change="stQ"><select class="inp" data-change="stChar" aria-label="${T("Personnage")}"><option value="">${T("Tous les personnages")}</option>${allChars.map(n => `<option ${fc===n?"selected":""}>${esc(n)}</option>`).join("")}</select><select class="inp" data-change="stSort" aria-label="${T("Trier")}">${[["new",T("Plus récentes d'abord")],["old",T("Plus anciennes d'abord")],["az",T("Titre A → Z")],["za",T("Titre Z → A")]].map(([k, l]) => `<option value="${k}" ${sort===k?"selected":""}>${l}</option>`).join("")}</select></div>${q || fc ? `<div class="row between"><span class="tiny muted">${T("{n} histoire(s)",{n:list.length})}</span><button class="btn sm line" data-act="stClear">${T("Effacer les filtres")}</button></div>` : ""}` : ""}
    ${kidsWith.length ? `<div class="pick chips-scroll" style="flex-wrap:nowrap;overflow-x:auto"><button data-act="stKid" data-v="" aria-pressed="${!fk}">${T("Toutes")}</button>${kidsWith.map(k => `<button data-act="stKid" data-v="${k.id}" aria-pressed="${fk===k.id}">${avatarOf(k,18)} ${esc(k.nick||k.name)}</button>`).join("")}${(S.stories||[]).some(s => !s.kid) ? `<button data-act="stKid" data-v="fam" aria-pressed="${fk==="fam"}">${T("Toute la famille")}</button>` : ""}</div>` : ""}</div>`;
  if (!list.length) return h + `<div class="card">${empty("moon", T("Vos histoires apparaîtront ici, avec leurs chapitres et leurs personnages."))}</div>`;
  if (mode === "stories") return h + list.map(s => `<div class="story-row"><button class="card story-card" data-act="storyOpen" data-v="${s.id}"><div class="row between"><div class="grow" style="min-width:0"><span class="eyebrow">${s.kid&&kidById(s.kid)?T("Pour {n}",{n:esc(kidById(s.kid).nick||kidById(s.kid).name)}):T("Pour toute la famille")} · ${T("{n} chapitre(s)",{n:s.chapters.length})}${s.cover?" · " + T("illustré"):""}</span><h3>${esc(s.title)}</h3></div>${s.fav?icon("star").replace('fill="none"','fill="currentColor"').replace("<svg",'<svg style="width:20px;height:20px;color:var(--butter-ink)"'):""}</div><p class="small muted clamp2">${esc(s.chapters.at(-1)?.summary||"")}</p><div class="row" style="flex-wrap:wrap;gap:6px">${s.characters.filter(x => x.id !== "narr").map(x => `<span class="chip ${chColor(s, x.id)}">${esc(x.name)}</span>`).join("")}</div></button><button class="story-next" data-act="storyNextSheet" data-v="${s.id}" aria-label="${T("Chapitre suivant")}">${icon("spark")}<span>${T("Chapitre {n}",{n:s.chapters.length+1})}</span></button></div>`).join("");
  return h + list.map(s => `<div class="card"><div class="card-h"><h3>${esc(s.title)}</h3><button class="btn sm ghost" data-act="storyOpen" data-v="${s.id}">${T("Ouvrir")}</button></div><div class="list">${s.characters.map(x => `<button class="li" data-act="charForm" data-v="${s.id}|${x.id}"><div class="ic" style="background:var(--${chColor(s,x.id)}-bg, var(--surface2));color:var(--${chColor(s,x.id)}-ink, var(--ink))">${icon(x.id==="narr"?"book":"user")}</div><div class="grow"><div class="li-title">${esc(x.name)}${x.fav?" ★":""}</div><div class="small muted">${esc(x.desc||T("Narrateur"))} · ${T("voix")} ${esc((s.engine==="gemini"?x.voice?.gv:voiceLabel(x.voice?.dv))||T("auto"))}</div></div>${icon("sliders")}</button>`).join("")}</div></div>`).join("");
}
function storyOpen(id){
  const s = (S.stories||[]).find(x => x.id === id); if (!s) return;
  s.characters.forEach((x, i) => { if (x.id === "narr" || x.voice?.custom || x.voice?.g) return; x.gender = x.gender || guessGender(x.name, x.desc); x.voice = autoVoice(x.kind, i, x.gender); });
  UI.storyId = id;
  const playing = PL.story === id && PL.on;
  if (UI.readMode) return storyBook(s, id, playing);
  sheet(`${sheetHead(esc(s.title))}<div class="row" style="gap:8px;flex-wrap:wrap"><span class="small muted">${T("Histoire pour")}</span><select class="inp" style="width:auto;padding:6px 10px" data-change="storyKid" data-v="${id}"><option value="">${T("Toute la famille")}</option>${S.children.filter(k => !isPrenatal(k)).map(k => `<option value="${k.id}" ${s.kid===k.id?"selected":""}>${esc(k.nick||k.name)}</option>`).join("")}</select><span class="tiny muted">${T("Créée le {d}",{d:fmtD(new Date(s.at||Date.now()),{day:"numeric",month:"long",year:"numeric"})})}</span></div>
    <div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn sm ghost" data-act="storyFav" data-v="${id}">${icon("star")}${s.fav?T("Favori ✓"):T("Favori")}</button>
      <div class="seg" style="width:auto"><button data-act="storyEngine" data-v="device" aria-pressed="${s.engine!=="gemini"}">${T("Voix de l'appareil")}</button><button data-act="storyEngine" data-v="gemini" aria-pressed="${s.engine==="gemini"}">${T("Voix Gemini")}</button></div></div>
    <p class="tiny muted">${s.engine==="gemini" ? T("Voix naturelles générées par Gemini (quelques secondes par réplique, utilise votre clé).") : T("Voix intégrées au téléphone : instantanées et gratuites. Réglez la voix de chaque personnage ci-dessous.")}</p>
    <div class="row" style="flex-wrap:wrap;gap:6px">${s.characters.map(x => `<button class="chip ${chColor(s,x.id)}" data-act="charForm" data-v="${id}|${x.id}">${icon("edit").replace("<svg",'<svg style="width:13px;height:13px;vertical-align:-2px"')} ${esc(x.name)}</button>`).join("")}<button class="chip" style="border:1px dashed var(--line)" data-act="charForm" data-v="${id}|new">${icon("plus").replace("<svg",'<svg style="width:13px;height:13px;vertical-align:-2px"')} ${T("Personnage")}</button></div>
    <div class="read-bar"><span class="tiny muted">${T("Taille du texte")}</span><button class="btn sm ghost" data-act="storyZoom" data-v="-" aria-label="${T("Texte plus petit")}">A−</button><b class="tiny num" id="zoomVal">${Math.round(storyZ()*100)} %</b><button class="btn sm ghost" data-act="storyZoom" data-v="+" aria-label="${T("Texte plus grand")}">A+</button><button class="btn sm kid" data-act="storyRead">${icon("book")}${T("Mode lecture")}</button><button class="btn sm ghost" data-act="storyBookShop" data-v="${id}">${icon("image")}${T("Livre illustré")}</button><button class="btn sm ghost" data-act="flipOpen" data-v="${id}">${icon("book")}${T("Feuilleter")}</button></div>
    <div class="story-text" id="storyText" style="--sz:${storyZ()}">
    ${s.chapters.map((ch, ci) => `<div class="chapter"><div class="row between"><h3>${T("Chapitre {n}",{n:ch.n})} · ${esc(ch.title)}</h3><div class="row" style="gap:4px;flex-wrap:nowrap">${chCtl(s, id, ci, playing)}</div></div>
      ${ch.img ? `<img class="story-img" data-stimg="${ch.img}" alt="${esc(ch.title)}">` : ""}<div class="row" style="gap:6px"><button class="btn sm ghost" data-act="storyImg" data-v="${id}|${ci}">${icon("camera")}${ch.img?T("Nouvelle image"):T("Illustrer ce chapitre")}</button><button class="btn sm ghost" data-act="storySimplify" data-v="${id}|${ci}">${icon("spark")}${T("Mots plus simples")}</button></div>
      ${segsHtml(s, id, ci, ch, playing)}</div>`).join("")}
    </div>
    <div class="card tint"><h3>${T("Chapitre suivant")}</h3><div class="stack" style="gap:10px">${fld("st-dir",T("Où va l'histoire ? (facultatif)"),inp("st-dir","",`placeholder="${T("Ex. : ils trouvent une carte au trésor")}"`))}
      <div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-act="storyNextIdeas" data-v="${id}">${icon("bulb")}${T("Proposer des suites")}</button><button class="btn kid" data-act="storyNext" data-v="${id}">${icon("spark")}${T("Écrire le chapitre {n}",{n:s.chapters.length+1})}</button></div><div id="nextIdeas"></div></div></div>
    <div class="row"><button class="btn ghost" data-act="storyShare" data-v="${id}">${icon("share")}${T("Partager")}</button>${feat("memories")?`<button class="btn ghost" data-act="storyKeep" data-v="${id}">${icon("star")}${T("Garder dans les souvenirs")}</button>`:""}<button class="btn danger" data-act="storyDel" data-v="${id}">${icon("trash")}</button></div>`, "wide");
  storyAfterOpen();
}
/* morceaux communs : contrôles d'écoute et texte d'un chapitre */
function chCtl(s, id, ci, playing){ return `${playing && PL.ch === ci ? `<button class="btn sm kid" data-act="storyPause">${icon("pause")}${T("Pause")}</button><button class="btn sm ghost" data-act="storyStop" data-v="${id}" aria-label="${T("Arrêter")}">${icon("x")}</button>` : s.pos?.ch === ci && s.pos.i > 0 ? `<button class="btn sm kid" data-act="storyPlayFrom" data-v="${id}|${ci}|${s.pos.i}">${icon("play")}${T("Reprendre")}</button><button class="btn sm ghost" data-act="storyPlayFrom" data-v="${id}|${ci}|0" aria-label="${T("Rejouer depuis le début")}">${icon("replay")}</button>` : `<button class="btn sm kid" data-act="storyPlayFrom" data-v="${id}|${ci}|0">${icon("play")}${T("Écouter")}</button>`}`; }
function segsHtml(s, id, ci, ch, playing){ return `${ch.segs.map((sg, si) => `<p class="seg-line ${sg.c==="narr"?"narr":""} ${s.pos?.ch===ci && s.pos.i===si && !playing?"mark":""}" id="sg-${ci}-${si}" data-act="storyPlayFrom" data-v="${id}|${ci}|${si}" title="${T("Lire à partir d'ici")}">${sg.c!=="narr"?`<b class="who" style="color:var(--${chColor(s,sg.c)}-ink)">${esc(s.characters.find(x=>x.id===sg.c)?.name||"")}</b> `:""}${esc(sg.t)}</p>`).join("")}`; }
function zoomBar(){ return `<span class="tiny muted">${T("Taille du texte")}</span><button class="btn sm ghost" data-act="storyZoom" data-v="-" aria-label="${T("Texte plus petit")}">A−</button><b class="tiny num" id="zoomVal">${Math.round(storyZ()*100)} %</b><button class="btn sm ghost" data-act="storyZoom" data-v="+" aria-label="${T("Texte plus grand")}">A+</button>`; }
/* mode lecture : un vrai livre (couverture, une image par chapitre, texte en grand) */
const chSelect = s => s.chapters.length > 1 ? `<select class="inp ch-select" data-change="bookSelOne" data-v="${s.id}" aria-label="${T("Chapitres")}"><option value="">${T("Tous les chapitres")}</option>${s.chapters.map((ch, ci) => `<option value="${ci}" ${(s.bookSel||[]).length === 1 && s.bookSel[0] === ci ? "selected" : ""}>${T("Chapitre {n}",{n:ch.n})} · ${esc(ch.title)}</option>`).join("")}</select>` : "";
function storyBook(s, id, playing){
  const kid = kidById(s.kid), done = s.chapters.filter(c => c.img).length;
  sheet(`<div class="book-top">${sheetHead(esc(s.title))}<div class="read-bar">${zoomBar()}<button class="btn sm ghost" data-act="storyRead">${icon("x")}${T("Quitter la lecture")}</button><button class="btn sm ${s.cover && done === s.chapters.length ? "ghost" : "kid"}" data-act="storyBookShop" data-v="${id}">${icon("image")}${T("Illustrer le livre")}${s.cover || done ? ` · ${(s.cover?1:0) + done}/${s.chapters.length + 1}` : ""}</button><button class="btn sm ghost" data-act="storyPdf" data-v="${id}">${icon("doc")}${T("Livre PDF")}</button><button class="btn sm kid" data-act="flipOpen" data-v="${id}">${icon("book")}${T("Feuilleter")}</button>${chSelect(s)}</div></div>
    <div class="book" id="storyText" style="--sz:${storyZ()}">
      <section class="book-cover">${s.cover ? `<img class="cover-img" data-stimg="${s.cover}" alt="${esc(s.title)}">` : `<button class="cover-ph" data-act="storyBookShop" data-v="${id}">${icon("image")}<span>${T("Ajouter une couverture")}</span></button>`}
        <h1>${esc(s.title)}</h1>${kid ? `<p>${T("Une histoire pour {n}",{n:esc(kid.nick||kid.name)})}</p>` : ""}<p class="tiny muted">${T("{n} chapitre(s)",{n:s.chapters.length})} · ${esc(s.characters.filter(x => x.id !== "narr").map(x => x.name).join(", "))}</p></section>
      ${s.chapters.map((ch, ci) => !bookSel(s).includes(ci) ? "" : `<section class="book-page">${ch.img ? `<img class="story-img" data-stimg="${ch.img}" alt="${esc(ch.title)}">` : ""}
        <div class="row between"><h2>${T("Chapitre {n}",{n:ch.n})} · ${esc(ch.title)}</h2><div class="row" style="gap:4px;flex-wrap:nowrap">${chCtl(s, id, ci, playing)}</div></div>
        ${segsHtml(s, id, ci, ch, playing)}</section>`).join("")}
      <section class="book-end">${T("Fin")} ✦</section></div>`, "wide reading");
  storyAfterOpen();
}
function storyAfterOpen(){
  $$("#layer img[data-stimg]").forEach(async im => { im.classList.add("zoomable"); im.dataset.act = "viewImg"; const d = await PhotoDB.get(im.dataset.stimg); if (d) im.src = d; else im.remove(); });
  const box = $("#storyText"); if (box) pinchText(box, () => storyZ(), z => { S.settings.storyZoom = z; box.style.setProperty("--sz", z); const v = $("#zoomVal"); if (v) v.textContent = Math.round(z*100) + " %"; }, () => save());
}
/* taille du texte des histoires (boutons ou pincement à deux doigts) */
const storyZ = () => clamp(+S.settings.storyZoom || 1, 0.8, 2.4);
function pinchText(el, get, set, done){
  let d0 = 0, z0 = 1;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  el.addEventListener("touchstart", e => { if (e.touches.length === 2){ d0 = dist(e.touches); z0 = get(); } }, {passive:true});
  el.addEventListener("touchmove", e => { if (e.touches.length === 2 && d0){ e.preventDefault(); set(clamp(Math.round(z0 * dist(e.touches) / d0 * 20) / 20, 0.8, 2.4)); } }, {passive:false});
  el.addEventListener("touchend", e => { if (d0 && e.touches.length < 2){ d0 = 0; done?.(); } });
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
  if (img) Promise.resolve(p).then(() => { const t = setInterval(() => { if (s.chapters.length > n){ clearInterval(t); S.settings.ai.imgPaidOnly ? toast(T("Chapitre prêt : touchez « Illustrer ce chapitre » pour créer l'image avec l'app Gemini")) : storyImage(id, n, true); } }, 1500); setTimeout(() => clearInterval(t), 180000); });
}
/* ---------- images d'histoire (modèle image de Gemini) ---------- */
async function imageModels(){
  if (S.settings.ai.imgModels?.at && Date.now() - S.settings.ai.imgModels.at < 7*864e5) return S.settings.ai.imgModels.list;
  let list = [];
  try { const d = await (await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {headers:{"x-goog-api-key":aiKey()}})).json();
    list = (d.models||[]).filter(m => /image/i.test(m.name) && /gemini/i.test(m.name) && (m.supportedGenerationMethods||[]).includes("generateContent")).map(m => m.name.replace(/^models\//, ""))
      .sort((a, b) => (parseFloat(b.match(/(\d+(\.\d+)?)/)?.[1])||0) - (parseFloat(a.match(/(\d+(\.\d+)?)/)?.[1])||0)); } catch(e){}
  list = [...new Set(["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image", ...list, "gemini-nano-banana-2.1", "gemini-2.5-flash-image"])];
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
    const prompt = storyImgPrompt(s, ch, !!ref);
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
    const paid = /quota|limit: ?0|billing|exceeded|RESOURCE_EXHAUSTED|not available|free tier|not found|NOT_FOUND/i.test(lastErr?.message||"");
    if (paid) S.settings.ai.imgPaidOnly = true, save();
    throw new Error(paid ? T("La création d'images par l'API Gemini demande une clé avec facturation activée (pas de version gratuite). Touchez « Illustrer » puis « Copier le prompt » pour la créer gratuitement dans l'app Gemini.") : T("Image impossible : {e}",{e:lastErr?.message||"?"}));
  }, {kid:s.kid, open:() => storyOpen(sid)});
}
/* description de l'image (anglais : meilleurs résultats) ; aussi copiable pour l'app Gemini */
function storyImgPrompt(s, ch, withRef){
  const who = s.characters.filter(x => x.id !== "narr" && x.look && ch.segs.some(sg => sg.c === x.id));
  const cast = (who.length ? who : s.characters.filter(x => x.id !== "narr" && x.look)).slice(0, 5);
  return `${s.style || "soft watercolor children's picture book illustration, warm gentle light, rounded friendly shapes"}. One single illustration for the chapter "${ch.title}" of the bedtime story "${s.title}". Scene: ${ch.summary} Characters (draw them EXACTLY like this, same look in every picture): ${cast.map(x => `${x.name}: ${x.look}`).join(" | ")}. ${withRef ? "Keep the characters' appearance and the art style identical to the reference image provided." : ""} No text, no letters, no words in the image. Child-friendly, calm, square format.`;
}
function storyImgSheet(sid, ci){
  const s = S.stories.find(x => x.id === sid), ch = s?.chapters[+ci]; if (!ch) return;
  const prev = s.chapters.slice(0, +ci).reverse().find(x => x.img) || s.chapters.find((x, i) => i !== +ci && x.img);
  sheet(`${sheetHead(T("Illustrer · {t}",{t:esc(ch.title)}))}
    <div class="card tint" style="padding:12px 14px"><h3>${T("Gratuit : avec l'app Gemini")}</h3>
      <ol class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px"><li>${T("Copiez le prompt (il décrit la scène et l'apparence exacte des personnages).")}</li><li>${T("Ouvrez Gemini, choisissez « Créer une image », collez le prompt.")}${prev?` ${T("Pour garder les mêmes personnages, joignez aussi l'image du chapitre précédent (bouton ci-dessous pour l'enregistrer).")}`:""}</li><li>${T("Enregistrez l'image, puis touchez « Ajouter l'image créée ».")}</li></ol>
      <div id="imgPrompt" class="small" style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:8px 10px;max-height:140px;overflow:auto"><span class="spin"></span> ${T("Préparation du prompt…")}</div>
      <div class="row" style="flex-wrap:wrap"><button class="btn sm kid" data-act="storyImgCopy">${icon("note")}${T("Copier le prompt")}</button><a class="btn sm ghost" href="https://gemini.google.com/app" target="_blank" rel="noopener">${icon("spark")}${T("Ouvrir Gemini")}</a>${prev?`<button class="btn sm ghost" data-act="storyImgSaveRef" data-v="${prev.img}">${icon("share")}${T("Image de référence")}</button>`:""}</div>
      <button class="btn kid" data-act="storyImgImport" data-v="${sid}|${ci}">${icon("image")}${T("Ajouter l'image créée")}</button></div>
    <div class="card" style="padding:12px 14px"><h3>${T("Directement ici (clé payante)")}</h3><p class="small muted">${T("La création d'images par l'API Gemini n'a pas de version gratuite : il faut activer la facturation sur votre clé (environ 3 à 7 ¢ par image).")}</p>
      <button class="btn sm ghost" data-act="storyImgGen" data-v="${sid}|${ci}">${icon("spark")}${T("Essayer quand même")}</button></div>`);
  UI.imgPromptTxt = "";
  storyLooks(s).catch(() => {}).finally(() => { UI.imgPromptTxt = storyImgPrompt(s, ch, !!prev); const el = $("#imgPrompt"); if (el) el.textContent = UI.imgPromptTxt; });
}
/* ---------- livre illustré : prompts à copier dans l'app Gemini (gratuit), une seule conversation ---------- */
const STY = s => s.style || "soft watercolor children's picture book illustration, warm gentle light, rounded friendly shapes";
const castOf = s => s.characters.filter(x => x.id !== "narr").slice(0, 6).map(x => `${x.name}: ${x.look || x.desc || x.name}`).join(" | ");
/* pages du livre : chaque chapitre découpé en scènes (une image + le texte qui va avec) */
const segWords = sg => String(sg.t||"").split(/\s+/).length;
function autoPages(ch, n){
  const tot = sum(ch.segs.map(segWords)), per = Math.max(25, tot / Math.max(1, n || Math.round(tot / 55) || 1)), out = []; let cur = null, w = 0;
  ch.segs.forEach((sg, i) => { if (!cur || (w >= per && out.length < (n || 99))){ cur = {from:i, to:i}; out.push(cur); w = 0; } cur.to = i; w += segWords(sg); });
  return out.map(p => ({...p, scene:ch.segs.slice(p.from, p.to + 1).map(x => x.t).join(" ").slice(0, 300)}));
}
const pagesOf = ch => ch.pages?.length ? ch.pages : autoPages(ch, chN(ch));
/* nombre d'images conseillé pour un chapitre : environ une scène pour 45 mots (1 à 12) */
const suggestN = ch => Math.max(1, Math.min(12, ch.segs.length, Math.round(sum(ch.segs.map(segWords)) / 45) || 1));
const chN = ch => Math.min(ch.segs.length, ch.pagesN || suggestN(ch));
/* chapitres choisis pour le livre (tous par défaut) */
const bookSel = s => { const all = s.chapters.map((_, i) => i), sel = (s.bookSel || []).filter(i => i < s.chapters.length); return sel.length ? sel : all; };
const PAGE_SCHEMA = {type:"OBJECT", properties:{pages:{type:"ARRAY", items:{type:"OBJECT", properties:{from:{type:"INTEGER"}, to:{type:"INTEGER"}, scene:{type:"STRING"}, who:{type:"ARRAY", items:{type:"STRING"}}}, required:["from","to","scene"]}}}, required:["pages"]};
/* l'IA découpe chaque chapitre en scènes (actions, événements) et décrit chaque image en anglais */
async function storyScenes(s, force, only){
  for (const [ci, ch] of s.chapters.entries()){
    if (only && !only.includes(ci)) continue;
    const n = chN(ch);
    if (ch.pages?.length && !force && (ch.pagesFor ?? ch.pages.length) === n) continue;
    let pages = null;
    if (aiKey()) try {
      const r = await gemini({tier:"fast", json:PAGE_SCHEMA, temperature:0.3, contents:[{role:"user", parts:[{text:`Livre illustré pour enfants « ${s.title} », chapitre « ${ch.title} ». Découpe le texte en exactement ${n} page(s) comme un vrai album jeunesse : chaque page = une action ou un événement important, avec des répliques consécutives (from et to = numéros des répliques, inclusifs ; toutes les répliques couvertes, dans l'ordre, sans trou ni chevauchement). Pour chaque page, scene = description visuelle précise EN ANGLAIS de l'image à dessiner pour ce moment (lieu, action, émotions, éléments importants), sans texte dans l'image ; who = noms des personnages visibles.\nPersonnages : ${s.characters.filter(x => x.id !== "narr").map(x => x.name).join(", ")}.\nRépliques :\n${ch.segs.map((sg, i) => `${i}. ${sg.c !== "narr" ? (s.characters.find(x => x.id === sg.c)?.name || "") + " : " : ""}${sg.t}`).join("\n")}`}]}]});
      const P = (parseJSON(r.text).pages || []).map(p => ({from:Math.max(0, +p.from|0), to:Math.min(ch.segs.length - 1, +p.to|0), scene:p.scene || "", who:p.who || []})).filter(p => p.to >= p.from).sort((x, y) => x.from - y.from);
      let ok = P.length && P[0].from === 0 && P.at(-1).to === ch.segs.length - 1; for (let i = 1; ok && i < P.length; i++) if (P[i].from !== P[i-1].to + 1) ok = false;
      if (ok) pages = P;
    } catch(e){ console.warn("scenes", e); }
    const old = ch.pages || [];
    ch.pages = (pages || autoPages(ch, n)).map((p, i) => ({...p, img:old[i]?.img || (i === 0 && !old.length ? ch.img || null : null)})); ch.pagesFor = n;
  }
  save();
}
function bookPrompts(s){
  const kid = kidById(s.kid), lang = LANG === "en" ? "English" : "French", sel = bookSel(s);
  const P = [{k:"ref", t:T("Les personnages (référence)"), d:T("Une planche avec tous les personnages : Gemini s'en servira pour les dessiner pareils ensuite."), img:s.refImg,
      p:`${STY(s)}. Character reference sheet for the children's picture book "${s.title}". Draw each main character side by side, full body, front view, on a plain light background, clearly separated, friendly expressions. Characters: ${castOf(s)}. No text, no letters.`},
    {k:"cover", t:T("La couverture"), d:T("Avec le titre écrit en grand, comme un vrai livre."), img:s.cover,
      p:`Using exactly the same characters and art style as the character sheet above: ${STY(s)}. Front cover of a children's picture book, portrait format (3:4). At the top, write the title "${s.title}" in large, playful, rounded, easy-to-read letters (${lang}, spelled exactly like this). ${kid ? `At the bottom, small text: "${T("Une histoire pour {n}",{n:kid.nick||kid.name})}". ` : ""}Inviting, magical scene that captures the whole story: ${s.chapters.map(c => c.summary).join(" ")} Characters: ${castOf(s)}. No other text.`}];
  s.chapters.forEach((ch, ci) => { if (!sel.includes(ci)) return; pagesOf(ch).forEach((pg, pi) => {
    const names = (pg.who?.length ? pg.who : s.characters.filter(x => x.id !== "narr" && (ch.segs.slice(pg.from, pg.to + 1).some(sg => sg.c === x.id || sg.t.includes(x.name)))).map(x => x.name));
    const cast = s.characters.filter(x => names.includes(x.name)).map(x => `${x.name}: ${x.look || x.desc}`).join(" | ");
    P.push({k:`p${ci}_${pi}`, ci, pi, t:T("Chapitre {c} · page {p}",{c:ch.n, p:pi + 1}), d:ch.segs.slice(pg.from, pg.to + 1).map(x => x.t).join(" ").slice(0, 110) + "…", img:pg.img,
      p:`Next page of the same picture book: exactly the same characters and the same art style as the previous images. ${STY(s)}. Scene: ${pg.scene}${cast ? ` Characters in this picture (keep their exact look): ${cast}.` : " No characters needed."} No text, no letters, no speech bubbles. Square format.`});
  }); });
  return P;
}
/* choix des chapitres : les boutons changent tout de suite, puis l'analyse se fait une seule fois */
function bookSelShow(s){ const sel = s.bookSel || []; $$("[data-act=bookSelAll]").forEach(b => b.setAttribute("aria-pressed", !sel.length)); $$("[data-act=bookSelTog]").forEach(b => b.setAttribute("aria-pressed", sel.includes(+b.dataset.v.split("|")[1]))); }
let bookT = null;
function bookRefresh(sid){
  clearTimeout(bookT); const st = $("#bookBusy"); if (st) st.innerHTML = `<span class="spin"></span> ${T("Analyse des chapitres choisis…")}`;
  bookT = setTimeout(async () => { if (UI.bookBusy){ UI.bookAgain = sid; return; } UI.bookBusy = true;
    try { await storyBookShop(sid, true); } finally { UI.bookBusy = false; if (UI.bookAgain){ const x = UI.bookAgain; UI.bookAgain = null; bookRefresh(x); } } }, 500);
}
/* cases d'images : lire et changer l'image d'une case */
function slotGet(s, k){ if (k === "cover") return s.cover; if (k === "ref") return s.refImg; const [ci, pi] = k.slice(1).split("_").map(Number); return s.chapters[ci]?.pages?.[pi]?.img || null; }
function slotSet(s, k, id){ if (k === "cover") s.cover = id; else if (k === "ref") s.refImg = id; else { const [ci, pi] = k.slice(1).split("_").map(Number), ch = s.chapters[ci], pg = ch?.pages?.[pi]; if (!pg) return; pg.img = id; if (pi === 0) ch.img = id; } }
/* vérifier et corriger l'ordre des images (après un import de plusieurs images, par exemple) */
function bookOrder(sid, note){
  const s = S.stories.find(x => x.id === sid); if (!s) return; const P = bookPrompts(s); UI.bookOrderP = P.map(x => x.k);
  sheet(`${sheetHead(T("Ordre des images"))}${note ? `<div class="banner ok">${icon("check")}<div class="small">${esc(note)}</div></div>` : ""}<p class="small muted">${T("Chaque image doit aller avec son texte. Utilisez ↑ ↓ pour la déplacer ; elle échange sa place avec la case voisine.")}</p>
    <div class="stack" style="gap:8px">${P.map((x, i) => `<div class="order-row"><div class="order-img">${x.img ? `<img data-stimg="${x.img}" alt="">` : `<span class="tiny muted">${T("vide")}</span>`}</div><div class="grow" style="min-width:0"><b class="small">${esc(x.t)}</b>${x.d ? `<div class="tiny muted clamp2">${esc(x.d)}</div>` : ""}</div><div class="stack" style="gap:4px"><button class="icon-btn" data-act="bookSwap" data-v="${sid}|${i}|-1" ${i ? "" : "disabled"} aria-label="${T("Monter")}">↑</button><button class="icon-btn" data-act="bookSwap" data-v="${sid}|${i}|1" ${i < P.length - 1 ? "" : "disabled"} aria-label="${T("Descendre")}">↓</button></div></div>`).join("")}</div>
    <button class="btn kid" data-act="storyBookShop" data-v="${sid}">${icon("check")}${T("C'est bon")}</button>`, "wide");
  $$("#layer img[data-stimg]").forEach(async im => { im.dataset.act = "viewImg"; const d = await PhotoDB.get(im.dataset.stimg); if (d) im.src = d; });
}
/* une seule demande pour toutes les images qui manquent (Gemini les crée l'une après l'autre) */
const batchPrompt = (s, list) => `I am making a children's picture book called "${s.title}". Please create the following ${list.length} illustrations, ONE SEPARATE IMAGE EACH, one after another, in this exact order, all with exactly the same characters and the same art style (${STY(s)}). Do not put any text in the images except the title on the cover. If you can't make them all at once, make the first ones and I will say "continue".\n\n${list.map((x, i) => `IMAGE ${i + 1} — ${x.t}:\n${x.p}`).join("\n\n")}`;
/* place une image dans la bonne case du livre */
async function bookSetSlot(s, k, dataUrl){
  const small = await shrinkImage(dataUrl, k === "cover" ? 1400 : 1024, 0.85), id = "stimg-" + uid(); await PhotoDB.put(id, small);
  if (k === "cover"){ if (s.cover) PhotoDB.del(s.cover).catch(() => {}); s.cover = id; }
  else if (k === "ref"){ if (s.refImg) PhotoDB.del(s.refImg).catch(() => {}); s.refImg = id; }
  else if (k.startsWith("p")){ const [ci, pi] = k.slice(1).split("_").map(Number), ch = s.chapters[ci], pg = ch?.pages?.[pi]; if (!pg) return; if (pg.img && pg.img !== ch.img) PhotoDB.del(pg.img).catch(() => {}); pg.img = id; if (pi === 0) ch.img = id; }
}
/* création directe par l'API (clé avec facturation) */
async function genImage(prompt, ref){
  let lastErr;
  for (const model of await imageModels()){
    try {
      const parts = [...(ref ? [{inline_data:{mime_type:"image/jpeg", data:ref.split(",")[1]}}] : []), {text:prompt}];
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {method:"POST", headers:{"Content-Type":"application/json", "x-goog-api-key":aiKey()}, body:JSON.stringify({contents:[{role:"user", parts}], generationConfig:{responseModalities:["IMAGE","TEXT"]}})});
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || `Gemini ${r.status}`);
      const img = (d.candidates?.[0]?.content?.parts||[]).find(p => p.inlineData || p.inline_data), id2 = img?.inlineData || img?.inline_data;
      if (!id2?.data) throw new Error(d.candidates?.[0]?.finishReason || T("pas d'image"));
      return `data:${id2.mimeType||id2.mime_type||"image/png"};base64,${id2.data}`;
    } catch(e){ lastErr = e; AI_LAST_ERR = `${model} : ${e.message}`.slice(0, 300); if (/API_KEY_INVALID|PERMISSION_DENIED/i.test(e.message)) break; }
  }
  const paid = /quota|limit: ?0|billing|exceeded|RESOURCE_EXHAUSTED|not available|free tier|not found|NOT_FOUND/i.test(lastErr?.message||"");
  if (paid) S.settings.ai.imgPaidOnly = true, save();
  throw new Error(paid ? T("La création d'images par l'API demande une clé avec facturation activée. Utilisez plutôt l'app Gemini (gratuit).") : T("Image impossible : {e}",{e:lastErr?.message||"?"}));
}
async function storyBookShop(sid, keep){
  const s = S.stories.find(x => x.id === sid); if (!s) return; UI.storyId = sid;
  if (!keep) sheet(`${sheetHead(T("Livre illustré"))}<p class="small muted"><span class="spin"></span> ${T("Préparation des prompts…")}</p>`, "wide");
  try { if (aiKey()) await storyLooks(s); } catch(e){}
  await storyScenes(s, false, bookSel(s));
  s.characters.forEach(ch => { if (ch.id !== "narr" && !ch.look) ch.look = ch.desc || ch.name; });
  const P = bookPrompts(s), sel = bookSel(s), all = sel.length === s.chapters.length; UI.bookP = P; const done = P.filter(x => x.img).length, miss = P.filter(x => !x.img);
  sheet(`${sheetHead(T("Livre illustré"))}
    <div class="field"><label>${T("Chapitres du livre")}</label><div class="pick chips-scroll" style="flex-wrap:nowrap;overflow-x:auto"><button data-act="bookSelAll" data-v="${sid}" aria-pressed="${all}">${T("Tous")}</button>${s.chapters.map((ch, ci) => `<button data-act="bookSelTog" data-v="${sid}|${ci}" aria-pressed="${!all && sel.includes(ci)}">${T("Ch. {n}",{n:ch.n})}</button>`).join("")}</div><div id="bookBusy" class="tiny muted" style="min-height:1.2em"></div></div>
    <details class="card lexcard" ${UI.bookNOpen ? "open" : ""}><summary><b>${icon("image")} ${T("Images par chapitre")}</b> <span class="tiny muted">${T("suggéré selon la longueur, modifiable")}</span></summary><div class="stack" style="gap:6px">${sel.map(ci => { const ch = s.chapters[ci]; return `<div class="row between" style="gap:8px"><span class="small" style="min-width:0">${T("Ch. {n}",{n:ch.n})} · ${esc(ch.title)}</span><select class="inp" style="width:auto;padding:6px 8px" data-change="bookN" data-v="${sid}|${ci}"><option value="">${T("Auto ({n})",{n:suggestN(ch)})}</option>${Array.from({length:12}, (_, k) => k + 1).filter(k => k <= ch.segs.length).map(k => `<option value="${k}" ${ch.pagesN === k ? "selected" : ""}>${k}</option>`).join("")}</select></div>`; }).join("")}</div></details>
    <div class="row between"><span class="small"><b>${done}</b> / ${P.length} ${T("images")}</span><span class="tiny muted">${miss.length ? T("{n} à créer",{n:miss.length}) : T("Livre complet !")}</span></div>
    <div class="levelbar"><i style="width:${Math.max(2, done / P.length * 100).toFixed(0)}%"></i></div>
    ${miss.length ? `<div class="card tint" style="padding:12px 14px"><b>${icon("spark")} ${T("Le plus rapide (gratuit) : tout d'un coup")}</b>
      <ol class="small" style="margin:6px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:3px"><li>${T("« Envoyer à Gemini » : choisissez Gemini dans la liste ; la demande contient toutes les images qui manquent, dans l'ordre.")}</li><li>${T("Si Gemini s'arrête, écrivez « continue ». Enregistrez les images au fur et à mesure.")}</li><li>${T("« Importer plusieurs images » : sélectionnez-les toutes, dans l'ordre ; elles se placent toutes seules.")}</li></ol>
      <div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn sm kid" data-act="bookSendAll">${icon("share")}${T("Envoyer à Gemini")}</button><button class="btn sm ghost" data-act="bookCopyAll">${icon("note")}${T("Copier")}</button><a class="btn sm ghost" href="https://gemini.google.com/app" target="_blank" rel="noopener">${T("Ouvrir Gemini")}</a><label class="btn sm kid" style="cursor:pointer">${icon("image")}${T("Importer plusieurs images")}<input type="file" accept="image/*" multiple hidden data-change="bookMulti" data-v="${sid}"></label></div>
      <p class="tiny muted">${T("Elles iront dans les cases vides, dans cet ordre : {l}",{l:esc(miss.slice(0, 6).map(x => x.t).join(", ")) + (miss.length > 6 ? "…" : "")})}</p></div>
      <div class="card" style="padding:12px 14px"><b>${T("Encore plus rapide : directement ici")}</b><p class="small muted">${T("Demande une clé Gemini avec facturation activée (environ 4 ¢ par image, soit environ {c} $ pour ce qui manque).",{c:(miss.length * 0.04).toFixed(2)})}</p><button class="btn sm ghost" data-act="bookGenAll" data-v="${sid}">${icon("spark")}${T("Créer les {n} images ici",{n:miss.length})}</button></div>` : ""}
    ${done ? `<button class="btn sm ghost" data-act="bookOrder" data-v="${sid}" style="align-self:flex-start">${icon("sliders")}${T("Vérifier l'ordre des images")}</button>` : ""}
    <div class="stack" style="gap:8px">${P.map((x, i) => `<div class="book-step ${x.img ? "done" : ""}">${x.img ? `<img class="bs-img" data-stimg="${x.img}" alt="">` : ""}<div style="min-width:0"><b>${x.img ? "✓ " : ""}${esc(x.t)}</b>${x.d ? `<div class="tiny muted">${esc(x.d)}</div>` : ""}</div>
      <details><summary class="tiny">${T("Voir le prompt")}</summary><div class="tiny prompt-box">${esc(x.p)}</div></details>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ${x.img ? "ghost" : "kid"}" data-act="bookSend" data-v="${i}">${icon("share")}${T("Envoyer à Gemini")}</button><button class="btn sm ghost" data-act="bookCopy" data-v="${i}">${icon("note")}${T("Copier")}</button><button class="btn sm ghost" data-act="bookImport" data-v="${sid}|${x.k}">${icon("image")}${x.img ? T("Remplacer") : T("Ajouter l'image")}</button></div></div>`).join("")}</div>
    <p class="tiny muted">${T("Restez dans la même conversation Gemini : les personnages et le style restent pareils. Si un personnage change, joignez la planche des personnages avec la demande.")}</p>
    <div class="row" style="flex-wrap:wrap"><button class="btn kid" data-act="flipOpen" data-v="${sid}">${icon("book")}${T("Feuilleter le livre")}</button><button class="btn ghost" data-act="storyReadOpen" data-v="${sid}">${T("Lecture continue")}</button><button class="btn ghost" data-act="storyPdf" data-v="${sid}">${icon("doc")}${T("Livre PDF")}</button></div>`, "wide");
  $$("#layer img[data-stimg]").forEach(async im => { im.dataset.act = "viewImg"; const d = await PhotoDB.get(im.dataset.stimg); if (d) im.src = d; });
}
const shareTxt = (t, title) => Native.share({title:title || T("Prompt d'image"), text:t});
async function copyTxt(t, ok){ try { await navigator.clipboard.writeText(t); toast(ok); } catch(e){ Native.share({title:T("Prompt d'image"), text:t}); } }
/* livre PDF : couverture, puis pour chaque chapitre l'image et le texte en grand */
async function storyPdf(sid){
  const s = S.stories.find(x => x.id === sid); if (!s) return;
  if (!window.jspdf){ toast(T("Chargement du module PDF…")); await new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "js/vendor/jspdf.umd.min.js"; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }).catch(() => {}); }
  if (!window.jspdf) return toast(T("Impossible de créer le PDF ici"));
  toast(T("Création du livre…"));
  const W = 576, H = 648, M = 44, doc = new jspdf.jsPDF({unit:"pt", format:[W, H]}), ink = [42,35,64], soft = [115,107,138], kid = kidById(s.kid);
  const fmtOf = d => d.startsWith("data:image/png") ? "PNG" : "JPEG";
  const dims = d => new Promise(res => { const im = new Image(); im.onload = () => res([im.width, im.height]); im.onerror = () => res([1, 1]); im.src = d; });
  const put = async (id, x, y, w, h) => { const d = id && await PhotoDB.get(id); if (!d) return 0; const [iw, ih] = await dims(d), k = Math.min(w / iw, h / ih), dw = iw * k, dh = ih * k; doc.addImage(d, fmtOf(d), x + (w - dw) / 2, y, dw, dh); return dh; };
  const N = t => String(t).normalize("NFC").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "");
  // couverture
  doc.setFillColor(255, 245, 230); doc.rect(0, 0, W, H, "F");
  const ch0 = await put(s.cover, M, M, W - 2*M, H - 2*M - (s.cover ? 0 : 0));
  if (!ch0 || !s.cover){ doc.setFont("helvetica", "bold"); doc.setFontSize(30); doc.setTextColor(...ink); doc.splitTextToSize(N(s.title), W - 2*M).forEach((l, i) => doc.text(l, W/2, 220 + i*36, {align:"center"}));
    doc.setFont("helvetica", "normal"); doc.setFontSize(14); doc.setTextColor(...soft); if (kid) doc.text(N(T("Une histoire pour {n}",{n:kid.nick||kid.name})), W/2, 330, {align:"center"}); }
  for (const [ci, c] of s.chapters.entries()) if (bookSel(s).includes(ci)) for (const [pi, pg] of pagesOf(c).entries()){
    doc.addPage([W, H]); let y = M;
    const ih = await put(pg.img || (pi === 0 ? c.img : null), M, y, W - 2*M, 330); if (ih) y += ih + 22;
    if (pi === 0){ doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...ink); doc.splitTextToSize(N(`${T("Chapitre {n}",{n:c.n})} · ${c.title}`), W - 2*M).forEach(l => { doc.text(l, M, y); y += 22; }); y += 6; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(14); doc.setTextColor(...ink);
    for (const sg of c.segs.slice(pg.from, pg.to + 1)){ const who = sg.c !== "narr" ? (s.characters.find(x => x.id === sg.c)?.name || "") : "", txt = N((who ? who + " : " : "") + sg.t);
      for (const l of doc.splitTextToSize(txt, W - 2*M)){ if (y > H - M){ doc.addPage([W, H]); y = M + 10; doc.setFont("helvetica", "normal"); doc.setFontSize(14); doc.setTextColor(...ink); } doc.text(l, M, y); y += 20; } y += 6; }
  }
  doc.addPage([W, H]); doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(...ink); doc.text(N(T("Fin")), W/2, H/2, {align:"center"});
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...soft); doc.text(N(T("Créé avec {app} le {d}",{app:appName(), d:fmtD(today(),{day:"numeric",month:"long",year:"numeric"})})), W/2, H/2 + 30, {align:"center"});
  const total = doc.getNumberOfPages(); for (let i = 2; i < total; i++){ doc.setPage(i); doc.setFontSize(9); doc.setTextColor(...soft); doc.text(String(i - 1), W/2, H - 20, {align:"center"}); }
  Native.share({title:s.title, text:s.title, dataUrl:doc.output("datauristring"), filename:`${s.title.replace(/[^\p{L}\p{N}]+/gu, "-")}.pdf`, mime:"application/pdf"});
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
const CH_KINDS = [["enfant","Enfant"],["adulte","Adulte"],["aine","Aîné·e"],["animal","Animal"],["creature","Créature"],["robot","Robot"]];
function charForm(v){
  const [sid, cid] = v.split("|"), s = S.stories.find(x => x.id === sid); if (!s) return;
  const isNew = cid === "new", ch = isNew ? {id:"new", name:"", desc:"", kind:"enfant", gender:"fille"} : s.characters.find(x => x.id === cid); if (!ch) return;
  const lines = isNew ? 0 : sum(s.chapters.map(c => c.segs.filter(sg => sg.c === cid).length));
  const vc = ch.voice || autoVoice(ch.kind, 0, ch.gender); stopPlay();
  TTS.voices().then(list => { const sel = $("#cv-dv"); if (sel) sel.innerHTML = `<option value="">${T("Automatique")}</option>` + list.map(x => `<option value="${esc(x.id)}" ${x.id===vc.dv?"selected":""}>${esc(x.name)} (${esc(x.lang)})</option>`).join(""); });
  sheet(`<form class="stack" data-form="charSave" data-id="${v}" style="gap:12px">${sheetHead(isNew ? T("Nouveau personnage") : esc(ch.name))}
    ${cid==="narr"?"":`${fld("cv-name",T("Nom"),inp("cv-name",ch.name,"required"))}${fld("cv-desc",T("Description (caractère, apparence)"),inp("cv-desc",ch.desc||""))}
    <div class="fgrid">${fld("cv-kind",T("Type"),`<select class="inp" id="cv-kind">${CH_KINDS.map(([k,l]) => `<option value="${k}" ${ch.kind===k?"selected":""}>${T(l)}</option>`).join("")}</select>`)}${fld("cv-gender",T("Voix de"),`<select class="inp" id="cv-gender">${[["fille",T("Fille / femme")],["garcon",T("Garçon / homme")],["neutre",T("Neutre")]].map(([k,l]) => `<option value="${k}" ${ch.gender===k?"selected":""}>${l}</option>`).join("")}</select>`)}</div>
    ${isNew ? `<p class="tiny muted">${T("Il apparaîtra dans le prochain chapitre écrit par l'IA.")}</p>` : `<label class="switch"><input type="checkbox" id="cv-rename" checked><span class="tg"></span><span class="grow">${T("Si je change le nom, le remplacer aussi dans le texte")}</span></label>`}`}
    <label class="switch"><input type="checkbox" id="cv-fav" ${ch.fav?"checked":""}><span class="tg"></span><span class="grow">${T("Personnage favori")}</span></label>
    <h3>${T("Voix de l'appareil")}</h3>${fld("cv-dv",T("Voix"),`<select class="inp" id="cv-dv"><option value="">${T("Chargement…")}</option></select>`)}
    <div class="fgrid">${fld("cv-pitch",T("Hauteur"),`<input type="range" id="cv-pitch" min="0.5" max="2" step="0.05" value="${vc.pitch??1}">`)}${fld("cv-rate",T("Vitesse"),`<input type="range" id="cv-rate" min="0.6" max="1.4" step="0.05" value="${vc.rate??1}">`)}</div>
    <h3>${T("Voix Gemini")}</h3>${fld("cv-gv",T("Voix"),`<select class="inp" id="cv-gv">${GEMINI_VOICES.map(([n,d]) => `<option value="${n}" ${n===vc.gv?"selected":""}>${n} · ${T(d)}</option>`).join("")}</select>`)}
    ${fld("cv-style",T("Façon de parler (Gemini, facultatif)"),inp("cv-style",vc.style||"",`placeholder="${T("Ex. : voix douce et enjouée, un peu essoufflée")}"`))}
    <div class="row"><button type="button" class="btn ghost" data-act="charTest" data-v="device">${icon("play")}${T("Tester (appareil)")}</button><button type="button" class="btn ghost" data-act="charTest" data-v="gemini">${icon("play")}${T("Tester (Gemini)")}</button></div>
    <div class="row"><button class="btn kid grow" type="submit">${isNew ? T("Ajouter") : T("Enregistrer")}</button>${!isNew && cid !== "narr" ? `<button type="button" class="btn danger" data-act="charDel" data-v="${v}" aria-label="${T("Retirer le personnage")}">${icon("trash")}</button>` : ""}</div>
    ${!isNew && cid !== "narr" ? `<p class="tiny muted">${lines ? T("Retirer ce personnage : ses {n} réplique(s) seront lues par le narrateur, et il ne reviendra plus dans les prochains chapitres.",{n:lines}) : T("Retirer ce personnage : il ne reviendra plus dans les prochains chapitres.")}</p>` : ""}</form>`);
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
  async voiceFor(g){ const list = await this.voices(); const fem = v => /x-\w\w[ac](-|$)|female|femme|amélie|amelie|audrey|aurélie|julie|chantal|marie|samantha|karen|zira|hortense/i.test(v.name), masc = v => /x-\w\w[bd](-|$)|male|homme|thomas|nicolas|daniel|alex|paul|david|mark|henri/i.test(v.name) && !/female/i.test(v.name);
    const pick = list.filter(g === "f" ? fem : masc); return pick.length ? pick[0].id : ""; },
  async speakDevice(text, vc = {}){
    if ((vc.dv === "" || vc.dv == null) && vc.g){ const id = await this.voiceFor(vc.g).catch(() => ""); if (id !== "") vc = {...vc, dv:id}; }
    const lang = LANG === "en" ? "en-CA" : "fr-CA", p = this.plugin();
    if (p){ const opt = {text, lang, rate:vc.rate ?? 1, pitch:vc.pitch ?? 1, volume:1, category:"playback"}; if (vc.dv !== "" && vc.dv != null) opt.voice = +vc.dv; return p.speak(opt); }
    if (!("speechSynthesis" in window)) throw new Error(T("La synthèse vocale n'est pas disponible ici"));
    return new Promise(res => { const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = vc.rate ?? 1; u.pitch = vc.pitch ?? 1; const v = speechSynthesis.getVoices().find(x => x.voiceURI === vc.dv); if (v) u.voice = v; u.onend = res; u.onerror = res; speechSynthesis.speak(u); });
  },
  async stopDevice(){ const p = this.plugin(); if (p){ try { await p.stop(); } catch(e){} } else if ("speechSynthesis" in window) speechSynthesis.cancel(); },
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
function stopPlay(){ PL.on = false; PL.run++; PL.stopping = TTS.stopDevice(); if (PL.audio){ PL.audio.pause(); PL.audio = null; } $$(".seg-line.now").forEach(e => e.classList.remove("now")); }
async function playChapter(sid, ci, from = 0){
  stopPlay(); const s = S.stories.find(x => x.id === sid), ch = s?.chapters[ci]; if (!ch) return;
  Object.assign(PL, {on:true, flip:false, story:sid, ch:ci, i:from}); const run = ++PL.run; storyOpenKeepScroll(sid);
  await PL.stopping; await new Promise(r => setTimeout(r, 160)); if (PL.run !== run) return;
  const vcOf = sg => (s.characters.find(x => x.id === sg.c) || s.characters[0]).voice || {};
  for (let i = from; i < ch.segs.length && PL.on && PL.run === run; i++){
    PL.i = i; s.pos = {ch:ci, i};  $$(".seg-line.now").forEach(e => e.classList.remove("now")); const el = $(`#sg-${ci}-${i}`); if (el){ el.classList.add("now"); el.scrollIntoView({block:"center", behavior:"smooth"}); }
    const sg = ch.segs[i], vc = vcOf(sg);
    try {
      if (s.engine === "gemini"){
        const url = await TTS.gemini(sg.t, vc); if (ch.segs[i+1]) TTS.gemini(ch.segs[i+1].t, vcOf(ch.segs[i+1])).catch(() => {});
        if (!PL.on || PL.run !== run) break;
        await new Promise(res => { const a = new Audio(url); PL.audio = a; a.onended = res; a.onerror = res; a.play().catch(res); });
      } else await TTS.speakDevice(sg.t, vc);
    } catch(e){ if (PL.run !== run) break; console.warn("tts", e); if (/interrupt|cancel/i.test(String(e?.message||e))) continue; toast(e.message); break; }
  }
  if (PL.run === run){ PL.on = false; if (s.pos?.ch === ci && s.pos.i >= ch.segs.length - 1) s.pos = null; save(); $$(".seg-line.now").forEach(e => e.classList.remove("now")); storyOpenKeepScroll(sid); }
}
/* pause : on garde la réplique en cours pour reprendre là où on était (même plus tard) */
function pausePlay(){ const s = S.stories.find(x => x.id === PL.story); if (s) s.pos = {ch:PL.ch, i:PL.i}; stopPlay(); save(); if (s) storyOpenKeepScroll(s.id); }
function storyOpenKeepScroll(sid){ const sh = $("#layer .sheet"), top = sh?.scrollTop; if (UI.storyId === sid && sh){ storyOpen(sid); const n = $("#layer .sheet"); if (n) n.scrollTop = top; } }

/* ---------- feuilleter le livre : une page = une image + son texte ; lecture à voix haute qui tourne les pages ---------- */
const FL = {sid:null, i:0, pages:[]};
function flipPagesOf(s){
  const P = [{type:"cover"}];
  const sel = bookSel(s); s.chapters.forEach((ch, ci) => sel.includes(ci) && pagesOf(ch).forEach((pg, pi) => P.push({type:"page", ci, pi, from:pg.from, to:pg.to, img:pg.img || (pi === 0 ? ch.img : null)})));
  P.push({type:"end"}); return P;
}
function flipOpen(sid, at){
  const s = S.stories.find(x => x.id === sid); if (!s) return; stopPlay(); closeSheet();
  Object.assign(FL, {sid, pages:flipPagesOf(s), i:at ?? 0});
  if (at == null && s.pos){ const k = FL.pages.findIndex(p => p.type === "page" && p.ci === s.pos.ch && s.pos.i >= p.from && s.pos.i <= p.to); if (k > 0) FL.i = k; }
  let el = $("#flip"); if (!el){ el = document.createElement("div"); el.id = "flip"; el.className = "flip"; document.body.appendChild(el);
    let x0 = null, y0 = 0; el.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; x0 = e.clientX; y0 = e.clientY; });
    el.addEventListener("pointerup", e => { if (x0 == null || e.target.closest("button")) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) return flipGo(FL.i + (dx < 0 ? 1 : -1));
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && !e.target.closest(".flip-text")){ const w = innerWidth; if (e.clientX > w * 0.7) flipGo(FL.i + 1); else if (e.clientX < w * 0.3) flipGo(FL.i - 1); } });
    el.addEventListener("keydown", e => {}); document.addEventListener("keydown", flipKey); }
  flipRender();
}
const flipKey = e => { if (!$("#flip")) return; if (e.key === "ArrowRight") flipGo(FL.i + 1); else if (e.key === "ArrowLeft") flipGo(FL.i - 1); else if (e.key === "Escape") closeFlip(); };
function closeFlip(){ stopPlay(); $("#flip")?.remove(); document.removeEventListener("keydown", flipKey); const s = S.stories.find(x => x.id === FL.sid); if (s) save(); }
function flipPageHtml(s, p){
  const kid = kidById(s.kid);
  if (p.type === "cover") return `<div class="flip-img cover">${s.cover ? `<img data-stimg="${s.cover}" alt="">` : `<div class="flip-ph">${icon("book")}</div>`}</div><div class="flip-text center"><h1>${esc(s.title)}</h1>${kid ? `<p>${T("Une histoire pour {n}",{n:esc(kid.nick||kid.name)})}</p>` : ""}<p class="tiny muted">${T("Touchez à droite ou glissez pour tourner la page")}</p></div>`;
  if (p.type === "end") return `<div class="flip-end"><h1>${T("Fin")}</h1><p>✦</p><p class="small muted">${esc(s.title)}</p><button class="btn kid" data-act="flipGo" data-v="0">${icon("replay")}${T("Recommencer")}</button></div>`;
  const ch = s.chapters[p.ci];
  return `<div class="flip-img">${p.img ? `<img data-stimg="${p.img}" alt="">` : `<div class="flip-ph">${icon("image")}<span class="tiny">${T("Image à ajouter dans « Livre illustré »")}</span></div>`}</div>
    <div class="flip-text">${p.pi === 0 ? `<h2>${T("Chapitre {n}",{n:ch.n})} · ${esc(ch.title)}</h2>` : ""}${ch.segs.slice(p.from, p.to + 1).map((sg, k) => `<p class="flip-seg ${sg.c==="narr"?"narr":""}" id="fsg-${p.ci}-${p.from + k}" data-act="flipFrom" data-v="${p.ci}|${p.from + k}" title="${T("Lire à partir d'ici")}">${sg.c !== "narr" ? `<b style="color:var(--${chColor(s, sg.c)}-ink)">${esc(s.characters.find(x => x.id === sg.c)?.name || "")}</b> ` : ""}${esc(sg.t)}</p>`).join("")}</div>`;
}
function flipRender(dir){
  const s = S.stories.find(x => x.id === FL.sid), el = $("#flip"); if (!s || !el) return; const p = FL.pages[FL.i], n = FL.pages.length;
  el.innerHTML = `<div class="flip-bar"><button class="icon-btn" data-act="flipClose" aria-label="${T("Fermer")}">${icon("x")}</button><span class="small grow" style="text-align:center">${FL.i === 0 ? "" : FL.i === n - 1 ? T("Fin") : T("Page {i} / {n}",{i:FL.i, n:n - 2})}</span>${chSelect(s)}<button class="icon-btn" data-act="storyZoom" data-v="-" aria-label="${T("Texte plus petit")}">A−</button><button class="icon-btn" data-act="storyZoom" data-v="+" aria-label="${T("Texte plus grand")}">A+</button></div>
    <div class="flip-page ${dir ? "turn-" + dir : ""}" style="--sz:${storyZ()}" id="storyText">${flipPageHtml(s, p)}</div>
    <div class="flip-nav"><button class="icon-btn" data-act="flipGo" data-v="${FL.i - 1}" ${FL.i ? "" : "disabled"} aria-label="${T("Page précédente")}">${icon("left")}</button>
      <button class="btn ${PL.on && PL.flip ? "ghost" : "kid"}" data-act="flipPlay">${icon(PL.on && PL.flip ? "pause" : "play")}${PL.on && PL.flip ? T("Pause") : T("Lire à voix haute")}</button>
      <button class="icon-btn" data-act="flipGo" data-v="${FL.i + 1}" ${FL.i < n - 1 ? "" : "disabled"} aria-label="${T("Page suivante")}">${icon("right")}</button></div>`;
  $$("#flip img[data-stimg]").forEach(async im => { const d = await PhotoDB.get(im.dataset.stimg); if (d) im.src = d; else im.remove(); });
}
function flipGo(i, keepPlay){
  if (!keepPlay && PL.on && PL.flip) stopPlay();
  const n = FL.pages.length; if (i < 0 || i >= n || i === FL.i) return; const dir = i > FL.i ? "next" : "prev";
  const pg = $("#flip .flip-page"); if (pg){ pg.classList.add("out-" + dir); setTimeout(() => { FL.i = i; flipRender(dir); }, 180); } else { FL.i = i; flipRender(dir); }
}
/* lecture à voix haute : chaque réplique avec la voix du personnage, puis la page se tourne toute seule */
async function flipPlay(){
  if (PL.on && PL.flip){ const s0 = S.stories.find(x => x.id === FL.sid), p0 = FL.pages[FL.i]; if (s0 && p0?.type === "page") s0.pos = {ch:p0.ci, i:PL.i}; stopPlay(); PL.flip = false; save(); return flipRender(); }
  const s = S.stories.find(x => x.id === FL.sid); if (!s) return; stopPlay();
  Object.assign(PL, {on:true, flip:true, story:s.id}); const run = ++PL.run; flipRender();
  await PL.stopping; await new Promise(r => setTimeout(r, 160)); if (PL.run !== run) return;
  const vcOf = sg => (s.characters.find(x => x.id === sg.c) || s.characters[0]).voice || {};
  const say = async (text, vc) => { if (s.engine === "gemini"){ const url = await TTS.gemini(text, vc); if (!PL.on || PL.run !== run) return; await new Promise(res => { const a = new Audio(url); PL.audio = a; a.onended = res; a.onerror = res; a.play().catch(res); }); } else await TTS.speakDevice(text, vc); };
  const alive = () => PL.on && PL.run === run && $("#flip");
  try {
    while (alive()){
      const p = FL.pages[FL.i];
      if (p.type === "cover"){ await say(s.title, (s.characters[0]||{}).voice || {}); if (!alive()) break; await new Promise(r => setTimeout(r, 600)); }
      else if (p.type === "page"){ const ch = s.chapters[p.ci];
        const start = s.pos?.ch === p.ci && s.pos.i > p.from && s.pos.i <= p.to ? s.pos.i : p.from;
        if (p.pi === 0 && start === p.from){ await say(`${T("Chapitre {n}",{n:ch.n})}. ${ch.title}.`, (s.characters[0]||{}).voice || {}); if (!alive()) break; }
        for (let i = start; i <= p.to && alive(); i++){
          PL.ch = p.ci; PL.i = i; s.pos = {ch:p.ci, i}; $$(".flip-seg.now").forEach(e => e.classList.remove("now")); const el = $(`#fsg-${p.ci}-${i}`); if (el){ el.classList.add("now"); el.scrollIntoView({block:"nearest", behavior:"smooth"}); }
          const sg = ch.segs[i]; if (s.engine === "gemini" && ch.segs[i+1]) TTS.gemini(ch.segs[i+1].t, vcOf(ch.segs[i+1])).catch(() => {});
          try { await say(sg.t, vcOf(sg)); } catch(e){ if (PL.run !== run) break; if (!/interrupt|cancel/i.test(String(e?.message||e))) throw e; } }
        if (!alive()) break; await new Promise(r => setTimeout(r, 700)); }
      else break;
      if (!alive()) break;
      if (FL.i >= FL.pages.length - 1) break;
      flipGo(FL.i + 1, true); await new Promise(r => setTimeout(r, 450));
    }
  } catch(e){ toast(e.message); }
  if (PL.run === run){ PL.on = false; PL.flip = false; if (FL.pages[FL.i]?.type === "end") s.pos = null; save(); if ($("#flip")) flipRender(); }
}

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
    ${aiKey() ? `<div class="card tint" style="padding:12px 14px"><b>${icon("spark")} ${T("Modifier avec l'IA")}</b><div class="row" style="gap:6px"><input class="inp grow" id="rc-ai" placeholder="${T("Ex. : sans gluten, pour 6, version végé, moins sucré, au four")}"><button class="btn kid" data-act="recipeAiEdit" aria-label="${T("Modifier avec l'IA")}">${icon("spark")}</button></div><p class="tiny muted">${T("La recette est réécrite et remise en forme ici même.")}</p></div>` : ""}
    <div class="row" style="flex-wrap:wrap"><button class="btn kid" data-act="recipeSave">${icon("star")}${saved?T("Mettre à jour"):T("Garder en favori")}</button>${S.children.some(k => !isPrenatal(k) && ageMonths(k) >= 6)?`<button class="btn ghost" data-act="logRecipe">${icon("spoon")}${T("Ajouter au journal")}</button>`:""}<button class="btn ghost" data-act="recipeShare">${icon("share")}${T("Partager")}</button>${saved?`<button class="btn danger" data-act="recipeDel" data-v="${rec.id}">${icon("trash")}</button>`:""}</div>`, "wide");
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
  createKind: v => { if (CREATE_TAB[v]){ UI.aiTab = CREATE_TAB[v]; } else { UI.createKind = v; UI.aiTab = "create"; } closeSheet(); if (UI.view !== "assistant") go("assistant"); else render(); },
  menuOpen: v => menuOpen(v),
  menuLog: v => { const [id, di, xi] = v.split("|"), m = S.menus.find(x => x.id === id), x = m?.days[+di]?.meals[+xi]; if (!x) return; const r = (x.liked && (S.recipes||[]).find(y => y.id === x.liked)) || x.recipe;
    logRecipeSheet({title:x.name, label:x.label, labels:[x.label], nut:r?.nut || null, id:r?.id || null}); },
  menuMeal: v => { const [id, di, xi] = v.split("|"), m = S.menus.find(x => x.id === id), x = m?.days[+di]?.meals[+xi]; if (!x) return;
    const fav = x.liked && (S.recipes||[]).find(r => r.id === x.liked && (r.ingredients||[]).length); if (fav) return recipeSheet(fav);
    if (x.recipe) return recipeSheet({...x.recipe, menuRef:v});
    if (!aiKey()) return toast(T("Ajoutez d'abord votre clé Gemini dans l'Assistant."));
    aiJob("recipe", T("Recette : {w}",{w:x.name.slice(0, 40)}), async () => { const c = kidById(m.kid) || aiKidNow();
      const r = await gemini({tier:"fast", json:RECIPE_SCHEMA, temperature:0.5, contents:[{role:"user", parts:[{text:`Écris la recette complète de « ${x.name} » (${x.label}${x.note ? ", " + x.note : ""}) pour une famille avec ${kidLine(c)}, 4 portions, adaptée à l'âge (textures sûres, peu de sel). Quantités précises. Allergies : ${c?.allergies||"aucune connue"}. ${NUT_HELP} nut = pour une portion d'enfant. En ${LANG==="en"?"anglais":"français"}.`}]}]});
      x.recipe = {...parseJSON(r.text), id:uid(), title:x.name, labels:[x.label], at:Date.now(), kid:m.kid}; x.recipe.nut = cleanNut(x.recipe.nut); save(); return {open:() => recipeSheet({...x.recipe, menuRef:v})};
    }, {kid:m.kid, open:res => res?.open?.()}); },
  menuShare: v => { const m = S.menus.find(x => x.id === v); Native.share({title:m.title, text:menuText(m)}); },
  menuDel: v => askConfirm(T("Supprimer ce menu ?"), T("Supprimer"), () => { S.menus = S.menus.filter(x => x.id !== v); save(); render(); }),
  menuLike: v => { const [id, di, xi] = v.split("|"), m = S.menus.find(x => x.id === id), x = m?.days[+di]?.meals[+xi]; if (!x) return;
    if (x.liked){ const r = (S.recipes||[]).find(y => y.id === x.liked); if (r?.fromMenu && !r.edited) S.recipes = S.recipes.filter(y => y.id !== r.id); x.liked = null; save(); toast(T("Retiré des favoris")); return menuOpen(id); }
    const rec = {id:uid(), title:x.name, labels:[x.label], servings:4, minutes:30, ingredients:[], steps:[], kidTips:x.note||"", fromMenu:true, fav:true, at:Date.now(), kid:m.kid};
    S.recipes = [rec, ...(S.recipes||[])]; x.liked = rec.id; save(); toast(T("♥ Gardé dans les recettes favorites")); menuOpen(id);
    if (aiKey()) aiJob("recipe", T("Recette : {w}",{w:x.name.slice(0, 40)}), async () => {
      const c = kidById(m.kid) || aiKidNow();
      const r = await gemini({tier:"fast", json:RECIPE_SCHEMA, temperature:0.5, contents:[{role:"user", parts:[{text:`Écris la recette complète de « ${x.name} » (${x.label}) pour une famille avec ${kidLine(c)}, 4 portions, adaptée à l'âge (textures sûres, peu de sel). Allergies : ${c?.allergies||"aucune connue"}. ${NUT_HELP} nut = pour une portion d'enfant. En ${LANG==="en"?"anglais":"français"}.`}]}]});
      const full = parseJSON(r.text), R = (S.recipes||[]).find(y => y.id === rec.id); if (R) Object.assign(R, {...full, id:R.id, title:R.title, labels:[...new Set([x.label, ...(full.labels||[])])], fromMenu:true, fav:true}); save();
      return {open:() => recipeSheet(R || rec)};
    }, {quiet:true}); },
  storyIdeas: () => storyIdeas(), storyPick: v => storyPick(v),
  storyWrite: () => { const plan = val("st-plan"); UI.storyOpts = UI.storyOpts || storyOpts(); storyGen(null, plan); },
  stKid: v => { UI.stKid = v || ""; render(); },
  stClear: () => { UI.stQ = ""; UI.stChar = ""; render(); },
  storyOpen: v => storyOpen(v), stMode: v => { UI.stMode = v; render(); }, stFav: () => { UI.stFav = !UI.stFav; render(); },
  storyFav: v => { const s = S.stories.find(x => x.id === v); s.fav = !s.fav; save(); storyOpenKeepScroll(v); },
  storyEngine: v => { const s = S.stories.find(x => x.id === UI.storyId); s.engine = v; save(); stopPlay(); storyOpenKeepScroll(s.id); },
  storyPause: () => pausePlay(),
  storySimplify: v => { const [sid, ci] = v.split("|"), s = S.stories.find(x => x.id === sid), ch = s?.chapters[+ci]; if (!ch) return; const c = kidById(s.kid), lv = s.opts?.level || lvlOfAge(c && !isPrenatal(c) ? ageMonths(c) : 48);
    aiJob("story", T("Simplifier · {t}",{t:ch.title}), async () => {
      const schema = {type:"OBJECT", properties:{texts:{type:"ARRAY", items:{type:"STRING"}}}, required:["texts"]};
      const r = await gemini({tier:"fast", json:schema, temperature:0.3, system:`Tu réécris des textes pour enfants. RÈGLE : ${LVL_HINT[lv]}`, contents:[{role:"user", parts:[{text:`Réécris chacun de ces ${ch.segs.length} passages avec des mots beaucoup plus simples pour un enfant de ${lv} ans, sans changer l'histoire, le sens ni les noms. Garde exactement le même nombre d'éléments, dans le même ordre. En ${LANG==="en"?"anglais":"français"}.\n${JSON.stringify(ch.segs.map(sg => sg.t))}`}]}]});
      const t = parseJSON(r.text).texts || []; if (t.length !== ch.segs.length) throw new Error(T("Réponse incomplète, réessayez"));
      ch.segs.forEach((sg, i) => { if (t[i]) sg.t = t[i]; }); save(); driveQ("story", sid); return {open:() => storyOpen(sid)};
    }, {kid:s.kid, open:() => storyOpen(sid)}); },
  storyStop: v => { const s = S.stories.find(x => x.id === v); if (s) s.pos = null; stopPlay(); save(); storyOpenKeepScroll(v); },
  storyPlayFrom: v => { const [sid, ci, i] = v.split("|"); playChapter(sid, +ci, +i || 0); },
  storyPlay: v => { const [sid, ci] = v.split("|"); if (PL.on && PL.story === sid && PL.ch === +ci){ stopPlay(); storyOpenKeepScroll(sid); } else playChapter(sid, +ci); },
  storyNext: v => { const s = S.stories.find(x => x.id === v); storyGen(s, null, val("st-dir")); },
  storyNextIdeas: v => storyNextIdeas(v), storyDir: v => { const i = $("#sn-dir") || $("#st-dir"); if (i){ i.value = v; i.focus(); } },
  storyNextSheet: v => storyNextSheet(v), storySurprise: v => storyNextRun(v, true),
  storyImg: v => { const [sid, ci] = v.split("|"); storyImgSheet(sid, +ci); },
  storyImgGen: v => { const [sid, ci] = v.split("|"); closeSheet(); storyImage(sid, +ci); },
  storyImgCopy: async () => { const t = UI.imgPromptTxt || $("#imgPrompt")?.textContent || ""; try { await navigator.clipboard.writeText(t); toast(T("Prompt copié : collez-le dans Gemini")); } catch(e){ Native.share({title:T("Prompt d'image"), text:t}); } },
  storyImgSaveRef: async v => { const d = await PhotoDB.get(v); if (d) Native.share({title:T("Image de référence"), dataUrl:d, filename:"reference.jpg"}); },
  storyImgImport: async v => { const [sid, ci] = v.split("|"), s = S.stories.find(x => x.id === sid), ch = s?.chapters[+ci]; if (!ch) return;
    const d = await Native.takePhoto({source:"photos"}); if (!d) return; const small = await shrinkImage(d, 1024, 0.85);
    if (ch.img) await PhotoDB.del(ch.img).catch(() => {}); ch.img = "stimg-" + uid(); await PhotoDB.put(ch.img, small); ch.imgModel = "gemini-app"; save(); driveQ("story", sid); storyOpen(sid); toast(T("Image ajoutée au chapitre")); },
  storyShare: v => { const s = S.stories.find(x => x.id === v); Native.share({title:s.title, text:`${s.title}\n\n${s.chapters.map(ch => `${T("Chapitre {n}",{n:ch.n})} · ${ch.title}\n\n${ch.segs.map(sg => (sg.c!=="narr"?`${s.characters.find(x=>x.id===sg.c)?.name} : `:"") + sg.t).join("\n")}`).join("\n\n")}`}); },
  storyKeep: v => { const s = S.stories.find(x => x.id === v); S.memories.push({id:uid(), kind:"story", date:iso(today()), title:s.title, text:s.chapters.map(ch => `## ${ch.title}\n${ch.segs.map(sg => sg.t).join("\n")}`).join("\n\n"), kidIds:s.kid?[s.kid]:[]}); save(); driveQ("mem", S.memories.at(-1).id); toast(T("Souvenir enregistré")); },
  storyDel: v => { if (!confirmDel()) return; stopPlay(); (S.stories.find(x => x.id === v)?.chapters||[]).forEach(ch => ch.img && PhotoDB.del(ch.img).catch(() => {})); driveQDel(S.stories.find(x => x.id === v)?.driveIds); S.stories = S.stories.filter(x => x.id !== v); closeSheet(); commit(); },
  charForm: v => charForm(v),
  storyRand: async (v, b) => { const id = v === "theme" ? "st-theme" : "st-msg", el = $("#" + id); if (!el) return; const c = aiKidNow(), age = c && !isPrenatal(c) ? ageLabel(ageMonths(c)) : "4 ans";
    const local = v === "theme" ? RAND_THEMES : RAND_MSGS, pickL = () => T(local[Math.floor(Math.random() * local.length)]);
    if (!aiKey()){ el.value = pickL(); return; }
    b.classList.add("busy"); const prev = (UI.randSeen = UI.randSeen || []);
    try { const r = await gemini({tier:"fast", temperature:1.0, contents:[{role:"user", parts:[{text: v === "theme" ? `Propose UN thème original et amusant pour une histoire du soir pour un enfant de ${age} (5 à 10 mots, sans ponctuation finale, sans guillemets). Surprenant mais rassurant. Évite : ${prev.join(" ; ") || "rien"}. En ${LANG==="en"?"anglais":"français"}. Réponds seulement par le thème.` : `Propose UNE valeur ou leçon à transmettre dans une histoire du soir pour un enfant de ${age} (3 à 8 mots, ex. « oser demander de l'aide »). Évite : ${prev.join(" ; ") || "rien"}. En ${LANG==="en"?"anglais":"français"}. Réponds seulement par la leçon.`}]}]});
      const t = String(r.text||"").trim().split("\n")[0].replace(/^["«“\s-]+|["»”.\s]+$/g, ""); el.value = t || pickL(); prev.push(el.value); if (prev.length > 12) prev.shift(); }
    catch(e){ el.value = pickL(); } finally { b.classList.remove("busy"); } },
  charHide: v => { const [sid, cid] = v.split("|"), ch = S.stories.find(x => x.id === sid)?.characters.find(x => x.id === cid); if (!ch) return; ch.libHide = true; save(); const el = document.querySelector(`[data-act=charHide][data-v="${v}"]`)?.closest(".char-pick"); if (el) el.remove(); toast(T("Retiré de la liste (toujours dans son histoire)")); },
  charUnhide: () => { (S.stories||[]).forEach(st => st.characters.forEach(ch => delete ch.libHide)); save(); render(); },
  charDel: v => { const [sid, cid] = v.split("|"), s = S.stories.find(x => x.id === sid), ch = s?.characters.find(x => x.id === cid); if (!ch) return;
    askConfirm(T("Retirer {n} de l'histoire ?",{n:ch.name}), T("Retirer"), () => { s.chapters.forEach(c => c.segs.forEach(sg => { if (sg.c === cid) sg.c = "narr"; })); s.characters = s.characters.filter(x => x.id !== cid); s.removed = [...(s.removed||[]), ch.name]; save(); driveQ("story", sid); toast(T("Personnage retiré")); storyOpen(sid); }); },
  storyZoom: v => { const z = v === "+" ? storyZ() + 0.1 : v === "-" ? storyZ() - 0.1 : 1; S.settings.storyZoom = Math.round(clamp(z, 0.8, 2.4) * 100) / 100; save(); const b = $("#storyText"); if (b) b.style.setProperty("--sz", storyZ()); const zv = $("#zoomVal"); if (zv) zv.textContent = Math.round(storyZ()*100) + " %"; },
  storyRead: () => { UI.readMode = !UI.readMode; storyOpen(UI.storyId); const sh = $("#layer .sheet"); if (sh) sh.scrollTop = 0; },
  storyReadOpen: v => { UI.readMode = true; storyOpen(v); },
  storyBookShop: v => storyBookShop(v),
  bookSelAll: v => { const s = S.stories.find(x => x.id === v); s.bookSel = null; save(); bookSelShow(s); bookRefresh(v); },
  bookSelTog: v => { const [sid, ci] = v.split("|"), s = S.stories.find(x => x.id === sid), all = !(s.bookSel||[]).length; let sel = all ? [] : [...s.bookSel]; sel = sel.includes(+ci) ? sel.filter(x => x !== +ci) : [...sel, +ci].sort((a, b) => a - b); s.bookSel = sel.length && sel.length < s.chapters.length ? sel : null; save(); bookSelShow(s); bookRefresh(sid); },
  bookOrder: v => bookOrder(v),
  bookSwap: v => { const [sid, i, d] = v.split("|"), s = S.stories.find(x => x.id === sid), K = UI.bookOrderP || [], a = K[+i], b = K[+i + +d]; if (!s || !a || !b) return;
    const ia = slotGet(s, a), ib = slotGet(s, b); slotSet(s, a, ib); slotSet(s, b, ia); save(); driveQ("story", sid); const sh = $("#layer .sheet"), top = sh?.scrollTop; bookOrder(sid); const n = $("#layer .sheet"); if (n) n.scrollTop = top; },
  bookSend: v => { const x = UI.bookP?.[+v]; if (x) shareTxt(x.p); },
  bookSendAll: () => { const s = S.stories.find(x => x.id === UI.storyId), miss = (UI.bookP||[]).filter(x => !x.img); if (s && miss.length) shareTxt(batchPrompt(s, miss), s.title); },
  bookGenAll: v => { const s = S.stories.find(x => x.id === v); if (!s) return; if (!aiKey()) return toast(T("Ajoutez d'abord votre clé Gemini dans l'Assistant."));
    const miss = (UI.bookP||[]).filter(x => !x.img); if (!miss.length) return;
    aiJob("story", T("{n} images · {t}",{n:miss.length, t:s.title}), async j => { let ref = s.refImg ? await PhotoDB.get(s.refImg) : null, n = 0;
      for (const x of miss){ const d = await genImage(x.p, ref); await bookSetSlot(s, x.k, d); n++; if (x.k === "ref") ref = await PhotoDB.get(s.refImg); save(); j.title = T("{n} images · {t}",{n:`${n}/${miss.length}`, t:s.title}); }
      driveQ("story", v); return {open:() => storyBookShop(v)}; }, {kid:s.kid, open:() => storyBookShop(v)}); },
  bookPagesN: v => { const [sid, n] = v.split("|"); S.settings.bookPages = +n; save(); askConfirm(T("Redécouper toutes les pages en {n} par chapitre ? Les images déjà ajoutées restent dans l'ordre.",{n}), T("Redécouper"), async () => { const s = S.stories.find(x => x.id === sid); toast(T("Découpage…")); await storyScenes(s, true); storyBookShop(sid); }, false); },
  bookRecut: v => askConfirm(T("Redécouper les chapitres en pages ? Les images déjà ajoutées restent dans l'ordre."), T("Redécouper"), async () => { const s = S.stories.find(x => x.id === v); toast(T("Découpage…")); await storyScenes(s, true); storyBookShop(v); }, false),
  flipFrom: v => { const [ci, i] = v.split("|").map(Number), s = S.stories.find(x => x.id === FL.sid); if (!s) return; stopPlay(); PL.flip = false; s.pos = {ch:ci, i}; flipPlay(); },
  flipOpen: v => flipOpen(v), flipGo: v => flipGo(+v), flipPlay: () => flipPlay(), flipClose: () => closeFlip(),
  storyPdf: v => storyPdf(v),
  bookCopy: v => { const x = UI.bookP?.[+v]; if (x) copyTxt(x.p, T("Prompt copié : collez-le dans Gemini")); },
  bookCopyAll: () => { const s = S.stories.find(x => x.id === UI.storyId), miss = (UI.bookP||[]).filter(x => !x.img); copyTxt(batchPrompt(s, miss.length ? miss : UI.bookP), T("Demande copiée : collez-la dans Gemini")); },
  bookImport: async v => { const [sid, k] = v.split("|"), s = S.stories.find(x => x.id === sid); if (!s) return;
    const d = await Native.takePhoto({source:"photos"}); if (!d) return; await bookSetSlot(s, k, d);
    save(); driveQ("story", sid); toast(T("Image ajoutée")); storyBookShop(sid, true); },
  charTest: async v => { const vc = readVoice(), txt = LANG === "en" ? "Hello! Here is my voice for the story." : "Bonjour ! Voici ma voix pour l'histoire."; stopPlay();
    try { if (v === "gemini"){ toast(T("Génération de la voix…")); const url = await TTS.gemini(txt, vc); const a = new Audio(url); PL.audio = a; a.play(); } else await TTS.speakDevice(txt, vc); } catch(e){ toast(e.message); } },
  rcLabel: v => { UI.rcLabel = v; render(); }, recipeOpen: v => recipeSheet(S.recipes.find(x => x.id === v)),
  recipeSave: () => { const r = UI.recipeView; r.labels = checked("rc-lab"); r.edited = true;
    if (r.menuRef){ const [id, di, xi] = r.menuRef.split("|"), x = S.menus?.find(m => m.id === id)?.days[+di]?.meals[+xi]; if (x) x.liked = r.id; delete r.menuRef; r.fromMenu = true; } S.recipes = S.recipes || []; const i = S.recipes.findIndex(x => x.id === r.id); if (i >= 0) S.recipes[i] = {...S.recipes[i], ...r}; else S.recipes.unshift({...r, fav:true}); save(); toast(T("Recette gardée en favori")); recipeSheet(r); },
  recipeAiEdit: () => { const r = UI.recipeView, ask = val("rc-ai").trim(); if (!r || !ask) return toast(T("Écrivez la modification voulue"));
    const btn = $("[data-act=recipeAiEdit]"); if (btn){ btn.disabled = true; btn.innerHTML = `<span class="spin"></span>`; }
    const job = aiJob("recipe", T("Modifier : {t}",{t:r.title.slice(0, 40)}), async () => {
      const keep = {...r}; delete keep.menuRef;
      const out = await gemini({tier:"fast", json:RECIPE_SCHEMA, temperature:0.4, contents:[{role:"user", parts:[{text:`Voici une recette (JSON) :
${JSON.stringify({title:keep.title, servings:keep.servings, minutes:keep.minutes, ingredients:keep.ingredients, steps:keep.steps, kidTips:keep.kidTips, allergens:keep.allergens})}
Modifie-la selon cette demande : « ${ask} ». Garde ce qui n'est pas concerné, ajuste quantités, étapes, temps, allergènes et nutriments en conséquence. Quantités précises, étapes claires et numérotables. ${NUT_HELP} nut = pour une portion d'enfant. En ${LANG==="en"?"anglais":"français"}.`}]}]});
      const nr = {...r, ...parseJSON(out.text), id:r.id, labels:r.labels, edited:true, at:Date.now()};
      const i = (S.recipes||[]).findIndex(x => x.id === r.id); if (i >= 0) S.recipes[i] = {...S.recipes[i], ...nr};
      if (r.menuRef){ const [id, di, xi] = r.menuRef.split("|"), x = S.menus?.find(m => m.id === id)?.days[+di]?.meals[+xi]; if (x && !x.liked) x.recipe = {...nr}; }
      save(); return {open:() => recipeSheet(nr)};
    }, {quiet:true, open:res => res?.open?.(), onErr:() => { if (btn){ btn.disabled = false; btn.innerHTML = icon("spark"); } }});
    const watch = setInterval(() => { if (job.st !== "run"){ clearInterval(watch); if (job.st === "ok" && $("#rc-ai")){ job.res?.open?.(); toast(T("Recette modifiée")); } } }, 400); setTimeout(() => clearInterval(watch), 180000); },
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
    if (k === "plan") return menuJob(c);
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
  charSave: f => { const [sid, cid] = f.dataset.id.split("|"), s = S.stories.find(x => x.id === sid);
    if (cid === "new"){ const name = val("cv-name").trim(); if (!name) return toast(T("Nom requis")); const g = val("cv-gender") || "neutre", k = val("cv-kind") || "enfant";
      s.characters.push({id:uid(), name, desc:val("cv-desc"), kind:k, gender:g, fav:$("#cv-fav").checked, voice:{...autoVoice(k, s.characters.length, g), g:g === "fille" ? "f" : "m"}}); save(); toast(T("Personnage ajouté")); return storyOpen(sid); }
    const ch = s.characters.find(x => x.id === cid);
    if (cid !== "narr"){ const old = ch.name, nn = val("cv-name").trim() || ch.name;
      if (nn !== old && $("#cv-rename")?.checked){ const re = new RegExp(`(?<![\\p{L}\\p{N}])${old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "gu"); s.chapters.forEach(c => { c.segs.forEach(sg => sg.t = sg.t.replace(re, nn)); c.title = c.title.replace(re, nn); c.summary = (c.summary||"").replace(re, nn); }); s.title = s.title.replace(re, nn); }
      ch.name = nn; ch.desc = val("cv-desc"); const ng = val("cv-gender"), nk = val("cv-kind"), moved = (ng && ng !== ch.gender) || (nk && nk !== ch.kind); if (ng) ch.gender = ng; if (nk) ch.kind = nk;
      if (moved){ ch.fav = $("#cv-fav").checked; ch.voice = autoVoice(ch.kind, s.characters.indexOf(ch), ch.gender); save(); driveQ("story", sid); toast(T("Personnage enregistré · voix adaptée")); return storyOpen(sid); } }
    ch.fav = $("#cv-fav").checked; ch.voice = {...readVoice(), custom:true}; save(); driveQ("story", sid); toast(T("Personnage enregistré")); storyOpen(sid); },
});
Object.assign(CHANGE, { rcQ: t => { UI.rcQ = t.value; render(); } });
Object.assign(FORMS, { storyNextGo: f => storyNextRun(f.dataset.id, false) });

Object.assign(CHANGE, {
  bookN: async t => { const [sid, ci] = t.dataset.v.split("|"), s = S.stories.find(x => x.id === sid), ch = s?.chapters[+ci]; if (!ch) return; ch.pagesN = t.value ? +t.value : null; UI.bookNOpen = true; toast(T("Découpage…")); await storyScenes(s, true, [+ci]); storyBookShop(sid, true); },
  bookMulti: async t => { const sid = t.dataset.v, s = S.stories.find(x => x.id === sid), files = [...(t.files||[])]; if (!s || !files.length) return;
    const slots = (UI.bookP||[]).filter(x => !x.img).map(x => x.k); let n = 0;
    // ordre : celui de la sélection ; si les noms contiennent des numéros (1, 2, 3…), on suit les numéros
    const num = f => +((f.name.match(/(\d+)(?!.*\d)/)||[])[1]); { const ns = files.map(num); if (ns.every(x => !isNaN(x)) && new Set(ns).size === ns.length && Math.max(...ns) - Math.min(...ns) === ns.length - 1) files.sort((a, b) => num(a) - num(b)); }
    const st = $("#bookBusy"); if (st) st.innerHTML = `<span class="spin"></span> ${T("Import des images…")}`;
    for (const f of files){ if (!slots[n]) break; const d = await readFile(f); await bookSetSlot(s, slots[n], d); n++; }
    save(); driveQ("story", sid); bookOrder(sid, T("{n} image(s) placée(s) dans l'ordre de sélection. Vérifiez que chacune va avec son texte.",{n})); },
  bookSelOne: t => { const s = S.stories.find(x => x.id === t.dataset.v); if (!s) return; s.bookSel = t.value === "" ? null : [+t.value]; save(); if ($("#flip")) flipOpen(s.id, 0); else storyOpen(s.id); },
});

Object.assign(CHANGE, { storyKid: t => { const st = S.stories.find(x => x.id === t.dataset.v); if (!st) return; st.kid = t.value || null; save(); toast(t.value ? T("Histoire pour {n}",{n:kidById(t.value)?.nick || kidById(t.value)?.name || ""}) : T("Histoire pour toute la famille")); } });

Object.assign(CHANGE, { stQ: t => { UI.stQ = t.value; render(); const i = $("#st-q"); if (i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, stChar: t => { UI.stChar = t.value; render(); }, stSort: t => { S.settings.stSort = t.value; save(); render(); } });
