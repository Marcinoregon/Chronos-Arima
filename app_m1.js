/* ═══════════════════════════════════════════════════════════════
   app_m1.js — Module 1 deep expansion (UC Berkeley level)
   Overrides the m1() function from app.js
   ═══════════════════════════════════════════════════════════════ */

function m1() {
  return `
<div class="module-header">
  <div class="module-tag">Module 1</div>
  <h2 class="module-title">Theoretical Foundations &amp; Data Dictionary</h2>
  <p class="module-subtitle">Before touching a single data point, you need to understand the century-old strategic debate this study is designed to resolve — and why it demands the unusual methodology we use.</p>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🎯</span> Learning Objectives</div>
  <ul class="objectives-list">
    <li>Articulate Barney's (1991) VRIN conditions and derive their forecasting implication mathematically.</li>
    <li>Contrast D'Aveni's (1994) Hypercompetition theory and explain what "strategic complexity" means statistically.</li>
    <li>Define the "Stationarity Paradox" and prove why nonlinearity tests fail on non-stationary data.</li>
    <li>Explain the "Filter-Then-Test" protocol step-by-step and justify each decision.</li>
    <li>Distinguish ROA from ROE, explain the lag structure, and identify every variable in the Data Dictionary.</li>
    <li>Derive the Hypercompetition hypothesis (H1b) from first principles in formal notation.</li>
  </ul>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📚</span> Background: Why Do Some Firms Stay Profitable Longer Than Others?</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:16px">
    This is one of the oldest questions in strategic management — and one of the most consequential. If you can predict which firms will remain profitable, you can allocate capital better (as an investor), design better incentive structures (as a manager), and set better policy (as a regulator). The field has split into two camps with fundamentally different answers.
  </p>
  <div class="analogy">
    <strong>The Mountain vs. the Rapids:</strong> RBV firms are like a mountain lake — fed by reliable springs (capabilities), protected from evaporation (imitation barriers), stable from season to season. Hypercompetitive firms are like Class V whitewater — unpredictable, chaotic, shaped by constant forces that shift daily. A weather report (ARIMA) works for the lake. It fails on the rapids. Chronos — a model trained on every kind of fluid system — might handle both.
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🛡️</span> Theory 1: Resource-Based View (Barney, 1991)</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:16px">
    Barney's foundational argument: firms earn sustained above-normal profits because they control resources with four properties.
  </p>
  <table class="data-table">
    <thead><tr><th>Property</th><th>Definition</th><th>Strategic Meaning</th><th>Example</th></tr></thead>
    <tbody>
      <tr><td>Valuable (V)</td><td>The resource enables exploitation of opportunities or neutralization of threats</td><td>Creates economic value — not just operationally useful</td><td>Apple's brand premium — customers pay more <em>because</em> it's Apple</td></tr>
      <tr><td>Rare (R)</td><td>Currently controlled by few or no competing firms</td><td>Not widely distributed across the industry</td><td>SpaceX's reusable rocket technology (few rivals)</td></tr>
      <tr><td>Inimitable (I)</td><td>Competitors cannot obtain or develop it at the same cost</td><td>Protected by path dependency, social complexity, or causal ambiguity</td><td>Coca-Cola's formula + distribution network + brand — too intertwined to copy</td></tr>
      <tr><td>Non-substitutable (N)</td><td>No strategically equivalent resource exists</td><td>Rivals can't achieve the same outcome via an alternative route</td><td>Harvard's accreditation network — reputation can't be replaced by an online alternative</td></tr>
    </tbody>
  </table>
  <div class="section-label">The RBV Forecasting Implication (Linear Persistence)</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:12px">
    If a firm's profitability is sustained by durable, protected resources, then each quarter's ROA should be a predictable function of past ROA. Small shocks (demand fluctuations, weather, executive turnover) cause temporary deviations, but the system returns to a stable equilibrium. This is the statistical signature of <strong>mean-reversion around a stable long-run mean</strong> — precisely what ARIMA models capture best.
  </p>
  <div class="formula">ROA_t = μ + φ₁(ROA_{t-1} − μ) + φ₂(ROA_{t-2} − μ) + εₜ, &nbsp; where |φ| &lt; 1</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 Equation Components</div>
    <div class="eq-row"><div class="eq-sym">ROA_t</div><div class="eq-def">The firm's Return on Assets in quarter <em>t</em> — the value we are trying to model and eventually forecast</div></div>
    <div class="eq-row"><div class="eq-sym">μ</div><div class="eq-def"><strong>Long-run mean ROA</strong> — the stable equilibrium level the firm gravitates toward when undisturbed. RBV theory says this is set by the quality of the firm's protected resources</div></div>
    <div class="eq-row"><div class="eq-sym">φ₁, φ₂</div><div class="eq-def"><strong>Autoregressive (AR) coefficients</strong> — measure how strongly last quarter's and two-quarters-ago deviation from the mean "pull" on today's ROA. φ₁ = 0.8 means 80% of last quarter's shock persists</div></div>
    <div class="eq-row"><div class="eq-sym">(ROA_{t-k} − μ)</div><div class="eq-def"><strong>Deviation from the mean at lag k</strong> — how far above or below equilibrium the firm was k quarters ago. Centering on μ ensures the AR process is properly mean-reverting</div></div>
    <div class="eq-row"><div class="eq-sym">εₜ</div><div class="eq-def"><strong>White noise shock</strong> — the unpredictable part: earnings surprises, unexpected macro events, measurement noise. Assumed i.i.d. with mean zero</div></div>
    <div class="eq-row"><div class="eq-sym">|φ| &lt; 1</div><div class="eq-def"><strong>Stability condition</strong> — guarantees mean-reversion. If |φ| ≥ 1, shocks accumulate permanently ("unit root") and ROA wanders without bound. ADF and KPSS tests check this condition empirically</div></div>
  </div>
  <div class="callout info"><strong>|φ| &lt; 1 is critical:</strong> This is the mathematical condition for mean-reversion. If φ = 0.8, a 1-unit shock decays to 0.8 in Q+1, 0.64 in Q+2, 0.51 in Q+3 — converging to zero. If φ ≥ 1 (unit root), shocks are permanent — the series never returns to its mean. RBV firms should have φ comfortably below 1.</div>
  <div class="theory-grid">
    <div class="theory-card rbv">
      <h3>RBV Prediction</h3>
      <p>Performance is <strong>autocorrelated and mean-reverting</strong>. ARIMA's linear AR structure captures the entire signal. After removing linear patterns, residuals are i.i.d. noise — no complexity remains. <strong>NLI ≈ 0, MASE(ARIMA) &lt; 1.</strong></p>
      <span class="tag">Predicts Low NLI</span>
    </div>
    <div class="theory-card hyper">
      <h3>RBV Failure Mode</h3>
      <p>RBV is a cross-sectional theory (why some firms outperform others at a point in time) retrofitted to explain longitudinal persistence. It offers no mechanism for the <em>dynamic path</em> of profitability — only for why performance is high <em>on average</em>.</p>
      <span class="tag" style="background:rgba(139,92,246,0.15);color:var(--accent-purple)">Limitation</span>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">⚡</span> Theory 2: Hypercompetition (D'Aveni, 1994)</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:16px">
    D'Aveni argues that in modern markets — particularly tech, pharma, and global consumer goods — competitive advantages are not durable. They are <strong>rapidly eroded, rebuilt, and disrupted</strong> through cascading strategic moves. The game theory analog: not chess (deterministic, long-horizon) but speed chess with rule changes after every move.
  </p>
  <div class="section-label">D'Aveni's Seven Escalating Arenas of Hypercompetition</div>
  <table class="data-table">
    <thead><tr><th>Arena</th><th>Escalation Pattern</th><th>Profitability Effect</th></tr></thead>
    <tbody>
      <tr><td>Cost &amp; Quality</td><td>Price wars → quality races → commoditization</td><td>Initial spikes then compression as rivals catch up</td></tr>
      <tr><td>Timing &amp; Know-How</td><td>First-mover advantages eroded by fast followers</td><td>Short-lived ROA peaks followed by rapid decline</td></tr>
      <tr><td>Strongholds</td><td>Market positions attacked simultaneously from multiple directions</td><td>Non-monotonic ROA swings as positions are won/lost</td></tr>
      <tr><td>Deep Pockets</td><td>Financial warfare — predatory pricing to outlast rivals</td><td>Temporary below-cost losses followed by post-war recovery</td></tr>
    </tbody>
  </table>
  <div class="section-label">The Complexity Implication</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:12px">
    In hypercompetitive environments, ROA trajectories are shaped by cascading, interacting decision sequences — not by a stable AR process. Each strategic move triggers opponent responses, market realignments, and regulatory reactions that feed back non-linearly. The econometric signature: after removing linear structure (ARIMA filter), structured <em>dependence patterns</em> persist in the residuals that violate independence — captured by the BDS test.
  </p>
  <div class="theory-grid">
    <div class="theory-card rbv">
      <h3>Statistical Manifestation</h3>
      <p>High-NLI firms show <strong>joint distributional dependence</strong> in ARIMA residuals at multiple embedding dimensions. The BDS z-score tests this: if residuals look indistinguishable from truly random noise, NLI ≈ 0. If they have hidden structure, NLI &gt; 1.96.</p>
      <span class="tag">NLI &gt; 1.96 = Hypercompetitive</span>
    </div>
    <div class="theory-card hyper">
      <h3>The Chronos Advantage</h3>
      <p>Chronos was pre-trained on billions of time series containing exactly these complex, interdependent patterns (supply chains, financial crises, viral demand waves). It has pattern templates for nonlinear dynamics that ARIMA lacks — giving it an edge precisely where NLI is high.</p>
      <span class="tag">Hypercompetitive edge</span>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🪤</span> The Stationarity Paradox — Why You Can't Skip the Filter</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    This is the most technically subtle issue in the research design. If you apply a nonlinearity test to raw, trending ROA data, you will almost always get a "significant" result — but it doesn't mean what you think it means.
  </p>
  <div class="section-label">What Non-Stationarity Looks Like to the BDS Test</div>
  <div class="step-list">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-body">
        <h4>A firm's ROA trends upward from 2014–2019 as it builds market share</h4>
        <p>The trend creates systematic positive autocorrelation: any quarter's ROA is "close" to its neighbors because they're on the same trend, not because of genuine economic complexity.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-body">
        <h4>The BDS test's "correlation integral" detects this closeness</h4>
        <p>BDS measures how often points within the time series are close together in <em>m</em>-dimensional space. A trending series has structure that passes this test — but it's the trend's structure, not strategic complexity.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-body">
        <h4>Result: inflated NLI, false Hypercompetition classification</h4>
        <p>The firm gets labelled "hypercompetitive" not because of strategic dynamics but because we forgot to remove a simple time trend. The ARIMA filter prevents this — it removes all linear structure first, leaving only genuinely non-linear residuals.</p>
      </div>
    </div>
  </div>
  <div class="callout warning">
    <strong>Formal statement:</strong> The BDS test's null hypothesis is H₀: {εₜ} is i.i.d. This requires that the input series already has no linear structure. Feeding raw ROA (with autocorrelation, deterministic trends, or seasonal patterns) violates the test's assumptions — any rejection of H₀ could be due to these linear features rather than genuine nonlinearity.
  </div>
  <div class="analogy">
    <strong>Signal processing analogy:</strong> Recording a guitar solo in a room where someone is also banging drums. If you run an audio analysis for "complex patterns," you'll detect them — but they're the drums, not the guitar. The ARIMA filter is the drum track removal step. The BDS test is then applied to the isolated guitar signal.
  </div>
  <div class="pipeline">
    <div class="pipe-step highlight">Raw ROA<br><small>μ ≠ const, autocor.</small></div>
    <div class="pipe-arrow">→</div>
    <div class="pipe-step">Unit Root Test<br><small>ADF + KPSS</small></div>
    <div class="pipe-arrow">→</div>
    <div class="pipe-step">ARIMA(p̂,d̂,q̂)<br><small>Extract linear signal</small></div>
    <div class="pipe-arrow">→</div>
    <div class="pipe-step">Ljung-Box<br><small>Verify white noise</small></div>
    <div class="pipe-arrow">→</div>
    <div class="pipe-step highlight">BDS → NLI<br><small>True complexity signal</small></div>
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📐</span> Formal Hypothesis Derivation</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    The two research hypotheses follow directly from the theoretical contrast above:
  </p>
  <div class="section-label">Hypothesis 1 (Tournament Test)</div>
  <div class="formula">H₁ₐ: E[ΔMASE | NLI &lt; τ] = 0 &nbsp; (No Chronos advantage for RBV firms)</div>
  <div class="formula">H₁ᵦ: E[ΔMASE | NLI &gt; τ] &gt; 0 &nbsp; (Chronos advantage for hypercompetitive firms)</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 Hypothesis 1 Components (Tournament Test)</div>
    <div class="eq-row"><div class="eq-sym">E[ΔMASE | …]</div><div class="eq-def"><strong>Conditional expectation of ΔMASE</strong> — the average Chronos advantage across all firms in the specified NLI group. Using expectations (averages) rather than individual values makes the test robust to firm-specific noise</div></div>
    <div class="eq-row"><div class="eq-sym">ΔMASE</div><div class="eq-def"><strong>MASE_ARIMA − MASE_Chronos</strong> — positive values mean Chronos is more accurate (lower error). Zero means equal accuracy; negative means ARIMA wins</div></div>
    <div class="eq-row"><div class="eq-sym">NLI &lt; τ</div><div class="eq-def">Conditioning on firms whose Non-Linearity Index is <em>below</em> the threshold τ = 1.96 — these are the <strong>RBV / linear persistence</strong> firms where we predict no AI advantage</div></div>
    <div class="eq-row"><div class="eq-sym">NLI &gt; τ</div><div class="eq-def">Conditioning on firms whose NLI is <em>above</em> the threshold — the <strong>hypercompetitive</strong> firms where Chronos's nonlinear pattern memory should deliver measurable gains</div></div>
    <div class="eq-row"><div class="eq-sym">τ = 1.96</div><div class="eq-def"><strong>BDS test critical value</strong> at α = 0.05 significance. Comes from the standard normal distribution — a BDS z-score exceeding 1.96 rejects the null of i.i.d. residuals with less than 5% false-positive risk</div></div>
  </div>
  <div class="section-label">Hypothesis 2 (Continuous Regression)</div>
  <div class="formula">H₂: ∂ΔMASE/∂NLI &gt; 0 &nbsp; (Continuous, monotonic AI advantage over NLI range)</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 Hypothesis 2 Components (Partial Derivative)</div>
    <div class="eq-row"><div class="eq-sym">∂ΔMASE/∂NLI</div><div class="eq-def"><strong>Partial derivative of Chronos advantage with respect to NLI</strong> — tells us: for every one-unit increase in a firm's NLI score, how much does Chronos's accuracy gain increase? Estimated as the regression slope coefficient β₁</div></div>
    <div class="eq-row"><div class="eq-sym">&gt; 0</div><div class="eq-def"><strong>The directional prediction</strong> — the slope must be <em>positive</em>: more nonlinear complexity → more Chronos advantage. If the slope were negative or zero, the theory fails</div></div>
    <div class="eq-row"><div class="eq-sym">Continuous vs. binary</div><div class="eq-def">Unlike H1 (which just compares two groups), H2 treats NLI as a continuous variable — allowing us to estimate the precise <em>magnitude</em> of the moderating effect and make quantitative predictions for any NLI value</div></div>
  </div>
  <p style="color:var(--text-secondary);font-size:13px;margin-top:12px">This is the stronger claim — not just a binary High/Low classification, but a smooth, monotonic relationship: every additional unit of NLI generates additional Chronos advantage, even controlling for simple volatility and firm size.</p>
  <div class="callout info">
    <strong>Why two hypotheses?</strong> H1 is a categorical test using NLI quartiles — easy to visualize and robust to distributional assumptions. H2 is a parametric regression that treats NLI continuously, allowing causal interpretation of marginal effects and enabling policy prescriptions ("a firm with NLI = 3.0 should expect Chronos to reduce forecast error by X units relative to ARIMA").
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📖</span> Full Data Dictionary</div>
  <div class="section-label">Identifiers &amp; Time Structure</div>
  <table class="data-table">
    <thead><tr><th>Variable</th><th>Source</th><th>Type</th><th>Definition &amp; Notes</th></tr></thead>
    <tbody>
      <tr><td>GVKEY</td><td>Compustat</td><td>String</td><td>Global Company Key — permanent firm identifier. Unlike stock tickers, GVKEY never changes across mergers, name changes, or delistings.</td></tr>
      <tr><td>DATADATE</td><td>Compustat</td><td>Date</td><td>Fiscal quarter-end date as reported. Mapped to calendar quarter (cal_quarter) for time-series alignment across firms with different fiscal year ends.</td></tr>
      <tr><td>FQTR</td><td>Compustat</td><td>Integer (1–4)</td><td>Fiscal quarter within the fiscal year. Used to identify seasonal patterns but NOT used as the time index (we use cal_quarter instead).</td></tr>
      <tr><td>FYEARQ</td><td>Compustat</td><td>Integer</td><td>Fiscal year. Cross-validated against DATADATE to catch data entry errors.</td></tr>
      <tr><td>NAICS</td><td>Compustat</td><td>String</td><td>6-digit North American Industry Classification System code. 2-digit truncation used as industry fixed effect in H2 regression.</td></tr>
    </tbody>
  </table>
  <div class="section-label">Financial Variables (Raw Compustat Fields)</div>
  <table class="data-table">
    <thead><tr><th>Variable</th><th>Compustat Code</th><th>Units</th><th>Definition</th></tr></thead>
    <tbody>
      <tr><td>NIQ</td><td>NIQ</td><td>$M</td><td>Net Income — quarterly. Bottom line after all expenses, taxes, and extraordinary items. Note: quarterly NIQ is NOT the same as annual NI divided by 4 — Compustat reports actual quarterly earnings.</td></tr>
      <tr><td>ATQ</td><td>ATQ</td><td>$M</td><td>Total Assets — end-of-quarter balance sheet value. For JPMorgan: ~$3.9 trillion = ATQ ≈ 3,900,000 in the database (stored in millions).</td></tr>
      <tr><td>SEQQ</td><td>SEQQ</td><td>$M</td><td>Stockholders' Equity — book value of equity. Can be negative for highly leveraged firms (e.g., post-LBO targets, airlines). ROE excluded when SEQQ ≤ 0.</td></tr>
    </tbody>
  </table>
  <div class="section-label">Derived Performance Metrics</div>
  <table class="data-table">
    <thead><tr><th>Variable</th><th>Formula</th><th>Range (Winsorized)</th><th>Interpretation</th></tr></thead>
    <tbody>
      <tr><td>ROA</td><td>NIQ_t / ATQ_{t-1}</td><td>[−0.058, +0.058]</td><td>Return on Assets — earnings efficiency. Lagged denominator avoids the mechanical numerator-denominator correlation that biases contemporaneous ROA.</td></tr>
      <tr><td>ROA_w</td><td>Winsorized ROA (1st/99th pctile)</td><td>[−0.058, +0.058]</td><td>Analysis variable. Extreme values capped, not deleted — all firms retained in the panel.</td></tr>
      <tr><td>ROE</td><td>NIQ_t / SEQQ_{t-1}, if SEQQ_{t-1} &gt; 0</td><td>Varies</td><td>Return on Equity — captures leverage effects missing from ROA. Secondary outcome variable.</td></tr>
    </tbody>
  </table>
  <div class="section-label">Complexity &amp; Classification Variables</div>
  <table class="data-table">
    <thead><tr><th>Variable</th><th>Source</th><th>Range</th><th>Definition</th></tr></thead>
    <tbody>
      <tr><td>Resid_Std</td><td>ARIMA residuals</td><td>~N(0,1)</td><td>Standardized ARIMA residuals. Divide by σ̂_ε so residuals from firms with different ROA scales are comparable in the BDS test.</td></tr>
      <tr><td>NLI</td><td>BDS test z-score</td><td>Continuous (−∞, +∞ but typically −3 to +8)</td><td>Non-Linearity Index. BDS z-score at embedding dimension m=2, ε = 0.7·σ. Higher = more complex residual structure remaining after ARIMA filter.</td></tr>
      <tr><td>Is_Complex</td><td>Binary threshold on NLI</td><td>0 or 1</td><td>1 if NLI &gt; 1.96 (p &lt; 0.05, one-tailed); 0 otherwise. Critical value 1.96 corresponds to α = 0.05 under standard normal approximation.</td></tr>
      <tr><td>LB_Pass</td><td>Ljung-Box test</td><td>Boolean</td><td>TRUE if ARIMA residuals pass the Ljung-Box whiteness test (p &gt; 0.05). Firms failing LB_Pass are re-fitted before NLI calculation — this is the "gatekeeper" step.</td></tr>
    </tbody>
  </table>
  <div class="section-label">Forecasting &amp; Evaluation Variables</div>
  <table class="data-table">
    <thead><tr><th>Variable</th><th>Formula</th><th>Interpretation</th></tr></thead>
    <tbody>
      <tr><td>MASE_ARIMA</td><td>MAE_holdout / MAE_naive_train</td><td>ARIMA accuracy relative to naive baseline. &lt;1 = beats naive. Scale-free: comparable across JPMorgan ($4T assets) and AMETEK ($10B assets).</td></tr>
      <tr><td>MASE_Chronos</td><td>Same formula, Chronos P50 as prediction</td><td>Chronos accuracy using median of probabilistic forecast as point prediction.</td></tr>
      <tr><td>ΔMASE</td><td>MASE_ARIMA − MASE_Chronos</td><td>AI advantage. Positive = Chronos won. Negative = ARIMA won. Zero = equivalent.</td></tr>
      <tr><td>WQL</td><td>Weighted quantile loss over P10/P50/P90</td><td>Calibration quality of Chronos's probability distribution. Lower = more accurately calibrated uncertainty estimates.</td></tr>
      <tr><td>Cone_Width</td><td>P90_j − P10_j (forecast)</td><td>Width of 80% prediction interval. Should be wide for High-NLI firms (genuine uncertainty) and narrow for stable firms.</td></tr>
    </tbody>
  </table>
  <div class="section-label">Regression Control Variables (H2)</div>
  <table class="data-table">
    <thead><tr><th>Variable</th><th>Measurement</th><th>Expected β in H2</th><th>Rationale</th></tr></thead>
    <tbody>
      <tr><td>Volatility</td><td>SD(ROA_w) over full in-sample period</td><td>Ambiguous</td><td>Controls for raw noise: high volatility may increase MASE for both models, attenuating ΔMASE even without structural complexity.</td></tr>
      <tr><td>Size</td><td>ln(mean ATQ) — log total assets</td><td>Negative (−)</td><td>Larger firms are more diversified, have more stable earnings, and are likely more RBV-like. Expect smaller Chronos advantage at larger scale.</td></tr>
      <tr><td>Industry FE</td><td>NAICS 2-digit sector dummies</td><td>Varies by sector</td><td>Absorbs sector-specific forecasting difficulty. Energy sector ROA is inherently more volatile than banking ROA — this must be controlled.</td></tr>
      <tr><td>T_obs</td><td>Number of observed quarters</td><td>Negative (−)</td><td>Longer histories give ARIMA more data to work with. As T increases, ARIMA's advantage grows — we need to control for this.</td></tr>
    </tbody>
  </table>
</div>

<div class="card" style="border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.04)">
  <div class="card-title"><span class="icon">📋</span> Exercise 1A — Theory to Prediction</div>
  <div class="step-list">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-body">
        <h4>Classify each firm according to RBV vs. Hypercompetition theory and predict their expected NLI:</h4>
        <table class="data-table" style="margin-top:10px">
          <thead><tr><th>Firm</th><th>Industry</th><th>Strategy Description</th><th>Predicted NLI</th></tr></thead>
          <tbody>
            <tr><td>Automatic Data Processing (ADP)</td><td>Information</td><td>Payroll processing monopoly with 50-year customer lock-in, dominant regulatory moat</td><td>?</td></tr>
            <tr><td>Cleveland-Cliffs</td><td>Manufacturing</td><td>Steel producer exposed to commodity cycles, Chinese overcapacity, scrap metal prices</td><td>?</td></tr>
            <tr><td>Comtech Telecommunications</td><td>Manufacturing</td><td>Defense satellite company — near-zero mean ROA with wild quarterly swings on contract awards/losses</td><td>?</td></tr>
          </tbody>
        </table>
        <div class="exercise-input" style="margin-top:12px;">
          <textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br>
          <button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button>
          <div class="callout success" style="margin-top:12px; display:none;">
            <strong>ADP:</strong> Classic RBV. 50-year switching costs are the definition of VRIN resources. Predicted NLI: Low (&lt; 1.96). Actual CV in data: 0.25 — lowest quintile. ✓<br><br>
            <strong>Cleveland-Cliffs:</strong> Hypercompetitive. Steel is a commodity — no pricing power, constant competitive pressure from global overcapacity. Predicted NLI: High. Actual CV: 35.1 — very high volatility relative to near-zero mean. ✓<br><br>
            <strong>Comtech:</strong> Extreme hypercompetition. Government contract outcomes are discontinuous events — binary wins/losses that produce non-linear profitability dynamics. Predicted NLI: Very high. Actual CV: 154 — the most complex firm in the sample by this proxy. ✓
          </div>
        </div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-body">
        <h4>The VRIN conditions and the BDS test</h4>
        <p>D'Aveni argues that VRIN resources erode in modern markets. If he's right, what should happen to the fraction of firms classified as Is_Complex = 1 over the 2014–2024 sample period? Would you expect Is_Complex fraction to increase or decrease toward 2024?</p>
        <div class="exercise-input" style="margin-top:12px;">
          <textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br>
          <button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button>
          <div class="callout success" style="margin-top:12px; display:none;">
            If D'Aveni is right and hypercompetition is intensifying, we expect the fraction of Is_Complex = 1 firms to <strong>increase over time</strong>. As AI adoption, globalization, and digital disruption accelerate resource erosion, more firms should exhibit NLI &gt; 1.96. This is a testable extension of the main hypotheses — a time trend in Is_Complex would be direct evidence of hypercompetition spreading across sectors.
          </div>
        </div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-body">
        <h4>The Stationarity Paradox — mathematical demonstration</h4>
        <p>Suppose a firm's ROA follows: ROAₜ = 0.001·t + εₜ (a linear trend + noise, with NO nonlinearity). If you run the BDS test on raw ROA without ARIMA filtering, will you reject the null of i.i.d.? What's the correct answer after ARIMA filtering?</p>
        <div class="exercise-input" style="margin-top:12px;">
          <textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br>
          <button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button>
          <div class="callout success" style="margin-top:12px; display:none;">
            <strong>Without filtering:</strong> The BDS correlation integral will detect that consecutive ROA values are "close together" (both on the same trend). This creates a systematic pattern — the test will reject i.i.d., giving NLI &gt; 1.96. But this is a <em>false positive</em> — the "complexity" is just the linear trend.<br><br>
            <strong>After ARIMA(0,1,0) filter:</strong> Differencing removes the trend: ΔROAₜ = 0.001 + εₜ. The residuals are now just εₜ — pure white noise. The BDS test correctly fails to reject i.i.d., giving NLI ≈ 0. <strong>Correct classification: RBV (Low NLI).</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="card" style="border-color:rgba(139,92,246,0.3);background:rgba(139,92,246,0.04)">
  <div class="card-title"><span class="icon">🔗</span> Connections to Economic Theory</div>
  <div class="step-list">
    <div class="step-item">
      <div class="step-num">📖</div>
      <div class="step-body">
        <h4>Schumpeterian Creative Destruction</h4>
        <p>Schumpeter (1942) argued that capitalism advances through "creative destruction" — old industries and firms are perpetually displaced by innovation. This maps directly to Hypercompetition: profits are temporary because successful strategies attract imitation, which then attracts disruption. The NLI can be interpreted as a Schumpeterian intensity measure — how rapidly is creative destruction operating in this firm's performance trajectory?</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">📖</div>
      <div class="step-body">
        <h4>Efficient Markets Hypothesis (EMH)</h4>
        <p>Under strong EMH, all current information is priced into assets — implying that future firm performance is unpredictable (random walk: φ = 0, d = 1). Both ARIMA and Chronos should get MASE ≈ 1. If either model beats MASE = 1 significantly, it's evidence of predictable patterns the market hasn't fully priced — a potential violation of EMH and a finding with real trading implications.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">📖</div>
      <div class="step-body">
        <h4>Chaos Theory &amp; Complexity Economics</h4>
        <p>The BDS test was developed by Brock, Dechert &amp; Scheinkman (1996) specifically to detect deterministic chaos masquerading as randomness. In complexity economics (Arthur, 1999), markets are complex adaptive systems where nonlinear feedback loops between agents produce emergent, unpredictable dynamics. High-NLI firms may be those most deeply embedded in these feedback loops — suppliers, regulators, competitors, and customers all co-evolving in ways that produce non-i.i.d. profitability residuals.</p>
      </div>
    </div>
  </div>
</div>

${quizBlock(1, [{"q": "AMETEK Inc (industrial instruments) has maintained ROA ≈ 0.022 ± 0.0025 for 60 consecutive quarters. Which of the following best explains this pattern under Resource-Based View (RBV) theory?", "opts": ["AMETEK is simply lucky — 60 quarters of stable performance is an extreme but possible statistical anomaly", "AMETEK holds VRIN resources (proprietary manufacturing processes, long-term OEM contracts, niche market dominance) that competitors cannot replicate, generating sustained above-normal returns with mean-reverting dynamics", "AMETEK operates in a hypercompetitive market where all firms earn the same stable ROA through competitive equilibrium", "The data is incorrect — no public firm can maintain stable ROA for 15 consecutive years"], "correct": 1, "fb": "AMETEK is the textbook RBV example in this dataset. The key insight is understanding WHAT RBV predicts statistically: if a firm holds resources that are Valuable (they generate ROA above cost of capital), Rare (few competitors have equivalent capabilities), Inimitable (high cost to copy — switching costs, tacit knowledge, accumulated learning), and Non-substitutable (no alternative achieves the same result), then ROA should persistently revert to a POSITIVE mean rather than drifting toward the industry average or zero. AMETEK's precision instruments serve aerospace/defense OEMs under multi-year contracts — these contracts literally lock competitors out of the customer relationship for years at a time. Their manufacturing know-how takes decades to accumulate and cannot be purchased or replicated quickly. The statistical fingerprint we expect for RBV firms: low coefficient of variation (CV = SD/mean), strong mean-reversion in ARIMA (high φ with |φ| < 1 but φ close to 1), and low Non-Linearity Index (NLI < 1.96) because the dynamics are fundamentally linear — orderly convergence to a stable level. This is exactly what hypotheses H1a and H1b predict: Chronos offers NO advantage for firms like AMETEK because ARIMA already captures their linear mean-reversion perfectly.", "wf": ["This explanation fails on the mathematics of probability. With 60 independent quarterly observations, a 'lucky' anomaly would require each quarter's performance to independently fall within ±0.0025 of the mean. The probability of this happening 60 times consecutively by pure chance in a random walk process is astronomically small — on the order of 10^{-40}. When something is this systematic, we invoke theory, not luck. The whole point of statistical testing is to distinguish genuine patterns from noise, and 60 quarters of stable ROA is unambiguously a pattern.", "", "This answer confuses RBV with its theoretical opposite. Hypercompetition (D'Aveni, 1994) specifically predicts UNSTABLE, erratic ROA — because competitive advantages are continuously destroyed and rebuilt at high speed. If AMETEK were in a hypercompetitive market, we would expect HIGH variance, NLI > 1.96, and ROA that is difficult to forecast. The 'all firms earn the same ROA' outcome is actually the prediction of perfect competition theory, which is a different framework entirely. The key distinction: RBV → stable, persistently positive ROA above cost of capital; Hypercompetition → erratic ROA with frequent reversals and high NLI.", "Compustat data for major public firms like AMETEK (NYSE: AME, S&P 500 component since the 1980s) is rigorously audited, independently verified by external auditors (currently Ernst & Young), and subject to SEC oversight. The data is filed in 10-Q quarterly reports and has been collected systematically by Compustat/S&P Global for decades. AMETEK's consistent profitability is extensively documented in analyst reports, investor presentations, and academic studies of industrial conglomerates. The data is valid."]}, {"q": "A researcher runs the BDS nonlinearity test directly on raw quarterly ROA for Hess Corp (an oil company) WITHOUT first applying an ARIMA filter. Hess's ROA rises steadily from 2014–2019 as oil prices recover, crashes sharply in 2020 (COVID demand collapse), then recovers strongly through 2024. The BDS test returns NLI = 4.2. What is the MOST LIKELY explanation for this result?", "opts": ["Hess is genuinely hypercompetitive — an NLI of 4.2 confirms complex strategic nonlinear dynamics in its profitability", "The BDS test has detected the oil price cycle masquerading as 'complexity.' The underlying trend plus the structural break from COVID creates joint distributional dependence across time that the BDS test misidentifies as nonlinearity. The true NLI after proper ARIMA filtering might be near zero.", "NLI = 4.2 indicates a computational error in the BDS routine — values this high don't occur in practice", "The result is statistically valid — BDS tests do not require ARIMA pre-filtering and can be applied directly to any time series"], "correct": 1, "fb": "This question illustrates what we call the Stationarity Paradox — one of the most important methodological concepts in the entire study. The BDS test by Brock, Dechert & Scheinkman (1996) has a specific null hypothesis: the input series is independently and identically distributed (i.i.d.). When the null is violated, the test rejects — but it doesn't tell you WHY it's rejected. Rejection can happen because of: (1) nonlinear dynamic structure (what we want to measure), OR (2) linear autocorrelation, OR (3) trends, OR (4) structural breaks. Hess's raw ROA hits all four problems simultaneously: the 2014–2019 upswing creates linear autocorrelation, the level trend creates non-stationarity, and the 2020 COVID crash creates a structural break. Any of these alone would cause BDS to reject the i.i.d. null. The ARIMA filter is designed to remove ALL of these linear confounds first, so that BDS is then testing only the residual — the part that ARIMA cannot explain. If ARIMA fits the linear trend + autocorrelation well, the residuals from a well-specified ARIMA might pass Ljung-Box (no residual autocorrelation) and BDS might then return NLI ≈ 0. The raw NLI of 4.2 is almost certainly measuring Hess's exposure to oil price cycles, not genuine strategic nonlinearity in how Hess creates value.", "wf": ["Strategic nonlinearity and oil price sensitivity are very different phenomena. Hypercompetition (high NLI) describes a situation where the firm's OWN strategic dynamics are complex — management continuously disrupts and rebuilds advantage through product launches, acquisitions, and strategic pivots. Hess's ROA swings are almost entirely explained by the global oil price — an exogenous macro variable completely outside Hess's control. The correct analogy: if I measure a thermometer's readings over a year and run BDS, I'll get very high NLI — but that's measuring seasonal temperature patterns, not 'nonlinear thermometer dynamics.' We cannot attribute the oil price cycle to Hess's strategy.", "", "BDS z-scores above 4 are entirely normal — in fact, values above 10 or even 100 can occur when the input series is a clearly non-stationary trending process (like a random walk with drift). The BDS z-score is not bounded above. The test simply measures the ratio of empirical correlation integrals at embedding dimension m to what would be expected under i.i.d. For raw financial series with strong autocorrelation, z-scores of 4–20 are routinely observed. The issue is not magnitude — it's interpretation.", "This is precisely the reason the Filter-Then-Test protocol exists. The BDS test's own inventors (Brock, Dechert & Scheinkman) explicitly warn in their 1996 paper that the test should be applied to residuals from a well-fitted linear model, not to raw data. Applying BDS to raw data conflates nonlinearity with every form of distributional dependence including simple autocorrelation. You would classify a pure AR(1) process as 'nonlinear' if you applied BDS without pre-filtering — an obviously incorrect conclusion. The protocol is mandated by the test's own theoretical requirements."]}, {"q": "Hypothesis H₂ states ∂ΔMASE/∂NLI > 0 — that the Chronos advantage grows continuously with NLI. A student challenges this: 'You're confounding NLI with raw volatility. More volatile firms are simply harder to predict for BOTH models, so BOTH get worse MASE. The ΔMASE difference could be zero or even negative for high-NLI firms.' How do you best refute this objection?", "opts": ["The student is correct — ΔMASE is confounded with raw volatility and the regression is invalid without addressing this", "The OLS regression controls for Volatility (measured as SD of ROA) as a separate regressor. If β₁(NLI) remains positive and significant after including Volatility as a control, the relationship holds even for two firms with IDENTICAL raw volatility but different NLI — one linear, one complex. The NLI coefficient captures 'pure complexity' independent of noisiness.", "ΔMASE cannot be confounded with volatility because MASE scaling already adjusts for each firm's own variance", "The student's argument would only apply to MASE comparisons, not to ΔMASE which is a first-difference and therefore self-correcting"], "correct": 1, "fb": "The student is raising a legitimate and important concern — this is precisely why the OLS regression in Module 5 is specified as: ΔMASE_j = β₀ + β₁·NLI_j + β₂·Volatility_j + β₃·Size_j + μ_Industry + ε_j. The key is understanding what 'controlling for Volatility' actually means statistically. When both NLI and Volatility are included in the same regression, the coefficient β₁ on NLI is estimated from variation in NLI AFTER removing the variation explained by Volatility. Mathematically, this is equivalent to: (1) regressing NLI on Volatility and saving the residuals, then (2) regressing ΔMASE on those residuals. The residuals represent 'NLI purged of its correlation with Volatility.' A positive β₁ on these residuals means: holding Volatility CONSTANT, firms with higher NLI have greater Chronos advantage. The intuition: imagine two firms, both with σ = 0.04 (identical raw volatility). Firm A's ROA is noisy but linear — ARIMA handles it well because the noise is i.i.d. Firm B's ROA is equally variable but has nonlinear structure — ARIMA fails because the structure systematically lies outside what linear models can capture. If β₁ > 0 after the volatility control, we've proven that the advantage comes from STRUCTURE, not mere noisiness. This is a crucial methodological distinction that separates this study from simpler forecasting comparisons.", "wf": ["If the student were correct, β₁ on NLI would be zero or negative in the full regression, but the empirical results show it is positive and significant. The whole point of multiple regression is to isolate each variable's contribution. The student's concern is valid as a threat to validity BEFORE running the regression — but the regression design itself is the solution. Omitting Volatility from the regression would be the methodological error; including it is the correct response.", "", "This is an appealing argument but incorrect. MASE scales by the firm's OWN naive baseline MAE (computed from training data). This makes MASE scale-free — you can compare MASE across firms of different sizes. But it does NOT remove the volatility confound. Here's why: a firm with σ = 0.04 will have a higher naive baseline MAE than a firm with σ = 0.01, and both ARIMA and Chronos will tend to have larger absolute errors for the noisier firm. The MASE ratio accounts for this, but ΔMASE = MASE_ARIMA − MASE_Chronos could still vary simply because BOTH models degrade similarly with volatility. The regression control is needed to isolate whether the gap between models grows with NLI specifically.", "ΔMASE is a difference, but that doesn't make it immune to confounding. Consider: if Volatility makes ARIMA get worse by 0.2 MASE units AND makes Chronos get worse by 0.2 MASE units, then ΔMASE = 0 regardless of volatility. The difference eliminates the LEVEL of difficulty but not whether volatility affects the two models differently. The only way to know whether NLI drives the gap above and beyond volatility is to control for volatility in a regression."]}, {"q": "Which of the four VRIN criteria is most DIRECTLY tested by the empirical finding that ΔMASE (Chronos advantage) is significantly larger for HIGH-NLI firms than for LOW-NLI firms?", "opts": ["Valuable — demonstrating that the resource generates above-normal economic returns", "Rare — demonstrating that few firms in the competitive landscape possess the same capability", "Inimitable — demonstrating that the resource (nonlinear profit dynamics) cannot be cost-effectively replicated by the best available linear alternative (ARIMA)", "Non-substitutable — demonstrating that no alternative method achieves the same competitive outcome"], "correct": 2, "fb": "The Inimitability test is the heart of the empirical strategy. Here is the logical chain: (1) ARIMA represents the best possible LINEAR replication of a firm's ROA dynamics. It is the mathematical limit of what rule-based, data-driven linear modeling can achieve. (2) If ΔMASE > 0 for a High-NLI firm, it means ARIMA cannot match Chronos — not because ARIMA was tuned poorly, but because the firm's dynamics contain structure that no linear model can capture. (3) This non-replicability by the best linear model is statistical evidence that the underlying strategic process is inimitable. The argument maps directly to Barney (1991): if a valuable strategic asset (the ability to sustain non-linear profitability dynamics) cannot be replicated by the best available competing approach (ARIMA), then it satisfies the Inimitable criterion. The NLI threshold (1.96) acts as the gating condition: only firms where BDS confirms residual nonlinear structure are classified as having inimitable dynamics. ΔMASE > 0 for these firms is the confirmation that the asset confers advantage AND cannot be copied by a linear strategy.", "wf": ["Valuable is indeed the first VRIN criterion and must be established before Inimitability matters — but the ΔMASE finding doesn't directly test it. Testing Valuable requires showing that the Chronos advantage translates into economic value for investors or managers, e.g., that firms with high ΔMASE generate higher risk-adjusted stock returns or better capital allocation decisions. The MASE comparison itself is a forecasting accuracy metric, not an economic value metric. A separate analysis (e.g., portfolio backtesting) would be needed to test Valuable.", "Rare is a cross-sectional distributional property — what fraction of the competitive landscape has a given resource. To test Rare, you would look at the distribution of NLI across all firms and argue that only a minority have NLI > 1.96 (the complexity threshold). Looking at the ΔMASE difference between NLI quartiles tests something about the EFFECT of NLI, not its rarity in the population.", "", "Non-substitutable requires showing that NO alternative achieves the same outcome — which would require testing many other forecasting methods (Prophet, LSTM, exponential smoothing, Theta, etc.) and showing all of them also fail for High-NLI firms. The study only includes ARIMA as the baseline comparator. Demonstrating that ARIMA fails is necessary but not sufficient to establish Non-substitutability; you'd need to include additional baseline models."]}, {"q": "Why does the study use the 'Filter-Then-Test' protocol — first fitting ARIMA, then checking residuals with Ljung-Box, and ONLY THEN applying BDS — rather than simply running BDS on raw ROA from the start?", "opts": ["Because ARIMA is always a superior forecasting model and the BDS test is used only to validate ARIMA's output", "BDS can only process residuals mathematically — it cannot accept raw time series as input", "Applying BDS directly to raw ROA confounds linear autocorrelation, trends, structural breaks, and seasonality with genuine nonlinearity. The ARIMA filter removes ALL linear structure first, so BDS then measures only what linear models provably cannot explain — the residual nonlinear dependence", "It is a regulatory requirement for Compustat-based financial research under WRDS data licensing terms"], "correct": 2, "fb": "The Filter-Then-Test logic is foundational to the entire methodology and deserves careful understanding. Here is the step-by-step reasoning: Step 1 — What does BDS actually test? Its null hypothesis is that the input series is i.i.d. (independently and identically distributed). A rejection means 'this series is NOT i.i.d.' — but gives zero information about WHY. Step 2 — Raw financial series violate i.i.d. for many boring linear reasons: autocorrelation (this quarter's ROA predicts next quarter's), non-stationarity (a trend in the mean), seasonality (Q4 is usually stronger), and structural breaks (recessions, regulation changes). If you feed raw ROA to BDS and it rejects i.i.d., you literally don't know which of these caused the rejection. Step 3 — ARIMA is the complete solution to ALL linear explanations. A correctly specified ARIMA(p,d,q) removes all linear autocorrelation (AR terms), all trends (differencing), and all moving-average shock persistence (MA terms). The Ljung-Box test then verifies that residuals have no remaining linear structure (i.e., ARIMA did its job). Step 4 — Only now does BDS have interpretive value. If residuals passed Ljung-Box (no linear structure left) but BDS still rejects i.i.d., this rejection CANNOT be attributed to linear structure — because we just confirmed there isn't any. It must be nonlinear temporal dependence. This is the 'nonlinearity' we call NLI. The protocol is not conservative caution — it is the only scientifically valid way to use BDS.", "wf": ["ARIMA is used here as a diagnostic FILTER, not as a competitor to BDS. The study does two completely separate things with ARIMA: (1) use filtered residuals to compute NLI via BDS (this is the diagnostic step), and (2) use ARIMA as a forecasting model in the competition against Chronos (this is the prediction step). These are different uses of the same tool. BDS is never 'validating' ARIMA — it is testing whether ARIMA's residuals contain any structure that ARIMA couldn't capture.", "BDS accepts any numerical array as input — there is no mathematical restriction preventing it from processing raw time series. The Python implementation (statsmodels, or a custom implementation) simply computes a correlation integral over whatever sequence you provide. The issue is not mathematical feasibility but statistical interpretability. You can apply BDS to raw data — you simply cannot interpret the result meaningfully when you do, because you cannot separate linear from nonlinear causes of rejection.", "", "There is no such regulatory requirement in WRDS licensing or SEC reporting standards. The Filter-Then-Test protocol is a methodological standard from academic econometrics, not a legal requirement. The protocol was established through peer review of methods papers by Brock et al. (1996), Hsieh (1989), and others in academic journals focused on financial econometrics."]}])}`;
}
