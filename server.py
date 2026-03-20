#!/usr/bin/env python3
"""
server.py — Chronos Tutorial Flask Server
Replaces launch_server.py with a full statistical computation backend.
Run: python3 server.py  (or from the venv: source venv/bin/activate && python server.py)
"""

import os, sys, json, math
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from statsmodels.tsa.stattools import adfuller, kpss
from statsmodels.stats.diagnostic import acorr_ljungbox
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

# ── PATHS ──────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, 'data')
PORT = int(os.environ.get('PORT', 8080))

# ── APP ────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
CORS(app)

# Allow iframe embedding from any origin (for Lovable site integration)
@app.after_request
def allow_iframe(response):
    response.headers.pop('X-Frame-Options', None)
    return response

# ── DATA (loaded once at startup) ──────────────────────────────────
print("Loading WRDS data…", end=' ', flush=True)
try:
    df_all = pd.read_csv(os.path.join(DATA_DIR, 'tutorial_sample_data.csv'))
    df_all['date_proper'] = pd.to_datetime(df_all['date_proper'], errors='coerce')
    df_all = df_all.dropna(subset=['gvkey','ROA_w','date_proper'])
    df_all = df_all.sort_values(['gvkey','date_proper']).reset_index(drop=True)
    print(f"✓  {len(df_all):,} rows, {df_all['gvkey'].nunique()} firms")
except Exception as e:
    print(f"✗  {e}")
    df_all = pd.DataFrame()


# ── HELPERS ────────────────────────────────────────────────────────

def get_firm_roa(gvkey: int):
    """Return sorted ROA array and date labels for a firm."""
    sub = df_all[df_all['gvkey'] == gvkey].copy()
    if sub.empty:
        return None, None, None
    sub = sub.sort_values('date_proper')
    roa    = sub['ROA_w'].values.astype(float)
    labels = sub['year_q'].fillna(sub['date_proper'].dt.strftime('%Y-%m')).tolist()
    name   = str(sub['conm'].iloc[0]).strip() if 'conm' in sub.columns else str(gvkey)
    return roa, labels, name


def aicc(aic: float, n: int, k: int) -> float:
    """AIC corrected for small samples."""
    if n - k - 1 <= 0:
        return float('inf')
    return aic + (2 * k * (k + 1)) / (n - k - 1)


def fit_best_arima(roa: np.ndarray, d: int = 0, max_p: int = 4, max_q: int = 4):
    """Grid search over (p,q) minimising AICc; returns (order, aicc_val, fitted_result)."""
    best_aicc = float('inf')
    best_order = (0, d, 0)
    best_fit   = None
    n = len(roa)
    for p in range(max_p + 1):
        for q in range(max_q + 1):
            if p == 0 and q == 0 and d == 0:
                continue   # degenerate model
            try:
                mdl = ARIMA(roa, order=(p, d, q)).fit()
                k   = p + q + 1 + (1 if d == 0 else 0)   # AR+MA+sigma+(intercept if d=0)
                val = aicc(mdl.aic, n, k)
                if val < best_aicc:
                    best_aicc  = val
                    best_order = (p, d, q)
                    best_fit   = mdl
            except Exception:
                pass
    # Fallback
    if best_fit is None:
        best_fit   = ARIMA(roa, order=(1, d, 0)).fit()
        best_order = (1, d, 0)
    return best_order, best_aicc, best_fit


def bds_test(x: np.ndarray, max_dim: int = 4, epsilon: float = None):
    """
    BDS test for i.i.d. (Brock, Dechert, Scheinkman 1996).
    Returns (nli, pvalue) where nli is the z-score at embedding dimension m=2.
    Falls back to a simple correlation-based proxy if statsmodels BDS fails.
    """
    try:
        from statsmodels.tsa.stattools import bds as sm_bds
        if epsilon is None:
            epsilon = 0.7 * float(np.std(x))
        stat, pval = sm_bds(x, max_dim=max_dim, epsilon=epsilon)
        # stat and pval are arrays of length (max_dim - 1); index 0 = m=2
        nli   = float(stat[0])
        pvalue = float(pval[0])
        return nli, pvalue
    except Exception:
        # Proxy: use Ljung-Box residual autocorrelation sum as a rough NLI substitute
        try:
            lb = acorr_ljungbox(x, lags=10, return_df=True)
            proxy_stat = float(lb['lb_stat'].sum()) / 10.0
            proxy_p    = float(lb['lb_pvalue'].min())
            return proxy_stat, proxy_p
        except Exception:
            return 0.0, 1.0


def next_quarter_labels(last_date: pd.Timestamp, n: int):
    """Generate n calendar quarter labels after last_date."""
    labels = []
    yr, mo = last_date.year, last_date.month
    for _ in range(n):
        mo += 3
        if mo > 12:
            mo -= 12
            yr += 1
        q = (mo - 1) // 3 + 1
        labels.append(f"{yr}-Q{q}")
    return labels


# ── STATIC FILES ───────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory(DATA_DIR, filename)

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)


# ── API: FILTER-THEN-TEST PIPELINE ────────────────────────────────

