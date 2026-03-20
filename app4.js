/* ═══════════════════════════════════════
   app4.js — Module 5 (expanded) + Explorer + Quiz Engine
   ═══════════════════════════════════════ */

// ─── MODULE 5: HYPOTHESIS TESTING ────────────────────────────────
function m5() {
  return `
<div class="module-header">
  <div class="module-tag">Module 5</div>
  <h2 class="module-title">The Forecasting Tournament &amp; Hypothesis Testing</h2>
  <p class="module-subtitle">How we translate raw forecast errors into rigorous tests of strategic theory — turning a MASE number into evidence for or against Hypercompetition.</p>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🎯</span> Learning Objectives</div>
  <ul class="objectives-list">
    <li>Compute MASE from first principles, correctly separating training and holdout windows.</li>
    <li>Explain why MASE is preferred over RMSE and MAPE for cross-firm comparison.</li>
    <li>Construct and interpret the ΔMASEⱼ "AI advantage" variable for any firm.</li>
    <li>Execute H1: a one-sample t-test on ΔMASEⱼ within NLI quartiles.</li>
    <li>Specify, run, and interpret H2: OLS regression with NLI, Volatility, Size, and Industry FE.</li>
    <li>Diagnose and remediate multicollinearity between NLI and Volatility using VIF and orthogonalization.</li>
  </ul>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📏</span> Why MASE? The Metric Selection Debate</div>
  <table class="data-table">
    <thead><tr><th>Metric</th><th>Formula</th><th>Problem</th><th>MASE Solution</th></tr></thead>
    <tbody>
      <tr><td>MSE / RMSE</td><td>Mean(ε²)</td><td>Scale-dependent — RMSE for JPMorgan (ATQ = $4T) dwarfs AMETEK (ATQ = $10B). Cross-firm averaging is meaningless.</td><td>MASE scales by the firm's own naive baseline — fully scale-independent.</td></tr>
      <tr><td>MAPE</td><td>Mean(|ε|/|y|)</td><td>Explodes when actual ROA ≈ 0 (many firms in Q1-2020). Division by near-zero creates infinity.</td><td>MASE uses absolute differences in the denominator — safe for near-zero ROA.</td></tr>
      <tr><td>sMAPE</td><td>2|ε|/(|y|+|ŷ|)</td><td>Bounded but still asymmetric: over-forecasts and under-forecasts receive different penalties.</td><td>MASE is symmetric and interpretable: MASE=0.7 means 30% better than naive, always.</td></tr>
    </tbody>
  </table>
  <div class="formula">MASE_j = (1/H · Σₕ|yⱼₕ − ŷⱼₕ|) / (1/(T-1) · Σₜ|yⱼₜ − yⱼ,ₜ₋₁|)</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 MASE Equation Components</div>
    <div class="eq-row"><div class="eq-sym">MASE_j</div><div class="eq-def"><strong>Mean Absolute Scaled Error for firm j</strong> — the ratio of a model’s average forecast error to the naïve (random-walk) baseline error. Values below 1.0 mean the model beats the naïve benchmark; values above 1.0 mean it doesn’t</div></div>
    <div class="eq-row"><div class="eq-sym">1/H · Σₕ|yⱼₕ − ŷⱼₕ|</div><div class="eq-def"><strong>Numerator: model’s mean absolute error (MAE) over the holdout</strong> — average absolute gap between actual ROA and forecast ROA across all H holdout quarters. This is what we’re trying to minimize</div></div>
    <div class="eq-row"><div class="eq-sym">yⱼₕ</div><div class="eq-def"><strong>Actual ROA of firm j in holdout period h</strong> — the ground truth from Compustat. H = 8 quarters (Q1-2023 – Q4-2024) in our expanding-window backtest</div></div>
    <div class="eq-row"><div class="eq-sym">ŷⱼₕ</div><div class="eq-def"><strong>Forecasted ROA for firm j at holdout step h</strong> — the model’s predicted value. For ARIMA this is the point forecast; for Chronos this is P50 (the median)</div></div>
    <div class="eq-row"><div class="eq-sym">1/(T-1) · Σₜ|yⱼₜ − yⱼ,ₜ₋₁|</div><div class="eq-def"><strong>Denominator: naïve (random-walk) MAE over training window</strong> — average absolute quarter-to-quarter change in ROA <em>during training only</em>. This is the baseline — how much ROA typically changes with no model at all</div></div>
    <div class="eq-row"><div class="eq-sym">T</div><div class="eq-def"><strong>Number of training quarters</strong> — used to set the normalization scale. T is firm-specific since each firm has a different observation history. Computed on training data only to prevent look-ahead bias</div></div>
    <div class="eq-row"><div class="eq-sym">MASE = 0.7</div><div class="eq-def">Concrete example: the model’s forecast error is <strong>30% smaller</strong> than simply repeating last quarter’s ROA. MASE = 1.5 means the model is 50% <em>worse</em> than the naive random walk</div></div>
  </div>
  <div class="callout warning"><strong>Common error:</strong> Including holdout data in the MASE denominator. The denominator must be the <em>training-period</em> naive MAE — computed before the holdout window begins. Otherwise you've introduced look-ahead bias into the scale normalization.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🏆</span> ΔMASEⱼ: Operationalizing the AI Advantage</div>
  <div class="formula">ΔMASEⱼ = MASE_ARIMA,j − MASE_Chronos,j</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 ΔMASE Components</div>
    <div class="eq-row"><div class="eq-sym">ΔMASEⱼ</div><div class="eq-def"><strong>The Chronos net advantage for firm j</strong> — how much better Chronos is than ARIMA, scaled by the same naïve baseline. Positive = Chronos wins; negative = ARIMA wins; zero = tie</div></div>
    <div class="eq-row"><div class="eq-sym">MASE_ARIMA,j</div><div class="eq-def"><strong>ARIMA’s scaled forecast error</strong> for firm j — fit from scratch using the firm’s own training history. ARIMA uses only linear AR+MA structure and the optimal (p, d, q) chosen by AICc</div></div>
    <div class="eq-row"><div class="eq-sym">MASE_Chronos,j</div><div class="eq-def"><strong>Chronos-Bolt’s scaled forecast error</strong> for firm j — computed using the P50 (median) quantile forecast in zero-shot mode. No training, no fine-tuning: pure pre-trained pattern recognition</div></div>
    <div class="eq-row"><div class="eq-sym">Scale-free property</div><div class="eq-def">Because both ARIMA and Chronos are scaled by the <em>same</em> naïve denominator, ΔMASE is comparable across firms regardless of whether ROA is 0.03 or 0.0003 — the playing field is level</div></div>
  </div>
  <div class="section-label">Real-Data Illustration — from WRDS Compustat Sample</div>
  <table class="data-table" id="delta-mase-table">
    <thead><tr><th>Firm</th><th>Sector</th><th>Mean ROA</th><th>CV (NLI proxy)</th><th>Predicted ΔMASE</th><th>Predicted Winner</th></tr></thead>
    <tbody id="delta-mase-body">${buildDeltaMaseRows()}</tbody>
  </table>
  <div class="callout info"><strong>Note:</strong> The NLI values above are illustrative — actual NLI requires the full ARIMA → Ljung-Box → BDS pipeline on each firm's residuals, not the CV proxy used in the Explorer. The directional pattern (higher volatility → higher NLI → higher ΔMASE) is however consistent with the hypothesis.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🧪</span> H1: The Tournament Test (NLI Quartile Comparison)</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    <strong>H1a (Low NLI):</strong> In Q1 (bottom 25% of NLI), ΔMASE ≈ 0 (p &gt; 0.05) — ARIMA and Chronos tie for linear firms.<br>
    <strong>H1b (High NLI):</strong> In Q4 (top 25% of NLI), ΔMASE &gt; 0 (p &lt; 0.01) — Chronos wins decisively for complex firms.
  </p>
  <pre><code><span class="code-kw">from</span> scipy <span class="code-kw">import</span> stats
<span class="code-kw">import</span> pandas <span class="code-kw">as</span> pd

<span class="code-cm"># Assign NLI quartiles</span>
results[<span class="code-str">'NLI_q'</span>] = pd.<span class="code-fn">qcut</span>(results[<span class="code-str">'NLI'</span>], q=<span class="code-num">4</span>, labels=[<span class="code-num">1</span>,<span class="code-num">2</span>,<span class="code-num">3</span>,<span class="code-num">4</span>])

<span class="code-cm"># H1a: Q1 firms — expect no Chronos advantage</span>
q1 = results[results[<span class="code-str">'NLI_q'</span>]==<span class="code-num">1</span>][<span class="code-str">'Delta_MASE'</span>]
t1, p1 = stats.<span class="code-fn">ttest_1samp</span>(q1, popmean=<span class="code-num">0</span>)
<span class="code-fn">print</span>(<span class="code-str">f"H1a Q1: t={t1:.3f}, p={p1:.4f} (expect p>0.05)"</span>)

<span class="code-cm"># H1b: Q4 firms — expect Chronos wins</span>
q4 = results[results[<span class="code-str">'NLI_q'</span>]==<span class="code-num">4</span>][<span class="code-str">'Delta_MASE'</span>]
t4, p4 = stats.<span class="code-fn">ttest_1samp</span>(q4, popmean=<span class="code-num">0</span>)
<span class="code-fn">print</span>(<span class="code-str">f"H1b Q4: t={t4:.3f}, p={p4:.4f} (expect p&lt;0.01)"</span>)

<span class="code-cm"># Cohen's d for effect size</span>
d = q4.<span class="code-fn">mean</span>() / q4.<span class="code-fn">std</span>()
<span class="code-fn">print</span>(<span class="code-str">f"Effect size d={d:.3f} (>0.5 = medium, >0.8 = large)"</span>)</code></pre>
  <div class="callout info"><strong>Reporting standard:</strong> Report t-statistic, p-value, Cohen's d, and 95% CI for the mean ΔMASE. A statistically significant result with d &lt; 0.2 (tiny effect) is theoretically uninteresting — always report magnitude alongside significance.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📊</span> H2: The OLS Regression (Continuous NLI)</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    H1 treats NLI as categorical (quartiles). H2 treats it continuously and controls for confounds.
  </p>
  <div class="formula">ΔMASEⱼ = β₀ + β₁·NLIⱼ + β₂·Volatility_j + β₃·Size_j + μ_Industry + εⱼ</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 OLS Regression Components</div>
    <div class="eq-row"><div class="eq-sym">β₀</div><div class="eq-def"><strong>Intercept (baseline advantage)</strong> — the predicted ΔMASE for a firm with NLI = 0, average volatility and size, in the reference industry. Tells you the average advantage at zero complexity</div></div>
    <div class="eq-row"><div class="eq-sym">β₁</div><div class="eq-def"><strong>The key coefficient — effect of NLI on ΔMASE</strong>. This is what Hypothesis 2 tests. If β₁ > 0 and statistically significant, every one-unit increase in the BDS z-score predicts β₁ additional MASE points of Chronos advantage</div></div>
    <div class="eq-row"><div class="eq-sym">β₂·Volatility_j</div><div class="eq-def"><strong>Control for raw noise magnitude</strong> — standard deviation of the firm's ROA over the training window. Controls for: could the ARIMA disadvantage simply be because high-NLI firms are also high-volatility? This separates <em>structured nonlinearity</em> from mere unpredictability</div></div>
    <div class="eq-row"><div class="eq-sym">β₃·Size_j</div><div class="eq-def"><strong>Control for firm size</strong> — measured as ln(ATQ), the natural log of average total assets. Larger firms diversify across more products/regions — their ROA is smoother (more linear). Expected sign: β₃ < 0</div></div>
    <div class="eq-row"><div class="eq-sym">μ_Industry</div><div class="eq-def"><strong>Industry fixed effects</strong> — a set of dummy variables for each 2-digit NAICS sector. Absorbs any systematic industry-wide differences in forecastability (e.g., retail ROA is more seasonal, energy ROA more correlated with commodity cycles)</div></div>
    <div class="eq-row"><div class="eq-sym">εⱼ</div><div class="eq-def"><strong>Residual error</strong> — idiosyncratic firm-level variation in ΔMASE not captured by NLI, volatility, size, or industry. Assumed to be i.i.d. with mean zero; tested for heteroskedasticity using Breusch-Pagan</div></div>
  </div>
  <div class="section-label">Variable Definitions</div>
  <table class="data-table">
    <thead><tr><th>Variable</th><th>Measurement</th><th>Expected β Sign</th><th>Rationale</th></tr></thead>
    <tbody>
      <tr><td style="color:var(--accent-amber)">NLI</td><td>BDS z-score from ARIMA residuals</td><td style="color:var(--accent-green)"><strong>+ ✓</strong></td><td>Core test: more complexity → larger Chronos advantage</td></tr>
      <tr><td>Volatility</td><td>Std dev of firm's winsorized ROA (in-sample)</td><td>Ambiguous</td><td>Controls for raw noise magnitude vs. structural complexity</td></tr>
      <tr><td>Size</td><td>ln(ATQ) — log of total assets</td><td>−</td><td>Larger firms are more diversified → more linear → smaller Chronos advantage</td></tr>
      <tr><td>Industry FE</td><td>NAICS 2-digit sector dummies</td><td>Varies</td><td>Absorbs industry-specific forecasting difficulties (energy vs. banking vs. tech)</td></tr>
    </tbody>
  </table>
  <pre><code><span class="code-kw">import</span> statsmodels.formula.api <span class="code-kw">as</span> smf

<span class="code-cm"># Add control variables</span>
results[<span class="code-str">'Volatility'</span>] = results.<span class="code-fn">groupby</span>(<span class="code-str">'gvkey'</span>)[<span class="code-str">'ROA_w'</span>].<span class="code-fn">transform</span>(<span class="code-str">'std'</span>)
results[<span class="code-str">'Size'</span>]       = np.<span class="code-fn">log</span>(results[<span class="code-str">'ATQ_mean'</span>])
results[<span class="code-str">'Industry'</span>]   = results[<span class="code-str">'naics2'</span>].<span class="code-fn">astype</span>(<span class="code-str">'category'</span>)

<span class="code-cm"># OLS with industry fixed effects</span>
formula = <span class="code-str">'Delta_MASE ~ NLI + Volatility + Size + C(Industry)'</span>
model   = smf.<span class="code-fn">ols</span>(formula, data=results).<span class="code-fn">fit</span>(cov_type=<span class="code-str">'HC3'</span>)
<span class="code-fn">print</span>(model.<span class="code-fn">summary</span>())

<span class="code-cm"># VIF check for multicollinearity</span>
<span class="code-kw">from</span> statsmodels.stats.outliers_influence <span class="code-kw">import</span> variance_inflation_factor
X = results[[<span class="code-str">'NLI'</span>, <span class="code-str">'Volatility'</span>, <span class="code-str">'Size'</span>]].<span class="code-fn">dropna</span>()
vif = pd.<span class="code-fn">DataFrame</span>({<span class="code-str">'var'</span>: X.columns,
    <span class="code-str">'VIF'</span>: [<span class="code-fn">variance_inflation_factor</span>(X.values, i) <span class="code-kw">for</span> i <span class="code-kw">in</span> <span class="code-fn">range</span>(X.shape[<span class="code-num">1</span>])]})
<span class="code-fn">print</span>(vif)</code></pre>
  <div class="callout warning"><strong>VIF threshold:</strong> VIF &gt; 10 flags severe multicollinearity. If VIF(NLI) and VIF(Volatility) are both high, orthogonalize: regress NLI on Volatility (and other controls), extract residuals as "NLI_orth" — the part of complexity unexplained by simple noise magnitude. Use NLI_orth as the main predictor.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🔬</span> VIF Diagnostic &amp; Orthogonalization</div>
  <pre><code><span class="code-cm"># If VIF(NLI) > 10: orthogonalize NLI against Volatility</span>
aux_model = smf.<span class="code-fn">ols</span>(<span class="code-str">'NLI ~ Volatility + Size'</span>, data=results).<span class="code-fn">fit</span>()
results[<span class="code-str">'NLI_orth'</span>] = aux_model.<span class="code-fn">resid</span>()   <span class="code-cm"># "pure" complexity</span>

<span class="code-cm"># Re-run main regression with orthogonalized NLI</span>
formula2 = <span class="code-str">'Delta_MASE ~ NLI_orth + Volatility + Size + C(Industry)'</span>
model2   = smf.<span class="code-fn">ols</span>(formula2, data=results).<span class="code-fn">fit</span>(cov_type=<span class="code-str">'HC3'</span>)
<span class="code-cm"># β₁ on NLI_orth now measures: 1 unit of "pure complexity" → β₁ units of Chronos advantage</span></code></pre>
  <div class="callout success"><strong>Interpretation after orthogonalization:</strong> If β₁ on NLI_orth remains positive and significant, the Chronos advantage is driven by <em>genuine strategic complexity</em>, not merely by higher overall volatility. This is the cleanest test of the Hypercompetition theory.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🏁</span> Synthesizing the Full Theoretical Story</div>
  <div class="step-list">
    <div class="step-item"><div class="step-num">1</div><div class="step-body"><h4>H1a confirmed (Low-NLI firms, Q1):</h4><p>ΔMASE ≈ 0, p &gt; 0.05. For RBV-consistent firms — stable competitive advantages, smooth ROA trajectories — ARIMA captures all relevant patterns. Chronos adds nothing. The linear world belongs to ARIMA.</p></div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-body"><h4>H1b confirmed (High-NLI firms, Q4):</h4><p>ΔMASE &gt; 0, p &lt; 0.01. Chronos outperforms ARIMA significantly for hypercompetitive firms. The AI's pre-trained pattern library contains templates for the rapid, non-repeating strategic moves that define hypercompetition.</p></div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-body"><h4>H2 confirmed (continuous β₁ &gt; 0):</h4><p>Each unit increase in NLI produces a measurable, robust increase in ΔMASE — holding volatility, size, and industry constant. The relationship is not an artifact of noise magnitude or industry effects.</p></div></div>
    <div class="step-item"><div class="step-num">4</div><div class="step-body"><h4>Strategic Implication:</h4><p>A firm's NLI score is a directly actionable metric. Firms with NLI &gt; 1.96 should supplement or replace traditional linear forecasting tools (ARIMA, linear regression) with AI foundation models. Firms with NLI &lt; 1.96 can continue relying on well-specified ARIMA models without loss of accuracy.</p></div></div>
  </div>
</div>

<div class="card" style="border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.04)">
  <div class="card-title"><span class="icon">📋</span> Exercise 5A — Full Pipeline from Data to Decision (Capstone)</div>
  <p style="color:var(--text-secondary);font-size:13.5px;line-height:1.7;margin-bottom:14px">
    You are given firm-level results for 200 firms. The regression produces: β₀=−0.04, β₁=+0.19 (NLI, p&lt;0.001), β₂=−0.82 (Volatility, p=0.23), β₃=−0.021 (Size, p=0.09). VIF: NLI=7.2, Volatility=6.9, Size=1.3. R²=0.41.
  </p>
  <div class="step-list">
    <div class="step-item"><div class="step-num">1</div><div class="step-body"><h4>Predict ΔMASE for a firm with NLI=3.5, Volatility=0.04, Size=9.2, using the regression equation.</h4>
    <div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">ΔMASE = −0.04 + 0.19(3.5) + (−0.82)(0.04) + (−0.021)(9.2) = −0.04 + 0.665 − 0.033 − 0.193 = <strong>+0.399</strong>. Chronos is predicted to outperform ARIMA by 0.40 MASE units — a large, economically significant advantage.</div></div>
    </div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-body"><h4>Should you be concerned about multicollinearity? VIF(NLI)=7.2, VIF(Volatility)=6.9.</h4>
    <div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">VIF values between 5–10 signal moderate multicollinearity — worth noting but not severe. Since VIF &lt; 10, orthogonalization is not mandatory, but reporting it as a sensitivity check strengthens the paper. The fact that β₁(NLI) is highly significant (p&lt;0.001) despite moderate VIF confirms the result is robust to the NLI-Volatility correlation.</div></div>
    </div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-body"><h4>β₂ (Volatility) has p=0.23. Should you drop it from the model?</h4>
    <div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;"><strong>No.</strong> Volatility is a theoretically motivated control variable — it was included based on the research design, not data-driven selection. Dropping statistically non-significant controls based on p-values is "specification searching" (p-hacking). Keep Volatility in the model; its non-significance is itself a finding — it suggests the Chronos advantage is driven by complexity structure (NLI), not by mere noise magnitude (Volatility).</div></div>
    </div></div>
  </div>
</div>

${quizBlock(5, [{"q": "A firm has in-sample (training period) naive MAE = 0.00394 and ARIMA holdout MAE = 0.00512. Calculate the ARIMA MASE and provide a precise interpretation of what this number means for the firm's predictability.", "opts": ["MASE = 0.77 — computed as 0.00394 / 0.00512 — meaning ARIMA beats the naive baseline by 23%, confirming the model adds predictive value", "MASE = 1.30 — computed as 0.00512 / 0.00394 — ARIMA is 30% WORSE than simply predicting 'no change from last quarter.' This firm likely has nonlinear dynamics that a linear model cannot capture, making it a strong Chronos candidate and predicting high NLI.", "MASE = 0.00394 — the training naive MAE IS the MASE value since it serves as the denominator baseline", "MASE cannot be computed without the ARIMA model order (p,d,q) because the model order determines the correct formula"], "correct": 1, "fb": "MASE = holdout MAE_model / training naive MAE = 0.00512 / 0.00394 = 1.298, which we round to 1.30. Let's build the intuition carefully: The DENOMINATOR (0.00394) measures how unpredictable this series is at baseline. It answers: 'If you simply guessed last quarter's ROA as your forecast for this quarter, how wrong would you be on average, WITHIN the training period?' This baseline error level characterizes the fundamental difficulty of forecasting this particular series at this scale. The NUMERATOR (0.00512) measures ARIMA's holdout errors — how wrong the trained ARIMA model was on quarters it never saw during training. MASE = 1.30 means ARIMA's errors on the holdout were 30% LARGER than the baseline 'no-change' prediction's typical training-period errors. Interpretation: ARIMA is genuinely performing worse than the trivial 'guess nothing changes' approach. This failure has a specific explanation in the study's theoretical framework: the firm's ROA dynamics contain patterns that ARIMA's linear structure cannot capture. After fitting the best possible ARIMA (selected via AICc), the residuals likely still contain nonlinear structure — confirmed by BDS → NLI > 1.96. MASE > 1 is not always alarming (holdout periods can be unusually hard), but systematic MASE > 1 across similar firms strongly supports the existence of nonlinear dynamics that motivate using Chronos. The ΔMASE = MASE_ARIMA − MASE_Chronos > 0 for such firms is the H1b prediction.", "wf": ["This inverts the MASE formula. The correct calculation is HOLDOUT model error ÷ TRAINING naive error = 0.00512 ÷ 0.00394. If you compute 0.00394/0.00512 = 0.77, you're asking 'how large is the training naive error relative to the holdout ARIMA error' — which has no standard interpretation and gives exactly the wrong economic story. MASE = 0.77 < 1 would imply ARIMA beats the baseline by 23%, which is backward — the data shows ARIMA performing WORSE than naive (0.00512 > 0.00394).", "", "The training naive MAE serves as the DENOMINATOR of MASE — it's the scaling factor, not the answer. Reporting the denominator as the result is like asking 'what fraction of the pie did you eat?' and answering '4 slices total.' The MASE value is the RATIO, a dimensionless number that tells you the relative performance of the model versus the baseline. That ratio is 0.00512/0.00394, not either number in isolation.", "MASE is a PERFORMANCE metric computed AFTER the forecasting model produces its predictions. Once you have the sequence of holdout forecasts (regardless of how they were produced — by ARIMA, Chronos, or any other method) and the actual holdout values, you can compute MAE and MASE directly. You only need three things: the actual holdout values, the model's holdout forecasts, and the training-period naive errors. The model order is part of how ARIMA was fitted, not part of computing the accuracy metric."]}, {"q": "Your H2 OLS regression returns β₁(NLI) = +0.19, p = 0.048. A reviewer argues the result is 'borderline and likely a Type I error.' What is the most rigorous scientific defense, and what additional evidence would most strengthen your case?", "opts": ["Agree and add a footnote acknowledging the limitation, then re-run with a 10% significance threshold to confirm significance", "Point out that p = 0.048 satisfies the pre-specified α = 0.05 threshold, then strengthen the case by reporting the standardized effect magnitude (Cohen's f²), showing the direction aligns with H1 tournament results, and providing a robustness check across sub-samples or alternative NLI computation methods", "Increase the sample size by including non-S&P firms, re-run without disclosing the change, and report the new p-value", "Switch to the Bayesian framework and report a 95% credible interval around β₁ instead of the frequentist p-value"], "correct": 1, "fb": "The reviewer's concern is legitimate — a p-value of 0.048 is only barely below the conventional 0.05 threshold, and the scientific community increasingly recognizes that p-values slightly below any arbitrary threshold should not be treated as confirmation equivalent to p = 0.001. The correct response is not to dismiss the concern but to BUILD CONVERGING EVIDENCE from multiple independent angles: (1) Effect size magnitude: Compute Cohen's f² = R²/(1−R²) from the R² increment attributable to NLI after adding it to a model with only control variables. If f² > 0.15, the effect is considered 'medium' by convention — economic significance independent of sample size. β₁ = 0.19 means each one-unit increase in NLI is associated with 0.19 MASE units of Chronos advantage. At the NLI range in the data (roughly 0 to 4), this implies a 0.76 MASE advantage for the highest-NLI vs. lowest-NLI firms — substantial. (2) Directional consistency: H1's tournament results already showed that High-NLI firms (Q4) have significantly larger Chronos advantage than Low-NLI firms (Q1). H2 is asking whether this relationship is continuous (linear). Consistency between H1 and H2 — both pointing in the same direction — provides convergent validity. (3) Robustness: Show β₁ remains positive (even if larger confidence intervals) under alternative NLI computation parameters, different ARIMA selection criteria, or across industry sub-samples. If the sign is consistently positive under reasonable methodological variations, the finding is more credible than a single-run p = 0.048 alone.", "wf": ["Retroactively loosening the significance threshold (from α = 0.05 to α = 0.10) BECAUSE the result failed to be comfortably below 0.05 is a form of HARKing (Hypothesizing After Results are Known) and constitutes p-hacking. If the pre-registered threshold was 0.05 and p = 0.048, the result is significant by that threshold — reporting it as significant is correct. You do NOT get to change the threshold after seeing the result. Adding a 'footnote acknowledging the limitation' while simultaneously expanding the threshold to 10% is methodologically inconsistent.", "", "Adding non-S&P firms AFTER observing the result (to push p below a threshold you're uncomfortable with) is the definition of optional stopping — a well-documented form of p-hacking that inflates Type I error rates. If expanding the sample were planned from the beginning as a robustness check, it should be treated as such and the pre-specified sample's result should be reported alongside the expanded sample as a robustness check, not as the primary result with the change undisclosed.", "Switching to Bayesian credible intervals is actually a valid robustness check and the question acknowledges this is 'most rigorous.' However, the concern about Type I error under a frequentist framework is best addressed by providing MORE frequentist evidence — effect sizes, robustness checks — that strengthens the case without changing the entire analytical paradigm mid-review. Bayesian analysis can SUPPLEMENT but shouldn't simply REPLACE the pre-committed frequentist design in response to an uncomfortable p-value."]}, {"q": "After running the H2 regression, you check for multicollinearity and find that NLI has VIF = 8.3. What does this mean, and what corrective action best preserves the integrity of the NLI coefficient?", "opts": ["VIF = 8.3 < 10 means no action is needed — standard research practice accepts VIF below 10 as unproblematic", "VIF = 8.3 means NLI shares approximately 88% of its variance with other predictors. Orthogonalize: regress NLI on all other covariates (especially Volatility), save the residuals as 'complexity-purified NLI,' and use THESE residuals as the NLI variable in the main regression to isolate the pure complexity effect", "Drop the regression's lowest p-value control variable to reduce collinearity with NLI, then re-run", "Use a larger dataset — multicollinearity is a sample-size problem that automatically resolves with more observations"], "correct": 1, "fb": "VIF (Variance Inflation Factor) for a variable X_j = 1/(1 − R²_j), where R²_j is the R-squared from regressing X_j on all OTHER predictors. VIF = 8.3 means: R²_j = 1 − 1/8.3 ≈ 0.879. So 87.9% of the variation in NLI is explained by the other predictors (Volatility, Size, Industry dummies). Only 12.1% of NLI's variance is 'unique' to NLI — the rest is shared with the other covariates. This is the problem: β₁ (the NLI coefficient) is estimated from that 12.1% of unique variance. With such a small unique-variance fraction, small changes in the model specification (adding one more control, changing which firms are included) can cause large swings in β₁ — making the estimate unstable. Here's WHY Volatility is the likely culprit: both NLI and Volatility (SD of ROA) are measures of ROA variability, just different aspects of it. High-volatility firms tend to have high BDS z-scores (as explained in Module 2's Filter-Then-Test discussion). The orthogonalization fix: Step 1 — Regress NLI on Volatility, Size, and any other covariates. Step 2 — Save the residuals from this regression: these are the parts of NLI that are NOT explained by the other covariates. Step 3 — Use these residuals as 'purified NLI' in the main regression. The purified NLI is by construction uncorrelated with Volatility (because it was created by removing all Volatility-correlated variation from NLI). β₁ now estimates the effect of complexity BEYOND its correlation with noise level — which is exactly the theoretically pure test of the RBV vs. Hypercompetition mechanism.", "wf": ["The 'VIF < 10 is always fine' rule is a commonly cited heuristic, but VIF = 8.3 is close to the threshold and, more importantly, the threshold is context-dependent. A VIF of 8.3 means the standard error of β₁ is inflated by a factor of √8.3 ≈ 2.88 relative to what it would be if NLI were uncorrelated with other predictors. For a key theoretical construct like NLI (which H2 is specifically designed to test), accepting a 2.88× standard error inflation is unnecessarily conservative. The rule 'VIF < 10 is fine' was designed for exploratory analyses with many predictors, not for studies where ONE specific coefficient is the primary test of a theoretical hypothesis.", "", "Dropping a control variable to reduce collinearity with NLI is the wrong solution because it introduces OMITTED VARIABLE BIAS. If the dropped variable is a genuine confounder (e.g., Volatility affects both NLI and ΔMASE), removing it causes β₁ to absorb the dropped variable's effect. The coefficient on NLI would now partially reflect the Volatility confound, which undermines the very thing we're trying to isolate — pure NLI effect beyond volatility. The remedy for collinearity between NLI and Volatility should KEEP both in the model (to control for Volatility) while addressing the estimation instability through orthogonalization.", "Sample size does not reduce multicollinearity. Multicollinearity is a function of the CORRELATION between variables — a structural relationship that exists regardless of sample size. With 1,000 firms or with 10,000 firms, if NLI and Volatility are correlated at r = 0.94, VIF will remain approximately (1/(1−0.94²)) ≈ 10. More data DOES reduce standard errors generally (through 1/√N improvement) — which is why sometimes large samples make highly collinear variables appear 'significant' despite the multicollinearity. But it doesn't reduce VIF or improve the uniqueness of each variable's variance partition."]}, {"q": "H1 tournament results: Q1 (bottom NLI quartile) ΔMASE = 0.02, p = 0.43; Q4 (top NLI quartile) ΔMASE = 0.41, p = 0.002. What is the complete correct interpretation of these two results in the context of H1's two sub-hypotheses?", "opts": ["H1 is FULLY REJECTED — neither quartile achieves p < 0.01, so we have no statistically reliable evidence of any Chronos advantage", "H1 is FULLY SUPPORTED — H1a (Low-NLI: no Chronos advantage) is confirmed by Q1 (p = 0.43 > 0.05, fail to reject no-advantage null), AND H1b (High-NLI: significant Chronos advantage) is confirmed by Q4 (p = 0.002 < 0.05, reject no-advantage null). The pattern of ΔMASE = 0.02 fading to 0.41 across quartiles is precisely what the theory predicts", "H1 is PARTIALLY SUPPORTED — only H1b is confirmed because only Q4 has significant results; since H1a requires p < 0.05, Q1's p = 0.43 FAILS H1a", "H1 is FULLY SUPPORTED but only because BOTH groups show positive ΔMASE, meaning Chronos outperforms ARIMA in both quartiles"], "correct": 1, "fb": "This question tests whether you understand the dual structure of H1 and the fundamental logic of statistical significance in this context. H1 has TWO sub-hypotheses with specific predictions: H1a: For LOW-NLI firms, ΔMASE ≈ 0. In formal statistical language: The null hypothesis (ΔMASE = 0) SHOULD FAIL TO BE REJECTED for Q1 firms. This is the unusual case where 'not significant' is the DESIRED statistical outcome. p = 0.43 >> 0.05 → We fail to reject the null of zero Chronos advantage → This is exactly what H1a predicts. H1b: For HIGH-NLI firms, ΔMASE > 0 significantly. The null (ΔMASE = 0) SHOULD be rejected. p = 0.002 << 0.05 → We reject the null → ΔMASE = 0.41 is statistically distinguishable from zero → This is what H1b predicts. The magnitude matters too: ΔMASE = 0.41 for Q4 means Chronos reduces the forecast error gap versus the naive baseline by 41 percentage points compared to ARIMA. This is a large and economically meaningful advantage. ΔMASE = 0.02 for Q1 is not just statistically insignificant — it is quantitatively tiny (2 percentage points), suggesting no practically meaningful advantage either. The complete confirmation of BOTH H1a and H1b simultaneously is the cleanest possible empirical result — the data exhibits exactly the pattern the RBV/Hypercompetition theoretical framework predicts.", "wf": ["H1 is NOT about both quartiles needing p < 0.01. H1a specifically predicts the ABSENCE of significance for Q1 — so Q1's p = 0.43 is literally the desired outcome for H1a, not evidence against H1. An argument that H1 is 'rejected' because 'neither achieves p < 0.01' reveals a fundamental misunderstanding of directional hypotheses and the difference between how H1a and H1b make their predictions. Requiring p < 0.01 for Q1 would mean demanding evidence of NO Chronos advantage — Q1's p = 0.43 is more than sufficient for that conclusion.", "", "H1a does NOT require 'p < 0.05' for confirmation — that framing is backwards. H1a predicts a non-significant result for Q1 (i.e., the data are consistent with zero Chronos advantage for Low-NLI firms). The statistical language for this is: 'we fail to reject H₀ (ΔMASE = 0) for Q1.' p = 0.43 accomplishes this convincingly. H1a would be CONTRADICTED if Q1 had p < 0.05 — that would mean Low-NLI firms also show significant Chronos advantage, which would undermine the moderating prediction of NLI.", "Both ΔMASE values being positive (0.02 and 0.41) does NOT support H1. H1a predicts the Q1 advantage is STATISTICALLY INDISTINGUISHABLE FROM ZERO. If both were positive and significant, it would suggest Chronos always outperforms ARIMA regardless of NLI — which is the OPPOSITE of what the theory predicts. The crucial finding is that Q1's advantage is statistically zero (p = 0.43) while Q4's is highly significant (p = 0.002). The DELTA between the two groups, not the universal positivity, is the evidence for H1."]}, {"q": "The Breusch-Pagan test on your H2 OLS regression returns p = 0.009, confirming heteroskedasticity. How should you respond, and why does the underlying cause of heteroskedasticity matter for choosing the remedy?", "opts": ["Remove all High-NLI firms from the regression since they are the source of heteroskedastic variance", "Apply HC3 heteroskedasticity-robust standard errors to the OLS estimates. β₁ remains unbiased; only the standard errors need correction. HC3 specifically adjusts the variance-covariance matrix to correctly reflect the actual error variance structure without requiring homoskedasticity", "Re-estimate the model using Weighted Least Squares (WLS) where each observation's weight is set proportional to its NLI value", "No action is needed — Breusch-Pagan has low statistical power and frequently false-positive at n = 150"], "correct": 1, "fb": "This question requires understanding two things: (1) WHAT heteroskedasticity does to OLS, and (2) HOW HC3 robust standard errors fix it. The Gauss-Markov theorem guarantees OLS is BLUE (Best Linear Unbiased Estimator) under homoskedasticity. When error variance is heteroskedastic (varies systematically with the predictors — likely because high-NLI firms have much more variable ΔMASE outcomes than low-NLI firms), OLS coefficients REMAIN UNBIASED. β₁ = 0.19 is still a valid point estimate. What breaks is the variance estimation: OLS computes standard errors assuming E[εᵢ²] = σ² for all i. If actually E[εᵢ²] = σᵢ² (firm-specific variance), then OLS standard errors s(β̂₁) are wrong — typically too small for the high-NLI firms that contribute most to β₁ estimation. This makes t-statistics too large and p-values too small, generating spuriously significant results. HC3 (Heteroskedasticity-Consistent standard errors, MacKinnon-White 1985 hat-matrix-adjusted version) corrects the variance-covariance matrix using actual observed residuals: Var_HC3(β̂) = (X'X)⁻¹ · [Σᵢ (hᵢᵢeᵢ²/(1-hᵢᵢ)²)] · (X'X)⁻¹, where hᵢᵢ are leverage values and eᵢ are residuals. This formula doesn't assume homoskedasticity — it estimates each observation's error variance contribution from the data itself. The result: β₁ = 0.19 unchanged, but its standard error and p-value are now correctly computed. If p still comes in below 0.05 with HC3 standard errors (which are typically LARGER than OLS standard errors under heteroskedasticity), the result is arguably stronger than the original — it survived a more conservative standard error calculation.", "wf": ["Removing High-NLI firms is methodologically catastrophic: these observations are the PRIMARY EVIDENCE for H1b and H2. High-NLI firms generate the largest ΔMASE values and drive the positive β₁ coefficient. Removing them to cure heteroskedasticity is like removing all the data points that support your hypothesis and then declaring the hypothesis untested. The correct approach treats heteroskedasticity as a STANDARD ERROR problem, not a sample composition problem.", "", "WLS is a valid alternative to HC3 in principle, but it requires knowing (or correctly estimating) the weight for each observation — specifically, the inverse of each observation's error variance. Setting weights proportional to NLI would only be correct if the error variance truly increases linearly with NLI. The actual heterogeneity pattern in the errors may not match this assumed structure. Incorrectly specified WLS can produce BIASED coefficients (unlike HC3, which preserves OLS's unbiasedness while correcting standard errors). HC3 requires NO assumption about the form of heteroskedasticity — it's fully general.", "With n = 150, the Breusch-Pagan test has reasonable power to detect heteroskedasticity. p = 0.009 is not 'borderline' — it strongly rejects homoskedasticity. False positive rates for Breusch-Pagan at conventional significance levels are well-calibrated in simulation studies at n = 100–200. The p = 0.009 result should be taken seriously: the probability of observing this test statistic by chance alone (under true homoskedasticity) is less than 1%. Ignoring it means reporting OLS standard errors that are likely too small, producing overconfident inference about β₁."]}])}`;
}

