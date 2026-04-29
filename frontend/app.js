'use strict';

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';
const api = {
  _get(path) { return fetch(API_BASE + path).then(r => r.json()); },
  _post(path, body) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json());
  },
  stats:         () => api._get('/api/stats'),
  monthlyRevenue:() => api._get('/api/revenue/monthly'),
  topCustomers:  () => api._get('/api/customers/top'),
  topProducts:   () => api._get('/api/products/top'),
  segments:      () => api._get('/api/segments'),
  products:      () => api._get('/api/products'),
  recommend:     (stock_code, top_n = 5) => api._post('/api/recommend', { stock_code, top_n }),
};

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  chart:    null,
  products: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _renderToken = 0;

function freshToken() {
  return ++_renderToken;
}

function isStale(token) {
  return token !== _renderToken;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function icon(name, filled = false) {
  const cls = filled ? 'material-symbols-outlined icon-filled' : 'material-symbols-outlined';
  return `<span class="${cls}">${name}</span>`;
}

const fmt = {
  currency: (n) => '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }),
  currencyShort: (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }),
  number:   (n) => Number(n).toLocaleString(),
};

function setHTML(el, html) {
  el.innerHTML = html;
}

function q(selector, root = document) {
  return root.querySelector(selector);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function renderDashboard() {
  const token = freshToken();
  const page = q('#page');

  const AVATAR_COLORS = [
    { bg: '#1b7ab5', fg: '#fdfcff' },
    { bg: '#ffddb1', fg: '#291800' },
    { bg: '#ffdad5', fg: '#610001' },
    { bg: '#e6e8ed', fg: '#181c20' },
    { bg: '#e6e8ed', fg: '#181c20' },
  ];

  setHTML(page, `
    <div class="space-y">
      <section class="grid-3">
        <div class="stat-card">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-bottom">
            <div class="stat-value loading-text" id="stat-revenue">loading…</div>
            <div class="stat-badge">${icon('show_chart')} Live</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Customers</div>
          <div class="stat-bottom">
            <div class="stat-value loading-text" id="stat-customers">loading…</div>
            <div class="stat-badge">${icon('show_chart')} Live</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Transactions</div>
          <div class="stat-bottom">
            <div class="stat-value loading-text" id="stat-transactions">loading…</div>
            <div class="stat-badge">${icon('show_chart')} Live</div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-title">Monthly Revenue</div>
        <div style="position:relative; height:300px;" id="chart-wrap">
          <canvas id="revenue-chart"></canvas>
        </div>
      </section>

      <section class="grid-2">
        <div class="card" id="top-customers-card">
          <div class="section-title">Top 5 Customers by Spending</div>
          <div class="loading-text">loading…</div>
        </div>
        <div class="card" id="top-products-card">
          <div class="section-title">Top 5 Products by Quantity</div>
          <div class="loading-text">loading…</div>
        </div>
      </section>
    </div>
  `);

  const [stats, monthly, customers, products] = await Promise.all([
    api.stats(), api.monthlyRevenue(), api.topCustomers(), api.topProducts(),
  ]);

  if (isStale(token)) return;

  // Stats
  const revEl = q('#stat-revenue');
  const cusEl = q('#stat-customers');
  const txEl  = q('#stat-transactions');
  if (revEl) { revEl.textContent = fmt.currency(stats.revenue);      revEl.classList.remove('loading-text'); }
  if (cusEl) { cusEl.textContent = fmt.number(stats.customers);      cusEl.classList.remove('loading-text'); }
  if (txEl)  { txEl.textContent  = fmt.number(stats.transactions);   txEl.classList.remove('loading-text'); }

  // Chart
  if (state.chart) { state.chart.destroy(); state.chart = null; }
  const canvas = q('#revenue-chart');
  const chartWrap = q('#chart-wrap');
  if (canvas && monthly.length === 0) {
    setHTML(chartWrap, '<div class="empty-state" style="height:100%;display:flex;flex-direction:column;justify-content:center;">' +
      icon('bar_chart') + '<p>No monthly data available.</p></div>');
  } else if (canvas) {
    state.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: monthly.map(d => d.month),
        datasets: [{
          data: monthly.map(d => d.revenue),
          fill: true,
          borderColor: '#006193',
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return 'rgba(0,97,147,0.12)';
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(0,97,147,0.22)');
            g.addColorStop(1, 'rgba(0,97,147,0)');
            return g;
          },
          borderWidth: 2,
          pointBackgroundColor: '#006193',
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => fmt.currency(c.raw),
            },
          },
        },
        scales: {
          x: {
            border: { display: false },
            grid:   { display: false },
            ticks:  { color: '#404850', font: { size: 12 } },
          },
          y: {
            border: { display: false },
            grid:   { color: '#e0e2e8' },
            ticks: {
              color: '#404850',
              font: { size: 12 },
              callback: (v) => `$${(v / 1000).toFixed(0)}k`,
            },
          },
        },
      },
    });
  }

  // Top Customers
  const custCard = q('#top-customers-card');
  if (custCard) {
    setHTML(custCard, `
      <div class="section-title">Top 5 Customers by Spending</div>
      ${customers.length === 0
        ? '<p class="loading-text">No data.</p>'
        : `<ul class="list-rows">
            ${customers.map((c, i) => `
              <li class="list-item">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="avatar-sm" style="background:${AVATAR_COLORS[i].bg};color:${AVATAR_COLORS[i].fg};">
                    #${esc(String(c.customer_id).slice(-3))}
                  </div>
                  <div>
                    <div style="font-size:15px;font-weight:500;">Customer ${esc(c.customer_id)}</div>
                    <div style="font-size:12px;color:var(--on-surface-variant);">${esc(c.frequency)} orders</div>
                  </div>
                </div>
                <span style="font-size:14px;font-weight:600;color:var(--on-surface-variant);">
                  ${fmt.currency(c.monetary)}
                </span>
              </li>
            `).join('')}
          </ul>`
      }
    `);
  }

  // Top Products
  const prodCard = q('#top-products-card');
  if (prodCard) {
    setHTML(prodCard, `
      <div class="section-title">Top 5 Products by Quantity</div>
      ${products.length === 0
        ? '<p class="loading-text">No data.</p>'
        : `<ul class="list-rows">
            ${products.map(p => `
              <li class="list-item">
                <span style="font-size:14px;font-weight:500;flex:1;padding-right:12px;">${esc(p.product)}</span>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                  ${icon('trending_up')}
                  <span style="font-size:14px;font-weight:600;">${fmt.number(p.quantity_sold)} units</span>
                </div>
              </li>
            `).join('')}
          </ul>`
      }
    `);
  }
}

