(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  // ---- pure helpers ---------------------------------------------------------
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function num(v){return v==null||v===""?null:Number(v);}
  function initials(n){return String(n||"?").split(/\s+/).map(function(w){return w[0];}).slice(0,2).join("").toUpperCase();}
  function svgEl(tag,a){var n=document.createElementNS(SVGNS,tag);for(var k in a)n.setAttribute(k,a[k]);return n;}
  function hashStr(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0);}
  // Free-text columns arrive as NULL, "", "   ", with trailing spaces and doubled inner spaces.
  // Collapse to a single display form so "absent" is always "" — never a truthy blank.
  function clean(v){ return v==null ? "" : String(v).replace(/\s+/g," ").trim(); }
  // Org unit names get the same treatment, so "absent" never pools unrelated people into a
  // phantom unit and two spellings of the same real unit still match.
  function orgUnit(v){ return clean(v); }
  function unitKey(v){ return orgUnit(v).toLowerCase(); }
  // DB enums arrive in mixed conventions across clients — "MALE", "never_married", "Single".
  // Title-case only single-case strings, so genuinely mixed-case text ("PhD", "McKenzie") and
  // already-presentable values are left exactly as stored.
  function prettyText(v){
    var s = clean(v).replace(/[_\-]+/g," ").replace(/\s+/g," ").trim();
    if(!s) return "";
    if(s === s.toLowerCase() || s === s.toUpperCase()){
      s = s.toLowerCase().replace(/(^|\s)(\S)/g, function(m,a,b){ return a + b.toUpperCase(); });
    }
    return s;
  }
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // Parse the ISO text Looker hands over rather than new Date(): a date-only string is parsed as
  // UTC and then printed in local time, which shifts a birthday to the previous day west of GMT.
  function ymd(v){
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(clean(v));
    if(!m) return null;
    var mo = Number(m[2]), d = Number(m[3]);
    return (mo>=1 && mo<=12 && d>=1 && d<=31) ? { y:Number(m[1]), m:mo, d:d } : null;
  }
  function fmtDate(v){
    var p = ymd(v);
    return p ? p.d + " " + MONTHS[p.m-1] + " " + p.y : clean(v);   // unknown shape -> show as stored
  }
  // Fallback for tiles that select dob but not the derived age column.
  function ageFrom(v){
    var p = ymd(v); if(!p) return null;
    var now = new Date(), a = now.getFullYear() - p.y;
    if(now.getMonth()+1 < p.m || (now.getMonth()+1 === p.m && now.getDate() < p.d)) a--;
    return (a >= 0 && a < 140) ? a : null;
  }
  function coerceArray(v){
    if(v==null) return [];
    if(Array.isArray(v)) return v;
    if(typeof v==="string"){ try{ var p=JSON.parse(v); return Array.isArray(p)?p:[]; }catch(e){ return []; } }
    if(typeof v==="object") return [v];
    return [];
  }
  // Did the user actually pick the target roles in view? Looker reports the dashboard/explore
  // filters behind the query on queryResponse.applied_filters, keyed by field name. This is what
  // separates "I selected three roles" (their fits are worth plotting) from "I filtered nothing,
  // so every assessment in the model arrived". Returns true / false, or null when this Looker
  // build reports nothing either way — see the idle test in _draw for how null is treated.
  function roleFilterApplied(qr){
    var af = qr && qr.applied_filters;
    if(!af || typeof af !== "object") return null;
    return Object.keys(af).some(function(k){
      var f = af[k];
      var field = (f && f.field && f.field.name) || k;
      if(!/target_role/.test(String(field))) return false;
      var v = (f && typeof f === "object" && "value" in f) ? f.value : f;
      return v != null && String(v).trim() !== "" && String(v) !== "[]";
    });
  }

  // talent_profiles columns behind the card's Personal information block. `country` is not listed
  // because the tile already fetches it as its own dimension (lowercased) — the block reuses that.
  var PERSONAL_KEYS = ["email","contact_number","dob","age","gender","address_line_1","address_line_2",
                       "city","state","post_code","nationality","marital_status"];

  var STYLES = `
  .nx-wrap{
    --ground:#f5f7fa; --panel:#ffffff; --ink:#1b2431; --muted:#6b7684;
    --line:#e7ebf1; --line-soft:#f0f3f7; --accent:#35507d; --accent-soft:#eef3fb;
    --pos:#1f9d57; --pos-soft:#e6f7ee; --neg:#d1442c; --neg-soft:#fdecea;
    font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:var(--ink); background:var(--panel); height:100%; display:flex; flex-direction:column;
  }
  .nx-wrap *{box-sizing:border-box}
  .nx-toolbar{display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding:12px 18px; background:var(--panel); border-bottom:1px solid var(--line); flex:0 0 auto}
  .nx-field{display:flex; flex-direction:column; gap:5px}
  .nx-field label{font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted)}
  .nx-sliderfield label b{color:var(--accent); font-variant-numeric:tabular-nums}
  .nx-slider{width:180px; accent-color:var(--accent); cursor:pointer; margin-top:5px}
  .nx-slider:focus-visible{outline:2px solid var(--accent); outline-offset:3px}
  .nx-search{font-size:14px; padding:7px 11px; border:1px solid var(--line); border-radius:9px; background:#fff; color:var(--ink); min-width:170px}
  .nx-search:focus-visible{outline:2px solid var(--accent); outline-offset:1px}
  .nx-select{font-size:14px; padding:7px 11px; border:1px solid var(--line); border-radius:9px; background:#fff; color:var(--ink); min-width:210px; cursor:pointer}
  .nx-select:focus-visible{outline:2px solid var(--accent); outline-offset:1px}
  .nx-count{font-size:12px; color:var(--muted); font-variant-numeric:tabular-nums}
  .nx-rolelbl{font-size:12px; color:var(--muted)} .nx-rolelbl b{color:var(--ink)}
  .nx-legend{margin-left:auto; display:flex; align-items:center; gap:14px; font-size:12px; color:var(--muted)}
  .nx-legend b{color:var(--ink); font-weight:700}
  .nx-chip{display:inline-flex; align-items:center; gap:6px}
  .nx-chip i{width:11px; height:11px; border-radius:50%; display:inline-block}

  .nx-stage{display:flex; flex-direction:column; flex:1 1 auto; min-height:0; overflow-y:auto; overflow-x:hidden}
  /* Chart keeps an EXPLICIT pixel height (a % / flex-grow height collapses on Looker's first
     paint before the tile has a resolved height). _sizeChart() overrides the height below from
     the tile's real size once it resolves; this value only applies until then. It scrolls with
     the stage rather than sticking: at these heights a pinned chart would leave only a sliver
     of the cards area visible, and card overlays would have to fight it for z-index.
     position:relative is load-bearing — it is the containing block for .nx-zoom. */
  .nx-chartwrap{flex:0 0 auto; height:560px; min-width:0; min-height:0; overflow:hidden; position:relative; background:var(--panel); padding:6px}
  .nx-chart{width:100%; height:100%; display:block; cursor:grab; touch-action:none}
  .nx-chart:active{cursor:grabbing}
  .nx-zoom{position:absolute; top:12px; left:12px; display:flex; flex-direction:column; gap:6px; z-index:3}
  .nx-zoom button{width:30px; height:30px; border:1px solid var(--line); background:rgba(255,255,255,.95); border-radius:8px; font-size:17px; font-weight:700; line-height:1; color:var(--ink); cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(20,30,45,.08)}
  .nx-zoom button:hover{border-color:#c3ccd8}
  .nx-ring{fill:none; stroke:var(--line); stroke-width:1}
  .nx-ring-label{fill:#b6bfca; font-size:10px; font-variant-numeric:tabular-nums}
  .nx-bubble{cursor:pointer}
  .nx-bubble circle{transition:cx .55s cubic-bezier(.22,.61,.36,1), cy .55s cubic-bezier(.22,.61,.36,1), r .15s, stroke-width .15s}
  .nx-bubble:hover circle{stroke:var(--ink); stroke-width:2}
  .nx-bubble.sel circle{stroke:var(--ink); stroke-width:2.5}

  /* flex:1 0 auto — grow to fill the tile when there are few cards, but NEVER shrink below the
     card grid's own height, or the grey background stops partway down and the cards render
     outside it (overflow is visible so the ＋role menu can escape a card). */
  .nx-panel{flex:1 0 auto; border-top:1px solid var(--line); background:var(--ground); display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); align-content:start; gap:12px; padding:14px; overflow:visible}
  .nx-cardcol{background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow:visible; position:relative; box-shadow:0 1px 3px rgba(20,30,45,.05)}
  .nx-cardremove{position:absolute; top:12px; right:12px; z-index:2; width:22px; height:22px; border-radius:50%;
    border:1px solid var(--line); background:#fff; color:#9aa4b0; font-size:15px; line-height:1; cursor:pointer;
    display:flex; align-items:center; justify-content:center}
  .nx-cardremove:hover{color:var(--ink); border-color:#c3ccd8}
  .nx-empty{grid-column:1 / -1; display:flex; align-items:center; justify-content:center; padding:24px}
  .nx-empty p{color:#9aa4b0; font-size:13px; text-align:center; line-height:1.6; max-width:24ch}
  .nx-cardhead{display:flex; gap:14px; align-items:center; min-height:90px; padding:20px 40px 14px 22px; border-bottom:1px solid var(--line-soft)}
  .nx-avatar{width:54px; height:54px; border-radius:50%; flex:0 0 auto; object-fit:cover; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:19px}
  .nx-nameblock{flex:1 1 auto; min-width:0}
  .nx-name{font-weight:800; line-height:1.15; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere}
  .nx-role{font-size:12px; color:var(--muted); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
  .nx-fit{margin-left:auto; text-align:center; flex:0 0 auto}
  .nx-fit .v{font-size:24px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums}
  .nx-fit .c{font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-top:3px}
  .nx-stats{display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line-soft); border-bottom:1px solid var(--line)}
  .nx-stat{background:var(--panel); padding:11px 14px}
  .nx-stat .l{font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#9aa4b0}
  .nx-stat .v{font-size:13px; font-weight:700; margin-top:3px; font-variant-numeric:tabular-nums}
  .nx-bench{display:inline-block; padding:1px 8px; border-radius:10px; background:#eef3fb; color:var(--accent); font-size:12px; font-weight:800}
  .nx-vs{position:relative; padding:11px 22px; font-size:11px; color:var(--muted); background:var(--line-soft); border-bottom:1px solid var(--line); display:flex; align-items:center; gap:9px}
  .nx-vs b{color:var(--ink)}
  .nx-vs .vs-txt{min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
  .nx-addrole{margin-left:auto; flex:0 0 auto; border:1px solid var(--line); background:#fff; color:var(--accent);
    font-size:11px; font-weight:800; border-radius:8px; padding:3px 9px; cursor:pointer; letter-spacing:.02em}
  .nx-addrole:hover{border-color:var(--accent)}
  .nx-addrole:focus-visible{outline:2px solid var(--accent); outline-offset:1px}
  .nx-rolemenu{position:absolute; z-index:6; top:calc(100% - 2px); right:22px; background:#fff; border:1px solid var(--line);
    border-radius:11px; box-shadow:0 10px 28px rgba(20,30,45,.18); padding:6px; min-width:240px; max-height:250px; overflow:auto}
  .nx-rolemenu .mt{font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#9aa4b0; padding:5px 10px 7px}
  .nx-roleopt{display:block; width:100%; text-align:left; border:none; background:none; padding:8px 10px; border-radius:8px; font-size:12.5px; color:var(--ink); cursor:pointer}
  .nx-roleopt:hover{background:var(--line-soft)}
  .nx-roleopt .rf{color:#9aa4b0; font-variant-numeric:tabular-nums}
  .nx-sec{padding:16px 22px; border-bottom:1px solid var(--line)}
  .nx-sectitle{font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#8c96a3; margin-bottom:13px}
  .nx-quad{margin-bottom:15px} .nx-quad:last-child{margin-bottom:0}
  .nx-quadhead{display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:700; margin-bottom:6px; cursor:pointer; user-select:none}
  .nx-quadhead:hover{color:var(--accent)}
  .nx-quadhead .s{font-variant-numeric:tabular-nums}
  .nx-qh-left{display:flex; align-items:center; gap:7px; min-width:0}
  .nx-sk-note{font-weight:600; font-size:9px; letter-spacing:.06em; text-transform:uppercase; color:#9aa4b0}
  .nx-chev{color:#9aa4b0; font-size:9px; display:inline-block; transition:transform .15s; flex:0 0 auto}
  .nx-quad.is-collapsed .nx-chev{transform:rotate(-90deg)}
  .nx-quad.is-collapsed .nx-collapse-body{display:none}
  .nx-skills{margin-top:2px}
  .nx-bar{height:7px; border-radius:5px; background:var(--line); overflow:hidden}
  .nx-bar i{display:block; height:100%; border-radius:5px}
  .nx-subrow{display:flex; justify-content:space-between; font-size:12px; color:#5a6472; padding:4px 0 4px 14px}
  .nx-subrow .ss{color:var(--ink); font-weight:600; font-variant-numeric:tabular-nums}
  .nx-skill{display:flex; align-items:center; gap:8px; padding:8px 0; font-size:13px; border-top:1px solid var(--line-soft)}
  .nx-skill:first-of-type{border-top:none}
  .nx-skill .nm{font-weight:500}
  .nx-skill .meta{font-size:11px; color:#a2abb6; font-variant-numeric:tabular-nums}
  .nx-flag{margin-left:auto; font-size:10px; font-weight:800; letter-spacing:.03em; padding:3px 9px; border-radius:11px; white-space:nowrap}
  .flag-matched{background:#e6f7ee; color:#1f9d57}
  .flag-mismatch{background:#fdecea; color:#d1442c}
  .flag-development{background:#eaf2ff; color:#2f6fdb}
  .flag-unmatched{background:#fdecea; color:#d1442c}
  .flag-additional{background:#eef0f4; color:#6b7684}
  /* ---- personal information ---- */
  .nx-pi{margin-top:2px}
  /* 98px is the width at which the longest label ("Marital status") stops wrapping to two lines */
  .nx-pirow{display:grid; grid-template-columns:98px minmax(0,1fr); gap:10px; align-items:baseline;
    padding:7px 0 7px 14px; border-top:1px solid var(--line-soft); font-size:12.5px}
  .nx-pirow:first-of-type{border-top:none}
  .nx-pirow .pl{font-size:9px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#9aa4b0}
  .nx-pirow .pv{min-width:0; color:var(--ink); overflow-wrap:anywhere; line-height:1.5}
  .nx-pirow .pv.pempty{color:#c0c7d0}
  .nx-pirow .pmuted{color:#a2abb6; font-variant-numeric:tabular-nums}
  @media (max-width:420px){ .nx-pirow{grid-template-columns:1fr; gap:2px} }
  /* ---- simulate mode (complementarity) ---- */
  .nx-seg{display:inline-flex; border:1px solid var(--line); border-radius:9px; overflow:hidden; margin-top:1px}
  .nx-seg button{border:none; background:#fff; color:var(--muted); font-size:12.5px; font-weight:700; padding:7px 13px; cursor:pointer}
  .nx-seg button.on{background:var(--accent); color:#fff}
  .nx-simfield{display:none}
  .nx-wrap.simmode .nx-simfield{display:flex}
  .nx-bubble.focus circle{stroke:var(--accent); stroke-width:2.5}
  .nx-bubble.comp circle{stroke:var(--pos); stroke-width:2.5}
  .nx-bubble.out{cursor:default}                 /* outside the complement pool — not pickable */
  .nx-bubble.out:hover circle{stroke:none; stroke-width:0}
  .nx-wrap.simmode .nx-panel{display:block; padding:0}
  .cx-shell{padding:14px 16px 22px}
  .cx-cards{display:flex; gap:12px; flex-wrap:wrap; margin-bottom:14px}
  .cx-card{background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px; flex:1 1 210px; min-width:200px; position:relative; box-shadow:0 1px 3px rgba(20,30,45,.05)}
  .cx-card.cx-focus{border-color:var(--accent); box-shadow:0 4px 16px rgba(53,80,125,.14)}
  .cx-card.cx-on{border-color:var(--pos)}
  .cx-eyebrow{font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--muted)}
  .cx-card.cx-focus .cx-eyebrow{color:var(--accent)}
  .cx-nm{font-size:15px; font-weight:800; line-height:1.2; margin:3px 0 1px}
  .cx-ttl{font-size:12px; color:var(--muted)}
  .cx-meta{font-size:11px; color:var(--muted); margin-top:8px; font-variant-numeric:tabular-nums}
  .cx-meta b{color:var(--ink); font-weight:600}
  .cx-rec-line{margin-top:6px}
  .cx-rec-pill{display:inline-block; font-size:9px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--accent); background:var(--accent-soft); border-radius:20px; padding:3px 8px}
  .cx-remove{position:absolute; top:10px; right:10px; width:22px; height:22px; border-radius:50%; border:1px solid var(--line); background:#fff; color:#9aa4b0; font-size:15px; line-height:1; cursor:pointer; z-index:2; display:flex; align-items:center; justify-content:center}
  .cx-remove:hover{color:var(--ink); border-color:#c3ccd8}
  .cx-card.cx-on .cx-nm{padding-right:24px}
  .cx-gapfit{margin-top:9px; font-size:11px; color:var(--muted)}
  .cx-gapfit b{color:var(--pos); font-variant-numeric:tabular-nums}
  .cx-fh{margin-top:11px; padding-top:11px; border-top:1px solid var(--line-soft)}
  .cx-row{display:flex; align-items:baseline; gap:9px}
  .cx-solo{font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums}
  .cx-arrow{color:#b6bfca}
  .cx-team{font-size:30px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums}
  .cx-lift{font-size:14px; font-weight:800; font-variant-numeric:tabular-nums}
  .cx-lift.cx-pos{color:var(--pos)}
  .cx-cap{font-size:9px; letter-spacing:.09em; text-transform:uppercase; color:var(--muted); margin-top:5px}
  .cx-checked{display:flex; align-items:baseline; gap:7px; flex-wrap:wrap; margin-top:9px; padding-top:9px; border-top:1px solid var(--line-soft)}
  .cx-ct{font-size:19px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums}
  .cx-capin{margin-top:0; flex:1 1 100%}
  .cx-tblwrap tfoot td{border-top:1px solid var(--line); border-bottom:none; background:#fbfcfe; font-weight:700}
  .cx-tblwrap tfoot tr.cx-chkrow td{background:var(--accent-soft); border-top:1px solid var(--line-soft)}
  .cx-reading{font-size:11px; color:var(--muted); margin-top:7px; line-height:1.5}
  /* ---- complement pool scoping (department -> division -> directorate -> org) ---- */
  .cx-scopebar{display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:12px; font-size:11px; color:var(--muted)}
  .cx-scopebar b{color:var(--ink)}
  .cx-unit{display:inline-block; font-size:10px; font-weight:700; letter-spacing:.02em; color:var(--accent); background:var(--accent-soft); border-radius:20px; padding:2px 8px}
  .cx-widen{border:1px solid var(--line); background:#fff; color:var(--accent); font-weight:700; font-size:11px; border-radius:20px; padding:4px 10px; cursor:pointer}
  .cx-widen:hover{border-color:var(--accent)}
  .cx-widen:focus-visible{outline:2px solid var(--accent); outline-offset:1px}
  .cx-noresult{background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--neg); border-radius:12px; padding:13px 16px; margin-bottom:14px}
  .cx-noresult .nr-t{font-size:12.5px; font-weight:800; color:var(--ink)}
  .cx-noresult .nr-s{font-size:11px; color:var(--muted); margin-top:4px; line-height:1.5}
  .cx-noresult .cx-widen{margin-top:10px; margin-right:7px}
  .cx-outside{font-size:9px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:var(--neg); background:var(--neg-soft); border-radius:20px; padding:2px 8px; margin-left:6px}
  .cx-suggest{display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:14px}
  .cx-suggest-lbl{font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#9aa4b0}
  .cx-sugg{border:1px solid var(--line); background:#fff; color:var(--accent); font-weight:700; font-size:12px; border-radius:20px; padding:5px 11px; cursor:pointer}
  .cx-sugg:hover{border-color:var(--accent)}
  .cx-sugg-gf{color:var(--pos); font-variant-numeric:tabular-nums}
  .cx-tblwrap{background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow-x:auto}
  .cx-tblwrap table{border-collapse:collapse; width:100%; min-width:520px}
  .cx-tblwrap th,.cx-tblwrap td{padding:10px 13px; text-align:left; font-size:13px; border-bottom:1px solid var(--line-soft); white-space:nowrap}
  .cx-tblwrap thead th{font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); background:#fbfcfe}
  .cx-tblwrap td.cx-num,.cx-tblwrap th.cx-num{text-align:right; font-variant-numeric:tabular-nums}
  .cx-tblwrap tr.cx-weakrow td.cx-beh{font-weight:700}
  .cx-qtag{display:inline-block; font-size:9px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:#9aa4b0; margin-left:7px}
  .cx-chk{display:inline-flex; align-items:center; gap:8px; cursor:pointer}
  .cx-chk input{accent-color:var(--accent); cursor:pointer}
  .cx-barcell{display:flex; align-items:center; gap:8px; justify-content:flex-end}
  .cx-mini{width:50px; height:6px; border-radius:4px; background:var(--line); overflow:hidden}
  .cx-mini i{display:block; height:100%; border-radius:4px}
  .cx-chip{display:inline-block; min-width:42px; text-align:center; font-weight:800; font-size:12px; border-radius:20px; padding:2px 8px; font-variant-numeric:tabular-nums}
  .cx-chip.cx-p{background:var(--pos-soft); color:var(--pos)} .cx-chip.cx-n{background:var(--neg-soft); color:var(--neg)} .cx-chip.cx-z{background:var(--line-soft); color:var(--muted)}
  .cx-footnote{font-size:11px; color:var(--muted); margin-top:11px; line-height:1.5}
  @media (max-width:1024px){ .nx-panel{grid-template-columns:repeat(2,minmax(0,1fr))} }
  @media (max-width:760px){
    .nx-chartwrap{height:400px}
    .nx-panel{grid-template-columns:1fr}
    .nx-legend{margin-left:0}
  }`;

  var MARKUP =
    '<div class="nx-wrap">' +
      '<div class="nx-toolbar">' +
        '<div class="nx-field nx-sliderfield">' +
          '<label>Role fit max — <b class="nx-maxfit-val">34</b></label>' +
          '<input type="range" class="nx-slider nx-maxfit" min="0" max="72" step="1" value="34">' +
        '</div>' +
        '<div class="nx-field">' +
          '<label>Search employee</label>' +
          '<input type="search" class="nx-search" placeholder="Type a name…" autocomplete="off">' +
        '</div>' +
        '<div class="nx-field">' +
          '<label>Mode</label>' +
          '<div class="nx-seg nx-mode">' +
            '<button type="button" data-mode="compare" class="on">Compare</button>' +
            '<button type="button" data-mode="simulate">Simulate</button>' +
          '</div>' +
        '</div>' +
        '<div class="nx-field nx-simfield">' +
          '<label>Successor</label>' +
          '<select class="nx-select nx-succ"></select>' +
        '</div>' +
        '<div class="nx-field nx-simfield">' +
          '<label>Complement pool</label>' +
          '<select class="nx-select nx-scope"></select>' +
        '</div>' +
        '<span class="nx-rolelbl"></span>' +
        '<span class="nx-count"></span>' +
        '<div class="nx-legend"><b>Match score</b>' +
          '<span class="nx-chip"><i style="background:#2fbf71"></i>High</span>' +
          '<span class="nx-chip"><i style="background:#f5a623"></i>Medium</span>' +
          '<span class="nx-chip"><i style="background:#e8503a"></i>Low</span>' +
        '</div>' +
      '</div>' +
      '<div class="nx-stage">' +
        '<div class="nx-chartwrap">' +
          '<div class="nx-zoom">' +
            '<button type="button" data-z="in" title="Zoom in">+</button>' +
            '<button type="button" data-z="out" title="Zoom out">&minus;</button>' +
            '<button type="button" data-z="reset" title="Reset view">⤢</button>' +
          '</div>' +
          '<svg class="nx-chart" preserveAspectRatio="xMidYMid meet"></svg>' +
        '</div>' +
        '<aside class="nx-panel"><div class="nx-empty"><p>Click an employee bubble to view their profile.</p></div></aside>' +
      '</div>' +
    '</div>';

  looker.plugins.visualizations.add({
    id: "nsia_radial_bubble",
    label: "NSIA Radial Bubble — Talent Fit",

    options: {
      high_band:   { type: "number", label: "High match threshold (%)",   default: 66, section: "Bands", order: 1 },
      medium_band: { type: "number", label: "Medium match threshold (%)", default: 33, section: "Bands", order: 2 },
      color_high:   { type: "string", display: "color", label: "High colour",   default: "#2fbf71", section: "Bands", order: 3 },
      color_medium: { type: "string", display: "color", label: "Medium colour", default: "#f5a623", section: "Bands", order: 4 },
      color_low:    { type: "string", display: "color", label: "Low colour",    default: "#e8503a", section: "Bands", order: 5 },
      default_role_fit_max: { type: "number", label: "Default 'Role fit max' (blank = data max)", default: null, section: "Scale", order: 1 },
      chart_height_pct: { type: "number", label: "Chart height (% of tile below the toolbar)", default: 86, section: "Scale", order: 2 }
    },

    // ---- one-time shell -----------------------------------------------------
    create: function (element, config) {
      element.innerHTML = "<style>" + STYLES + "</style>" + MARKUP;
      var q = function (s) { return element.querySelector(s); };
      this.$ = {
        el: element,
        wrap: q(".nx-wrap"),
        chartwrap: q(".nx-chartwrap"),
        svg: q(".nx-chart"),
        panel: q(".nx-panel"),
        count: q(".nx-count"),
        roleLbl: q(".nx-rolelbl"),
        slider: q(".nx-maxfit"),
        sliderVal: q(".nx-maxfit-val"),
        search: q(".nx-search"),
        mode: q(".nx-mode"),
        succ: q(".nx-succ"),
        scope: q(".nx-scope"),
        zoom: q(".nx-zoom")
      };
      this.state = {
        employees: [], roleKey: null, rolesInView: [], byPair: {}, rolesByUser: {}, userIds: [],
        roleFilterApplied: null,   // set from queryResponse each update; null = Looker didn't say
        selectedPairs: [], chartRole: null, openMenuPk: null,
        mode: "compare", behaviours: [], simFocus: null, simComplements: {}, simWeak: {}, simScope: "department",
        search: "", maxRoleFit: null, zoom: 1, panX: 0, panY: 0, chartRoot: null, animateIn: false,
        // shared across cards so rows stay aligned when comparing. Personal information starts
        // folded: it is PII that nobody needs on screen by default, and unfolded it would push
        // the competency and skill rows of a three-card comparison out of view.
        collapsed: { Personal: true },
        panning: false, dragMoved: false, sCX: 0, sCY: 0, sPanX: 0, sPanY: 0
      };
      var self = this, st = this.state, $ = this.$;

      $.slider.addEventListener("input", function () {
        st.maxRoleFit = Number($.slider.value); $.sliderVal.textContent = $.slider.value; self._draw();
      });
      $.search.addEventListener("input", function () {
        st.search = $.search.value.trim().toLowerCase(); self._draw();
      });
      $.mode.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-mode]"); if (!b) return;
        st.mode = b.getAttribute("data-mode");
        Array.prototype.forEach.call($.mode.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); });
        $.wrap.classList.toggle("simmode", st.mode === "simulate");
        self._draw();
      });
      $.succ.addEventListener("change", function () {
        st.simFocus = $.succ.value;
        if (st.simComplements[st.simFocus]) st.simComplements[st.simFocus] = false;
        // a new successor sits in a different org unit, so re-derive the pool
        self._defaultWeak(); st.simScope = self._defaultScope(); self._draw();
      });
      $.scope.addEventListener("change", function () {
        st.simScope = $.scope.value; self._draw();
      });
      $.zoom.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var z = b.getAttribute("data-z");
        if (z === "in") self._zoomAt(380, 252, 1.25);
        else if (z === "out") self._zoomAt(380, 252, 0.8);
        else { st.zoom = 1; st.panX = 0; st.panY = 0; self._applyTransform(); }
      });
      $.svg.addEventListener("wheel", function (e) {
        e.preventDefault();
        var r = $.svg.getBoundingClientRect(); if (!r.width || !r.height) return;
        self._zoomAt((e.clientX - r.left) * (760 / r.width), (e.clientY - r.top) * (504 / r.height), e.deltaY < 0 ? 1.15 : 1 / 1.15);
      }, { passive: false });
      $.svg.addEventListener("pointerdown", function (e) {
        st.panning = true; st.dragMoved = false; st.sCX = e.clientX; st.sCY = e.clientY; st.sPanX = st.panX; st.sPanY = st.panY;
      });
      // window listeners (removed only if the viz is destroyed; harmless duplicates avoided by flag)
      if (!this._panWired) {
        this._panWired = true;
        window.addEventListener("pointermove", function (e) {
          if (!st.panning) return;
          var r = $.svg.getBoundingClientRect(); if (!r.width) return;
          if (Math.abs(e.clientX - st.sCX) + Math.abs(e.clientY - st.sCY) > 4) st.dragMoved = true;
          st.panX = st.sPanX + (e.clientX - st.sCX) * (760 / r.width);
          st.panY = st.sPanY + (e.clientY - st.sCY) * (504 / r.height);
          self._applyTransform();
        });
        window.addEventListener("pointerup", function () { st.panning = false; });
        // click anywhere outside an open role menu closes it
        window.addEventListener("pointerdown", function (e) {
          if (!st.openMenuPk) return;
          if (e.target.closest && (e.target.closest(".nx-rolemenu") || e.target.closest(".nx-addrole"))) return;
          st.openMenuPk = null; self._renderPanels();
        });
      }
      $.panel.addEventListener("click", function (e) {
        var srm = e.target.closest(".cx-remove");
        if (srm) { st.simComplements[srm.getAttribute("data-pk")] = false; self._draw(); return; }
        var sug = e.target.closest(".cx-sugg");
        if (sug) { st.simComplements[sug.getAttribute("data-pk")] = true; self._draw(); return; }
        var wide = e.target.closest(".cx-widen");
        if (wide) { st.simScope = wide.getAttribute("data-scope"); self._draw(); return; }
        var rm = e.target.closest(".nx-cardremove");
        if (rm) { self._togglePair(rm.getAttribute("data-pk")); st.openMenuPk = null; self._draw(); return; }
        var add = e.target.closest(".nx-addrole");
        if (add) { var apk = add.getAttribute("data-pk"); st.openMenuPk = (st.openMenuPk === apk ? null : apk); self._renderPanels(); return; }
        var opt = e.target.closest(".nx-roleopt");
        if (opt) {
          var npk = opt.getAttribute("data-pk");
          if (npk && st.selectedPairs.indexOf(npk) < 0) st.selectedPairs.push(npk);
          st.openMenuPk = null; self._draw(); return;
        }
        var hd = e.target.closest("[data-collapse]");
        if (hd) {
          var k = hd.getAttribute("data-collapse");
          st.collapsed[k] = !st.collapsed[k];   // shared toggle -> re-render all cards
          self._renderPanels();
        }
      });
      $.panel.addEventListener("change", function (e) {
        var c = e.target.closest("input[data-sbeh]"); if (!c) return;
        st.simWeak[c.getAttribute("data-sbeh")] = c.checked; self._renderSim();
      });

      this._sizeChart();
      if (typeof ResizeObserver !== "undefined") {
        this._ro = new ResizeObserver(function () { self._sizeChart(); });
        this._ro.observe(element);
      }
    },

    // Give the chart most of the tile instead of a hard-coded 440px. Bounded two ways:
    // it never exceeds the room under the toolbar (a chart taller than the tile just forces
    // scrolling), and never exceeds width/1.3 — the SVG's 760x504 viewBox is letterboxed with
    // "meet", so extra height on a narrow tile only pads the sides.
    _sizeChart: function () {
      var $ = this.$; if (!$ || !$.chartwrap) return;
      var h = $.el.clientHeight || 0, w = $.el.clientWidth || 0;
      var toolbar = $.el.querySelector(".nx-toolbar");
      var avail = h > 0 ? h - (toolbar ? toolbar.offsetHeight : 58) : 0;
      if (avail <= 0) return;                                  // unresolved tile -> keep the CSS height
      var pct = Number(this._config && this._config.chart_height_pct);
      if (!(pct > 0)) pct = 86;
      pct = Math.max(40, Math.min(100, pct));
      var px = Math.round(avail * pct / 100);
      // At the default (or higher) the old fixed 440px stays a floor, so this can only grow
      // the chart. Dial the option below 86 and you get exactly the % you asked for.
      if (pct >= 86) px = Math.max(px, Math.min(440, avail));
      if (w > 0) px = Math.min(px, Math.round(w / 1.3));
      px = Math.max(300, Math.min(1040, px));
      if (px !== this._chartPx) { this._chartPx = px; $.chartwrap.style.height = px + "px"; }
    },

    // ---- data in ------------------------------------------------------------
    updateAsync: function (data, element, config, queryResponse, details, done) {
      this._config = Object.assign(
        { high_band: 66, medium_band: 33, color_high: "#2fbf71", color_medium: "#f5a623", color_low: "#e8503a",
          default_role_fit_max: null, chart_height_pct: 86 },
        config || {});

      var fields = (queryResponse && queryResponse.fields) || {};
      var all = [].concat(fields.dimensions || [], fields.measures || [], fields.table_calculations || []);
      var map = {};
      ["user_id","name","job_title","current_company","picture","country","target_role_id","target_role_name",
       "role_fit","leadership_score","agility_score","cultural_fit_score","technical_score",
       "subcompetencies_json","skills_json","bench_strength","manager_name","performance_year","performance_rating",
       "directorate_name","division_name","department_name"]
      .concat(PERSONAL_KEYS)
      .forEach(function (k) {
        var f = all.find(function (x) { return x.name.split(".").pop() === k || x.name === k; });
        map[k] = f ? f.name : null;
      });
      var val = function (row, k) { var fn = map[k]; return (fn && row[fn]) ? row[fn].value : null; };

      // Whether the org dimensions reached the viz at all. "Absent from the query" and "NULL for
      // this person" both used to surface as "not set", which makes a mis-scoped pool impossible
      // to diagnose — they are reported differently now.
      this.state.orgInQuery = {
        department: !!map.department_name,
        division: !!map.division_name,
        directorate: !!map.directorate_name
      };
      // Same split for the personal fields: "not selected in this tile" and "blank on this
      // person's profile" both read as an empty card row, but the fix for each is different.
      this.state.personalInQuery = PERSONAL_KEYS.some(function (k) { return !!map[k]; });

      this.state.roleFilterApplied = roleFilterApplied(queryResponse);

      var emps = [], roleIds = {};
      (data || []).forEach(function (row) {
        var roleId = String(val(row, "target_role_id"));
        if (roleId === "null" || roleId === "undefined") return;
        roleIds[roleId] = true;
        var uid = String(val(row, "user_id"));
        emps.push({
          userId: uid,
          roleId: roleId,
          pk: uid + "::" + roleId,
          angle: (hashStr(uid + "|" + roleId) % 10000) / 10000 * Math.PI * 2,
          name: val(row, "name") || "Unknown",
          jobTitle: val(row, "job_title") || "",
          company: val(row, "current_company") || "",
          picture: val(row, "picture") || "",
          roleName: val(row, "target_role_name") || ("Role " + roleId),
          managerName: val(row, "manager_name") || "",
          // org placement of the person's CURRENT role — scopes the complement pool.
          // orgUnit() collapses NULL / "" / "   " to "" so a missing level is treated as
          // "not recorded" rather than as a unit that blank rows would all share.
          directorate: orgUnit(val(row, "directorate_name")),
          division: orgUnit(val(row, "division_name")),
          department: orgUnit(val(row, "department_name")),
          benchStrength: val(row, "bench_strength"),
          perfYear: val(row, "performance_year"),
          perfRating: val(row, "performance_rating"),
          roleFit: num(val(row, "role_fit")) || 0,
          quadrants: {
            Leadership: num(val(row, "leadership_score")) || 0,
            Agility: num(val(row, "agility_score")) || 0,
            "Cultural Fit": num(val(row, "cultural_fit_score")) || 0
          },
          subcompetencies: coerceArray(val(row, "subcompetencies_json")),
          skills: coerceArray(val(row, "skills_json")),
          // Personal information (talent_profiles) — display-only, rendered in its own
          // collapsible. `age` comes derived from dob in SQL; ageFrom() covers tiles that
          // selected dob without it.
          personal: {
            email: clean(val(row, "email")),
            contact: clean(val(row, "contact_number")),
            dob: clean(val(row, "dob")),
            age: num(val(row, "age")),
            gender: clean(val(row, "gender")),
            nationality: clean(val(row, "nationality")),
            marital: clean(val(row, "marital_status")),
            addr1: clean(val(row, "address_line_1")),
            addr2: clean(val(row, "address_line_2")),
            city: clean(val(row, "city")),
            state: clean(val(row, "state")),
            postCode: clean(val(row, "post_code")),
            country: clean(val(row, "country"))
          }
        });
      });

      var st = this.state;
      st.employees = emps;

      // per-employee behaviour lookup (subcompetency name -> score) for simulate mode
      emps.forEach(function (e) {
        e.beh = {};
        e.subcompetencies.forEach(function (s) { if (s && s.name != null) e.beh[String(s.name)] = Math.round(num(s.weighted_score) || 0); });
      });

      // lookups keyed by (user, role) — the multi-role comparison relies on these
      st.byPair = {}; st.rolesByUser = {}; var us = {}, roleNames = {};
      emps.forEach(function (e) {
        st.byPair[e.pk] = e;
        us[e.userId] = true;
        roleNames[e.roleId] = e.roleName;
        var arr = st.rolesByUser[e.userId] || (st.rolesByUser[e.userId] = []);
        if (!arr.some(function (r) { return r.id === e.roleId; })) arr.push({ id: e.roleId, name: e.roleName });
      });
      st.userIds = Object.keys(us);
      st.rolesInView = Object.keys(roleNames)
        .map(function (id) { return { id: id, name: roleNames[id] }; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });

      var roleKey = Object.keys(roleIds).sort().join(",");
      var roleChanged = roleKey !== st.roleKey;
      st.roleKey = roleKey;

      // re-baseline when the set of roles (filter) changes or on first load
      if (roleChanged || st.maxRoleFit == null) {
        st.selectedPairs = [];
        st.openMenuPk = null;
        st.zoom = 1; st.panX = 0; st.panY = 0;
        st.animateIn = true;   // new population -> nodes glide in (consumed by _draw)
        // default chart role = the one the most employees are assessed against
        var counts = {};
        emps.forEach(function (e) { counts[e.roleId] = (counts[e.roleId] || 0) + 1; });
        st.chartRole = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || null;

        var cfgMax = Number(this._config.default_role_fit_max);
        if (cfgMax > 0) {
          st.maxRoleFit = Math.min(72, cfgMax);
        } else {
          var dataMax = emps.reduce(function (m, e) { return Math.max(m, e.roleFit || 0); }, 0);
          st.maxRoleFit = Math.min(72, Math.max(1, Math.ceil(dataMax)));
        }
      } else {
        // keep only still-present selections and a valid chart role
        st.selectedPairs = st.selectedPairs.filter(function (pk) { return st.byPair[pk]; });
        if (!roleNames[st.chartRole]) {
          var c2 = {}; emps.forEach(function (e) { c2[e.roleId] = (c2[e.roleId] || 0) + 1; });
          st.chartRole = Object.keys(c2).sort(function (a, b) { return c2[b] - c2[a]; })[0] || null;
        }
      }

      this.$.slider.value = st.maxRoleFit; this.$.sliderVal.textContent = st.maxRoleFit;

      // simulate-mode: behaviours scoped to the charted role, plus the successor default
      this._buildBehaviours();
      var roleEmps = st.employees.filter(function (e) { return e.roleId === st.chartRole; })
                                 .sort(function (a, b) { return b.roleFit - a.roleFit; });
      if (roleChanged) st.simComplements = {};
      if (roleChanged || !st.byPair[st.simFocus] || st.byPair[st.simFocus].roleId !== st.chartRole) {
        st.simFocus = roleEmps.length ? roleEmps[0].pk : null;
        this._defaultWeak();
        st.simScope = this._defaultScope();
      } else {
        Object.keys(st.simComplements).forEach(function (pk) {
          if (!st.byPair[pk] || st.byPair[pk].roleId !== st.chartRole) delete st.simComplements[pk];
        });
        // the level may have emptied out (or become usable) as rows changed
        if (st.simScope !== "org" && !this._simCandidates(st.simScope).length) st.simScope = this._defaultScope();
      }
      this.$.succ.innerHTML = roleEmps.map(function (e) {
        return '<option value="' + esc(e.pk) + '">' + esc(e.name) + (e.jobTitle ? " — " + esc(e.jobTitle) : "") + '</option>';
      }).join("");
      if (st.simFocus != null) this.$.succ.value = st.simFocus;
      this.$.wrap.classList.toggle("simmode", st.mode === "simulate");

      // role label — multiple target roles are now expected in view
      this.$.roleLbl.innerHTML = st.rolesInView.length === 1
        ? "Target role: <b>" + esc(st.rolesInView[0].name) + "</b>"
        : (st.rolesInView.length > 1 ? "<b>" + st.rolesInView.length + "</b> target roles in view" : "");

      this._sizeChart();
      this._draw();
      if (done) done();
    },

    // ---- match-score + band helpers ----------------------------------------
    _match: function (fit) { var m = this.state.maxRoleFit; return m > 0 ? Math.max(0, Math.min(1, fit / m)) * 100 : 0; },
    _color: function (v) {
      var c = this._config;
      return v >= c.high_band ? c.color_high : v >= c.medium_band ? c.color_medium : c.color_low;
    },
    _togglePair: function (pk) {
      var a = this.state.selectedPairs, i = a.indexOf(pk);
      if (i >= 0) a.splice(i, 1); else a.push(pk);
    },
    _applyTransform: function () {
      var st = this.state;
      if (st.chartRoot) st.chartRoot.setAttribute("transform", "translate(" + st.panX + "," + st.panY + ") scale(" + st.zoom + ")");
    },
    _zoomAt: function (vbX, vbY, factor) {
      var st = this.state, nz = Math.max(0.5, Math.min(6, st.zoom * factor));
      var wx = (vbX - st.panX) / st.zoom, wy = (vbY - st.panY) / st.zoom;
      st.panX = vbX - wx * nz; st.panY = vbY - wy * nz; st.zoom = nz; this._applyTransform();
    },

    // ---- chart --------------------------------------------------------------
    _draw: function () {
      var self = this, st = this.state, svg = this.$.svg;
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      // Compare mode plots every (employee × role) row the Looker filter delivered — so with
      // no target-role filter you see everyone, and selecting role(s) subsets the chart.
      // Simulate mode scopes to a single role's population (candidate-as-bar).
      var sim = st.mode === "simulate";
      var list = (sim ? st.employees.filter(function (e) { return e.roleId === st.chartRole; }) : st.employees.slice())
                   .sort(function (a, b) { return b.roleFit - a.roleFit; });
      // Idle state — the query was never scoped to target roles, so every (employee × role) row
      // in the model arrives and the radius cannot mean "fit to the target role". Park every node
      // on the 0% rim in the Low colour rather than plot a blob of unrelated fits.
      // A deliberate multi-role selection is NOT idle: the roles in view are the ones the user
      // asked for, so each node plots its own fit and the count line names that basis. Only a
      // positive "no role filter" from Looker idles the chart — when it reports nothing (null) the
      // fit is plotted, since a mislabelled-but-readable chart beats a rim of dots either way.
      // Simulate mode always scopes itself to one role, so it never idles.
      var multi = !sim && st.rolesInView.length > 1;
      var idle = multi && st.roleFilterApplied === false;
      var tail = st.selectedPairs.length ? " · " + st.selectedPairs.length + " selected" : "";
      var spread = list.length + " assessments · " + st.userIds.length + " employees · " +
                   st.rolesInView.length + " roles · ";
      if (sim) {
        var cc = this._simComplementEmps().length;
        this.$.count.textContent = list.length + " employees · successor + " + cc + " complement" + (cc === 1 ? "" : "s");
      } else if (!list.length) {
        this.$.count.textContent = "No assessments in view";
      } else if (idle) {
        this.$.count.textContent = spread + "fit not plotted — filter to a target role" + tail;
      } else if (multi) {
        this.$.count.textContent = spread + "fit is against each row's own target role" + tail;
      } else {
        this.$.count.textContent = list.length + " employees" + tail;
      }

      var W = 760, H = 504; svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var cx = W / 2, cy = H / 2, maxR = Math.min(W, H) / 2 - 34;
      st.chartRoot = svgEl("g", {}); svg.appendChild(st.chartRoot); this._applyTransform();
      [1, 0.75, 0.5, 0.25].forEach(function (f) {
        st.chartRoot.appendChild(svgEl("circle", { class: "nx-ring", cx: cx, cy: cy, r: maxR * f }));
        var lb = svgEl("text", { class: "nx-ring-label", x: cx + 4, y: cy - maxR * f + 13 }); lb.textContent = Math.round((1 - f) * 100) + "%"; st.chartRoot.appendChild(lb);
      });
      // Entrance: after a target-role filter change (or first load) every node spawns a step
      // further out along its own angle and glides back into place, swept in fit order
      // (centre -> rim). Only this draw animates — the flag is consumed here so clicking a
      // bubble, searching or dragging the slider still repaints instantly.
      var flyIn = st.animateIn, flying = [];
      st.animateIn = false;
      var n = list.length;
      // explicit rather than leaning on _color(0) — that returns the Medium colour if someone
      // sets the medium threshold to 0
      var idleFill = (this._config && this._config.color_low) || "#e8503a";

      list.forEach(function (emp, i) {
        var m = idle ? 0 : Math.max(0, Math.min(100, self._match(emp.roleFit))), r = maxR * (1 - m / 100);
        var ang = emp.angle, bx = cx + r * Math.cos(ang), by = cy + r * Math.sin(ang);
        if (r < 4) { bx = cx; by = cy; }
        var sim = st.mode === "simulate";
        var isFocus = sim && emp.pk === st.simFocus;
        var isComp = sim && !isFocus && !!st.simComplements[emp.pk];
        // Simulate mode: only the current complement pool is pickable. Already-chosen
        // complements stay lit even if the pool was narrowed after they were added.
        var inPool = !sim || isFocus || isComp || self._inScope(emp, st.simScope);
        var cls = "nx-bubble";
        if (isFocus) cls += " focus";
        else if (isComp) cls += " comp";
        else if (!sim && st.selectedPairs.indexOf(emp.pk) >= 0) cls += " sel";
        if (!inPool) cls += " out";
        var hit = !st.search || emp.name.toLowerCase().indexOf(st.search) >= 0;
        var g = svgEl("g", { class: cls });
        g.appendChild(svgEl("circle", { cx: bx, cy: by, r: 2, fill: idle ? idleFill : self._color(m),
          "fill-opacity": (hit && inPool) ? 0.9 : 0.12, stroke: "#fff", "stroke-width": 0.5 }));
        var ti = svgEl("title", {});
        ti.textContent = emp.name + " — " + emp.roleName + " · " + Math.round(emp.roleFit) + "% fit" +
          (sim && !inPool ? " · outside " + self._scopeLabel(st.simScope).toLowerCase() : "");
        g.appendChild(ti);
        g.addEventListener("click", function () {
          if (st.dragMoved) return;
          if (st.mode === "simulate") { if (!inPool) return; self._toggleComplement(emp.pk); self._draw(); }
          else { self._togglePair(emp.pk); self._draw(); }
        });
        if (flyIn) {
          // spawn one step further out along the node's own angle, clamped inside the
          // viewBox so nothing starts life clipped by the SVG edge
          var sx = Math.max(6, Math.min(W - 6, bx + 46 * Math.cos(ang)));
          var sy = Math.max(6, Math.min(H - 6, by + 46 * Math.sin(ang)));
          var delay = n > 1 ? Math.round(i / (n - 1) * 280) : 0;   // sweep centre -> rim
          g.style.opacity = "0";
          g.style.transform = "translate(" + (sx - bx).toFixed(1) + "px," + (sy - by).toFixed(1) + "px)";
          g.style.transition = "transform 720ms cubic-bezier(.16,.86,.28,1) " + delay + "ms," +
                               " opacity 420ms ease-out " + delay + "ms";
          flying.push(g);
        }
        st.chartRoot.appendChild(g);
      });
      // Flush layout so the spawn offset becomes the transition's start value, then set the
      // resting state in the same tick. Deliberately synchronous rather than rAF-based: if the
      // browser never runs the transition, the nodes are simply already in place.
      if (flying.length) {
        st.chartRoot.getBoundingClientRect();
        flying.forEach(function (g) { g.style.transform = "translate(0px,0px)"; g.style.opacity = ""; });
      }
      if (st.mode === "simulate") this._renderSim(); else this._renderPanels();
    },

    _renderPanels: function () {
      var self = this, st = this.state, panel = this.$.panel;
      this.$.wrap.classList.toggle("has-cards", st.selectedPairs.length > 0);
      if (!st.selectedPairs.length) {
        panel.innerHTML = '<div class="nx-empty"><p>Click employee bubbles to view and compare profiles. Use ＋ role on a card to compare one person across roles.</p></div>';
        return;
      }
      var cols = st.selectedPairs.map(function (pk) {
        var emp = st.byPair[pk]; if (!emp) return "";
        return '<div class="nx-cardcol"><button class="nx-cardremove" data-pk="' + esc(pk) + '" title="Remove from comparison">&times;</button>' + self._cardHTML(emp) + '</div>';
      }).join("");
      panel.innerHTML = cols || '<div class="nx-empty"><p>Click employee bubbles to compare.</p></div>';
    },

    _cardHTML: function (emp) {
      var self = this, st = this.state, fit = Math.round(emp.roleFit), fc = this._color(this._match(emp.roleFit));
      var avatar = emp.picture
        ? '<img class="nx-avatar" src="' + esc(emp.picture) + '" alt="">'
        : '<div class="nx-avatar" style="background:' + fc + '">' + esc(initials(emp.name)) + '</div>';
      var nlen = (emp.name || "").length;
      var nsize = nlen <= 14 ? 16 : nlen <= 22 ? 15 : nlen <= 30 ? 14 : nlen <= 40 ? 13 : 12;

      // roles this person could still be added against (not already carded)
      var carded = {}; st.selectedPairs.forEach(function (pk) { carded[pk] = true; });
      var avail = (st.rolesByUser[emp.userId] || []).filter(function (r) { return !carded[emp.userId + "::" + r.id]; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
      var addBtn = avail.length
        ? '<button class="nx-addrole" data-pk="' + esc(emp.pk) + '" title="Compare this person against another role">＋ role</button>' : '';
      var menu = (st.openMenuPk === emp.pk)
        ? '<div class="nx-rolemenu"><div class="mt">Add ' + esc((emp.name || "").split(/\s+/)[0]) + ' vs…</div>' +
            avail.map(function (r) {
              var p = emp.userId + "::" + r.id, f = st.byPair[p];
              return '<button class="nx-roleopt" data-pk="' + esc(p) + '">' + esc(r.name) +
                     ' <span class="rf">· ' + Math.round(f ? f.roleFit : 0) + '% fit</span></button>';
            }).join("") +
          '</div>' : '';

      var collapsed = this.state.collapsed;
      var quadOrder = ["Leadership", "Agility", "Cultural Fit"], byQuad = {};
      emp.subcompetencies.forEach(function (s) { var q = s.quadrant || s.parent || ""; (byQuad[q] = byQuad[q] || []).push(s); });
      var quadHtml = quadOrder.map(function (q) {
        var score = Math.round(emp.quadrants[q] || 0), col = self._color(emp.quadrants[q] || 0);
        var subs = (byQuad[q] || []).map(function (s) {
          return '<div class="nx-subrow"><span>' + esc(s.name) + '</span><span class="ss">' + Math.round(s.weighted_score || 0) + '%</span></div>';
        }).join("");
        return '<div class="nx-quad' + (collapsed[q] ? ' is-collapsed' : '') + '">' +
                 '<div class="nx-quadhead" data-collapse="' + esc(q) + '">' +
                   '<span class="nx-qh-left"><span class="nx-chev">▾</span>' + esc(q) + '</span>' +
                   '<span class="s">' + score + '%</span>' +
                 '</div>' +
                 '<div class="nx-bar"><i style="width:' + Math.min(100, score) + '%;background:' + col + '"></i></div>' +
                 '<div class="nx-collapse-body">' + subs + '</div>' +
               '</div>';
      }).join("");

      var fCls = { "MATCHED": "matched", "MISMATCH": "mismatch", "DEVELOPMENT NEEDED": "development", "UNMATCHED": "unmatched", "ADDITIONAL": "additional" };
      var fLbl = { "MATCHED": "MATCH", "MISMATCH": "MISMATCH", "DEVELOPMENT NEEDED": "DEV NEEDED", "UNMATCHED": "MISMATCH", "ADDITIONAL": "ADDITIONAL" };
      var skillsHtml = emp.skills.map(function (sk) {
        var s2 = String(sk.status || "").toUpperCase(), cls = fCls[s2] || "additional", lbl = fLbl[s2] || s2;
        var meta = sk.role_proficiency != null
          ? '<span class="meta">req ' + sk.role_proficiency + (sk.user_proficiency != null ? " · has " + sk.user_proficiency : "") + '</span>' : '';
        return '<div class="nx-skill"><span class="nm">' + esc(sk.name) + '</span>' + meta + '<span class="nx-flag flag-' + cls + '">' + esc(lbl) + '</span></div>';
      }).join("") || '<div class="nx-subrow">No skills mapped for this role.</div>';

      var pi = this._personal(emp);

      var perf = (emp.perfYear != null || emp.perfRating != null)
        ? (emp.perfYear != null ? ("FY" + emp.perfYear + " · ") : "") + (emp.perfRating != null ? emp.perfRating : "—") : "—";
      var bench = (emp.benchStrength != null && emp.benchStrength !== "") ? '<span class="nx-bench">' + esc(emp.benchStrength) + '</span>' : "—";

      return '<div class="nx-cardhead">' + avatar +
          '<div class="nx-nameblock"><div class="nx-name" style="font-size:' + nsize + 'px">' + esc(emp.name) + '</div>' +
          '<div class="nx-role">' + esc(emp.jobTitle || emp.company || "") + '</div></div>' +
          '<div class="nx-fit"><div class="v" style="color:' + fc + '">' + fit + '%</div><div class="c">Role fit</div></div>' +
        '</div>' +
        '<div class="nx-stats">' +
          '<div class="nx-stat"><div class="l">Reports to</div><div class="v">' + esc(emp.managerName || "—") + '</div></div>' +
          '<div class="nx-stat"><div class="l">Bench strength</div><div class="v">' + bench + '</div></div>' +
          '<div class="nx-stat"><div class="l">Performance</div><div class="v">' + esc(perf) + '</div></div>' +
        '</div>' +
        '<div class="nx-vs"><span class="vs-txt">Compared against <b>' + esc(emp.roleName) + '</b></span>' + addBtn + menu + '</div>' +
        '<div class="nx-sec"><div class="nx-sectitle">Competencies — weighted</div>' + quadHtml + '</div>' +
        '<div class="nx-sec">' +
          '<div class="nx-quad nx-skills' + (collapsed['Skills'] ? ' is-collapsed' : '') + '">' +
            '<div class="nx-quadhead" data-collapse="Skills">' +
              '<span class="nx-qh-left"><span class="nx-chev">▾</span>Skills</span>' +
              '<span class="s nx-sk-note">vs required</span>' +
            '</div>' +
            '<div class="nx-collapse-body">' + skillsHtml + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nx-sec">' +
          '<div class="nx-quad' + (collapsed['Personal'] ? ' is-collapsed' : '') + '">' +
            '<div class="nx-quadhead" data-collapse="Personal">' +
              '<span class="nx-qh-left"><span class="nx-chev">▾</span>Personal information</span>' +
              '<span class="s nx-sk-note">' + pi.note + '</span>' +
            '</div>' +
            '<div class="nx-collapse-body nx-pi">' + pi.body + '</div>' +
          '</div>' +
        '</div>';
    },

    // ---- personal information ----------------------------------------------
    // Every row is rendered even when blank (as an em dash) so the same labels sit at the same
    // height across a multi-card comparison — the reason the collapse state is shared too.
    // Returns the section body plus a header note that stays empty unless something is wrong —
    // the header names the section already, so a note there is only worth the space as a warning.
    _personal: function (emp) {
      var p = emp.personal || {};

      var addrLines = [
        p.addr1,
        p.addr2,
        [[p.city, prettyText(p.state)].filter(Boolean).join(", "), p.postCode].filter(Boolean).join(" "),
        prettyText(p.country)
      ].filter(Boolean);

      var dobTxt = p.dob ? fmtDate(p.dob) : "";
      var age = (p.age != null) ? Math.round(p.age) : ageFrom(p.dob);
      if (dobTxt && age != null) dobTxt += ' <span class="pmuted">· ' + age + (age === 1 ? " yr" : " yrs") + '</span>';
      else if (!dobTxt && age != null) dobTxt = age + (age === 1 ? " yr" : " yrs");

      var rows = [
        { l: "Email",          v: esc(p.email) },
        { l: "Contact",        v: esc(p.contact) },
        { l: "Date of birth",  v: dobTxt },                       // pre-escaped above
        { l: "Gender",         v: esc(prettyText(p.gender)) },
        { l: "Nationality",    v: esc(prettyText(p.nationality)) },
        { l: "Marital status", v: esc(prettyText(p.marital)) },
        { l: "Address",        v: addrLines.map(esc).join("<br>") }
      ];
      var filled = rows.filter(function (r) { return !!r.v; }).length;

      if (!this.state.personalInQuery) {
        return { note: "not in query",
                 body: '<div class="nx-subrow">Personal fields are not in this tile&#39;s query — add the ' +
                       'email, contact number, date of birth, gender, address, nationality and marital status ' +
                       'dimensions to the tile&#39;s selected fields.</div>' };
      }
      if (!filled) {
        return { note: "not recorded", body: '<div class="nx-subrow">No personal information recorded for this person.</div>' };
      }
      return {
        note: "",                                   // nothing to say when the data is simply there
        body: rows.map(function (r) {
          return '<div class="nx-pirow"><span class="pl">' + r.l + '</span>' +
                 '<span class="pv' + (r.v ? '' : ' pempty') + '">' + (r.v || "&mdash;") + '</span></div>';
        }).join("")
      };
    },

    // ---- simulate mode (complementarity) -----------------------------------
    _buildBehaviours: function () {
      var st = this.state, order = { "Leadership": 0, "Agility": 1, "Cultural Fit": 2 };
      var roleEmps = st.employees.filter(function (e) { return e.roleId === st.chartRole; });
      var seen = {}, list = [];
      roleEmps.forEach(function (e) {
        (e.subcompetencies || []).forEach(function (s) {
          var nm = s && s.name != null ? String(s.name) : null; if (!nm || seen[nm]) return;
          seen[nm] = 1; list.push({ name: nm, quad: (s.quadrant || s.parent || "") });
        });
      });
      list.sort(function (a, b) {
        var qa = (a.quad in order) ? order[a.quad] : 9, qb = (b.quad in order) ? order[b.quad] : 9;
        return qa !== qb ? qa - qb : a.name.localeCompare(b.name);
      });
      st.behaviours = list.map(function (b, i) { return { id: "sb" + i, name: b.name, quad: b.quad, w: 1 }; });
    },
    _simFocusEmp: function () { return this.state.byPair[this.state.simFocus] || null; },
    _simComplementEmps: function () {
      var st = this.state;
      return Object.keys(st.simComplements)
        .filter(function (pk) { return st.simComplements[pk] && pk !== st.simFocus && st.byPair[pk]; })
        .map(function (pk) { return st.byPair[pk]; });
    },
    _toggleComplement: function (pk) {
      var st = this.state; if (pk === st.simFocus) return;
      st.simComplements[pk] = !st.simComplements[pk];
    },
    _bestPartner: function (bname) {
      var sel = this._simComplementEmps(); if (!sel.length) return null;
      return Math.max.apply(null, sel.map(function (p) { return p.beh[bname] || 0; }));
    },
    _wavgOver: function (bs, fn) { var s = 0, w = 0; bs.forEach(function (b) { s += b.w * fn(b); w += b.w; }); return w ? s / w : 0; },
    _wavg: function (fn) { return this._wavgOver(this.state.behaviours, fn); },
    _checkedBehaviours: function () {
      var st = this.state;
      return st.behaviours.filter(function (b) { return st.simWeak[b.id]; });
    },
    _simSolo: function () { var f = this._simFocusEmp(); return this._wavg(function (b) { return f.beh[b.name] || 0; }); },
    _simTeamValue: function (bname) {
      var f = this._simFocusEmp(), bp = this._bestPartner(bname), cv = f.beh[bname] || 0;
      return bp == null ? cv : Math.max(cv, bp);   // ceiling: lean on whoever is strongest
    },
    _simHeadline: function () { var self = this; return this._wavg(function (b) { return self._simTeamValue(b.name); }); },
    // What the partnership actually ADDS on a behaviour: Effective − candidate. Never negative,
    // because the ceiling method means a weaker partner cannot pull the team value down. (The old
    // Δ was bestPartner − candidate, which went negative and did not sum to the headline lift.)
    _simGain: function (bname) {
      var f = this._simFocusEmp();
      return Math.max(0, this._simTeamValue(bname) - (f.beh[bname] || 0));
    },
    // Solo / team / lift restricted to the checked behaviours — the gaps the user is steering.
    _simCheckedStats: function () {
      var self = this, bs = this._checkedBehaviours(), f = this._simFocusEmp();
      if (!bs.length || !f) return null;
      var solo = this._wavgOver(bs, function (b) { return f.beh[b.name] || 0; });
      var team = this._wavgOver(bs, function (b) { return self._simTeamValue(b.name); });
      return { n: bs.length, solo: solo, team: team, lift: team - solo };
    },
    // One candidate's average lift on the checked behaviours. An average (not a sum) so it is in
    // the same units as the headline lift; ranking is unchanged either way.
    _simGapFit: function (emp) {
      var f = this._simFocusEmp(), bs = this._checkedBehaviours();
      return this._wavgOver(bs, function (b) { return Math.max(0, (emp.beh[b.name] || 0) - (f.beh[b.name] || 0)); });
    },
    // ---- complement pool scoping -------------------------------------------
    // Complements are searched in the successor's own org unit first and widened outwards only
    // when that turns up nobody useful. Narrowest -> widest; "org" is the catch-all fallback.
    // NOTE: every level still requires the candidate to be assessed against the SAME target
    // role, because behaviour scores come from a (user × role) assessment — scores from a
    // different role's formula engine are not comparable. So "whole organisation" means
    // everyone in view assessed against this role.
    _SCOPES: ["department", "division", "directorate", "org"],
    _scopeLabel: function (s) {
      return { department: "Department", division: "Division", directorate: "Directorate", org: "Whole organisation" }[s] || s;
    },
    _scopeUnit: function (s) {                      // the focus's unit name at this level
      if (s === "org") return "";
      var f = this._simFocusEmp();
      return f ? orgUnit(f[s]) : "";                 // "" when the level isn't recorded
    },
    _inScope: function (emp, s) {
      if (s === "org") return true;
      var unit = this._scopeUnit(s);
      if (!unit) return false;                      // no unit on the successor -> level unusable
      return unitKey(emp[s]) === unitKey(unit);     // case/space-insensitive, so " Investments" matches
    },
    // everyone eligible to be picked at a given level (excludes the successor)
    _simCandidates: function (s) {
      var self = this, st = this.state;
      return st.employees.filter(function (e) {
        return e.roleId === st.chartRole && e.pk !== st.simFocus && self._inScope(e, s || st.simScope);
      });
    },
    // per level: pool size, how many cover a checked gap, and why a level is unusable
    // (field absent from the query vs. blank on this successor's row)
    _scopeStats: function () {
      var self = this, st = this.state, out = {};
      var roleN = st.employees.filter(function (e) { return e.roleId === st.chartRole; });
      this._SCOPES.forEach(function (s) {
        var c = self._simCandidates(s);
        var inQuery = s === "org" || !st.orgInQuery || st.orgInQuery[s] !== false;
        out[s] = { unit: self._scopeUnit(s), n: c.length,
                   covering: c.filter(function (e) { return self._simGapFit(e) > 0; }).length,
                   inQuery: inQuery,
                   // how many rows in view carry this level at all — separates "bad data for this
                   // one person" from "nobody has it"
                   recorded: s === "org" ? roleN.length : roleN.filter(function (e) { return !!e[s]; }).length,
                   ofTotal: roleN.length };
      });
      return out;
    },
    // levels that never arrived in the query — the actionable Looker-side fix
    _missingOrgFields: function () {
      var st = this.state;
      return this._SCOPES.filter(function (s) { return s !== "org" && st.orgInQuery && st.orgInQuery[s] === false; });
    },
    // narrowest level that has anyone in it at all; org is always available
    _defaultScope: function () {
      var self = this, pick = null;
      this._SCOPES.forEach(function (s) { if (!pick && s !== "org" && self._simCandidates(s).length) pick = s; });
      return pick || "org";
    },
    _simRanked: function () {
      var self = this;
      return this._simCandidates()
        .map(function (e) { return { e: e, gf: self._simGapFit(e) }; })
        .sort(function (a, b) { return b.gf - a.gf; });
    },
    _defaultWeak: function () {
      var st = this.state, f = this._simFocusEmp(); st.simWeak = {};
      if (!f) return;
      st.behaviours.slice().sort(function (a, b) { return (f.beh[a.name] || 0) - (f.beh[b.name] || 0); })
        .slice(0, 3).forEach(function (b) { st.simWeak[b.id] = true; });
    },
    _simBar: function (v) { return '<span class="cx-barcell"><span class="cx-mini"><i style="width:' + v + '%;background:' + this._color(v) + '"></i></span>' + Math.round(v) + '</span>'; },
    // narrowest -> widest org placement, e.g. "Rewards · Human Capital · Corporate Services"
    _orgLine: function (emp) {
      var parts = [emp.department, emp.division, emp.directorate].filter(Boolean);
      return parts.length ? esc(parts.join(" · ")) : "";
    },

    // toolbar pool selector — rebuilt on every sim render because the counts move with the
    // successor and with which gaps are checked
    _renderScopeSelect: function (stats) {
      var self = this, st = this.state;
      this.$.scope.innerHTML = this._SCOPES.map(function (s) {
        var d = stats[s], usable = s === "org" || (d.unit && d.n);
        var why = !d.inQuery ? "not in query"                                  // dimension missing from the tile
                : !d.unit ? (d.recorded ? "not recorded for this person" : "not recorded in this data")
                : null;
        var label = self._scopeLabel(s) +
          (s === "org" ? "" : (why ? " — " + why : " — " + d.unit)) +
          (usable ? " (" + d.n + ")" : "");
        return '<option value="' + s + '"' + (usable ? "" : " disabled") + (s === st.simScope ? " selected" : "") + '>' +
               esc(label) + '</option>';
      }).join("");
      this.$.scope.value = st.simScope;
    },
    // the levels wider than the current one that would actually turn something up
    _widerScopes: function (stats) {
      var st = this.state, i = this._SCOPES.indexOf(st.simScope);
      return this._SCOPES.slice(i + 1).filter(function (s) { return s === "org" || (stats[s].unit && stats[s].n); });
    },
    // The number is always "how many people there cover the checked gaps" — the actionable
    // figure. Pool sizes live in the toolbar select.
    _widenBtn: function (s, stats) {
      var d = stats[s];
      return '<button class="cx-widen" data-scope="' + s + '" title="' + d.covering + ' of ' + d.n +
        ' there score higher than the successor on the checked behaviours">' +
        (s === "org" ? "Search the whole organisation" : "Widen to " + this._scopeLabel(s).toLowerCase() + (d.unit ? " — " + esc(d.unit) : "")) +
        ' <b>' + d.covering + '</b></button>';
    },

    _renderSim: function () {
      var self = this, st = this.state, panel = this.$.panel;
      var f = this._simFocusEmp();
      if (!f || !st.behaviours.length) {
        this.$.scope.innerHTML = "";
        panel.innerHTML = '<div class="nx-empty"><p>No behaviour data for this role. Simulate mode needs the subcompetencies field, filtered to a single target role.</p></div>';
        return;
      }
      var stats = this._scopeStats();
      this._renderScopeSelect(stats);
      var rank = this._simRanked();
      var recIds = {}; rank.filter(function (r) { return r.gf > 0; }).slice(0, 2).forEach(function (r) { recIds[r.e.pk] = true; });
      var comps = this._simComplementEmps();
      var first = f.name.split(/\s+/)[0];
      var solV = this._simSolo(), teamV = this._simHeadline(), lift = teamV - solV;
      var liftTxt = (lift >= 0 ? "+" : "") + Math.round(lift) + "%";
      var chk = this._simCheckedStats();
      var cur = stats[st.simScope], wider = this._widerScopes(stats);
      var poolTxt = st.simScope === "org"
        ? "the whole organisation"
        : self._scopeLabel(st.simScope).toLowerCase() + " " + (cur.unit ? "<b>" + esc(cur.unit) + "</b>" : "(not set)");
      var reading = comps.length
        ? ("Partners can coach " + esc(first) + " on the green behaviours where they rank higher.")
        : "Click a highlighted bubble above, or a suggestion below, to add complements.";

      var html = '<div class="cx-shell">';

      // Where complements are being searched, and how to widen out of a dead end.
      html += '<div class="cx-scopebar"><span>Complements searched in ' + poolTxt +
        ' — <b>' + cur.n + '</b> assessed against this role, <b>' + cur.covering + '</b> cover the checked gaps.</span>' +
        wider.map(function (s) { return self._widenBtn(s, stats); }).join("") + '</div>';

      // Org-unit scoping is impossible without the dimensions — say so, and say what to do.
      var missing = this._missingOrgFields();
      if (missing.length) {
        html += '<div class="cx-noresult"><div class="nr-t">Org scoping unavailable — ' +
          missing.map(function (s) { return esc(self._scopeLabel(s)); }).join(", ") +
          ' not in this tile&#39;s query.</div>' +
          '<div class="nr-s">Add the <b>' + missing.map(function (s) { return esc(self._scopeLabel(s)) + " Name"; }).join("</b>, <b>") +
          '</b> dimension' + (missing.length > 1 ? "s" : "") + ' to the tile&#39;s selected fields (a new LookML dimension does not join an existing tile automatically). ' +
          'Until then complements are searched across the whole organisation.</div></div>';
      } else if (st.simScope === "org" && !stats.department.unit) {
        // fields arrived, but this successor has no placement recorded
        var rec = stats.department;
        html += '<div class="cx-scopebar"><span>' + esc(first) + ' has no department recorded' +
          (rec.recorded ? ' — department is populated for <b>' + rec.recorded + '</b> of <b>' + rec.ofTotal + '</b> people in view' : '') +
          ', so the pool cannot be narrowed below the organisation.</span></div>';
      }
      if (!chk) {
        html += '<div class="cx-noresult"><div class="nr-t">No behaviours checked.</div>' +
          '<div class="nr-s">Tick the behaviours you want a partner to cover — the checked-gap average and the ' +
          'ranking of suggestions are both driven by that selection.</div></div>';
      } else if (!cur.covering) {
        var unitTxt = st.simScope === "org" ? "the organisation"
          : (cur.unit ? self._scopeLabel(st.simScope).toLowerCase() + " " + esc(cur.unit) : "this level (no unit recorded for " + esc(first) + ")");
        html += '<div class="cx-noresult"><div class="nr-t">No complement found in ' + unitTxt + '.</div>' +
          '<div class="nr-s">' + (cur.n
            ? "None of the " + cur.n + " people here score higher than " + esc(first) + " on the checked behaviours."
            : "Nobody here is assessed against this role.") +
          (wider.length ? " Widen the search to bring in people from further out." :
            " There is nobody left to bring in — try checking different behaviours.") + '</div>' +
          wider.map(function (s) { return self._widenBtn(s, stats); }).join("") + '</div>';
      }

      html += '<div class="cx-cards">';
      html += '<div class="cx-card cx-focus"><div class="cx-eyebrow">Successor candidate</div>' +
        '<div class="cx-nm">' + esc(f.name) + '</div><div class="cx-ttl">' + esc(f.jobTitle || f.company || "") + '</div>' +
        (self._orgLine(f) ? '<div class="cx-meta">' + self._orgLine(f) + '</div>' : '') +
        '<div class="cx-meta">Role fit <b>' + Math.round(f.roleFit) + '%</b></div>' +
        '<div class="cx-fh"><div class="cx-row"><span class="cx-solo">Solo ' + Math.round(solV) + '%</span><span class="cx-arrow">&rarr;</span>' +
        '<span class="cx-team">' + Math.round(teamV) + '%</span><span class="cx-lift ' + (lift > 0.5 ? "cx-pos" : "") + '">' + liftTxt + '</span></div>' +
        '<div class="cx-cap">Average across all ' + st.behaviours.length + ' behaviours</div>' +
        (chk ? '<div class="cx-checked"><span class="cx-solo">' + Math.round(chk.solo) + '%</span><span class="cx-arrow">&rarr;</span>' +
               '<span class="cx-ct">' + Math.round(chk.team) + '%</span>' +
               '<span class="cx-lift ' + (chk.lift > 0.5 ? "cx-pos" : "") + '">' +
               (chk.lift >= 0 ? "+" : "") + Math.round(chk.lift) + '%</span>' +
               '<span class="cx-cap cx-capin">on the ' + chk.n + ' checked gap' + (chk.n === 1 ? "" : "s") + '</span></div>' : '') +
        '<div class="cx-reading">' + reading + '</div></div></div>';
      comps.forEach(function (p) {
        var ov = self._wavg(function (b) { return p.beh[b.name] || 0; });
        var outside = !self._inScope(p, st.simScope);
        html += '<div class="cx-card cx-on"><button class="cx-remove" data-pk="' + esc(p.pk) + '" title="Remove complement">&times;</button>' +
          '<div class="cx-eyebrow">Complement' +
            (outside ? '<span class="cx-outside">outside ' + esc(self._scopeLabel(st.simScope).toLowerCase()) + '</span>' : '') +
          '</div>' +
          '<div class="cx-nm">' + esc(p.name) + '</div><div class="cx-ttl">' + esc(p.jobTitle || p.company || "") + '</div>' +
          (recIds[p.pk] ? '<div class="cx-rec-line"><span class="cx-rec-pill">Recommended</span></div>' : '') +
          (self._orgLine(p) ? '<div class="cx-meta">' + self._orgLine(p) + '</div>' : '') +
          '<div class="cx-meta">Role fit <b>' + Math.round(p.roleFit) + '%</b> · Overall behaviour <b>' + Math.round(ov) + '%</b></div>' +
          '<div class="cx-gapfit">Avg gain on checked gaps: <b>+' + Math.round(self._simGapFit(p)) + '</b></div></div>';
      });
      html += '</div>';

      var sugg = rank.filter(function (r) { return r.gf > 0 && !st.simComplements[r.e.pk]; }).slice(0, 3);
      if (sugg.length) {
        html += '<div class="cx-suggest"><span class="cx-suggest-lbl">Suggested for the checked gaps</span>' +
          sugg.map(function (r) { return '<button class="cx-sugg" data-pk="' + esc(r.e.pk) + '">' + esc(r.e.name) + ' <span class="cx-sugg-gf">+' + Math.round(r.gf) + '</span></button>'; }).join("") +
          '</div>';
      }

      var thead = '<tr><th>Behaviour</th><th class="cx-num">' + esc(first) + '</th>';
      comps.forEach(function (p) { thead += '<th class="cx-num">' + esc(p.name.split(/\s+/)[0]) + '</th>'; });
      thead += '<th class="cx-num">Effective</th>' +
        '<th class="cx-num" title="Effective minus ' + esc(first) + ' — how much the partners raise this behaviour. Never negative: a weaker partner cannot lower the ceiling.">Gain</th></tr>';
      var body = '';
      st.behaviours.forEach(function (b) {
        var isWeak = !!st.simWeak[b.id], cv = f.beh[b.name] || 0, tv = self._simTeamValue(b.name), g = self._simGain(b.name);
        body += '<tr class="' + (isWeak ? 'cx-weakrow' : '') + '"><td class="cx-beh"><label class="cx-chk"><input type="checkbox" data-sbeh="' + b.id + '"' + (isWeak ? ' checked' : '') + '>' + esc(b.name) + '</label>' + (b.quad ? '<span class="cx-qtag">' + esc(b.quad) + '</span>' : '') + '</td>';
        body += '<td class="cx-num">' + self._simBar(cv) + '</td>';
        comps.forEach(function (p) { body += '<td class="cx-num">' + self._simBar(p.beh[b.name] || 0) + '</td>'; });
        body += '<td class="cx-num">' + self._simBar(tv) + '</td>';
        body += g > 0.5
          ? '<td class="cx-num"><span class="cx-chip cx-p">+' + Math.round(g) + '</span></td>'
          : '<td class="cx-num"><span class="cx-chip cx-z">&mdash;</span></td>';
        body += '</tr>';
      });
      // Footer makes the headline auditable: these averages ARE the Solo -> Team numbers above.
      var foot = '<tr class="cx-totrow"><td>Average — all ' + st.behaviours.length + ' behaviours</td>' +
        '<td class="cx-num">' + Math.round(solV) + '</td>';
      comps.forEach(function (p) { foot += '<td class="cx-num">' + Math.round(self._wavg(function (b) { return p.beh[b.name] || 0; })) + '</td>'; });
      foot += '<td class="cx-num">' + Math.round(teamV) + '</td>' +
        '<td class="cx-num"><span class="cx-chip ' + (lift > 0.5 ? 'cx-p' : 'cx-z') + '">' + (lift > 0.5 ? "+" + Math.round(lift) : "&mdash;") + '</span></td></tr>';
      if (chk) {
        foot += '<tr class="cx-totrow cx-chkrow"><td>Average — ' + chk.n + ' checked gap' + (chk.n === 1 ? "" : "s") + '</td>' +
          '<td class="cx-num">' + Math.round(chk.solo) + '</td>';
        var cbs = this._checkedBehaviours();
        comps.forEach(function (p) { foot += '<td class="cx-num">' + Math.round(self._wavgOver(cbs, function (b) { return p.beh[b.name] || 0; })) + '</td>'; });
        foot += '<td class="cx-num">' + Math.round(chk.team) + '</td>' +
          '<td class="cx-num"><span class="cx-chip ' + (chk.lift > 0.5 ? 'cx-p' : 'cx-z') + '">' + (chk.lift > 0.5 ? "+" + Math.round(chk.lift) : "&mdash;") + '</span></td></tr>';
      }
      html += '<div class="cx-tblwrap"><table><thead>' + thead + '</thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table></div>';
      html += '<p class="cx-footnote"><b>Effective</b> = max(candidate, best selected partner) — the team ceiling, so a weaker partner never lowers it. ' +
        '<b>Gain</b> = Effective &minus; candidate, which is why it is never negative: where a partner scores lower, the ceiling is unchanged and the gain is nil. ' +
        'The headline <b>Solo &rarr; Team</b> is the plain average of those two columns down every behaviour, and its lift is the average Gain — the table footer shows both, so the numbers tie out. ' +
        'Ticking a behaviour marks it a <b>gap to close</b>: that drives the checked-gap average, and ranks suggestions by their average gain on those behaviours (current pool only). ' +
        'Complements start in the successor&#39;s own department and widen outwards; every candidate must be assessed against the same target role, since behaviour scores come from that assessment.</p>';
      html += '</div>';
      panel.innerHTML = html;
    }
  });
})();