// ─── MODULE 6: LIVE DATA EXPLORER ─────────────────────────────────
function m6() {
  const sectorOpts = (state.sectorData || [])
    .filter(s => s.sector && s.mean_roa != null)
    .sort((a, b) => (a.sector||'').localeCompare(b.sector||''))
    .map(s => `<option value="${s.sector}">${s.sector}</option>`).join('');

  const firmOpts = (state.firms || []).slice(0, 150)
    .map(f => `<option value="${f.gvkey}">${f.name}</option>`).join('');

  return `
<div class="module-header">
  <div class="module-tag">📊 Live Data Explorer</div>
  <h2 class="module-title">Explore Real Compustat Data</h2>
  <p class="module-subtitle">Interact with actual firm ROA trajectories, sector distributions, and simulated model comparisons powered by your WRDS dataset.</p>
</div>

<div class="stats-row" id="explorer-stats">
  <div class="stat-box"><div class="stat-value" id="stat-firms">${(state.firms||[]).length || '—'}</div><div class="stat-label">Firms Loaded</div></div>
  <div class="stat-box"><div class="stat-value" id="stat-obs">${(state.firmData||[]).length.toLocaleString() || '—'}</div><div class="stat-label">Observations</div></div>
  <div class="stat-box"><div class="stat-value" id="stat-sectors">${(state.sectorData||[]).length || '—'}</div><div class="stat-label">Sectors</div></div>
  <div class="stat-box"><div class="stat-value" id="stat-mean-roa">—</div><div class="stat-label">Avg. ROA</div></div>
</div>

<!-- FIRM EXPLORER -->
<div class="card">
  <div class="card-title"><span class="icon">📈</span> Firm ROA Time Series Explorer</div>
  <div class="firm-selector-wrap">
    <label>Firm:</label>
    <select id="firm-select" onchange="updateFirmChart()">${firmOpts||'<option>Loading…</option>'}</select>
    <label>Sector Filter:</label>
    <select id="sector-filter" onchange="filterFirmsBysector()">
      <option value="">All Sectors</option>${sectorOpts}
    </select>
    <button onclick="downloadRScript()" style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:#10b981;font-family:Inter,sans-serif;font-size:12px;font-weight:600;padding:8px 16px;border-radius:8px;cursor:pointer;transition:all 0.2s;white-space:nowrap" onmouseover="this.style.background='rgba(16,185,129,0.22)'" onmouseout="this.style.background='rgba(16,185,129,0.12)'">
      ⬇️ Download R Analysis Script
    </button>
  </div>
  <div class="callout info" style="margin-bottom:16px">
    <strong>📊 R Statistical Capabilities:</strong> Click "Download R Analysis Script" to get a complete working Filter-Then-Test R script for the selected firm — includes stationarity tests (ADF/KPSS), structural break detection (Bai-Perron), auto-ARIMA selection, Ljung-Box whiteness test, BDS nonlinearity test, and MASE baseline calculation. Run it locally with <code>Rscript your_script.R</code> using your own WRDS credentials.
  </div>
  <div id="firm-stats" style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap"></div>
  <div class="chart-wrap tall"><canvas id="firmChart"></canvas></div>
  <p class="chart-label">Quarterly ROA — winsorized at 1st/99th percentile · Select any firm to explore its trajectory</p>
</div>

<!-- SECTOR COMPARISON -->
<div class="card">
  <div class="card-title"><span class="icon">🏭</span> Sector ROA Comparison</div>
  <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px">Mean ROA and standard deviation by sector. <strong>Higher mean + lower SD</strong> = RBV-consistent (AMETEK, JPMorgan). <strong>Near-zero mean + high SD</strong> = Hypercompetitive (Cleveland-Cliffs, Hess).</p>
  <div class="chart-wrap tall"><canvas id="sectorChart"></canvas></div>
</div>

<!-- NLI SIMULATOR -->
<div class="card">
  <div class="card-title"><span class="icon">🧪</span> NLI Simulator — Who Wins the Tournament?</div>
  <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px">
    Drag the sliders to set a firm's NLI, Volatility, and Size. The simulator applies estimated regression coefficients to predict the expected ΔMASE and tournament winner. Based on: ΔMASE = −0.04 + 0.19·NLI − 0.82·Vol − 0.021·Size.
  </p>
  <div class="filter-bar">
    <label>NLI: <strong id="nli-val">2.0</strong></label>
    <input type="range" id="nli-slider" min="0" max="6" step="0.1" value="2.0" oninput="updateSimulator()"/>
    <label>Volatility (SD): <strong id="vol-val">0.030</strong></label>
    <input type="range" id="vol-slider" min="0.005" max="0.12" step="0.005" value="0.030" oninput="updateSimulator()"/>
    <label>Size (ln ATQ): <strong id="size-val">8.0</strong></label>
    <input type="range" id="size-slider" min="4" max="14" step="0.5" value="8" oninput="updateSimulator()"/>
  </div>
  <div id="sim-output" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:14px 0"></div>
  <div class="chart-wrap" style="height:240px"><canvas id="simChart"></canvas></div>
  <p class="chart-label">Predicted ΔMASE across NLI range — yellow dot = current firm setting</p>
</div>

<!-- ═══ STATISTICAL ENGINE ═══ -->
<div class="card analysis-engine-card">
  <div class="card-title"><span class="icon">⚙️</span> Filter-Then-Test Statistical Engine</div>
  <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;line-height:1.6">
    Select any firm above, then click <strong>Run Analysis</strong> to execute the real Filter-Then-Test pipeline live:
    ADF + KPSS stationarity → Auto-ARIMA selection → Ljung-Box whiteness gate → BDS test → NLI score.
    Computation takes ~3–8 seconds. Click <strong>Forecast</strong> after analysis to overlay 8 quarters of ARIMA predictions with 80% confidence intervals on the chart above.
  </p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
    <button id="btn-analyze" onclick="runAnalysis()" class="btn-engine">⚙️ Run Filter-Then-Test Analysis</button>
    <button id="btn-forecast" onclick="runForecast()" class="btn-engine btn-forecast-eng" disabled>📈 Forecast 8 Quarters</button>
  </div>
  <div id="analysis-spinner" style="display:none" class="spinner-wrap">
    <div class="spinner"></div><span>Running statistical pipeline on real WRDS data…</span>
  </div>
  <div id="analysis-results"></div>
</div>


<!-- ROA DISTRIBUTION -->
<div class="card">
  <div class="card-title"><span class="icon">📊</span> ROA Distribution by Sector</div>
  <div class="filter-bar">
    <label>Sector:</label>
    <select id="dist-sector" onchange="updateDistChart()">${sectorOpts}</select>
  </div>
  <div class="chart-wrap" style="height:260px"><canvas id="distChart"></canvas></div>
  <p class="chart-label">Distribution of quarterly ROA values — wide spread = high volatility = likely higher NLI</p>
</div>

<!-- TOP FIRMS BY COMPLEXITY -->
<div class="card">
  <div class="card-title"><span class="icon">🏆</span> Real Data: Complexity Extremes</div>
  <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px">Drawn directly from <code>tutorial_firm_stats.csv</code> — your actual WRDS dataset. <strong>High-CV firms</strong> are predicted to favour Chronos; <strong>Low-CV firms</strong> are predicted to favour ARIMA.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div>
      <div class="section-label">⚡ Top 5 Most Complex (High CV)</div>
      <table class="data-table" style="font-size:12px">
        <thead><tr><th>Firm</th><th>Mean ROA</th><th>SD</th><th>CV</th></tr></thead>
        <tbody id="top-complex-body">Loading…</tbody>
      </table>
    </div>
    <div>
      <div class="section-label">🛡️ Top 5 Most Stable (Low CV)</div>
      <table class="data-table" style="font-size:12px">
        <thead><tr><th>Firm</th><th>Mean ROA</th><th>SD</th><th>CV</th></tr></thead>
        <tbody id="top-stable-body">Loading…</tbody>
      </table>
    </div>
  </div>
</div>
${quizBlock(6, [{"q": "You select AMETEK Inc in the Live Data Explorer and observe ROA ≈ 0.022 with CV ≈ 11 (very stable). Based on this profile, trace through the full expected Filter-Then-Test pipeline result, predicting NLI and the expected ΔMASE (Chronos advantage) for this firm.", "opts": ["High NLI (> 1.96) — all large-cap S&P 500 industrials face hypercompetitive pressure from global manufacturing competitors, driving nonlinear dynamics regardless of observed stability", "Low NLI (< 1.96) — AMETEK's low CV signals tight, stable ROA dynamics. ARIMA will fit well (auto.arima selects a mean-reverting AR(1) or AR(2)), Ljung-Box will pass (p > 0.05), BDS will fail to reject i.i.d. (NLI < 1.96), and ΔMASE ≈ 0 because Chronos cannot improve on what ARIMA already handles correctly", "NLI = 0.000 exactly — AMETEK's data is too consistent to produce any BDS statistic other than exactly zero", "NLI cannot be predicted from CV alone without first running the full pipeline — CV is unrelated to BDS outcomes"], "correct": 1, "fb": "Walking through the full pipeline step by step for AMETEK: Step 1 — ADF + KPSS stationarity tests. With mean ROA = 0.022 and tiny variance, the series is almost certainly stationary in levels. ADF will likely reject the unit root null (p < 0.05) and KPSS will fail to reject the stationarity null (p > 0.10). This means d = 0 — no differencing needed. Step 2 — auto.arima. With d = 0, the algorithm searches over AR and MA orders. The tight mean-reversion pattern (close to but not quite at the mean each quarter) suggests a low-order AR model: likely AR(1) with φ ≈ 0.6–0.8. AICc selects perhaps ARIMA(1,0,0) or ARIMA(2,0,0). Step 3 — Ljung-Box on residuals. A well-specified AR(1) or AR(2) for a genuinely mean-reverting process should produce clean, uncorrelated residuals. Ljung-Box p will likely be > 0.20 — no residual structure remaining. Step 4 — BDS on whitened residuals. The residuals are clean i.i.d. noise. BDS correlation integrals at embedding dimensions m=2,3,4,5 will all be near zero. The z-score will be well below 1.96. NLI < 1 likely. Step 5 — ΔMASE prediction. ARIMA correctly models AMETEK's linear mean-reversion. In the holdout, ARIMA forecasts will converge smoothly toward 0.022 each quarter — which matches AMETEK's actual behavior. MASE_ARIMA ≈ 0.85–0.95 (better than naive). Chronos also handles mean-reversion well but has no structural advantage here. ΔMASE ≈ 0. H1a confirmed for AMETEK.", "wf": ["This confuses INDUSTRY-LEVEL competitive dynamics with FIRM-LEVEL ROA time series structure. Hypercompetition (D'Aveni) describes an industry environment where firms are forced into rapid strategic moves. But not every participant in a competitive industry exhibits NONLINEAR ROA dynamics — companies with strong VRIN resources (like AMETEK's OEM contracts and manufacturing know-how) can maintain stable, predictable performance even within a turbulent industry. The NLI measures the dynamics of THIS FIRM'S ROA, not the average dynamics of its industry. AMETEK has explicitly low NLI empirically — it is the study's canonical Low-NLI example.", "", "NLI is a z-score derived from the BDS correlation integral test. Under i.i.d. residuals, the BDS statistic follows an asymptotic standard normal distribution with mean 0 and variance 1. Even for perfectly i.i.d. residuals, finite-sample BDS statistics have non-zero values due to sampling randomness — generating z-scores centered around 0 but not exactly at 0. NLI = 0.000 exactly is mathematically possible but occurs with probability measure zero and should never be expected or asserted as a prediction.", "CV is an excellent directional predictor of NLI precisely because both CV and NLI measure (different aspects of) ROA variability relative to its central tendency. The study's own data shows strong correlation between CV and NLI classification. While CV is not a perfect substitute (a firm could have one-off extreme quarters not reflecting persistent nonlinear dynamics), its directional predictive power is substantial and well-documented in descriptive statistics comparing CV distributions across NLI quartiles."]}, {"q": "The Statistical Engine shows ADF test p = 0.23 (with a trend term) and KPSS test p = 0.04 for a selected firm. Explain precisely what each test result means and derive the correct differencing order d for ARIMA modeling.", "opts": ["d = 0 — ADF alone determines stationarity since it is the 'gold standard' unit root test; KPSS is only advisory", "d = 2 — when ADF and KPSS produce conflicting results, the convention is to apply maximum differencing", "d = 1 — ADF H₀ = unit root; p = 0.23 > 0.05 → fail to reject → evidence of non-stationarity. KPSS H₀ = stationary; p = 0.04 < 0.05 → reject → evidence of non-stationarity. Both tests point to the same conclusion (non-stationary in levels). Apply one difference. Re-test before considering d = 2.", "d = 3 — three tests should always be run, requiring three rounds of differencing for confirmation"], "correct": 2, "fb": "The ADF (Augmented Dickey-Fuller) and KPSS tests are designed to be used TOGETHER precisely because they have opposite null hypotheses — making them complementary, not redundant. ADF details: H₀ = the series has a unit root (is non-stationary). H₁ = the series is stationary. A LOW p-value means we reject H₀ = evidence of stationarity. p = 0.23 is HIGH — we FAIL to reject → we retain the view that the series has a unit root / is non-stationary. KPSS details: H₀ = the series IS stationary. H₁ = the series is non-stationary. A LOW p-value means we reject H₀ = evidence of non-stationarity. p = 0.04 is LOW — we REJECT H₀ → evidence of non-stationarity. Reading both together — this is the UNAMBIGUOUS case. Both tests agree: the series is non-stationary in levels. The recommendation is d = 1 (first difference). The four possible combinations of results and their interpretations: (a) ADF p < 0.05, KPSS p > 0.05 → Both agree: stationary → d = 0. (b) ADF p > 0.05, KPSS p < 0.05 → Both agree: non-stationary → d = 1 (our case). (c) ADF p < 0.05, KPSS p < 0.05 → Conflict: both reject their respective nulls → ambiguous, needs additional testing or trend specification. (d) ADF p > 0.05, KPSS p > 0.05 → Both fail to reject → possibly fractionally integrated — use d = 1 with caution. After applying d = 1, re-run ADF and KPSS on the differenced series. If the differenced series shows case (a) above, you're done with d = 1.", "wf": ["Neither test is universally the 'gold standard' — each has distinct weaknesses. ADF has low power in small samples and against near-unit-root alternatives (series with φ very close to 1). KPSS has low power against specific forms of non-stationarity. This is precisely why both are used together: their combined evidence is more informative than either alone. Importantly, the two tests in this case AGREE (both indicate non-stationarity), so the conclusion is robust and unambiguous — there's no interpretation conflict to resolve.", "d = 2 is appropriate only when the FIRST-DIFFERENCED series is ALSO found to be non-stationary by follow-up ADF/KPSS tests. Immediately jumping to d = 2 without first testing whether d = 1 is sufficient is a form of over-differencing. An over-differenced series (unnecessary second difference applied to a series that was already stationary in first differences) introduces a moving average unit root into the ARIMA residuals — creating artificial structure that worsens, not improves, the model. The rule is: apply the minimum necessary differencing, verified by re-testing each time.", "", "There is no convention of running three tests and applying d = 3. The number of stationarity tests run does not correspond to the differencing order. In practice, financial ROA series require d = 0, 1, or occasionally 2. d = 3 is extremely rare and would apply only to series that remain non-stationary after two rounds of differencing — which almost never occurs in quarterly accounting data. Financial series with genuine d = 3 essentially do not exist in practice."]}, {"q": "After running the Statistical Engine on a firm you've selected, the ARIMA 8-quarter forecast overlay shows a nearly flat horizontal line for all 8 forecast periods, with confidence intervals that widen progressively toward the right. Explain BOTH phenomena — why the forecasts are flat AND why the intervals widen — and what they collectively imply about this firm's predictability.", "opts": ["A flat forecast line indicates a bug — a well-fitted ARIMA should produce upward-sloping forecasts to account for general economic growth and inflation over 8 quarters", "The flat point forecasts reflect that ARIMA(p,d=1,q) sets expected future changes to zero (E[ΔROA] = 0), and the widening intervals reflect mathematically correct multi-step forecast variance accumulation (σ²_h grows with horizon h). Together they indicate this firm has a near-random-walk ROA — the best point forecast is 'stay where you are,' but genuine uncertainty accumulates the further you project.", "Both phenomena indicate the model is under-parameterized — ARIMA needs more AR lags to produce sloping forecasts and the widening intervals will narrow if more MA terms are added", "The flat line is ARIMA's forecast for the CHANGE in ROA (not the level), and the widening intervals represent the 95% confidence band for the cumulative sum of future changes"], "correct": 1, "fb": "This is a two-part explanation that reveals the deep mathematical behavior of ARIMA at multi-step horizons and what it tells us about the firm. PART 1 — Why flat forecasts? For ARIMA(p,1,q) with no drift term (which is typical for ROA since we don't expect a systematic growth trend in profitability): The model is written in differences: ΔROA_t = φ₁·ΔROA_{t-1} + ... + θ₁·ε_{t-1} + ... + ε_t. One-step ahead: Ê[ΔROA_{t+1}] = φ₁·ΔROA_t + θ₁·ε_t (known quantities). Two-step ahead: Ê[ΔROA_{t+2}] = φ₁·Ê[ΔROA_{t+1}] + θ₁·Ê[ε_{t+1}] = φ₁·Ê[ΔROA_{t+1}] + 0. At longer horizons (h > max(p,q)): all AR and MA contributions decay to zero, and Ê[ΔROA_{t+h}] → 0. This means the level forecast: Ê[ROA_{t+h}] = ROA_t + Σ_{k=1}^{h} Ê[ΔROA_{t+k}] → ROA_t + 0 = ROA_t. The level forecast flattens at the current ROA value. PART 2 — Why widening intervals? For an I(1) process, the h-step forecast error accumulates: Var[ROA_{t+h} − Ê[ROA_{t+h}]] grows approximately as h·σ² for a random walk. The confidence interval half-width is proportional to √(h·σ²) = σ·√h — widening as the square root of the horizon. COLLECTIVE IMPLICATION: The firm's ROA follows something close to a random walk with small mean-reversion. There is no reliable long-range prediction beyond the current level — every quarter's uncertainty is independent and accumulates. This is the perfect profile for a High-NLI firm where ARIMA cannot marshal structure beyond the trivial 'stay flat' prediction, and Chronos is expected to detect cyclical or nonlinear patterns that ARIMA misses.", "wf": ["ARIMA forecasts in LEVELS, not rates of change, and has no built-in assumption about economic growth. The d=1 differencing removes a unit root, not a positive growth trend — if the series had a significant positive drift, the model would detect it and include a drift constant, producing a gently rising forecast. Without a detected drift (which is typical for ROA since ROA has no intrinsic long-run growth trend as a ratio metric), the forecast in levels is flat. A sloping forecast would only appear if: (a) d=0 and the AR coefficients produce mean-reversion toward a non-current mean, or (b) a non-zero drift term is estimated, or (c) d=2 and a linear trend exists.", "", "The flat forecast is not an indication of model under-parameterization — it is the mathematically correct result of an ARIMA(p,1,q) at long horizons REGARDLESS of p and q. Adding more AR lags would change the one-step and two-step forecasts (the transition from the current level), but at h > p quarters, the forecast always converges to the flat trajectory. Similarly, more MA terms would affect short-horizon forecasts but not long-horizon ones. The widening of confidence intervals narrows if more MA terms are added? Actually, it's the opposite: more MA terms correctly propagate MORE uncertainty through the forecast. The model specification is about fitting the linear structure, not about producing sloped forecasts.", "ARIMA forecasts are expressed in LEVELS in this visualization, not in differences. The flat line IS the forecast for ROA level (not ΔROA). The widening intervals represent the 95% confidence band for the LEVEL forecast, not the cumulative sum... actually, these are mathematically equivalent for an I(1) process: Ê[ROA_{t+h}] = ROA_t + Σ E[ΔROAs], and confidence intervals for the level encompass the uncertainty in the cumulative sum of future differences. But describing the flat line as 'the forecast for the change' is incorrect — the model displays level forecasts."]}, {"q": "Comparing Firm A (Energy sector, CV = 0.95, mean ROA = −0.001) and Firm B (Consumer Staples, CV = 0.12, mean ROA = 0.028): trace through the theory to predict which firm Chronos should outperform ARIMA for, and WHY at a mechanistic level.", "opts": ["Firm B — its higher and more stable mean ROA generates more training signal, giving Chronos's attention mechanism better patterns to match in the holdout period", "Firm A — its high CV signals structural nonlinearity driven by commodity cycles, geopolitical events, and demand shocks that ARIMA's linear filter produces contaminated residuals for, making BDS likely find NLI > 1.96. Chronos's pre-trained attention over global commodity and energy time series should recognize these patterns and forecast them better than ARIMA's mean-reverting linear extrapolation", "Both equally — Chronos's pre-training on 200M+ series includes all industries, giving it symmetric advantages against ARIMA for all firm types", "Firm B — consumer staples firms are more likely to appear in Chronos's pre-training corpus since their seasonal patterns are well-documented in retail datasets"], "correct": 1, "fb": "Let's trace the full theoretical mechanism for BOTH firms: FIRM A (Energy, CV = 0.95): Step 1 — CV = 0.95 means ROA's standard deviation is nearly equal to the absolute mean. With mean ≈ −0.001, the firm frequently oscillates across zero ROA — it is sometimes profitable, sometimes loss-making, driven by external commodity price cycles. Step 2 — after ARIMA fitting: the linear model tries to capture the autocorrelation structure. But energy firm ROA is driven by global oil/gas price cycles (nonlinear, regime-switching) and geopolitical events (discontinuous). These create nonlinear dependence in ARIMA residuals that BDS should detect → NLI likely > 1.96. Step 3 — MASE_ARIMA: likely > 1 (ARIMA worse than naive) during commodity cycles, because the nonlinear price dynamics produce forecast errors systematically larger than random walk. Step 4 — Chronos: during pre-training on 200M+ series, Chronos almost certainly encountered hundreds of commodity price series, manufacturing output series, refinery throughput series, and revenue series from energy companies worldwide. Its attention mechanism has internalized patterns that look like oil price cycles. When it sees Firm A's ROA trajectory, it may recognize the cycle structure and provide better probabilistic coverage of the downturns. ΔMASE_A > 0, large. FIRM B (Consumer Staples, CV = 0.12): Step 1 — tight, stable ROA. ADF confirms stationarity, ARIMA fits an AR(1) or AR(2). Ljung-Box passes cleanly. NLI < 1.96. Step 2 — MASE_ARIMA ≈ 0.85–0.95 (better than naive — the linear model works). Chronos may match but cannot IMPROVE on a model that already captures the full dynamics. ΔMASE_B ≈ 0. H1a confirmed for Firm B, H1b confirmed for Firm A.", "wf": ["Higher mean ROA provides more signal for Chronos only in the trivial sense that a consistent non-zero level is easier to forecast than zero. But Chronos's advantage comes specifically from detecting NONLINEAR PATTERNS — which Firm B, despite its stable positive mean, simply doesn't have. Firm B's ARIMA already fits correctly, leaving no room for Chronos to add value. More training signal for a firm with no nonlinear structure doesn't create a Chronos advantage; it simply confirms ARIMA is already optimal.", "", "Chronos does NOT have symmetric advantages. The pre-training corpus does include diverse industries, but the advantage materializes only where ARIMA structurally fails. H1a empirically shows that for Low-NLI firms (like Firm B), Chronos and ARIMA perform equivalently — ΔMASE ≈ 0. Universal Chronos dominance would make the NLI moderator irrelevant and would contradict both H1a findings and theoretical predictions. The value of Chronos is precisely its SELECTIVE advantage for the subset of firms where linear models break down.", "While consumer staples seasonal patterns do appear in retail datasets, this is not why Firm B would or would not show a Chronos advantage. The mechanism of Chronos superiority is about NONLINEAR TEMPORAL DEPENDENCE in residuals after linear filtering — not about whether similar series appeared in the training corpus. Firm B's low CV means its ARIMA residuals are likely already near i.i.d., which means there's nothing left for Chronos to exploit, regardless of what was in the training data."]}, {"q": "The 8-quarter ARIMA confidence interval displayed in the Explorer widens considerably from quarters 1–2 to quarters 7–8. A student claims this widening indicates the model was misspecified — 'a correctly specified model should maintain constant prediction uncertainty across all horizons.' How do you correct this intuition?", "opts": ["The student is correct — constant-width confidence intervals across all forecast horizons are the hallmark of correctly specified time series models", "The widening is mathematically correct ARIMA behavior, not misspecification. For any ARIMA model with AR components or differencing (d ≥ 1), h-step forecast error variance GROWS with horizon h because future shocks accumulate. Constant-width intervals would only occur for a perfectly predictable (zero-variance) series, which cannot exist in practice", "The widening occurs because ARIMA uses an expanding window of past observations — more past data means wider intervals due to averaging noise", "Widening intervals indicate that the AICc-selected model needs additional GARCH components to model the variance structure correctly"], "correct": 1, "fb": "The student's intuition comes from familiarity with cross-sectional regression, where residuals have constant variance ε ~ N(0, σ²) and confidence intervals for predicted values are constant (or nearly so) across the range of the predictor. Time series forecasting is fundamentally different because errors ACCUMULATE through time. Here is the rigorous mathematical argument for why intervals must widen: One model: ARIMA(1,0,0): ROA_t = μ + φ(ROA_{t-1} − μ) + ε_t. 1-step forecast error: e_{t+1} = ε_{t+1}. Variance = σ². 2-step forecast error: e_{t+2} = ε_{t+2} + φ·ε_{t+1}. Variance = σ²(1 + φ²). h-step: Var = σ²·(1 + φ² + φ⁴ + ... + φ^{2(h-1)}) → σ²/(1−φ²) as h→∞ (bounded for |φ|<1). For I(1) process (d=1 random walk): Var[h-step error] = h·σ² — grows LINEARLY, unboundedly. For the Explorer's ARIMA: whether d=0 or d=1, the variance grows with h, just at different rates. CONSTANT-WIDTH INTERVALS occur only when the process is perfectly deterministic (σ² = 0 — impossible for real data) or for white noise (where all future values are independent of all past values and intervals are always ±1.96σ — but this doesn't apply to auto-regressive models). The widening intervals communicate an honest truth: the further ahead you forecast, the more future random shocks have time to accumulate, and the less certain you should be. A model that produced CONSTANT intervals regardless of horizon would be underestimating forecast uncertainty at long horizons — which is a form of miscalibration, not good behavior.", "wf": ["Constant-width intervals would be a sign of MODEL FAILURE, not correctness. A model claiming equal uncertainty at 1 quarter and 8 quarters ahead is asserting that: knowing nothing that will happen in the next 7 quarters produces no additional uncertainty relative to knowing what will happen in the next 1 quarter. This is false for any model where future shocks affect predictions. The only way to get constant-width intervals is if the model is either (a) a perfect constant forecast (ROA_t = C for all t — clearly wrong), or (b) a white noise model where each period is independent and you're always predicting with the same uncertainty. Real ARIMA models always produce widening intervals.", "", "ARIMA models do not use an 'expanding window of past observations' in the sense described. ARIMA is estimated ONCE on the training period with fixed parameters. At forecast time, it uses the current state (AR lags and MA error terms) to generate forecasts forward. The widening comes from mathematical error propagation through the AR/MA structure, not from any changing amount of historical data being used. ARIMA forecast intervals are derived from the analytical formula for forecast error variance (the formula shown in the correct answer), not from bootstrap or simulation over past data windows.", "GARCH models address CONDITIONAL HETEROSKEDASTICITY — the phenomenon where error variance varies over time based on recent shocks (volatility clustering: big shocks are followed by more big shocks). While GARCH extensions of ARIMA (ARIMA-GARCH) are sometimes appropriate for financial series, the widening of ARIMA confidence intervals with horizon is not a symptom of missing GARCH components. ARIMA's confidence interval widening is a HORIZON effect (more steps → more accumulated uncertainty), while GARCH addresses a TIME-VARIATION effect within a given forecast period. These are orthogonal phenomena."]}])}
`;
}