// ─── Segments ─────────────────────────────────────────────────────────────────
async function renderSegments() {
  const token = freshToken();
  const page = q('#page');

  setHTML(page, `
    <div class="page-header">
      <h1>Customer Segments</h1>
      <p>Customer clusters based on Recency, Frequency, and Monetary purchasing behavior.</p>
    </div>
    <div class="loading-text">Loading segments…</div>
  `);

  const data = await api.segments();
  if (isStale(token)) return;

  const CONFIGS = [
    {
      label: 'VIP',
      desc: 'Highest-value customers. Frequent buyers with large orders. Requires priority attention.',
      icon: 'diamond',
      cssClass: 'vip',
      badgeText: 'Top Tier',
      badgeBg: '#f3e8ff', badgeColor: '#6b21a8',
      iconBg: '#ede9fe',  iconColor: '#7c3aed',
    },
    {
      label: 'Loyal',
      desc: 'Regular customers with a high purchase frequency. Core of your recurring revenue.',
      icon: 'favorite',
      cssClass: '',
      badgeText: 'Healthy',
      badgeBg: '#dcfce7', badgeColor: '#166534',
      iconBg: '#cce5ff',  iconColor: '#006193',
    },
    {
      label: 'At Risk',
      desc: "Previously active customers who haven't purchased recently. Prime re-engagement candidates.",
      icon: 'warning',
      cssClass: '',
      badgeText: 'Monitor',
      badgeBg: '#fef9c3', badgeColor: '#854d0e',
      iconBg: '#ffddb1',  iconColor: '#7d5400',
    },
    {
      label: 'Inactive',
      desc: 'Customers with no activity for an extended period. Require aggressive win-back strategies.',
      icon: 'bedtime',
      cssClass: '',
      badgeText: 'Dormant',
      badgeBg: '#f3f4f6', badgeColor: '#374151',
      iconBg: '#e0e2e8',  iconColor: '#404850',
    },
  ];

  if (data.averages.length === 0) {
    setHTML(page, `
      <div class="page-header">
        <h1>Customer Segments</h1>
        <p>Customer clusters based on Recency, Frequency, and Monetary purchasing behavior.</p>
      </div>
      <div class="empty-state">
        ${icon('group_off')}
        <p>No segment data available. Ensure the Excel file is in the data folder.</p>
      </div>
    `);
    return;
  }

  const countMap = {};
  data.counts.forEach(c => { countMap[c.cluster] = c.customers; });

  const sorted = [...data.averages].sort((a, b) => b.monetary - a.monetary);
  const segments = sorted.map((seg, i) => ({
    ...seg,
    ...(CONFIGS[i] || CONFIGS[3]),
    customers: countMap[seg.cluster] || 0,
  }));

  setHTML(page, `
    <div class="page-header">
      <h1>Customer Segments</h1>
      <p>Customer clusters based on Recency, Frequency, and Monetary purchasing behavior.</p>
    </div>
    <div class="grid-segments">
      ${segments.map(seg => `
        <div class="seg-card ${seg.cssClass}">
          <div class="seg-card-header">
            <div class="seg-icon-wrap">
              <div class="seg-icon" style="background:${seg.iconBg};color:${seg.iconColor};">
                ${icon(seg.icon, true)}
              </div>
              <span class="seg-label">${esc(seg.label)}</span>
            </div>
            <span class="badge" style="background:${seg.badgeBg};color:${seg.badgeColor};">${esc(seg.badgeText)}</span>
          </div>
          <p class="seg-desc">${esc(seg.desc)}</p>
          <div class="seg-stats">
            <div>
              <div class="seg-stat-label">Recency</div>
              <div class="seg-stat-val">${seg.recency}d</div>
            </div>
            <div>
              <div class="seg-stat-label">Frequency</div>
              <div class="seg-stat-val">${seg.frequency}x</div>
            </div>
            <div>
              <div class="seg-stat-label">Monetary</div>
              <div class="seg-stat-val">${fmt.currencyShort(seg.monetary)}</div>
            </div>
          </div>
          <div class="seg-customers">
            <div class="seg-customers-label">Customers</div>
            <div class="seg-customers-val">${fmt.number(seg.customers)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `);
}

// ─── Recommendations ──────────────────────────────────────────────────────────
async function renderRecommendations() {
  const token = freshToken();
  const page = q('#page');

  setHTML(page, `
    <div class="space-y">
      <div class="page-header">
        <h1>Product Recommendations</h1>
        <p>Identify cross-selling opportunities based on customer purchase history.</p>
      </div>

      <section class="card" style="max-width:900px;">
        <div class="section-title">Search a Product</div>
        <label style="font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--on-surface-variant);display:block;margin-bottom:8px;">
          Search by SKU or Name
        </label>
        <div class="input-wrap" style="position:relative;max-width:600px;">
          ${icon('search')}
          <input id="product-search" class="input-field" type="text"
            placeholder="e.g. White Hanging Heart T-Light Holder" autocomplete="off">
          <ul id="product-dropdown" class="dropdown"></ul>
        </div>
        <p style="font-size:12px;color:var(--on-surface-variant);margin-top:10px;">
          Select a product from the list to see recommendations.
        </p>
      </section>

      <section id="rec-results" style="display:none;max-width:900px;" class="space-y">
        <div style="border-bottom:1px solid var(--outline-variant);padding-bottom:16px;">
          <div class="section-title" style="margin-bottom:4px;">Top Matches</div>
          <p id="rec-subtitle" style="font-size:12px;color:var(--on-surface-variant);"></p>
        </div>
        <div id="rec-list"></div>
      </section>
    </div>
  `);

  if (isStale(token)) return;

  if (state.products.length === 0) {
    state.products = await api.products();
  }
  if (isStale(token)) return;

  const searchInput = q('#product-search');
  const dropdown    = q('#product-dropdown');

  function renderDropdown(items) {
    if (items.length === 0) { dropdown.classList.remove('open'); return; }
    setHTML(dropdown, items.map(p => `
      <li class="dropdown-item" data-code="${esc(String(p.stock_code))}" data-desc="${esc(p.description)}">
        <strong style="color:var(--primary);">${esc(String(p.stock_code))}</strong> — ${esc(p.description)}
      </li>
    `).join(''));
    dropdown.classList.add('open');
  }

  async function fetchAndShowResults(selected) {
    const recResults  = q('#rec-results');
    const recSubtitle = q('#rec-subtitle');
    const recList     = q('#rec-list');

    recSubtitle.textContent = `Based on "${selected.description}"`;
    recResults.style.display = 'block';
    setHTML(recList, `<p class="loading-text">Computing recommendations…</p>`);

    const fetchToken = freshToken();
    const results = await api.recommend(selected.stock_code);
    if (isStale(fetchToken)) return;

    if (results.length === 0) {
      setHTML(recList, `
        <div class="empty-state">
          ${icon('search_off')}
          <p>No recommendations found for this product.</p>
        </div>
      `);
      return;
    }

    setHTML(recList, `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${results.map((rec, i) => {
          const pct = Math.round(rec.similarity * 100);
          let badgeBg, badgeColor;
          if (pct >= 90)      { badgeBg = '#ffddb1'; badgeColor = '#7d5400'; }
          else if (pct >= 75) { badgeBg = '#cce5ff'; badgeColor = '#006193'; }
          else                { badgeBg = '#e0e2e8'; badgeColor = '#404850'; }
          return `
            <div class="rec-item">
              <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;">
                <div class="rec-rank">${i + 1}</div>
                <div style="min-width:0;">
                  <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${esc(rec.description)}
                  </div>
                  <div style="font-size:12px;color:var(--on-surface-variant);">SKU: ${esc(rec.stock_code)}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <span class="match-badge" style="background:${badgeBg};color:${badgeColor};">
                  ${icon('trending_up')} ${pct}% Match
                </span>
                ${icon('chevron_right')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `);
  }

  searchInput.addEventListener('input', () => {
    const q2 = searchInput.value.toLowerCase().trim();
    if (q2.length < 2) { dropdown.classList.remove('open'); return; }
    const filtered = state.products.filter(p =>
      p.description?.toLowerCase().includes(q2) ||
      String(p.stock_code).toLowerCase().includes(q2)
    ).slice(0, 8);
    renderDropdown(filtered);
  });

  dropdown.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const selected = { stock_code: item.dataset.code, description: item.dataset.desc };
    searchInput.value = `${selected.stock_code} — ${selected.description}`;
    dropdown.classList.remove('open');
    fetchAndShowResults(selected);
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('open'), 160);
  });
}

