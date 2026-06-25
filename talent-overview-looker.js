(function () {

  function init() {
    looker.plugins.visualizations.add({

      options: {
        color_high: {
          label: 'High',
          default: '#27ae60',
          type: 'string',
          display: 'color',
          section: 'Colors'
        },
        color_medium: {
          label: 'Medium',
          default: '#e67e22',
          type: 'string',
          display: 'color',
          section: 'Colors'
        },
        color_low: {
          label: 'Low',
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
            { 'Bench Strength': 'bench' }
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
          .to-legend { position:absolute; bottom:10px; left:10px; display:flex; gap:12px; background:rgba(255,255,255,0.95); padding:6px 11px; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.12); }
          .to-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#555; }
          .to-legend-dot { width:8px; height:8px; border-radius:50%; }
          .to-zoom { position:absolute; top:10px; right:10px; display:flex; flex-direction:column; gap:4px; z-index:10; }
          .to-zoom-btn { width:28px; height:28px; border:1px solid #ddd; background:#fff; border-radius:5px; font-size:15px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
          .to-zoom-btn:hover { background:#f0f0f0; }
          .to-tooltip { position:fixed; pointer-events:none; background:#fff; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15); padding:12px 14px; min-width:200px; max-width:240px; font-size:12px; z-index:1000; opacity:0; transition:opacity 0.15s ease; }
          .to-tooltip.visible { opacity:1; }
          .to-tt-header { display:flex; align-items:center; gap:9px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #f0f0f0; }
          .to-tt-avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:bold; flex-shrink:0; }
          .to-tt-name { font-weight:700; font-size:13px; color:#222; }
          .to-tt-role { font-size:11px; color:#888; margin-top:1px; }
          .to-tt-row { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:3px 0; }
          .to-tt-label { color:#aaa; font-size:11px; white-space:nowrap; flex-shrink:0; }
          .to-tt-value { color:#333; font-size:11px; font-weight:500; text-align:right; word-break:break-word; }
          .to-tt-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; }
          .to-tt-dot { width:8px; height:8px; border-radius:50%; }
          .to-score-wrap { background:#f0f0f0; border-radius:3px; height:5px; overflow:hidden; width:70px; }
          .to-score-bar { height:100%; border-radius:3px; }
        `;
        element.appendChild(style);

        const toggle = document.createElement('div');
        toggle.className = 'to-toggle';
        toggle.innerHTML = `
          <span>Color by:</span>
          <button class="to-btn active" id="to-btn-ohi">Org Health Index</button>
          <button class="to-btn" id="to-btn-bench">Bench Strength</button>
        `;
        element.appendChild(toggle);

        const legend = document.createElement('div');
        legend.className = 'to-legend';
        legend.id = 'to-legend';
        element.appendChild(legend);

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

        // Match field names that END with the keyword to avoid partial collisions
        // e.g. 'talent_role_id' must not match 'parent_talent_role_id'
        const pick = (row, keyword) => {
          const key = fieldNames.find(f => {
            const lower = f.toLowerCase();
            return lower === keyword || lower.endsWith('.' + keyword) || lower.endsWith('_' + keyword);
          });
          if (!key) return undefined;
          const cell = row[key];
          return cell && typeof cell === 'object' && 'value' in cell ? cell.value : cell;
        };

        // Normalise bench_strength — handles numeric (1/2/3) or string values
        const normBench = v => {
          if (v === null || v === undefined) return 'N/A';
          const s = String(v).toLowerCase().trim();
          if (s === 'high'   || s === '3') return 'High';
          if (s === 'medium' || s === '2') return 'Medium';
          if (s === 'low'    || s === '1') return 'Low';
          return 'N/A';
        };

        const nodes = data.map(row => ({
          talent_role_id:          String(pick(row, 'talent_role_id') ?? ''),
          parent_talent_role_id:   pick(row, 'parent_talent_role_id') != null ? String(pick(row, 'parent_talent_role_id')) : null,
          employee_name:           pick(row, 'employee_name') ?? pick(row, 'name') ?? '—',
          talent_role_name:        pick(row, 'talent_role_name') ?? pick(row, 'role_name') ?? '—',
          parent_talent_role_name: pick(row, 'parent_talent_role_name') ?? null,
          client_name:             pick(row, 'client_name') ?? '—',
          bench_strength:          normBench(pick(row, 'bench_strength')),
          role_fit_score:          pick(row, 'role_fit_score'),
          org_health_index:        pick(row, 'org_health_index') ?? 'N/A'
        }));

        if (!nodes.length) { done(); return; }

        const OHI_COLORS = {
          High:   config.color_high   || '#27ae60',
          Medium: config.color_medium || '#e67e22',
          Low:    config.color_low    || '#e74c3c',
          'N/A':  config.color_na     || '#95a5a6'
        };
        const BENCH_COLORS = {
          High:   '#2980b9',
          Medium: '#8e44ad',
          Low:    '#c0392b',
          'N/A':  '#95a5a6'
        };

        this._colorMode = config.color_mode || 'org_health';

        const nodeColor = d => this._colorMode === 'org_health'
          ? (OHI_COLORS[d.data.org_health_index]  || OHI_COLORS['N/A'])
          : (BENCH_COLORS[d.data.bench_strength]  || BENCH_COLORS['N/A']);

        const scheme = this._colorMode === 'org_health' ? OHI_COLORS : BENCH_COLORS;
        document.getElementById('to-legend').innerHTML = Object.entries(scheme)
          .map(([k, c]) => `<div class="to-legend-item"><div class="to-legend-dot" style="background:${c}"></div>${k}</div>`)
          .join('');

        let root;
        try {
          root = d3.stratify()
            .id(d => d.talent_role_id)
            .parentId(d => d.parent_talent_role_id)(nodes);
        } catch (e) {
          element.insertAdjacentHTML('beforeend', `<p style="padding:16px;color:red;">Tree error: ${e.message}</p>`);
          done();
          return;
        }

        const W  = this._chart.offsetWidth  || 800;
        const H  = this._chart.offsetHeight || 600;
        const cx = W / 2;
        const cy = H / 2;

        const leafCount   = root.leaves().length;
        const minRadius   = Math.min(W, H) / 2 - 60;
        const radius      = Math.max(minRadius, (leafCount * 22) / (2 * Math.PI));
        const fitScale    = Math.min(1, (Math.min(W, H) - 80) / (radius * 2 + 120));

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

        // Concentric guide rings
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

        // Links
        g.append('g').attr('fill', 'none').attr('stroke', '#ccc').attr('stroke-width', 1)
          .selectAll('path').data(root.links()).join('path')
          .attr('d', d3.linkRadial().angle(d => d.x).radius(d => d.y));

        // Nodes
        const self  = this;
        const nodeG = g.append('g').selectAll('g').data(root.descendants()).join('g')
          .attr('transform', d => {
            const [x, y] = radialPoint(d.x, d.y);
            return `translate(${x},${y})`;
          })
          .style('cursor', 'pointer')
          .on('click', function (event, d) {
            event.stopPropagation();
            self._showTooltip(event, d, OHI_COLORS, BENCH_COLORS);
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

        // Zoom button wiring
        document.getElementById('to-zoom-in').onclick    = () => svg.transition().duration(250).call(zoomBehavior.scaleBy, 1.3);
        document.getElementById('to-zoom-out').onclick   = () => svg.transition().duration(250).call(zoomBehavior.scaleBy, 0.77);
        document.getElementById('to-zoom-reset').onclick = () => svg.transition().duration(350).call(zoomBehavior.transform, this._initT);

        // Color toggle wiring
        document.getElementById('to-btn-ohi').onclick = () => {
          document.getElementById('to-btn-ohi').classList.add('active');
          document.getElementById('to-btn-bench').classList.remove('active');
          this._colorMode = 'org_health';
          nodeG.selectAll('circle:not(.to-node-circle)').attr('fill', d => nodeColor(d));
          document.getElementById('to-legend').innerHTML = Object.entries(OHI_COLORS)
            .map(([k, c]) => `<div class="to-legend-item"><div class="to-legend-dot" style="background:${c}"></div>${k}</div>`).join('');
        };
        document.getElementById('to-btn-bench').onclick = () => {
          document.getElementById('to-btn-bench').classList.add('active');
          document.getElementById('to-btn-ohi').classList.remove('active');
          this._colorMode = 'bench';
          nodeG.selectAll('circle:not(.to-node-circle)').attr('fill', d => nodeColor(d));
          document.getElementById('to-legend').innerHTML = Object.entries(BENCH_COLORS)
            .map(([k, c]) => `<div class="to-legend-item"><div class="to-legend-dot" style="background:${c}"></div>${k}</div>`).join('');
        };

        done();
      },

      _showTooltip(event, d, OHI_COLORS, BENCH_COLORS) {
        const data     = d.data;
        const ohi      = data.org_health_index || 'N/A';
        const bench    = data.bench_strength   || 'N/A';
        const score    = data.role_fit_score;
        const color    = OHI_COLORS[ohi] || OHI_COLORS['N/A'];
        const initials = (data.employee_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('');
        const scorePct = score != null ? Math.min(100, Math.round(score)) : 0;

        this._tooltip.innerHTML = `
          <div class="to-tt-header">
            <div class="to-tt-avatar" style="background:${color}">${initials}</div>
            <div>
              <div class="to-tt-name">${data.employee_name || '—'}</div>
              <div class="to-tt-role">${data.talent_role_name || '—'}</div>
            </div>
          </div>
          <div class="to-tt-row">
            <span class="to-tt-label">Org Health</span>
            <span class="to-tt-badge">
              <span class="to-tt-dot" style="background:${color}"></span>
              <b>${ohi}</b>
            </span>
          </div>
          <div class="to-tt-row" style="align-items:center;">
            <span class="to-tt-label">Role Fit</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <b class="to-tt-value">${score != null ? score : '—'}</b>
              <div class="to-score-wrap">
                <div class="to-score-bar" style="width:${scorePct}%;background:${color}"></div>
              </div>
            </span>
          </div>
          <div class="to-tt-row">
            <span class="to-tt-label">Bench Strength</span>
            <span class="to-tt-value" style="color:${BENCH_COLORS[bench] || '#333'}">${bench}</span>
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

        const pad = 12, tw = 240, th = 190;
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

  // Self-load D3 v7 if not already present, then initialise
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