// ─── EXPLORER LOGIC ────────────────────────────────────────────────

// Build real-data rows for Module 5 ΔMASE illustration table
function buildDeltaMaseRows() {
  const stats = (state.firmStats || []).filter(f => f.mean_roa != null && f.cv != null && f.name);
  if (!stats.length) {
    // Return a placeholder row if data not loaded yet
    return '<tr><td colspan="6" style="opacity:0.5;text-align:center">Loading real data…</td></tr>';
  }
  const REG = { b0: -0.04, b1: 0.19, b2: -0.82, b3: -0.021 };
  // Pick 3 low-CV and 3 high-CV firms for the illustration
  const sorted = [...stats].sort((a, b) => a.cv - b.cv);
  const low  = sorted.filter(f => f.cv <= 1).slice(0, 3);
  const high = sorted.filter(f => f.cv > 2).slice(-3).reverse();
  const showcase = [...low, ...high];
  return showcase.map(f => {
    const cv  = parseFloat(f.cv);
    const vol = parseFloat(f.sd_roa) || 0.01;
    const size = 8.5; // typical log-ATQ for S&P
    const dm = REG.b0 + REG.b1 * Math.min(cv, 6) + REG.b2 * vol + REG.b3 * size;
    const dmStr = dm > 0 ? `+${dm.toFixed(3)}` : dm.toFixed(3);
    const winner = dm > 0.05 ? '🤖 Chronos' : dm < -0.05 ? '📐 ARIMA' : '🤝 Tied';
    const color = dm > 0 ? 'var(--accent-green)' : dm < 0 ? 'var(--accent-red)' : 'var(--text-secondary)';
    return `<tr>
      <td>${(f.name||'').trim().substring(0,28)}</td>
      <td style="font-size:11px;opacity:0.8">${(f.sector||'').trim().substring(0,20)}</td>
      <td>${parseFloat(f.mean_roa).toFixed(4)}</td>
      <td style="color:${cv>2?'var(--accent-red)':cv>0.5?'var(--accent-amber)':'var(--accent-green)'}">${cv.toFixed(2)}</td>
      <td style="color:${color};font-weight:600">${dmStr}</td>
      <td>${winner}</td>
    </tr>`;
  }).join('');
}

