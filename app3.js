/* ═══════════════════════════════════════
   app3.js — Module 4: Chronos AI (expanded)
   ═══════════════════════════════════════ */

function m4() {
  return `
<div class="module-header">
  <div class="module-tag">Module 4</div>
  <h2 class="module-title">AI Forecasting with Amazon Chronos-Bolt</h2>
  <p class="module-subtitle">How a model trained on millions of global time series "reads" firm profitability — and why zero-shot inference is the only scientifically valid protocol.</p>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🎯</span> Learning Objectives</div>
  <ul class="objectives-list">
    <li>Contrast Foundation Models against classical methods (ARIMA, LSTM) along four dimensions: training data, inference mode, uncertainty quantification, and scalability.</li>
    <li>Explain how Chronos-Bolt tokenizes continuous ROA values and what "patch tokenization" adds over prior models.</li>
    <li>Define zero-shot inference and explain why fine-tuning invalidates the scientific comparison.</li>
    <li>Interpret P10, P50, P90 forecasts and compute the "Cone of Uncertainty" width for high vs. low NLI firms.</li>
    <li>Set up and execute AutoGluon's <code>backtest_predictions</code> expanding-window evaluation.</li>
    <li>Calculate WQL from quantile loss components and explain what poor calibration looks like.</li>
  </ul>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🧠</span> The Foundation Model Revolution</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:16px">
    Traditional forecasting methods are <strong>local</strong>: ARIMA is fitted to one firm's history from scratch. Each model has zero awareness of any other firm, sector, or macroeconomic pattern. Foundation Models break this constraint by learning <em>universal temporal patterns</em> from billions of observations before ever seeing your data.
  </p>
  <table class="data-table">
    <thead><tr><th>Dimension</th><th>ARIMA</th><th>LSTM (deep learning)</th><th>Chronos-Bolt (Foundation Model)</th></tr></thead>
    <tbody>
      <tr><td>Training data</td><td>One firm's history</td><td>Manual dataset curation</td><td>Billions of global time series (finance, energy, weather, retail)</td></tr>
      <tr><td>Inference mode</td><td>Fit-then-predict (per firm)</td><td>Fine-tune on target domain</td><td><strong>Zero-shot</strong> — no re-training needed</td></tr>
      <tr><td>Uncertainty</td><td>Point forecast only</td><td>Deterministic</td><td>Full probability distribution (P10/P50/P90)</td></tr>
      <tr><td>Handles complexity</td><td>Linear patterns only</td><td>Non-linear, but requires large N</td><td>Non-linear patterns from pre-training — generalizes to small N</td></tr>
    </tbody>
  </table>
  <div class="analogy"><strong>Analogy:</strong> ARIMA is like a student who crams the night before each exam — it knows only one subject. Chronos-Bolt is like a physician with 12 years of medical school: it has internalized patterns from thousands of patients before meeting yours, and applies that broad knowledge instantly.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🗣️</span> How Chronos Reads Numbers Like Language</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:16px">
    GPT-4 tokenizes text into sub-word tokens, processes them through a Transformer, and predicts the next token. Chronos applies exactly this architecture to time series — replacing text tokens with quantized numerical bins.
  </p>
  <div class="step-list">
    <div class="step-item"><div class="step-num">1</div><div class="step-body">
      <h4>Mean Scaling (Normalization)</h4>
      <p>Each input series is divided by its in-context mean absolute value. This makes AMETEK (mean ROA ≈ 0.022) and Cleveland-Cliffs (mean ROA ≈ 0.001) comparable in the model's "eyes" — it sees the <em>shape</em> of the pattern, not the scale.</p>
    </div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-body">
      <h4>Quantization → Finite Vocabulary</h4>
      <p>Scaled values are mapped to one of 4,096 discrete bins ("tokens"). The range [−∞, +∞] becomes a vocabulary of size 4,096 — exactly like the 50,000-token vocabulary of a language model. Each quarterly ROA observation becomes one discrete token.</p>
    </div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-body">
      <h4>Patch Tokenization (Chronos-Bolt's Key Innovation)</h4>
      <p>Instead of one token per time step, Chronos-Bolt groups multiple consecutive time steps into one "patch" — a short window that becomes a single representation. A 10-quarter patch becomes one token. This expands the effective context window 10× and speeds inference dramatically compared to the original Chronos model.</p>
      <div class="callout info" style="margin-top:8px"><strong>Context window:</strong> Chronos-Bolt-Base can process up to 2,048 tokens — with patch size 10, that represents 20,480 time steps. Even a 200-year quarterly series fits in context.</div>
    </div></div>
    <div class="step-item"><div class="step-num">4</div><div class="step-body">
      <h4>Autoregressive Decoding → Probability Distribution</h4>
      <p>The T5 Transformer decoder generates one future token at a time, sampling from a learned probability distribution at each step. Repeating this process 100+ times produces a distribution of possible futures — the raw material for P10, P50, P90.</p>
    </div></div>
  </div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🚫</span> Zero-Shot Inference — Why Fine-Tuning Destroys the Experiment</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    <strong>Zero-shot</strong>: Apply the pre-trained model directly, no adaptation on study data whatsoever.
  </p>
  <table class="data-table">
    <thead><tr><th>Protocol</th><th>What the Model Learns</th><th>Effect on Our Test</th></tr></thead>
    <tbody>
      <tr><td style="color:var(--accent-green)">Zero-shot ✓</td><td>Nothing from our data — pure pre-trained knowledge</td><td>Any advantage reflects universal pattern recognition. Scientifically valid.</td></tr>
      <tr><td style="color:var(--accent-red)">Fine-tuned ✗</td><td>Linear patterns in our training firms' ROA histories</td><td>Model adapts to local structure — becomes a sophisticated local model, not a universal one. Comparison is meaningless.</td></tr>
    </tbody>
  </table>
  <div class="callout warning"><strong>The confound:</strong> Fine-tuning on Compustat data would teach Chronos the same linear patterns ARIMA captures. Its advantage in high-NLI firms would shrink artificially — not because NLI doesn't moderate AI advantage, but because we've crippled the AI model's generality.</div>
</div>

<div class="card">
  <div class="card-title"><span class="icon">🎯</span> Probabilistic Forecasting: The Cone of Uncertainty</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    Chronos doesn't predict one number. It predicts a full distribution. We summarize it with three quantiles:
  </p>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-abbr" style="color:var(--accent-red)">P10</div>
      <div class="metric-name">10th Percentile (Pessimistic)</div>
      <div class="metric-desc">The model estimates a 90% chance actual ROA will be <em>above</em> this value. Think of it as the downside risk boundary for strategic planning.</div>
    </div>
    <div class="metric-card">
      <div class="metric-abbr" style="color:var(--accent-green)">P50</div>
      <div class="metric-name">Median (Point Forecast)</div>
      <div class="metric-desc">The model's "best single guess." Used as the equivalent to ARIMA's point prediction for MASE calculation. Half of sampled futures fall above, half below.</div>
    </div>
    <div class="metric-card">
      <div class="metric-abbr" style="color:var(--accent-blue)">P90</div>
      <div class="metric-name">90th Percentile (Optimistic)</div>
      <div class="metric-desc">The model estimates only a 10% chance actual ROA will be <em>above</em> this value. Captures the upside tail for scenario analysis.</div>
    </div>
  </div>
  <div class="section-label">Cone Width as a Complexity Signal</div>
  <table class="data-table">
    <thead><tr><th>Firm Type</th><th>Expected Cone Width (P90−P10)</th><th>Interpretation</th></tr></thead>
    <tbody>
      <tr><td>AMETEK (Low NLI, RBV)</td><td>Narrow ≈ 0.003–0.005</td><td>Model is confident — performance is predictably stable. Narrow interval is well-calibrated.</td></tr>
      <tr><td>Cleveland-Cliffs (High NLI, Hypercompetitive)</td><td>Wide ≈ 0.08–0.15</td><td>Model acknowledges deep uncertainty — correctly reflects strategic complexity. Wide interval, high WQL weight.</td></tr>
    </tbody>
  </table>
</div>

<div class="card">
  <div class="card-title"><span class="icon">⚙️</span> AutoGluon Implementation: Expanding Window Backtest</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    We use an <strong>expanding window</strong> — the training set grows with each evaluation origin, simulating a real analyst who updates forecasts each quarter. This is more realistic than a rolling fixed-window, where early data is discarded.
  </p>
  <table class="data-table">
    <thead><tr><th>Origin</th><th>Training Window</th><th>Holdout Target</th><th>Training N</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>2014-Q1 → 2022-Q4</td><td>2023-Q1</td><td>36 quarters</td></tr>
      <tr><td>2</td><td>2014-Q1 → 2023-Q1</td><td>2023-Q2</td><td>37 quarters</td></tr>
      <tr><td>3</td><td>2014-Q1 → 2023-Q2</td><td>2023-Q3</td><td>38 quarters</td></tr>
      <tr><td>…</td><td>…</td><td>…</td><td>…</td></tr>
      <tr><td>8</td><td>2014-Q1 → 2024-Q3</td><td>2024-Q4</td><td>43 quarters</td></tr>
    </tbody>
  </table>
  <pre><code><span class="code-kw">from</span> autogluon.timeseries <span class="code-kw">import</span> TimeSeriesDataFrame, TimeSeriesPredictor

<span class="code-cm"># Format data for AutoGluon</span>
ts_df = TimeSeriesDataFrame.<span class="code-fn">from_data_frame</span>(
    df[[<span class="code-str">'gvkey'</span>, <span class="code-str">'cal_quarter'</span>, <span class="code-str">'ROA_w'</span>]],
    id_column=<span class="code-str">'gvkey'</span>,
    timestamp_column=<span class="code-str">'cal_quarter'</span>
)

<span class="code-cm"># Fit predictor (zero-shot — Chronos is pre-trained, no fitting on our data)</span>
predictor = <span class="code-fn">TimeSeriesPredictor</span>(
    prediction_length=<span class="code-num">1</span>,          <span class="code-cm"># one quarter ahead</span>
    quantile_levels=[<span class="code-num">0.1</span>, <span class="code-num">0.5</span>, <span class="code-num">0.9</span>],
    eval_metric=<span class="code-str">'WQL'</span>
).<span class="code-fn">fit</span>(
    ts_df,
    hyperparameters={<span class="code-str">"Chronos"</span>: {<span class="code-str">"model_path"</span>: <span class="code-str">"amazon/chronos-bolt-base"</span>}},
    skip_model_selection=<span class="code-kw">True</span>   <span class="code-cm"># use Chronos only</span>
)

<span class="code-cm"># Expanding window backtest over 2023-2024 (8 quarterly origins)</span>
predictions = predictor.<span class="code-fn">backtest_predictions</span>(
    data=ts_df,
    prediction_length=<span class="code-num">1</span>,
    num_val_windows=<span class="code-num">8</span>,     <span class="code-cm"># 8 holdout quarters</span>
    val_step_size=<span class="code-num">1</span>         <span class="code-cm"># expand by one quarter each time</span>
)</code></pre>
</div>

<div class="card">
  <div class="card-title"><span class="icon">📏</span> Weighted Quantile Loss (WQL) — Evaluating Uncertainty</div>
  <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:14px">
    MASE measures point forecast accuracy (P50 vs. actual). <strong>WQL</strong> evaluates the full distribution — does the P10 actually contain 10% of outcomes? Does the 80% interval (P10–P90) cover 80% of actuals?
  </p>
  <div class="formula">WQL = (2/|I|·T) · Σᵢ Σₜ Σₛ wₛ · ρₛ(yᵢₜ, q̂ᵢₜˢ)</div>
  <div class="formula">ρₛ(y, q̂) = (1−s)·max(q̂−y, 0) + s·max(y−q̂, 0)</div>
  <div class="eq-breakdown">
    <div class="eq-breakdown-header">📐 WQL Equation Components</div>
    <div class="eq-row"><div class="eq-sym">WQL</div><div class="eq-def"><strong>Weighted Quantile Loss</strong> — a single number scoring the whole probability forecast. Lower is better. WQL = 0 means perfect calibration; WQL = 1 means the predictions are completely uninformative</div></div>
    <div class="eq-row"><div class="eq-sym">|I|</div><div class="eq-def"><strong>Number of firms (series)</strong> — the total count of firms being evaluated. Dividing by |I| averages the loss across firms, so WQL is not inflated by having more firms</div></div>
    <div class="eq-row"><div class="eq-sym">T</div><div class="eq-def"><strong>Number of forecast time steps</strong> — how many quarters were evaluated. In our backtest this is 8 (Q1-2023 through Q4-2024)</div></div>
    <div class="eq-row"><div class="eq-sym">Σᵢ Σₜ Σₛ</div><div class="eq-def"><strong>Triple sum</strong> — aggregate over all firms (i), all time periods (t), and all quantile levels (s = 0.1, 0.5, 0.9). Every firm, every quarter, every quantile contributes</div></div>
    <div class="eq-row"><div class="eq-sym">wₛ</div><div class="eq-def"><strong>Quantile weight</strong> — gives each quantile level its proper weight. AutoGluon uses wₛ = 2·min(s, 1−s), so P50 gets weight 1.0, P10 and P90 get weight 0.2. This ensures the median forecast matters most</div></div>
    <div class="eq-row"><div class="eq-sym">ρₛ(y, q̂)</div><div class="eq-def"><strong>Pinball (quantile) loss function</strong> — the formula below. Penalizes over-prediction and under-prediction asymmetrically, depending on quantile level <em>s</em></div></div>
    <div class="eq-row"><div class="eq-sym">yᵢₜ</div><div class="eq-def"><strong>Actual realized ROA</strong> for firm <em>i</em> in quarter <em>t</em> — the ground truth value from WRDS Compustat</div></div>
    <div class="eq-row"><div class="eq-sym">q̂ᵢₜˢ</div><div class="eq-def"><strong>Predicted quantile at level s</strong> for firm <em>i</em> in quarter <em>t</em>. E.g., q̂ᵢₜ⁰·¹ is the P10 forecast — the model's estimate of the 10th percentile of next quarter's ROA distribution</div></div>
    <div class="eq-row"><div class="eq-sym">(1−s)·max(q̂−y, 0)</div><div class="eq-def"><strong>Over-prediction penalty</strong> — triggered when the forecast q̂ exceeds the actual y. For P90 (s=0.9), the weight (1−0.9)=0.1 is small — over-predicting the upside tail is less severely penalized. For P10 (s=0.1), weight (1−0.1)=0.9 — getting the downside wrong matters a lot</div></div>
    <div class="eq-row"><div class="eq-sym">s·max(y−q̂, 0)</div><div class="eq-def"><strong>Under-prediction penalty</strong> — triggered when the actual y exceeds the forecast q̂. For P90 (s=0.9), weight 0.9 means severely penalizing when the actual exceeds P90. This incentivizes the model to set P90 high enough to actually capture the top 10% of outcomes</div></div>
  </div>
  <table class="data-table">
    <thead><tr><th>WQL Value</th><th>Interpretation</th></tr></thead>
    <tbody>
      <tr><td style="color:var(--accent-green)">&lt; 0.05</td><td>Excellent calibration — intervals are tight and accurate</td></tr>
      <tr><td style="color:var(--accent-amber)">0.05 – 0.15</td><td>Acceptable — some over/under-confidence</td></tr>
      <tr><td style="color:var(--accent-red)">&gt; 0.15</td><td>Poor calibration — intervals are systematically wrong</td></tr>
    </tbody>
  </table>
  <div class="callout info"><strong>The key WQL insight for this study:</strong> If Chronos achieves lower WQL on High-NLI firms than ARIMA (which only outputs a point forecast, implicitly zero-width intervals), it proves the model correctly quantifies uncertainty in complex environments — not just predicts better on average.</div>
</div>

<div class="card" style="border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.04)">
  <div class="card-title"><span class="icon">📋</span> Exercise 4A — Interpreting Real Quantile Forecasts</div>
  <p style="color:var(--text-secondary);font-size:13.5px;line-height:1.7;margin-bottom:14px">
    Suppose Chronos-Bolt produces these Q1-2024 forecasts for three firms from our dataset:
  </p>
  <table class="data-table">
    <thead><tr><th>Firm</th><th>P10</th><th>P50</th><th>P90</th><th>Actual ROA</th><th>Cone Width</th></tr></thead>
    <tbody>
      <tr><td>AMETEK INC</td><td>0.0195</td><td>0.0218</td><td>0.0241</td><td>0.02092</td><td>?</td></tr>
      <tr><td>American Airlines</td><td>−0.0182</td><td>0.0010</td><td>0.0202</td><td>−0.00485</td><td>?</td></tr>
      <tr><td>Cleveland-Cliffs</td><td>−0.0621</td><td>−0.0015</td><td>0.0591</td><td>−0.00389</td><td>?</td></tr>
    </tbody>
  </table>
  <div class="step-list" style="margin-top:16px">
    <div class="step-item"><div class="step-num">1</div><div class="step-body">
      <h4>Compute the Cone Width (P90 − P10) for each firm</h4>
      <div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">AMETEK: 0.0241−0.0195 = <strong>0.0046</strong> (very narrow — confident). AA: 0.0202−(−0.0182) = <strong>0.0384</strong> (moderate). Cleveland-Cliffs: 0.0591−(−0.0621) = <strong>0.1212</strong> (very wide — highly uncertain). The cone width pattern mirrors our expectation: wider cones for higher-complexity firms.</div></div>
    </div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-body">
      <h4>Which firms had actual ROA fall WITHIN the P10–P90 interval?</h4>
      <div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">AMETEK: Actual 0.02092 is within [0.0195, 0.0241] ✓. American Airlines: Actual −0.00485 is within [−0.0182, 0.0202] ✓. Cleveland-Cliffs: Actual −0.00389 is within [−0.0621, 0.0591] ✓. All three are inside — good calibration for these quarters. A well-calibrated model should capture ~80% of actuals in the P10–P90 interval.</div></div>
    </div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-body">
      <h4>Compute MASE numerator for each firm using P50 as the point forecast</h4>
      <p>Given training-period naive MAEs: AMETEK = 0.000259, AA = 0.002296, Cleveland-Cliffs = 0.007868</p>
      <div class="exercise-input" style="margin-top:8px;"><textarea placeholder="Type your answer here..." style="width:100%; min-height:60px; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.2); color:white; margin-bottom:10px; font-family:Inter, sans-serif; resize:vertical;"></textarea><br><button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.22)'" onmouseout="this.style.background='rgba(59,130,246,0.12)'">Check Answer</button><div class="callout success" style="margin-top:12px; display:none;">AMETEK: |0.02092−0.0218|/0.000259 = 0.00088/0.000259 = <strong>MASE=3.40</strong> (worse than naive — P50 missed by a notable amount). AA: |−0.00485−0.0010|/0.002296 = 0.00585/0.002296 = <strong>MASE=2.55</strong>. Cleveland-Cliffs: |−0.00389−(−0.0015)|/0.007868 = 0.00239/0.007868 = <strong>MASE=0.30</strong> — Chronos wins decisively here, consistent with High-NLI advantage.</div></div>
    </div></div>
  </div>
</div>

${quizBlock(4, [{"q": "Chronos-Bolt is described as a 'zero-shot' forecasting model. What does this mean in the context of predicting a specific firm's ROA?", "opts": ["The model is run with zero regularization parameters, preventing overfitting to the training data", "The model makes forecasts for a firm without being retrained on that firm's data — it applies patterns learned from hundreds of millions of global time series directly to a new, unseen firm's ROA series", "The model outputs exactly zero quarters of forecast as a pre-processing validation step", "Zero-shot means the model's first forecast of each session is discarded as a calibration observation"], "correct": 1, "fb": "Zero-shot inference is one of the most conceptually important ideas in modern foundation model forecasting, and it marks a fundamental departure from how we think about forecasting models. The term comes from the AI/NLP literature. A 'zero-shot' model receives a task it has NEVER been explicitly trained on and performs it using only patterns internalized during pre-training on a large, diverse corpus. For Chronos-Bolt, the pre-training corpus consisted of roughly 200 million time series drawn from finance, retail, energy, weather, transportation, healthcare, and dozens of other domains. During this pre-training, the model developed deep 'intuitions' about time series patterns — what exponential growth looks like, how mean-reversion behaves, what recovery patterns after shocks resemble. When you feed AMETEK's 56-quarter ROA series to Chronos, it does not run any optimization or gradient descent to fit parameters to AMETEK's data. Instead, it performs a single forward pass through the transformer — computing attention over the context window — and outputs a probability distribution over future values. This forward pass takes milliseconds and involves no 'learning' about AMETEK specifically. The scientific importance: because no firm-specific training occurs, there is zero risk of data leakage from the holdout period. Chronos genuinely cannot 'cheat' by learning from the test observations — it never sees them during any training phase. This makes zero-shot comparisons to ARIMA scientifically fair — ARIMA also uses only pre-holdout training data for its parameter estimates.", "wf": ["Regularization parameters (like L1/L2 penalties in regression, or dropout in neural networks) are completely separate hyperparameters from the concept of zero-shot inference. Zero-shot refers to the INFERENCE PARADIGM — the model is applied to unseen data types without task-specific training. You could have a zero-shot model with extensive regularization or no regularization at all; they are orthogonal concepts. Chronos-Bolt does have its own architectural choices (attention mechanisms, normalization layers) but the 'zero' in zero-shot has nothing to do with regularization coefficients.", "", "The forecast horizon (how many future periods the model predicts) is a separate hyperparameter. In this study, Chronos forecasts 8 quarters ahead. 'Zero-shot' describes the relationship between the model and the target domain (no domain-specific training), not the length of the forecast. The phrase 'discarding first forecasts' describes warm-up steps in sequential neural network models (RNNs), which is again a different concept.", "Discarding initial forecasts for 'calibration' is a concept that applies to MCMC simulation chains (burn-in) or to stateful RNN models (where initial hidden states need to warm up). Chronos-Bolt is a transformer that processes an entire context window in parallel — it has no 'warm-up phase' and its first output token is just as valid as its last."]}, {"q": "Chronos-Bolt tokenizes time series values into 4,096 bins. Given that ROA for our sample spans roughly [−0.06, +0.06], approximately how wide is each bin, and why does this level of quantization precision matter for forecasting firm profitability?", "opts": ["Each bin is approximately 2.9 × 10⁻⁵ ROA units wide; this precision allows the model to represent ROA differences of less than 0.003% — far finer than any managerially meaningful change", "Each bin is approximately 0.029 ROA units (2.9%); this is too coarse for financial forecasting and significantly degrades Chronos's accuracy compared to continuous-output models", "Bin width is irrelevant — the model outputs continuous probability distributions not discrete bins", "Each bin covers one calendar quarter since 4,096 ÷ 16 years = 256 bins per year"], "correct": 0, "fb": "Total range = 0.06 − (−0.06) = 0.12 ROA units. Divided by 4,096 bins: 0.12/4096 ≈ 0.0000293 ROA units per bin ≈ 2.9 × 10⁻⁵. Let's contextualize this: the typical quarterly ROA swing between two adjacent quarters for our sample firms ranges from 0.001 to 0.005. Each bin at width 0.0000293 means each 'step' in ROA movement spans approximately 1/34th to 1/170th of a typical quarterly swing. This is extraordinarily fine resolution — finer than the meaningful economic distinctions we're trying to predict. Why does this matter? The tokenization transforms a continuous regression problem (predict a real number) into a classification problem (predict which of 4,096 buckets the next observation falls into). Transformers are extraordinarily good at classification — the entire architecture was designed for categorical prediction (originally predicting the next word from a vocabulary). By quantizing to 4,096 categories, Chronos can use the full expressive power of the attention mechanism and the softmax output layer to produce calibrated probability distributions over future ROA levels. The output is then a probability mass function across 4,096 bins — from which you can compute any quantile: P10, P50, P90, etc. The choice of 4,096 specifically is a balance between precision (more bins → finer resolution) and computational tractability (more categories → larger softmax output dimension → more memory and compute).", "wf": ["", "2.9 × 10⁻⁵ is not 0.029. The decimal place matters critically: 0.12/4096 = 0.0000293 (approximately 3 hundred-thousandths), not 0.029 (nearly 3%). At 0.029 per bin, you'd have only 4–5 bins covering the typical ROA range for a stable firm — which would be far too coarse. The actual 4,096-bin resolution is indeed very fine, providing sub-percentage-point precision in the ROA dimension.", "Chronos does indeed output something structurally similar to a probability distribution, but it's implemented as a probability mass function over discrete bins — not a continuous distribution. The distinction matters: the model's internal computation is categorical (softmax over 4,096 logits). The 'continuous' impression comes from the fact that 4,096 bins are fine enough that the probability mass function approximates a continuous density very well. You could NOT say bin width is irrelevant — the bin width determines the resolution at which uncertainty is expressed and the granularity of the quantile estimates (P10, P50, P90) that the model produces.", "The bins represent VALUE levels (ROA magnitudes), not time periods. The 4,096 bins divide the ROA value space into 4,096 equal-width intervals. Time is represented implicitly by the position of each token in the sequence (positional encoding in the transformer architecture). A completely different set of concepts governs how many time steps can be in the context window (which is determined by the context length hyperparameter, typically 512–2048 time steps for Chronos-Bolt)."]}, {"q": "In the probabilistic backtest, Chronos generates P10, P50, and P90 forecasts. For a particular firm-quarter, the actual ROA falls BELOW the P10 forecast. What does this reveal about model calibration, and how does this event factor into the Weighted Quantile Loss (WQL) calculation?", "opts": ["The event is impossible — by definition, P10 represents the absolute minimum possible forecast, so no actual observation can fall below it", "The model was overconfident for this firm-quarter — it assigned less than 10% probability to outcomes at or below the actual value. The WQL penalizes this using the P10 pinball loss: L_{0.1}(y,q̂) = 0.1·(y−q̂) when y ≥ q̂, or L = 0.9·|y−q̂| when y < q̂. Since y < P10, the firm is in the second case, which generates a larger penalty proportional to how far below P10 the actual fell", "The model performed better than expected — actual ROA below P10 means the firm underperformed its own forecast, which is an ARIMA advantage", "This situation reveals only that the model's MASE > 1, with no implications for WQL"], "correct": 1, "fb": "Understanding this calibration failure requires grasping what a probabilistic forecast 'promises.' When Chronos outputs P10 = 0.015, it is saying: 'My probability distribution for this firm-quarter assigns exactly 10% of its mass to ROA values at or below 0.015.' In other words, the model claims there is a 90% chance actual ROA will be above 0.015. If actual ROA = 0.008 (which is below P10 = 0.015), then the event the model said had only a 10% chance of happening ACTUALLY HAPPENED. The model was overconfident — it placed too little probability in the left tail. Now the pinball loss calculation: L_{0.1}(y, q̂) has two branches. When y ≥ q̂ (actual is at or above the quantile estimate): L = (1−0.1)·(y−q̂) = 0.9·(y−q̂). When y < q̂ (actual is BELOW the quantile estimate, our case): L = 0.1·|y−q̂|. The pinball loss (check function) for quantile τ is: ρ_τ(u) = (τ−1)·u if u < 0, and τ·u if u ≥ 0, where u = y − q̂. For τ=0.1 and u = y−q̂ < 0 (actual < predicted): ρ = (0.1−1)·(y−q̂) = (−0.9)·(y−q̂) = 0.9·|y−q̂|. This is 9 times larger than the ρ = 0.1·|y−q̂| penalty when actual exceeds P10. The asymmetry is intentional: for P10, being WRONG by placing actual below the quantile is penalized MORE heavily than being wrong in the other direction, forcing the model to be honest about downside tail coverage.", "wf": ["P10 is a QUANTILE of a probability distribution, not an absolute minimum. A probability distribution extends in both directions — assigning small but non-zero probability to extreme outcomes on both tails. P10 maps to the value where exactly 10% of the cumulative distribution sits to the LEFT. Values below P10 are not 'impossible' — they simply occur with probability less than 10% according to the model. If no actual observations can fall below P10, the model would be perfectly calibrated only if it were assigning ZERO probability to outcomes below P10, which would mean the model thinks those outcomes are literally impossible. That is rarely the case for any well-specified probability forecast.", "", "The actual ROA falling below the model's P10 is unambiguously a calibration failure for Chronos — it reflects that the model did not predict this level of downside adequately. It has no direct implication for whether ARIMA performs better or worse on this observation. The two models produce separate forecasts that are evaluated independently on accuracy metrics; falling below P10 tells us about the quality of the PROBABILISTIC forecast, not about the comparative POINT FORECAST accuracy between models.", "MASE and WQL measure completely different aspects of forecast quality. MASE measures POINT forecast accuracy (how close the P50 median forecast is to the actual value relative to a naive baseline). WQL measures PROBABILISTIC forecast accuracy (how well-calibrated the full probability distribution is across all quantiles P10, P50, P90 simultaneously). An actual ROA below P10 contributes to WQL through the pinball loss calculation for the P10 quantile; its implication for MASE depends on how far the P50 (median) forecast was from the actual."]}, {"q": "The Weighted Quantile Loss formula applies weight w_s = 2·min(s, 1−s) to each quantile level s. What weight does P50 receive, and WHY does the formula give the median the maximum weight among all quantiles in the standard evaluation set {P10, P50, P90}?", "opts": ["P50 receives weight 0.5, equal to its quantile level — the formula treats all quantiles proportionally to their position", "P50 receives weight 1.0 — the maximum — because the formula 2·min(s, 1−s) achieves its peak value at s=0.5, reflecting that median forecasts are most critical for central tendency accuracy and decision-making under typical conditions", "P50 receives weight 2.0 — the factor of 2 in the formula means the median is always doubled relative to other quantiles", "This information cannot be determined without knowing the specific number of quantiles evaluated — weight distributions change with the evaluation set"], "correct": 1, "fb": "Let's compute explicitly for all three quantiles: At s = 0.1 (P10): w = 2·min(0.1, 1−0.1) = 2·min(0.1, 0.9) = 2·0.1 = **0.2**. At s = 0.5 (P50): w = 2·min(0.5, 1−0.5) = 2·min(0.5, 0.5) = 2·0.5 = **1.0**. At s = 0.9 (P90): w = 2·min(0.9, 1−0.9) = 2·min(0.9, 0.1) = 2·0.1 = **0.2**. The median score is five times heavier than either tail quantile. Why? The mathematical reasoning: the function 2·min(s, 1−s) is a tent function — it increases linearly from 0 at s=0, peaks at 1.0 at s=0.5, and decreases linearly back to 0 at s=1. This corresponds directly to the absolute value function for probability elicitation: the penalty for being wrong at the median is symmetric and maximal, because the median has equal probability mass on both sides. Intuitively: if you're building a business forecast and must choose ONE forecast number as your planning assumption, you'd use the median (P50) — it minimizes expected absolute error. The WQL formula encodes this practical priority mathematically. The tails (P10, P90) receive weight 0.2 — not because they're unimportant (tail risk matters enormously in risk management), but because in typical forecasting practice, the central estimate carries five times more decision-making weight than the tail scenarios in most planning applications.", "wf": ["Weight 0.5 would come from NOT applying the factor of 2: min(0.5, 0.5) = 0.5. But the formula explicitly includes the factor of 2: w = 2·min(s, 1−s). The factor of 2 scales the weights so that the maximum weight equals 1.0 (at s=0.5), not 0.5. This is essentially a normalization choice that makes the median weight interpretable as 'unit weight.'", "", "The factor of 2 in the formula does NOT mean all weights are multiplied by 2 relative to some other formula. Rather, it ensures the peak weight at s=0.5 is 1.0 rather than 0.5. P10 and P90 receive weight 0.2 (after the factor of 2 is applied: 2·0.1). Without the factor of 2, they'd receive 0.1 and the median would receive 0.5 — functionally equivalent ratios, just scaled differently. The factor of 2 is a normalization convention.", "The weight formula 2·min(s, 1−s) is a function ONLY of the quantile level s — it does not depend on how many quantiles are in the evaluation set. Whether you evaluate at 3 quantiles (P10, P50, P90) or 9 quantiles (P10 through P90 in 10% steps), P50 always gets weight 1.0, P10 always gets weight 0.2, and P90 always gets weight 0.2. The total WQL score changes with the number of quantiles (because more terms are summed), but individual weights are fixed properties of each quantile level."]}, {"q": "Why is fine-tuning Chronos on firm-specific ROA data explicitly PROHIBITED in the study's backtest protocol, and what would happen statistically if this prohibition were violated?", "opts": ["Fine-tuning is too computationally expensive and would take weeks of GPU time for the study's sample of firms", "Fine-tuning on firm-specific data would constitute data leakage — the model would learn statistical properties of the holdout period through exposure to each firm's recent history (which correlates with the holdout), making the backtest results scientifically invalid", "Chronos-Bolt's architecture does not technically support fine-tuning — the pre-training process permanently locks the model weights", "Fine-tuning requires more than 100 observations per firm, and most firms in the sample have fewer than 80 quarterly observations"], "correct": 1, "fb": "Data leakage is arguably the single most important methodological concept in any machine learning evaluation, and this prohibition is where the study's rigor is most at stake. Here's the precise mechanism of how a seemingly innocent fine-tuning step would contaminate results: Suppose a firm has 60 quarterly observations (2009Q1–2024Q4). The holdout is the last 8 quarters (2023Q1–2024Q4). TRAINING DATA available = quarters 1–52 (2009Q1–2022Q4). If we fine-tuned Chronos on all 60 quarters (including the holdout), then during fine-tuning gradient updates, the model would observe 2023Q1–2024Q4 ROA values DIRECTLY. The model weights would adjust to reflect patterns in those 8 quarters. When we then evaluate on the holdout, we're measuring how well a model that HAS SEEN the holdout performs on the holdout — which is not a measure of forecasting ability, it's a measure of memory. But even fine-tuning on ONLY the training data (quarters 1–52) would be subtle leakage: the 52 training quarters are statistically correlated with the subsequent 8 holdout quarters through the autocorrelation structure of the series. The firm's idiosyncratic volatility, mean level, mean-reversion speed, and regime characteristics in quarters 1–52 are informative about the firm's parameters in quarters 53–60. Fine-tuning extracts and encodes this information into Chronos's weights. The ARIMA baseline uses ZERO extra-information advantage — it can only access up to quarter 52. Fine-tuned Chronos would have more 'knowledge' about the specific firm than ARIMA, making the comparison unfair.", "wf": ["While fine-tuning large models can indeed be computationally expensive, this is NOT the reason for the prohibition. On modern hardware, fine-tuning a small foundation model like Chronos-Bolt on a single firm's 52-quarter series takes seconds, not weeks. Even fine-tuning on all 150 study firms simultaneously would take hours, not weeks. The prohibition is about scientific validity, not computational cost.", "", "Chronos-Bolt (like all transformer-based foundation models) explicitly SUPPORTS fine-tuning. Amazon, which developed Chronos, provides fine-tuning APIs and documentation. The model weights are not 'locked' — they are regular PyTorch tensors that can be updated via gradient descent like any neural network. The zero-shot evaluation is a METHODOLOGICAL DESIGN CHOICE, not an architectural constraint.", "There is no technical minimum observation requirement for fine-tuning. Neural networks can overfit to very small datasets, but there's no hard cutoff of 100 observations. More importantly, this is not the reason for the prohibition. With 80 quarterly observations, fine-tuning on the first 72 (holdout-excluded) would be computationally feasible and technically valid for other purposes — the prohibition is strictly about experimental design integrity."]}])}`;
}
