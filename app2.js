/* ═══════════════════════════════════════════════════════════════
   app2.js — Modules 2 & 3 (expanded with real-data exercises)
   ═══════════════════════════════════════════════════════════════ */

// ─── MODULE 2: DATA ACQUISITION ───────────────────────────────────
function m2() {
  return `
<div class="module-header">
  <div class="module-tag">Module 2</div>
  <h2 class="module-title">Data Acquisition &amp; Preparation</h2>
  <p class="module-subtitle">From a raw financial database to a clean, analysis-ready panel dataset. Every decision here protects the scientific validity of every downstream analysis.</p>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🎯</span> Learning Objectives</div>
  <ul class="objectives-list">
    <li>Describe S&P Compustat and explain why the <em>fundq</em> table is the correct source for this study.</li>
    <li>Write the SQL query that extracts a quarterly firm-performance panel from WRDS.</li>
    <li>Distinguish between survivorship bias and how censoring (vs. splicing) addresses it.</li>
    <li>Define winsorization mathematically and explain why it preserves the complexity signal better than trimming.</li>
    <li>Harmonize fiscal quarters to calendar quarters and enforce the minimum observation requirement.</li>
    <li>Compute ROA and ROE from raw Compustat fields and identify when ROE must be excluded.</li>
  </ul>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🗄️</span> The Database: S&P Compustat via WRDS</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:16px">
    <strong>WRDS (Wharton Research Data Services)</strong> is the standard research data platform used by virtually every top business school. Our raw data comes from the <strong>Compustat Fundamentals Quarterly</strong> table — one row per firm per fiscal quarter, containing balance sheet, income statement, and cash flow items as reported to the SEC.
  </p>
  <div class="callout info"><strong>Why quarterly, not annual?</strong> Annual data gives only ~10 observations per decade per firm — far too few for ARIMA or nonlinearity testing. Quarterly data provides 40 observations over the same period, crossing the minimum statistical threshold. This is why we use <code>fundq</code> (quarterly) rather than <code>funda</code> (annual).</div>
  <div class="section-label">Key Fields Extracted</div>
  <table class="data-table">
    <thead><tr><th>Compustat Field</th><th>Economic Meaning</th><th>Role in Study</th></tr></thead>
    <tbody>
      <tr><td>gvkey</td><td>Global Company Key</td><td>Primary firm identifier — unique across all Compustat history</td></tr>
      <tr><td>datadate</td><td>Report date (balance sheet date)</td><td>Time index — maps to calendar quarter</td></tr>
      <tr><td>fqtr</td><td>Fiscal quarter (1–4)</td><td>Seasonality indicator; used in harmonization</td></tr>
      <tr><td>fyearq</td><td>Fiscal year</td><td>Cross-validation of dating</td></tr>
      <tr><td>NIQ</td><td>Net Income (quarterly, $M)</td><td>ROA numerator</td></tr>
      <tr><td>ATQ</td><td>Total Assets (quarterly, $M)</td><td>ROA denominator; log transform = Size control</td></tr>
      <tr><td>SEQQ</td><td>Stockholders' Equity (quarterly, $M)</td><td>ROE denominator — excluded when ≤ 0</td></tr>
      <tr><td>NAICS</td><td>6-digit industry code</td><td>Industry Fixed Effects in regression</td></tr>
    </tbody>
  </table>
  <pre><code><span class="code-cm">-- WRDS SQL: extract quarterly firm performance panel</span>
<span class="code-kw">SELECT</span>
    a.gvkey, a.datadate, a.fqtr, a.fyearq,
    a.conm,                          <span class="code-cm">-- company name</span>
    a.tic,                           <span class="code-cm">-- ticker symbol</span>
    a.naicsq     <span class="code-kw">AS</span> naics,
    a.sic,
    a.NIQ, a.ATQ, a.SEQQ,
    a.DLRSN                          <span class="code-cm">-- deletion reason (M&A, bankruptcy, etc.)</span>
<span class="code-kw">FROM</span> comp.fundq a
<span class="code-kw">WHERE</span>  a.datafmt  = <span class="code-str">'STD'</span>           <span class="code-cm">-- standardized format (not 'as-reported')</span>
  <span class="code-kw">AND</span>  a.indfmt   = <span class="code-str">'INDL'</span>          <span class="code-cm">-- industrial (not financial statement format)</span>
  <span class="code-kw">AND</span>  a.consol   = <span class="code-str">'C'</span>             <span class="code-cm">-- consolidated statements only</span>
  <span class="code-kw">AND</span>  a.popsrc   = <span class="code-str">'D'</span>             <span class="code-cm">-- domestic (US-listed)</span>
  <span class="code-kw">AND</span>  a.curcdq   = <span class="code-str">'USD'</span>           <span class="code-cm">-- USD-denominated</span>
  <span class="code-kw">AND</span>  a.ATQ      > <span class="code-num">0</span>              <span class="code-cm">-- positive assets (exclude shells)</span>
  <span class="code-kw">AND</span>  a.NIQ      <span class="code-kw">IS NOT NULL</span>
  <span class="code-kw">AND</span>  a.datadate <span class="code-kw">BETWEEN</span> <span class="code-str">'2014-01-01'</span> <span class="code-kw">AND</span> <span class="code-str">'2024-12-31'</span>
<span class="code-kw">ORDER BY</span> a.gvkey, a.datadate;</code></pre>
  <div class="callout warning"><strong>Critical filter — <code>datafmt='STD'</code>:</strong> Without this, Compustat returns both the standardized and "as-reported" versions of each row, doubling your observation count with duplicates. This single omission is one of the most common Compustat errors in published research.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📐</span> Computing ROA and ROE</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    Both metrics are constructed from extracted fields. Note the <strong>lag structure</strong> for ROA — using contemporaneous assets creates a mechanical correlation between the numerator and denominator that can bias estimates.
  </p>
  <div class="formula">ROA_t = NIQ_t / ATQ_{t-1}  &nbsp; (Net Income ÷ Beginning-of-Quarter Assets)</div>
  <div class="formula">ROE_t = NIQ_t / SEQQ_{t-1}, &nbsp; only if SEQQ_{t-1} > 0</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 ROA &amp; ROE Components</div>
    <div class="eq-row"><div class="eq-sym">ROA_t</div><div class="eq-def"><strong>Return on Assets in quarter t</strong> — the primary dependent variable in this study. Measures how efficiently management converts every dollar of the asset base into quarterly profit</div></div>
    <div class="eq-row"><div class="eq-sym">NIQ_t</div><div class="eq-def"><strong>Compustat field: Net Income (quarterly)</strong> — in millions of dollars. After-tax earnings, including extraordinary items and one-time charges</div></div>
    <div class="eq-row"><div class="eq-sym">ATQ_{t-1}</div><div class="eq-def"><strong>Lagged Total Assets</strong> — assets from the <em>prior</em> quarter-end. The one-quarter lag prevents mechanical correlation: if a firm borrows cash to buy new assets (raising both NIQ potential and ATQ at the same time), using contemporaneous ATQ creates a spurious denominator effect</div></div>
    <div class="eq-row"><div class="eq-sym">SEQQ_{t-1}</div><div class="eq-def"><strong>Lagged Stockholders’ Equity</strong> — same lag rationale as ATQ. ROE is <em>conditionally excluded</em> when SEQQ≤0: division by negative equity produces a positive ROE for loss-making firms (e.g. airlines post-COVID), which is economically meaningless and creates extreme outliers</div></div>
    <div class="eq-row"><div class="eq-sym">Why ROA, not ROE?</div><div class="eq-def">ROA captures total capital productivity (debt + equity). ROE also varies with financial leverage — two firms with identical operations look different if one uses more debt financing. ROA gives the cleaner, leverage-neutral view of operational dynamics we seek to forecast</div></div>
  </div>
  <pre><code>df = df.<span class="code-fn">sort_values</span>([<span class="code-str">'gvkey'</span>, <span class="code-str">'datadate'</span>])

<span class="code-cm"># Lagged assets (within-firm)</span>
df[<span class="code-str">'ATQ_lag'</span>] = df.<span class="code-fn">groupby</span>(<span class="code-str">'gvkey'</span>)[<span class="code-str">'ATQ'</span>].<span class="code-fn">shift</span>(<span class="code-num">1</span>)

<span class="code-cm"># ROA: net income / lagged assets</span>
df[<span class="code-str">'ROA'</span>] = df[<span class="code-str">'NIQ'</span>] / df[<span class="code-str">'ATQ_lag'</span>]

<span class="code-cm"># ROE: only when lagged equity is positive</span>
df[<span class="code-str">'SEQQ_lag'</span>] = df.<span class="code-fn">groupby</span>(<span class="code-str">'gvkey'</span>)[<span class="code-str">'SEQQ'</span>].<span class="code-fn">shift</span>(<span class="code-num">1</span>)
df[<span class="code-str">'ROE'</span>] = <span class="code-kw">None</span>
mask = df[<span class="code-str">'SEQQ_lag'</span>] > <span class="code-num">0</span>
df.<span class="code-fn">loc</span>[mask, <span class="code-str">'ROE'</span>] = df.<span class="code-fn">loc</span>[mask, <span class="code-str">'NIQ'</span>] / df.<span class="code-fn">loc</span>[mask, <span class="code-str">'SEQQ_lag'</span>]</code></pre>
</div>

<div class="card">
  <div class="card-title"><span class="icon">⚠️</span> Survivorship Bias — The Silent Destroyer of Research Validity</div>
  <div class="analogy">
    <strong>Analogy:</strong> During WWII, analysts studied returning bombers and proposed adding armor wherever they found bullet holes. Statistician Abraham Wald pointed out the fatal flaw: <em>the planes that didn't return had been shot in the places without bullet holes.</em> They were studying survivors only. The same error infects financial research that includes only firms present for the entire sample period.
  </div>
  <div class="section-label">What Survivorship Bias Does to Our Estimates</div>
  <table class="data-table">
    <thead><tr><th>Effect</th><th>Direction</th><th>Impact on Study</th></tr></thead>
    <tbody>
      <tr><td>Mean ROA</td><td>⬆️ Inflated</td><td>Surviving firms are systematically more profitable — we'd overestimate normal profitability</td></tr>
      <tr><td>ROA Volatility</td><td>⬇️ Deflated</td><td>Highly volatile firms often exit (acquisition, bankruptcy) — we'd undercount hypercompetitive firms</td></tr>
      <tr><td>NLI Distribution</td><td>Truncated (right)</td><td>The very firms most likely to test H1 (High-NLI) are the ones that exit most often</td></tr>
    </tbody>
  </table>
  <div class="section-label">The Censoring Solution</div>
  <div class="theory-grid">
    <div class="theory-card rbv">
      <h3 style="color:var(--accent-green)">✓ Censoring (Used Here)</h3>
      <p>Include a firm for <em>every quarter it was active</em>, then stop when it exits. A firm acquired in 2019 contributes Q1 2014 – Q4 2018, then the series ends. Creates an unbalanced panel but preserves data integrity.</p>
      <pre style="margin-top:8px;padding:10px;font-size:11px"><code><span class="code-cm"># Filter M&A targets using Compustat DLRSN code</span>
<span class="code-cm"># DLRSN=01 = merger/acquisition target</span>
ma_targets = df[df[<span class="code-str">'dlrsn'</span>]==<span class="code-str">'01'</span>][<span class="code-str">'gvkey'</span>].<span class="code-fn">unique</span>()
df = df[~df[<span class="code-str">'gvkey'</span>].<span class="code-fn">isin</span>(ma_targets)]</code></pre>
    </div>
    <div class="theory-card hyper" style="opacity:0.7">
      <h3>✗ Splicing (Not Used)</h3>
      <p>When a firm exits, substitute a replacement firm to maintain a balanced panel. This is methodologically indefensible: the merged series represents two different economic entities — any "pattern" spanning the splice is fictional.</p>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🎛️</span> Winsorization — Cap, Don't Cut</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    Raw ROA in Compustat can range from −500 to +400 (extreme cases). These are not data errors — they represent real biotech firms with near-zero assets, stressed firms in distress, and legitimate outlier quarters. Simply deleting them reintroduces survivorship bias and removes the very hypercompetitive outliers we're studying.
  </p>
  <div class="formula">x_winsorized = max(P1, min(x, P99))</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 Winsorization Formula Components</div>
    <div class="eq-row"><div class="eq-sym">x</div><div class="eq-def"><strong>Raw ROA value</strong> for a given firm-quarter. May range from −484 to +397 in the full Compustat universe without filtering — dominated by near-zero-asset firms</div></div>
    <div class="eq-row"><div class="eq-sym">P1</div><div class="eq-def"><strong>1st percentile of the full cross-sectional ROA distribution</strong> — in our dataset, P1 = −0.0584. Any firm-quarter with ROA below this is <em>capped at</em> −0.0584. The firm stays in the sample; only its extreme value is bounded</div></div>
    <div class="eq-row"><div class="eq-sym">P99</div><div class="eq-def"><strong>99th percentile of the full cross-sectional ROA distribution</strong> — in our dataset, P99 = +0.0584. Extreme profitable quarters (often biotech spikes) are capped at this value</div></div>
    <div class="eq-row"><div class="eq-sym">min(x, P99)</div><div class="eq-def">First, if x is above P99, replace it with P99. This caps the upper tail</div></div>
    <div class="eq-row"><div class="eq-sym">max(P1, …)</div><div class="eq-def">Then, if the resulting value is still below P1, replace it with P1. This caps the lower tail. The composition of the two operations gives the symmetric clamp</div></div>
    <div class="eq-row"><div class="eq-sym">Why not trim?</div><div class="eq-def">Trimming <em>removes</em> the row entirely. Winsorizing <em>replaces</em> the value. Trimming would remove high-volatility firms' worst quarters — biasing the sample toward stable, RBV-like firms and suppressing the very complexity signal we’re trying to detect</div></div>
  </div>
  <div class="section-label">Real Dataset Statistics (Our Sample)</div>
  <table class="data-table">
    <thead><tr><th>Statistic</th><th>Raw ROA</th><th>Winsorized ROA</th></tr></thead>
    <tbody>
      <tr><td>Minimum</td><td>−483.57</td><td>−0.058 (1st pctile)</td></tr>
      <tr><td>Maximum</td><td>+396.86</td><td>+0.058 (99th pctile)</td></tr>
      <tr><td>Mean</td><td>−0.00996</td><td>+0.0080</td></tr>
      <tr><td>Observations removed</td><td>—</td><td><strong>0 (all firms kept)</strong></td></tr>
    </tbody>
  </table>
  <div class="callout success"><strong>Why winsorize, not trim:</strong> Trimming permanently removes the firm from that quarter's analysis. Winsorization keeps the firm — just with a capped value. The firm's <em>structural pattern</em> (the sequence of ups and downs that determines NLI) is preserved.</div>
  <pre><code><span class="code-kw">def</span> <span class="code-fn">winsorize_by_group</span>(df, col, lower=<span class="code-num">0.01</span>, upper=<span class="code-num">0.99</span>):
    <span class="code-str">"""Winsorize within the full cross-section, not per-firm."""</span>
    lo = df[col].<span class="code-fn">quantile</span>(lower)
    hi = df[col].<span class="code-fn">quantile</span>(upper)
    df[col + <span class="code-str">'_w'</span>] = df[col].<span class="code-fn">clip</span>(lower=lo, upper=hi)
    <span class="code-fn">print</span>(<span class="code-str">f"Winsorized {col}: [{lo:.4f}, {hi:.4f}]"</span>)
    <span class="code-kw">return</span> df

df = <span class="code-fn">winsorize_by_group</span>(df, <span class="code-str">'ROA'</span>)
<span class="code-cm"># Output: Winsorized ROA: [-0.0584, 0.0584]</span></code></pre>
  <div class="chart-wrap" style="height:240px"><canvas id="winsChart"></canvas></div>
  <p class="chart-label">ROA distribution across all 9,000 sample observations — note the characteristic right-skew in firm profitability</p>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📅</span> Time-Index Harmonization &amp; Minimum Observations</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    <strong>The fiscal vs. calendar quarter problem:</strong> Apple's fiscal Q1 ends in December; Walmart's fiscal Q1 ends in April. If we align by fiscal quarter, firms' "Q1" values represent different seasonal windows — destroying cross-sectional comparability for macro events (COVID-19 shock, 2022 rate hike cycle, etc.).
  </p>
  <pre><code><span class="code-kw">import</span> pandas <span class="code-kw">as</span> pd

<span class="code-cm"># Convert datadate to calendar quarter</span>
df[<span class="code-str">'datadate'</span>] = pd.<span class="code-fn">to_datetime</span>(df[<span class="code-str">'datadate'</span>])
df[<span class="code-str">'cal_quarter'</span>] = df[<span class="code-str">'datadate'</span>].<span class="code-fn">dt.to_period</span>(<span class="code-str">'Q'</span>)

<span class="code-cm"># Enforce minimum observations (20 quarters = 5 years)</span>
obs_count = df.<span class="code-fn">groupby</span>(<span class="code-str">'gvkey'</span>)[<span class="code-str">'ROA_w'</span>].<span class="code-fn">count</span>()
eligible = obs_count[obs_count >= <span class="code-num">20</span>].<span class="code-fn">index</span>
df = df[df[<span class="code-str">'gvkey'</span>].<span class="code-fn">isin</span>(eligible)]
<span class="code-fn">print</span>(<span class="code-str">f"Firms after obs filter: {df['gvkey'].nunique():,}"</span>)</code></pre>
  <div class="callout info"><strong>Why 20 quarters minimum?</strong> The BDS nonlinearity test requires at least 50 observations for reliable z-scores — but our embedding dimension analysis shows the test stabilizes at ~20 quarters when combined with the ARIMA pre-filter step. This is the threshold validated in Brock, Dechert &amp; Scheinkman (1996).</div>
</div>

<div class="card" style="border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.04)">
  <div class="card-title"><span class="icon">📋</span> Exercise 2A — Data Preparation Decision Tree</div>
  <p style="color:var(--text-secondary);font-size:13.5px;line-height:1.7;margin-bottom:16px">
    Using the real Compustat data in this study, work through each decision. Refer to the Data Explorer for actual firm statistics.
  </p>
  <div class="step-list">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-body">
        <h4>Unit Verification</h4>
        <p>JPMorgan Chase (gvkey 60667) reports ATQ = $3.9 trillion. Compustat stores in millions. What raw ATQ value appears in the database? What is JPMorgan's quarterly ROA if NIQ = $13.4B?</p>
        <div class="exercise-input" style="margin-top:12px;">
          <textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br>
          <button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button>
          <div class="callout success" style="margin-top:12px; display:none;">ATQ = 3,900,000 (in $M). NIQ = 13,400 (in $M). ROA = 13,400 / 3,900,000 = <strong>0.00344</strong> — consistent with JPMorgan's actual mean ROA of 0.0026 in our dataset.</div>
        </div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-body">
        <h4>Winsorization Boundary</h4>
        <p>Our 1st/99th percentile winsorization caps ROA at [−0.0584, +0.0584]. AMETEK INC has a mean ROA of 0.0225. Cleveland-Cliffs has mean ROA of 0.0014. Which firm is more affected by winsorization? What does this tell you about Cleveland-Cliffs' complexity?</p>
        <div class="exercise-input" style="margin-top:12px;">
          <textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br>
          <button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button>
          <div class="callout success" style="margin-top:12px; display:none;">Cleveland-Cliffs is far more affected — its SD of 0.0825 means it regularly hits the ±0.0584 cap. AMETEK's SD of 0.0025 means it rarely approaches the boundary. Cleveland-Cliffs' high volatility relative to its mean suggests significant complexity and high NLI — it's a hypercompetitive commodities firm.</div>
        </div>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-body">
        <h4>Survivorship Bias Check</h4>
        <p>You are building a panel of S&P 500 firms from 2014–2024. You pull <em>all firms currently in the S&P 500 as of January 2024</em>. Identify two specific ways this creates survivorship bias in measuring ROA and NLI.</p>
        <div class="exercise-input" style="margin-top:12px;">
          <textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br>
          <button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button>
          <div class="callout success" style="margin-top:12px; display:none;">(1) <strong>Mean ROA inflated:</strong> All firms currently in S&P 500 survived a decade of selection — you've excluded any firm that was removed for poor performance, inflating average ROA. (2) <strong>NLI truncated:</strong> Highly volatile (hypercompetitive) firms are more likely to have been removed from the index — your High-NLI subsample is systematically depleted, making H1 harder to confirm.</div>
        </div>
      </div>
    </div>
  </div>
</div>

${quizBlock(2, [{"q": "A researcher pulls Compustat data with only the WHERE clause `fqtr IS NOT NULL` — deliberately omitting the `datafmt='STD'` filter. What is the most likely consequence for the research dataset?", "opts": ["The query returns zero rows because both formats are required simultaneously", "The dataset approximately doubles in size, with each firm-quarter appearing as both a standardized ('STD') and as-reported ('RESTATED' or 'MERGED') row — creating phantom duplicates that corrupt the panel structure", "Only international firms are excluded from results; domestic firm data is unaffected", "ROA values are reported in a different currency, requiring manual conversion"], "correct": 1, "fb": "Understanding data format flags is essential before touching any Compustat query. Compustat stores every filing in two (or more) formats: (1) 'STD' — standardized, where the financial data is mapped to a consistent definitional framework across all firms and time periods, allowing true apples-to-apples comparisons; and (2) as-reported formats like 'RESTATED' or 'MERGED' — which may contain raw filed values before standardization adjustments. When you query without the datafmt='STD' restriction, you receive ALL available format variants for each firm-quarter. Since most firm-quarters have at least two format entries, the dataset roughly DOUBLES in size. The statistical consequences are severe: every ARIMA model would now see firm-quarter 2015Q3 TWICE (once standardized, once as-reported), creating artificial autocorrelation signals. Every NLI calculation would be invalidated because the 'time series' is no longer monotonically ordered observations — it's a scrambled mix of two different representations. The fundamental rule: always filter to datafmt='STD' AND indfmt='INDL' (industrial format) AND curcdq='USD' as your first three WHERE constraints. These three filters together ensure you're working with a clean, standardized, single-currency panel.", "wf": ["Removing the datafmt filter does NOT reduce rows — it significantly INCREASES them. The filter is a restriction that narrows the result set. Omitting it expands the results by including multiple format variants. If a query with the filter returns 100,000 rows, the same query without it might return 180,000–220,000 rows.", "", "The datafmt flag applies uniformly to ALL firms — domestic, international, large, small, regardless of geography. It is a formatting/standardization flag with no relationship to firm nationality. International firms would be excluded by the curcdq='USD' filter (which limits to US dollar-denominated reporting), not by datafmt.", "Currency denomination is controlled by a completely separate field: curcdq (currency code for quarterly data). datafmt controls whether you get standardized or raw-format accounting values in the SAME currency. Setting curcdq='USD' ensures dollar-denominated reporting regardless of what datafmt is set to."]}, {"q": "American Airlines Group has mean quarterly ROA = −0.00014 and SD = 0.02185 (CV ≈ 156). AMETEK Inc has mean ROA = 0.02254 and SD = 0.0025 (CV ≈ 11). Based purely on this summary, which firm would the Filter-Then-Test protocol most likely classify as a High-NLI (hypercompetitive) firm, and why?", "opts": ["AMETEK — higher mean ROA means more predictable performance, generating cleaner ARIMA residuals", "American Airlines — its near-zero mean combined with enormous SD creates a chaotic trajectory where the variance overwhelmingly dominates the signal, a hallmark of hypercompetitive dynamics that generate high NLI after ARIMA filtering", "Both will have the same NLI since NLI is normalized by the mean and both have similar scale", "Neither — NLI requires airline-specific seasonal decomposition before BDS can be applied"], "correct": 1, "fb": "The Coefficient of Variation (CV = SD / |mean|) is an imperfect but directionally powerful proxy for the NLI we expect from Filter-Then-Test. The intuition: if CV is enormous (like American Airlines' 156x), it means the firm's ROA swings are hundreds of times larger than its average profitability. This scale of volatility relative to the mean is characteristic of industries where exogenous macro shocks (oil prices, demand cycles, pandemic-level events, labor disputes, interest rate shifts) regularly overwhelm any stable underlying strategic position. For such firms, after ARIMA removes the best-fit linear trend and seasonal patterns, the residuals may still contain structured nonlinear dependence — because the actual drivers (commodity cycles, demand shocks) interact in nonlinear ways. AMETEK, by contrast, has tiny variance relative to its mean (CV ≈ 11). ARIMA for AMETEK will fit a gentle mean-reversion model: ROA oscillates tightly around 0.022 with small, quickly-decaying shocks. The residuals should look like white noise, and BDS will likely find NLI < 1.96. It's important to note that CV is a screening tool, not a perfect substitute for actually running the Filter-Then-Test pipeline — a firm could have high CV due to one-off events (a major acquisition, a one-time writedown) without persistent nonlinear dynamics. The full protocol is necessary for rigorous classification.", "wf": ["High mean ROA has NO direct bearing on NLI. NLI measures the structure of ARIMA residuals — whether, after removing the best linear approximation of the ROA trajectory, there is remaining temporal dependence of any kind. A firm could have mean ROA = 0.10 but wild, nonlinear swings around that mean (high NLI), or mean ROA = 0.01 with perfectly predictable linear oscillations (low NLI). The mean affects the level of profitability; NLI measures the structural complexity of how it moves over time.", "", "NLI is emphatically NOT normalized by the mean. The BDS z-score is computed from correlation integrals — which measure spatial clustering patterns in the m-dimensional embedding of the residual series. It is sensitive to the TEMPORAL STRUCTURE of the residuals, not their average magnitude. Two firms could have identical means and NLI scores of 0.5 and 4.3 respectively, depending entirely on the dynamic structure of their residuals.", "While seasonal adjustment can sometimes improve ARIMA fits for firms with pronounced quarterly seasonality, this is not a 'requirement' specific to airlines. The Hyndman-Khandakar auto.arima algorithm handles seasonal patterns if detected. More importantly, BDS works on whatever residual series ARIMA produces — the NLI classification doesn't require any industry-specific preprocessing beyond the standard ARIMA-then-BDS protocol."]}, {"q": "Why does the study apply winsorization — capping ROA at the 1st and 99th percentiles — rather than trimming (permanently deleting) observations that fall outside these bounds?", "opts": ["Winsorization is simpler to implement in Python and produces identical statistical results to trimming", "Trimming would permanently delete the most extreme firm-quarters, many of which belong to the high-volatility hypercompetitive firms most critical to testing H1b. Winsorization retains these firms in the sample with capped values, preserving both firm membership and the structural pattern of their time series.", "Winsorization produces a higher sample mean ROA, which is needed to satisfy the normality assumptions of ARIMA modeling", "Trimming is appropriate only for annual data frequency; quarterly data requires winsorization by statistical convention"], "correct": 1, "fb": "This choice has deep methodological consequences that are easy to underestimate. Consider what trimming does concretely: if ROA = −0.085 and the P1 threshold is −0.07, trimming deletes the entire firm-quarter observation row from the dataset. This affects: (1) the firm's time series — now there's a gap in Quarter T where the observation was. This gap can break the ARIMA estimation, force imputation, or create a shorter effective series. (2) The cross-sectional composition — systematically, the most extreme ROA quarters tend to belong to firms in cyclical, volatile, hypercompetitive industries: airlines in 2020, energy firms in oil price crashes, retailers during demand collapses. Trimming would disproportionately remove exactly the observations that identify the HIGH-NLI firms we need to test H1b and H2. The study would become biased toward stable, low-volatility firms — which would artificially suppress the NLI distribution and make it look like ARIMA performs well everywhere (since we'd have deleted the hardest cases). Winsorization solves this elegantly: replace −0.085 with −0.07 (P1). The observation STAYS in the dataset. The time series remains complete and unbroken. The structural pattern of 'this firm had four normal quarters, then a crisis quarter where ROA plummeted, then recovered' is preserved for ARIMA and BDS. The extreme value no longer dominates statistical calculations, but the firm's trajectory tells the right story.", "wf": ["The implementations are comparable in difficulty, but the statistical results are substantially different: winsorization retains all N observations and preserves time series continuity; trimming reduces N and creates gaps that break sequential models. This comparison is about methodological validity, not coding convenience. And importantly, comparing their statistical 'results' only makes sense after specifying what you mean — they produce identical results ONLY if no extreme observations exist, which defeats the purpose.", "", "Winsorization changes extreme values but has a complex, non-predictable effect on the mean — it raises the mean if negative extremes are more numerous, lowers it if positive extremes dominate, or has minimal effect if both tails are symmetric. This is a side-effect, not the motivation. ARIMA doesn't require normality of the DATA — it requires approximately normally distributed RESIDUALS. Winsorization is applied before any ARIMA fitting, for the purpose of data integrity, not distributional normality.", "There is no statistical convention that assigns winsorization to quarterly data and trimming to annual data. This distinction doesn't hold in practice or in the academic literature. The choice between winsorization and trimming is based on the scientific goals and the informational content of observations, not data frequency."]}, {"q": "A Compustat firm-quarter shows NIQ_t = $500M and ATQ_{t-1} = $8,000M. What is the quarterly ROA, and what would be the consequence of mistakenly using ATQ_t (contemporaneous assets) instead of ATQ_{t-1} (lagged assets)?", "opts": ["ROA = 500/8000 = 0.0625; using contemporaneous ATQ would have no material consequence since asset levels change slowly", "ROA = 8000/500 = 16.0; the formula requires dividing assets by net income", "ROA = 0.0625; using contemporaneous ATQ creates a mechanical positive correlation between numerator and denominator when firms make asset-funded investments, biasing ROA toward zero and making profitable asset growth appear as lower returns", "ROA cannot be computed without knowing SEQQ because the formula requires an equity adjustment"], "correct": 2, "fb": "The ROA calculation ROA = 0.0625 is straightforward ($500M ÷ $8,000M = 6.25% quarterly return on assets), but the lagging question is the more important methodological point. Here is the mechanical bias problem in detail: Suppose a firm takes on $2B in new debt at the end of Q3 to finance a major acquisition (increasing ATQ from $8B to $10B), and the new assets begin generating income starting Q4. If you use contemporaneous ATQ in Q4 (which now includes the new $2B), you have a denominator that's 25% larger but a numerator that may not yet fully reflect the incremental earnings from the new assets. This artificially LOWERS measured ROA for Q4, making a potentially profitable acquisition look like a performance decline. More insidiously: for firms that are actively growing through retained earnings, contemporaneous assets mechanically track current period earnings (because retained earnings from NIQ_t flow directly into ATQ_t through book value). This creates a spurious POSITIVE correlation between numerator and denominator for profitable firms and a spurious NEGATIVE correlation for loss-making firms — both artifactually shrinking the variance of ROA. The one-quarter lag breaks this mechanical link: ATQ_{t-1} reflects the asset base BEFORE this quarter's income is realized and before this quarter's investment activities affect the balance sheet.", "wf": ["Asset levels do not change slowly for all firms — this varies enormously by industry and firm strategy. A major acquisition can move ATQ by 50% in a single quarter. A large share buyback (which reduces equity and assets) can dramatically shift ATQ between consecutive quarters. And at scale, even 'slow' changes matter: the mechanical correlation between NIQ_t and ATQ_t for profitable firms (where current earnings flow into assets through retained earnings) creates a bias that is systematic and directional, not just noise. The one-quarter lag is not a minor precision refinement — it eliminates a definable source of measurement bias.", "The formula divides NET INCOME by ASSETS, never the reverse. ROA = NIQ ÷ ATQ. The result 16.0 would mean the firm earned 1,600% of its assets in a single quarter — economically impossible under any normal operating conditions. Think about the units: ROA is a dimensionless ratio representing cents earned per dollar of assets deployed. Values above ~20% (0.2) per quarter are exceptional; 16.0 would imply complete asset recovery in a single week of operation.", "", "SEQQ (stockholders' equity) is used in the ROE formula: ROE = NIQ_t / SEQQ_{t-1}. It has no role in ROA calculation. ROA is a total-capital profitability measure: it uses Total Assets (debt + equity combined) because it measures how efficiently management uses ALL capital resources, regardless of whether that capital came from bondholders or shareholders."]}, {"q": "Why does the study enforce a minimum of 20 quarterly observations per firm BEFORE computing the BDS nonlinearity test, and what risk does violating this threshold create?", "opts": ["20 quarters is the maximum Compustat provides for most active firms due to filing delays", "The BDS test requires at minimum 20 observations to compute its correlation integral with enough precision for reliable z-scores. With fewer observations, the sampling variance of the BDS statistic is so large that test outcomes become essentially random — generating both false positives (classifying linear firms as nonlinear) and false negatives at dramatically inflated rates.", "20 quarters aligns with typical business cycles (roughly 5 years), ensuring we capture at least one full economic expansion and contraction in every firm's series", "20 observations is a regulatory requirement under SEC Form 10-Q filing standards for inclusion in academic research databases"], "correct": 1, "fb": "The BDS test belongs to a class of statistics that require dense observation coverage to produce reliable estimates. Here is the technical reason: the BDS test computes something called the correlation integral — essentially, for a given tolerance ε and embedding dimension m, it counts what fraction of all possible pairs of m-length windows within the series are within distance ε of each other. With N observations at dimension m, you have approximately N·(N-1)/2 pairs to compare. At N = 10 (10 firm-quarters), m = 2: you get only about 45 pairs. The estimated correlation integral from 45 pairs has enormous sampling variance — a small number of near-coincident window values can dramatically shift the estimate. The standardized BDS z-score (which has an asymptotic standard normal distribution under the null) is not reliably standard-normal with 45 pairs. Simulation studies (see Brock et al. 1996, Appendix) show that with N < 20, the nominal 5% false-positive rate can balloon to 30%+ — meaning nearly a third of purely linear series get falsely classified as nonlinear. This would catastrophically bias NLI classification and corrupt both H1 and H2 tests. The 20-observation minimum is a widely-accepted practical cutoff that brings false-positive rates close to nominal (5%) for the 5% significance threshold. More conservative analysts use N ≥ 50 for m = 5.", "wf": ["Compustat contains firm-quarter data spanning decades — AMETEK's record extends back to the 1970s, giving potentially 200+ quarterly observations. Most S&P firms have 40–80 quarters of data in the typical 2010–2024 window. The 20-quarter threshold is a RESEARCHER-IMPOSED minimum for statistical validity, not a data availability constraint. Firms with fewer than 20 quarters (e.g., recently IPO'd companies or firms that were acquired early) are simply excluded from the BDS analysis.", "", "Business cycle alignment is a useful conceptual motivation but is NOT the technical justification for the 20-quarter threshold. A firm could have exactly 20 quarters that happen to span only part of a business cycle (e.g., an IPO in 2020 gives 2020Q1–2024Q4 = 20 quarters, which includes only the recovery phase). The threshold is driven by the BDS test's statistical requirements, not economic cycle coverage.", "There is no SEC requirement linking quarterly filing counts to academic research inclusion criteria. Regulatory requirements govern what firms must FILE, not what academic researchers must INCLUDE. The 20-quarter threshold is a peer-reviewed methodological standard established in the econometrics literature, enforced by the researcher to maintain statistical validity."]}])}`;
}