// Populate Top Complex / Top Stable tables in Explorer
function populateComplexityTables() {
  const stats = (state.firmStats || []).filter(f => f.mean_roa != null && f.cv != null && f.name);
  if (!stats.length) return;
  const sorted = [...stats].sort((a, b) => a.cv - b.cv);
  // Top 5 stable: lowest CV, but exclude near-zero-mean noise firms (|mean_roa| < 0.001)
  const stable = sorted.filter(f => Math.abs(f.mean_roa) >= 0.001).slice(0, 5);
  // Top 5 complex: highest CV
  const complex = sorted.slice(-5).reverse();
  const row = f => `<tr>
    <td style="font-size:11px">${(f.name||'').trim().substring(0,26)}</td>
    <td style="color:${f.mean_roa>=0?'var(--accent-green)':'var(--accent-red)'}">${parseFloat(f.mean_roa).toFixed(4)}</td>
    <td>${parseFloat(f.sd_roa).toFixed(4)}</td>
    <td style="color:${f.cv>2?'var(--accent-red)':'var(--accent-green)'}">${parseFloat(f.cv).toFixed(1)}</td>
  </tr>`;
  const cb = document.getElementById('top-complex-body');
  const sb = document.getElementById('top-stable-body');
  if (cb) cb.innerHTML = complex.map(row).join('');
  if (sb) sb.innerHTML = stable.map(row).join('');
}

