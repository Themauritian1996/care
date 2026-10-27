/* =========================================================================
   TRIBU — données de référence
   ========================================================================= */

/* ---------- stades ---------- */
const STAGES = [
  {max:0,    id:"pre",  label:"À naître",       color:"rose"},
  {max:12,   id:"nour", label:"Nourrisson",     color:"peach"},
  {max:36,   id:"bamb", label:"Bambin",         color:"butter"},
  {max:72,   id:"pres", label:"Préscolaire",    color:"mint"},
  {max:144,  id:"scol", label:"Âge scolaire",   color:"sky"},
  {max:216,  id:"ado",  label:"Adolescent·e",   color:"lilac"},
  {max:99999,id:"adulte",label:"Adulte",        color:"mint"},
];

/* ---------- PIQ (quebec.ca, calendrier régulier 2025-2026) ---------- */
const PIQ = [
  {age:0, label:"Naissance", note:"Anticorps contre le VRS si né·e pendant la saison (automne-hiver).", doses:[{id:"vrs", name:"Anticorps monoclonal VRS", short:"VRS", seasonal:true}]},
  {age:2, label:"2 mois", doses:[{id:"dcat2", name:"DCaT-HB-VPI-Hib", short:"Diphtérie, coqueluche, tétanos, hépatite B, polio, Hib"},{id:"pneu2", name:"Pneumocoque conjugué", short:"Pneu-C"},{id:"rota2", name:"Rotavirus (oral)", short:"Rota"}]},
  {age:4, label:"4 mois", doses:[{id:"dcat4", name:"DCaT-HB-VPI-Hib", short:"Diphtérie, coqueluche, tétanos, hépatite B, polio, Hib"},{id:"pneu4", name:"Pneumocoque conjugué", short:"Pneu-C"},{id:"rota4", name:"Rotavirus (oral)", short:"Rota"}]},
  {age:12, label:"12 mois", doses:[{id:"dcat12", name:"DCaT-VPI-Hib", short:"Diphtérie, coqueluche, tétanos, polio, Hib"},{id:"pneu12", name:"Pneumocoque conjugué", short:"Pneu-C"},{id:"rrov12", name:"RRO-Var", short:"Rougeole, rubéole, oreillons, varicelle"}]},
  {age:18, label:"18 mois", doses:[{id:"men18", name:"Méningocoque", short:"Men-C"},{id:"rrov18", name:"RRO-Var", short:"Rougeole, rubéole, oreillons, varicelle"},{id:"hahb18", name:"HAHB", short:"Hépatite A et B"}]},
  {age:48, label:"4 à 6 ans", window:24, doses:[{id:"dcat4a", name:"dcaT-VPI", short:"Diphtérie, coqueluche, tétanos, polio"}]},
  {age:111, label:"4e année du primaire", window:12, note:"Donné à l'école (vers 9-10 ans).", doses:[{id:"ha4p", name:"Hépatite A", short:"HA"},{id:"vph4p", name:"VPH", short:"Virus du papillome humain"}]},
  {age:171, label:"3e secondaire", window:12, note:"Donné à l'école (vers 14-15 ans).", doses:[{id:"dt3s", name:"dT", short:"Diphtérie, tétanos"},{id:"men3s", name:"Méningocoque", short:"Men-C-ACYW"},{id:"hb3s", name:"Hépatite B", short:"HB"}]},
];
const VSTAT = { fait:["mint","Reçu"], du:["butter","À donner"], retard:["danger","En retard"], avenir:["sky","À venir"], na:["", "Non applicable"] };
/* Visites préventives (grille Rourke, puis aux 1-2 ans) */
const VISITS = [0.25,1,2,4,6,9,12,15,18,24,36,48,60,84,108,132,156,180,204];

/* ---------- JALONS ----------
   [domaine, texte, début de plage, fin de plage (≈90 % des enfants), âge où en parler | null, médiane connue | null]
   Motricité globale : fenêtres OMS (MGRS 2006 : 1er-99e percentile, médiane).
   Autres sphères : plages inspirées du Denver II (25e-90e percentile), du CDC 2022 et de la grille Rourke. */