// ─── Update Data ──────────────────────────────────────────────────────────────
async function renderUpdateData() {
  const token = freshToken();
  const page = q('#page');

  setHTML(page, `
    <div class="space-y" style="max-width:700px;">
      <div class="page-header">
        <h1>Update Data</h1>
        <p>Replace the current dataset by dropping a new Excel or CSV file.</p>
      </div>

      <section class="card">
        <div class="section-title">Current File</div>
        <div id="file-info" class="loading-text">Loading…</div>
      </section>

      <section class="card">
        <div class="section-title">Upload New File</div>
        <div class="drop-zone" id="drop-zone">
          <span class="material-symbols-outlined">upload_file</span>
          <div class="drop-zone-title">Drop your file here</div>
          <div class="drop-zone-sub">or click to browse — .xlsx, .xls, .csv accepted</div>
          <div id="chosen-file"></div>
        </div>
        <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none;">

        <div style="margin-top:20px;display:flex;gap:12px;align-items:center;">
          <button id="upload-btn" class="btn-primary" disabled>
            ${icon('cloud_upload')} Replace Dataset
          </button>
          <span id="upload-status"></span>
        </div>
      </section>
    </div>
  `);

  // Load current file info
  const info = await api._get('/api/datafile');
  if (isStale(token)) return;
  const fileInfoEl = q('#file-info');
  if (fileInfoEl) {
    fileInfoEl.classList.remove('loading-text');
    fileInfoEl.innerHTML = info.exists
      ? `<div style="display:flex;align-items:center;gap:10px;">
           ${icon('description')}
           <span style="font-weight:600;">${esc(info.name)}</span>
           <span style="color:var(--on-surface-variant);font-size:13px;">${info.size_mb} MB</span>
         </div>`
      : `<span style="color:var(--on-surface-variant);">No data file found.</span>`;
  }

  const dropZone  = q('#drop-zone');
  const fileInput = q('#file-input');
  const uploadBtn = q('#upload-btn');
  let chosenFile  = null;

  function setFile(file) {
    if (!file) return;
    chosenFile = file;
    setHTML(q('#chosen-file'), `<div class="file-pill">${icon('check_circle')} ${esc(file.name)}</div>`);
    uploadBtn.disabled = false;
    setHTML(q('#upload-status'), '');
  }

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  uploadBtn.addEventListener('click', async () => {
    if (!chosenFile) return;

    uploadBtn.disabled = true;
    setHTML(uploadBtn, `${icon('hourglass_empty')} Uploading…`);
    setHTML(q('#upload-status'), '');

    const form = new FormData();
    form.append('file', chosenFile);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) {
        setHTML(q('#upload-status'), `
          <span class="upload-status error">${icon('error')} ${esc(data.detail || 'Upload failed.')}</span>
        `);
      } else {
        setHTML(q('#upload-status'), `
          <span class="upload-status success">${icon('check_circle')} Loaded ${Number(data.rows).toLocaleString()} rows successfully.</span>
        `);
        // refresh file info
        const updated = await api._get('/api/datafile');
        const fi = q('#file-info');
        if (fi && updated.exists) {
          fi.innerHTML = `<div style="display:flex;align-items:center;gap:10px;">
            ${icon('description')}
            <span style="font-weight:600;">${esc(updated.name)}</span>
            <span style="color:var(--on-surface-variant);font-size:13px;">${updated.size_mb} MB</span>
          </div>`;
        }
        // reset
        chosenFile = null;
        setHTML(q('#chosen-file'), '');
        fileInput.value = '';
      }
    } catch {
      setHTML(q('#upload-status'), `
        <span class="upload-status error">${icon('error')} Network error — is the server running?</span>
      `);
    }

    setHTML(uploadBtn, `${icon('cloud_upload')} Replace Dataset`);
    uploadBtn.disabled = !chosenFile;
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────
const PAGES = {
  dashboard:       { title: 'Dashboard Overview',       render: renderDashboard       },
  segments:        { title: 'Customer Segments',         render: renderSegments        },
  recommendations: { title: 'Product Recommendations',  render: renderRecommendations },
  'update-data':   { title: 'Update Data',               render: renderUpdateData      },
};

function navigate() {
  const hash = (location.hash.slice(1) || 'dashboard');
  const page = PAGES[hash] || PAGES.dashboard;
  const activeHash = PAGES[hash] ? hash : 'dashboard';

  q('#page-title').textContent = page.title;

  document.querySelectorAll('.nav-link').forEach(link => {
    const linkHash = link.getAttribute('href').slice(1);
    link.classList.toggle('active', linkHash === activeHash);
  });

  if (activeHash !== 'dashboard' && state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  page.render();
}

window.addEventListener('hashchange', navigate);

window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#dashboard';
  navigate();
});