function initExplorer() {
  if (!state.firmData.length) {
    document.getElementById('content-area').insertAdjacentHTML('afterbegin',
      '<div class="callout warning" style="margin-bottom:20px"><strong>Note:</strong> Open via local server: <code>python3 launch_server.py</code> — then data loads automatically.</div>');
    return;
  }
  const roas = state.firmData.map(r => r.ROA_w).filter(v => v != null && !isNaN(v));
  document.getElementById('stat-mean-roa').textContent = (roas.reduce((a,b)=>a+b,0)/roas.length).toFixed(4);
  drawSectorChart();
  updateFirmChart();
  updateSimulator();
  setTimeout(() => { const d = document.getElementById('dist-sector'); if(d&&d.value) updateDistChart(); }, 200);
  setTimeout(() => populateComplexityTables(), 100);
}

function updateFirmChart() {
  const gvkey = parseInt(document.getElementById('firm-select').value);
  const rows = state.firmData.filter(r => r.gvkey === gvkey).sort((a,b) => a.date_proper > b.date_proper ? 1 : -1);
  if (!rows.length) return;
  const labels = rows.map(r => r.year_q || r.date_proper);
  const roas = rows.map(r => r.ROA_w);
  const validRoas = roas.filter(v => v != null);
  const mn = (validRoas.reduce((a,b)=>a+b,0)/validRoas.length).toFixed(4);
  const sd = Math.sqrt(validRoas.map(v=>(v-parseFloat(mn))**2).reduce((a,b)=>a+b,0)/validRoas.length).toFixed(4);
  const cv = (parseFloat(sd)/Math.abs(parseFloat(mn)||0.001)).toFixed(2);
  const nliProxy = parseFloat(cv) > 2 ? 'High NLI ⚡' : parseFloat(cv) > 0.5 ? 'Medium NLI' : 'Low NLI 🛡️';
  // Enrich with real firmStats if available
  const firmStat = (state.firmStats || []).find(s => s.gvkey === gvkey);
  const realFlag = firmStat ? (firmStat.complexity_flag || '') : '';
  const flagDisplay = realFlag
    ? `${realFlag === 'High' ? '⚡ High' : '🛡️ Low'} <small style="opacity:0.6">(WRDS flag)</small>`
    : nliProxy;
  document.getElementById('firm-stats').innerHTML = `
    <div class="stat-box" style="min-width:110px"><div class="stat-value" style="font-size:16px">${mn}</div><div class="stat-label">Mean ROA</div></div>
    <div class="stat-box" style="min-width:110px"><div class="stat-value" style="font-size:16px">${sd}</div><div class="stat-label">SD (Volatility)</div></div>
    <div class="stat-box" style="min-width:80px"><div class="stat-value" style="font-size:16px">${rows.length}</div><div class="stat-label">Quarters</div></div>
    <div class="stat-box" style="min-width:160px"><div class="stat-value" style="font-size:13px">${flagDisplay}</div><div class="stat-label">Complexity (CV=${cv})</div></div>
    <div class="stat-box" style="flex:1;min-width:160px"><div class="stat-value" style="font-size:12px;line-height:1.3">${(rows[0].conm||'').trim()}</div><div class="stat-label">${(rows[0].Sector_clean||'').trim()}</div></div>`;
  if (state.charts.firm) state.charts.firm.destroy();
  state.charts.firm = new Chart(document.getElementById('firmChart').getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{
      label: 'ROA', data: roas, borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 2,
      pointRadius: 3, pointHoverRadius: 6, tension: 0.3, fill: true
    }, {
      label: 'Mean ROA', data: labels.map(() => parseFloat(mn)),
      borderColor: 'rgba(16,185,129,0.5)', borderWidth: 1.5,
      borderDash: [5,4], pointRadius: 0
    }]},
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font:{size:11} } }, tooltip: { callbacks: { label: ctx => `ROA: ${ctx.parsed.y?.toFixed(5)}` } } },
      scales: {
        x: { ticks: { color: '#64748b', maxTicksLimit: 12, font:{size:10} }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#64748b', font:{size:10} }, grid: { color: 'rgba(255,255,255,0.06)' } }
      }}
  });
}

