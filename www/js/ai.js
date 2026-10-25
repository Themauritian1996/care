/* =========================================================================
   TRIBE — assistant IA (Gemini, facultatif). La clé reste sur l'appareil.
   ========================================================================= */
const AI_KEY = "tribe.aikey";
const aiKey = () => { try { return localStorage.getItem(AI_KEY) || ""; } catch(e){ return ""; } };
const AI_TOPICS = [["sommeil","Sommeil"],["alimentation","Alimentation"],["activite","Activité physique"],["ecrans","Écrans"],["croissance","Croissance"],["developpement","Développement"],["humeur","Humeur"],["lecture","Lecture"]];

async function gemini({contents, system, json = null, search = false}){
  const key = aiKey(); if (!key) throw new Error(T("Ajoutez d'abord votre clé Gemini dans Réglages."));
  const model = S.settings.ai.model || "gemini-3.8-flash";
  const body = { contents, generationConfig:{temperature:0.4} };
  if (system) body.systemInstruction = {parts:[{text:system}]};
  if (json){ body.generationConfig.responseMimeType = "application/json"; body.generationConfig.responseSchema = json; }
  if (search && !json) body.tools = [{google_search:{}}];
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {method:"POST", headers:{"Content-Type":"application/json", "x-goog-api-key":key}, body:JSON.stringify(body)});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error?.message || `Gemini ${r.status}`);
  const cand = d.candidates?.[0]; const text = (cand?.content?.parts||[]).map(p => p.text||"").join("");
  const sources = (cand?.groundingMetadata?.groundingChunks||[]).map(g => g.web).filter(Boolean).map(w => ({title:w.title, uri:w.uri}));
  return { text, sources };
}
/* contexte de l'enfant (données agrégées seulement) */
function kidContext(c){
  if (!c) return "";
  if (isPrenatal(c)) return `Grossesse : ${pregWeek(c).w} semaines.`;
  const m = ageMonths(c), wk = Array.from({length:7},(_,i)=>dayTotals(c, addDays(today(), -i))), avg = k => sum(wk.map(t=>t[k]))/7;
  const lastG = [...c.growth].sort((a,b)=>a.date<b.date?1:-1)[0];
  const z = lastG ? ["weight","height"].filter(k=>lastG[k]).map(k => `${k} ${lastG[k]} (P${pctLabel(zScore(k,c.sex,effAge(c,parseD(lastG.date)),Number(lastG[k])) ?? 0)})`).join(", ") : "aucune mesure";
  return `Enfant : ${ageLabel(m)}${usesCorrected(c)?` (âge corrigé ${ageLabel(effAge(c))}, né à ${c.gaW} SA)`:""}, sexe ${c.sex||"?"}. Allergies : ${c.allergies||"aucune connue"}. Conditions : ${c.conditions||"aucune"}. Dernières mesures : ${z}. Moyennes 7 jours : sommeil ${fmtNum(avg("sleep")/60,1)} h, activité ${Math.round(avg("act"))} min, écran ${Math.round(avg("screen"))} min, lecture ${Math.round(avg("read"))} min, repas notés ${sum(wk.map(t=>t.meals))}.`;
}
const AI_SYSTEM = () => `Tu es l'assistant parental de l'app ${appName()}, pour des familles du Québec. Réponds en ${LANG==="en"?"anglais":"français"}, avec chaleur et clarté, en 120 à 250 mots.
Appuie-toi sur les données probantes et les lignes directrices reconnues (Société canadienne de pédiatrie, INSPQ, Santé Canada, OMS, AAP, Directives canadiennes de mouvement sur 24 h). Indique brièvement le niveau de preuve quand c'est utile et cite les organismes ou études. Distingue ce qui est bien établi de ce qui est incertain.
Ne pose pas de diagnostic, ne donne pas de dose de médicament : renvoie à l'étiquette, au pharmacien ou au médecin. Si la question évoque un signe d'urgence (difficulté à respirer, lèvres bleues, convulsion, fièvre chez un bébé de moins de 3 mois, déshydratation, idées suicidaires), dis d'appeler le 911 ou le 811 (Info-Santé), ou le 988 au besoin, en premier.
Rassure sans minimiser ; évite de culpabiliser les parents.`;