const DOMAINS = {
  gm:{label:"Motricité globale", short:"Globale", color:"peach"},
  fm:{label:"Motricité fine", short:"Fine", color:"butter"},
  lang:{label:"Langage et communication", short:"Langage", color:"sky"},
  soc:{label:"Social, émotionnel et autonomie", short:"Social", color:"lilac"},
  cog:{label:"Cognitif et jeu", short:"Cognitif", color:"mint"},
};
const MS = [
  ["gm","Lève la tête à 45° couché sur le ventre",1,3,4],
  ["gm","Tient sa tête droite, bien stable",2,4,5],
  ["gm","Pousse sur ses avant-bras sur le ventre",2,4,6],
  ["gm","Se retourne du ventre au dos",3,6,7],
  ["gm","Se retourne du dos au ventre",4,7,8],
  ["gm","Assis sans appui",3.8,9.2,9,5.9],
  ["gm","Debout avec appui",4.8,11.4,12,7.4],
  ["gm","Marche à quatre pattes",5.2,13.5,null,8.3],
  ["gm","Marche en se tenant aux meubles",5.9,13.7,15,9.0],
  ["gm","Debout seul quelques secondes",6.9,16.9,null,10.8],
  ["gm","Marche seul",8.2,17.6,18,12.0],
  ["gm","Monte les escaliers avec aide",14,24,null],
  ["gm","Court",16,24,30],
  ["gm","Frappe un ballon du pied",15,24,null],
  ["gm","Saute à pieds joints",22,36,36],
  ["gm","Pédale un tricycle",30,48,null],
  ["gm","Monte l'escalier en alternant les pieds",30,48,null],
  ["gm","Se tient sur un pied 5 secondes",36,60,60],
  ["gm","Saute sur un pied",40,60,null],
  ["gm","Attrape un ballon avec les mains",48,72,null],
  ["fm","Mains ouvertes la plupart du temps",1,4,4],
  ["fm","Agrippe et secoue un hochet",3,5,6],
  ["fm","Porte les objets à la bouche",3,6,null],
  ["fm","Transfère un objet d'une main à l'autre",5,8,9],
  ["fm","Ramasse en « râteau » avec toute la main",6,9,null],
  ["fm","Pince pouce-index (petits morceaux)",9,14,15],
  ["fm","Tape deux objets l'un contre l'autre",8,12,null],
  ["fm","Met des objets dans un contenant",10,14,null],
  ["fm","Gribouille spontanément",12,18,24],
  ["fm","Empile 2 cubes",13,20,null],
  ["fm","Empile 4 cubes ou plus",18,26,null],
  ["fm","Tourne les pages une à une",24,36,null],
  ["fm","Copie un cercle",30,40,48],
  ["fm","Coupe avec des ciseaux d'enfant",36,48,null],
  ["fm","Copie une croix",40,54,null],
  ["fm","Dessine un bonhomme en 3 parties",42,60,null],
  ["fm","Copie un carré",48,66,null],
  ["fm","Écrit son prénom",54,72,null],
  ["lang","Gazouille (sons de voyelles)",1,3,4],
  ["lang","Rit aux éclats",3,5,6],
  ["lang","Se tourne vers une voix",3,6,6],
  ["lang","Babille en syllabes (« ba-ba », « ma-ma »)",5,10,12],
  ["lang","Répond à son prénom",6,10,12],
  ["lang","Comprend « non »",7,12,null],
  ["lang","Pointe du doigt pour montrer",9,14,15],
  ["lang","Dit un premier mot avec sens",10,14,16],
  ["lang","Suit une consigne simple avec geste",12,15,18],
  ["lang","Dit au moins 5 mots",12,18,18],
  ["lang","Montre des parties du corps nommées",15,24,null],
  ["lang","Combine 2 mots (« encore lait »)",18,24,24],
  ["lang","Dit environ 50 mots",20,26,30],
  ["lang","Fait des phrases de 3 mots",24,36,36],
  ["lang","Pose des questions (« pourquoi ? »)",30,42,null],
  ["lang","Compris aux trois quarts par un inconnu",30,48,48],
  ["lang","Raconte une courte histoire",42,60,60],
  ["lang","Utilise le passé et le futur",48,60,null],
  ["lang","Compte jusqu'à 10",48,66,null],
  ["soc","Fixe les visages",0,2,2],
  ["soc","Sourit en réponse à votre sourire",1,3,3],
  ["soc","S'excite en voyant son parent",3,5,null],
  ["soc","Reconnaît les visages familiers",4,7,null],
  ["soc","Se méfie des inconnus",6,10,null],
  ["soc","Joue à « coucou »",7,11,null],
  ["soc","Fait « bye-bye »",9,13,null],
  ["soc","Regarde où vous pointez (attention conjointe)",9,14,15],
  ["soc","Imite les gestes du quotidien",12,18,null],
  ["soc","Boit au verre, mange à la cuillère",13,20,null],
  ["soc","Joue à faire semblant",15,24,24],
  ["soc","Aide à se déshabiller",18,30,null],
  ["soc","Joue à côté d'autres enfants",24,36,null],
  ["soc","Joue avec d'autres, attend son tour",30,48,48],
  ["soc","Propre le jour",24,48,null],
  ["soc","S'habille seul",42,60,null],
  ["soc","Suit les règles d'un jeu",48,66,null],
  ["cog","Suit un objet des yeux de gauche à droite",1,3,4],
  ["cog","Explore les objets avec les mains et la bouche",3,6,null],
  ["cog","Cherche un objet tombé",6,9,null],
  ["cog","Trouve un objet caché sous un tissu",8,12,null],
  ["cog","Utilise les objets correctement (brosse, téléphone)",12,18,null],
  ["cog","Fait un encastrement simple",18,30,null],
  ["cog","Associe des objets pareils (couleurs, formes)",24,36,null],
  ["cog","Dit son prénom et son âge",30,42,null],
  ["cog","Compte 3 objets",36,48,null],
  ["cog","Nomme 4 couleurs",36,54,null],
  ["cog","Comprend « pareil » et « différent »",36,54,54],
  ["cog","Distingue le réel de l'imaginaire",48,66,null],
  ["cog","Reconnaît des lettres, dont celles de son prénom",48,72,null],
].map(([d,t,a,b,al,med]) => {
  const m50 = med ?? +(a + (b-a)*0.45).toFixed(1);   // médiane : OMS si connue, sinon estimée dans la plage
  const m25 = +(a + (m50-a)*0.5).toFixed(1);
  return {d, t, a, b, al, m25, m50, k:`${d}|${t}`};
});
const BANDS = [2,4,6,9,12,15,18,24,30,36,48,60,72];
const GENERAL_FLAGS = [
  "Perte d'une habileté déjà acquise (à tout âge)",
  "Préférence nette d'une main avant 12 mois, ou un côté qui bouge moins",
  "Raideur ou mollesse marquée du corps",
  "Marche persistante sur la pointe des pieds après 2 ans",
  "Peu de contact visuel ou d'intérêt pour les personnes",
  "Votre inquiétude persistante de parent : elle compte, parlez-en",
];

/* ---------- repères 6-18 ans ---------- */
const OLDER = {
  scol:[
    {t:"Sommeil", d:"9 à 11 h par nuit entre 5 et 13 ans, avec des heures de coucher et de lever régulières."},
    {t:"Activité physique", d:"60 min par jour d'activité modérée à intense ; activités intenses et renforcement 3 jours par semaine."},
    {t:"Écrans", d:"Au plus 2 h par jour de loisirs à l'écran. Pas d'écran dans la chambre la nuit."},
    {t:"Apprentissages", d:"Difficultés persistantes de lecture, d'écriture, d'attention ou de coordination : un bilan précoce aide."},
    {t:"Puberté", d:"Début habituel : 8 à 13 ans chez la fille, 9 à 14 ans chez le garçon. Consultez si signes avant 8 ans (fille) ou 9 ans (garçon)."},
    {t:"Amitiés", d:"Avoir au moins un ami proche protège. Un enfant isolé ou intimidé a besoin qu'on en parle."},
  ],
  ado:[
    {t:"Sommeil", d:"8 à 10 h par nuit entre 14 et 17 ans. Les ados s'endorment naturellement plus tard : protégez les heures de sommeil."},
    {t:"Santé mentale", d:"Changements durables d'humeur, retrait, chute des notes ou du sommeil : parlez-en sans juger."},
    {t:"Puberté", d:"Consultez si aucun signe à 13 ans (fille) ou 14 ans (garçon), ou pas de règles 3 ans après le début des seins."},
    {t:"Autonomie", d:"Préparez la transition : prendre ses rendez-vous, connaître ses médicaments, sa carte RAMQ, ses allergies."},
    {t:"Sport et vie sociale", d:"Une équipe, un club ou un projet donne un sentiment d'appartenance qui protège la santé mentale."},
    {t:"Prévention", d:"Consentement, alcool, cannabis, vapotage, conduite : abordez ces sujets tôt, souvent, sans dramatiser."},
  ],
};