function filterFirmsBysector() {
  const sector = document.getElementById('sector-filter').value;
  const sel = document.getElementById('firm-select');
  const filtered = sector ? state.firms.filter(f => f.sector === sector) : state.firms;
  sel.innerHTML = filtered.map(f => `<option value="${f.gvkey}">${f.name}</option>`).join('');
  if (filtered.length) updateFirmChart();
}

function drawSectorChart() {
  const data = state.sectorData
    .filter(s => s.mean_roa != null && s.sector && s.sector.length < 50)
    .sort((a,b) => b.mean_roa - a.mean_roa).slice(0, 18);
  if (state.charts.sector) state.charts.sector.destroy();
  state.charts.sector = new Chart(document.getElementById('sectorChart').getContext('2d'), {
    type: 'bar',
    data: { labels: data.map(d => d.sector.replace(' and ',' & ').substring(0,30)),
      datasets: [
        { label: 'Mean ROA', data: data.map(d=>d.mean_roa), backgroundColor: data.map(d=>d.mean_roa>=0?'rgba(59,130,246,0.7)':'rgba(239,68,68,0.7)'), borderRadius:4 },
        { label: 'SD ROA',   data: data.map(d=>d.sd_roa),   backgroundColor: 'rgba(139,92,246,0.45)', borderRadius:4 }
      ]},
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color:'#94a3b8', font:{size:11} } } },
      scales: {
        x: { ticks:{color:'#64748b',font:{size:10}}, grid:{color:'rgba(255,255,255,0.04)'} },
        y: { ticks:{color:'#94a3b8',font:{size:10}}, grid:{display:false} }
      }}
  });
}