/* ---------- feuille de l'assistant ---------- */
function aiSheet(tab){
  UI.aiTab = tab || UI.aiTab || "ask";
  const c = UI.view === "kid" ? child() : (S.children.find(x => x.id === UI.aiKid) || S.children[0]);
  UI.aiKid = c?.id;
  const hasKey = !!aiKey();
  let body = "";
  if (!hasKey) body = `<div class="banner info">${icon("key")}<div class="small">${T("L'assistant utilise Gemini avec votre propre clé (gratuite pour un usage personnel). Créez-la sur aistudio.google.com/apikey puis collez-la ci-dessous. Elle reste sur cet appareil.")}</div></div>${aiKeyForm()}`;
  else if (UI.aiTab === "ask"){
    const hist = (S.aiChat||[]).filter(x => x.kid === c?.id).slice(-10);
    body = `${S.children.length>1?`<div class="pick">${S.children.map(k=>`<button data-act="aiKid" data-v="${k.id}" aria-pressed="${k.id===c?.id}">${esc(k.nick||k.name)}</button>`).join("")}</div>`:""}
      <div class="stack" id="aiThread">${hist.length ? hist.map(x => `<div class="msg mine" style="max-width:90%">${esc(x.q)}</div><div class="msg" style="max-width:95%">${md(x.a)}${x.sources?.length?`<div class="tiny" style="margin-top:6px"><b>${T("Sources")}</b> : ${x.sources.slice(0,5).map(s=>`<a href="${esc(s.uri)}" target="_blank" rel="noopener">${esc(s.title||"lien")}</a>`).join(" · ")}</div>`:""}</div>`).join("") : `<div class="stack small muted">${T("Exemples :")}<div class="pick">${[T("Comment savoir s'il dort assez ?"),T("Idées de repas avec du fer pour mon bébé"),T("Comment parler d'alcool avec mon ado ?"),T("Est-ce normal qu'il ne marche pas encore ?")].map(q=>`<button data-act="aiAskQuick" data-v="${esc(q)}">${q}</button>`).join("")}</div></div>`}</div>
      <form class="composer" data-form="aiAsk"><textarea class="inp" id="ai-q" rows="2" placeholder="${T("Votre question…")}"></textarea><button class="btn kid" type="submit" aria-label="${T("Envoyer")}">${icon("send")}</button></form>
      <p class="tiny muted">${T("Réponses fondées sur la littérature, avec sources quand c'est possible. Ne remplace pas un avis médical. Urgence : 911 · Info-Santé : 811.")}</p>`;
  } else if (UI.aiTab === "meal"){
    body = `<p class="small muted">${T("Prenez le repas en photo : l'assistant reconnaît les aliments, estime les quantités et les classe par groupe. Vous pouvez tout corriger avant d'enregistrer.")}</p><button class="btn kid" data-act="aiMealPhoto">${icon("camera")}${T("Photographier un repas")}</button>`;
  } else {
    const revs = (S.reviews||[]).filter(r => r.kid === c?.id).slice(-5).reverse();
    body = `<p class="small muted">${T("Une revue automatique des données de l'enfant, avec des recommandations sur les sujets choisis.")}</p>
      <div class="field"><label>${T("Sujets")}</label>${checks("aitopics", AI_TOPICS.map(([k,l])=>[k,T(l)]), S.settings.ai.topics)}</div>
      <div class="field"><label>${T("Fréquence")}</label>${radios("aifreq",[["semaine",T("Chaque semaine")],["mois",T("Chaque mois")],["jamais",T("Seulement sur demande")]],S.settings.ai.freq)}</div>
      <button class="btn kid" data-act="aiReview">${icon("spark")}${T("Faire la revue maintenant")}</button>
      ${revs.map(r => `<div class="card" style="box-shadow:none;background:var(--surface2)"><span class="eyebrow">${fmtD(r.date,{day:"numeric",month:"long",year:"numeric"})}</span>${md(r.text)}</div>`).join("")}`;
  }
  sheet(`${sheetHead(`${icon("spark").replace("<svg",'<svg style="width:22px;height:22px;vertical-align:-4px;color:var(--lilac-ink)"')} ${T("Assistant")}`)}
    ${hasKey?`<div class="seg">${[["ask",T("Questions")],["meal",T("Photo de repas")],["review",T("Revues")]].map(([k,l])=>`<button data-act="aiTab" data-v="${k}" aria-pressed="${UI.aiTab===k}">${l}</button>`).join("")}</div>`:""}${body}`, "wide");
  const th = $("#aiThread"); if (th) th.scrollIntoView({block:"end"});
}
const aiKeyForm = () => `<form class="stack" data-form="aiKey">${fld("ai-key",T("Clé API Gemini"),`<input class="inp" id="ai-key" type="password" autocomplete="off" placeholder="AIza…">`)}<button class="btn kid" type="submit">${T("Enregistrer la clé")}</button></form>`;
function aiSettings(){
  const has = !!aiKey();
  return `<p class="small muted">${T("Facultatif. Photo de repas, questions avec sources scientifiques, revues automatiques. Fonctionne avec votre clé Gemini, conservée seulement sur cet appareil.")}</p>
    ${has ? `<div class="row"><span class="chip mint">${icon("check")}${T("Clé enregistrée")}</span><button class="btn sm ghost" data-act="aiForget">${T("Retirer la clé")}</button><button class="btn sm kid" data-act="ai">${T("Ouvrir l'assistant")}</button></div>` : aiKeyForm()}
    ${fld("ai-model",T("Modèle"),`<input class="inp" id="ai-model" value="${esc(S.settings.ai.model)}" data-change="aiModel">`)}`;
}
async function aiAsk(q){
  const c = kidById(UI.aiKid);
  const th = $("#aiThread"); if (th) th.insertAdjacentHTML("beforeend", `<div class="msg mine" style="max-width:90%">${esc(q)}</div><div class="msg" id="aiWait">${T("Je cherche dans la littérature…")}</div>`);
  try {
    const hist = (S.aiChat||[]).filter(x => x.kid === c?.id).slice(-4).flatMap(x => [{role:"user", parts:[{text:x.q}]}, {role:"model", parts:[{text:x.a}]}]);
    const r = await gemini({system: AI_SYSTEM() + "\n" + kidContext(c), contents:[...hist, {role:"user", parts:[{text:q}]}], search: S.settings.ai.search !== false});
    S.aiChat = S.aiChat || []; S.aiChat.push({kid:c?.id, q, a:r.text, sources:r.sources, at:Date.now()}); if (S.aiChat.length > 80) S.aiChat.splice(0, S.aiChat.length-80);
    save(); aiSheet("ask");
  } catch(e){ const w = $("#aiWait"); if (w) w.textContent = e.message; }
}
async function aiMealPhoto(){
  if (!aiKey()){ aiSheet(); return; }
  const data = await Native.takePhoto({source:"prompt"}); if (!data) return;
  const small = await shrinkImage(data, 1024, 0.8);
  sheet(`${sheetHead(T("Analyse du repas"))}<img src="${small}" alt="" style="border-radius:16px;max-height:240px;object-fit:cover"><p class="muted">${T("Analyse en cours…")}</p>`);
  const c = child(), m = ageMonths(c);
  try {
    const schema = {type:"OBJECT", properties:{items:{type:"ARRAY", items:{type:"OBJECT", properties:{name:{type:"STRING"}, group:{type:"STRING", enum:Object.keys(FOOD_GROUPS)}, qty:{type:"STRING"}}, required:["name","group","qty"]}}, comment:{type:"STRING"}}, required:["items","comment"]};
    const r = await gemini({system:`Tu analyses une photo de repas pour un enfant de ${ageLabel(m)}. Liste chaque aliment visible en ${LANG==="en"?"anglais":"français"}, son groupe (legfruits = légumes et fruits, proteines, grains = grains entiers ou raffinés, laitiers, autres = gâteries, boissons sucrées) et une quantité estimée en unités de cuisine (c. à soupe, tasse, morceaux, g). Dans comment, en une ou deux phrases, donne une remarque utile sur l'équilibre selon le Guide alimentaire canadien et, si l'enfant a moins de 4 ans, signale tout aliment à risque d'étouffement (raisins entiers, noix entières, maïs soufflé, saucisse en rondelles).`,
      contents:[{role:"user", parts:[{inline_data:{mime_type:"image/jpeg", data:small.split(",")[1]}}, {text:"Analyse ce repas."}]}], json:schema});
    const out = JSON.parse(r.text);
    const thumb = await shrinkImage(small, 480, 0.75);
    mealForm({items:(out.items||[]).map(i => ({name:i.name, group:FOOD_GROUPS[i.group]?i.group:"autres", qty:i.qty})), comment:out.comment, photo:thumb, ai:true});
  } catch(e){ toast(e.message); closeSheet(); }
}
async function aiReview(kidId, silent){
  const c = kidById(kidId) || child(); if (!c || !aiKey()) return;
  if (!silent) toast(T("Revue en préparation…"));
  const topics = S.settings.ai.topics.map(k => T(AI_TOPICS.find(t=>t[0]===k)?.[1]||k)).join(", ");
  const days = S.settings.ai.freq === "mois" ? 30 : 7;
  const sumUp = k => { const s = series(c, k, days); return `${k}: ${s.map(p => Math.round(p.v*10)/10).join(",")}`; };
  const dev = isPrenatal(c) ? "" : `Jalons à mentionner : ${MS.filter(it => msLevel(c,it,effAge(c)).id==="parler").map(it=>it.t).join("; ")||"aucun"}.`;
  try {
    const r = await gemini({system: AI_SYSTEM() + "\nFais une revue de suivi structurée : 1) ce qui va bien, 2) points à surveiller, 3) 2 ou 3 recommandations concrètes et réalistes, fondées sur les lignes directrices. Utilise des titres courts.",
      contents:[{role:"user", parts:[{text:`${kidContext(c)}\nPériode : ${days} jours. Sujets demandés : ${topics}.\nSéries quotidiennes : ${["sleep","act","screen","read"].map(sumUp).join(" | ")}.\nObjectifs : ${JSON.stringify(goals(c).custom)}. Recommandations : ${JSON.stringify(goals(c).rec)}.\n${dev}`}]}]});
    S.reviews = S.reviews || []; S.reviews.push({id:uid(), kid:c.id, date:iso(today()), text:r.text}); S.settings.ai.lastReview = iso(today());
    save();
    if (silent){ if (S.settings.notif.enabled && S.settings.notif.review) Native.notifyNow(T("Revue prête"), T("La revue de {n} est disponible dans l'assistant.",{n:c.nick||c.name})); }
    else aiSheet("review");
  } catch(e){ if (!silent) toast(e.message); }
}
/* revue automatique quand elle est due */
function maybeAutoReview(){
  const A = S.settings.ai; if (!aiKey() || A.freq === "jamais" || !feat("ai")) return;
  const due = !A.lastReview || (today() - parseD(A.lastReview))/DAY >= (A.freq === "mois" ? 30 : 7);
  if (due) S.children.filter(c => !isPrenatal(c)).forEach((c,i) => setTimeout(() => aiReview(c.id, true), 4000 + i*3000));
}
