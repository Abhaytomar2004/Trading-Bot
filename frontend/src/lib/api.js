const API_BASE = import.meta.env.VITE_API_URL || "";

export async function fetchTrades(limit = 50) {
  const res = await fetch(`${API_BASE}/api/trades?limit=${limit}`);
  return res.json();
}

export async function fetchPositions() {
  const res = await fetch(`${API_BASE}/api/positions`);
  return res.json();
}

export async function fetchChartData(symbol, limit = 50) {
  const res = await fetch(
    `${API_BASE}/api/chart-data?symbol=${symbol}&limit=${limit}`
  );
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
