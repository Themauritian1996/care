/* =========================================================================
   TRIBE — saisie avec suggestions (remplace les listes natives, mal affichées
   sur Android) et adresses avec suggestions (OpenStreetMap / Photon),
   avec un bouton pour ouvrir l'adresse dans Google Maps.
   ========================================================================= */
/* acInput(id, valeur, {list:[…]} ou {addr:true}, attributs supplémentaires) */
function acInput(id, value = "", o = {}, attrs = ""){
  const opts = o.list ? ` data-ac-opts="${esc([...new Set(o.list.filter(Boolean))].join("|"))}"` : "";
  return `<div class="ac-wrap"><input class="inp" id="${id}" value="${esc(value||"")}" autocomplete="off" data-ac="${o.addr ? "addr" : "list"}"${opts} ${o.placeholder?`placeholder="${esc(o.placeholder)}"`:""} ${attrs}>${o.addr ? `<button type="button" class="ac-map" data-act="openMap" data-v="${id}" aria-label="${T("Ouvrir dans Google Maps")}">${icon("pin")}</button>` : ""}<div class="ac-pop" hidden></div></div>`;
}
const addrInput = (id, value, ph) => acInput(id, value, {addr:true, placeholder: ph || T("Adresse, lieu, ville ou code postal")});
let acTimer, acSeq = 0;
function acShow(inp, items){
  const pop = inp.parentElement.querySelector(".ac-pop"); if (!pop) return;
  if (!items.length){ pop.hidden = true; pop.innerHTML = ""; return; }
  pop.innerHTML = items.map(x => `<button type="button" class="ac-opt" data-val="${esc(x.v)}">${x.ic?icon(x.ic):""}<span><b>${esc(x.l)}</b>${x.s?`<small>${esc(x.s)}</small>`:""}</span></button>`).join(""); pop.hidden = false;
}
async function acUpdate(inp){
  const q = inp.value.trim();
  if (inp.dataset.ac === "list"){
    const all = (inp.dataset.acOpts || "").split("|").filter(Boolean), nq = norm(q);
    acShow(inp, all.filter(x => !nq || norm(x).includes(nq)).filter(x => norm(x) !== nq).slice(0, 8).map(v => ({v, l:v})));
    return;
  }
  if (q.length < 3){ acShow(inp, []); return; }
  const seq = ++acSeq;
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=${LANG==="en"?"en":"fr"}&lat=45.52&lon=-73.6`);
    const d = await r.json(); if (seq !== acSeq) return;
    acShow(inp, (d.features||[]).map(f => { const p = f.properties || {};
      const street = [p.housenumber, p.street].filter(Boolean).join(" "), title = p.name && p.name !== p.street ? p.name : street || p.city || p.name;
      const sub = [p.name && p.name !== p.street ? street : "", p.city || p.county, p.postcode, p.state].filter(Boolean).join(", ");
      return {v:[title, sub].filter(Boolean).join(", "), l:title || "", s:sub, ic:"pin"}; }).filter(x => x.l));
  } catch(e){ acShow(inp, []); }
}
document.addEventListener("input", e => { const t = e.target; if (!t.dataset?.ac) return; if (t._acSkip){ t._acSkip = false; return; } clearTimeout(acTimer); acTimer = setTimeout(() => acUpdate(t), t.dataset.ac === "addr" ? 350 : 60); });
document.addEventListener("focusin", e => { const t = e.target; if (t.dataset?.ac === "list") acUpdate(t); });
document.addEventListener("focusout", e => { const t = e.target; if (t.dataset?.ac) setTimeout(() => { const p = t.parentElement?.querySelector(".ac-pop"); if (p && !p.contains(document.activeElement)) p.hidden = true; }, 180); });
document.addEventListener("pointerdown", e => {
  const o = e.target.closest(".ac-opt"); if (!o) return; e.preventDefault();
  const inp = o.closest(".ac-wrap").querySelector("input"); inp.value = o.dataset.val; inp._acSkip = true; inp.dispatchEvent(new Event("input", {bubbles:true})); inp.dispatchEvent(new Event("change", {bubbles:true}));
  setTimeout(() => { const p = o.closest(".ac-pop"); if (p){ p.hidden = true; p.innerHTML = ""; } }, 0);
});
Object.assign(ACT, { openMap: v => { const q = $("#"+v)?.value?.trim(); if (!q) return toast(T("Écrivez d'abord une adresse")); window.open(mapsUrl(q), "_blank", "noopener"); } });