const REG = { b0: -0.04, b1: 0.19, b2: -0.82, b3: -0.021 };

function updateSimulator() {
  const nli  = parseFloat(document.getElementById('nli-slider').value);
  const vol  = parseFloat(document.getElementById('vol-slider').value);
  const size = parseFloat(document.getElementById('size-slider').value);
  document.getElementById('nli-val').textContent  = nli.toFixed(1);
  document.getElementById('vol-val').textContent  = vol.toFixed(3);
  document.getElementById('size-val').textContent = size.toFixed(1);
  const dm = REG.b0 + REG.b1*nli + REG.b2*vol + REG.b3*size;
  const winner = dm > 0.05 ? '🤖 Chronos Wins' : dm < -0.05 ? '📐 ARIMA Wins' : '🤝 Tied';
  const cls = nli > 1.96 ? '⚡ Hypercompetitive' : '🛡️ Linear Persistence';
  document.getElementById('sim-output').innerHTML = `
    <div class="stat-box"><div class="stat-value" style="font-size:20px;color:${dm>0?'#10b981':dm<0?'#ef4444':'#94a3b8'}">${dm.toFixed(3)}</div><div class="stat-label">Predicted ΔMASE</div></div>
    <div class="stat-box"><div class="stat-value" style="font-size:15px">${winner}</div><div class="stat-label">Tournament Result</div></div>
    <div class="stat-box"><div class="stat-value" style="font-size:13px;line-height:1.3">${cls}</div><div class="stat-label">NLI Classification</div></div>`;
  const nliRange = Array.from({length:61},(_,i)=>i*0.1);
  const pred = nliRange.map(n => REG.b0+REG.b1*n+REG.b2*vol+REG.b3*size);
  if (state.charts.sim) state.charts.sim.destroy();
  state.charts.sim = new Chart(document.getElementById('simChart').getContext('2d'), {
    type: 'line',
    data: { labels: nliRange.map(n=>n.toFixed(1)), datasets: [
      { label:'Predicted ΔMASE', data:pred, borderColor:'#06b6d4', borderWidth:2, pointRadius:0, tension:0.4 },
      { label:'Zero line',       data:nliRange.map(()=>0), borderColor:'rgba(255,255,255,0.15)', borderWidth:1, borderDash:[5,4], pointRadius:0 },
      { label:'Current NLI',     data:nliRange.map((n,i)=>Math.abs(n-nli)<0.06?dm:null),
        borderColor:'#f59e0b', borderWidth:0, pointRadius:nliRange.map(n=>Math.abs(n-nli)<0.06?9:0), pointBackgroundColor:'#f59e0b' }
    ]},
    options: { responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{labels:{color:'#94a3b8',font:{size:11}}}, tooltip:{callbacks:{label:c=>`ΔMASE: ${c.parsed.y?.toFixed(3)}`}} },
      scales:{
        x:{title:{display:true,text:'NLI Score',color:'#64748b',font:{size:11}},ticks:{color:'#64748b',maxTicksLimit:10,font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},
        y:{title:{display:true,text:'Predicted ΔMASE',color:'#64748b',font:{size:11}},ticks:{color:'#64748b',font:{size:10}},grid:{color:'rgba(255,255,255,0.06)'}}
      }}
  });
}

