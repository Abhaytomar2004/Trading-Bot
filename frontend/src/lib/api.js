const API_BASE = import.meta.env.VITE_API_URL || "";

// --- US Market (Alpaca) ---

export async function fetchTrades(limit = 50) {
  const res = await fetch(`${API_BASE}/api/trades?limit=${limit}`);
  return res.json();
}

export async function fetchPositions() {
  const res = await fetch(`${API_BASE}/api/positions`);
  return res.json();
}

export async function fetchChartData(symbol, limit = 50) {
  const res = await fetch(`${API_BASE}/api/chart-data?symbol=${symbol}&limit=${limit}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchEquity(limit = 90) {
  const res = await fetch(`${API_BASE}/api/equity?limit=${limit}`);
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  return res.json();
}

export async function runBotCycle() {
  const res = await fetch(`${API_BASE}/api/run-cycle`, { method: "POST" });
  return res.json();
}

export async function analyzeStock(symbol) {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  return res.json();
}

export async function manualTrade(symbol, side, qty = null) {
  const body = { symbol, side };
  if (qty) body.qty = qty;
  const res = await fetch(`${API_BASE}/api/manual-trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// --- India Market (Yahoo Finance) ---

export async function fetchINChartData(symbol, limit = 50, exchange = "NSE") {
  const res = await fetch(`${API_BASE}/api/in/chart-data?symbol=${symbol}&limit=${limit}&exchange=${exchange}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchINPrice(symbol, exchange = "NSE") {
  const res = await fetch(`${API_BASE}/api/in/price?symbol=${symbol}&exchange=${exchange}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchINStocks(query) {
  const res = await fetch(`${API_BASE}/api/in/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchINWatchlist() {
  const res = await fetch(`${API_BASE}/api/in/watchlist`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// --- Crypto Market (Binance Testnet) ---

export async function fetchCryptoChartData(symbol, limit = 50, interval = "1d") {
  const res = await fetch(`${API_BASE}/api/crypto/chart-data?symbol=${symbol}&limit=${limit}&interval=${interval}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCryptoPrice(symbol) {
  const res = await fetch(`${API_BASE}/api/crypto/price?symbol=${symbol}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchCryptoStocks(query) {
  const res = await fetch(`${API_BASE}/api/crypto/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCryptoAccount() {
  const res = await fetch(`${API_BASE}/api/crypto/account`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function placeCryptoTrade(symbol, side, qty) {
  const res = await fetch(`${API_BASE}/api/crypto/trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, side, qty }),
  });
  return res.json();
}

export async function fetchCryptoWatchlist() {
  const res = await fetch(`${API_BASE}/api/crypto/watchlist`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