/* ---------- Directives canadiennes de mouvement sur 24 h + objectifs usuels ---------- */
function guide(m){
  if (m < 4)   return {sleep:[14,17], act:30,  actLbl:"Temps sur le ventre", screen:0,   read:10, band:"0-3 mois"};
  if (m < 12)  return {sleep:[12,16], act:30,  actLbl:"Jeu au sol et ventre", screen:0,  read:10, band:"4-11 mois"};
  if (m < 24)  return {sleep:[11,14], act:180, actLbl:"Activité, toutes intensités", screen:0,  read:15, band:"1-2 ans"};
  if (m < 36)  return {sleep:[11,14], act:180, actLbl:"Activité, toutes intensités", screen:60, read:15, band:"2 ans"};
  if (m < 60)  return {sleep:[10,13], act:180, actLbl:"Activité, dont 60 min énergique", screen:60, read:15, band:"3-4 ans"};
  if (m < 168) return {sleep:[9,11],  act:60,  actLbl:"Activité modérée à intense", screen:120, read:20, band:"5-13 ans"};
  if (m < 216) return {sleep:[8,10], act:60, actLbl:"Activité modérée à intense", screen:120, read:20, band:"14-17 ans"};
  return {sleep:[7,9], act:22, actLbl:"150 min par semaine d'activité modérée à intense", screen:180, read:20, band:"Adulte"};
}

/* ---------- dents de lait : position sur le schéma (arcade) ---------- */
/* dents de lait : numérotation FDI (quadrants 5 haut droite, 6 haut gauche, 7 bas gauche, 8 bas droite ; 1 = incisive centrale … 5 = 2e molaire) */
const TEETH = [
  {id:"ui", k:1, n:"Incisives centrales du haut", age:"8-12 mois", lost:"6-7 ans", jaw:"u", pos:[0]},
  {id:"ul", k:2, n:"Incisives latérales du haut", age:"9-13 mois", lost:"7-8 ans", jaw:"u", pos:[1]},
  {id:"uc", k:3, n:"Canines du haut", age:"16-22 mois", lost:"10-12 ans", jaw:"u", pos:[2]},
  {id:"um1", k:4, n:"Premières molaires du haut", age:"13-19 mois", lost:"9-11 ans", jaw:"u", pos:[3]},
  {id:"um2", k:5, n:"Deuxièmes molaires du haut", age:"25-33 mois", lost:"10-12 ans", jaw:"u", pos:[4]},
  {id:"li", k:1, n:"Incisives centrales du bas", age:"6-10 mois", lost:"6-7 ans", jaw:"l", pos:[0]},
  {id:"ll", k:2, n:"Incisives latérales du bas", age:"10-16 mois", lost:"7-8 ans", jaw:"l", pos:[1]},
  {id:"lc", k:3, n:"Canines du bas", age:"17-23 mois", lost:"9-12 ans", jaw:"l", pos:[2]},
  {id:"lm1", k:4, n:"Premières molaires du bas", age:"14-18 mois", lost:"9-11 ans", jaw:"l", pos:[3]},
  {id:"lm2", k:5, n:"Deuxièmes molaires du bas", age:"23-31 mois", lost:"10-12 ans", jaw:"l", pos:[4]},
];
/* dents permanentes (adultes) : FDI quadrants 1 haut droite, 2 haut gauche, 3 bas gauche, 4 bas droite ; 1 à 8 */
const PERM_TEETH = [
  {k:1, jaw:"u", n:"Incisives centrales du haut", age:"7-8 ans"},
  {k:2, jaw:"u", n:"Incisives latérales du haut", age:"8-9 ans"},
  {k:3, jaw:"u", n:"Canines du haut", age:"11-12 ans"},
  {k:4, jaw:"u", n:"Premières prémolaires du haut", age:"10-11 ans"},
  {k:5, jaw:"u", n:"Deuxièmes prémolaires du haut", age:"10-12 ans"},
  {k:6, jaw:"u", n:"Premières molaires du haut", age:"6-7 ans"},
  {k:7, jaw:"u", n:"Deuxièmes molaires du haut", age:"12-13 ans"},
  {k:8, jaw:"u", n:"Troisièmes molaires du haut (dents de sagesse)", age:"17-21 ans"},
  {k:1, jaw:"l", n:"Incisives centrales du bas", age:"6-7 ans"},
  {k:2, jaw:"l", n:"Incisives latérales du bas", age:"7-8 ans"},
  {k:3, jaw:"l", n:"Canines du bas", age:"9-10 ans"},
  {k:4, jaw:"l", n:"Premières prémolaires du bas", age:"10-12 ans"},
  {k:5, jaw:"l", n:"Deuxièmes prémolaires du bas", age:"11-12 ans"},
  {k:6, jaw:"l", n:"Premières molaires du bas", age:"6-7 ans"},
  {k:7, jaw:"l", n:"Deuxièmes molaires du bas", age:"11-13 ans"},
  {k:8, jaw:"l", n:"Troisièmes molaires du bas (dents de sagesse)", age:"17-21 ans"},
];
const fdi = (perm, jaw, sd, k) => `${perm ? (jaw === "u" ? (sd === "R" ? 1 : 2) : (sd === "L" ? 3 : 4)) : (jaw === "u" ? (sd === "R" ? 5 : 6) : (sd === "L" ? 7 : 8))}${k}`;
const TEETH_TIPS = [
  "Dès la première dent : brossez deux fois par jour avec un grain de riz de dentifrice fluoré, puis un petit pois dès 3 ans.",
  "Poussée dentaire : un anneau de dentition froid (pas congelé) ou un doigt propre sur la gencive soulagent. Pas de gel anesthésiant ni de collier d'ambre.",
  "La poussée peut donner un peu de bave et d'irritabilité, mais pas de forte fièvre ni de diarrhée importante : consultez si c'est le cas.",
  "Pas de biberon au lit, sauf de l'eau : le lait qui stagne cause des caries.",
  "Première visite chez le dentiste vers 1 an. Gratuite avec la carte RAMQ jusqu'à 10 ans.",
  "Les dents d'adulte commencent vers 6 ans (premières molaires et incisives du bas).",
];

