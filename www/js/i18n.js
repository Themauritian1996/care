/* =========================================================================
   TRIBE — langues. Le français est la langue source ; EN contient les traductions.
   T("texte français", {var}) → texte dans la langue choisie, avec {var} remplacé.
   ========================================================================= */
let LANG = "fr";
const EN = {}; // rempli par i18n-en.js
function T(s, vars){
  let out = (LANG === "en" && EN[s]) ? EN[s] : s;
  const P = typeof S !== "undefined" && S?.settings?.pts;
  if (P?.name && /\b(points|pts)\b/.test(out) && !/vérification|checkpoint/i.test(s)) out = out.replace(/\bpoints\b/g, P.name).replace(/\bpts\b/g, P.short || P.name);
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  return out;
}
const appName = () => (typeof S !== "undefined" && S && S.settings && S.settings.appName) || "Tribe";
const LOCALE = () => LANG === "en" ? "en-CA" : "fr-CA";
