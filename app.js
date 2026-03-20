/* ═══════════════════════════════════════════════════════════════
   CHRONOS TUTORIAL — app.js (Part 1: Data + State + Routing)
   ═══════════════════════════════════════════════════════════════ */

// ─── STATE ────────────────────────────────────────────────────────
let state = {
  currentModule: 0,
  completed: new Set(),
  firmData: [],        // rows from CSV
  sectorData: [],      // sector summary
  firms: [],           // unique firm list
  charts: {},          // Chart.js instances
};

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  loadData().then(() => renderModule(0));
});

// ─── DATA LOADING ─────────────────────────────────────────────────
// Full loadData() (all 3 CSVs including firmStats) is defined in app_data.js
// which is loaded after this file. This stub is intentionally empty so the
// app_data.js version wins without any override pattern.
async function loadData() {
  // Implemented in app_data.js — do not define here
}

// ─── RIPPLE ENGINE ─────────────────────────────────────────────────
function attachRipple(el) {
  if (el._rippled) return;
  el._rippled = true;
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.addEventListener('pointerdown', e => {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    el.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });
}

// ─── NAV SETUP ────────────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    attachRipple(el);
    el.addEventListener('click', () => renderModule(parseInt(el.dataset.module)));
  });
  document.querySelectorAll('.module-nav button').forEach(attachRipple);
  // Keyboard: arrow keys navigate modules
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') changeModule(1);
    if (e.key === 'ArrowLeft')  changeModule(-1);
  });
}

function setActiveNav(mod) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.module) === mod);
    if (state.completed.has(parseInt(el.dataset.module))) el.classList.add('completed');
  });
  const pct = Math.round((state.completed.size / 6) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('module-indicator').textContent = `Module ${mod} / 6`;
  document.getElementById('btn-prev').disabled = mod === 0;
  document.getElementById('btn-next').disabled = mod === 6;
}

function changeModule(dir) {
  const next = Math.max(0, Math.min(6, state.currentModule + dir));
  renderModule(next);
}

// ─── ROUTER ───────────────────────────────────────────────────────
function renderModule(mod) {
  Object.values(state.charts).forEach(c => { try { c.destroy(); } catch(e){} });
  state.charts = {};
  state.completed.add(state.currentModule);
  state.currentModule = mod;
  setActiveNav(mod);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const area = document.getElementById('content-area');
  area.style.transition = 'none';
  area.style.opacity = '0';
  area.style.transform = 'translateY(14px)';

  const renders = [m0, m1, m2, m3, m4, m5, m6];
  area.innerHTML = renders[mod]();

  requestAnimationFrame(() => {
    area.style.transition = 'opacity 0.3s ease, transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)';
    area.style.opacity = '1';
    area.style.transform = 'translateY(0)';
    if (mod === 6) initExplorer();
    area.querySelectorAll('button, .module-overview-card').forEach(attachRipple);
  });
}