function updateDistChart() {
  const sector = document.getElementById('dist-sector').value;
  const rows = state.firmData.filter(r => r.Sector_clean === sector && r.ROA_w != null);
  if (!rows.length) return;
  const vals = rows.map(r=>r.ROA_w).sort((a,b)=>a-b);
  const mn=vals.reduce((a,b)=>a+b,0)/vals.length;
  const mx_=Math.max(...vals), mn_=Math.min(...vals);
  const binCount=30, bw=(mx_-mn_)/binCount;
  const bins = Array.from({length:binCount},(_,i)=>({x:mn_+bw*(i+0.5),count:0}));
  vals.forEach(v=>{ const i=Math.min(Math.floor((v-mn_)/bw),binCount-1); bins[i].count++; });
  if (state.charts.dist) state.charts.dist.destroy();
  state.charts.dist = new Chart(document.getElementById('distChart').getContext('2d'), {
    type:'bar',
    data:{labels:bins.map(b=>b.x.toFixed(3)),datasets:[{label:'Frequency',data:bins.map(b=>b.count),backgroundColor:'rgba(59,130,246,0.6)',borderRadius:2}]},
    options:{responsive:true,maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:'#64748b',maxTicksLimit:10,font:{size:10}},grid:{display:false}},
        y:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},
      }}
  });
}

function drawWinsChart() {
  const el = document.getElementById('winsChart');
  if (!el || !state.firmData.length) return;
  const vals = state.firmData.map(r=>r.ROA_w).filter(v=>v!=null);
  const mn_=-0.08, mx_=0.12, binCount=40, bw=(mx_-mn_)/binCount;
  const bins = Array.from({length:binCount},(_,i)=>({x:mn_+bw*(i+0.5),count:0}));
  vals.forEach(v=>{ const cl=Math.max(mn_,Math.min(mx_,v)); const i=Math.min(Math.floor((cl-mn_)/bw),binCount-1); bins[i].count++; });
  if (state.charts.wins) state.charts.wins.destroy();
  state.charts.wins = new Chart(el.getContext('2d'), {
    type:'bar',
    data:{labels:bins.map(b=>b.x.toFixed(3)),datasets:[{label:'ROA freq',data:bins.map(b=>b.count),backgroundColor:'rgba(59,130,246,0.65)',borderRadius:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{ticks:{color:'#64748b',maxTicksLimit:10,font:{size:10}},grid:{display:false}},y:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}}}}
  });
}

// ─── QUIZ ENGINE ──────────────────────────────────────────────────
const QUIZ_DATA = {};

function quizBlock(moduleId, questions) {
  questions.forEach((q, qi) => {
    QUIZ_DATA[`${moduleId}-${qi}`] = q;
  });
  return `<div class="quiz-section">
    <div class="quiz-title">🎓 Knowledge Check — Module ${moduleId}</div>
    ${questions.map((q,qi) => `
      <div class="quiz-question" id="quiz-m${moduleId}-q${qi}">
        <p class="quiz-q-text">${qi+1}. ${q.q}</p>
        <div class="quiz-options">
          ${q.opts.map((opt,oi) => `
            <button class="quiz-option" id="quiz-opt-${moduleId}-${qi}-${oi}"
              onclick="answerQuiz(${moduleId},${qi},${oi})"
            >${String.fromCharCode(65+oi)}. ${opt}</button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-fb-m${moduleId}-q${qi}"></div>
      </div>`).join('')}
  </div>`;
}

function answerQuiz(mod, qi, selected) {
  const q         = QUIZ_DATA[`${mod}-${qi}`];
  const container = document.getElementById(`quiz-m${mod}-q${qi}`);
  const buttons   = container.querySelectorAll('.quiz-option');
  const feedback  = document.getElementById(`quiz-fb-m${mod}-q${qi}`);
  const correct   = q.correct;
  const wf        = q.wf || [];
  buttons.forEach((btn,i) => {
    btn.disabled = true;
    btn.classList.remove('correct','wrong','neutral');
    if (i === correct) btn.classList.add('correct');
    else if (i === selected) btn.classList.add('wrong');
    else btn.classList.add('neutral');
  });
  const isCorrect = selected === correct;
  const wrongExpl = (!isCorrect && wf[selected]) ?
    `<div class="wrong-why">❌ <strong>Why this is incorrect:</strong> ${wf[selected]}</div>` : '';
  const rightExpl =
    `<div class="${isCorrect ? 'correct-why' : 'correct-reveal'}">✅ <strong>${isCorrect ? 'Correct! ' : 'Correct answer: '}</strong>${q.fb}</div>`;
  feedback.innerHTML = wrongExpl + rightExpl;
  feedback.className = `quiz-feedback show ${isCorrect ? 'correct-fb' : 'wrong-fb'}`;
}

function closeQuiz() { document.getElementById('quiz-modal').classList.add('hidden'); }

// Post-render hook for Module 2 winsorization chart
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(() => {
    if (document.getElementById('winsChart')) { drawWinsChart(); }
  });
  const area = document.getElementById('content-area');
  if (area) observer.observe(area, { childList: true, subtree: true });
});

// ─── STATISTICAL ENGINE (Flask backend) ────────────────────────────

async function runAnalysis() {
  const gvkey = parseInt(document.getElementById('firm-select')?.value);
  if (!gvkey) return;

  const btnA = document.getElementById('btn-analyze');
  const spinner = document.getElementById('analysis-spinner');
  const resultsEl = document.getElementById('analysis-results');

  btnA.disabled = true;
  btnA.textContent = '⏳ Running…';
  spinner.style.display = 'flex';
  resultsEl.innerHTML = '';

  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gvkey })
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    renderAnalysisResults(data);
    state.lastAnalysis = data;
    const btnF = document.getElementById('btn-forecast');
    if (btnF) btnF.disabled = false;
  } catch (e) {
    resultsEl.innerHTML = `
      <div class="callout warning">
        <strong>⚠️ Analysis failed:</strong> ${e.message}<br>
        <small>Make sure the Flask server is running: <code>source venv/bin/activate && python server.py</code></small>
      </div>`;
  } finally {
    spinner.style.display = 'none';
    btnA.disabled = false;
    btnA.textContent = '⚙️ Run Filter-Then-Test Analysis';
  }
}

function renderAnalysisResults(d) {
  const badge = (pass, yes, no) =>
    `<span class="badge ${pass ? 'badge-pass' : 'badge-fail'}">${pass ? yes : no}</span>`;
  const nliColor = d.bds.is_complex ? '#ef4444' : '#10b981';
  const nliLabel = d.bds.is_complex ? '⚡ Is_Complex = TRUE — Hypercompetitive' : '🛡️ Is_Complex = FALSE — Linear Persistence';
  const nliClass = d.bds.is_complex ? 'badge-complex' : 'badge-linear';

  document.getElementById('analysis-results').innerHTML = `
<div class="pipeline-results">

  <div class="pipe-result-step">
    <div class="step-badge">1</div>
    <div class="step-body-r">
      <div class="step-label-r">Stationarity Tests (ADF + KPSS)</div>
      <div class="test-row">
        <span>ADF: stat=${d.adf.stat.toFixed(3)}, p=${d.adf.pvalue.toFixed(4)}</span>
        ${badge(d.adf.stationary, 'Stationary ✓', 'Non-stationary → d=1')}
      </div>
      <div class="test-row">
        <span>KPSS: stat=${d.kpss.stat.toFixed(3)}, p=${d.kpss.pvalue.toFixed(4)}</span>
        ${badge(d.kpss.stationary, 'Stationary ✓', 'Non-stationary')}
      </div>
      <div class="test-note">Selected differencing order: <strong>d = ${d.d_order}</strong></div>
    </div>
  </div>

  <div class="pipe-result-step">
    <div class="step-badge">2</div>
    <div class="step-body-r">
      <div class="step-label-r">Auto-ARIMA (AICc grid search, p≤4, q≤4)</div>
      <div class="test-row">
        <span>Best model: <strong style="color:var(--accent-blue)">ARIMA(${d.arima_order[0]},${d.arima_order[1]},${d.arima_order[2]})</strong></span>
        <span style="color:var(--text-secondary);font-size:12px">AICc = ${d.aicc.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="pipe-result-step">
    <div class="step-badge">3</div>
    <div class="step-body-r">
      <div class="step-label-r">Ljung-Box Whiteness Test (Gatekeeper)</div>
      <div class="test-row">
        <span>LB(10): stat=${d.ljung_box.stat.toFixed(3)}, p=${d.ljung_box.pvalue.toFixed(4)}</span>
        ${badge(d.ljung_box.pass, 'WHITE NOISE ✓ — proceed to BDS', 'FAIL — residuals not white')}
      </div>
    </div>
  </div>

  <div class="pipe-result-step">
    <div class="step-badge nli">NLI</div>
    <div class="step-body-r">
      <div class="step-label-r">BDS Test → Non-Linearity Index</div>
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:8px">
        <div style="text-align:center">
          <div style="font-size:52px;font-weight:800;color:${nliColor};line-height:1">${d.bds.nli.toFixed(2)}</div>
          <div style="font-size:11px;color:var(--text-secondary)">BDS z-stat (m=2)</div>
        </div>
        <div>
          <div class="test-note" style="margin-bottom:8px">p-value: ${d.bds.pvalue.toFixed(4)} &nbsp;|&nbsp; Threshold: 1.96</div>
          <span class="badge ${nliClass}" style="font-size:13px;padding:8px 16px">${nliLabel}</span>
          <div class="test-note" style="margin-top:10px">
            Naive MAE baseline: <strong>${d.naive_mae.toFixed(6)}</strong> &nbsp;|&nbsp; n = ${d.n} quarters
          </div>
        </div>
      </div>
    </div>
  </div>

</div>`;
}

async function runForecast() {
  const gvkey = parseInt(document.getElementById('firm-select')?.value);
  if (!gvkey) return;

  const btnF = document.getElementById('btn-forecast');
  btnF.disabled = true;
  btnF.textContent = '⏳ Forecasting…';

  try {
    const resp = await fetch('/api/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gvkey, horizon: 8 })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    overlayForecastOnChart(data);
  } catch (e) {
    const el = document.getElementById('analysis-results');
    if (el) el.insertAdjacentHTML('beforeend', `
      <div class="callout warning" style="margin-top:12px">
        <strong>Forecast failed:</strong> ${e.message}
      </div>`);
  } finally {
    btnF.disabled = false;
    btnF.textContent = '📈 Forecast 8 Quarters';
  }
}

function overlayForecastOnChart(fc) {
  const chart = state.charts.firm;
  if (!chart) return;

  // Remove any previous forecast datasets (label starts with 'ARIMA Forecast')
  chart.data.datasets = chart.data.datasets.filter(d => !d._isForecast);

  const histLen = chart.data.labels.length;
  const nFc = fc.labels.length;

  // Extend labels with forecast quarters
  chart.data.labels.push(...fc.labels);

  // Pad historical datasets with nulls
  chart.data.datasets.forEach(ds => {
    while (ds.data.length < histLen + nFc) ds.data.push(null);
  });

  const pad = Array(histLen).fill(null);

  chart.data.datasets.push(
    {
      _isForecast: true,
      label: `ARIMA(${(fc.arima_order||[]).join(',')}) Forecast`,
      data: [...pad, ...fc.point],
      borderColor: '#f59e0b', borderWidth: 2.5, borderDash: [6,3],
      pointRadius: 5, pointBackgroundColor: '#f59e0b', tension: 0.3, fill: false
    },
    {
      _isForecast: true,
      label: '80% CI Upper',
      data: [...pad, ...fc.upper],
      borderColor: 'rgba(245,158,11,0.25)', borderWidth: 1, pointRadius: 0,
      fill: false, tension: 0.3
    },
    {
      _isForecast: true,
      label: '80% CI Lower',
      data: [...pad, ...fc.lower],
      borderColor: 'rgba(245,158,11,0.25)', borderWidth: 1, pointRadius: 0,
      fill: '-1', backgroundColor: 'rgba(245,158,11,0.10)', tension: 0.3
    }
  );

  chart.update();
  // Scroll to firmly chart
  document.getElementById('firmChart')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

