/* =========================================================================
   TRIBU — icônes, avatars, logo, décors selon l'âge (SVG maison)
   ========================================================================= */
const I = {
  image:'<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="9.5" r="1.8"/><path d="m20.5 15.5-4.5-4.5-9 8.5"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  home:'<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>',
  kid:'<circle cx="12" cy="8" r="3.5"/><path d="M6 20c.5-4 3-6 6-6s5.5 2 6 6"/><path d="M10.5 4.8c.4-1.4 2.6-1.4 3 0"/>',
  sunrise:'<path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 6v3M5.6 10.6l1.5 1.5M18.4 10.6l-1.5 1.5"/>',
  chart:'<path d="M4 19c4-1 6-5 9-9s5-5 7-5"/><path d="M4 19h16M4 5v14"/>',
  heart:'<path d="M12 19s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 2.5C19 14.6 12 19 12 19z"/>',
  cal:'<rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
  people:'<circle cx="9" cy="8.5" r="3"/><circle cx="17" cy="9.5" r="2.3"/><path d="M3.5 19c.5-3.4 2.7-5 5.5-5s5 1.6 5.5 5M15 14.2c2.6-.3 4.8 1.2 5.3 4.3"/>',
  camera:'<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>',
  more:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
  bottle:'<path d="M9.5 3h5M10 3v3l-2 2.5V19a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8.5L14 6V3"/><path d="M8 12h8M8 15.5h8"/>',
  moon:'<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  drop:'<path d="M12 4s-6 6.5-6 10.5a6 6 0 0 0 12 0C18 10.5 12 4 12 4z"/>',
  thermo:'<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  pill:'<rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="m9.5 8.5 5 7"/>',
  spoon:'<ellipse cx="12" cy="7" rx="3.5" ry="4"/><path d="M12 11v10"/>',
  smile:'<circle cx="12" cy="12" r="8"/><path d="M9 14c1.6 1.6 4.4 1.6 6 0M9.5 10h0M14.5 10h0"/>',
  screen:'<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>',
  run:'<circle cx="14" cy="5" r="2"/><path d="m6 20 3-5 3 2 2-5 3 3h2M9 15l1-5 4-1"/>',
  book:'<path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/>',
  tummy:'<circle cx="7" cy="12" r="3"/><path d="M10 14h9a2 2 0 0 0 0-4h-6"/><path d="M4 18h16"/>',
  ball:'<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3c3 3 3 8.4 0 11.4M17.7 6.3c-3 3-3 8.4 0 11.4"/>',
  note:'<path d="M5 19 6 15 15.5 5.5a2 2 0 0 1 3 3L9 18z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  syringe:'<path d="m18 6-2-2M15 5l4 4M17 7l-8.5 8.5-3 .5.5-3L14.5 4.5M9.5 10.5l2 2M7.5 12.5l2 2M4 20l2.5-2.5"/>',
  star:'<path d="m12 4 2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 15.8l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7z"/>',
  tooth:'<path d="M7 4c-2 0-3 1.8-3 4 0 3 1.5 4 2 7 .4 2.5 1 5 2.3 5 1.4 0 1.4-4.5 3.7-4.5s2.3 4.5 3.7 4.5c1.3 0 1.9-2.5 2.3-5 .5-3 2-4 2-7 0-2.2-1-4-3-4-1.8 0-3 1-5 1S8.8 4 7 4z"/>',
  phone:'<path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5L16 13l4 1.5v3A2 2 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6 2 2 0 0 1 6.5 4z"/>',
  doc:'<path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14 3.5V8h4M9 13h6M9 16.5h6"/>',
  db:'<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h0"/>',
  alert:'<path d="M12 4 21 19H3z"/><path d="M12 10v4M12 17h0"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  left:'<path d="m14.5 6-6 6 6 6"/>', right:'<path d="m9.5 6 6 6-6 6"/>',
  edit:'<path d="M5 19 6 15 15.5 5.5a2 2 0 0 1 3 3L9 18z"/>',
  trash:'<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  auto:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  sliders:'<path d="M5 7h9M18 7h1M5 17h3M12 17h7"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  bulb:'<path d="M9 17h6M10 20h4M12 4a5.5 5.5 0 0 0-3.2 10c.7.5 1.2 1.3 1.2 2v1h4v-1c0-.7.5-1.5 1.2-2A5.5 5.5 0 0 0 12 4z"/>',
  spark:'<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/><path d="M19 3v3M17.5 4.5h3"/>',
  chat:'<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V15h0A2 2 0 0 1 5 13z"/>',
  send:'<path d="M5 12 19 5l-4 14-3-6z"/><path d="m12 13 7-8"/>',
  gift:'<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M4 13h16M12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9zm0 0c2-4 6-4 6-1.5S14 9 12 9z"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7l-1-3h-5z"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock:'<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  share:'<circle cx="17" cy="6" r="2.5"/><circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="m9.2 10.8 5.6-3.4M9.2 13.2l5.6 3.4"/>',
  mail:'<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="m4.5 7.5 7.5 6 7.5-6"/>',
  drive:'<path d="M8.5 4h7l5 8.5-3.5 6h-10L3.5 12.5z"/><path d="M8.5 4l5.5 9.5M3.5 12.5h11M17 18.5l-3-5"/>',
  pause:'<rect x="7" y="5" width="3.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="3.5" height="14" rx="1.2"/>',
  play:'<path d="M8 5.5v13l10-6.5z"/>',
  zoomin:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4M11 8v6M8 11h6"/>',
  zoomout:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4M8 11h6"/>',
  expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  pin:'<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  key:'<circle cx="8" cy="14" r="3.5"/><path d="m10.5 11.5 8-8M16 6l2.5 2.5M13.5 8.5 16 11"/>',
  google:'<path d="M20 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h4.5a3.9 3.9 0 0 1-1.7 2.5v2.1h2.7c1.6-1.5 2.5-3.6 2.5-6.2z" fill="#4285F4" stroke="none"/><path d="M12 20.5c2.3 0 4.2-.8 5.5-2.1l-2.7-2.1c-.7.5-1.7.8-2.8.8-2.2 0-4-1.5-4.7-3.4H4.5v2.2A8.5 8.5 0 0 0 12 20.5z" fill="#34A853" stroke="none"/><path d="M7.3 13.7a5 5 0 0 1 0-3.4V8.1H4.5a8.5 8.5 0 0 0 0 7.8z" fill="#FBBC05" stroke="none"/><path d="M12 6.9c1.2 0 2.3.4 3.2 1.3l2.4-2.4A8.4 8.4 0 0 0 12 3.5a8.5 8.5 0 0 0-7.5 4.6l2.8 2.2C8 8.4 9.8 6.9 12 6.9z" fill="#EA4335" stroke="none"/>',
  bed:'<path d="M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-7v1"/><circle cx="7" cy="10.5" r="1.6"/>',
  broom:'<path d="M14 4 9.5 12M6 13.5h7l1.5 6.5H4.5z"/>', pencil:'<path d="M5 19 6 15 15.5 5.5a2 2 0 0 1 3 3L9 18z"/><path d="m13.5 7.5 3 3"/>',
  dish:'<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="4"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  baby:'<circle cx="12" cy="12" r="8"/><path d="M9.5 15c1.4 1 3.6 1 5 0M9.5 11h0M14.5 11h0M12 4c-1 1.5 0 3 1.5 3"/>',
  stork:'<circle cx="12" cy="11" r="6.5"/><path d="M8 18.5c2.5 1.5 5.5 1.5 8 0"/><path d="M10 10.5h0M14 10.5h0M10.5 13.5c.8.6 2.2.6 3 0"/>',
  logout:'<path d="M14 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H14M10 12h10M17 9l3 3-3 3"/>',
  tag:'<path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
};
const icon = (n, cls="") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${I[n]||I.star}</svg>`;

/* ---------- logo : trois têtes (parent, enfant, bébé) dans un nid ---------- */
/* logo : une tribu (trois silhouettes de tailles différentes, unies par un même arc) sur un dégradé corail → lilas */
const LOGO_FIG = `<g fill="#fff"><circle cx="20.5" cy="18.5" r="6.3"/><path d="M9.5 49c0-9.6 4.9-18.4 11-18.4s11 8.8 11 18.4z"/></g>
    <g fill="#FFE6A6"><circle cx="43.5" cy="21" r="5.8"/><path d="M33 49c0-8.6 4.7-16.4 10.5-16.4S54 40.4 54 49z"/></g>
    <g fill="#fff" stroke="#EE7A97" stroke-width="2.2"><circle cx="32" cy="33.5" r="4.9"/><path d="M24.6 52.5c0-7.2 3.3-12.6 7.4-12.6s7.4 5.4 7.4 12.6z"/></g>
    <path d="M7.5 54c7.8 4.6 16 6.8 24.5 6.8S48.7 58.6 56.5 54" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`;
const LOGO_WORDS = {"tribe":{"d":"M30.2 0.9L30.2 0.9Q24.9 0.9 21 -0.3Q17.1 -1.5 14.6 -4Q12 -6.5 10.8 -10.3Q9.5 -14.1 9.5 -19.2L9.5 -19.2L9.5 -31.9L7 -31.9Q3.6 -32.1 2.3 -34.1Q1 -36.1 1 -40.7L1 -40.7Q1 -45 2.6 -47.2Q4.2 -49.3 7.4 -49.3L7.4 -49.3L9.5 -49.3L9.5 -58Q9.5 -60.3 9.9 -62.3Q10.3 -64.2 12.2 -65.5Q14.1 -66.7 18.6 -66.7L18.6 -66.7Q23 -66.7 24.9 -65.4Q26.8 -64 27.2 -61.9Q27.6 -59.8 27.6 -57.6L27.6 -57.6L27.6 -49.6L32.9 -49.8Q35.1 -49.8 37.1 -49.4Q39.2 -49 40.6 -47.1Q41.9 -45.2 41.9 -40.6L41.9 -40.6Q41.9 -36.4 40.6 -34.5Q39.2 -32.6 37.1 -32.1Q35.1 -31.6 32.8 -31.6L32.8 -31.6L27.6 -31.7L27.6 -20.1Q27.6 -19 27.8 -18.3Q27.9 -17.5 28.2 -17.1Q28.5 -16.7 29 -16.5Q29.5 -16.3 30.3 -16.3L30.3 -16.3Q32.9 -16.3 35 -15.9Q37 -15.5 38.1 -13.8Q39.3 -12.1 39.3 -8.1L39.3 -8.1Q39.3 -3.6 37.9 -1.7Q36.5 0.2 34.4 0.6Q32.3 0.9 30.2 0.9M52.9 0.9L52.9 0.9Q48.4 0.9 46.5 -0.5Q44.6 -1.8 44.3 -4Q43.9 -6.1 43.9 -8.3L43.9 -8.3L43.9 -40.9Q43.9 -43.2 44.3 -45.3Q44.7 -47.3 46.6 -48.6Q48.5 -49.9 53 -49.9L53 -49.9Q57.4 -49.9 59.3 -48.7Q61.1 -47.5 61.5 -46.1L61.5 -46.1Q61.5 -45.9 61.6 -45.8L61.6 -45.8Q62.3 -46.5 63.5 -47.4L63.5 -47.4Q65 -48.6 67.2 -49.5Q69.3 -50.4 72 -50.4L72 -50.4Q72.9 -50.4 74.3 -50.3Q75.6 -50.1 77.2 -49.7Q78.7 -49.3 80.1 -48.5Q81.4 -47.7 82.3 -46.4Q83.1 -45.1 83.1 -43.2L83.1 -43.2Q83.1 -38.2 81 -34.7Q78.8 -31.2 75.3 -31.2L75.3 -31.2Q73.4 -31.2 72.6 -31.5Q71.8 -31.7 71.5 -32Q71.1 -32.2 70.7 -32.5Q70.2 -32.7 69 -32.7L69 -32.7Q67.5 -32.7 66.3 -32.4Q65 -32 64.1 -31.3Q63.1 -30.6 62.6 -29.7Q62.1 -28.7 62.1 -27.6L62.1 -27.6L62.1 -8.1Q62.1 -5.9 61.7 -3.8Q61.3 -1.7 59.4 -0.4Q57.5 0.9 52.9 0.9M94.6 0.9L94.6 0.9Q90.1 0.9 88.2 -0.5Q86.3 -1.8 86 -3.9Q85.6 -6 85.6 -8.2L85.6 -8.2L85.6 -40.8Q85.6 -43 86 -45.1Q86.4 -47.1 88.3 -48.5Q90.2 -49.8 94.7 -49.8L94.7 -49.8Q99.2 -49.8 101.1 -48.5Q102.9 -47.1 103.3 -45Q103.7 -42.9 103.7 -40.6L103.7 -40.6L103.7 -8.1Q103.7 -5.9 103.3 -3.8Q102.9 -1.7 101.1 -0.4Q99.2 0.9 94.6 0.9M94.6 -54.7L94.6 -54.7Q90.1 -54.7 88.2 -56.1Q86.3 -57.4 86 -59.5Q85.6 -61.6 85.6 -63.8L85.6 -63.8Q85.6 -66.1 86 -68.2Q86.4 -70.2 88.3 -71.5Q90.2 -72.8 94.7 -72.8L94.7 -72.8Q99.2 -72.8 101.1 -71.5Q102.9 -70.1 103.3 -68Q103.7 -65.9 103.7 -63.7L103.7 -63.7Q103.7 -61.5 103.3 -59.4Q102.9 -57.3 101.1 -56Q99.2 -54.7 94.6 -54.7M136 0.7L136 0.7Q131.1 0.7 127.5 -1.5L127.5 -1.5Q126.4 -2.1 125.4 -2.9L125.4 -2.9Q124.7 -1.3 123.3 -0.4L123.3 -0.4Q121.3 0.8 117.2 0.8L117.2 0.8Q112.7 0.8 110.8 -0.6Q108.9 -1.9 108.6 -4Q108.2 -6.1 108.2 -8.3L108.2 -8.3L108.2 -63.8Q108.2 -66.1 108.6 -68.2Q109 -70.2 110.9 -71.5Q112.8 -72.8 117.3 -72.8Q121.8 -72.8 123.6 -71.5Q125.4 -70.1 125.7 -68Q126 -65.9 125.9 -63.7L125.9 -63.7L125.9 -46.5Q126.8 -47.2 127.7 -47.8L127.7 -47.8Q131.2 -49.8 136 -49.8L136 -49.8Q140.4 -49.8 144.6 -47.7Q148.7 -45.6 152 -42.1Q155.3 -38.5 157.2 -34Q159.1 -29.5 159.1 -24.7L159.1 -24.7Q159.1 -19.7 157.2 -15.1Q155.3 -10.5 152.1 -7Q148.8 -3.4 144.7 -1.4Q140.5 0.7 136 0.7M133.6 -17.3L133.6 -17.3Q135.6 -17.3 137.3 -18.3Q138.9 -19.3 139.9 -21Q140.9 -22.6 140.9 -24.5L140.9 -24.5Q140.9 -26.5 140 -28.2Q139 -29.8 137.4 -30.8Q135.7 -31.7 133.7 -31.7Q131.7 -31.7 130.1 -30.7Q128.4 -29.7 127.5 -28.1Q126.5 -26.5 126.5 -24.5L126.5 -24.5Q126.5 -22.6 127.5 -21Q128.5 -19.3 130.1 -18.3Q131.7 -17.3 133.6 -17.3M187.4 2L187.4 2Q179.9 2 174.7 -0.5Q169.5 -2.9 166.3 -6.9Q163.1 -10.8 161.6 -15.4Q160.1 -20 160.1 -24.3L160.1 -24.3Q160.1 -32.2 163.6 -38.2Q167.1 -44.2 173.3 -47.6Q179.5 -51 187.5 -51L187.5 -51Q193.7 -51 198.1 -49Q202.5 -47 205.3 -43.9Q208 -40.8 209.3 -37.3Q210.6 -33.8 210.6 -30.8L210.6 -30.8Q210.6 -25.1 207.8 -22.1Q205 -19.1 200.6 -19.1L200.6 -19.1L179.3 -19.1Q179.7 -17.5 181 -16.4Q182.2 -15.2 184.1 -14.6Q186 -13.9 188.2 -13.9L188.2 -13.9Q190.4 -13.9 192.1 -14.2Q193.8 -14.4 195.1 -14.8Q196.3 -15.2 197.4 -15.6Q198.4 -16 199.3 -16.3Q200.1 -16.5 200.9 -16.5L200.9 -16.5Q202.7 -16.5 204.2 -15.3Q205.7 -14.1 206.9 -11.7L206.9 -11.7Q207.6 -10.4 207.9 -9.3Q208.2 -8.1 208.2 -7.1L208.2 -7.1Q208.2 -4.1 205.8 -2.1Q203.3 -0.1 198.7 1Q194.1 2 187.4 2M179.3 -28.5L179.3 -28.5L190.5 -28.5Q191.9 -28.5 192.6 -29.1Q193.2 -29.7 193.2 -30.9L193.2 -30.9Q193.2 -32.2 192.5 -33.1Q191.7 -34 190.4 -34.5Q189.1 -34.9 187.3 -34.9L187.3 -34.9Q184.9 -34.9 183.1 -34Q181.3 -33 180.4 -31.6Q179.4 -30.1 179.3 -28.5","bb":{"x1":1,"y1":-72.8,"x2":210.60000000000002,"y2":2}},"tribu":{"d":"M30.2 0.9L30.2 0.9Q24.9 0.9 21 -0.3Q17.1 -1.5 14.6 -4Q12 -6.5 10.8 -10.3Q9.5 -14.1 9.5 -19.2L9.5 -19.2L9.5 -31.9L7 -31.9Q3.6 -32.1 2.3 -34.1Q1 -36.1 1 -40.7L1 -40.7Q1 -45 2.6 -47.2Q4.2 -49.3 7.4 -49.3L7.4 -49.3L9.5 -49.3L9.5 -58Q9.5 -60.3 9.9 -62.3Q10.3 -64.2 12.2 -65.5Q14.1 -66.7 18.6 -66.7L18.6 -66.7Q23 -66.7 24.9 -65.4Q26.8 -64 27.2 -61.9Q27.6 -59.8 27.6 -57.6L27.6 -57.6L27.6 -49.6L32.9 -49.8Q35.1 -49.8 37.1 -49.4Q39.2 -49 40.6 -47.1Q41.9 -45.2 41.9 -40.6L41.9 -40.6Q41.9 -36.4 40.6 -34.5Q39.2 -32.6 37.1 -32.1Q35.1 -31.6 32.8 -31.6L32.8 -31.6L27.6 -31.7L27.6 -20.1Q27.6 -19 27.8 -18.3Q27.9 -17.5 28.2 -17.1Q28.5 -16.7 29 -16.5Q29.5 -16.3 30.3 -16.3L30.3 -16.3Q32.9 -16.3 35 -15.9Q37 -15.5 38.1 -13.8Q39.3 -12.1 39.3 -8.1L39.3 -8.1Q39.3 -3.6 37.9 -1.7Q36.5 0.2 34.4 0.6Q32.3 0.9 30.2 0.9M52.9 0.9L52.9 0.9Q48.4 0.9 46.5 -0.5Q44.6 -1.8 44.3 -4Q43.9 -6.1 43.9 -8.3L43.9 -8.3L43.9 -40.9Q43.9 -43.2 44.3 -45.3Q44.7 -47.3 46.6 -48.6Q48.5 -49.9 53 -49.9L53 -49.9Q57.4 -49.9 59.3 -48.7Q61.1 -47.5 61.5 -46.1L61.5 -46.1Q61.5 -45.9 61.6 -45.8L61.6 -45.8Q62.3 -46.5 63.5 -47.4L63.5 -47.4Q65 -48.6 67.2 -49.5Q69.3 -50.4 72 -50.4L72 -50.4Q72.9 -50.4 74.3 -50.3Q75.6 -50.1 77.2 -49.7Q78.7 -49.3 80.1 -48.5Q81.4 -47.7 82.3 -46.4Q83.1 -45.1 83.1 -43.2L83.1 -43.2Q83.1 -38.2 81 -34.7Q78.8 -31.2 75.3 -31.2L75.3 -31.2Q73.4 -31.2 72.6 -31.5Q71.8 -31.7 71.5 -32Q71.1 -32.2 70.7 -32.5Q70.2 -32.7 69 -32.7L69 -32.7Q67.5 -32.7 66.3 -32.4Q65 -32 64.1 -31.3Q63.1 -30.6 62.6 -29.7Q62.1 -28.7 62.1 -27.6L62.1 -27.6L62.1 -8.1Q62.1 -5.9 61.7 -3.8Q61.3 -1.7 59.4 -0.4Q57.5 0.9 52.9 0.9M94.6 0.9L94.6 0.9Q90.1 0.9 88.2 -0.5Q86.3 -1.8 86 -3.9Q85.6 -6 85.6 -8.2L85.6 -8.2L85.6 -40.8Q85.6 -43 86 -45.1Q86.4 -47.1 88.3 -48.5Q90.2 -49.8 94.7 -49.8L94.7 -49.8Q99.2 -49.8 101.1 -48.5Q102.9 -47.1 103.3 -45Q103.7 -42.9 103.7 -40.6L103.7 -40.6L103.7 -8.1Q103.7 -5.9 103.3 -3.8Q102.9 -1.7 101.1 -0.4Q99.2 0.9 94.6 0.9M94.6 -54.7L94.6 -54.7Q90.1 -54.7 88.2 -56.1Q86.3 -57.4 86 -59.5Q85.6 -61.6 85.6 -63.8L85.6 -63.8Q85.6 -66.1 86 -68.2Q86.4 -70.2 88.3 -71.5Q90.2 -72.8 94.7 -72.8L94.7 -72.8Q99.2 -72.8 101.1 -71.5Q102.9 -70.1 103.3 -68Q103.7 -65.9 103.7 -63.7L103.7 -63.7Q103.7 -61.5 103.3 -59.4Q102.9 -57.3 101.1 -56Q99.2 -54.7 94.6 -54.7M136 0.7L136 0.7Q131.1 0.7 127.5 -1.5L127.5 -1.5Q126.4 -2.1 125.4 -2.9L125.4 -2.9Q124.7 -1.3 123.3 -0.4L123.3 -0.4Q121.3 0.8 117.2 0.8L117.2 0.8Q112.7 0.8 110.8 -0.6Q108.9 -1.9 108.6 -4Q108.2 -6.1 108.2 -8.3L108.2 -8.3L108.2 -63.8Q108.2 -66.1 108.6 -68.2Q109 -70.2 110.9 -71.5Q112.8 -72.8 117.3 -72.8Q121.8 -72.8 123.6 -71.5Q125.4 -70.1 125.7 -68Q126 -65.9 125.9 -63.7L125.9 -63.7L125.9 -46.5Q126.8 -47.2 127.7 -47.8L127.7 -47.8Q131.2 -49.8 136 -49.8L136 -49.8Q140.4 -49.8 144.6 -47.7Q148.7 -45.6 152 -42.1Q155.3 -38.5 157.2 -34Q159.1 -29.5 159.1 -24.7L159.1 -24.7Q159.1 -19.7 157.2 -15.1Q155.3 -10.5 152.1 -7Q148.8 -3.4 144.7 -1.4Q140.5 0.7 136 0.7M133.6 -17.3L133.6 -17.3Q135.6 -17.3 137.3 -18.3Q138.9 -19.3 139.9 -21Q140.9 -22.6 140.9 -24.5L140.9 -24.5Q140.9 -26.5 140 -28.2Q139 -29.8 137.4 -30.8Q135.7 -31.7 133.7 -31.7Q131.7 -31.7 130.1 -30.7Q128.4 -29.7 127.5 -28.1Q126.5 -26.5 126.5 -24.5L126.5 -24.5Q126.5 -22.6 127.5 -21Q128.5 -19.3 130.1 -18.3Q131.7 -17.3 133.6 -17.3M184.3 0.7L184.3 0.7Q179.5 0.7 175.4 -1.2Q171.2 -3.1 168.1 -6.6Q165 -10 163.3 -14.6Q161.6 -19.2 161.6 -24.6L161.6 -24.6L161.6 -40.9Q161.6 -43.2 162 -45.3Q162.4 -47.3 164.3 -48.7Q166.2 -50 170.7 -50L170.7 -50Q175.3 -50 177.2 -48.7Q179 -47.3 179.4 -45.2Q179.8 -43.1 179.8 -40.8L179.8 -40.8L179.8 -24.6Q179.8 -22.3 180.7 -20.7Q181.5 -19.1 183.2 -18.3Q184.8 -17.4 187 -17.4Q189.2 -17.4 190.8 -18.3Q192.4 -19.2 193.3 -20.8Q194.2 -22.4 194.2 -24.6L194.2 -24.6L194.2 -41Q194.2 -43.3 194.6 -45.4Q195 -47.4 196.9 -48.7Q198.8 -50 203.3 -50L203.3 -50Q207.9 -50 209.8 -48.7Q211.6 -47.3 212 -45.2Q212.4 -43.1 212.4 -40.9L212.4 -40.9L212.4 -8Q212.4 -5.8 212 -3.8Q211.6 -1.8 209.7 -0.5Q207.8 0.8 203.3 0.8L203.3 0.8Q200 0.8 198.2 0.1Q196.3 -0.7 195.5 -1.9L195.5 -1.9Q194.8 -2.9 194.6 -3.9L194.6 -3.9Q193.9 -3.2 193 -2.5L193 -2.5Q191.4 -1.2 189.3 -0.3Q187.1 0.7 184.3 0.7","bb":{"x1":1,"y1":-72.8,"x2":212.40000000000003,"y2":0.9}}};
/* marque complète : silhouettes + nom écrit (police Fredoka vectorisée) */
const logoMark = (w = "tribe", tw = 42, ty = 57, fsz = .58, fy = 4) => { const W = LOGO_WORDS[w] || LOGO_WORDS.tribe, bb = W.bb, sc = tw/(bb.x2-bb.x1);
  return `<g transform="translate(${32-32*fsz} ${fy}) scale(${fsz})">${LOGO_FIG}</g><path d="${W.d}" fill="#fff" transform="translate(${(32 - (bb.x1+(bb.x2-bb.x1)/2)*sc).toFixed(2)} ${(ty - bb.y2*sc).toFixed(2)}) scale(${sc.toFixed(4)})"/>`; };
let logoN = 0;
function logo(s = 36, word = s >= 48){
  const id = "tlg" + (++logoN), w = /tribu/i.test(typeof appName === "function" ? appName() : "") ? "tribu" : "tribe";
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true" class="logo"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A6A"/><stop offset=".55" stop-color="#F0789C"/><stop offset="1" stop-color="#8676F0"/></linearGradient></defs>
    <rect width="64" height="64" rx="18" fill="url(#${id})"/>${word ? logoMark(w) : LOGO_FIG}</svg>`;
}
/* mot-symbole : nom de l'app en minuscules arrondies, point du i en cœur */
const wordmark = (name = appName()) => `<span class="wordmark" aria-label="${esc(name)}">${esc(name.toLowerCase()).replace("i", `<span class="wm-i">ı<svg class="wm-dot" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.2 0 3.6 1.2 5.4 3.2C13.8 6.2 15.2 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" fill="#FF7E79"/></svg></span>`)}</span>`;
/* ---------- avatars : 10 animaux + 10 symboles ---------- */
const EYES = (y=32, dx=8, r=2.6) => `<circle cx="${32-dx}" cy="${y}" r="${r}" fill="#2A2340"/><circle cx="${32+dx}" cy="${y}" r="${r}" fill="#2A2340"/><circle cx="${32-dx+.9}" cy="${y-.9}" r=".8" fill="#fff"/><circle cx="${32+dx+.9}" cy="${y-.9}" r=".8" fill="#fff"/>`;
const CHEEKS = (y=39) => `<circle cx="19" cy="${y}" r="3.2" fill="var(--rose)" opacity=".5"/><circle cx="45" cy="${y}" r="3.2" fill="var(--rose)" opacity=".5"/>`;
const SMILE = (y=41) => `<path d="M28 ${y}c2.4 2 5.6 2 8 0" stroke="#2A2340" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
function avatarArt(id, col){
  const C = `var(--${col})`, B = `var(--${col}-bg)`, K = `var(--${col}-ink)`;
  switch(id){
    case "poussin": return `<circle cx="32" cy="35" r="23" fill="${C}"/><path d="M30 12c-3-4 2-8 6-5" stroke="${K}" stroke-width="2.5" fill="none" stroke-linecap="round"/>${EYES(32)}<path d="M28 38l4 4 4-4z" fill="var(--peach)"/>${CHEEKS(40)}`;
    case "ourson": return `<circle cx="14" cy="16" r="8" fill="${C}"/><circle cx="50" cy="16" r="8" fill="${C}"/><circle cx="14" cy="16" r="4" fill="${B}"/><circle cx="50" cy="16" r="4" fill="${B}"/><circle cx="32" cy="35" r="23" fill="${C}"/><ellipse cx="32" cy="42" rx="11" ry="8" fill="${B}"/>${EYES(31)}<ellipse cx="32" cy="39" rx="3" ry="2.2" fill="#2A2340"/>${SMILE(43)}`;
    case "lapin": return `<ellipse cx="22" cy="14" rx="5.5" ry="13" fill="${C}"/><ellipse cx="42" cy="14" rx="5.5" ry="13" fill="${C}"/><ellipse cx="22" cy="15" rx="2.6" ry="9" fill="var(--rose)" opacity=".5"/><ellipse cx="42" cy="15" rx="2.6" ry="9" fill="var(--rose)" opacity=".5"/><circle cx="32" cy="38" r="21" fill="${C}"/>${EYES(35)}<path d="M30 40h4l-2 2.2z" fill="var(--rose)"/><path d="M32 42.2v2M29 45c1.5 1 4.5 1 6 0" stroke="#2A2340" stroke-width="1.8" fill="none" stroke-linecap="round"/>${CHEEKS(42)}`;
    case "chat": return `<path d="M12 28 15 8l12 10zM52 28 49 8 37 18z" fill="${C}"/><path d="M15.5 14l1.5 8 5-4zM48.5 14 47 22l-5-4z" fill="var(--rose)" opacity=".5"/><circle cx="32" cy="36" r="22" fill="${C}"/>${EYES(33)}<path d="M30 39h4l-2 2z" fill="var(--rose)"/><path d="M32 41v1.5M28.5 43c1.5 1.2 2.5 1.2 3.5 0 1 1.2 2 1.2 3.5 0M10 38h9M10 43l9-2M54 38h-9M54 43l-9-2" stroke="#2A2340" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    case "renard": return `<path d="M10 30 13 7l14 13zM54 30 51 7 37 20z" fill="${C}"/><path d="M14.5 13l1.5 8 5-4zM49.5 13 48 21l-5-4z" fill="#2A2340" opacity=".55"/><path d="M10 30c0-12 10-18 22-18s22 6 22 18c0 14-10 24-22 24S10 44 10 30z" fill="${C}"/><path d="M10 32c6 0 14 4 22 18 8-14 16-18 22-18-2 13-11 22-22 22S12 45 10 32z" fill="#FFFFFF" opacity=".92"/>${EYES(31)}<circle cx="32" cy="47" r="2.8" fill="#2A2340"/>`;
    case "panda": return `<circle cx="14" cy="15" r="8" fill="#2A2340"/><circle cx="50" cy="15" r="8" fill="#2A2340"/><circle cx="32" cy="35" r="23" fill="#FFFFFF" stroke="${C}" stroke-width="3"/><ellipse cx="23" cy="32" rx="5.5" ry="7" fill="#2A2340" transform="rotate(-20 23 32)"/><ellipse cx="41" cy="32" rx="5.5" ry="7" fill="#2A2340" transform="rotate(20 41 32)"/><circle cx="23.5" cy="31" r="1.8" fill="#fff"/><circle cx="40.5" cy="31" r="1.8" fill="#fff"/><ellipse cx="32" cy="40" rx="3" ry="2.2" fill="#2A2340"/>${SMILE(43)}<circle cx="16" cy="42" r="3" fill="${C}" opacity=".6"/><circle cx="48" cy="42" r="3" fill="${C}" opacity=".6"/>`;
    case "grenouille": return `<circle cx="20" cy="18" r="9" fill="${C}"/><circle cx="44" cy="18" r="9" fill="${C}"/><circle cx="20" cy="18" r="5" fill="#fff"/><circle cx="44" cy="18" r="5" fill="#fff"/><circle cx="20.5" cy="18.5" r="2.8" fill="#2A2340"/><circle cx="43.5" cy="18.5" r="2.8" fill="#2A2340"/><ellipse cx="32" cy="38" rx="24" ry="19" fill="${C}"/><path d="M20 40c6 6 18 6 24 0" stroke="#2A2340" stroke-width="2.4" fill="none" stroke-linecap="round"/>${CHEEKS(36)}`;
    case "pingouin": return `<ellipse cx="32" cy="36" rx="22" ry="22" fill="#2F3550"/><ellipse cx="32" cy="40" rx="15" ry="15" fill="#FFFFFF"/><ellipse cx="32" cy="27" rx="13" ry="9" fill="#FFFFFF"/>${EYES(28,6.5,2.4)}<path d="M28.5 33h7L32 37.5z" fill="var(--butter)"/><circle cx="21" cy="35" r="3" fill="${C}" opacity=".7"/><circle cx="43" cy="35" r="3" fill="${C}" opacity=".7"/><path d="M20 12c6-5 18-5 24 0" stroke="${C}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case "hibou": return `<path d="M12 16l8 8M52 16l-8 8" stroke="${K}" stroke-width="4" stroke-linecap="round"/><ellipse cx="32" cy="36" rx="21" ry="22" fill="${C}"/><circle cx="23" cy="31" r="8" fill="#fff"/><circle cx="41" cy="31" r="8" fill="#fff"/><circle cx="23" cy="31" r="3.6" fill="#2A2340"/><circle cx="41" cy="31" r="3.6" fill="#2A2340"/><path d="M29 38h6l-3 4.5z" fill="var(--butter)"/><path d="M22 47c3 2 5 2 7 0M35 47c2 2 4 2 7 0" stroke="${K}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case "baleine": return `<path d="M6 36c0-12 12-20 26-20s24 8 24 18c0 10-10 18-26 18-6 0-10-2-13-4l-7 4 2-8c-4-2-6-5-6-8z" fill="${C}"/><path d="M14 40c6 6 24 8 36 0" fill="${B}"/>${EYES(32,6,2.4).replace(/cx="(\d+(\.\d+)?)"/g,(m,v)=>`cx="${(+v+6).toFixed(1)}"`)}<path d="M33 9c0-4 4-4 4 0M29 7c1-4 4-3 4 1M41 7c-1-4-4-3-4 1" stroke="var(--sky)" stroke-width="2" fill="none" stroke-linecap="round"/>${CHEEKS(39).replace('cx="19"','cx="25"')}`;
    case "etoile": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="m32 9 6.8 14 15.4 2.1-11.2 10.7 2.7 15.2L32 43.8 18.3 51l2.7-15.2L9.8 25.1 25.2 23z" fill="${C}" stroke="${K}" stroke-width="1.5" stroke-linejoin="round"/>${EYES(31,5,2)}${SMILE(36).replace(/M28/,"M29.5").replace("c2.4 2 5.6 2 8 0","c1.5 1.4 3.5 1.4 5 0")}`;
    case "fusee": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M32 8c9 7 11 18 8 30H24c-3-12-1-23 8-30z" fill="${C}"/><circle cx="32" cy="24" r="5" fill="#fff" stroke="${K}" stroke-width="2"/><path d="M24 34l-7 8 8-1zM40 34l7 8-8-1z" fill="${K}"/><path d="M27 40c1 7 3 10 5 12 2-2 4-5 5-12z" fill="var(--butter)"/>`;
    case "ballon": return `<circle cx="32" cy="32" r="28" fill="${B}"/><circle cx="32" cy="32" r="18" fill="#fff" stroke="${K}" stroke-width="2"/><path d="M32 23l7 5-2.7 8h-8.6L25 28z" fill="${C}"/><path d="M32 14v9M39 28l8-4M36.3 36l5 7M27.7 36l-5 7M25 28l-8-4" stroke="${K}" stroke-width="1.8"/>`;
    case "note": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M26 44V18l18-4v24" fill="none" stroke="${K}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="22" cy="44" rx="6" ry="4.5" fill="${C}"/><ellipse cx="40" cy="38" rx="6" ry="4.5" fill="${C}"/>`;
    case "eclair": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M36 8 18 36h12l-4 20 20-30H34z" fill="${C}" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>`;
    case "couronne": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M14 42 12 20l11 9 9-15 9 15 11-9-2 22z" fill="${C}" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><rect x="14" y="42" width="36" height="6" rx="2" fill="${K}"/><circle cx="32" cy="34" r="3" fill="var(--rose)"/>`;
    case "manette": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M18 24h28c5 0 8 4 9 10l1 6c.5 4-3 6-6 4l-6-5H20l-6 5c-3 2-6.5 0-6-4l1-6c1-6 4-10 9-10z" fill="${C}"/><path d="M20 31v6M17 34h6" stroke="#2A2340" stroke-width="2.5" stroke-linecap="round"/><circle cx="42" cy="31" r="2" fill="#2A2340"/><circle cx="46" cy="35" r="2" fill="#2A2340"/>`;
    case "guitare": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M38 12l6-4 4 4-4 6z" fill="${K}"/><path d="M41 15 30 27" stroke="${K}" stroke-width="3"/><path d="M30 25c-3-3-9-2-11 2-2 3 0 5-2 8-3 4 0 12 7 12s9-4 10-7c1-3 3-4 5-6 3-4 0-9-4-9-2 0-3 1-5 0z" fill="${C}"/><circle cx="26" cy="36" r="3" fill="#2A2340"/>`;
    case "coeur": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M32 50S14 39 14 26a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24z" fill="${C}" stroke="${K}" stroke-width="1.5"/>${EYES(29,6,2)}${SMILE(34).replace("c2.4 2 5.6 2 8 0","c1.6 1.4 6.4 1.4 8 0")}`;
    case "feuille": return `<circle cx="32" cy="32" r="28" fill="${B}"/><path d="M14 46C14 24 28 12 50 12c0 22-12 36-34 36z" fill="${C}"/><path d="M16 46c8-8 16-18 30-30" stroke="${K}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  }
  return avatarArt("poussin", col);
}
/* Avatar d'un enfant ou d'un membre : photo, animal/symbole choisi, ou automatique selon l'âge */
function avatarOf(p, size = 32){
  if (p?.photo) return `<img class="avatar" src="${p.photo}" alt="" style="width:${size}px;height:${size}px">`;
  const col = p?.color || "peach";
  let id = p?.avatar?.id;
  if (!id || p?.avatar?.kind === "auto"){
    const st = p?.dob || p?.dueDate ? lookOf(p).id : "scol";
    id = st === "pre" ? "poussin" : st === "nour" ? "poussin" : st === "bamb" ? "ourson" : st === "pres" ? "lapin" : st === "scol" ? "etoile" : "eclair";
    if (p?.avatar?.kind === "auto" && p?.role === "parent") id = "coeur";
  }
  return `<svg class="avatar" style="width:${size}px;height:${size}px" viewBox="0 0 64 64" aria-hidden="true">${avatarArt(id, col)}</svg>`;
}

/* ---------- décor de fond selon le stade ---------- */
const star5 = (x,y,r,f) => { let p=""; for (let i=0;i<10;i++){ const a = Math.PI/5*i - Math.PI/2, rr = i%2 ? r*.45 : r; p += `${i?"L":"M"}${(x+Math.cos(a)*rr).toFixed(1)},${(y+Math.sin(a)*rr).toFixed(1)}`; } return `<path d="${p}Z" fill="${f}"/>`; };
const cloud = (x,y,s,f) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${f}"><circle cx="0" cy="10" r="22"/><circle cx="28" cy="0" r="30"/><circle cx="60" cy="12" r="22"/><rect x="-10" y="10" width="80" height="22" rx="11"/></g>`;
function decoSVG(st){
  const W = 1200, H = 900; let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`;
  if (st === "pre"){
    s += `<g opacity=".5">${[[120,140,60],[1050,180,90],[220,760,80],[980,720,60]].map(([x,y,r],i)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="var(--${["rose","lilac","peach","butter"][i]}-bg)"/>`).join("")}</g>`;
    [[300,90,10],[640,60,8],[1100,420,12],[60,420,9],[520,820,10]].forEach(([x,y,r],i)=> s += `<path d="M${x} ${y+r}c-${r} -${r*.8} -${r*1.6} -${r*1.4} -${r*.8} -${r*1.9}c${r*.5} -${r*.4} ${r*.8} 0 ${r*.8} ${r*.4}c0 -${r*.4} ${r*.3} -${r*.8} ${r*.8} -${r*.4}c${r*.8} ${r*.5} 0 ${r*1.1} -${r*.8} ${r*1.9}z" fill="var(--rose)" opacity=".45"/>`);
  } else if (st === "nour"){
    s += cloud(80,120,1.4,"var(--sky-bg)") + cloud(900,80,1.8,"var(--lilac-bg)") + cloud(1020,620,1.3,"var(--peach-bg)") + cloud(180,700,1.6,"var(--mint-bg)");
    [[300,90,12],[640,60,9],[1100,300,14],[60,420,10],[520,820,12],[860,420,8],[1150,820,10],[400,500,7]].forEach(([x,y,r],i)=> s += star5(x,y,r, i%2?"var(--butter)":"var(--lilac)"));
    s += `<path d="M1120 140a46 46 0 1 1-36-70 36 36 0 0 0 36 70z" fill="var(--butter)"/>`;
  } else if (st === "bamb"){
    const cols = ["var(--peach)","var(--butter)","var(--mint)","var(--sky)","var(--lilac)","var(--rose)"];
    [[90,140,40],[1080,110,56],[260,760,48],[980,720,40],[620,60,26],[40,520,30],[1160,460,34],[520,860,30]].forEach(([x,y,r],i)=>{ const f = cols[i%6];
      s += i%3===0 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" opacity=".35"/>` : i%3===1 ? `<rect x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}" rx="${r*.35}" fill="${f}" opacity=".35" transform="rotate(${i*13} ${x} ${y})"/>` : `<path d="M${x} ${y-r}L${x+r} ${y+r*.8}H${x-r}Z" fill="${f}" opacity=".35"/>`; });
  } else if (st === "pres"){
    s += `<g fill="none" stroke-width="22" stroke-linecap="round" opacity=".35"><path d="M-40 900a280 280 0 0 1 560 0" stroke="var(--rose)"/><path d="M0 900a240 240 0 0 1 480 0" stroke="var(--butter)"/><path d="M40 900a200 200 0 0 1 400 0" stroke="var(--mint)"/><path d="M80 900a160 160 0 0 1 320 0" stroke="var(--sky)"/></g><circle cx="1080" cy="130" r="60" fill="var(--butter)" opacity=".5"/>`;
    for (let i=0;i<10;i++){ const a = i*Math.PI/5; s += `<line x1="${1080+Math.cos(a)*80}" y1="${130+Math.sin(a)*80}" x2="${1080+Math.cos(a)*104}" y2="${130+Math.sin(a)*104}" stroke="var(--butter)" stroke-width="8" stroke-linecap="round" opacity=".5"/>`; }
  } else if (st === "scol"){
    s += `<defs><pattern id="nb" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 39.5H40" stroke="var(--sky)" stroke-width="1" opacity=".35"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#nb)"/><line x1="90" y1="0" x2="90" y2="${H}" stroke="var(--rose)" stroke-width="2" opacity=".35"/>`;
    [[1040,140,22],[1140,520,16],[260,820,18]].forEach(([x,y,r],i)=> s += star5(x,y,r, ["var(--butter)","var(--mint)","var(--lilac)"][i]));
  } else if (st === "ado"){
    s += `<defs><filter id="bl"><feGaussianBlur stdDeviation="70"/></filter></defs><g filter="url(#bl)" opacity=".5"><circle cx="1050" cy="120" r="230" fill="var(--lilac)"/><circle cx="120" cy="780" r="220" fill="var(--sky)"/><circle cx="700" cy="900" r="160" fill="var(--rose)"/></g>`;
  } else { // famille
    s += `<g opacity=".4"><circle cx="1080" cy="120" r="140" fill="var(--peach-bg)"/><circle cx="90" cy="780" r="170" fill="var(--mint-bg)"/><circle cx="640" cy="40" r="60" fill="var(--butter-bg)"/></g>`;
  }
  return s + `</svg>`;
}
function heroIllu(st){
  const v = `<svg class="hero-illu" viewBox="0 0 150 120" aria-hidden="true">`;
  if (st === "pre") return v + `<circle cx="75" cy="62" r="40" fill="var(--rose-bg)"/><circle cx="75" cy="62" r="28" fill="var(--rose)" opacity=".5"/><path d="M75 78s-14-8-14-18a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 10-14 18-14 18z" fill="var(--surface)"/>${star5(122,24,9,"var(--butter)")}${star5(26,30,7,"var(--lilac)")}</svg>`;
  if (st === "nour") return v + `<line x1="20" y1="10" x2="130" y2="10" stroke="var(--kid-ink)" stroke-width="3" stroke-linecap="round"/><line x1="40" y1="10" x2="40" y2="45" stroke="var(--kid-ink)" stroke-width="1.5"/><line x1="75" y1="10" x2="75" y2="65" stroke="var(--kid-ink)" stroke-width="1.5"/><line x1="110" y1="10" x2="110" y2="40" stroke="var(--kid-ink)" stroke-width="1.5"/>${star5(40,55,13,"var(--butter)")}<path d="M88 78a17 17 0 1 1-13-25 13 13 0 0 0 13 25z" fill="var(--lilac)"/>${cloud(97,46,.36,"var(--surface)")}</svg>`;
  if (st === "bamb") return v + `<rect x="20" y="70" width="40" height="40" rx="8" fill="var(--peach)"/><text x="40" y="99" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="24" fill="#2A1A10">A</text><rect x="64" y="70" width="40" height="40" rx="8" fill="var(--sky)"/><text x="84" y="99" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="24" fill="#10243A">B</text><rect x="42" y="26" width="40" height="40" rx="8" fill="var(--mint)" transform="rotate(-8 62 46)"/><text x="62" y="55" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="24" fill="#0E3B2A" transform="rotate(-8 62 46)">C</text><circle cx="124" cy="94" r="16" fill="var(--butter)"/></svg>`;
  if (st === "pres") return v + `<g fill="none" stroke-width="10" stroke-linecap="round"><path d="M20 110a55 55 0 0 1 110 0" stroke="var(--rose)"/><path d="M33 110a42 42 0 0 1 84 0" stroke="var(--butter)"/><path d="M46 110a29 29 0 0 1 58 0" stroke="var(--mint)"/></g>${cloud(10,92,.3,"var(--surface)")}${cloud(112,92,.3,"var(--surface)")}<circle cx="125" cy="22" r="12" fill="var(--butter)"/></svg>`;
  if (st === "scol") return v + `<rect x="38" y="28" width="74" height="84" rx="16" fill="var(--sky)"/><rect x="50" y="62" width="50" height="34" rx="8" fill="var(--sky-bg)"/><path d="M58 28v-8a17 17 0 0 1 34 0v8" stroke="var(--sky-ink)" stroke-width="5" fill="none"/><rect x="50" y="62" width="50" height="10" rx="4" fill="var(--butter)"/>${star5(124,30,10,"var(--butter)")}</svg>`;
  return v + `<path d="M30 70a45 45 0 0 1 90 0" fill="none" stroke="var(--kid-ink)" stroke-width="7" stroke-linecap="round"/><rect x="20" y="62" width="22" height="36" rx="10" fill="var(--kid)"/><rect x="108" y="62" width="22" height="36" rx="10" fill="var(--kid)"/><path d="M58 92l8-18 8 26 8-16 8 8" fill="none" stroke="var(--rose)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
