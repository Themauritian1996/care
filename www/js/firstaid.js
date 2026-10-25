/* =========================================================================
   TRIBE — premiers soins : RCR et étouffement selon l'âge.
   Aide-mémoire fondé sur les lignes directrices de Cœur + AVC (2020, ILCOR)
   et de la Croix-Rouge canadienne. Ne remplace pas une formation.
   ========================================================================= */
const FA_AGES = [["bebe","Bébé (moins de 1 an)"],["enfant","Enfant (1 an à la puberté)"],["ado","Ado ou adulte"]];
const FA = {
  rcr:{
    l:"Arrêt cardiorespiratoire (RCR)", ic:"heart",
    when:"Ne réagit pas ET ne respire pas normalement (ou seulement des halètements).",
    bebe:[
      "Vérifiez la réaction : tapotez la plante des pieds, appelez-le. Regardez s'il respire (pas plus de 10 secondes).",
      "Criez à l'aide. Faites appeler le 911 (ou appelez en haut-parleur) et demandez un défibrillateur (DEA). Seul et sans téléphone : faites 2 minutes de RCR, puis appelez.",
      "Bébé sur le dos, sur une surface ferme. Placez 2 doigts (ou les 2 pouces, mains autour du thorax) au centre de la poitrine, juste sous la ligne des mamelons.",
      "Compressions : enfoncez d'environ 4 cm (le tiers de la poitrine), au rythme de 100 à 120 par minute. Laissez la poitrine remonter complètement.",
      "Après 30 compressions, donnez 2 insufflations : tête en position neutre, votre bouche couvre la bouche ET le nez, soufflez doucement 1 seconde, juste assez pour soulever la poitrine.",
      "Continuez 30 compressions / 2 insufflations sans arrêt jusqu'à l'arrivée des secours, du DEA, ou si bébé se met à respirer. Si vous ne pouvez pas insuffler : compressions seules.",
      "DEA : électrodes pédiatriques si possible, une au centre de la poitrine et une dans le dos. Suivez les consignes vocales.",
    ],
    enfant:[
      "Vérifiez la réaction (tapez les épaules, parlez fort) et la respiration (pas plus de 10 secondes).",
      "Faites appeler le 911 et apporter un DEA. Seul et sans téléphone : 2 minutes de RCR, puis appelez.",
      "Talon d'une main (ou les 2 mains si l'enfant est grand) au centre de la poitrine, sur la moitié inférieure du sternum.",
      "Compressions : environ 5 cm de profondeur (le tiers de la poitrine), 100 à 120 par minute, en laissant la poitrine remonter.",
      "Après 30 compressions, 2 insufflations : basculez la tête, soulevez le menton, pincez le nez, soufflez 1 seconde jusqu'à ce que la poitrine se soulève.",
      "Continuez 30 / 2 sans interruption. Pas à l'aise avec les insufflations : compressions seules, c'est beaucoup mieux que rien.",
      "DEA dès qu'il arrive : électrodes pédiatriques si moins de 8 ans (ou 25 kg), sinon électrodes adultes qui ne se touchent pas.",
    ],
    ado:[
      "Vérifiez la réaction et la respiration (pas plus de 10 secondes).",
      "Appelez le 911 (haut-parleur) et envoyez quelqu'un chercher un DEA.",
      "Talons des 2 mains l'un sur l'autre, au centre de la poitrine. Bras tendus, épaules au-dessus des mains.",
      "Compressions de 5 à 6 cm, 100 à 120 par minute, en laissant la poitrine remonter. Changez de secouriste aux 2 minutes si possible.",
      "Formé : 30 compressions puis 2 insufflations. Non formé : compressions seules, sans arrêt.",
      "Installez le DEA dès qu'il arrive et suivez ses consignes ; reprenez les compressions tout de suite après le choc.",
    ],
  },
  etouf:{
    l:"Étouffement", ic:"alert",
    when:"Ne peut pas tousser, pleurer, parler ou respirer ; devient bleu. S'il tousse fort : encouragez-le à tousser et restez avec lui.",
    bebe:[
      "Faites appeler le 911.",
      "Couchez bébé à plat ventre sur votre avant-bras, tête plus basse que le corps, en tenant sa mâchoire (pas la gorge). Appuyez votre bras sur votre cuisse.",
      "Donnez 5 tapes fermes dans le dos, entre les omoplates, avec le talon de la main.",
      "Retournez-le sur le dos (en soutenant la tête), tête toujours plus basse. Faites 5 compressions thoraciques avec 2 doigts au centre de la poitrine, juste sous les mamelons.",
      "Alternez 5 tapes et 5 compressions jusqu'à ce que l'objet sorte ou que bébé respire, tousse ou pleure.",
      "Ne mettez pas les doigts dans la bouche à l'aveugle : retirez l'objet seulement s'il est bien visible.",
      "S'il perd connaissance : commencez la RCR (onglet RCR) et regardez dans la bouche avant chaque insufflation.",
    ],
    enfant:[
      "Demandez : « Est-ce que tu t'étouffes ? » S'il ne peut pas parler ni tousser, faites appeler le 911.",
      "Mettez-vous à genoux ou debout derrière lui. Penchez-le vers l'avant et donnez 5 tapes fermes dans le dos, entre les omoplates.",
      "Puis 5 poussées abdominales : poing juste au-dessus du nombril, l'autre main par-dessus, poussez vers l'intérieur et vers le haut.",
      "Alternez 5 tapes et 5 poussées jusqu'à ce que l'objet sorte ou qu'il tousse, pleure ou respire.",
      "S'il perd connaissance : allongez-le au sol, appelez le 911 et commencez la RCR ; regardez dans la bouche avant les insufflations.",
      "Après des poussées abdominales, faites-le toujours examiner par un médecin.",
    ],
    ado:[
      "S'il tousse fort, laissez-le tousser. S'il ne peut plus parler, tousser ou respirer : 911.",
      "Penchez-le vers l'avant, 5 tapes fermes dans le dos entre les omoplates.",
      "5 poussées abdominales : poing au-dessus du nombril, poussez vers l'intérieur et vers le haut. Femme enceinte ou personne forte : poussées sur la poitrine.",
      "Alternez jusqu'à ce que l'objet sorte. S'il perd connaissance : 911 et RCR.",
      "Seul ? Poussez votre ventre contre le dossier d'une chaise ou un rebord ferme.",
    ],
  },
  pls:{
    l:"Inconscient mais respire", ic:"bed",
    when:"Ne réagit pas mais respire normalement.",
    bebe:["Appelez le 911.","Tenez bébé dans vos bras, tête un peu plus basse que le corps, sur le côté, pour que les liquides s'écoulent.","Surveillez la respiration en continu ; s'il cesse de respirer normalement, commencez la RCR."],
    enfant:["Appelez le 911.","Position latérale de sécurité : sur le côté, la jambe du dessus pliée pour stabiliser, la tête légèrement basculée vers l'arrière, bouche vers le sol.","Surveillez la respiration ; s'il cesse de respirer normalement, remettez-le sur le dos et commencez la RCR."],
    ado:["Appelez le 911.","Position latérale de sécurité, tête basculée, bouche vers le sol.","Surveillez la respiration en continu. Pas de respiration normale : RCR."],
  },
};
function firstAidSheet(age, topic){
  UI.faAge = age || UI.faAge || (() => { const c = child(); if (!c || isPrenatal(c)) return "bebe"; const m = ageMonths(c); return m < 12 ? "bebe" : m < 144 ? "enfant" : "ado"; })();
  UI.faTopic = topic || UI.faTopic || "rcr";
  const F = FA[UI.faTopic], steps = F[UI.faAge];
  sheet(`${sheetHead(T("Premiers soins"))}
    <div class="banner alert">${icon("phone")}<div><b>${T("Appelez le 911 d'abord")}</b> ${T("(ou faites appeler). Le répartiteur vous guidera aussi au téléphone.")}</div></div>
    <div class="seg">${FA_AGES.map(([k,l]) => `<button data-act="faAge" data-v="${k}" aria-pressed="${UI.faAge===k}">${T(l)}</button>`).join("")}</div>
    <div class="pick">${Object.entries(FA).map(([k,x]) => `<button data-act="faTopic" data-v="${k}" aria-pressed="${UI.faTopic===k}">${icon(x.ic)} ${T(x.l)}</button>`).join("")}</div>
    <p class="small"><b>${T("Quand ?")}</b> ${T(F.when)}</p>
    <ol class="fa-steps">${steps.map(s => `<li>${T(s)}</li>`).join("")}</ol>
    ${UI.faTopic === "rcr" ? `<div class="row" style="flex-wrap:wrap"><span class="chip rose">${UI.faAge==="bebe"?"30 : 2 · 4 cm":UI.faAge==="enfant"?"30 : 2 · 5 cm":"30 : 2 · 5-6 cm"}</span><span class="chip butter">100-120 / min</span><button class="btn kid" data-act="faMetro">${icon(FAM.on?"pause":"play")}${FAM.on?T("Arrêter le rythme"):T("Rythme sonore 110 / min")}</button></div>` : ""}
    <p class="tiny muted">${T("Aide-mémoire basé sur Cœur + AVC et la Croix-Rouge canadienne. Il ne remplace pas une formation : un cours de secourisme (4 à 8 h) donne l'assurance d'agir.")} <a href="https://www.croixrouge.ca/cours-et-certification" target="_blank" rel="noopener">${T("Trouver un cours")}</a></p>`, "wide");
}
/* métronome pour les compressions (bip + vibration) */
const FAM = {on:false, t:null, ctx:null};
function faMetro(){
  if (FAM.on){ clearInterval(FAM.t); FAM.on = false; firstAidSheet(); return; }
  try { FAM.ctx = FAM.ctx || new (window.AudioContext || window.webkitAudioContext)(); FAM.ctx.resume?.(); } catch(e){}
  let n = 0; FAM.on = true;
  FAM.t = setInterval(() => { n++; try { const o = FAM.ctx.createOscillator(), g = FAM.ctx.createGain(); o.frequency.value = n % 30 === 0 ? 1320 : 880; g.gain.value = 0.25; o.connect(g); g.connect(FAM.ctx.destination); o.start(); o.stop(FAM.ctx.currentTime + 0.06); } catch(e){} if (navigator.vibrate) navigator.vibrate(40); }, 60000/110);
  firstAidSheet();
}
Object.assign(ACT, {
  firstAid: () => firstAidSheet(), faAge: v => firstAidSheet(v), faTopic: v => firstAidSheet(null, v), faMetro: () => faMetro(),
});
