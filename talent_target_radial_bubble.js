(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  // ---- pure helpers ---------------------------------------------------------
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function num(v){return v==null||v===""?null:Number(v);}
  function initials(n){return String(n||"?").split(/\s+/).map(function(w){return w[0];}).slice(0,2).join("").toUpperCase();}
  function svgEl(tag,a){var n=document.createElementNS(SVGNS,tag);for(var k in a)n.setAttribute(k,a[k]);return n;}
  function hashStr(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0);}
  function coerceArray(v){
    if(v==null) return [];
    if(Array.isArray(v)) return v;
    if(typeof v==="string"){ try{ var p=JSON.parse(v); return Array.isArray(p)?p:[]; }catch(e){ return []; } }
    if(typeof v==="object") return [v];
    return [];
  }

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
  /* Chart keeps a FIXED pixel height and stays pinned at the top, with or without a
     selection (a % / flex-grow height collapses on Looker's first paint before the tile
     has a resolved height). The cards area below grows as employees are added; the stage
     scrolls. */
  .nx-chartwrap{flex:0 0 440px; min-width:0; min-height:0; overflow:hidden; position:sticky; top:0; background:var(--panel); z-index:2; padding:6px}
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

  .nx-panel{flex:1 1 auto; min-height:0; border-top:1px solid var(--line); background:var(--ground); display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); align-content:start; gap:12px; padding:14px; overflow:visible}
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
  /* ---- simulate mode (complementarity) ---- */
  .nx-seg{display:inline-flex; border:1px solid var(--line); border-radius:9px; overflow:hidden; margin-top:1px}
  .nx-seg button{border:none; background:#fff; color:var(--muted); font-size:12.5px; font-weight:700; padding:7px 13px; cursor:pointer}
  .nx-seg button.on{background:var(--accent); color:#fff}
  .nx-succ-field{display:none}
  .nx-wrap.simmode .nx-succ-field{display:flex}
  .nx-bubble.focus circle{stroke:var(--accent); stroke-width:3}
  .nx-bubble.comp circle{stroke:var(--pos); stroke-width:3}
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
  .cx-rec{position:absolute; top:11px; right:11px; font-size:9px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--accent); background:var(--accent-soft); border-radius:20px; padding:3px 8px}
  .cx-remove{position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%; border:1px solid var(--line); background:#fff; color:#9aa4b0; font-size:14px; line-height:1; cursor:pointer}
  .cx-remove:hover{color:var(--ink); border-color:#c3ccd8}
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
  .cx-reading{font-size:11px; color:var(--muted); margin-top:7px; line-height:1.5}
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
    .nx-chartwrap{flex-basis:360px}
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
        '<div class="nx-field nx-succ-field">' +
          '<label>Successor</label>' +
          '<select class="nx-select nx-succ"></select>' +
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
      default_role_fit_max: { type: "number", label: "Default 'Role fit max' (blank = data max)", default: null, section: "Scale", order: 1 }
    },

    // ---- one-time shell -----------------------------------------------------
    create: function (element, config) {
      element.innerHTML = "<style>" + STYLES + "</style>" + MARKUP;
      var q = function (s) { return element.querySelector(s); };
      this.$ = {
        el: element,
        wrap: q(".nx-wrap"),
        svg: q(".nx-chart"),
        panel: q(".nx-panel"),
        count: q(".nx-count"),
        roleLbl: q(".nx-rolelbl"),
        slider: q(".nx-maxfit"),
        sliderVal: q(".nx-maxfit-val"),
        search: q(".nx-search"),
        mode: q(".nx-mode"),
        succ: q(".nx-succ"),
        zoom: q(".nx-zoom")
      };
      this.state = {
        employees: [], roleKey: null, rolesInView: [], byPair: {}, rolesByUser: {}, userIds: [],
        selectedPairs: [], chartRole: null, openMenuPk: null,
        mode: "compare", behaviours: [], simFocus: null, simComplements: {}, simWeak: {},
        search: "", maxRoleFit: null, zoom: 1, panX: 0, panY: 0, chartRoot: null,
        collapsed: {},   // shared across cards so rows stay aligned when comparing
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
        self._defaultWeak(); self._draw();
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
    },

    // ---- data in ------------------------------------------------------------
    updateAsync: function (data, element, config, queryResponse, details, done) {
      this._config = Object.assign(
        { high_band: 66, medium_band: 33, color_high: "#2fbf71", color_medium: "#f5a623", color_low: "#e8503a", default_role_fit_max: null },
        config || {});

      var fields = (queryResponse && queryResponse.fields) || {};
      var all = [].concat(fields.dimensions || [], fields.measures || [], fields.table_calculations || []);
      var map = {};
      ["user_id","name","job_title","current_company","picture","country","target_role_id","target_role_name",
       "role_fit","leadership_score","agility_score","cultural_fit_score","technical_score",
       "subcompetencies_json","skills_json","bench_strength","manager_name","performance_year","performance_rating"]
      .forEach(function (k) {
        var f = all.find(function (x) { return x.name.split(".").pop() === k || x.name === k; });
        map[k] = f ? f.name : null;
      });
      var val = function (row, k) { var fn = map[k]; return (fn && row[fn]) ? row[fn].value : null; };

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
          skills: coerceArray(val(row, "skills_json"))
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
      } else {
        Object.keys(st.simComplements).forEach(function (pk) {
          if (!st.byPair[pk] || st.byPair[pk].roleId !== st.chartRole) delete st.simComplements[pk];
        });
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

      // one bubble per employee assessed against the selected chart role
      var chartRole = st.chartRole;
      var list = st.employees.filter(function (e) { return e.roleId === chartRole; })
                             .sort(function (a, b) { return b.roleFit - a.roleFit; });
      var notAssessed = st.userIds.length - list.length;
      if (st.mode === "simulate") {
        var cc = this._simComplementEmps().length;
        this.$.count.textContent = list.length + " employees · successor + " + cc + " complement" + (cc === 1 ? "" : "s");
      } else {
        this.$.count.textContent = list.length + " employees" +
          (notAssessed > 0 ? " · " + notAssessed + " not assessed for this role" : "") +
          (st.selectedPairs.length ? " · " + st.selectedPairs.length + " selected" : "");
      }

      var W = 760, H = 504; svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var cx = W / 2, cy = H / 2, maxR = Math.min(W, H) / 2 - 34;
      st.chartRoot = svgEl("g", {}); svg.appendChild(st.chartRoot); this._applyTransform();
      [1, 0.75, 0.5, 0.25].forEach(function (f) {
        st.chartRoot.appendChild(svgEl("circle", { class: "nx-ring", cx: cx, cy: cy, r: maxR * f }));
        var lb = svgEl("text", { class: "nx-ring-label", x: cx + 4, y: cy - maxR * f + 13 }); lb.textContent = Math.round((1 - f) * 100) + "%"; st.chartRoot.appendChild(lb);
      });
      list.forEach(function (emp) {
        var m = Math.max(0, Math.min(100, self._match(emp.roleFit))), r = maxR * (1 - m / 100);
        var ang = emp.angle, bx = cx + r * Math.cos(ang), by = cy + r * Math.sin(ang);
        if (r < 4) { bx = cx; by = cy; }
        var sim = st.mode === "simulate";
        var isFocus = sim && emp.pk === st.simFocus;
        var isComp = sim && !isFocus && !!st.simComplements[emp.pk];
        var cls = "nx-bubble";
        if (isFocus) cls += " focus";
        else if (isComp) cls += " comp";
        else if (!sim && st.selectedPairs.indexOf(emp.pk) >= 0) cls += " sel";
        var nodeR = (isFocus || isComp) ? 6 : 2;   // enlarge successor + complements so they're findable/clickable
        var hit = !st.search || emp.name.toLowerCase().indexOf(st.search) >= 0;
        var g = svgEl("g", { class: cls });
        g.appendChild(svgEl("circle", { cx: bx, cy: by, r: nodeR, fill: self._color(m), "fill-opacity": hit ? 0.9 : 0.12, stroke: "#fff", "stroke-width": 0.5 }));
        var ti = svgEl("title", {}); ti.textContent = emp.name + " — " + Math.round(emp.roleFit) + "% role fit"; g.appendChild(ti);
        g.addEventListener("click", function () {
          if (st.dragMoved) return;
          if (st.mode === "simulate") { self._toggleComplement(emp.pk); self._draw(); }
          else { self._togglePair(emp.pk); self._draw(); }
        });
        st.chartRoot.appendChild(g);
      });
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
        '</div>';
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
    _wavg: function (fn) { var bs = this.state.behaviours, s = 0, w = 0; bs.forEach(function (b) { s += b.w * fn(b); w += b.w; }); return w ? s / w : 0; },
    _simSolo: function () { var f = this._simFocusEmp(); return this._wavg(function (b) { return f.beh[b.name] || 0; }); },
    _simTeamValue: function (bname) {
      var f = this._simFocusEmp(), bp = this._bestPartner(bname), cv = f.beh[bname] || 0;
      return bp == null ? cv : Math.max(cv, bp);   // ceiling: lean on whoever is strongest
    },
    _simHeadline: function () { var self = this; return this._wavg(function (b) { return self._simTeamValue(b.name); }); },
    _simDelta: function (bname) { var f = this._simFocusEmp(), bp = this._bestPartner(bname); return bp == null ? null : bp - (f.beh[bname] || 0); },
    _simGapFit: function (emp) {
      var st = this.state, f = this._simFocusEmp(), s = 0;
      st.behaviours.forEach(function (b) { if (st.simWeak[b.id]) s += b.w * Math.max(0, (emp.beh[b.name] || 0) - (f.beh[b.name] || 0)); });
      return s;
    },
    _simRanked: function () {
      var self = this, st = this.state;
      return st.employees.filter(function (e) { return e.roleId === st.chartRole && e.pk !== st.simFocus; })
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

    _renderSim: function () {
      var self = this, st = this.state, panel = this.$.panel;
      var f = this._simFocusEmp();
      if (!f || !st.behaviours.length) {
        panel.innerHTML = '<div class="nx-empty"><p>No behaviour data for this role. Simulate mode needs the subcompetencies field, filtered to a single target role.</p></div>';
        return;
      }
      var rank = this._simRanked();
      var recIds = {}; rank.filter(function (r) { return r.gf > 0; }).slice(0, 2).forEach(function (r) { recIds[r.e.pk] = true; });
      var comps = this._simComplementEmps();
      var first = f.name.split(/\s+/)[0];
      var solV = this._simSolo(), teamV = this._simHeadline(), lift = teamV - solV;
      var liftTxt = (lift >= 0 ? "+" : "") + Math.round(lift) + "%";
      var reading = comps.length
        ? ("Partners can coach " + esc(first) + " on the green behaviours where they rank higher.")
        : "Click bubbles above, or a suggestion below, to add complements.";

      var html = '<div class="cx-shell"><div class="cx-cards">';
      html += '<div class="cx-card cx-focus"><div class="cx-eyebrow">Successor candidate</div>' +
        '<div class="cx-nm">' + esc(f.name) + '</div><div class="cx-ttl">' + esc(f.jobTitle || f.company || "") + '</div>' +
        '<div class="cx-meta">Role fit <b>' + Math.round(f.roleFit) + '%</b></div>' +
        '<div class="cx-fh"><div class="cx-row"><span class="cx-solo">Solo ' + Math.round(solV) + '%</span><span class="cx-arrow">&rarr;</span>' +
        '<span class="cx-team">' + Math.round(teamV) + '%</span><span class="cx-lift ' + (lift > 0.5 ? "cx-pos" : "") + '">' + liftTxt + '</span></div>' +
        '<div class="cx-cap">Combined behaviour profile</div><div class="cx-reading">' + reading + '</div></div></div>';
      comps.forEach(function (p) {
        var ov = self._wavg(function (b) { return p.beh[b.name] || 0; });
        html += '<div class="cx-card cx-on"><button class="cx-remove" data-pk="' + esc(p.pk) + '" title="Remove complement">&times;</button>' +
          (recIds[p.pk] ? '<div class="cx-rec">Recommended</div>' : '') +
          '<div class="cx-eyebrow">Complement</div><div class="cx-nm">' + esc(p.name) + '</div><div class="cx-ttl">' + esc(p.jobTitle || p.company || "") + '</div>' +
          '<div class="cx-meta">Role fit <b>' + Math.round(p.roleFit) + '%</b> · Overall behaviour <b>' + Math.round(ov) + '%</b></div>' +
          '<div class="cx-gapfit">Covers selected gaps: <b>+' + Math.round(self._simGapFit(p)) + '</b></div></div>';
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
      thead += '<th class="cx-num">Effective</th><th class="cx-num">&Delta;</th></tr>';
      var body = '';
      st.behaviours.forEach(function (b) {
        var isWeak = !!st.simWeak[b.id], cv = f.beh[b.name] || 0, tv = self._simTeamValue(b.name), d = self._simDelta(b.name);
        body += '<tr class="' + (isWeak ? 'cx-weakrow' : '') + '"><td class="cx-beh"><label class="cx-chk"><input type="checkbox" data-sbeh="' + b.id + '"' + (isWeak ? ' checked' : '') + '>' + esc(b.name) + '</label>' + (b.quad ? '<span class="cx-qtag">' + esc(b.quad) + '</span>' : '') + '</td>';
        body += '<td class="cx-num">' + self._simBar(cv) + '</td>';
        comps.forEach(function (p) { body += '<td class="cx-num">' + self._simBar(p.beh[b.name] || 0) + '</td>'; });
        body += '<td class="cx-num">' + self._simBar(tv) + '</td>';
        body += d == null ? '<td class="cx-num"><span class="cx-chip cx-z">&mdash;</span></td>'
          : '<td class="cx-num"><span class="cx-chip ' + (d > 0 ? 'cx-p' : d < 0 ? 'cx-n' : 'cx-z') + '">' + (d > 0 ? '+' : '') + Math.round(d) + '</span></td>';
        body += '</tr>';
      });
      html += '<div class="cx-tblwrap"><table><thead>' + thead + '</thead><tbody>' + body + '</tbody></table></div>';
      html += '<p class="cx-footnote">Bar = the candidate&#39;s own score per behaviour. <b>Effective</b> = max(candidate, best selected partner) — the team ceiling, so a weaker partner never lowers it. Suggestions rank by coverage of the <b>checked</b> behaviours.</p>';
      html += '</div>';
      panel.innerHTML = html;
    }
  });
})();