// ─── MODULE 0: OVERVIEW ───────────────────────────────────────────
function m0() {
  return `
<div class="hero">
  <h1>Forecasting Nonlinear<br>Firm Performance</h1>
  <p>Can AI detect hidden patterns in company profitability that traditional models miss?
     Explore real Compustat data across ${state.firms.length} firms and 100,000+ observations.</p>
  <div class="hero-tags">
    <span class="hero-tag">📈 ARIMA vs. Chronos-Bolt</span>
    <span class="hero-tag">🏭 Real S&P Compustat Data</span>
    <span class="hero-tag">🎓 6 Modules</span>
    <span class="hero-tag">🧪 Interactive Exercises</span>
  </div>
</div>


<div class="card">
  <div class="card-title"><span class="icon">📋</span> Study Overview <span style="font-size:11px;font-weight:400;color:#f59e0b;background:rgba(245,158,11,0.12);padding:2px 8px;border-radius:4px;margin-left:8px;">PROPOSED STUDY</span></div>

  <p style="line-height:1.8;color:var(--text-secondary);margin-bottom:16px;">
    This proposed study asks a deceptively simple question: <strong>Can an artificial intelligence model detect hidden patterns in firm profitability that the best traditional statistical models provably cannot?</strong> The answer has direct implications for strategic management theory, financial forecasting practice, and the emerging role of foundation models in business analytics.
  </p>

  <p style="line-height:1.8;color:var(--text-secondary);margin-bottom:16px;">
    The study is grounded in a long-standing theoretical debate in strategic management. <strong>Resource-Based View (RBV)</strong> theory — articulated by Barney (1991) and Wernerfelt (1984) — argues that firms generate sustained competitive advantages through resources that are Valuable, Rare, Inimitable, and Non-substitutable (VRIN). The statistical fingerprint of an RBV firm is predictable, mean-reverting profitability: a company like AMETEK Inc maintains tight Return on Assets (ROA) of approximately 2.2% quarter after quarter for over 15 years, reflecting the durable protection of its proprietary manufacturing know-how and long-term OEM contracts. For such firms, a correctly specified linear time-series model (ARIMA) should forecast ROA accurately.
  </p>

  <p style="line-height:1.8;color:var(--text-secondary);margin-bottom:16px;">
    By contrast, <strong>Hypercompetition theory</strong> (D'Aveni, 1994) asserts that in many modern industries, competitive advantages are temporary and continuously disrupted. Firms must engage in rapid, complex strategic moves — new product launches, aggressive pricing, technological pivots — to stay relevant. The result is ROA dynamics that are structurally nonlinear: driven by feedback loops, regime shifts, and exogenous macro shocks that interact in ways no linear model can fully capture. A steel producer like Cleveland-Cliffs, whose profitability swings violently with global commodity price cycles, automotive demand, and geopolitical events, exemplifies this profile.
  </p>

  <p style="line-height:1.8;color:var(--text-secondary);margin-bottom:16px;">
    The proposed methodology is called <strong>Filter-Then-Test</strong>. For each of approximately 150 S&amp;P-listed firms with at least 20 quarterly observations from Compustat (2010–2024), we: (1) fit the best ARIMA model using the Hyndman-Khandakar algorithm with AICc selection; (2) verify the ARIMA residuals are linear-structure-free using the Ljung-Box test; and (3) apply the BDS nonlinearity test (Brock, Dechert &amp; Scheinkman, 1996) to the whitened residuals. The resulting z-score is the firm's <strong>Non-Linearity Index (NLI)</strong> — a continuous, scale-free measure of structural complexity in ROA dynamics. Firms with NLI &gt; 1.96 are classified as High-NLI (hypercompetitive); those with NLI ≤ 1.96 are Low-NLI (RBV-consistent).
  </p>

  <p style="line-height:1.8;color:var(--text-secondary);margin-bottom:16px;">
    We then run a zero-shot probabilistic forecasting tournament. <strong>Chronos-Bolt</strong> — Amazon's foundation model pre-trained on 200 million global time series — generates 8-quarter-ahead probabilistic forecasts (P10/P50/P90) for each firm without any firm-specific fine-tuning. ARIMA generates point and interval forecasts using only training-period data. Model accuracy is measured by MASE (Mean Absolute Scaled Error) for point forecasts and WQL (Weighted Quantile Loss) for probabilistic forecasts.
  </p>

  <p style="line-height:1.8;color:var(--text-secondary);margin-bottom:0;">
    The study tests two primary hypotheses: <strong>H1</strong> — the Chronos advantage (ΔMASE = MASE_ARIMA − MASE_Chronos) is significantly positive only for High-NLI firms, not Low-NLI firms; and <strong>H2</strong> — ΔMASE grows continuously with NLI, confirmed by OLS regression controlling for firm size and volatility. If supported, these findings would provide the first rigorous empirical bridge between strategic complexity theory and the practical superiority of AI foundation models in financial forecasting.
  </p>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🗺️</span> The Big Picture: What This Study Proves</div>
  <div class="theory-grid">
    <div class="theory-card rbv">
      <h3>Resource-Based View (RBV)</h3>
      <p>Competitive advantages are <strong>persistent and durable</strong>. A firm that is profitable today should remain profitable tomorrow. Performance follows a smooth, predictable trajectory.</p>
      <p><strong>Forecasting implication:</strong> Linear models (ARIMA) should work well.</p>
      <span class="tag">→ Predicts Low NLI firms</span>
    </div>
    <div class="theory-card hyper">
      <h3>Hypercompetition</h3>
      <p>In modern markets, advantages are <strong>temporary and complex</strong>. Firms must make constant dynamic moves. Performance trajectories are structurally nonlinear.</p>
      <p><strong>Forecasting implication:</strong> AI (Chronos) should outperform ARIMA.</p>
      <span class="tag">→ Predicts High NLI firms</span>
    </div>
  </div>
  <div class="callout info">
    <strong>The Research Design:</strong> Apply the "Filter-Then-Test" protocol to measure each firm's
    Non-Linearity Index (NLI), then run a forecasting tournament between ARIMA and Chronos-Bolt.
    Test whether NLI moderates the AI model's advantage.
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📚</span> Course Modules</div>
  <div class="module-cards">
    ${[
      ['Module 1','Theory & Data Dictionary','RBV vs Hypercompetition, Stationarity Paradox, Filter-Then-Test, and all key variable definitions.'],
      ['Module 2','Data Acquisition & Prep','Compustat/WRDS extraction, survivorship bias, winsorization, and time harmonization.'],
      ['Module 3','ARIMA Deep Dive','AR/I/MA components, Hyndman-Khandakar algorithm, Bai-Perron breaks, whitened residuals.'],
      ['Module 4','Chronos AI Forecasting','Foundation models, tokenization, zero-shot inference, and probabilistic quantile forecasting.'],
      ['Module 5','Hypothesis Testing','MASE, WQL, Delta-MASE, paired t-tests, and the final OLS interaction regression.'],
      ['📊 Live Data','Explorer','Explore real firm ROA trajectories, sector distributions, and simulate forecasting accuracy.'],
    ].map(([num,title,desc],i) => `
      <div class="module-overview-card" onclick="renderModule(${i+1})">
        <div class="mod-num">${num}</div>
        <div class="mod-title">${title}</div>
        <div class="mod-desc">${desc}</div>
      </div>
    `).join('')}
  </div>
</div>`;
}

// ─── MODULE 1 ─────────────────────────────────────────────────────
// m1() is defined in app_m1.js (loaded after this file).
// That definition contains the full module content and 5 expanded quiz questions.
// Do NOT redefine m1() here.
