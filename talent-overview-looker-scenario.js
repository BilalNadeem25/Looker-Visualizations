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
          .to-btn.fit-on { background:#16a085; color:#fff; border-color:#16a085; }
          .to-fit-cur { font-size:9px; font-weight:700; letter-spacing:0.3px; color:#16a085; border:1px solid #16a085; border-radius:10px; padding:1px 6px; margin-left:6px; }
          .to-fit-here { font-size:9px; font-weight:700; letter-spacing:0.3px; color:#3f8cff; border:1px solid #3f8cff; border-radius:10px; padding:1px 6px; margin-left:6px; }
          .to-opt-btn { width:100%; margin-top:8px; padding:6px 8px; border:none; border-radius:5px; background:#16a085; color:#fff; font-size:11px; font-weight:600; cursor:pointer; }
          .to-opt-btn:hover { background:#12876f; }
          .to-tabs { display:flex; gap:4px; margin-top:8px; }
          .to-tab { flex:1 1 0; font-size:11px; padding:4px 6px; border-radius:4px; cursor:pointer; border:1px solid rgba(255,255,255,0.22); background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.75); }
          .to-tab:hover { background:rgba(255,255,255,0.16); }
          .to-tab.on { background:#16a085; border-color:#16a085; color:#fff; font-weight:600; }
          .to-fit-scroll { max-height:236px; overflow-y:auto; }
          .to-rec-body { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; }
          .to-rec-nm { font-size:12px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .to-rec-sub { font-size:10px; color:rgba(255,255,255,0.45); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .to-rec-delta { font-size:10px; font-weight:700; color:rgba(255,255,255,0.5); }
          .to-rec-delta.up { color:#2ecc71; }
          .to-rec-delta.down { color:#e74c3c; }
          .to-action { position:fixed; background:#262D33; border-radius:6px; box-shadow:0 4px 20px rgba(0,0,0,0.35); padding:12px 14px; min-width:230px; max-width:270px; font-size:12px; font-family:Roboto,'Noto Sans',Helvetica,Arial,sans-serif; z-index:1001; opacity:0; pointer-events:none; transition:opacity 0.12s ease; color:#fff; }
          .to-action.visible { opacity:1; pointer-events:auto; }
          .to-act-btn { font-size:11px; padding:4px 9px; border-radius:4px; border:1px solid rgba(255,255,255,0.25); background:rgba(255,255,255,0.08); color:#fff; cursor:pointer; }
          .to-act-btn:hover { background:rgba(255,255,255,0.2); }
          .to-act-btn.danger { background:#e74c3c; border-color:#e74c3c; }
          .to-act-note { color:rgba(255,255,255,0.6); font-size:11px; padding:5px 0; }
          .to-impact { margin-top:8px; padding:8px 10px; border:1px solid; border-radius:5px; background:rgba(255,255,255,0.04); }
          .to-impact-sev { font-weight:700; font-size:11px; margin-bottom:5px; letter-spacing:0.4px; }
          .to-impact-row { display:flex; justify-content:space-between; font-size:11px; padding:1px 0; color:rgba(255,255,255,0.8); }
          .to-impact-row b { color:#fff; }
          .to-rec-item { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.08); }
          .to-rec-item:last-child { border-bottom:none; }
          .to-rec-rank { width:16px; height:16px; border-radius:50%; background:rgba(255,255,255,0.15); color:#fff; font-size:9px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
          .to-rec-av { width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,0.12); color:#fff; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; }
          .to-rec-name { flex:1 1 auto; font-size:12px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .to-rec-score { display:flex; align-items:center; gap:6px; flex-shrink:0; }
          .to-rec-score b { font-size:11px; color:#fff; }
          .to-rec-pick { cursor:pointer; border-radius:4px; padding-left:3px; padding-right:3px; transition:background 0.12s ease; }
          .to-rec-pick:hover { background:rgba(255,255,255,0.10); }
          .to-rec-pick.chosen { background:rgba(63,140,255,0.22); }
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

          /* ── Cascade / impact panel (left-docked, appears in Simulate when changes exist) ── */
          .to-cascade { position:absolute; top:52px; left:10px; width:238px; max-height:calc(100% - 150px); background:rgba(255,255,255,0.97); border-radius:8px; box-shadow:0 2px 14px rgba(0,0,0,0.16); z-index:15; display:none; flex-direction:column; overflow:hidden; }
          .to-cascade.visible { display:flex; }
          .to-casc-head { padding:10px 13px; font-weight:700; font-size:12px; color:#222; border-bottom:1px solid #eee; flex-shrink:0; }
          .to-casc-nav { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 10px; border-bottom:1px solid #f0f0f0; font-size:11px; color:#e74c3c; font-weight:600; flex-shrink:0; }
          .to-casc-navbtn { width:22px; height:22px; border:1px solid #f0c6c1; background:#fff; color:#e74c3c; border-radius:4px; cursor:pointer; font-size:12px; line-height:1; }
          .to-casc-navbtn:hover { background:#fdecea; }
          .to-casc-list { overflow-y:auto; padding:4px 0; }
          .to-casc-row { display:flex; align-items:center; gap:9px; padding:7px 12px; cursor:pointer; border-bottom:1px solid #f5f5f5; }
          .to-casc-row:hover { background:#f4f8ff; }
          .to-casc-row:last-child { border-bottom:none; }
          .to-casc-av { width:26px; height:26px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; }
          .to-casc-body { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; }
          .to-casc-role { font-size:12px; font-weight:600; color:#222; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .to-casc-who { font-size:11px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .to-casc-chip { font-size:9px; font-weight:700; letter-spacing:0.3px; border:1px solid; border-radius:10px; padding:2px 7px; flex-shrink:0; text-transform:uppercase; }
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
          <button class="to-btn" id="to-btn-fit" title="Simulate better role placements to raise role fit">Optimize Fit</button>
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

        const cascade = document.createElement('div');
        cascade.className = 'to-cascade';
        cascade.id = 'to-cascade';
        cascade.addEventListener('click', e => e.stopPropagation());
        element.appendChild(cascade);

        this._chart        = chart;
        this._tooltip      = tooltip;
        this._action       = action;
        this._empcard      = empcard;
        this._cascade      = cascade;
        this._colorMode    = 'org_health';
        this._scenarioMode = false;
        this._fitMode      = false;
        this._fitTab       = 'role';
        this._scenario     = new Map();
        this._fitScenario  = new Map();
        this._gapIdx       = 0;
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
          user_id:                    (v => (v != null && v !== '' && v !== 'null') ? String(v) : null)(pick(row, 'user_id')),
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
          successor_names:            pick(row, 'successor_names') ?? null,
          successor_role_fit_scores:  (() => {
            const raw = pick(row, 'successor_role_fit_scores');
            if (raw == null || raw === '') return [];
            if (Array.isArray(raw)) return raw;
            try { return JSON.parse(raw); } catch (e) { return []; }
          })(),
          candidate_role_fit_scores:  (() => {
            const raw = pick(row, 'candidate_role_fit_scores');
            if (raw == null || raw === '') return [];
            if (Array.isArray(raw)) return raw;
            try { return JSON.parse(raw); } catch (e) { return []; }
          })(),
          // The fit matrix for this incumbent: [{talent_role_id, talent_role_name, role_fit, band}]
          employee_role_fits:  (() => {
            const raw = pick(row, 'employee_role_fits');
            if (raw == null || raw === '') return [];
            if (Array.isArray(raw)) return raw;
            try { return JSON.parse(raw); } catch (e) { return []; }
          })()
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
            talent_role_id: '__root__', parent_talent_role_id: null, user_id: null,
            employee_name: '', talent_role_name: '', parent_talent_role_name: null,
            org_health_index: 'N/A', bench_risk: 'N/A',
            is_mission_critical_position: false, is_talent: false, role_fit_score: null,
            successor_role_fit_scores: [], candidate_role_fit_scores: [], employee_role_fits: []
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
        // Distinct fill for a vacated role once a successor has been chosen to backfill it.
        const FILLED_FILL   = '#3f8cff';
        const FILLED_STROKE = '#1c5fb0';
        // Distinct fill for a vacancy resolved by a planned external hire (no internal bench).
        const NEWHIRE_FILL   = '#1abc9c';
        const NEWHIRE_STROKE = '#0e8c74';

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
        const fitScenario = this._fitScenario;
        nodes.forEach(n => {
          if (n.talent_role_id === '__root__') {
            n._benchTarget = null; n._baselineTarget = null; n._baselineBand = 'N/A'; n._baselineSuccessors = 0;
            n._simSuccessors = 0; n._vacant = false; n._simBand = 'N/A';
            n._filledBy = null; n._backfill = false; n._newHire = false;
            n._placedUser = null; n._swapWith = null;
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
          n._filledBy      = (ov && ov.filledBy) ? ov.filledBy : null;
          n._backfill      = ov ? !!ov.backfill : false;
          n._newHire       = ov ? !!ov.newHire : false;
          n._simBand       = computeBenchRisk(n._simSuccessors, n._benchTarget);
          // Re-apply any active fit-placement (swap) override for this role.
          const fv = fitScenario.get(n.talent_role_id);
          n._placedUser = (fv && fv.placedUser) ? fv.placedUser : null;
          n._swapWith   = (fv && fv.swapWith != null) ? fv.swapWith : null;
        });

        const nodeColor = d => {
          if (this._fitMode) {
            const band = d.data._placedUser ? d.data._placedUser.band : (d.data.org_health_index || 'N/A');
            return OHI_COLORS[band] || OHI_COLORS['N/A'];
          }
          if (this._scenarioMode) {
            if (d.data._newHire)  return NEWHIRE_FILL;
            if (d.data._filledBy) return FILLED_FILL;
            if (d.data._vacant)   return '#ffffff';
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

          if (this._fitMode) {
            const base = computeOrgFit(false);
            const sim  = computeOrgFit(true);
            const placements = rn.filter(n => n._placedUser).length;
            const numArrow = (a, b) => {
              if (a == null || b == null) return b != null ? Math.round(b) : '—';
              if (Math.abs(b - a) < 0.5) return `<span class="to-arrow flat">${Math.round(b)}</span>`;
              return `<span class="to-arrow ${b > a ? 'good' : 'bad'}">${Math.round(b)} ${b > a ? '▲' : '▼'}</span>`;
            };
            const pctArrow = (a, b) => a === b
              ? `<span class="to-arrow flat">${b}%</span>`
              : `<span class="to-arrow ${b > a ? 'good' : 'bad'}">${b}% ${b > a ? '▲' : '▼'}</span>`;
            el.innerHTML = `
              <div class="to-summary-title">Organizational Role Fit</div>
              <div class="to-summary-row"><span class="to-summary-label">Avg fit (MCP-wtd)</span><span class="to-summary-value">${base.avg != null ? Math.round(base.avg) : '—'} → ${numArrow(base.avg, sim.avg)}</span></div>
              <div class="to-summary-row"><span class="to-summary-label">% Green</span><span class="to-summary-value">${base.pctGreen}% → ${pctArrow(base.pctGreen, sim.pctGreen)}</span></div>
              <div class="to-summary-section">
                <div class="to-summary-section-title">Node bands (simulated)</div>
                ${['High', 'Medium', 'Low', 'N/A'].map(k => {
                  const cnt = rn.filter(n => (n._placedUser ? n._placedUser.band : (n.org_health_index || 'N/A')) === k).length;
                  return `<div class="to-summary-dot-row"><span style="display:flex;align-items:center;gap:5px;">${dot(OHI_COLORS[k] || '#95a5a6')}<span class="to-summary-label">${k}</span></span><span class="to-summary-value">${cnt}</span></div>`;
                }).join('')}
              </div>
              <div class="to-summary-section"><div class="to-summary-dot-row"><span class="to-summary-label">Placements</span><span class="to-summary-value">${placements}</span></div></div>
              <button class="to-opt-btn" id="to-fit-optimize">⚡ Auto-optimize placements</button>
              <div class="to-summary-section" style="color:#888;font-size:10px;">${this._lastOptimize != null ? `Auto-optimize applied <b>${this._lastOptimize}</b> improving swap${this._lastOptimize === 1 ? '' : 's'}. ` : ''}Click a role to place its person by hand, or auto-optimize the whole org. Reset clears all placements.</div>`;
            const optBtn = document.getElementById('to-fit-optimize');
            if (optBtn) optBtn.onclick = () => runGreedyOptimize();
            return;
          }

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
          const filledCount  = rn.filter(n => n._filledBy).length;
          const newHireCount = rn.filter(n => n._newHire).length;
          const gaps = rn.filter(n => n._vacant && !n._filledBy && !n._newHire).length;

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
              <div class="to-summary-dot-row"><span class="to-summary-label">Positions filled</span><span class="to-summary-value">${filledCount}</span></div>
              <div class="to-summary-dot-row"><span class="to-summary-label">External hires</span><span class="to-summary-value">${newHireCount}</span></div>
              <div class="to-summary-dot-row"><span class="to-summary-label">Manager gaps</span><span class="to-summary-value">${gaps}</span></div>
            </div>
            <div class="to-summary-section" style="color:#888;font-size:10px;">Simulate a departure, then click a successor to backfill the role.</div>`;
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
            } else if (self._fitMode) {
              showFitExplorer(event, d);
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
        const btnFit      = document.getElementById('to-btn-fit');
        const btnReset    = document.getElementById('to-btn-reset');
        const btnOhi      = document.getElementById('to-btn-ohi');
        const btnBench    = document.getElementById('to-btn-bench-risk');

        // Grayed reporting lines: only for a role vacated by *backfill* — i.e. its
        // incumbent was moved up to fill another role and left a gap behind them.
        // A plain simulated departure (or a role already backfilled by a successor)
        // does NOT gray its subtree.
        const orphanIds = () => {
          const s = new Set();
          root.descendants().forEach(v => {
            if (v.data._backfill && !v.data._filledBy && !v.data._newHire) {
              v.descendants().forEach(n => { if (n !== v) s.add(n.data.talent_role_id); });
            }
          });
          return s;
        };

        const paintScenario = () => {
          const orph = orphanIds();
          nodeG.selectAll('circle:not(.to-node-circle)')
            .attr('fill',             d => nodeColor(d))
            .attr('stroke',           d => d.data._newHire ? NEWHIRE_STROKE : (d.data._filledBy ? FILLED_STROKE : (d.data._vacant ? '#e74c3c' : '#fff')))
            .attr('stroke-dasharray', d => (d.data._vacant && !d.data._filledBy && !d.data._newHire) ? '2.5,2' : null)
            .attr('stroke-width',     d => (d.data._vacant || d.data._filledBy || d.data._newHire) ? 2 : (d.depth === 0 ? 3 : 1.5));
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
          simSuccessors: d.data._simSuccessors, simTarget: d.data._benchTarget, vacant: d.data._vacant,
          filledBy: d.data._filledBy, backfill: d.data._backfill, newHire: d.data._newHire
        });

        // ── Successor backfill cascade ─────────────────────────────
        // Choosing a successor to fill a vacated role: the vacated node is marked
        // "filled" (distinct color), and the chosen person's own role(s) elsewhere
        // in the org are automatically simulated as departed (a backfill gap whose
        // reporting line is grayed out).
        const chooseSuccessor = (departedNode, succ) => {
          const dData = departedNode.data;
          const uid   = (succ.user_id == null || succ.user_id === '') ? null : String(succ.user_id);
          dData._vacant   = true;
          dData._backfill = false;   // this role now has a replacement — not a gap
          dData._newHire  = false;   // resolved internally, not by an external hire
          dData._filledBy = { name: succ.name, user_id: uid, role_fit_score: succ.role_fit_score };
          persistRole(departedNode);
          const backfilled = [];
          if (uid != null) {
            root.descendants().forEach(v => {
              if (v.data.talent_role_id === '__root__' || v === departedNode) return;
              if (String(v.data.user_id) === uid) {
                v.data._vacant   = true;
                v.data._backfill = true;
                v.data._filledBy = null;
                v.data._simBand  = computeBenchRisk(v.data._simSuccessors, v.data._benchTarget);
                persistRole(v);
                backfilled.push(v);
              }
            });
          }
          return backfilled;
        };

        // Undo the backfill gap(s) created when `fill` was chosen for some role.
        const revertBackfill = fill => {
          if (!fill || fill.user_id == null || fill.user_id === '') return;
          const uid = String(fill.user_id);
          root.descendants().forEach(v => {
            if (v.data.talent_role_id === '__root__') return;
            if (String(v.data.user_id) === uid && v.data._backfill && !v.data._filledBy) {
              v.data._vacant   = false;
              v.data._backfill = false;
              v.data._newHire  = false;
              v.data._simBand  = computeBenchRisk(v.data._simSuccessors, v.data._benchTarget);
              self._scenario.delete(v.data.talent_role_id);
            }
          });
        };

        // Cancel the fill on `departedNode`, reverting the successor's backfill gap.
        const cancelFill = departedNode => {
          const prev = departedNode.data._filledBy;
          departedNode.data._filledBy = null;
          persistRole(departedNode);
          revertBackfill(prev);
        };

        // ── Locate-in-chart helpers (make the cascade navigable at any org size) ──
        const escAttr  = s => String(s == null ? '' : s).replace(/"/g, '&quot;');
        const nodePos  = v => radialPoint(v.x, v.y);

        // Animate the viewport to frame one or more nodes (fits their bounding box).
        const flyToNodes = (targets, opts = {}) => {
          const pts = (targets || []).filter(Boolean).map(nodePos);
          if (!pts.length) return;
          const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minY = Math.min(...ys), maxY = Math.max(...ys);
          const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
          const pad  = 170;
          let k;
          if (pts.length === 1) {
            k = 1.3;
          } else {
            k = Math.min((W - pad) / Math.max(1, maxX - minX), (H - pad) / Math.max(1, maxY - minY));
            if (!isFinite(k) || k <= 0) k = 1;
          }
          k = Math.max(0.08, Math.min(2.2, k));
          const t = d3.zoomIdentity.translate(W / 2 - midX * k, H / 2 - midY * k).scale(k);
          svg.transition().duration(650).call(zoomBehavior.transform, t);
          (opts.ping || []).forEach(pingNode);
        };

        // A brief expanding ring locator on a node (drawn in chart space so it pans/zooms).
        const pingNode = v => {
          const [x, y] = nodePos(v);
          const r0 = (v.depth === 0 ? 9 : v.children ? 6 : 5);
          const ring = () => g.append('circle')
            .attr('cx', x).attr('cy', y).attr('r', r0 + 2)
            .attr('fill', 'none').attr('stroke', '#e74c3c').attr('stroke-width', 3)
            .attr('opacity', 0.9).style('pointer-events', 'none')
            .transition().duration(850).ease(d3.easeCubicOut)
            .attr('r', r0 + 26).attr('stroke-width', 0.5).attr('opacity', 0)
            .on('end', function () { d3.select(this).remove(); });
          ring();
          setTimeout(ring, 260);
        };

        // ── Cascade / impact panel: a size-independent list of every touched role,
        //    each click-to-locate, plus a next/prev navigator over the open gaps. ──
        const cascadeState = v =>
            v.data._filledBy ? { k: 'filled', label: 'Filled',   color: FILLED_FILL }
          : v.data._newHire  ? { k: 'hire',   label: 'New hire',  color: NEWHIRE_FILL }
          : v.data._backfill ? { k: 'gap',    label: 'Open gap',  color: '#e74c3c' }
          :                    { k: 'depart', label: 'Departing', color: '#e74c3c' };

        const openGapNodes = () => root.descendants().filter(v =>
          v.data.talent_role_id !== '__root__' && v.data._vacant && !v.data._filledBy && !v.data._newHire);

        const renderCascade = () => {
          const el = document.getElementById('to-cascade');
          if (!el) return;
          if (!self._scenarioMode) { el.classList.remove('visible'); el.innerHTML = ''; return; }
          const affected = root.descendants().filter(v =>
            v.data.talent_role_id !== '__root__' &&
            (v.data._filledBy || v.data._newHire || v.data._vacant));
          if (!affected.length) { el.classList.remove('visible'); el.innerHTML = ''; return; }

          const order = { depart: 0, gap: 1, hire: 2, filled: 3 };
          affected.sort((a, b) => {
            const oa = order[cascadeState(a).k], ob = order[cascadeState(b).k];
            if (oa !== ob) return oa - ob;
            return String(a.data.talent_role_name || '').localeCompare(String(b.data.talent_role_name || ''));
          });

          const gaps = openGapNodes();
          const nav = gaps.length ? `
            <div class="to-casc-nav">
              <button class="to-casc-navbtn" data-nav="prev" title="Previous open gap">◂</button>
              <span>${gaps.length} open gap${gaps.length === 1 ? '' : 's'} to resolve</span>
              <button class="to-casc-navbtn" data-nav="next" title="Next open gap">▸</button>
            </div>` : '';

          el.innerHTML = `
            <div class="to-casc-head">Scenario changes (${affected.length})</div>
            ${nav}
            <div class="to-casc-list">
              ${affected.map(v => {
                const st   = cascadeState(v);
                const role = v.data.talent_role_name || '—';
                const who  = st.k === 'filled' ? (v.data._filledBy.name || '—')
                           : st.k === 'hire'   ? 'External hire'
                           : (v.data.employee_name || '—');
                const ci   = String(who).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                return `
                  <div class="to-casc-row" data-role="${escAttr(v.data.talent_role_id)}">
                    <span class="to-casc-av" style="background:${st.color}">${ci}</span>
                    <span class="to-casc-body">
                      <span class="to-casc-role" title="${escAttr(role)}">${role}</span>
                      <span class="to-casc-who" title="${escAttr(who)}">${who}</span>
                    </span>
                    <span class="to-casc-chip" style="color:${st.color};border-color:${st.color};">${st.label}</span>
                  </div>`;
              }).join('')}
            </div>`;
          el.classList.add('visible');

          el.querySelectorAll('[data-role]').forEach(rowEl => {
            rowEl.onclick = () => {
              const id = rowEl.getAttribute('data-role');
              const v  = root.descendants().find(n => String(n.data.talent_role_id) === String(id));
              if (v) flyToNodes([v], { ping: [v] });
            };
          });
          el.querySelectorAll('[data-nav]').forEach(btn => {
            btn.onclick = () => {
              const g2 = openGapNodes();
              if (!g2.length) return;
              const dir = btn.getAttribute('data-nav') === 'next' ? 1 : -1;
              self._gapIdx = (((self._gapIdx || 0) + dir) % g2.length + g2.length) % g2.length;
              flyToNodes([g2[self._gapIdx]], { ping: [g2[self._gapIdx]] });
            };
          });
        };

        // ══ Role-fit placement simulation ("Optimize Fit") ═══════════
        // Move a person to a role where they fit better, modelled as a SWAP with that
        // role's incumbent so the org stays fully staffed and the Org Role Fit delta is
        // well-defined. Fit/band for each (person, target role) comes from the
        // employee_role_fits matrix each node carries for its own incumbent.
        const numOr    = v => { const n = Number(v); return isFinite(n) ? n : null; };
        // Map-backed lookup: the role-centric list resolves a node per row, so a linear
        // scan here would compound badly on a large org.
        const nodeIndex = (() => {
          const m = new Map();
          root.descendants().forEach(v => m.set(String(v.data.talent_role_id), v));
          return m;
        })();
        const nodeById = id => nodeIndex.get(String(id)) || null;
        const fitOf    = (data, roleId) => {
          const arr = Array.isArray(data.employee_role_fits) ? data.employee_role_fits : [];
          return arr.find(e => String(e.talent_role_id) === String(roleId)) || null;
        };

        // ── Inverted (role-centric) fit index ──────────────────────
        // employee_role_fits is employee-centric (each node carries its own incumbent's
        // fits across roles). Scanning every node once inverts it into
        //   roleId -> [{name, user_id, homeRoleId, homeRoleName, fit, band}] (best first)
        // i.e. "everyone scored for THIS role", which is what you want when judging a
        // role rather than a person. Only people who hold a seat in the chart appear —
        // exactly the set we can legally swap with.
        const roleCandidateIndex = (() => {
          const idx = new Map();
          realNodes().forEach(P => {
            const arr = Array.isArray(P.employee_role_fits) ? P.employee_role_fits : [];
            arr.forEach(e => {
              const rid = String(e.talent_role_id);
              if (!idx.has(rid)) idx.set(rid, []);
              idx.get(rid).push({
                name: P.employee_name, user_id: P.user_id,
                homeRoleId: P.talent_role_id, homeRoleName: P.talent_role_name,
                fit: numOr(e.role_fit), band: e.band || 'N/A'
              });
            });
          });
          idx.forEach(list => list.sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1)));
          return idx;
        })();
        const candidatesForRole = roleId => roleCandidateIndex.get(String(roleId)) || [];

        // Who is sitting in this role right now (after any swaps), and where a given
        // person currently sits (their home seat unless they've been swapped away).
        const currentOccupantOf = data => data._placedUser
          ? { user_id: data._placedUser.user_id, name: data._placedUser.name, homeRoleId: data._placedUser.fromRoleId,
              fit: data._placedUser.role_fit, band: data._placedUser.band || 'N/A' }
          : { user_id: data.user_id, name: data.employee_name, homeRoleId: data.talent_role_id,
              fit: numOr(data.role_fit_score), band: data.org_health_index || 'N/A' };
        const currentSeatOf = homeRoleId => {
          const h = nodeById(homeRoleId);
          if (!h) return String(homeRoleId);
          return String(h.data._swapWith != null ? h.data._swapWith : homeRoleId);
        };

        const persistFit  = data => self._fitScenario.set(data.talent_role_id, { placedUser: data._placedUser, swapWith: data._swapWith });
        const clearFitRole = data => { data._placedUser = null; data._swapWith = null; self._fitScenario.delete(data.talent_role_id); };
        const undoSwap = data => {
          const partnerId = data._swapWith;
          clearFitRole(data);
          if (partnerId != null) { const p = nodeById(partnerId); if (p) clearFitRole(p.data); }
        };
        // Swap the home node's original incumbent into the target role (and vice-versa).
        const placeSwap = (homeNode, targetNode) => {
          if (!homeNode || !targetNode || homeNode === targetNode) return;
          undoSwap(homeNode.data);
          undoSwap(targetNode.data);
          const A = homeNode.data, X = targetNode.data;
          const aFitX = fitOf(A, X.talent_role_id);   // A's fit for the target role
          const cFitA = fitOf(X, A.talent_role_id);   // target incumbent's fit for A's role
          if (!aFitX) return;
          X._placedUser = { user_id: A.user_id, name: A.employee_name, role_fit: numOr(aFitX.role_fit), band: aFitX.band || 'N/A', fromRoleId: A.talent_role_id, fromRoleName: A.talent_role_name };
          A._placedUser = { user_id: X.user_id, name: X.employee_name, role_fit: cFitA ? numOr(cFitA.role_fit) : null, band: cFitA ? (cFitA.band || 'N/A') : 'N/A', fromRoleId: X.talent_role_id, fromRoleName: X.talent_role_name };
          A._swapWith = X.talent_role_id;
          X._swapWith = A.talent_role_id;
          persistFit(A); persistFit(X);
        };

        const paintFit = () => {
          nodeG.style('opacity', 1);
          linkPaths.attr('stroke', '#ccc').attr('stroke-opacity', 1);
          nodeG.selectAll('circle:not(.to-node-circle)')
            .attr('fill',             d => nodeColor(d))
            .attr('stroke',           d => d.data._placedUser ? '#16a085' : '#fff')
            .attr('stroke-dasharray', null)
            .attr('stroke-width',     d => d.data._placedUser ? 2.5 : (d.depth === 0 ? 3 : 1.5));
        };

        // Organizational Role Fit: MCP-weighted mean role_fit + % of roles in the green band.
        const computeOrgFit = sim => {
          let wsum = 0, w = 0, green = 0, counted = 0;
          realNodes().forEach(n => {
            const band = sim && n._placedUser ? n._placedUser.band    : (n.org_health_index || 'N/A');
            const fit  = sim && n._placedUser ? n._placedUser.role_fit : numOr(n.role_fit_score);
            const weight = isTruthy(n.is_mission_critical_position) ? 2 : 1;
            if (fit != null) { wsum += fit * weight; w += weight; }
            if (band === 'High') green++;
            counted++;
          });
          return { avg: w ? wsum / w : null, pctGreen: counted ? Math.round(100 * green / counted) : 0 };
        };

        const roleWeight = n => isTruthy(n.is_mission_critical_position) ? 2 : 1;

        // Greedy org-wide optimizer: from baseline, evaluate every mutually-scored
        // pairwise swap, score each by (green flips first, then MCP-weighted fit gain),
        // and apply the best non-overlapping ones. Green-primary matches the goal of
        // turning red/yellow nodes green; disjoint swaps keep the result readable/undoable.
        const GREEN_BONUS = 1000;
        const runGreedyOptimize = () => {
          // Always compute from the baseline org (discards any manual placements).
          self._fitScenario.clear();
          nodes.forEach(n => { n._placedUser = null; n._swapWith = null; });

          const seen  = new Set();
          const cands = [];
          realNodes().forEach(A => {
            if (!Array.isArray(A.employee_role_fits) || !A.employee_role_fits.length) return;
            const baseA = numOr(A.role_fit_score);
            if (baseA == null) return;
            const wA = roleWeight(A);
            const greenA0 = A.org_health_index === 'High' ? 1 : 0;
            A.employee_role_fits.forEach(e => {
              const xid = String(e.talent_role_id);
              if (xid === String(A.talent_role_id)) return;
              const key = [String(A.talent_role_id), xid].sort().join('|');
              if (seen.has(key)) return;
              const Xn = nodeById(xid);
              if (!Xn || Xn.data.talent_role_id === '__root__') return;
              const X = Xn.data;
              const aFitX = numOr(e.role_fit);
              const cEntry = fitOf(X, A.talent_role_id);   // target incumbent's fit for A's role
              const cFitA = cEntry ? numOr(cEntry.role_fit) : null;
              const baseX = numOr(X.role_fit_score);
              if (aFitX == null || cFitA == null || baseX == null) return;   // need all four to be scored
              seen.add(key);
              const wX = roleWeight(X);
              const fitGain = (wA * cFitA + wX * aFitX) - (wA * baseA + wX * baseX);
              const greenAfter = (e.band === 'High' ? 1 : 0) + (cEntry.band === 'High' ? 1 : 0);
              const greenBefore = greenA0 + (X.org_health_index === 'High' ? 1 : 0);
              const composite = GREEN_BONUS * (greenAfter - greenBefore) + fitGain;
              if (composite > 0) cands.push({ composite, aId: A.talent_role_id, xId: xid });
            });
          });
          cands.sort((p, q) => q.composite - p.composite);

          const used = new Set();
          let applied = 0;
          cands.forEach(c => {
            if (used.has(String(c.aId)) || used.has(String(c.xId))) return;
            const home = nodeById(c.aId), target = nodeById(c.xId);
            if (!home || !target) return;
            placeSwap(home, target);
            used.add(String(c.aId)); used.add(String(c.xId));
            applied++;
          });

          self._lastOptimize = applied;
          paintFit();
          renderSummary();
          renderFitPanel();
          // Zoom out to the whole org so the recoloring is visible at a glance.
          if (self._svg && self._zoom && self._initT) self._svg.transition().duration(500).call(self._zoom.transform, self._initT);
          return applied;
        };

        const renderFitPanel = () => {
          const el = document.getElementById('to-cascade');
          if (!el) return;
          if (!self._fitMode) { el.classList.remove('visible'); el.innerHTML = ''; return; }
          const placed = root.descendants().filter(v => v.data.talent_role_id !== '__root__' && v.data._placedUser);
          if (!placed.length) { el.classList.remove('visible'); el.innerHTML = ''; return; }
          placed.sort((a, b) => String(a.data.talent_role_name || '').localeCompare(String(b.data.talent_role_name || '')));
          el.innerHTML = `
            <div class="to-casc-head">Placements (${placed.length})</div>
            <div class="to-casc-list">
              ${placed.map(v => {
                const pu    = v.data._placedUser;
                const band  = pu.band || 'N/A';
                const color = OHI_COLORS[band] || OHI_COLORS['N/A'];
                const role  = v.data.talent_role_name || '—';
                const who   = pu.name || '—';
                const ci    = String(who).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                return `
                  <div class="to-casc-row" data-role="${escAttr(v.data.talent_role_id)}">
                    <span class="to-casc-av" style="background:${color}">${ci}</span>
                    <span class="to-casc-body">
                      <span class="to-casc-role" title="${escAttr(role)}">${role}</span>
                      <span class="to-casc-who" title="${escAttr(who)}">← ${who}${pu.role_fit != null ? ` · fit ${pu.role_fit}` : ''}</span>
                    </span>
                    <span class="to-casc-chip" style="color:${color};border-color:${color};">${band}</span>
                  </div>`;
              }).join('')}
            </div>`;
          el.classList.add('visible');
          el.querySelectorAll('[data-role]').forEach(rowEl => {
            rowEl.onclick = () => { const v = nodeById(rowEl.getAttribute('data-role')); if (v) flyToNodes([v], { ping: [v] }); };
          });
        };

        // Route the shared left-docked panel to whichever simulation is active.
        const renderChangesPanel = () => {
          if (self._scenarioMode) return renderCascade();
          if (self._fitMode)      return renderFitPanel();
          const el = document.getElementById('to-cascade');
          if (el) { el.classList.remove('visible'); el.innerHTML = ''; }
        };

        // Explorer popover with two lenses on the clicked node:
        //   "This role"   → everyone scored for THIS role, best fit first (inverted matrix)
        //   "This person" → every role the CURRENT occupant is scored for, best fit first
        // Either way, clicking a row performs the swap and the org-fit delta updates live.
        function showFitExplorer(event, d) {
          const data      = d.data;
          const ownRoleId = String(data.talent_role_id);
          const esc       = s => String(s == null ? '' : s).replace(/"/g, '&quot;');

          const applyAndRefresh = (flyTargets, rerender) => {
            self._lastOptimize = null;   // a manual placement is no longer "the optimizer's result"
            paintFit();
            renderSummary();
            renderFitPanel();
            rerender();
            if (flyTargets && flyTargets[1]) flyToNodes(flyTargets, { ping: [flyTargets[1]] });
          };

          const render = () => {
            const tab      = self._fitTab === 'person' ? 'person' : 'role';
            const occ      = currentOccupantOf(data);                 // who sits here now
            const occBand  = occ.band || 'N/A';
            const occColor = OHI_COLORS[occBand] || OHI_COLORS['N/A'];
            const initials = (occ.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('');

            // ── Lens A: candidates for THIS role ──
            const cands   = candidatesForRole(ownRoleId);
            const roleRows = cands.length ? cands.map(c => {
              const band  = c.band || 'N/A';
              const color = OHI_COLORS[band] || OHI_COLORS['N/A'];
              const pct   = c.fit != null ? Math.min(100, Math.max(0, Math.round(c.fit))) : 0;
              const seat  = currentSeatOf(c.homeRoleId);
              const here  = seat === ownRoleId;
              const moved = seat !== String(c.homeRoleId);
              const dlt   = (c.fit != null && occ.fit != null) ? Math.round(c.fit - occ.fit) : null;
              const seatNode = nodeById(seat);
              const seatName = here ? 'in this role now'
                             : `now: ${(seatNode ? seatNode.data.talent_role_name : c.homeRoleName) || '—'}`;
              const ci    = (c.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
              return `
                <div class="to-rec-item to-rec-pick" data-pick-person="${esc(c.homeRoleId)}" style="${here ? 'background:rgba(63,140,255,0.16);' : ''}">
                  <span class="to-rec-av" style="background:${color}">${ci}</span>
                  <span class="to-rec-body">
                    <span class="to-rec-nm">${c.name || '—'}${here ? '<span class="to-fit-here">IN ROLE</span>' : (moved ? '<span class="to-fit-cur">MOVED</span>' : '')}</span>
                    <span class="to-rec-sub" title="${esc(seatName)}">${seatName}</span>
                  </span>
                  <span class="to-rec-score">
                    ${dlt != null && !here ? `<span class="to-rec-delta ${dlt > 0 ? 'up' : (dlt < 0 ? 'down' : '')}">${dlt > 0 ? '+' : ''}${dlt}</span>` : ''}
                    <span class="to-score-wrap" style="width:40px;display:inline-block;"><span class="to-score-bar" style="width:${pct}%;background:${color};display:block;"></span></span>
                    <b>${c.fit != null ? c.fit : '—'}</b>
                  </span>
                </div>`;
            }).join('') : `<div class="to-impact-row" style="color:rgba(255,255,255,0.6);">No one has been scored for this role.<br>Ensure <b>employee_role_fits</b> is in the tile query.</div>`;

            // ── Lens B: roles for the CURRENT occupant ──
            const occHome = nodeById(occ.homeRoleId);
            const occData = occHome ? occHome.data : data;
            const pRows   = (Array.isArray(occData.employee_role_fits) ? occData.employee_role_fits.slice() : [])
              .sort((a, b) => (numOr(b.role_fit) ?? -1) - (numOr(a.role_fit) ?? -1));
            const occSeat = currentSeatOf(occ.homeRoleId);
            const personRows = pRows.length ? pRows.map(r => {
              const rid   = String(r.talent_role_id);
              const band  = r.band || 'N/A';
              const color = OHI_COLORS[band] || OHI_COLORS['N/A'];
              const sc    = numOr(r.role_fit);
              const pct   = sc != null ? Math.min(100, Math.max(0, Math.round(sc))) : 0;
              const isAt  = rid === occSeat;
              const isHome = rid === String(occ.homeRoleId);
              const chip  = isAt ? '<span class="to-fit-here">CURRENT</span>' : (isHome ? '<span class="to-fit-cur">HOME</span>' : '');
              return `
                <div class="to-rec-item to-rec-pick" data-pick-role="${esc(rid)}" style="${isAt ? 'background:rgba(63,140,255,0.16);' : ''}">
                  <span class="to-rec-av" style="background:${color}">${(r.talent_role_name || '?').slice(0, 1).toUpperCase()}</span>
                  <span class="to-rec-name" title="${esc(r.talent_role_name)}">${r.talent_role_name || '—'}${chip}</span>
                  <span class="to-rec-score">
                    <span class="to-score-wrap" style="width:44px;display:inline-block;"><span class="to-score-bar" style="width:${pct}%;background:${color};display:block;"></span></span>
                    <b>${sc != null ? sc : '—'}</b>
                  </span>
                </div>`;
            }).join('') : `<div class="to-impact-row" style="color:rgba(255,255,255,0.6);">No role-fit scores available for this person.</div>`;

            self._action.innerHTML = `
              <div class="to-tt-header">
                <div class="to-tt-avatar" style="background:${occColor}">${initials}</div>
                <div>
                  <div class="to-tt-name">${data.talent_role_name || '—'}</div>
                  <div class="to-tt-role">Now: ${esc(occ.name || '—')}${occ.fit != null ? ` · fit ${occ.fit}` : ''}</div>
                </div>
              </div>
              <div class="to-tabs">
                <button class="to-tab ${tab === 'role' ? 'on' : ''}" data-tab="role">This role</button>
                <button class="to-tab ${tab === 'person' ? 'on' : ''}" data-tab="person">This person</button>
              </div>
              <div class="to-impact" style="border-color:${occColor};margin-top:6px;">
                <div class="to-impact-sev" style="color:${occColor};">${tab === 'role' ? `BEST FIT FOR THIS ROLE (${cands.length})` : 'BEST ROLES FOR THIS PERSON'}</div>
                <div class="to-act-note" style="padding:0 0 4px;">${tab === 'role' ? 'Click a person to move them into this role.' : 'Click a role to move this person there.'}</div>
                <div class="to-fit-scroll">${tab === 'role' ? roleRows : personRows}</div>
              </div>`;

            self._action.querySelectorAll('[data-tab]').forEach(btn => {
              btn.onclick = () => { self._fitTab = btn.getAttribute('data-tab'); render(); };
            });

            // Role lens: pick a PERSON (identified by their home role) for this role.
            self._action.querySelectorAll('[data-pick-person]').forEach(item => {
              item.onclick = () => {
                const homeId = item.getAttribute('data-pick-person');
                const seat   = currentSeatOf(homeId);
                let fly = null;
                if (seat === ownRoleId) {
                  undoSwap(data);                       // already here → put things back
                } else {
                  const homeNode = nodeById(homeId);
                  if (homeNode === d)      undoSwap(data);           // their home is this seat → bring home
                  else if (homeNode)     { placeSwap(homeNode, d); fly = [homeNode, d]; }
                }
                applyAndRefresh(fly, render);
              };
            });

            // Person lens: pick a ROLE for the current occupant.
            self._action.querySelectorAll('[data-pick-role]').forEach(item => {
              item.onclick = () => {
                const rid = item.getAttribute('data-pick-role');
                let fly = null;
                if (rid === occSeat) {
                  undoSwap(occData);                    // click current seat → undo
                } else if (rid === String(occ.homeRoleId)) {
                  undoSwap(occData);                    // click HOME → move back home
                } else {
                  const target = nodeById(rid);
                  const home   = nodeById(occ.homeRoleId);
                  if (home && target) { placeSwap(home, target); fly = [home, target]; }
                }
                applyAndRefresh(fly, render);
              };
            });
          };

          render();

          const pad = 12, aw = 252, ah = self._action.offsetHeight || 240;
          let left = event.clientX + pad, top = event.clientY + pad;
          if (left + aw > window.innerWidth)  left = event.clientX - aw - pad;
          if (top  + ah > window.innerHeight) top  = window.innerHeight - ah - pad;
          self._action.style.left = Math.max(8, left) + 'px';
          self._action.style.top  = Math.max(8, top)  + 'px';
          self._action.classList.add('visible');
        }

        // Interactive action card: simulate a departure, then pick a successor to backfill.
        function showActionPopover(event, d) {
          const data   = d.data;

          const render = () => {
            data._simBand = computeBenchRisk(data._simSuccessors, data._benchTarget);
            const isMCP     = isTruthy(data.is_mission_critical_position);
            const baseColor = BENCH_RISK_COLORS[data._baselineBand] || BENCH_RISK_COLORS['N/A'];
            const initials  = (data.employee_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('');
            const esc       = s => String(s == null ? '' : s).replace(/"/g, '&quot;');
            // Who can fill this role if it is vacated:
            //  1) the role's own designated successors (successor_role_fit_scores)
            //  2) fallback — org-wide employees scored on this role, best fit first
            //     (candidate_role_fit_scores) when the role has no successors.
            const ownSucc = Array.isArray(data.successor_role_fit_scores)  ? data.successor_role_fit_scores  : [];
            const orgCand = Array.isArray(data.candidate_role_fit_scores)  ? data.candidate_role_fit_scores  : [];
            // Anyone already chosen to backfill another vacated role has "moved" and
            // can't fill a second seat — exclude them (but keep THIS role's own pick,
            // so it still shows highlighted and can be toggled off).
            const assignedElsewhere = new Set();
            root.descendants().forEach(v => {
              if (v === d) return;
              const f = v.data._filledBy;
              if (f && f.user_id != null && f.user_id !== '') assignedElsewhere.add(String(f.user_id));
            });
            const mapCand = c => ({
              name:  c.successor_name    ?? c.candidate_name    ?? '—',
              uid:   c.successor_user_id ?? c.candidate_user_id ?? null,
              score: c.role_fit_score
            });
            const isAvailable = c => c.uid == null || !assignedElsewhere.has(String(c.uid));
            const availOwn  = ownSucc.map(mapCand).filter(isAvailable);
            const availCand = orgCand.map(mapCand).filter(isAvailable);
            // Fall back to org-wide recs if the role's own successors are all taken.
            const usingOwn  = availOwn.length > 0;
            const succList  = (usingOwn ? availOwn : availCand).slice(0, 5);
            const recColor  = succList.length ? '#27ae60' : '#e74c3c';
            const listTitle = usingOwn ? 'SUCCESSORS' : 'RECOMMENDED SUCCESSORS';
            // No internal bench at all — the role can only be filled by an external hire.
            // Tone/severity keys off mission-criticality (our proxy for cost & urgency).
            const hireMsg = isMCP
              ? '⚠ No bench for this mission-critical role. An external hire is required — the seat stays exposed until filled.'
              : 'No internal successors. This role can be backfilled with an external hire — low disruption.';

            self._action.innerHTML = `
              <div class="to-tt-header">
                <div class="to-tt-avatar" style="background:${baseColor}">${initials}</div>
                <div>
                  <div class="to-tt-name">${data.employee_name || '—'}${isMCP ? ' ⭐' : ''}</div>
                  <div class="to-tt-role">${data.talent_role_name || '—'}</div>
                </div>
              </div>
              <div style="padding-top:6px;">
                <button class="to-act-btn ${data._vacant ? 'danger' : ''}" data-act="depart" style="width:100%;">${data._vacant ? '↩ Cancel departure' : '⚠ Simulate departure'}</button>
              </div>
              ${data._vacant ? (succList.length ? `
              <div class="to-impact" style="border-color:${recColor};">
                <div class="to-impact-sev" style="color:${recColor};">${listTitle}</div>
                <div class="to-act-note" style="padding:0 0 4px;">Click a successor to backfill this role.</div>
                ${succList.map((c, i) => {
                  const nm    = c.name || '—';
                  const scNum = (c.score != null && isFinite(Number(c.score))) ? Number(c.score) : null;
                  const pct   = scNum != null ? Math.min(100, Math.max(0, Math.round(scNum))) : 0;
                  const ci    = nm.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                  const chosen = data._filledBy && c.uid != null && String(data._filledBy.user_id) === String(c.uid);
                  return `
                    <div class="to-rec-item to-rec-pick${chosen ? ' chosen' : ''}" data-pick="1" data-uid="${esc(c.uid ?? '')}" data-name="${esc(nm)}" data-score="${scNum != null ? scNum : ''}">
                      <span class="to-rec-rank">${i + 1}</span>
                      <span class="to-rec-av">${ci}</span>
                      <span class="to-rec-name" title="${esc(nm)}">${nm}${chosen ? ' ✓' : ''}</span>
                      <span class="to-rec-score">
                        <span class="to-score-wrap" style="width:48px;display:inline-block;"><span class="to-score-bar" style="width:${pct}%;background:${recColor};display:block;"></span></span>
                        <b>${scNum != null ? scNum : '—'}</b>
                      </span>
                    </div>`;
                }).join('')}
              </div>` : `
              <div class="to-impact" style="border-color:${data._newHire ? NEWHIRE_FILL : (isMCP ? '#e74c3c' : 'rgba(255,255,255,0.28)')};">
                <div class="to-impact-sev" style="color:${data._newHire ? NEWHIRE_FILL : (isMCP ? '#e74c3c' : 'rgba(255,255,255,0.75)')};">${data._newHire ? 'NEW HIRE PLANNED' : 'NO INTERNAL CANDIDATES'}</div>
                <div class="to-impact-row" style="display:block;line-height:1.45;color:${data._newHire ? 'rgba(255,255,255,0.8)' : (isMCP ? '#ffb4ab' : 'rgba(255,255,255,0.7)')};">${data._newHire ? 'This seat is planned to be filled by an external hire.' : hireMsg}</div>
                <div style="padding-top:8px;">
                  <button class="to-act-btn" data-act="hire" style="width:100%;${data._newHire ? `background:${NEWHIRE_FILL};border-color:${NEWHIRE_FILL};` : ''}">${data._newHire ? '↩ Cancel new hire' : '＋ Backfill with new hire'}</button>
                </div>
              </div>`) : ''}`;

            self._action.querySelectorAll('[data-act]').forEach(btn => {
              btn.onclick = () => {
                const act = btn.getAttribute('data-act');
                if (act === 'depart') {
                  data._vacant = !data._vacant;
                  // Cancelling a departure clears any backfill/fill/hire it took part in.
                  if (!data._vacant) {
                    if (data._filledBy) { const prev = data._filledBy; data._filledBy = null; revertBackfill(prev); }
                    data._backfill = false;
                    data._newHire  = false;
                  }
                }
                if (act === 'hire') data._newHire = !data._newHire;
                data._simBand = computeBenchRisk(data._simSuccessors, data._benchTarget);
                if (!data._vacant && !data._filledBy && !data._backfill && !data._newHire) {
                  self._scenario.delete(data.talent_role_id);
                } else {
                  persistRole(d);
                }
                paintScenario();
                renderSummary();
                renderCascade();
                render();
              };
            });

            // Interactive successors: click to backfill this role with that person
            // (or click the chosen one again to undo it).
            self._action.querySelectorAll('[data-pick]').forEach(item => {
              item.onclick = () => {
                const uidAttr = item.getAttribute('data-uid');
                const uid     = uidAttr === '' ? null : uidAttr;
                const already = data._filledBy && uid != null && String(data._filledBy.user_id) === String(uid);
                let backfilled = [];
                if (already) {
                  cancelFill(d);
                } else {
                  if (data._filledBy) revertBackfill(data._filledBy);
                  const scoreAttr = item.getAttribute('data-score');
                  backfilled = chooseSuccessor(d, {
                    name:          item.getAttribute('data-name'),
                    user_id:       uid,
                    role_fit_score: scoreAttr === '' ? null : Number(scoreAttr)
                  }) || [];
                }
                paintScenario();
                renderSummary();
                renderCascade();
                render();
                // Locate the newly-vacated seat(s) so the user never has to hunt for them.
                if (backfilled.length) flyToNodes([d, ...backfilled], { ping: backfilled });
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

        // Reflect whichever simulation (if any) is active. The two are mutually exclusive.
        const applyActiveMode = () => {
          btnScenario.classList.toggle('scenario-on', self._scenarioMode);
          btnFit.classList.toggle('fit-on', self._fitMode);
          btnReset.style.display = (self._scenarioMode || self._fitMode) ? '' : 'none';
          btnOhi.disabled   = self._scenarioMode || self._fitMode;
          btnBench.disabled = self._scenarioMode || self._fitMode;
          btnScenario.disabled = self._fitMode;
          btnFit.disabled      = self._scenarioMode;

          if (self._scenarioMode) {
            self._colorMode = 'bench_risk';
            btnBench.classList.add('active'); btnOhi.classList.remove('active');
            paintScenario();
          } else if (self._fitMode) {
            self._colorMode = 'org_health';
            btnOhi.classList.add('active'); btnBench.classList.remove('active');
            paintFit();
          } else {
            self._action.classList.remove('visible');
            clearScenarioPaint();
          }
          renderColorLegend();
          renderSummary();
          renderChangesPanel();
        };

        btnScenario.onclick = () => {
          if (self._fitMode) return;
          self._hideEmployeeCard();
          self._scenarioMode = !self._scenarioMode;
          self._action.classList.remove('visible');
          if (self._scenarioMode) {
            self._preColorMode = self._colorMode;
          } else if (self._preColorMode) {
            self._colorMode = self._preColorMode;
            btnOhi.classList.toggle('active', self._colorMode !== 'bench_risk');
            btnBench.classList.toggle('active', self._colorMode === 'bench_risk');
          }
          applyActiveMode();
        };

        btnFit.onclick = () => {
          if (self._scenarioMode) return;
          self._hideEmployeeCard();
          self._fitMode = !self._fitMode;
          self._lastOptimize = null;
          self._action.classList.remove('visible');
          if (self._fitMode) {
            self._preColorMode = self._colorMode;
          } else if (self._preColorMode) {
            self._colorMode = self._preColorMode;
            btnOhi.classList.toggle('active', self._colorMode !== 'bench_risk');
            btnBench.classList.toggle('active', self._colorMode === 'bench_risk');
          }
          applyActiveMode();
        };

        btnReset.onclick = () => {
          if (self._fitMode) {
            self._fitScenario.clear();
            nodes.forEach(n => { n._placedUser = null; n._swapWith = null; });
            self._lastOptimize = null;
            self._action.classList.remove('visible');
            paintFit();
            renderSummary();
            renderFitPanel();
            return;
          }
          self._scenario.clear();
          nodes.forEach(n => {
            n._simSuccessors = n._baselineSuccessors;
            n._benchTarget   = n._baselineTarget;
            n._vacant   = false;
            n._backfill = false;
            n._filledBy = null;
            n._newHire  = false;
            n._simBand  = n._baselineBand;
          });
          self._action.classList.remove('visible');
          self._gapIdx = 0;
          paintScenario();
          renderSummary();
          renderCascade();
        };

        // Reflect the current mode after every (re-)render, and paint the summary.
        applyActiveMode();

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