/* ---------- alimentation ---------- */
const ALLERGENS = ["Arachides","Œufs","Lait de vache","Noix","Soya","Sésame","Blé","Poisson","Crustacés et mollusques","Moutarde"];
/* Guide alimentaire canadien : ½ légumes et fruits, ¼ protéines, ¼ grains entiers */
const FOOD_GROUPS = {
  legfruits:{label:"Légumes et fruits", color:"mint", target:0.5},
  proteines:{label:"Protéines", color:"peach", target:0.25},
  grains:{label:"Grains entiers", color:"butter", target:0.25},
  laitiers:{label:"Lait et substituts", color:"sky", target:null},
  autres:{label:"Gâteries et autres", color:"rose", target:null},
};
const FOOD_SUGG = {
  legfruits:["Bâtonnets de concombre","Petits fruits","Banane","Brocoli vapeur","Purée de courge","Patate douce rôtie","Pomme en lamelles","Tomates cerises coupées en 4"],
  proteines:["Œufs brouillés","Lentilles","Poulet effiloché","Tofu en cubes","Saumon","Beurre d'arachide (mince couche)","Pois chiches écrasés","Yogourt nature"],
  grains:["Gruau","Pain de grains entiers","Pâtes de blé entier","Riz brun","Quinoa","Orge","Galette de riz"],
  laitiers:["Lait 3,25 % (dès 9-12 mois)","Fromage râpé","Yogourt","Boisson de soya enrichie (après 2 ans)"],
};
/* Repère courant pour les tout-petits : environ 1 c. à soupe de chaque aliment par année d'âge */
const portionHint = m => m < 12 ? "Quelques cuillerées, selon la faim" : m < 72 ? `Environ ${Math.max(1, Math.round(m/12))} c. à soupe de chaque aliment par repas (1 c. à soupe par année d'âge), plus si l'enfant a faim` : m < 144 ? "Une assiette d'enfant : ½ légumes et fruits, ¼ protéines, ¼ grains entiers" : "Assiette adulte : ½ légumes et fruits, ¼ protéines, ¼ grains entiers";

/* ---------- choix rapides ---------- */
const QUICK = {
  diaperColor:["Jaune","Brun","Vert","Noir (méconium)","Blanc / pâle","Rouge (sang)"],
  diaperTexture:["Liquide","Molle","Formée","Dure"],
  feedSide:["Sein gauche","Sein droit","Biberon","Lait maternisé","Lait tiré"],
  sleepKind:["Sieste","Nuit"],
  sleepWhere:["Lit","Bras","Poussette","Auto","Porte-bébé"],
  mood:["Super","Bien","Moyen","Difficile"],
  medCommon:["Acétaminophène","Ibuprofène","Vitamine D","Salbutamol","Antibiotique"],
  activity:["Jeu libre dehors","Parc","Marche","Vélo","Natation","Soccer","Hockey","Danse","Gymnastique","Ski","Arts martiaux"],
};

