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
        `;
        element.appendChild(style);

        const toggle = document.createElement('div');
        toggle.className = 'to-toggle';
        toggle.innerHTML = `
          <span>Color by:</span>
          <button class="to-btn active" id="to-btn-ohi">Org Health Index</button>
          <button class="to-btn" id="to-btn-bench-risk">Bench Risk</button>
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

        const chart = document.createElement('div');
        chart.id = 'to-chart';
        chart.style.cssText = 'position:absolute; inset:0;';
        element.appendChild(chart);

        const tooltip = document.createElement('div');
        tooltip.className = 'to-tooltip';
        tooltip.id = 'to-tooltip';
        document.body.appendChild(tooltip);

        this._chart     = chart;
        this._tooltip   = tooltip;
        this._colorMode = 'org_health';
        this._svg       = null;
        this._nodeG     = null;
        this._zoom      = null;
        this._initT     = null;

        document.addEventListener('click', () => {
          tooltip.classList.remove('visible');
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

        const nodes = data.map(row => ({
          talent_role_id:             String(pick(row, 'talent_role_id') ?? ''),
          parent_talent_role_id:      (v => (v != null && v !== '' && v !== 'null') ? String(v) : null)(pick(row, 'parent_talent_role_id')),
          employee_name:              pick(row, 'employee_name') ?? pick(row, 'name') ?? '—',
          talent_role_name:           pick(row, 'talent_role_name') ?? pick(row, 'role_name') ?? '—',
          parent_talent_role_name:    pick(row, 'parent_talent_role_name') ?? null,
          client_name:                pick(row, 'client_name') ?? '—',
          bench_strength:             normBench(pick(row, 'bench_strength')),
          bench_risk:                 pick(row, 'bench_risk') ?? 'N/A',
          is_mission_critical_position: pick(row, 'is_mission_critical_position'),
          is_talent:                  pick(row, 'is_talent'),
          role_fit_score:             pick(row, 'role_fit_score'),
          org_health_index:           pick(row, 'org_health_index') ?? 'N/A'
        }));

        if (!nodes.length) { done(); return; }

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

        this._colorMode = config.color_mode || 'org_health';

        const nodeColor = d => {
          if (this._colorMode === 'bench_risk') {
            return BENCH_RISK_COLORS[d.data.bench_risk] || BENCH_RISK_COLORS['N/A'];
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

        // ── Summary stats ──────────────────────────────────────────
        const totalEmployees    = nodes.length;
        const isTrue = v => v === true || v === 1 || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes';
        const totalMissionCritical = nodes.filter(n => isTrue(n.is_mission_critical_position)).length;
        const totalCriticalTalent  = nodes.filter(n => isTrue(n.is_talent)).length;

        const ohiGroups = { High: 0, Medium: 0, Low: 0, 'N/A': 0 };
        const brGroups  = { 'Low Risk': 0, 'Mid Risk': 0, 'High Risk': 0, 'N/A': 0 };
        nodes.forEach(n => {
          const ohi = n.org_health_index || 'N/A';
          if (ohi in ohiGroups) ohiGroups[ohi]++; else ohiGroups['N/A']++;
          const br = n.bench_risk || 'N/A';
          if (br in brGroups) brGroups[br]++; else brGroups['N/A']++;
        });

        const dot = color => `<span class="to-summary-dot" style="background:${color}"></span>`;

        document.getElementById('to-summary').innerHTML = `
          <div class="to-summary-title">Summary</div>
          <div class="to-summary-row"><span class="to-summary-label">Employees</span><span class="to-summary-value">${totalEmployees}</span></div>
          <div class="to-summary-row"><span class="to-summary-label">Mission Critical</span><span class="to-summary-value">${totalMissionCritical}</span></div>
          <div class="to-summary-row"><span class="to-summary-label">Critical Talent</span><span class="to-summary-value">${totalCriticalTalent}</span></div>
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
            ${Object.entries(brGroups).map(([k, v]) => `
              <div class="to-summary-dot-row">
                <span style="display:flex;align-items:center;gap:5px;">${dot(BENCH_RISK_COLORS[k] || '#95a5a6')}<span class="to-summary-label">${k}</span></span>
                <span class="to-summary-value">${v}</span>
              </div>`).join('')}
          </div>
        `;

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

        g.append('g').attr('fill', 'none').attr('stroke', '#ccc').attr('stroke-width', 1)
          .selectAll('path').data(root.links()).join('path')
          .attr('d', d3.linkRadial().angle(d => d.x).radius(d => d.y));

        const self  = this;
        const nodeG = g.append('g').selectAll('g').data(root.descendants()).join('g')
          .attr('transform', d => {
            const [x, y] = radialPoint(d.x, d.y);
            return `translate(${x},${y})`;
          })
          .style('cursor', 'pointer')
          .on('click', function (event, d) {
            event.stopPropagation();
            self._showTooltip(event, d, OHI_COLORS, BENCH_RISK_COLORS);
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

        const pad = 12, tw = 240, th = 210;
        let left = event.clientX + pad;
        let top  = event.clientY + pad;
        if (left + tw > window.innerWidth)  left = event.clientX - tw - pad;
        if (top  + th > window.innerHeight) top  = event.clientY - th - pad;

        this._tooltip.style.left = left + 'px';
        this._tooltip.style.top  = top  + 'px';
        this._tooltip.classList.add('visible');
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