@app.route('/api/analyze', methods=['POST'])
def analyze():
    body  = request.get_json(force=True)
    gvkey = int(body.get('gvkey', 0))

    roa, labels, firm_name = get_firm_roa(gvkey)
    if roa is None or len(roa) < 20:
        return jsonify({'error': f'Not enough data for gvkey={gvkey}'}), 404

    result = {'firm': firm_name, 'gvkey': gvkey, 'n': int(len(roa))}

    # ── Step 1: Stationarity ────────────────────────────────────────
    try:
        adf_stat, adf_p, *_ = adfuller(roa, maxlag=4, autolag='AIC')
        adf_stationary = bool(adf_p < 0.05)
    except Exception:
        adf_stat, adf_p, adf_stationary = 0.0, 1.0, False

    try:
        kpss_stat, kpss_p, *_ = kpss(roa, regression='c', nlags='auto')
        kpss_stationary = bool(kpss_p > 0.05)
    except Exception:
        kpss_stat, kpss_p, kpss_stationary = 0.0, 0.0, False

    # Both tests agree → stationary; otherwise difference
    d_order = 0 if (adf_stationary and kpss_stationary) else 1
    result['adf']  = {'stat': round(float(adf_stat),4), 'pvalue': round(float(adf_p),4), 'stationary': adf_stationary}
    result['kpss'] = {'stat': round(float(kpss_stat),4), 'pvalue': round(float(kpss_p),4), 'stationary': kpss_stationary}
    result['d_order'] = d_order

    # ── Step 2: Auto-ARIMA ──────────────────────────────────────────
    order, aicc_val, fit = fit_best_arima(roa, d=d_order)
    result['arima_order'] = list(order)
    result['aicc']        = round(float(aicc_val) if math.isfinite(aicc_val) else 0.0, 2)

    # ── Step 3: Ljung-Box (gatekeeper) ────────────────────────────
    try:
        resid   = fit.resid
        resid_s = resid / (np.std(resid) + 1e-12)  # standardised
        lb_df   = acorr_ljungbox(resid_s, lags=[10], return_df=True)
        lb_stat = float(lb_df['lb_stat'].iloc[0])
        lb_p    = float(lb_df['lb_pvalue'].iloc[0])
        lb_pass = bool(lb_p > 0.05)
    except Exception:
        resid_s = roa - np.mean(roa)
        lb_stat, lb_p, lb_pass = 0.0, 1.0, True

    result['ljung_box'] = {'stat': round(lb_stat,4), 'pvalue': round(lb_p,4), 'pass': lb_pass}

    # ── Step 4: BDS Test → NLI ─────────────────────────────────────
    nli, bds_p = bds_test(resid_s)
    is_complex  = bool(nli > 1.96)
    result['bds'] = {
        'nli':        round(float(nli), 4),
        'pvalue':     round(float(bds_p), 4),
        'is_complex': is_complex,
        'stat':       round(float(nli), 4),
    }
    result['complexity_flag'] = 'High' if is_complex else 'Low'

    # ── Naive MAE baseline ─────────────────────────────────────────
    if len(roa) > 8:
        train = roa[:-8]
        naive_mae = float(np.mean(np.abs(np.diff(train)))) if len(train) > 1 else 0.0
    else:
        naive_mae = float(np.mean(np.abs(np.diff(roa)))) if len(roa) > 1 else 0.0
    result['naive_mae'] = round(naive_mae, 7)

    return jsonify(result)


# ── API: ARIMA FORECAST ───────────────────────────────────────────

@app.route('/api/forecast', methods=['POST'])
def forecast():
    body    = request.get_json(force=True)
    gvkey   = int(body.get('gvkey', 0))
    horizon = int(body.get('horizon', 8))

    roa, labels, firm_name = get_firm_roa(gvkey)
    if roa is None or len(roa) < 20:
        return jsonify({'error': f'No data for gvkey={gvkey}'}), 404

    # Determine d (stationarity)
    try:
        _, adf_p, *_ = adfuller(roa, maxlag=4, autolag='AIC')
        d_order = 0 if adf_p < 0.05 else 1
    except Exception:
        d_order = 0

    # Fit best ARIMA
    order, _, fit = fit_best_arima(roa, d=d_order)

    # Forecast
    try:
        fc       = fit.get_forecast(steps=horizon)
        point    = fc.predicted_mean.tolist()
        ci       = fc.conf_int(alpha=0.2)   # 80% CI — returns DataFrame or ndarray
        # Handle both DataFrame and ndarray returns (statsmodels version differences)
        if hasattr(ci, 'iloc'):
            lower = ci.iloc[:, 0].tolist()
            upper = ci.iloc[:, 1].tolist()
        else:
            ci = np.array(ci)
            lower = ci[:, 0].tolist()
            upper = ci[:, 1].tolist()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # Build quarter labels from last date
    last_date = df_all[df_all['gvkey'] == gvkey]['date_proper'].max()
    fc_labels = next_quarter_labels(pd.Timestamp(last_date), horizon)

    # Winsorise forecast within data bounds (prevent wildly extrapolated CIs)
    roa_min = float(np.min(roa)) * 2
    roa_max = float(np.max(roa)) * 2
    lower   = [max(roa_min, v) for v in lower]
    upper   = [min(roa_max, v) for v in upper]

    return jsonify({
        'firm':       firm_name,
        'gvkey':      gvkey,
        'arima_order': list(order),
        'labels':     fc_labels,
        'point':      [round(v, 6) for v in point],
        'lower':      [round(v, 6) for v in lower],
        'upper':      [round(v, 6) for v in upper],
    })


# ── LAUNCH ────────────────────────────────────────────────────────

if __name__ == '__main__':
    print(f"""
╔══════════════════════════════════════════════╗
║   Chronos Tutorial — Statistical Server     ║
║   Listening on port {PORT}                   ║
║   API:     /api/analyze  /api/forecast       ║
║   Press Ctrl+C to stop                      ║
╚══════════════════════════════════════════════╝""")
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