/* ---------- CONSEILS : [catégorie, âge min (mois), âge max, titre, texte] (âge −9 = grossesse) ---------- */
const TIPCAT = {
  grossesse:["Grossesse","rose"], sommeil:["Sommeil","lilac"], alim:["Alimentation","mint"], secu:["Sécurité","butter"], sante:["Santé","rose"],
  dev:["Éveil et développement","peach"], ecrans:["Écrans","sky"], sport:["Sport et activité","mint"],
  emotions:["Émotions et relations","lilac"], ecole:["École","sky"], social:["Vie sociale","peach"],
  parler:["En parler avec mon ado","butter"], puberte:["Puberté","rose"], parents:["Pour vous, parents","lilac"],
};
const TIPS = [
  ["grossesse",-10,0,"Vaccins pendant la grossesse","Le vaccin contre la coqueluche est recommandé à chaque grossesse, idéalement entre 21 et 32 semaines. Il protège bébé dès la naissance."],
  ["grossesse",-10,0,"Préparer le siège d'auto","Installez-le quelques semaines avant la date prévue. Des points de vérification gratuits existent dans plusieurs régions."],
  ["grossesse",-10,0,"RQAP","Faites la demande au Régime québécois d'assurance parentale dès la dernière paie avant le congé."],
  ["grossesse",-10,0,"Bouger pendant la grossesse","150 minutes par semaine d'activité modérée sont recommandées sauf contre-indication. Le renforcement du plancher pelvien aide avant et après."],
  ["sommeil",0,12,"Sommeil sécuritaire","Toujours sur le dos, seul dans son lit, sans oreiller, bordure ni peluche. Chambre entre 18 et 20 °C, près des parents les 6 premiers mois."],
  ["sommeil",4,36,"Routine du dodo","Bain, pyjama, histoire, câlin : la même séquence chaque soir aide l'enfant à s'endormir."],
  ["sommeil",6,36,"Siestes","Vers 6 mois : 2 à 3 siestes ; vers 12-18 mois : passage à 1 sieste ; la plupart cessent entre 3 et 5 ans."],
  ["sommeil",36,144,"Heure de coucher stable","Une heure de coucher régulière, même la fin de semaine, protège l'humeur et l'attention."],
  ["sommeil",144,999,"Ados et sommeil","Les écrans hors de la chambre la nuit sont la mesure la plus efficace pour le sommeil des ados."],
  ["alim",0,6,"Allaitement et vitamine D","400 UI de vitamine D par jour pour les bébés allaités, partiellement ou complètement."],
  ["alim",4,12,"Début des aliments solides","Vers 6 mois, quand bébé tient assis et montre de l'intérêt. Pas avant 4 mois."],
  ["alim",4,24,"Allergènes tôt et souvent","Offrez arachides, œufs et autres allergènes dès le début des solides, puis plusieurs fois par semaine."],
  ["alim",0,12,"Pas de miel avant 1 an","Risque de botulisme infantile, même cuit dans un aliment."],
  ["alim",6,36,"Haut-le-cœur ou étouffement ?","Un haut-le-cœur est bruyant et protecteur. Un enfant qui s'étouffe est silencieux, ne tousse pas efficacement et peut bleuir : 911."],
  ["alim",12,72,"Toux aux repas","Toux fréquente, voix mouillée ou pneumonies à répétition aux repas peuvent signaler un trouble de déglutition : parlez-en au médecin."],
  ["alim",12,144,"Le parent décide quoi, l'enfant décide combien","Offrez des repas variés à heures fixes et laissez l'enfant écouter sa faim, sans forcer ni récompenser."],
  ["alim",144,999,"Ados et alimentation","Déjeuner, eau plutôt que boissons sucrées ou énergisantes. Restrictions, pesées répétées ou repas sautés : soyez attentifs et parlez-en."],
  ["secu",0,48,"Siège d'auto","Orienté vers l'arrière le plus longtemps possible, jusqu'aux limites indiquées par le fabricant."],
  ["secu",48,144,"Siège d'appoint","Jusqu'à 145 cm ou 9 ans selon la loi québécoise."],
  ["secu",6,60,"Maison sécuritaire","Barrières d'escalier, médicaments et produits ménagers hors de portée, arrêts de fenêtre."],
  ["secu",12,144,"Eau et baignade","Toujours à portée de bras d'un adulte. Cours de natation dès que possible, veste de flottaison en bateau."],
  ["secu",36,999,"Casque","Vélo, trottinette, planche, ski : casque bien ajusté à chaque sortie."],
  ["sante",0,3,"Fièvre avant 3 mois","Une température rectale de plus de 38,0 °C chez un bébé de moins de 3 mois demande une consultation rapide."],
  ["sante",0,999,"Info-Santé 811","Une infirmière répond 24 h/24 pour vous aider à décider s'il faut consulter."],
  ["sante",6,999,"Dents","Brossage deux fois par jour avec dentifrice fluoré. Dentiste chaque année, couvert par la RAMQ jusqu'à 10 ans."],
  ["sante",36,84,"Vision","Un examen de la vue est recommandé avant l'entrée à l'école, couvert par la RAMQ."],
  ["dev",0,12,"Parler à bébé","Décrivez ce que vous faites, chantez, répondez à ses sons : c'est la base du langage."],
  ["dev",0,999,"Lire chaque jour","Lire avec l'enfant dès la naissance enrichit le vocabulaire et le lien. À l'école, 20 minutes par jour."],
  ["dev",12,72,"Jouer, c'est apprendre","Blocs, pâte à modeler, jeu libre dehors : mieux que les jouets électroniques."],
  ["dev",0,12,"Temps sur le ventre","Plusieurs fois par jour, éveillé et surveillé, dès la naissance, pour la force du cou et prévenir la tête plate."],
  ["ecrans",0,24,"Pas d'écran avant 2 ans","Sauf les appels vidéo avec la famille."],
  ["ecrans",24,60,"Écrans de 2 à 5 ans","Moins d'une heure par jour, contenu de qualité, regardé avec un adulte."],
  ["ecrans",60,999,"Plan familial des écrans","Écrans éteints aux repas et 1 h avant le coucher, appareils hors de la chambre la nuit."],
  ["sport",12,72,"Bouger 3 heures par jour","Les 1-4 ans devraient être actifs au moins 180 minutes réparties dans la journée."],
  ["sport",36,96,"Habiletés de base","Courir, sauter, lancer, attraper, nager, faire du vélo : ces bases rendent tous les sports plus faciles ensuite."],
  ["sport",60,144,"Essayer plusieurs sports","Avant 12 ans, varier les sports réduit les blessures et l'abandon. Évitez la spécialisation précoce."],
  ["sport",72,999,"Douleur qui fait boiter","Une douleur au genou, au talon ou au dos qui persiste ou fait boiter chez un jeune sportif mérite une évaluation."],
  ["sport",72,999,"Commotion cérébrale","Après un coup à la tête : arrêt immédiat du jeu, aucun retour le même jour, retour progressif selon un protocole."],
  ["sport",144,999,"Musculation chez l'ado","Elle est sécuritaire avec une bonne technique et une progression supervisée. La forme avant la charge."],
  ["emotions",12,60,"Crises de colère","Normales vers 2-3 ans. Restez calme, nommez l'émotion, gardez la limite."],
  ["emotions",60,999,"Un moment seul à seul","Quelques minutes par jour d'attention exclusive renforcent le lien et la coopération."],
  ["emotions",72,999,"Intimidation","Changements d'humeur, objets perdus, refus d'aller à l'école : demandez directement, sans minimiser."],
  ["ecole",48,84,"Entrée à la maternelle","Autonomie aux toilettes, ouvrir sa boîte à lunch, s'habiller : pratiquez l'été avant."],
  ["ecole",72,999,"Devoirs","Un coin calme, un horaire fixe, et votre intérêt plus que vos corrections."],
  ["social",96,999,"Amitiés","Ouvrez la maison aux amis : connaître leurs amis aide à rester proche de vos enfants."],
  ["social",120,999,"Appartenance","Un groupe (sport, musique, scouts, bénévolat) protège contre l'isolement et les comportements à risque."],
  ["social",144,999,"Vie privée et confiance","Plus d'autonomie en échange de règles claires (où, avec qui, retour) : la confiance se construit par étapes."],
  ["parler",96,999,"Comment ouvrir la discussion","En voiture, en cuisinant, en marchant : côte à côte plutôt que face à face. Posez des questions ouvertes et écoutez plus que vous parlez."],
  ["parler",108,999,"Réseaux sociaux","Parlez de ce qu'il voit en ligne, du partage de photos, des inconnus et du droit de vous en parler sans être puni."],
  ["parler",120,999,"Alcool, cannabis, vapotage","Donnez des faits, partagez vos valeurs, et proposez un « plan de sortie » : il peut vous appeler à toute heure pour revenir, sans sermon ce soir-là."],
  ["parler",120,999,"Sexualité et consentement","Commencez tôt avec des mots justes pour le corps. Plus tard : consentement, respect, contraception, ITSS. Plusieurs petites discussions valent mieux qu'une grande."],
  ["parler",132,999,"Pornographie","Expliquez calmement que ce n'est pas une image réaliste des relations ni du consentement. Restez disponible sans faire honte."],
  ["parler",132,999,"Santé mentale","Demandez directement comment il va, y compris s'il a des idées noires : en parler ne donne pas l'idée, ça protège. Tel-jeunes et le 988 répondent aussi par texto."],
  ["parler",144,999,"Argent et jeux","Un petit budget à gérer apprend beaucoup. Parlez des achats dans les jeux et des paris sportifs en ligne."],
  ["parler",168,999,"Conduite","Pas de téléphone au volant, jamais après consommation. Le permis graduel protège les jeunes conducteurs."],
  ["puberte",96,168,"En parler avant","Expliquez les changements du corps avant qu'ils arrivent : règles, mue, odeurs, émotions."],
  ["puberte",108,216,"Image corporelle","Parlez du corps en termes de santé et de force plutôt que de poids ou d'apparence."],
  ["parents",-10,6,"Baby blues ou dépression post-partum ?","Le blues dure environ 2 semaines. Tristesse, anxiété ou épuisement qui durent plus longtemps touchent aussi les pères : parlez-en, Info-Social 811 option 2."],
  ["parents",0,12,"Dormir quand c'est possible","Relayez-vous pour les nuits et acceptez l'aide concrète : repas, ménage, gardiennage."],
  ["parents",0,12,"Retour à l'activité après l'accouchement","Marche dès que vous vous sentez prêt·e. Une physiothérapie du plancher pelvien est utile avant de reprendre course et sauts."],
  ["parents",-10,999,"Bouger pour vous","150 minutes par semaine d'activité modérée pour les adultes. Bouger avec les enfants compte aussi : poussette, vélo, parc."],
  ["parents",0,999,"Le couple","Un moment à deux par semaine, même 30 minutes, aide à rester une équipe."],
  ["parents",12,999,"Charge mentale","Partagez les tâches dans l'app : chacun voit ce qu'il y a à faire et qui s'en occupe."],
  ["parents",0,999,"Prendre soin de soi","Vous ne pouvez pas verser d'une tasse vide. Votre santé fait partie de celle de la famille."],
];