// ─── MODULE 3: ARIMA DEEP DIVE ────────────────────────────────────
function m3() {
  return `
<div class="module-header">
  <div class="module-tag">Module 3</div>
  <h2 class="module-title">ARIMA: Linear Benchmark &amp; Complexity Filter</h2>
  <p class="module-subtitle">ARIMA serves a dual role: it establishes the strongest possible linear forecasting benchmark, and its residuals become the raw material for detecting hidden complexity.</p>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🎯</span> Learning Objectives</div>
  <ul class="objectives-list">
    <li>Decompose the three ARIMA components (AR, I, MA) and explain each with a firm-performance intuition.</li>
    <li>Trace the Hyndman-Khandakar algorithm step-by-step: unit root → grid search → AICc selection.</li>
    <li>Explain why structural breaks must be detected <em>before</em> fitting ARIMA, not after.</li>
    <li>Apply the Bai-Perron test and segment a time series by stable regime.</li>
    <li>Extract standardized residuals, apply the Ljung-Box gatekeeper, and interpret the result.</li>
    <li>Compute NLI from BDS z-scores using real firm data.</li>
  </ul>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🔧</span> ARIMA Decomposed — Three Economic Intuitions</div>
  <div class="arima-grid">
    <div class="arima-box">
      <div class="arima-letter">AR(p)</div>
      <div class="arima-name">AutoRegressive</div>
      <div class="arima-desc">
        <strong>"Momentum."</strong> This quarter's ROA is a weighted average of the last <em>p</em> quarters. Like a firm that maintains performance because of established processes and customer loyalty.
        <div class="formula" style="font-size:11px;margin-top:8px">ROAₜ = φ₁ROAₜ₋₁ + … + φₚROAₜ₋ₚ + εₜ</div>
      </div>
    </div>
    <div class="arima-box">
      <div class="arima-letter">I(d)</div>
      <div class="arima-name">Integrated (Differencing)</div>
      <div class="arima-desc">
        <strong>"Remove the trend."</strong> Differencing transforms ROA levels into ROA <em>changes</em>. d=1 means we model ΔROAₜ = ROAₜ − ROAₜ₋₁. Required when ROA drifts over time rather than returning to a stable mean.
        <div class="formula" style="font-size:11px;margin-top:8px">ΔROAₜ = ROAₜ − ROAₜ₋₁</div>
      </div>
    </div>
    <div class="arima-box">
      <div class="arima-letter">MA(q)</div>
      <div class="arima-name">Moving Average</div>
      <div class="arima-desc">
        <strong>"Shocks decay."</strong> A bad earnings surprise in Q1 influences Q2 and Q3 performance through adjustment costs, investor sentiment, or cascading supply chain effects. q controls how many lags of past shocks matter.
        <div class="formula" style="font-size:11px;margin-top:8px">ROAₜ = μ + εₜ + θ₁εₜ₋₁ + … + θₛεₜ₋q</div>
      </div>
    </div>
  </div>
  <div class="section-label">Full ARIMA(p,d,q) Model</div>
  <div class="formula">Φₚ(B)·(1−B)ᵈ·ROAₜ = Θₛ(B)·εₜ</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 Compact Backshift-Operator ARIMA Notation</div>
    <div class="eq-row"><div class="eq-sym">Φₚ(B)</div><div class="eq-def"><strong>AR polynomial in the backshift operator B</strong> — shorthand for (1 − φ₁B − φ₂B² − … − φₚBᴾ). Applying B to a variable shifts it back one period: B·ROA_t = ROA_{t-1}. The polynomial condenses all AR lags into one expression</div></div>
    <div class="eq-row"><div class="eq-sym">(1−B)ᵈ</div><div class="eq-def"><strong>Differencing operator, applied d times</strong> — (1−B)¹·ROA_t = ROA_t − ROA_{t-1} = ΔROA_t. (1−B)²·ROA_t is the second difference. d=0 means no differencing (stationary in levels); d=1 models ROA changes rather than levels</div></div>
    <div class="eq-row"><div class="eq-sym">ROAₜ</div><div class="eq-def"><strong>The observed series</strong> — after applying the differencing operator, we model the differenced series (if d=1 or 2) or the levels (if d=0)</div></div>
    <div class="eq-row"><div class="eq-sym">Θₛ(B)</div><div class="eq-def"><strong>MA polynomial in the backshift operator</strong> — shorthand for (1 + θ₁B + θ₂B² + … + θₛBᶠ). Expresses how past forecast errors feed into today’s ROA</div></div>
    <div class="eq-row"><div class="eq-sym">εₜ</div><div class="eq-def"><strong>White noise innovation</strong> — i.i.d. with mean 0 and variance σ². After a correctly specified ARIMA model is fitted, the residuals εₜ should be indistinguishable from white noise (verified by Ljung-Box)</div></div>
  </div>
  <div class="callout info"><strong>Reading ARIMA notation:</strong> ARIMA(2,1,1) means: 2 AR lags; 1st-order differenced (non-stationary in levels); 1 MA lag. This is a 4-parameter model (φ₁, φ₂, θ₁, plus the constant μ).</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🔬</span> Step 1 — Stationarity Testing: ADF &amp; KPSS</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    Before fitting ARIMA, we must determine the differencing order <em>d</em>. A non-stationary series (one that drifts or trends) violates ARIMA's mathematical assumptions and will inflate the BDS test, creating false "complexity" signals.
  </p>
  <table class="data-table">
    <thead><tr><th>Test</th><th>H₀ (Null Hypothesis)</th><th>Reject H₀ when…</th><th>Implication</th></tr></thead>
    <tbody>
      <tr><td>ADF (Augmented Dickey-Fuller)</td><td>Series has a unit root (non-stationary)</td><td>p-value &lt; 0.05</td><td>Series IS stationary — d=0 may suffice</td></tr>
      <tr><td>KPSS (Kwiatkowski et al.)</td><td>Series IS stationary</td><td>p-value &lt; 0.05</td><td>Series is NON-stationary — differencing needed</td></tr>
    </tbody>
  </table>
  <div class="callout warning"><strong>Conflict resolution:</strong> When ADF and KPSS disagree (a common occurrence for near-unit-root processes), default to d=1 differencing. Over-differencing is safer than under-differencing for the downstream BDS test — under-differencing leaves structure in residuals that mimics complexity.</div>
  <pre><code><span class="code-kw">from</span> statsmodels.tsa.stattools <span class="code-kw">import</span> adfuller, kpss

<span class="code-kw">def</span> <span class="code-fn">test_stationarity</span>(series, name=<span class="code-str">""</span>):
    adf_stat, adf_p, _, _, _, _ = <span class="code-fn">adfuller</span>(series, autolag=<span class="code-str">'AIC'</span>)
    kpss_stat, kpss_p, _, _ = <span class="code-fn">kpss</span>(series, regression=<span class="code-str">'c'</span>)
    <span class="code-fn">print</span>(<span class="code-str">f"{name}: ADF p={adf_p:.4f} | KPSS p={kpss_p:.4f}"</span>)
    <span class="code-kw">if</span> adf_p < <span class="code-num">0.05</span> <span class="code-kw">and</span> kpss_p > <span class="code-num">0.05</span>: <span class="code-fn">print</span>(<span class="code-str">"  → Stationary (d=0)"</span>)
    <span class="code-kw">elif</span> adf_p > <span class="code-num">0.05</span>:                    <span class="code-fn">print</span>(<span class="code-str">"  → Non-stationary (use d=1)"</span>)
    <span class="code-kw">else</span>:                                  <span class="code-fn">print</span>(<span class="code-str">"  → Ambiguous — default to d=1"</span>)</code></pre>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🤖</span> Step 2 — Model Selection: Hyndman-Khandakar Algorithm</div>
  <div class="step-list">
    <div class="step-item"><div class="step-num">1</div><div class="step-body"><h4>Determine d via unit root tests</h4><p>Run ADF. If p &gt; 0.05 (fail to reject unit root), difference the series and re-test. Repeat until stationary. Cap at d=2.</p></div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-body"><h4>Set starting (p,q) via ACF/PACF</h4><p>The Partial Autocorrelation Function (PACF) guides the starting p; the Autocorrelation Function (ACF) guides starting q. This seeds the search near good solutions.</p></div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-body"><h4>Stepwise search over (p,q) space</h4><p>Fit up to 9 neighboring models. Each is evaluated by <strong>AICc</strong> (corrected Akaike Information Criterion — penalizes complexity for small samples). Move to the neighbor with the lowest AICc.</p></div></div>
    <div class="step-item"><div class="step-num">4</div><div class="step-body"><h4>Stop when no neighbor improves AICc</h4><p>The algorithm converges to a local minimum. Report the selected ARIMA(p̂,d̂,q̂) order and its fitted coefficients.</p></div></div>
  </div>
  <div class="formula">AICc = AIC + 2k(k+1)/(n−k−1), &nbsp; where k = number of parameters, n = obs</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 AICc (Corrected Akaike) Components</div>
    <div class="eq-row"><div class="eq-sym">AICc</div><div class="eq-def"><strong>Corrected Akaike Information Criterion</strong> — the model selection score. Lower is better. It balances goodness-of-fit against model complexity. Used to choose the best ARIMA(p,d,q) from among all candidates in the grid search</div></div>
    <div class="eq-row"><div class="eq-sym">AIC</div><div class="eq-def"><strong>Standard Akaike Information Criterion</strong> = −2·ln(L) + 2k, where L is the maximized likelihood. Penalizes model complexity (k parameters) relative to how well the model fits the data (−2·ln(L))</div></div>
    <div class="eq-row"><div class="eq-sym">2k(k+1)/(n−k−1)</div><div class="eq-def"><strong>Small-sample correction term</strong> — the additional penalty added when n (observations) is small relative to k (parameters). As n → ∞, this term vanishes and AICc → AIC. For our firms with n ≈ 40–60 quarters, this correction is critical — without it, AIC over-fits</div></div>
    <div class="eq-row"><div class="eq-sym">k</div><div class="eq-def"><strong>Number of free parameters</strong> in the ARIMA model. For ARIMA(p,d,q): k = p + q + 1 (the +1 is for the constant μ, if included). ARIMA(2,1,1) has k=4</div></div>
    <div class="eq-row"><div class="eq-sym">n</div><div class="eq-def"><strong>Number of observations</strong> used to fit the model — typically 40–60 quarters per firm in our dataset. The denominator (n−k−1) blows up when n is close to k, which is the intuition behind the correction: with too few data per parameter, estimates are unreliable</div></div>
  </div>
  <div class="callout info"><strong>Why AICc over BIC?</strong> BIC penalizes complexity more heavily and tends to select simpler models. For ARIMA on financial panel data (n ≈ 40–60 per firm), AICc strikes the better bias-variance tradeoff. BIC would systematically under-specify models, leaving structure in residuals.</div>
  <pre><code><span class="code-kw">from</span> pmdarima <span class="code-kw">import</span> auto_arima
<span class="code-kw">import</span> warnings; warnings.<span class="code-fn">filterwarnings</span>(<span class="code-str">'ignore'</span>)

results = {}
<span class="code-kw">for</span> gvkey, grp <span class="code-kw">in</span> df.<span class="code-fn">groupby</span>(<span class="code-str">'gvkey'</span>):
    roa = grp[<span class="code-str">'ROA_w'</span>].<span class="code-fn">dropna</span>().<span class="code-fn">values</span>
    <span class="code-kw">if</span> <span class="code-fn">len</span>(roa) < <span class="code-num">20</span>: <span class="code-kw">continue</span>
    model = <span class="code-fn">auto_arima</span>(
        roa, start_p=<span class="code-num">0</span>, max_p=<span class="code-num">3</span>, start_q=<span class="code-num">0</span>, max_q=<span class="code-num">3</span>,
        d=<span class="code-kw">None</span>, information_criterion=<span class="code-str">'aicc'</span>,
        stepwise=<span class="code-kw">True</span>, suppress_warnings=<span class="code-kw">True</span>
    )
    results[gvkey] = {<span class="code-str">'order'</span>: model.order, <span class="code-str">'aicc'</span>: model.aicc(),
                      <span class="code-str">'residuals'</span>: model.resid()}</code></pre>
</div>

<div class="card">
  <div class="card-title"><span class="icon">💥</span> Step 3 — Structural Break Detection: Bai-Perron Test</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    A structural break is a permanent, sudden shift in the statistical properties of a time series — a new mean, new variance, or new trend. For firm ROA, breaks can occur due to major acquisitions, CEO changes, product-line exits, or macro shocks (2008 financial crisis, 2020 COVID shock).
  </p>
  <div class="analogy"><strong>Analogy:</strong> Imagine a tennis player's ranking trajectory from 2010–2024. There's a clear break in 2017 when they suffered a serious injury — the series before and after the break have fundamentally different statistical properties. Treating it as one series would incorrectly attribute the break's effect as "regular variability."</div>
  <div class="section-label">Why Breaks Must Be Detected BEFORE Fitting ARIMA</div>
  <table class="data-table">
    <thead><tr><th>Scenario</th><th>Effect on Residuals</th><th>Effect on NLI</th></tr></thead>
    <tbody>
      <tr><td>Undetected break, ARIMA fitted on full series</td><td>Residuals contain the break's jump — artificially correlated</td><td>BDS z-score inflated → false High-NLI classification</td></tr>
      <tr><td>Break detected, ARIMA fitted on longest stable regime</td><td>Residuals are clean within-regime variations</td><td>BDS z-score reflects genuine strategic complexity</td></tr>
    </tbody>
  </table>
  <pre><code><span class="code-kw">import</span> ruptures <span class="code-kw">as</span> rpt

<span class="code-kw">def</span> <span class="code-fn">detect_breaks</span>(series, max_breaks=<span class="code-num">3</span>):
    signal = series.<span class="code-fn">reshape</span>(-<span class="code-num">1</span>, <span class="code-num">1</span>)
    algo = rpt.<span class="code-fn">Pelt</span>(model=<span class="code-str">'rbf'</span>).<span class="code-fn">fit</span>(signal)
    breakpoints = algo.<span class="code-fn">predict</span>(pen=<span class="code-num">10</span>)      <span class="code-cm"># penalty controls sensitivity</span>

    <span class="code-cm"># Find the longest stable regime</span>
    segments = [<span class="code-num">0</span>] + breakpoints
    lengths = [segments[i+<span class="code-num">1</span>] - segments[i] <span class="code-kw">for</span> i <span class="code-kw">in</span> <span class="code-fn">range</span>(<span class="code-fn">len</span>(segments)-<span class="code-num">1</span>)]
    longest_idx = lengths.<span class="code-fn">index</span>(<span class="code-fn">max</span>(lengths))
    start, end = segments[longest_idx], segments[longest_idx+<span class="code-num">1</span>]
    <span class="code-kw">return</span> series[start:end]   <span class="code-cm"># ARIMA fitted on this segment only</span></code></pre>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🧹</span> Step 4 — Residuals &amp; The Ljung-Box Gate</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    After ARIMA fitting, the residuals εₜ are what the model couldn't explain. We <strong>standardize them</strong> (divide by estimated standard deviation) so that firms with different ROA scales can be compared in the BDS test. The residuals must then pass the Ljung-Box gatekeeper test before we compute NLI.
  </p>
  <div class="formula">ε̂ₜ_std = ε̂ₜ / σ̂_ε</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 Residual Standardization Components</div>
    <div class="eq-row"><div class="eq-sym">ε̂ₜ_std</div><div class="eq-def"><strong>Standardized residual at quarter t</strong> — the scale-free version of the residual. Dividing by σ̂_ε ensures that firms with ROA on different scales (AMETEK ≈ 0.022 vs. a near-zero firm at 0.001) have residuals that are directly comparable in the BDS test</div></div>
    <div class="eq-row"><div class="eq-sym">ε̂ₜ</div><div class="eq-def"><strong>Raw ARIMA residual at quarter t</strong> — the difference between actual ROA and the ARIMA model’s fitted value: ε̂ₜ = ROA_t − ROÂ_t. These are what the linear model could <em>not</em> explain</div></div>
    <div class="eq-row"><div class="eq-sym">σ̂_ε</div><div class="eq-def"><strong>Estimated standard deviation of residuals</strong> — the root-mean-square of all residuals for the firm, computed over the training window. This is the normalization constant that puts every firm’s residuals on a unit-variance scale</div></div>
    <div class="eq-row"><div class="eq-sym">Why standardize?</div><div class="eq-def">The BDS test’s ε-ball radius is set as a fraction of the standard deviation of the input series. If residuals are not standardized, firms with larger ROA magnitudes will have larger ε automatically — confounding scale differences with structural complexity</div></div>
  </div>
  <table class="data-table">
    <thead><tr><th>Ljung-Box Result</th><th>Meaning</th><th>Action</th></tr></thead>
    <tbody>
      <tr><td style="color:var(--accent-green)">p &gt; 0.05 ✓</td><td>Residuals are white noise — no linear autocorrelation remains</td><td>Proceed to BDS test → compute NLI</td></tr>
      <tr><td style="color:var(--accent-amber)">0.01 &lt; p &lt; 0.05 ⚠️</td><td>Borderline — weak remaining structure</td><td>Try expanding p or q by 1; re-evaluate</td></tr>
      <tr><td style="color:var(--accent-red)">p &lt; 0.01 ✗</td><td>Significant autocorrelation remains in residuals</td><td>ARIMA is under-specified — mandatory re-fit</td></tr>
    </tbody>
  </table>
  <pre><code><span class="code-kw">from</span> statsmodels.stats.diagnostic <span class="code-kw">import</span> acorr_ljungbox

<span class="code-kw">def</span> <span class="code-fn">check_residuals</span>(residuals, model_order):
    p, q = model_order[<span class="code-num">0</span>], model_order[<span class="code-num">2</span>]
    dof = p + q   <span class="code-cm"># ← CRITICAL: adjust for ARIMA parameters</span>
    result = <span class="code-fn">acorr_ljungbox</span>(
        residuals, lags=[<span class="code-num">10</span>], model_df=dof, return_df=<span class="code-kw">True</span>
    )
    lb_p = result[<span class="code-str">'lb_pvalue'</span>].<span class="code-fn">values</span>[<span class="code-num">0</span>]
    passed = lb_p > <span class="code-num">0.05</span>
    <span class="code-fn">print</span>(<span class="code-str">f"Ljung-Box: p={lb_p:.4f} → {'PASS ✓' if passed else 'FAIL ✗'}"</span>)
    <span class="code-kw">return</span> passed</code></pre>
  <div class="callout warning"><strong>Most common coding error:</strong> Calling <code>acorr_ljungbox(residuals, lags=[10])</code> without <code>model_df=p+q</code> inflates the Type I error rate. The test's degrees of freedom must be adjusted for the estimated parameters — otherwise you'll reject valid models far too often.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🧮</span> Step 5 — The BDS Test &amp; NLI Calculation</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    The <strong>BDS test</strong> (Brock, Dechert &amp; Scheinkman, 1996) tests whether the residuals are <em>independently and identically distributed</em> (i.i.d.). If they're not i.i.d., some non-linear structure remains — this is what we call "complexity."
  </p>
  <div class="formula">NLI = BDS z-score at embedding dimension m=2 for firm j</div>
  <div class="formula">Is_Complex_j = 1 &nbsp; if &nbsp; NLI_j &gt; 1.96 &nbsp; (p &lt; 0.05, one-tailed)</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 NLI Components</div>
    <div class="eq-row"><div class="eq-sym">NLI</div><div class="eq-def"><strong>Non-Linearity Index</strong> — the BDS test statistic (z-score) applied to the ARIMA standardized residuals. Measures joint distributional dependence across time: does the past pattern of residuals predict future values in a non-linear way?</div></div>
    <div class="eq-row"><div class="eq-sym">BDS z-score</div><div class="eq-def">The BDS statistic compares the observed <em>correlation integral</em> C_m(ε) (fraction of pairs of m-length windows within distance ε) to what you’d expect if the data were truly i.i.d. The z-score is: [C_m(ε) − C_1(ε)ᵐ ] / σ_{m,ε}. A large z-score means the data has more clustering in m-dimensional space than randomness would predict</div></div>
    <div class="eq-row"><div class="eq-sym">m = 2</div><div class="eq-def"><strong>Embedding dimension</strong> — the number of consecutive time points treated as a vector. At m=2, each “point” in the test is a pair (εₜ, ε_{t+1}). The test checks if these pairs cluster more than randomness predicts. We use m=2 (a conservative, powerful choice for short time series)</div></div>
    <div class="eq-row"><div class="eq-sym">1.96</div><div class="eq-def"><strong>Critical value at α = 0.05 (one-tailed, standard normal)</strong> — P(Z > 1.96) = 0.025 for two-tailed, but here one-tailed because we only care about <em>positive</em> dependence (clustering), not the symmetric case. A BDS z-score above 1.96 means we reject i.i.d. at 5% significance</div></div>
    <div class="eq-row"><div class="eq-sym">Is_Complex = 1</div><div class="eq-def">Binary classification: the firm is labelled <strong>⚡ Hypercompetitive</strong> if NLI > 1.96. This score anchors the tournament test (H1) and is the key moderator in the regression (H2)</div></div>
  </div>
  <pre><code><span class="code-kw">from</span> statsmodels.stats.diagnostic <span class="code-kw">import</span> bds

<span class="code-kw">def</span> <span class="code-fn">compute_nli</span>(std_residuals, epsilon=<span class="code-num">0.7</span>):
    <span class="code-str">"""BDS test at embedding dimension 2. Returns z-score as NLI."""</span>
    <span class="code-kw">if</span> <span class="code-fn">len</span>(std_residuals) < <span class="code-num">20</span>:
        <span class="code-kw">return</span> <span class="code-kw">None</span>
    bds_stat, bds_pvalue = <span class="code-fn">bds</span>(std_residuals, max_dim=<span class="code-num">2</span>,
                                epsilon=epsilon * std_residuals.<span class="code-fn">std</span>())
    nli = bds_stat[<span class="code-num">0</span>]     <span class="code-cm"># z-score at m=2</span>
    is_complex = <span class="code-fn">int</span>(nli > <span class="code-num">1.96</span>)
    <span class="code-kw">return</span> {<span class="code-str">'NLI'</span>: nli, <span class="code-str">'is_complex'</span>: is_complex, <span class="code-str">'bds_p'</span>: bds_pvalue[<span class="code-num">0</span>]}</code></pre>
</div>

<div class="card" style="border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.04)">
  <div class="card-title"><span class="icon">📋</span> Exercise 3A — MASE Calculation from Scratch (Real Data)</div>
  <p style="color:var(--text-secondary);font-size:13.5px;line-height:1.7;margin-bottom:16px">
    Using the actual quarterly ROA data from the dataset, compute MASE for a simple "repeat last quarter" naive model applied to <strong>AMETEK INC</strong>.
  </p>
  <table class="data-table">
    <thead><tr><th>Quarter</th><th>Actual ROA</th><th>Naive Forecast (Yₜ₋₁)</th><th>|Error|</th></tr></thead>
    <tbody>
      <tr><td>2023-Q1</td><td>0.02423</td><td>0.02282 (Q4-2022 actual)</td><td>0.00141</td></tr>
      <tr><td>2023-Q2</td><td>0.02525</td><td>0.02423</td><td>0.00102</td></tr>
      <tr><td>2023-Q3</td><td>0.02600</td><td>0.02525</td><td>0.00075</td></tr>
      <tr><td>2023-Q4</td><td>0.02282</td><td>0.02600</td><td>0.00318</td></tr>
      <tr><td>2024-Q1</td><td>0.02092</td><td>0.02282</td><td>0.00190</td></tr>
      <tr><td>2024-Q2</td><td>0.02282</td><td>0.02092</td><td>0.00190</td></tr>
      <tr><td>2024-Q3</td><td>0.02304</td><td>0.02282</td><td>0.00022</td></tr>
      <tr><td>2024-Q4</td><td>0.02647</td><td>0.02304</td><td>0.00343</td></tr>
    </tbody>
  </table>
  <p style="color:var(--text-secondary);font-size:13px;margin-top:14px">Given: Training-period naive MAE (in-sample mean absolute first-difference) = <strong>0.000259</strong></p>
  <div class="step-list" style="margin-top:14px">
    <div class="step-item"><div class="step-num">1</div><div class="step-body"><h4>Compute holdout MAE</h4><p>Average the 8 absolute errors above. Show your calculation.</p><div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">Mean |Error| = (0.00141+0.00102+0.00075+0.00318+0.00190+0.00190+0.00022+0.00343) / 8 = 0.01381 / 8 = <strong>0.001726</strong></div></div></div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-body"><h4>Compute MASE for the naive model</h4><p>MASE = Holdout MAE ÷ Training-period naive MAE.</p><div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">MASE = 0.001726 / 0.000259 = <strong>6.66</strong>. MASE >> 1, which makes sense — the naive model IS the benchmark. A good ARIMA model should get MASE well below 1.0 on this stable firm.</div></div></div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-body"><h4>Interpretation</h4><p>If an ARIMA model achieves MASE = 0.62 on AMETEK and MASE = 1.45 on Cleveland-Cliffs, what does this tell you about which firm is more predictable and likely to have lower NLI?</p><div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">AMETEK (MASE = 0.62) is highly predictable — ARIMA comfortably beats the naive baseline. This is consistent with its low CV and likely Low NLI (RBV firm). Cleveland-Cliffs (MASE = 1.45) is <em>worse than naive</em> even with ARIMA — the linear model can't capture its dynamics. This is consistent with High NLI (hypercompetitive).</div></div></div></div>
  </div>
</div>

${quizBlock(3, [{"q": "An ARIMA(0,1,0) model — also called a random walk — is auto-selected by the Hyndman-Khandakar algorithm for a firm's ROA series. What is the mathematically correct one-step-ahead point forecast for next quarter's ROA, and what does this reveal about the firm's predictability?", "opts": ["The long-run historical mean ROA of the firm — mean reversion is always the optimal forecast", "Last quarter's ROA — the first-difference model predicts zero CHANGE each period, making the next quarter's expected level equal to the current level", "Zero — ARIMA(0,1,0) always forecasts zero for all future periods", "The average of the last three ROA observations — random walk models use a three-period lookback by convention"], "correct": 1, "fb": "ARIMA(0,1,0) in levels is written: ROA_t = ROA_{t-1} + ε_t, which is exactly the equation for a random walk with no drift (d=1 means one differencing, p=0 means no AR terms, q=0 means no MA terms). To forecast ahead one period: E[ROA_{t+1} | ROA_t, ROA_{t-1}, ...] = E[ROA_t + ε_{t+1}] = ROA_t + E[ε_{t+1}] = ROA_t + 0 = ROA_t. The expected change is literally zero — our best guess for next quarter is 'same as today.' At first glance this seems like a poor model, but it has important implications: (1) For a random walk, ALL future forecasts (h-steps ahead) equal the current value: E[ROA_{t+h}] = ROA_t for any h. There is no mean-reversion built in. (2) The model implies shocks are PERMANENT — a bad quarter (say, ROA drops 0.01) shifts the entire future trajectory down by 0.01. The firm never 'recovers' toward a pre-shock level in expectation. (3) Confidence intervals widen LINEARLY with horizon (variance grows as σ²·h). This contrasts sharply with a stationary AR(1) where shocks decay and intervals asymptote. In the context of this study: MASE = 1.0 for this firm if ARIMA's holdout performance exactly matches the naive 'no change' benchmark. Any MASE > 1 for such a firm means our ARIMA model is literally worse than guessing 'nothing changes.' This is common for highly volatile, unpredictable firms — and predicts high NLI.", "wf": ["Long-run mean reversion is the forecast for STATIONARY processes, specifically AR(p) models where |φ₁| < 1. For such models, as h → ∞, the forecast converges to the unconditional mean μ. But ARIMA(0,1,0) is integrated (non-stationary) — it has no finite unconditional mean because the process can drift arbitrarily far from any starting level. Forecasting toward the historical mean for a random walk is mathematically incorrect and would produce biased multi-step forecasts with systematically wrong confidence intervals.", "", "Zero would only be correct if the baseline ROA were zero, which is rarely the case. The forecast is ROA_{t+1} = ROA_t — the current level, not zero. The word 'zero' applies to the FORECAST of the first DIFFERENCE (ΔROA = 0), not to the level. ARIMA(0,1,0) models ΔROA = ε_t and forecasts E[ΔROA_{t+1}] = 0, which translates to E[ROA_{t+1}] = ROA_t. The distinction between modeling differences versus levels is crucial and a common source of confusion.", "Three-period averaging would correspond to a simple moving average model (SMA(3)), which is a different forecasting approach that explicitly uses multiple lags. ARIMA(0,1,0) uses EXACTLY one lag — only the most recent observation — with no averaging. The three-period convention does not exist in standard ARIMA methodology; lag selection is based on AICc optimization, not arbitrary conventions."]}, {"q": "After fitting ARIMA to a firm's ROA, the Ljung-Box test on the residuals returns Q-statistic p-value = 0.03 (testing lags 1 through 10). The researcher then proceeds directly to the BDS nonlinearity test. What critical error has been committed, and what is the correct remediation?", "opts": ["No error — p = 0.03 is less than 0.05, so we successfully reject the null and confirm the residuals are white noise, ready for BDS", "The error is using 10 lags rather than the recommended 20 lags in the Ljung-Box test — the result is inconclusive until re-run with the correct lag count", "p = 0.03 means we REJECT the null hypothesis that residuals are white noise — significant autocorrelation remains in the ARIMA residuals. Feeding autocorrelated residuals to BDS confounds linear structure with nonlinearity, inflating NLI with a false-positive signal. The correct fix is to expand the ARIMA model (try larger p or q) until Ljung-Box p > 0.05.", "There is no error — Ljung-Box is an optional diagnostic step; BDS does not require pre-screened residuals"], "correct": 2, "fb": "This is one of the most important interpretation errors to internalize, and it trips up researchers routinely. The Ljung-Box test has this null hypothesis: H₀ = 'the series is white noise up to lag k (all autocorrelations ρ₁ through ρₖ are collectively zero).' A LOW p-value (like p = 0.03) means we have strong evidence AGAINST this null — the residuals are NOT white noise, they contain significant autocorrelation at lags 1–10. We need to KEEP ITERating the ARIMA model. The intuitive mistake is applying the same mental model as most tests where a small p-value = 'good result.' For Ljung-Box, LARGE p-value = good result (it means 'no evidence of autocorrelation, model is adequate'). Here's why this error matters for BDS specifically: BDS tests whether its INPUT series is i.i.d. If the residuals still have autocorrelation (i.e., ρ₁ ≠ 0), then BDS will reject i.i.d. — not because of nonlinearity, but because of the LEFTOVER LINEAR structure that ARIMA failed to remove. The NLI z-score would be inflated by linear autocorrelation, not genuine nonlinear complexity. Firms would be falsely classified as High-NLI when they're actually just under-fitted with ARIMA. The correct protocol: Ljung-Box p < 0.05 → try ARIMA(p+1, d, q) and ARIMA(p, d, q+1) → re-test Ljung-Box → repeat until p > 0.05. Only then proceed to BDS.", "wf": ["This reversal of the Ljung-Box interpretation is the key error — please internalize it carefully. The Ljung-Box null H₀ = 'white noise / no autocorrelation.' p = 0.03 means we reject this null. That means the residuals DO have significant autocorrelation — the model is INADEQUATE. The desired outcome is p > 0.05 (fail to reject H₀ = residuals look like white noise = ARIMA fit is sufficient). Contrast this with a typical hypothesis test for a coefficient: there, p < 0.05 = significant = desired result. The direction is inverted for Ljung-Box because the null is 'no structure' rather than 'no effect.'", "The lag count does affect the test's power — using too few lags misses high-order autocorrelation; too many reduces power due to the chi-square distribution having many degrees of freedom. Standard practice: use approximately min(T/5, 10√T, 40) lags where T is the series length. With T ≈ 50 quarters, this gives approximately 10 lags, which is reasonable. However, the MAIN error here is not the lag count — it's the misinterpretation of the p-value. Even if re-run with 20 lags and p = 0.02, the conclusion is the same: ARIMA residuals have remaining structure, BDS cannot yet be applied.", "", "Ljung-Box is a MANDATORY gatekeeping step in the Filter-Then-Test protocol, not optional. The entire scientific validity of the BDS-based NLI rests on the assumption that ARIMA has successfully removed all linear structure from the residuals. Without Ljung-Box confirmation, we have no evidence that this assumption is satisfied. Applying BDS to inadequately whitened residuals is the primary source of false-positive nonlinearity findings in the empirical finance literature, which is precisely why the protocol explicitly requires Ljung-Box clearance."]}, {"q": "Why does the Hyndman-Khandakar auto.arima algorithm use AICc (corrected Akaike Information Criterion) rather than BIC (Bayesian Information Criterion) for selecting the ARIMA order in this study's context?", "opts": ["AICc always selects more accurate models than BIC — it is the universally superior criterion for all applications", "BIC's stronger per-parameter penalty causes it to systematically under-specify ARIMA models for our sample sizes (n ≈ 40–60 quarters per firm), selecting models that are too parsimonious and leave residual linear structure that inflates BDS NLI scores", "AICc is the only model selection criterion supported by the Python pmdarima library's auto_arima function — it is a software constraint, not a methodological choice", "BIC requires a Bayesian prior probability for each model order, which is unavailable for quarterly financial time series"], "correct": 1, "fb": "Model selection criteria embody fundamentally different philosophical trade-offs, and the choice matters enormously here. BIC (Bayesian Information Criterion) applies a penalty per parameter of log(n) — where n is the sample size. AICc applies a penalty of 2k(k+1)/(n-k-1) — a corrected version of AIC's penalty of 2k. For n = 50 and k = 3 parameters: BIC penalty = 3·log(50) ≈ 11.7; AICc penalty ≈ 2·3·4/(50-3-1) ≈ 0.52 per parameter, total ≈ 11.3 + 0.52 = approximately 11.8 total including the AIC base. WAIT — let's be precise: BIC penalizes EACH additional parameter by log(n) ≈ 3.9; AICc effectively penalizes by approximately 2·(1 + (k+1)/(n-k-2)). For small n and moderate k, AICc's penalty per parameter is less severe than BIC's. The practical consequence: with n ≈ 50, BIC strongly discourages adding AR and MA terms. It frequently selects ARIMA(0,1,0) or ARIMA(1,0,0) when the true generating process might be ARIMA(2,1,1). This under-specification leaves autocorrelation in residuals (Ljung-Box would find p < 0.05), meaning BDS receives contaminated input. AICc is designed to find the min-error model for the OBSERVED sample size — at n = 50, it is less aggressive about parsimony and more willing to fit ARIMA(2,1,2) if the additional parameters genuinely reduce residual autocorrelation. The result: cleaner Ljung-Box passage, better BDS input, and more accurate NLI classification.", "wf": ["Neither AICc nor BIC is universally superior. They optimize for different objectives: AIC/AICc minimizes expected out-of-sample prediction error (for the given sample size); BIC aims for consistency — in large samples, it selects the true model with probability approaching 1. For very large n (thousands of observations), BIC's parsimony advantage makes it preferred. For small n (40–60 quarters), BIC's heavy penalty is too conservative and causes systematic under-fitting. The correct criterion depends on n, the goal (prediction vs. model identification), and how you plan to use the fitted model.", "", "This is false — pmdarima's auto_arima function explicitly supports multiple criteria via the information_criterion parameter, which accepts 'aic', 'aicc', 'bic', 'hqic', and 'oob'. The choice of AICc in this study is a deliberate methodological decision, not a software limitation. The code explicitly sets information_criterion='aicc'.", "BIC is a frequentist criterion despite its Bayesian-sounding name. It is mathematically derived by approximating a Bayes factor comparison using Laplace's method, but the resulting formula requires only the log-likelihood and the number of parameters — no prior probability is needed. BIC = −2·log(L_max) + k·log(n). The word 'Bayesian' in the name reflects its theoretical derivation, not its practical requirements."]}, {"q": "A firm's ARIMA residuals have skewness = −2.4 and excess kurtosis = 8.1 (very heavy tails, strongly left-skewed). The Ljung-Box test returns p = 0.22. Should we proceed to BDS nonlinearity testing, and why?", "opts": ["Yes — p = 0.22 means the Ljung-Box gatekeeper is passed, confirming no linear autocorrelation remains. BDS can proceed, because BDS tests for i.i.d. independence, not normality.", "No — the BDS test requires normally distributed residuals (skewness ≈ 0, kurtosis ≈ 3), and these residuals violate that requirement severely", "Yes — skewness and kurtosis are irrelevant to BDS; the only relevant property is whether autocorrelations are zero, which Ljung-Box confirms", "No — excess kurtosis above 6 always indicates latent nonlinearity and the firm has already been classified as High-NLI"], "correct": 0, "fb": "Proceed — but let's be precise about exactly WHY The BDS test's null hypothesis is that the series is i.i.d. — independently and identically distributed. Note the two parts: (1) INDEPENDENTLY: each observation is statistically independent of all others (no temporal structure, no autocorrelation, no conditional heteroskedasticity). (2) IDENTICALLY: all observations are drawn from the SAME distribution (stationarity, constant parameters). Crucially, nowhere in the i.i.d. definition is there a requirement that the distribution be NORMAL. An i.i.d. process can have any marginal distribution — it could be Student-t with heavy tails, a skewed distribution, even a mix of Gaussians — as long as draws are independent. Skewness = −2.4 and kurtosis = 8.1 describe the SHAPE of the marginal distribution, not its temporal dependence structure. The BDS test is designed to detect temporal dependence (both linear and nonlinear), not distributional non-normality. Ljung-Box p = 0.22 > 0.05 means we fail to reject white noise in the LINEAR autocorrelation sense — ARIMA successfully removed all exploitable linear structure. What remains is the i.i.d. component. BDS will now test whether even the i.i.d. component has hidden nonlinear temporal structure. If BDS also fails to reject (NLI < 1.96), the residuals are consistent with a mean-zero i.i.d. process (any distribution). If BDS rejects (NLI > 1.96), there is nonlinear temporal dependence lurking beneath the linear surface.", "wf": ["", "BDS does NOT require normality. This is perhaps the most pervasive misconception about the test. The BDS null is i.i.d., which encompasses non-normal distributions. In financial economics, residuals routinely exhibit heavy tails (kurtosis >> 3) and skewness due to infrequent large shocks — this is well-documented as a property of financial data and is entirely compatible with i.i.d. behavior. ARIMA's assumption of i.i.d. errors allows non-normal errors; it only requires that errors be uncorrelated. The concern about non-normality would matter for STANDARD ERRORS of ARIMA coefficient estimates (where non-normality can affect inference), but not for BDS applicability.", "Technically correct that only autocorrelation matters for Ljung-Box, and Ljung-Box clearance is what allows BDS to proceed. However, 'irrelevant to BDS' needs nuance: heavy-tailed distributions (high kurtosis) do affect the power/size properties of BDS at finite samples. High kurtosis can mildly inflate BDS z-scores even for i.i.d. series — a phenomenon called size distortion. For this reason, some researchers bootstrap the BDS critical values rather than using the asymptotic standard normal approximation when kurtosis is very high. But this is a refinement, not a disqualification — BDS can still be applied.", "Excess kurtosis above any threshold does NOT automatically classify a firm as High-NLI. Kurtosis measures tail thickness in the marginal distribution — it says 'extreme events happen more often than a normal distribution would predict.' This could reflect: (a) i.i.d. fat-tailed shocks (no NLI implications), or (b) nonlinear temporal dependence that generates clusters of extreme events (potential NLI). Only the BDS test distinguishes between these interpretations. You need to actually RUN BDS to classify the firm."]}, {"q": "Cleveland-Cliffs has in-sample (training period) naive MAE = 0.00787 and ARIMA holdout MAE = 0.00823 over the 8-quarter holdout period. Calculate the ARIMA MASE and interpret whether ARIMA is adding value for this firm.", "opts": ["MASE = 1.00 — the naive baseline by definition always achieves MASE = 1.0 exactly", "MASE = 0.00787 / 0.00823 = 0.956 — ARIMA achieves lower error than the naive model, confirming it adds forecasting value", "MASE = 0.00823 / 0.00787 = 1.046 — ARIMA is 4.6% WORSE than the naive 'no-change' benchmark, meaning a random walk outperforms the fitted model for this firm", "MASE cannot be computed for individual firms — it requires the full cross-sectional average across all firms"], "correct": 2, "fb": "MASE = holdout MAE_ARIMA / training naive MAE = 0.00823 / 0.00787 = 1.046. Let's unpack each component carefully. The DENOMINATOR (0.00787) is the mean absolute error of the in-SAMPLE naive forecast — computed FROM THE TRAINING PERIOD ONLY. This is critical: using training-period naive MAE as the denominator means we are measuring the baseline difficulty of predicting THIS firm's ROA scale and volatility, calibrated on the same data the ARIMA was trained on. It prevents the denominator from being contaminated by test-period data. The NUMERATOR (0.00823) is ARIMA's mean absolute error on the HOLDOUT period (the 8 quarters ARIMA never saw during training). The ratio 1.046 > 1 means: ARIMA's prediction errors on unseen data are 4.6% LARGER than the naive 'no change from last quarter' baseline's typical training-period error. This is a poor result — ARIMA cannot beat the simplest possible benchmark for Cleveland-Cliffs. The economic interpretation: Cleveland-Cliffs is a steel producer highly exposed to commodity price cycles (iron ore, coking coal, scrap metal) and automotive demand cycles. Its revenue and profitability swing dramatically with factors entirely exogenous to its strategy. ARIMA selected some linear model, but the actual holdout dynamics were driven by factors no training-period linear extrapolation could capture. MASE > 1 here is a strong signal that the BDS test would likely find NLI > 1.96 — this firm's residuals are probably not i.i.d., and Chronos should achieve MASE < 1.046.", "wf": ["MASE = 1.0 only for the NAIVE MODEL when evaluated under very specific conditions (the holdout period has the same statistical properties as the training period, and we're comparing the naive holdout error to the naive training error). Even for the naive model itself, MASE can differ from 1.0 if the holdout period is harder or easier than the training period. For ARIMA, MASE can be anywhere from near zero (excellent forecasting) to well above 1 (worse than naive). It is a coincidence when MASE happens to equal exactly 1.", "You've inverted the formula. MASE = holdout MAE MODEL / training naive MAE. The ratio 0.00787/0.00823 = 0.956 would mean 'how many times better is the naive training error compared to ARIMA's holdout error' — this is NOT MASE and has no standard name or interpretation. More importantly, the conclusion is reversed: 0.956 < 1 would suggest ARIMA beats the naive baseline, when actually the correct calculation shows ARIMA is slightly worse.", "", "MASE is specifically designed as a PER-FIRM, PER-SERIES metric. Hyndman & Koehler (2006) introduced it precisely to enable comparisons ACROSS series that have different scales and volatilities. Each firm's MASE uses its OWN naive baseline in the denominator, making it a normalized, scale-free measure of forecasting accuracy. The per-firm value is the primary unit of analysis. Cross-sectional averaging of MASE scores (e.g., mean MASE across all firms) is done for reporting aggregate results, but it requires starting from individual per-firm MASE values."]}])}`;
}
