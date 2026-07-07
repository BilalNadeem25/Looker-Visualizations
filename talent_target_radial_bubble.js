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
    --line:#e7ebf1; --line-soft:#f0f3f7; --accent:#35507d;
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
  .nx-count{font-size:12px; color:var(--muted); font-variant-numeric:tabular-nums}
  .nx-rolelbl{font-size:12px; color:var(--muted)} .nx-rolelbl b{color:var(--ink)}
  .nx-legend{margin-left:auto; display:flex; align-items:center; gap:14px; font-size:12px; color:var(--muted)}
  .nx-legend b{color:var(--ink); font-weight:700}
  .nx-chip{display:inline-flex; align-items:center; gap:6px}
  .nx-chip i{width:11px; height:11px; border-radius:50%; display:inline-block}

  .nx-stage{display:flex; flex-direction:column; flex:1 1 auto; min-height:0}
  .nx-chartwrap{flex:1 1 auto; min-width:0; min-height:0; position:relative; padding:6px}
  .nx-wrap.has-cards .nx-chartwrap{flex:0 0 55%}
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

  .nx-panel{flex:0 0 auto; border-top:1px solid var(--line); background:var(--ground); display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); align-content:start; gap:12px; padding:14px; overflow-x:hidden; overflow-y:auto}
  .nx-wrap.has-cards .nx-panel{flex:1 1 auto; min-height:0}
  .nx-cardcol{background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow:hidden; position:relative; box-shadow:0 1px 3px rgba(20,30,45,.05)}
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
  .nx-vs{padding:11px 22px; font-size:11px; color:var(--muted); background:var(--line-soft); border-bottom:1px solid var(--line)}
  .nx-vs b{color:var(--ink)}
  .nx-sec{padding:16px 22px; border-bottom:1px solid var(--line)}
  .nx-sectitle{font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#8c96a3; margin-bottom:13px}
  .nx-quad{margin-bottom:15px} .nx-quad:last-child{margin-bottom:0}
  .nx-quadhead{display:flex; justify-content:space-between; align-items:baseline; font-size:13px; font-weight:700; margin-bottom:6px}
  .nx-quadhead .s{font-variant-numeric:tabular-nums}
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
  @media (max-width:1024px){ .nx-panel{grid-template-columns:repeat(2,minmax(0,1fr))} }
  @media (max-width:760px){
    .nx-wrap.has-cards .nx-chartwrap{flex:0 0 auto; height:360px}
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
        zoom: q(".nx-zoom")
      };
      this.state = {
        employees: [], roleKey: null, selectedUsers: [], search: "",
        maxRoleFit: null, zoom: 1, panX: 0, panY: 0, chartRoot: null,
        panning: false, dragMoved: false, sCX: 0, sCY: 0, sPanX: 0, sPanY: 0
      };
      var self = this, st = this.state, $ = this.$;

      $.slider.addEventListener("input", function () {
        st.maxRoleFit = Number($.slider.value); $.sliderVal.textContent = $.slider.value; self._draw();
      });
      $.search.addEventListener("input", function () {
        st.search = $.search.value.trim().toLowerCase(); self._draw();
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
      }
      $.panel.addEventListener("click", function (e) {
        var b = e.target.closest(".nx-cardremove"); if (!b) return;
        self._toggleUser(b.getAttribute("data-uid")); self._draw();
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
      var roleKey = Object.keys(roleIds).sort().join(",");
      var roleChanged = roleKey !== st.roleKey;
      st.roleKey = roleKey;

      // re-baseline when the role (filter) changes or on first load
      if (roleChanged || st.maxRoleFit == null) {
        st.selectedUsers = [];
        st.zoom = 1; st.panX = 0; st.panY = 0;
        var cfgMax = Number(this._config.default_role_fit_max);
        if (cfgMax > 0) {
          st.maxRoleFit = Math.min(72, cfgMax);
        } else {
          var dataMax = emps.reduce(function (m, e) { return Math.max(m, e.roleFit || 0); }, 0);
          st.maxRoleFit = Math.min(72, Math.max(1, Math.ceil(dataMax)));
        }
      } else {
        // keep only still-present selections
        var present = {}; emps.forEach(function (e) { present[e.userId] = true; });
        st.selectedUsers = st.selectedUsers.filter(function (u) { return present[u]; });
      }
      this.$.slider.value = st.maxRoleFit; this.$.sliderVal.textContent = st.maxRoleFit;

      // role label (single role expected under the Looker filter)
      var names = {}; emps.forEach(function (e) { names[e.roleName] = true; });
      var nameList = Object.keys(names);
      this.$.roleLbl.innerHTML = nameList.length === 1 ? "Target role: <b>" + esc(nameList[0]) + "</b>"
        : (nameList.length > 1 ? "<b>" + nameList.length + " roles</b> in view" : "");

      this._draw();
      if (done) done();
    },

    // ---- match-score + band helpers ----------------------------------------
    _match: function (fit) { var m = this.state.maxRoleFit; return m > 0 ? Math.max(0, Math.min(1, fit / m)) * 100 : 0; },
    _color: function (v) {
      var c = this._config;
      return v >= c.high_band ? c.color_high : v >= c.medium_band ? c.color_medium : c.color_low;
    },
    _toggleUser: function (uid) {
      var a = this.state.selectedUsers, i = a.indexOf(uid);
      if (i >= 0) a.splice(i, 1); else a.push(uid);
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
      var list = st.employees.slice().sort(function (a, b) { return b.roleFit - a.roleFit; });
      this.$.count.textContent = list.length + " employees" + (st.selectedUsers.length ? " · " + st.selectedUsers.length + " selected" : "");
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
        var isSel = st.selectedUsers.indexOf(emp.userId) >= 0;
        var hit = !st.search || emp.name.toLowerCase().indexOf(st.search) >= 0;
        var g = svgEl("g", { class: "nx-bubble" + (isSel ? " sel" : "") });
        g.appendChild(svgEl("circle", { cx: bx, cy: by, r: 9, fill: self._color(m), "fill-opacity": hit ? 0.9 : 0.12, stroke: "#fff", "stroke-width": 1.5 }));
        var ti = svgEl("title", {}); ti.textContent = emp.name + " — " + Math.round(emp.roleFit) + "% role fit"; g.appendChild(ti);
        g.addEventListener("click", function () { if (st.dragMoved) return; self._toggleUser(emp.userId); self._draw(); });
        st.chartRoot.appendChild(g);
      });
      this._renderPanels();
    },

    _renderPanels: function () {
      var self = this, st = this.state, panel = this.$.panel;
      this.$.wrap.classList.toggle("has-cards", st.selectedUsers.length > 0);
      if (!st.selectedUsers.length) {
        panel.innerHTML = '<div class="nx-empty"><p>Click employee bubbles to view and compare their profiles side by side.</p></div>';
        return;
      }
      var byId = {}; st.employees.forEach(function (e) { byId[e.userId] = e; });
      var cols = st.selectedUsers.map(function (uid) {
        var emp = byId[uid]; if (!emp) return "";
        return '<div class="nx-cardcol"><button class="nx-cardremove" data-uid="' + esc(uid) + '" title="Remove from comparison">&times;</button>' + self._cardHTML(emp) + '</div>';
      }).join("");
      panel.innerHTML = cols || '<div class="nx-empty"><p>Click employee bubbles to compare.</p></div>';
    },

    _cardHTML: function (emp) {
      var self = this, fit = Math.round(emp.roleFit), fc = this._color(this._match(emp.roleFit));
      var avatar = emp.picture
        ? '<img class="nx-avatar" src="' + esc(emp.picture) + '" alt="">'
        : '<div class="nx-avatar" style="background:' + fc + '">' + esc(initials(emp.name)) + '</div>';
      var nlen = (emp.name || "").length;
      var nsize = nlen <= 14 ? 16 : nlen <= 22 ? 15 : nlen <= 30 ? 14 : nlen <= 40 ? 13 : 12;

      var quadOrder = ["Leadership", "Agility", "Cultural Fit"], byQuad = {};
      emp.subcompetencies.forEach(function (s) { var q = s.quadrant || s.parent || ""; (byQuad[q] = byQuad[q] || []).push(s); });
      var quadHtml = quadOrder.map(function (q) {
        var score = Math.round(emp.quadrants[q] || 0), col = self._color(emp.quadrants[q] || 0);
        var subs = (byQuad[q] || []).map(function (s) {
          return '<div class="nx-subrow"><span>' + esc(s.name) + '</span><span class="ss">' + Math.round(s.weighted_score || 0) + '%</span></div>';
        }).join("");
        return '<div class="nx-quad"><div class="nx-quadhead"><span>' + esc(q) + '</span><span class="s">' + score + '%</span></div>' +
               '<div class="nx-bar"><i style="width:' + Math.min(100, score) + '%;background:' + col + '"></i></div>' + subs + '</div>';
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
        '<div class="nx-vs">Compared against <b>' + esc(emp.roleName) + '</b></div>' +
        '<div class="nx-sec"><div class="nx-sectitle">Competencies — weighted</div>' + quadHtml + '</div>' +
        '<div class="nx-sec"><div class="nx-sectitle">Skills — match vs required proficiency</div>' + skillsHtml + '</div>';
    }
  });
})();