/* ---------- modules (affichage par enfant) ---------- */
const MODULES = [
  {k:"feeding", l:"Boires et tétées", d:"Sein, biberon, minuterie", def:m => m >= 0 && m < 18},
  {k:"solids", l:"Repas et allergènes", d:"Aliments, favoris, portions", def:m => m >= 4},
  {k:"diapers", l:"Couches", d:"Pipi, selles", def:m => m >= 0 && m < 42},
  {k:"tummy", l:"Temps sur le ventre", d:"Pour les tout-petits", def:m => m >= 0 && m < 9},
  {k:"teeth", l:"Dents", d:"Schéma, poussée dentaire", def:m => m >= 3 && m < 84},
  {k:"milestones", l:"Jalons du développement", d:"0 à 6 ans", def:m => m >= 0 && m < 78},
  {k:"older", l:"Repères 6-18 ans", d:"Sommeil, puberté, santé mentale", def:m => m >= 60},
  {k:"vaccines", l:"Vaccins", d:"Carnet PIQ", def:m => m >= 0},
  {k:"growth", l:"Croissance", d:"Courbes OMS", def:m => m >= 0},
  {k:"ofc", l:"Périmètre crânien", d:"Courbe de la tête", def:m => m >= 0 && m < 36},
  {k:"projection", l:"Projection de taille", d:"Estimation de taille adulte", def:m => m >= 12},
  {k:"sports", l:"Sports et activités", d:"Horaire hebdomadaire", def:m => m >= 36},
  {k:"reading", l:"Lecture", d:"Minutes et livres", def:m => m >= 0},
  {k:"screen", l:"Écrans", d:"Minutes de loisirs", def:m => m >= 18},
  {k:"mood", l:"Humeur", d:"Suivi de l'humeur", def:m => m >= 48},
  {k:"prenatal", l:"Grossesse", d:"Semaines, préparatifs", def:m => m < 0},
];
/* fonctions de la famille, affichables ou non */
const FEATURES = [
  {k:"planner", l:"Agenda familial", d:"Calendrier partagé, disponibilités"},
  {k:"kidcal", l:"Agenda des enfants", d:"Les enfants ajoutent leurs propres activités (fête d'amis, pratique…)"},
  {k:"rewards", l:"Défis et récompenses", d:"Tâches, points, récompenses"},
  {k:"memories", l:"Souvenirs", d:"Moments précieux, « ce jour-là »"},
  {k:"photos", l:"Photo du jour", d:"Album classé par catégorie"},
  {k:"chat", l:"Discussions", d:"Famille et groupes d'amis"},
  {k:"groups", l:"Groupes", d:"Amis, cousins, activités communes"},
  {k:"ai", l:"Assistant IA", d:"Gemini : photo de repas, questions, revues"},
  {k:"tips", l:"Conseils", d:"Selon l'âge"},
];

/* ---------- avatars : animaux et symboles ---------- */
const AVATARS = {
  animaux:["poussin","ourson","lapin","chat","renard","panda","grenouille","pingouin","hibou","baleine"],
  symboles:["etoile","fusee","ballon","note","eclair","couronne","manette","guitare","coeur","feuille"],
};
const AV_LABEL = {poussin:"Poussin",ourson:"Ourson",lapin:"Lapin",chat:"Chat",renard:"Renard",panda:"Panda",grenouille:"Grenouille",pingouin:"Pingouin",hibou:"Hibou",baleine:"Baleine",
  etoile:"Étoile",fusee:"Fusée",ballon:"Ballon",note:"Musique",eclair:"Éclair",couronne:"Couronne",manette:"Manette",guitare:"Guitare",coeur:"Cœur",feuille:"Feuille"};
