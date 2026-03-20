/* ═══════════════════════════════════════════════════════════════
   app_data.js — Updated data loading: wrds_full CSV + firm stats
   Also updates m6 Explorer to show "Download R Code" panel
   ═══════════════════════════════════════════════════════════════ */

// Override loadData to use the full WRDS CSVs
async function loadData() {
  try {
    const [firmRes, secRes, statsRes] = await Promise.all([
      fetch('data/tutorial_sample_data.csv'),
      fetch('data/tutorial_sector_summary.csv'),
      fetch('data/tutorial_firm_stats.csv'),
    ]);
    const [firmText, secText, statsText] = await Promise.all([
      firmRes.text(), secRes.text(), statsRes.text()
    ]);

    state.firmData   = Papa.parse(firmText,  { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
    state.sectorData = Papa.parse(secText,   { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
    state.firmStats  = Papa.parse(statsText, { header: true, dynamicTyping: true, skipEmptyLines: true }).data;

    // Build unique firm list enriched with stats
    const seen = {};
    state.firmData.forEach(r => {
      if (!seen[r.gvkey]) seen[r.gvkey] = {
        gvkey:  r.gvkey,
        name:   (r.conm||'').trim(),
        sector: (r.Sector_clean||'').trim()
      };
    });
    // Merge firm stats
    const statsMap = {};
    (state.firmStats||[]).forEach(s => { statsMap[s.gvkey] = s; });
    state.firms = Object.values(seen)
      .map(f => ({ ...f, stats: statsMap[f.gvkey] || {} }))
      .sort((a,b) => a.name.localeCompare(b.name));

    console.log(`Data loaded: ${state.firmData.length} rows, ${state.firms.length} firms, ${state.sectorData.length} sectors`);
  } catch(e) {
    console.warn('Data load failed (run from local server):', e.message);
  }
}

// ─── R CODE GENERATOR ─────────────────────────────────────────────
// Generates a complete, downloadable R analysis script for any selected firm
function generateRScript(gvkey, firmName) {
  const safeName = (firmName||'').replace(/[^A-Z0-9]/gi,'_').toLowerCase();
  return `# ═══════════════════════════════════════════════════════════════
# Chronos Tutorial: Filter-Then-Test Analysis
# Firm: ${firmName} (GVKEY: ${gvkey})
# Generated: ${new Date().toISOString().split('T')[0]}
# ═══════════════════════════════════════════════════════════════

# REQUIRED PACKAGES
pkgs <- c("dplyr","lubridate","ggplot2","forecast","tseries",
          "strucchange","DescTools","urca")
for(p in pkgs) { if(!require(p,character.only=TRUE))
  install.packages(p, repos="https://cran.rstudio.com/") }

# ── STEP 0: LOAD DATA ─────────────────────────────────────────────
# Place tutorial_sample_data.csv in your working directory
df_all <- read.csv("data/tutorial_sample_data.csv", stringsAsFactors = FALSE)
cat("Loaded:", nrow(df_all), "rows across", length(unique(df_all$gvkey)), "firms\\n")

# Filter to focal firm
df <- df_all %>%
  filter(gvkey == ${gvkey}) %>%
  arrange(cal_quarter) %>%
  mutate(ROA_w = as.numeric(ROA_w))

cat("Firm '${firmName}': n =", nrow(df), "quarters\\n")

# ── STEP 1: DESCRIPTIVE STATISTICS ───────────────────────────────
cat("\\n── Descriptive Statistics ──\\n")
cat("Mean ROA:  ", round(mean(df$ROA_w, na.rm=TRUE), 5), "\\n")
cat("SD ROA:    ", round(sd(df$ROA_w,   na.rm=TRUE), 5), "\\n")
cat("Min ROA:   ", round(min(df$ROA_w,  na.rm=TRUE), 5), "\\n")
cat("Max ROA:   ", round(max(df$ROA_w,  na.rm=TRUE), 5), "\\n")
cat("CV (proxy):   ", round(abs(sd(df$ROA_w,na.rm=TRUE)/mean(df$ROA_w,na.rm=TRUE)), 3), "\\n")

# Plot time series
p1 <- ggplot(df, aes(x=cal_quarter, y=ROA_w)) +
  geom_line(color="#3b82f6", linewidth=1) +
  geom_hline(yintercept=mean(df$ROA_w,na.rm=TRUE), color="#10b981", linetype="dashed") +
  labs(title=paste("ROA Time Series:", "${firmName}"),
       x="Calendar Quarter", y="Winsorized ROA",
       caption="Dashed line = mean ROA") +
  theme_minimal()
print(p1)

# ── STEP 2: STATIONARITY TESTING ─────────────────────────────────
cat("\\n── Stationarity Tests ──\\n")
ts_data <- ts(df$ROA_w, frequency=4)

# ADF test (H0: unit root)
adf_result <- adf.test(ts_data, k=4)
cat("ADF test: p =", round(adf_result$p.value, 4),
    ifelse(adf_result$p.value < 0.05, "→ Stationary (reject unit root)",
                                      "→ Non-stationary (fail to reject)"), "\\n")

# KPSS test (H0: stationary)
kpss_result <- ur.kpss(ts_data, type="mu")
cat("KPSS stat:", round(kpss_result@teststat, 4),
    "(critical 5%:", kpss_result@cval[2], ")\\n")

d_order <- ifelse(adf_result$p.value > 0.05, 1L, 0L)
cat("Selected differencing order d =", d_order, "\\n")

# ── STEP 3: STRUCTURAL BREAK DETECTION ───────────────────────────
cat("\\n── Structural Break Detection (Bai-Perron) ──\\n")
bp_test  <- breakpoints(ts_data ~ 1, breaks=5)
bp_dates <- breakpoints(bp_test)$breakpoints
cat("Breakpoints detected at observation indices:", bp_dates, "\\n")
if(length(bp_dates) > 0) {
  cat("Calendar quarters:", df$cal_quarter[bp_dates], "\\n")
}

# Build break dummy matrix for ARIMA
if(length(bp_dates) > 0) {
  xreg_mat <- matrix(0L, nrow=length(ts_data), ncol=length(bp_dates))
  for(i in seq_along(bp_dates)) xreg_mat[bp_dates[i]:nrow(xreg_mat), i] <- 1L
} else {
  xreg_mat <- NULL
}

# ── STEP 4: AUTO-ARIMA FITTING ────────────────────────────────────
cat("\\n── Auto-ARIMA Model Selection ──\\n")
fit <- auto.arima(ts_data,
                  d        = d_order,
                  xreg     = xreg_mat,
                  seasonal = FALSE,
                  stepwise = FALSE,
                  ic       = "aicc",
                  max.p    = 4, max.q = 4)

cat("Selected model:", as.character(fit), "\\n")
cat("AICc:", round(fit$aicc, 2), "\\n")

# ── STEP 5: LJUNG-BOX WHITENESS TEST (GATEKEEPER) ────────────────
cat("\\n── Ljung-Box Whiteness Test ──\\n")
resid_std <- residuals(fit, standardize=TRUE)
lb <- Box.test(resid_std, lag=10, type="Ljung-Box", fitdf=fit$arma[1]+fit$arma[2])
cat("Ljung-Box(10) p =", round(lb$p.value, 4),
    ifelse(lb$p.value > 0.05, "→ PASS (white noise = proceed to BDS)",
                              "→ FAIL (re-fit before BDS)"), "\\n")

# ── STEP 6: BDS TEST → NLI ────────────────────────────────────────
cat("\\n── BDS Test (Non-Linearity Index) ──\\n")
if(lb$p.value > 0.05) {
  bds_result <- bds.test(resid_std, m=4,
                          eps=seq(0.5,2.0,0.5)*sd(resid_std))
  NLI <- bds_result$statistic[1, 1]   # m=2, eps=0.5*sd
  cat("NLI (BDS z-score, m=2):", round(NLI, 3), "\\n")
  cat("Is_Complex (NLI > 1.96):", NLI > 1.96, "\\n")
  cat("\\nFull BDS output:\\n")
  print(bds_result)
} else {
  cat("Skipping BDS — residuals not white. Re-fit ARIMA first.\\n")
  NLI <- NA
}

# ── STEP 7: NAIVE MASE BASELINE ───────────────────────────────────
cat("\\n── Naive Model Baseline (for MASE denominator) ──\\n")
# Training window: all but last 8 quarters
n_total   <- nrow(df)
n_holdout <- 8
train_roa <- df$ROA_w[1:(n_total-n_holdout)]
naive_mae  <- mean(abs(diff(train_roa)))
cat("Training-period naive MAE:", round(naive_mae, 6), "\\n")
cat("(MASE numerator / this value = MASE)\\n")

# Summary
cat("\\n═══ FILTER-THEN-TEST SUMMARY ═══\\n")
cat("Firm:       ${firmName} (GVKEY: ${gvkey})\\n")
cat("n obs:      ", nrow(df), "\\n")
cat("ARIMA:      ", as.character(fit), "\\n")
cat("LB_Pass:    ", lb$p.value > 0.05, "\\n")
cat("NLI:        ", ifelse(is.na(NLI), "NA", round(NLI,3)), "\\n")
cat("Is_Complex: ", ifelse(is.na(NLI), "NA", NLI > 1.96), "\\n")
cat("Naive MAE:  ", round(naive_mae, 6), "\\n")
`;
}

// Download button handler
function downloadRScript() {
  const sel = document.getElementById('firm-select');
  if (!sel) return;
  const gvkey = parseInt(sel.value);
  const firm = state.firms.find(f => f.gvkey === gvkey) || { name: 'UnknownFirm' };
  const code = generateRScript(gvkey, firm.name);
  const blob = new Blob([code], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `filter_then_test_${firm.name.replace(/[^A-Z0-9]/gi,'_').toLowerCase()}.R`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
