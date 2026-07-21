(function () {

  function init() {
    looker.plugins.visualizations.add({

      options: {
        color_high: {
          label: 'High / Low Risk',
          default: '#81e84c',
          type: 'string',
          display: 'color',
          section: 'Colors'
        },
        color_medium: {
          label: 'Medium / Mid Risk',
          default: '#e2e829',
          type: 'string',
          display: 'color',
          section: 'Colors'
        },
        color_low: {
          label: 'Low / High Risk',
          default: '#e74c3c',
          type: 'string',
          display: 'color',
          section: 'Colors'
        },
        color_na: {
          label: 'N/A',
          default: '#95a5a6',
          type: 'string',
          display: 'color',
          section: 'Colors'
        },
        color_mode: {
          label: 'Color nodes by',
          default: 'org_health',
          type: 'string',
          display: 'select',
          values: [
            { 'Org Health Index': 'org_health' },
            { 'Bench Risk': 'bench_risk' }
          ],
          section: 'Colors'
        }
      },

      create(element, config) {
        element.innerHTML = '';
        element.style.cssText = 'position:relative; width:100%; height:100%; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

        const style = document.createElement('style');
        style.textContent = `
          .to-toggle { position:absolute; top:10px; left:10px; display:flex; gap:6px; background:rgba(255,255,255,0.95); padding:5px 9px; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.12); z-index:10; align-items:center; }
          .to-toggle span { font-size:11px; color:#888; }
          .to-btn { font-size:11px; padding:3px 8px; border-radius:4px; border:1px solid #ddd; background:#fff; cursor:pointer; color:#555; }
          .to-btn.active { background:#3498db; color:#fff; border-color:#3498db; }
          .to-color-legend { position:absolute; bottom:10px; left:10px; display:flex; gap:12px; background:rgba(255,255,255,0.95); padding:6px 11px; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.12); }
          .to-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#555; }
          .to-legend-dot { width:8px; height:8px; border-radius:50%; }
          .to-zoom { position:absolute; top:10px; right:10px; display:flex; flex-direction:column; gap:4px; z-index:10; }
          .to-zoom-btn { width:28px; height:28px; border:1px solid #ddd; background:#fff; border-radius:5px; font-size:15px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
          .to-zoom-btn:hover { background:#f0f0f0; }
          .to-tooltip { position:fixed; pointer-events:none; background:#262D33; border-radius:4px; box-shadow:0 4px 20px rgba(0,0,0,0.35); padding:12px 14px; min-width:200px; max-width:240px; font-size:12px; font-family:Roboto,'Noto Sans','Noto Sans JP','Noto Sans CJK KR','Noto Sans Arabic UI','Noto Sans Devanagari UI','Noto Sans Hebrew','Noto Sans Thai UI',Helvetica,Arial,sans-serif; z-index:1000; opacity:0; transition:opacity 0.15s ease; color:#fff; }
          .to-tooltip.visible { opacity:1; }
          .to-tt-header { display:flex; align-items:center; gap:9px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.12); }
          .to-tt-avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:bold; flex-shrink:0; }
          .to-tt-name { font-weight:700; font-size:12px; color:#fff; }
          .to-tt-role { font-size:12px; color:rgba(255,255,255,0.6); margin-top:1px; }
          .to-tt-row { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:3px 0; }
          .to-tt-label { color:rgba(255,255,255,0.5); font-size:12px; white-space:nowrap; flex-shrink:0; }
          .to-tt-value { color:#fff; font-size:12px; font-weight:500; text-align:right; word-break:break-word; }
          .to-tt-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#fff; }
          .to-tt-dot { width:8px; height:8px; border-radius:50%; }
          .to-score-wrap { background:rgba(255,255,255,0.15); border-radius:3px; height:5px; overflow:hidden; width:70px; }
          .to-score-bar { height:100%; border-radius:3px; }
          .to-summary { position:absolute; bottom:10px; right:10px; background:rgba(255,255,255,0.95); border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.12); padding:10px 14px; font-size:11px; color:#444; min-width:200px; z-index:10; }
          .to-summary-title { font-weight:700; font-size:11px; color:#222; margin-bottom:6px; padding-bottom:5px; border-bottom:1px solid #eee; }
          .to-summary-row { display:flex; justify-content:space-between; padding:2px 0; gap:16px; }
          .to-summary-label { color:#888; }
          .to-summary-value { font-weight:600; color:#222; }
          .to-summary-section { margin-top:6px; padding-top:5px; border-top:1px solid #eee; }
          .to-summary-section-title { font-weight:600; color:#555; margin-bottom:3px; }
          .to-summary-dot-row { display:flex; align-items:center; justify-content:space-between; padding:2px 0; gap:8px; }
          .to-summary-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
          .to-search { position:absolute; top:10px; left:50%; transform:translateX(-50%); z-index:10; display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.95); padding:5px 9px; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.12); }
          .to-search input { border:1px solid #ddd; border-radius:4px; padding:3px 8px; font-size:11px; outline:none; width:180px; color:#333; }
          .to-search input:focus { border-color:#3498db; }
          .to-search-clear { font-size:13px; color:#aaa; cursor:pointer; line-height:1; padding:0 2px; }
          .to-search-clear:hover { color:#555; }
          .to-node-label rect { fill:#fff; stroke:#ddd; stroke-width:1; rx:3; }
          .to-node-label-role { font-size:11px; font-weight:700; fill:#222; }
          .to-node-label-name { font-size:10px; fill:#777; }
          .to-btn:disabled { cursor:default; opacity:0.45; }
          .to-btn.scenario-on { background:#8e44ad; color:#fff; border-color:#8e44ad; }
          .to-action { position:fixed; background:#262D33; border-radius:6px; box-shadow:0 4px 20px rgba(0,0,0,0.35); padding:12px 14px; min-width:230px; max-width:270px; font-size:12px; font-family:Roboto,'Noto Sans',Helvetica,Arial,sans-serif; z-index:1001; opacity:0; pointer-events:none; transition:opacity 0.12s ease; color:#fff; }
          .to-action.visible { opacity:1; pointer-events:auto; }
          .to-act-row { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:5px 0; }
          .to-stepper { display:flex; align-items:center; gap:6px; }
          .to-step-btn { width:22px; height:22px; border-radius:4px; border:1px solid rgba(255,255,255,0.25); background:rgba(255,255,255,0.08); color:#fff; cursor:pointer; font-size:14px; line-height:1; }
          .to-step-btn:hover { background:rgba(255,255,255,0.2); }
          .to-step-val { min-width:16px; text-align:center; font-size:13px; }
          .to-step-target { color:rgba(255,255,255,0.5); font-size:11px; }
          .to-act-btn { font-size:11px; padding:4px 9px; border-radius:4px; border:1px solid rgba(255,255,255,0.25); background:rgba(255,255,255,0.08); color:#fff; cursor:pointer; }
          .to-act-btn:hover { background:rgba(255,255,255,0.2); }
          .to-act-btn.danger { background:#e74c3c; border-color:#e74c3c; }
          .to-act-note { color:rgba(255,255,255,0.6); font-size:11px; padding:5px 0; }
          .to-delta-tag { color:rgba(255,255,255,0.5); font-size:10px; margin-left:5px; }
          .to-impact { margin-top:8px; padding:8px 10px; border:1px solid; border-radius:5px; background:rgba(255,255,255,0.04); }
          .to-impact-sev { font-weight:700; font-size:11px; margin-bottom:5px; letter-spacing:0.4px; }
          .to-impact-row { display:flex; justify-content:space-between; font-size:11px; padding:1px 0; color:rgba(255,255,255,0.8); }
          .to-impact-row b { color:#fff; }
          .to-act-foot { margin-top:8px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.12); text-align:right; }
          .to-act-link { background:none; border:none; color:#7fb3ff; cursor:pointer; font-size:11px; padding:0; }
          .to-arrow { font-weight:700; }
          .to-arrow.good { color:#27ae60; }
          .to-arrow.bad { color:#e74c3c; }
          .to-arrow.flat { color:#999; font-weight:600; }

          /* ── Employee card (right-docked, opens on node click) ── */
          .to-empcard { position:absolute; top:10px; right:10px; bottom:10px; width:290px; background:#fff; border-radius:8px; box-shadow:0 2px 16px rgba(0,0,0,0.18); z-index:20; display:none; flex-direction:column; overflow:hidden; }
          .to-empcard.visible { display:flex; }
          .to-ec-head { position:relative; padding:20px 16px 15px; text-align:center; border-bottom:1px solid #eee; flex-shrink:0; }
          .to-ec-close { position:absolute; top:10px; right:12px; cursor:pointer; color:#b0b0b0; font-size:15px; line-height:1; }
          .to-ec-close:hover { color:#555; }
          .to-ec-avatar { width:58px; height:58px; border-radius:50%; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:21px; font-weight:700; }
          .to-ec-name { font-weight:700; font-size:15px; color:#222; }
          .to-ec-role { font-size:12px; color:#8a8a8a; margin-top:2px; }
          .to-ec-stats { padding:10px 16px 14px; flex-shrink:0; }
          .to-ec-stat { display:flex; justify-content:space-between; align-items:center; padding:6px 0; font-size:12px; }
          .to-ec-stat > span { color:#8a8a8a; }
          .to-ec-stat > b { color:#222; font-weight:600; display:flex; align-items:center; gap:6px; }
          .to-ec-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }
          .to-ec-succ { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; border-top:6px solid #f4f5f7; }
          .to-ec-succ-title { padding:12px 16px 8px; font-weight:700; font-size:12px; color:#333; flex-shrink:0; }
          .to-ec-succ-list { overflow-y:auto; padding:0 16px 14px; }
          .to-ec-succ-item { padding:7px 0; font-size:12px; color:#444; border-bottom:1px solid #f1f1f1; display:flex; align-items:center; gap:9px; }
          .to-ec-succ-item:last-child { border-bottom:none; }
          .to-ec-succ-av { width:24px; height:24px; border-radius:50%; background:#e8eaed; color:#667; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; }
          .to-ec-succ-empty { padding:12px 16px; color:#aaa; font-size:12px; }
        `;
        element.appendChild(style);

        const toggle = document.createElement('div');
        toggle.className = 'to-toggle';
        toggle.innerHTML = `
          <span>Color by:</span>
          <button class="to-btn active" id="to-btn-ohi">Org Health Index</button>
          <button class="to-btn" id="to-btn-bench-risk">Bench Risk</button>
          <span style="width:1px;height:16px;background:#e0e0e0;margin:0 2px;"></span>
          <button class="to-btn" id="to-btn-scenario" title="Simulate bench-risk changes">Simulate</button>
          <button class="to-btn" id="to-btn-reset" style="display:none;">↺ Reset</button>
        `;
        element.appendChild(toggle);

        const colorLegend = document.createElement('div');
        colorLegend.className = 'to-color-legend';
        colorLegend.id = 'to-color-legend';
        element.appendChild(colorLegend);

        const summary = document.createElement('div');
        summary.className = 'to-summary';
        summary.id = 'to-summary';
        element.appendChild(summary);

        const zoomEl = document.createElement('div');
        zoomEl.className = 'to-zoom';
        zoomEl.innerHTML = `
          <button class="to-zoom-btn" id="to-zoom-in">+</button>
          <button class="to-zoom-btn" id="to-zoom-out">−</button>
          <button class="to-zoom-btn" id="to-zoom-reset" style="font-size:11px;">⊙</button>
        `;
        element.appendChild(zoomEl);

        const searchEl = document.createElement('div');
        searchEl.className = 'to-search';
        searchEl.innerHTML = `
          <span style="font-size:11px;color:#888;">🔍</span>
          <input type="text" id="to-search-input" placeholder="Search employee or role…">
          <span class="to-search-clear" id="to-search-clear" title="Clear">✕</span>
        `;
        element.appendChild(searchEl);

        const chart = document.createElement('div');
        chart.id = 'to-chart';
        chart.style.cssText = 'position:absolute; inset:0;';
        element.appendChild(chart);

        const tooltip = document.createElement('div');
        tooltip.className = 'to-tooltip';
        tooltip.id = 'to-tooltip';
        document.body.appendChild(tooltip);

        const action = document.createElement('div');
        action.className = 'to-action';
        action.id = 'to-action';
        action.addEventListener('click', e => e.stopPropagation());
        document.body.appendChild(action);

        const empcard = document.createElement('div');
        empcard.className = 'to-empcard';
        empcard.id = 'to-empcard';
        empcard.addEventListener('click', e => e.stopPropagation());
        element.appendChild(empcard);

        this._chart        = chart;
        this._tooltip      = tooltip;
        this._action       = action;
        this._empcard      = empcard;
        this._colorMode    = 'org_health';
        this._scenarioMode = false;
        this._scenario     = new Map();
        this._svg          = null;
        this._nodeG        = null;
        this._zoom         = null;
        this._initT        = null;

        document.addEventListener('click', () => {
          tooltip.classList.remove('visible');
          action.classList.remove('visible');
          if (this._nodeG) this._nodeG.selectAll('.to-node-circle').attr('stroke', 'none');
        });
      },

      updateAsync(data, element, config, queryResponse, details, done) {
        this._chart.querySelectorAll('svg').forEach(el => el.remove());

        const fields     = [...queryResponse.fields.dimension_like, ...queryResponse.fields.measure_like];
        const fieldNames = fields.map(f => f.name);

        const pick = (row, keyword) => {
          const key = fieldNames.find(f => {
            const lower = f.toLowerCase();
            return lower === keyword || lower.endsWith('.' + keyword);
          });
          if (!key) return undefined;
          const cell = row[key];
          return cell && typeof cell === 'object' && 'value' in cell ? cell.value : cell;
        };

        const normBench = v => {
          if (v === null || v === undefined) return 'N/A';
          const s = String(v).toLowerCase().trim();
          if (s === 'high'   || s === '3') return 'High';
          if (s === 'medium' || s === '2') return 'Medium';
          if (s === 'low'    || s === '1') return 'Low';
          return 'N/A';
        };

        const normBenchRisk = v => {
          if (v === null || v === undefined) return 'N/A';
          const s = String(v).toLowerCase().trim();
          if (s === 'low'    || s === 'low risk'  || s === '1') return 'Low Risk';
          if (s === 'medium' || s === 'mid risk'  || s === '2') return 'Mid Risk';
          if (s === 'high'   || s === 'high risk' || s === '3') return 'High Risk';
          return 'N/A';
        };

        const toNum = v => {
          if (v === null || v === undefined || v === '') return null;
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };

        const nodes = data.map(row => ({
          talent_role_id:             String(pick(row, 'talent_role_id') ?? ''),
          parent_talent_role_id:      (v => (v != null && v !== '' && v !== 'null') ? String(v) : null)(pick(row, 'parent_talent_role_id')),
          employee_name:              pick(row, 'employee_name') ?? pick(row, 'name') ?? '—',
          talent_role_name:           pick(row, 'talent_role_name') ?? pick(row, 'role_name') ?? '—',
          parent_talent_role_name:    pick(row, 'parent_talent_role_name') ?? null,
          client_name:                pick(row, 'client_name') ?? '—',
          bench_strength:             normBench(pick(row, 'bench_strength')),
          bench_risk:                 normBenchRisk(pick(row, 'bench_risk')),
          is_mission_critical_position: pick(row, 'is_mission_critical_position'),
          is_talent:                  pick(row, 'is_talent'),
          role_fit_score:             pick(row, 'role_fit_score'),
          org_health_index:           pick(row, 'org_health_index') ?? 'N/A',
          successors_count:           toNum(pick(row, 'successors_count_value') ?? pick(row, 'successors_count')),
          bench_strength_target:      toNum(pick(row, 'bench_strength_target')  ?? pick(row, 'bench_strength')),
          successor_names:            pick(row, 'successor_names') ?? null
        }));

        if (!nodes.length) { done(); return; }

        // When Looker filters remove rows, some nodes may reference a parent
        // that is no longer in the dataset. Promote those nodes to roots, then
        // wrap multiple roots under a single synthetic root so stratify succeeds.
        const idSet = new Set(nodes.map(n => n.talent_role_id));
        nodes.forEach(n => {
          if (n.parent_talent_role_id && !idSet.has(n.parent_talent_role_id)) {
            n.parent_talent_role_id = null;
          }
        });
        const roots = nodes.filter(n => !n.parent_talent_role_id);
        if (roots.length > 1) {
          nodes.unshift({
            talent_role_id: '__root__', parent_talent_role_id: null,
            employee_name: '', talent_role_name: '', parent_talent_role_name: null,
            org_health_index: 'N/A', bench_risk: 'N/A',
            is_mission_critical_position: false, is_talent: false, role_fit_score: null
          });
          roots.forEach(n => { n.parent_talent_role_id = '__root__'; });
        }

        const OHI_COLORS = {
          High:   config.color_high   || '#81e84c',
          Medium: config.color_medium || '#e2e829',
          Low:    config.color_low    || '#e74c3c',
          'N/A':  config.color_na     || '#95a5a6'
        };
        const BENCH_RISK_COLORS = {
          'Low Risk':  config.color_high   || '#81e84c',
          'Mid Risk':  config.color_medium || '#e2e829',
          'High Risk': config.color_low    || '#e74c3c',
          'N/A':       config.color_na     || '#95a5a6'
        };

        // keep the simulation view across Looker re-renders (resize / cross-filter)
        if (!this._scenarioMode) this._colorMode = config.color_mode || 'org_health';

        const isTruthy = v => v === true || v === 1 || (typeof v === 'string' && v.toLowerCase() === 'yes') || v === 'true';

        // ── Bench-risk simulation engine (mirrors the LookML CASE) ──
        const DEFAULT_TARGET = 2;
        const computeBenchRisk = (succ, target) => {
          if (target == null || isNaN(target) || target <= 0) return 'N/A';
          if (succ >= target)     return 'Low Risk';
          if (succ >= target / 2) return 'Mid Risk';
          return 'High Risk';
        };
        const bandToSuccessors = (band, target) => {
          if (band === 'Low Risk') return target;
          if (band === 'Mid Risk') return Math.max(1, Math.ceil(target / 2));
          return 0;
        };

        const scenario = this._scenario;
        nodes.forEach(n => {
          if (n.talent_role_id === '__root__') {
            n._benchTarget = null; n._baselineTarget = null; n._baselineBand = 'N/A'; n._baselineSuccessors = 0;
            n._simSuccessors = 0; n._vacant = false; n._simBand = 'N/A';
            return;
          }
          const baseTarget = (n.bench_strength_target != null && n.bench_strength_target > 0)
            ? n.bench_strength_target : DEFAULT_TARGET;
          // Baseline band: recompute from raw inputs when available, else trust the server value.
          const baseBand = (n.successors_count != null && n.bench_strength_target != null && n.bench_strength_target > 0)
            ? computeBenchRisk(n.successors_count, n.bench_strength_target)
            : (n.bench_risk || 'N/A');
          n._baselineTarget = baseTarget;
          n._baselineBand = baseBand;
          n._baselineSuccessors = (n.successors_count != null)
            ? n.successors_count : bandToSuccessors(baseBand, baseTarget);
          // Re-apply any active scenario override for this role after re-render.
          const ov = scenario.get(n.talent_role_id);
          n._simSuccessors = ov ? ov.simSuccessors : n._baselineSuccessors;
          n._benchTarget   = (ov && ov.simTarget != null) ? ov.simTarget : baseTarget;
          n._vacant        = ov ? !!ov.vacant : false;
          n._simBand       = computeBenchRisk(n._simSuccessors, n._benchTarget);
        });

        const nodeColor = d => {
          if (this._scenarioMode) {
            if (d.data._vacant) return '#ffffff';
            return BENCH_RISK_COLORS[d.data._simBand] || BENCH_RISK_COLORS['N/A'];
          }
          if (this._colorMode === 'bench_risk') {
            return BENCH_RISK_COLORS[d.data._baselineBand] || BENCH_RISK_COLORS['N/A'];
          }
          return OHI_COLORS[d.data.org_health_index] || OHI_COLORS['N/A'];
        };

        const renderColorLegend = () => {
          const scheme = this._colorMode === 'bench_risk' ? BENCH_RISK_COLORS : OHI_COLORS;
          document.getElementById('to-color-legend').innerHTML = Object.entries(scheme)
            .map(([k, c]) => `<div class="to-legend-item"><div class="to-legend-dot" style="background:${c}"></div>${k}</div>`)
            .join('');
        };
        renderColorLegend();

        // ── Summary / scenario delta ───────────────────────────────
        const dot = color => `<span class="to-summary-dot" style="background:${color}"></span>`;
        const realNodes = () => nodes.filter(n => n.talent_role_id !== '__root__');

        const renderSummary = () => {
          const rn = realNodes();
          const ohiGroups = { High: 0, Medium: 0, Low: 0, 'N/A': 0 };
          rn.forEach(n => { const o = n.org_health_index || 'N/A'; if (o in ohiGroups) ohiGroups[o]++; else ohiGroups['N/A']++; });
          const benchOf = key => {
            const g2 = { 'Low Risk': 0, 'Mid Risk': 0, 'High Risk': 0, 'N/A': 0 };
            rn.forEach(n => { const b = n[key] || 'N/A'; if (b in g2) g2[b]++; else g2['N/A']++; });
            return g2;
          };
          const el = document.getElementById('to-summary');

          if (!this._scenarioMode) {
            const br = benchOf('_baselineBand');
            el.innerHTML = `
              <div class="to-summary-title">Summary</div>
              <div class="to-summary-row"><span class="to-summary-label">Employees</span><span class="to-summary-value">${rn.length}</span></div>
              <div class="to-summary-row"><span class="to-summary-label">MCP</span><span class="to-summary-value">${rn.filter(n => isTruthy(n.is_mission_critical_position)).length}</span></div>
              <div class="to-summary-row"><span class="to-summary-label">Critical Talents</span><span class="to-summary-value">${rn.filter(n => isTruthy(n.is_talent)).length}</span></div>
              <div class="to-summary-section">
                <div class="to-summary-section-title">Org Health Index</div>
                ${Object.entries(ohiGroups).map(([k, v]) => `
                  <div class="to-summary-dot-row">
                    <span style="display:flex;align-items:center;gap:5px;">${dot(OHI_COLORS[k] || '#95a5a6')}<span class="to-summary-label">${k}</span></span>
                    <span class="to-summary-value">${v}</span>
                  </div>`).join('')}
              </div>
              <div class="to-summary-section">
                <div class="to-summary-section-title">Bench Risk</div>
                ${Object.entries(br).map(([k, v]) => `
                  <div class="to-summary-dot-row">
                    <span style="display:flex;align-items:center;gap:5px;">${dot(BENCH_RISK_COLORS[k] || '#95a5a6')}<span class="to-summary-label">${k}</span></span>
                    <span class="to-summary-value">${v}</span>
                  </div>`).join('')}
              </div>`;
            return;
          }

          // Scenario mode: baseline → scenario with directional arrows.
          const base = benchOf('_baselineBand');
          const scen = benchOf('_simBand');
          const arrow = (a, b, goodDown = true) => {
            if (a === b) return `<span class="to-arrow flat">${b}</span>`;
            const better = goodDown ? b < a : b > a;
            const sym = b < a ? '▼' : '▲';
            return `<span class="to-arrow ${better ? 'good' : 'bad'}">${b} ${sym}</span>`;
          };
          const goodDown = { 'Low Risk': false, 'Mid Risk': true, 'High Risk': true, 'N/A': true };
          const hrMcpBase = rn.filter(n => isTruthy(n.is_mission_critical_position) && n._baselineBand === 'High Risk').length;
          const hrMcpScen = rn.filter(n => isTruthy(n.is_mission_critical_position) && n._simBand === 'High Risk').length;
          const gaps = rn.filter(n => n._vacant).length;

          el.innerHTML = `
            <div class="to-summary-title">Scenario vs Baseline</div>
            <div class="to-summary-section-title">Bench Risk</div>
            ${['Low Risk', 'Mid Risk', 'High Risk', 'N/A'].map(k => `
              <div class="to-summary-dot-row">
                <span style="display:flex;align-items:center;gap:5px;">${dot(BENCH_RISK_COLORS[k])}<span class="to-summary-label">${k}</span></span>
                <span class="to-summary-value">${base[k]} → ${arrow(base[k], scen[k], goodDown[k])}</span>
              </div>`).join('')}
            <div class="to-summary-section">
              <div class="to-summary-dot-row"><span class="to-summary-label">High-risk MCPs</span><span class="to-summary-value">${hrMcpBase} → ${arrow(hrMcpBase, hrMcpScen, true)}</span></div>
              <div class="to-summary-dot-row"><span class="to-summary-label">Manager gaps</span><span class="to-summary-value">${gaps}</span></div>
            </div>
            <div class="to-summary-section" style="color:#888;font-size:10px;">Click a role to add successors or simulate a departure.</div>`;
        };

        // ── Build tree ─────────────────────────────────────────────
        let root;
        try {
          root = d3.stratify()
            .id(d => d.talent_role_id)
            .parentId(d => d.parent_talent_role_id)(nodes);
        } catch (e) {
          this._chart.innerHTML = `<p style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:red;font-size:13px;text-align:center;z-index:99;">Tree error: ${e.message}<br><br>Check browser console (F12) for details.</p>`;
          console.error('[talent-org-chart] stratify error:', e);
          done();
          return;
        }

        const W  = this._chart.offsetWidth  || 800;
        const H  = this._chart.offsetHeight || 600;
        const cx = W / 2;
        const cy = H / 2;

        const leafCount = root.leaves().length;
        const minRadius = Math.min(W, H) / 2 - 60;
        const radius    = Math.max(minRadius, (leafCount * 22) / (2 * Math.PI));
        const fitScale  = Math.min(1, (Math.min(W, H) - 80) / (radius * 2 + 120));

        const svg = d3.select(this._chart).append('svg').attr('width', W).attr('height', H);
        const g   = svg.append('g');
        this._svg = svg;

        const zoomBehavior = d3.zoom().scaleExtent([0.05, 4]).on('zoom', e => g.attr('transform', e.transform));
        svg.call(zoomBehavior).on('dblclick.zoom', null);
        this._zoom  = zoomBehavior;
        this._initT = d3.zoomIdentity.translate(cx, cy).scale(fitScale);
        svg.call(zoomBehavior.transform, this._initT);

        const treeLayout = d3.tree()
          .size([2 * Math.PI, radius])
          .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
        treeLayout(root);

        function radialPoint(angle, r) {
          return [r * Math.cos(angle - Math.PI / 2), r * Math.sin(angle - Math.PI / 2)];
        }

        const depths = [...new Set(root.descendants().map(d => d.depth))].filter(d => d > 0);
        const ringG  = g.append('g');
        depths.forEach(depth => {
          ringG.append('circle')
            .attr('r', (depth / root.height) * radius)
            .attr('fill', 'none')
            .attr('stroke', '#e8e8e8')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
        });

        const linkPaths = g.append('g').attr('fill', 'none').attr('stroke-width', 1)
          .selectAll('path').data(root.links()).join('path')
          .attr('stroke', '#ccc')
          .attr('d', d3.linkRadial().angle(d => d.x).radius(d => d.y));

        const self  = this;
        const nodeG = g.append('g').selectAll('g').data(root.descendants()).join('g')
          .attr('transform', d => {
            const [x, y] = radialPoint(d.x, d.y);
            return `translate(${x},${y})`;
          })
          .style('cursor', 'pointer')
          .on('mouseenter', function (event, d) {
            if (d.data.talent_role_id === '__root__') return;
            self._showTooltip(event, d, OHI_COLORS, BENCH_RISK_COLORS);
          })
          .on('mousemove', function (event, d) {
            if (d.data.talent_role_id === '__root__') return;
            self._positionTooltip(event);
          })
          .on('mouseleave', function () {
            self._tooltip.classList.remove('visible');
          })
          .on('click', function (event, d) {
            event.stopPropagation();
            if (d.data.talent_role_id === '__root__') return;
            if (self._scenarioMode) {
              showActionPopover(event, d);
            } else {
              self._showEmployeeCard(d, OHI_COLORS, BENCH_RISK_COLORS);
            }
            nodeG.selectAll('.to-node-circle')
              .attr('stroke', n => n.data.talent_role_id === d.data.talent_role_id ? '#3498db' : 'none')
              .attr('stroke-width', 2.5);
          });

        this._nodeG = nodeG;

        const nodeRadius = d => d.depth === 0 ? 9 : d.children ? 6 : 5;

        nodeG.append('circle').attr('class', 'to-node-circle')
          .attr('r', d => nodeRadius(d) + 3)
          .attr('fill', '#fff')
          .attr('stroke', 'none')
          .attr('stroke-width', 2.5);

        nodeG.append('circle')
          .attr('r', d => nodeRadius(d))
          .attr('fill', d => nodeColor(d))
          .attr('stroke', '#fff')
          .attr('stroke-width', d => d.depth === 0 ? 3 : 1.5);

        document.getElementById('to-zoom-in').onclick    = () => svg.transition().duration(250).call(zoomBehavior.scaleBy, 1.3);
        document.getElementById('to-zoom-out').onclick   = () => svg.transition().duration(250).call(zoomBehavior.scaleBy, 0.77);
        document.getElementById('to-zoom-reset').onclick = () => svg.transition().duration(350).call(zoomBehavior.transform, this._initT);

        document.getElementById('to-btn-ohi').onclick = () => {
          document.getElementById('to-btn-ohi').classList.add('active');
          document.getElementById('to-btn-bench-risk').classList.remove('active');
          this._colorMode = 'org_health';
          nodeG.selectAll('circle:not(.to-node-circle)').attr('fill', d => nodeColor(d));
          renderColorLegend();
        };
        document.getElementById('to-btn-bench-risk').onclick = () => {
          document.getElementById('to-btn-bench-risk').classList.add('active');
          document.getElementById('to-btn-ohi').classList.remove('active');
          this._colorMode = 'bench_risk';
          nodeG.selectAll('circle:not(.to-node-circle)').attr('fill', d => nodeColor(d));
          renderColorLegend();
        };

        // ══ Bench Risk simulation: interactions ═════════════════════
        const btnScenario = document.getElementById('to-btn-scenario');
        const btnReset    = document.getElementById('to-btn-reset');
        const btnOhi      = document.getElementById('to-btn-ohi');
        const btnBench    = document.getElementById('to-btn-bench-risk');

        // Roles left without a manager because someone above them is vacant.
        const orphanIds = () => {
          const s = new Set();
          root.descendants().forEach(v => {
            if (v.data._vacant) v.descendants().forEach(n => { if (n !== v) s.add(n.data.talent_role_id); });
          });
          return s;
        };

        const paintScenario = () => {
          const orph = orphanIds();
          nodeG.selectAll('circle:not(.to-node-circle)')
            .attr('fill',             d => nodeColor(d))
            .attr('stroke',           d => d.data._vacant ? '#e74c3c' : '#fff')
            .attr('stroke-dasharray', d => d.data._vacant ? '2.5,2' : null)
            .attr('stroke-width',     d => d.data._vacant ? 2 : (d.depth === 0 ? 3 : 1.5));
          nodeG.style('opacity', d => orph.has(d.data.talent_role_id) ? 0.4 : 1);
          linkPaths
            .attr('stroke',         d => orph.has(d.target.data.talent_role_id) ? '#e74c3c' : '#ccc')
            .attr('stroke-opacity', d => orph.has(d.target.data.talent_role_id) ? 0.5 : 1);
        };

        const clearScenarioPaint = () => {
          nodeG.style('opacity', 1);
          linkPaths.attr('stroke', '#ccc').attr('stroke-opacity', 1);
          nodeG.selectAll('circle:not(.to-node-circle)')
            .attr('fill',             d => nodeColor(d))
            .attr('stroke',           '#fff')
            .attr('stroke-dasharray', null)
            .attr('stroke-width',     d => d.depth === 0 ? 3 : 1.5);
        };

        const persistRole = d => self._scenario.set(d.data.talent_role_id, {
          simSuccessors: d.data._simSuccessors, simTarget: d.data._benchTarget, vacant: d.data._vacant
        });

        // Interactive action card: add/remove successors, or simulate a departure.
        function showActionPopover(event, d) {
          const data   = d.data;
          const hasRaw = data.successors_count != null && data.bench_strength_target != null && data.bench_strength_target > 0;
          const directReports = d.children ? d.children.length : 0;
          const blast  = d.descendants().length - 1;

          const render = () => {
            data._simBand = computeBenchRisk(data._simSuccessors, data._benchTarget);
            const isMCP     = isTruthy(data.is_mission_critical_position);
            const changed   = data._simBand !== data._baselineBand;
            const bandColor = data._vacant ? '#e74c3c' : (BENCH_RISK_COLORS[data._simBand] || BENCH_RISK_COLORS['N/A']);
            const baseColor = BENCH_RISK_COLORS[data._baselineBand] || BENCH_RISK_COLORS['N/A'];
            const hasBackup = (data._simSuccessors || 0) > 0;
            const severity  = isMCP && !hasBackup ? 'CRITICAL' : (!hasBackup ? 'HIGH IMPACT' : 'MODERATE');
            const sevColor  = severity === 'CRITICAL' ? '#e74c3c' : severity === 'HIGH IMPACT' ? '#e67e22' : '#f1c40f';
            const initials  = (data.employee_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('');

            self._action.innerHTML = `
              <div class="to-tt-header">
                <div class="to-tt-avatar" style="background:${baseColor}">${initials}</div>
                <div>
                  <div class="to-tt-name">${data.employee_name || '—'}${isMCP ? ' ⭐' : ''}</div>
                  <div class="to-tt-role">${data.talent_role_name || '—'}</div>
                </div>
              </div>
              <div class="to-act-row">
                <span class="to-tt-label">Bench Risk</span>
                <span><span class="to-tt-dot" style="background:${bandColor};display:inline-block;margin-right:5px;"></span><b style="color:${bandColor}">${data._vacant ? 'VACANT' : data._simBand}</b>${(changed && !data._vacant) ? `<span class="to-delta-tag">was ${data._baselineBand}</span>` : ''}</span>
              </div>
              ${hasRaw ? `
              <div class="to-act-row">
                <span class="to-tt-label">Successors</span>
                <span class="to-stepper">
                  <button class="to-step-btn" data-act="succ-">−</button>
                  <span class="to-step-val">${data._simSuccessors}</span>
                  <button class="to-step-btn" data-act="succ+">+</button>
                </span>
              </div>
              <div class="to-act-row">
                <span class="to-tt-label">Bench target</span>
                <span class="to-stepper">
                  <button class="to-step-btn" data-act="tgt-">−</button>
                  <span class="to-step-val">${data._benchTarget}</span>
                  <button class="to-step-btn" data-act="tgt+">+</button>
                  ${data._benchTarget !== data._baselineTarget ? `<span class="to-delta-tag">was ${data._baselineTarget}</span>` : ''}
                </span>
              </div>
              <div class="to-act-row" style="padding-top:0;"><span class="to-step-target">Needs ${data._benchTarget} successor${data._benchTarget === 1 ? '' : 's'}, has ${data._simSuccessors}</span></div>` : `<div class="to-act-note">Add <b>successors_count_value</b> &amp; <b>bench_strength_target</b> to the query to edit successors and bench target live.</div>`}
              <div style="padding-top:6px;">
                <button class="to-act-btn ${data._vacant ? 'danger' : ''}" data-act="depart" style="width:100%;">${data._vacant ? '↩ Cancel departure' : '⚠ Simulate departure'}</button>
              </div>
              ${data._vacant ? `
              <div class="to-impact" style="border-color:${sevColor};">
                <div class="to-impact-sev" style="color:${sevColor};">${severity}</div>
                <div class="to-impact-row"><span>Direct reports orphaned</span><b>${directReports}</b></div>
                <div class="to-impact-row"><span>People below affected</span><b>${blast}</b></div>
                <div class="to-impact-row"><span>Ready backup?</span><b style="color:${hasBackup ? '#27ae60' : '#e74c3c'}">${hasBackup ? 'Yes (' + data._simSuccessors + ')' : 'None'}</b></div>
              </div>` : ''}
              <div class="to-act-foot"><button class="to-act-link" data-act="reset">Reset this role</button></div>`;

            self._action.querySelectorAll('[data-act]').forEach(btn => {
              btn.onclick = () => {
                const act = btn.getAttribute('data-act');
                if (act === 'succ-') data._simSuccessors = Math.max(0, (data._simSuccessors || 0) - 1);
                if (act === 'succ+') data._simSuccessors = (data._simSuccessors || 0) + 1;
                if (act === 'tgt-')  data._benchTarget   = Math.max(1, (data._benchTarget || 1) - 1);
                if (act === 'tgt+')  data._benchTarget   = (data._benchTarget || 0) + 1;
                if (act === 'depart') data._vacant = !data._vacant;
                if (act === 'reset') {
                  data._simSuccessors = data._baselineSuccessors;
                  data._benchTarget   = data._baselineTarget;
                  data._vacant = false;
                  self._scenario.delete(data.talent_role_id);
                } else {
                  data._simBand = computeBenchRisk(data._simSuccessors, data._benchTarget);
                  persistRole(d);
                }
                paintScenario();
                renderSummary();
                render();
              };
            });
          };

          render();

          const pad = 12, aw = 252, ah = self._action.offsetHeight || 240;
          let left = event.clientX + pad, top = event.clientY + pad;
          if (left + aw > window.innerWidth) left = event.clientX - aw - pad;
          if (top + ah > window.innerHeight) top = window.innerHeight - ah - pad;
          self._action.style.left = Math.max(8, left) + 'px';
          self._action.style.top  = Math.max(8, top) + 'px';
          self._action.classList.add('visible');
        }

        const applyScenarioMode = () => {
          btnScenario.classList.toggle('scenario-on', self._scenarioMode);
          btnReset.style.display = self._scenarioMode ? '' : 'none';
          btnOhi.disabled   = self._scenarioMode;
          btnBench.disabled = self._scenarioMode;
          if (self._scenarioMode) {
            self._colorMode = 'bench_risk';
            btnBench.classList.add('active');
            btnOhi.classList.remove('active');
            paintScenario();
          } else {
            self._action.classList.remove('visible');
            clearScenarioPaint();
          }
          renderColorLegend();
          renderSummary();
        };

        btnScenario.onclick = () => {
          self._hideEmployeeCard();
          self._scenarioMode = !self._scenarioMode;
          if (self._scenarioMode) {
            self._preColorMode = self._colorMode;
          } else if (self._preColorMode) {
            self._colorMode = self._preColorMode;
            btnOhi.classList.toggle('active', self._colorMode !== 'bench_risk');
            btnBench.classList.toggle('active', self._colorMode === 'bench_risk');
          }
          applyScenarioMode();
        };

        btnReset.onclick = () => {
          self._scenario.clear();
          nodes.forEach(n => {
            n._simSuccessors = n._baselineSuccessors;
            n._benchTarget   = n._baselineTarget;
            n._vacant = false;
            n._simBand = n._baselineBand;
          });
          self._action.classList.remove('visible');
          paintScenario();
          renderSummary();
        };

        // Reflect the current mode after every (re-)render, and paint the summary.
        applyScenarioMode();

        // ── Search / highlight ─────────────────────────────────────
        const labelG = g.append('g').attr('class', 'to-labels');

        const applySearch = query => {
          labelG.selectAll('*').remove();
          const q = query.trim().toLowerCase();

          if (!q) {
            nodeG.style('opacity', 1);
            return;
          }

          nodeG.style('opacity', d => {
            if (d.data.talent_role_id === '__root__') return 0.15;
            const name = (d.data.employee_name   || '').toLowerCase();
            const role = (d.data.talent_role_name || '').toLowerCase();
            return (name.includes(q) || role.includes(q)) ? 1 : 0.12;
          });

          // draw callout labels for matched nodes
          root.descendants().forEach(d => {
            if (d.data.talent_role_id === '__root__') return;
            const name = (d.data.employee_name   || '').toLowerCase();
            const role = (d.data.talent_role_name || '').toLowerCase();
            if (!name.includes(q) && !role.includes(q)) return;

            const [nx, ny] = radialPoint(d.x, d.y);
            const labelX   = nx + (nx >= 0 ? 14 : -14);
            const labelY   = ny - 22;
            const roleText = d.data.talent_role_name || '';
            const nameText = d.data.employee_name    || '';
            const boxW     = Math.max(roleText.length, nameText.length) * 6.2 + 16;
            const boxH     = 32;
            const anchor   = nx >= 0 ? 0 : -boxW;

            const lg = labelG.append('g').attr('transform', `translate(${nx},${ny})`);

            // connector line
            lg.append('line')
              .attr('x1', 0).attr('y1', 0)
              .attr('x2', labelX - nx).attr('y2', labelY - ny + boxH / 2)
              .attr('stroke', '#3498db').attr('stroke-width', 1).attr('opacity', 0.6);

            // box
            lg.append('rect')
              .attr('x', labelX - nx + anchor).attr('y', labelY - ny)
              .attr('width', boxW).attr('height', boxH)
              .attr('rx', 3).attr('fill', '#fff')
              .attr('stroke', '#3498db').attr('stroke-width', 1);

            lg.append('text').attr('class', 'to-node-label-role')
              .attr('x', labelX - nx + anchor + 7).attr('y', labelY - ny + 13)
              .text(roleText);

            lg.append('text').attr('class', 'to-node-label-name')
              .attr('x', labelX - nx + anchor + 7).attr('y', labelY - ny + 26)
              .text(nameText);
          });
        };

        const searchInput = document.getElementById('to-search-input');
        const searchClear = document.getElementById('to-search-clear');

        // replace old listener to avoid stacking on re-renders
        const newInput = searchInput.cloneNode(true);
        const newClear = searchClear.cloneNode(true);
        searchInput.replaceWith(newInput);
        searchClear.replaceWith(newClear);

        newInput.addEventListener('input', () => applySearch(newInput.value));
        newClear.addEventListener('click', () => { newInput.value = ''; applySearch(''); });

        // re-apply any active search after re-render
        if (newInput.value) applySearch(newInput.value);

        done();
      },

      _showTooltip(event, d, OHI_COLORS, BENCH_RISK_COLORS) {
        const data      = d.data;
        const ohi       = data.org_health_index || 'N/A';
        const benchRisk = data.bench_risk        || 'N/A';
        const score     = data.role_fit_score;
        const ohiColor  = OHI_COLORS[ohi]              || OHI_COLORS['N/A'];
        const brColor   = BENCH_RISK_COLORS[benchRisk] || BENCH_RISK_COLORS['N/A'];
        const initials  = (data.employee_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('');
        const scorePct  = score != null ? Math.min(100, Math.round(score)) : 0;

        this._tooltip.innerHTML = `
          <div class="to-tt-header">
            <div class="to-tt-avatar" style="background:${ohiColor}">${initials}</div>
            <div>
              <div class="to-tt-name">${data.employee_name || '—'}</div>
              <div class="to-tt-role">${data.talent_role_name || '—'}</div>
            </div>
          </div>
          <div class="to-tt-row">
            <span class="to-tt-label">Org Health</span>
            <span class="to-tt-badge">
              <span class="to-tt-dot" style="background:${ohiColor}"></span>
              <b>${ohi}</b>
            </span>
          </div>
          <div class="to-tt-row" style="align-items:center;">
            <span class="to-tt-label">Role Fit</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <b class="to-tt-value">${score != null ? score : '—'}</b>
              <div class="to-score-wrap">
                <div class="to-score-bar" style="width:${scorePct}%;background:${ohiColor}"></div>
              </div>
            </span>
          </div>
          <div class="to-tt-row">
            <span class="to-tt-label">Bench Risk</span>
            <span class="to-tt-badge">
              <span class="to-tt-dot" style="background:${brColor}"></span>
              <b>${benchRisk}</b>
            </span>
          </div>
          <div class="to-tt-row">
            <span class="to-tt-label">Reports To</span>
            <span class="to-tt-value">${data.parent_talent_role_name || '(Root)'}</span>
          </div>
          <div class="to-tt-row">
            <span class="to-tt-label">Direct Reports</span>
            <span class="to-tt-value">${d.children ? d.children.length : 0}</span>
          </div>
        `;

        this._positionTooltip(event);
        this._tooltip.classList.add('visible');
      },

      _positionTooltip(event) {
        const pad = 12, tw = 240, th = this._tooltip.offsetHeight || 210;
        let left = event.clientX + pad;
        let top  = event.clientY + pad;
        if (left + tw > window.innerWidth)  left = event.clientX - tw - pad;
        if (top  + th > window.innerHeight) top  = event.clientY - th - pad;
        this._tooltip.style.left = left + 'px';
        this._tooltip.style.top  = top  + 'px';
      },

      _showEmployeeCard(d, OHI_COLORS, BENCH_RISK_COLORS) {
        const data = d.data;
        const card = this._empcard;
        if (!card) return;
        const isTruthy  = v => v === true || v === 1 || (typeof v === 'string' && v.toLowerCase() === 'yes') || v === 'true';
        const ohi       = data.org_health_index || 'N/A';
        const ohiColor  = OHI_COLORS[ohi] || OHI_COLORS['N/A'];
        const benchRisk = data.bench_risk || 'N/A';
        const brColor   = BENCH_RISK_COLORS[benchRisk] || BENCH_RISK_COLORS['N/A'];
        const mcp       = isTruthy(data.is_mission_critical_position);
        const talent    = isTruthy(data.is_talent);
        const score     = data.role_fit_score;
        const benchVal  = data.bench_strength_target;
        const initials  = (data.employee_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const successors = String(data.successor_names || '').split(',').map(s => s.trim()).filter(Boolean);
        const yn = b => b ? 'YES' : 'NO';

        card.innerHTML = `
          <div class="to-ec-head">
            <span class="to-ec-close" id="to-ec-close">✕</span>
            <div class="to-ec-avatar" style="background:${ohiColor}">${initials}</div>
            <div class="to-ec-name">${data.employee_name || '—'}</div>
            <div class="to-ec-role">${data.talent_role_name || '—'}</div>
          </div>
          <div class="to-ec-stats">
            <div class="to-ec-stat"><span>Mission Critical Position</span><b>${yn(mcp)}</b></div>
            <div class="to-ec-stat"><span>Critical Talent</span><b>${yn(talent)}</b></div>
            <div class="to-ec-stat"><span>Bench Strength</span><b>${mcp && benchVal != null ? benchVal : '—'}${mcp && benchVal != null ? `<span class="to-ec-dot" style="background:${brColor}"></span>` : ''}</b></div>
            <div class="to-ec-stat"><span>Role Fit</span><b>${score != null ? score + '%' : '—'}</b></div>
          </div>
          <div class="to-ec-succ">
            <div class="to-ec-succ-title">Successors (${successors.length})</div>
            ${successors.length
              ? `<div class="to-ec-succ-list">${successors.map(n => `<div class="to-ec-succ-item"><span class="to-ec-succ-av">${n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>${n}</div>`).join('')}</div>`
              : `<div class="to-ec-succ-empty">No successors identified</div>`}
          </div>
        `;

        const closeBtn = card.querySelector('#to-ec-close');
        if (closeBtn) closeBtn.onclick = () => this._hideEmployeeCard();

        // Give the card the right-side real estate while it is open.
        const zoom = document.querySelector('.to-zoom');
        const summary = document.getElementById('to-summary');
        if (zoom) zoom.style.display = 'none';
        if (summary) summary.style.display = 'none';
        card.classList.add('visible');
      },

      _hideEmployeeCard() {
        if (this._empcard) this._empcard.classList.remove('visible');
        const zoom = document.querySelector('.to-zoom');
        const summary = document.getElementById('to-summary');
        if (zoom) zoom.style.display = '';
        if (summary) summary.style.display = '';
        if (this._nodeG) this._nodeG.selectAll('.to-node-circle').attr('stroke', 'none');
      }

    });
  }

  if (window.d3) {
    init();
  } else {
    const script    = document.createElement('script');
    script.src      = 'https://d3js.org/d3.v7.min.js';
    script.onload   = init;
    script.onerror  = () => console.error('[talent-org-chart] Failed to load D3.');
    document.head.appendChild(script);
  }

})();