const COLORS = ["peach","mint","butter","sky","lilac","rose","teal","coral"];
const BGS = [
  {id:"lavande", l:"Lavande", light:"#F6F4FB", dark:"#17141F"},
  {id:"creme", l:"Vanille", light:"#FBF7F0", dark:"#1A1713"},
  {id:"menthe", l:"Menthe", light:"#F1F8F5", dark:"#121A17"},
  {id:"ciel", l:"Ciel", light:"#F1F6FC", dark:"#121722"},
  {id:"rose", l:"Rosé", light:"#FCF3F5", dark:"#1D1418"},
  {id:"blanc", l:"Blanc", light:"#FFFFFF", dark:"#101012"},
];

/* ---------- grossesse ---------- */
const PREG_SIZE = [[8,"une framboise"],[12,"une lime"],[16,"un avocat"],[20,"une banane"],[24,"un épi de maïs"],[28,"une aubergine"],[32,"une courge"],[36,"un melon miel"],[40,"une petite citrouille"]];
const PREG_CHECK = [
  {w:10, t:"Premier rendez-vous de suivi de grossesse"},
  {w:12, t:"Échographie de datation et dépistage prénatal"},
  {w:20, t:"Échographie morphologique (vers 18-22 semaines)"},
  {w:24, t:"Test de glucose (24-28 semaines)"},
  {w:26, t:"Vaccin contre la coqueluche (21-32 semaines)"},
  {w:28, t:"Demande au RQAP et inscription aux rencontres prénatales"},
  {w:30, t:"Choisir le médecin ou l'IPS de bébé"},
  {w:34, t:"Installer le siège d'auto"},
  {w:35, t:"Préparer la valise pour l'accouchement"},
  {w:36, t:"Dépistage du streptocoque B (35-37 semaines)"},
];

/* ---------- agenda ---------- */
const EVT = { enfant:["sky","Activité d'enfant"], medecin:["rose","Médecin / IPS"], dentiste:["mint","Dentiste"], vaccin:["butter","Vaccin"], garde:["sky","Garderie / école"], therapie:["lilac","Thérapie"], sport:["mint","Sport / activité"], famille:["peach","Famille"], groupe:["teal","Groupe"], autre:["coral","Autre"], anniv:["peach","Anniversaire"], visite:["rose","Visite suggérée"], souvenir:["butter","Souvenir"], photo:["lilac","Photo du jour"], note:["sky","Note qui reste"] };
const PHOTO_CATS = [
  {id:"cute", l:"Trop mignon", c:"rose"},{id:"loufoque", l:"Loufoque", c:"butter"},{id:"sortie", l:"Sortie", c:"mint"},
  {id:"famille", l:"En famille", c:"peach"},{id:"premiere", l:"Première fois", c:"lilac"},{id:"fete", l:"Fête", c:"coral"},{id:"autre", l:"Autre", c:"sky"},
];

/* ---------- défis et récompenses ---------- */
const TASK_TPL = [
  {t:"Faire son lit", p:5, ic:"bed", age:48},{t:"Ranger sa chambre", p:10, ic:"broom", age:48},{t:"Lire 20 minutes", p:10, ic:"book", age:60},
  {t:"Faire ses devoirs", p:15, ic:"pencil", age:72},{t:"Mettre la table", p:5, ic:"spoon", age:48},{t:"Vider le lave-vaisselle", p:10, ic:"dish", age:96},
  {t:"Se brosser les dents (matin et soir)", p:5, ic:"tooth", age:30},{t:"Sortir les poubelles", p:10, ic:"trash", age:108},
  {t:"Pratiquer son instrument", p:10, ic:"note", age:72},{t:"Bouger 60 minutes", p:10, ic:"run", age:60},{t:"Aider à préparer le souper", p:15, ic:"spoon", age:84},
  {t:"Courir 30 minutes (parent)", p:15, ic:"run", age:216},{t:"Soirée sans écran (parent)", p:15, ic:"screen", age:216},
];
const REWARD_TPL = [
  {t:"Choisir le film du vendredi", cost:40},{t:"30 min d'écran en plus", cost:30},{t:"Sortie crème glacée", cost:60},
  {t:"Choisir le souper", cost:50},{t:"Se coucher 30 min plus tard", cost:40},{t:"Une activité seul·e avec un parent", cost:80},
];
const LEVELS = [0,50,150,300,500,800,1200,1700,2300,3000];

/* ---------- SOUVENIRS SPÉCIAUX ---------- */
const SPECIAL = [
  {k:"first", l:"Premières fois", s:"Premières fois", ic:"star", c:"butter", d:"Premier sourire, premiers pas, première dent perdue…"},
  {k:"quote", l:"Mots d'enfant", s:"Mots d'enfant", ic:"chat", c:"sky", d:"Les phrases drôles ou touchantes, avec l'âge du moment."},
  {k:"interview", l:"Entrevue d'anniversaire", s:"Entrevues", ic:"gift", c:"peach", d:"Les mêmes questions chaque année, pour voir l'enfant grandir."},
  {k:"letter", l:"Lettres pour plus tard", s:"Lettres", ic:"mail", c:"lilac", d:"Une lettre scellée jusqu'à la date choisie (ex. 18 ans)."},
  {k:"art", l:"Dessins et créations", s:"Créations", ic:"pencil", c:"mint", d:"Photographiez les bricolages avant qu'ils disparaissent."},
  {k:"trip", l:"Voyages et sorties", s:"Voyages", ic:"pin", c:"coral", d:"Lieux visités, ce qu'on a aimé."},
];
/* [clé, libellé, âge habituel en mois] */
const FIRSTS = [
  ["sourire","Premier vrai sourire",1.5],["rire","Premier éclat de rire",4],["nuit","Première nuit complète",5],["retourne","Se retourne seul·e",5],
  ["aliment","Premier aliment solide",6],["dent","Première dent",7],["assis","S'assoit seul·e",7],["quatre","Marche à quatre pattes",9],
  ["bravo","Premier bravo / au revoir de la main",10],["mot","Premier mot",12],["pas","Premiers pas",12],["cheveux","Première coupe de cheveux",14],
  ["phrase","Première petite phrase",24],["proprete","Propre le jour",30],["garderie","Premier jour à la garderie",12],["dessin","Premier bonhomme dessiné",42],
  ["ecole","Premier jour d'école",60],["velo","Vélo sans petites roues",66],["dentperdue","Première dent perdue",72],["lire","Lit son premier livre seul·e",78],
  ["nage","Nage sans aide",84],["dodoami","Premier dodo chez un·e ami·e",96],["cellulaire","Premier cellulaire",144],["secondaire","Premier jour du secondaire",144],
  ["emploi","Premier emploi",180],["conduite","Permis de conduire",192],["bal","Bal des finissants",204],
];
const INTERVIEW_Q = [
  "Ta couleur préférée ?","Ton repas préféré ?","Ton jouet ou ton activité préférée ?","Ton meilleur ami ou ta meilleure amie ?",
  "Qu'est-ce qui te fait rire ?","Qu'est-ce qui te fait peur ?","Ta chanson ou ton film préféré ?","Ce que tu veux faire quand tu seras grand·e ?",
  "Ton moment préféré de l'année ?","Qu'est-ce que tu aimes chez maman / papa ?","Si tu avais un super-pouvoir ?","Ton endroit préféré ?",
];

/* conseils nutrition supplémentaires (Guide alimentaire canadien, Société canadienne de pédiatrie, Santé Canada) */
const NUT_TIPS = [
  ["alim",6,24,"Du fer deux fois par jour","Viande, poisson, œufs, tofu, légumineuses ou céréales enrichies : au moins 2 fois par jour entre 6 et 24 mois, car les réserves de fer du bébé s'épuisent vers 6 mois."],
  ["alim",9,36,"Lait de vache : pas trop","Le lait de vache entier (3,25 %) peut commencer entre 9 et 12 mois. Ensuite, environ 500 ml (2 tasses) par jour suffisent : davantage coupe l'appétit et peut causer un manque de fer."],
  ["alim",6,999,"L'eau, la boisson de choix","Offrez de l'eau pour la soif. Le jus n'est pas nécessaire ; s'il y en a, 125 ml (½ tasse) par jour au plus. Évitez les boissons sucrées et énergisantes."],
  ["alim",12,999,"L'assiette du Guide alimentaire","La moitié de l'assiette en légumes et fruits, un quart en aliments protéinés (dont des protéines végétales), un quart en grains entiers."],
  ["alim",12,96,"Un nouvel aliment : 10 à 15 essais","Il faut souvent goûter un aliment 10 à 15 fois avant de l'aimer. Présentez-le en petite quantité, à côté d'un aliment connu, sans pression."],
  ["alim",18,84,"Difficile à table ? C'est fréquent","Entre 2 et 6 ans, se méfier des aliments nouveaux est normal. Gardez des repas réguliers, laissez l'enfant se servir et cuisiner avec vous."],
  ["alim",12,999,"Des collations planifiées","2 ou 3 collations par jour, environ 2 h avant les repas, avec au moins 2 groupes d'aliments (fruit et yogourt, par exemple). Évitez le grignotage continu."],
  ["alim",6,48,"Aliments à risque d'étouffement","Avant 4 ans : raisins et tomates cerises coupés en quatre, saucisses en long ; pas de noix entières, maïs soufflé ni bonbons durs. Enfant assis et surveillé."],
  ["alim",12,999,"Manger ensemble, sans écran","Les repas en famille, sans télé ni téléphone, aident l'enfant à écouter sa faim, à goûter plus d'aliments et à parler de sa journée."],
  ["alim",24,999,"Du poisson deux fois par semaine","Saumon, truite, sardines, hareng : riches en oméga-3 et faibles en mercure. Limitez thon blanc, espadon et requin chez les jeunes enfants."],
  ["alim",12,999,"Moins de sucre, sans interdits","Limitez sucres ajoutés et aliments ultratransformés sans en faire des récompenses ni des interdits : offerts à l'occasion, ils perdent de leur attrait."],
  ["alim",108,999,"Calcium à la préadolescence","De 9 à 18 ans, les besoins en calcium sont les plus élevés : lait, yogourt, fromage, boisson de soya enrichie, tofu au calcium, chaque jour."],
  ["alim",60,999,"Une boîte à lunch équilibrée","Un légume ou fruit, un aliment protéiné, un grain entier et de l'eau. Laisser l'enfant choisir entre deux options l'aide à tout manger."],
  ["alim",0,12,"Le lait reste la base","Jusqu'à 12 mois, le lait maternel ou la préparation pour nourrissons reste la principale source d'énergie ; les aliments s'ajoutent sans le remplacer."],
];
const ALL_TIPS = TIPS.concat(NUT_TIPS);

/* liste plus complète pour le menu déroulant des aliments */
const FOOD_MORE = {
  legfruits:["Carottes","Pomme","Poire","Orange","Fraises","Bleuets","Raisins coupés en 4","Mangue","Avocat","Petits pois","Haricots verts","Maïs","Épinards","Poivron","Chou-fleur","Compote de pommes","Salade","Melon"],
  proteines:["Bœuf haché","Porc","Dinde","Thon","Crevettes","Haricots noirs","Hoummos","Edamames","Œuf cuit dur","Jambon","Fromage cottage","Noix moulues"],
  grains:["Céréales enrichies en fer","Bagel","Pain pita","Tortilla","Couscous","Craquelins de blé entier","Muffin maison","Crêpes","Riz blanc","Pâtes","Pain blanc"],
  laitiers:["Lait 2 %","Fromage cheddar","Fromage en ficelle","Kéfir","Boisson d'avoine enrichie","Lait maternel","Préparation pour nourrissons"],
  autres:["Biscuits","Gâteau","Crème glacée","Croustilles","Jus","Bonbons","Chocolat","Pizza","Frites","Céréales sucrées","Boisson gazeuse"],
};
const foodOptions = g => [...new Set([...(FOOD_SUGG[g]||[]), ...(FOOD_MORE[g]||[])])];
