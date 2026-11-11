import React, { useState, useMemo } from "react";

export default function TradeLogPage({ trades }) {
  const [filterSymbol, setFilterSymbol] = useState("ALL");
  const [filterSide, setFilterSide] = useState("ALL");
  const [sortField, setSortField] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  const symbols = useMemo(() => {
    const s = new Set(trades.map((t) => t.symbol));
    return ["ALL", ...Array.from(s).sort()];
  }, [trades]);

  const filtered = useMemo(() => {
    let result = [...trades];
    if (filterSymbol !== "ALL") result = result.filter((t) => t.symbol === filterSymbol);
    if (filterSide !== "ALL") result = result.filter((t) => t.side === filterSide.toLowerCase());
    result.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === "timestamp") { va = new Date(va); vb = new Date(vb); }
      if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [trades, filterSymbol, filterSide, sortField, sortDir]);

  const totalBuys = trades.filter((t) => t.side === "buy").length;
  const totalSells = trades.filter((t) => t.side === "sell").length;
  const totalVolume = trades.reduce((sum, t) => sum + Number(t.qty) * Number(t.price), 0);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Trade Log</h2>
        <p className="page-subtitle">Complete history of all executed trades</p>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat-card">
          <div className="label">Total Trades</div>
          <div className="value">{trades.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Buys</div>
          <div className="value positive">{totalBuys}</div>
        </div>
        <div className="stat-card">
          <div className="label">Sells</div>
          <div className="value negative">{totalSells}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Volume</div>
          <div className="value">${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: 12 }}>
          <span className="card-title">All Trades ({filtered.length})</span>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text-secondary)",
                padding: "4px 10px",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {symbols.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Symbols" : s}</option>
              ))}
            </select>
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text-secondary)",
                padding: "4px 10px",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Sides</option>
              <option value="BUY">Buy Only</option>
              <option value="SELL">Sell Only</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 20px" }}>
            <div className="empty-icon">◇</div>
            <p>{trades.length === 0 ? "No trades yet — waiting for first cycle" : "No trades match filters"}</p>
          </div>
        ) : (
          <div className="card-body-flush">
            <table>
              <thead>
                <tr>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("timestamp")}>Date{sortIcon("timestamp")}</th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("symbol")}>Symbol{sortIcon("symbol")}</th>
                  <th>Side</th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("qty")}>Qty{sortIcon("qty")}</th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("price")}>Price{sortIcon("price")}</th>
                  <th>Value</th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("confidence")}>Confidence{sortIcon("confidence")}</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const value = Number(t.qty) * Number(t.price);
                  return (
                    <tr key={i}>
                      <td>
                        <span className="mono">
                          {new Date(t.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {new Date(t.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.symbol}</td>
                      <td><span className={`side-tag ${t.side}`}>{t.side.toUpperCase()}</span></td>
                      <td><span className="mono">{t.qty}</span></td>
                      <td><span className="mono">${Number(t.price).toFixed(2)}</span></td>
                      <td><span className="mono">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div className="confidence-bar" style={{ width: 50 }}>
                            <div
                              className="confidence-fill"
                              style={{
                                width: `${(t.confidence * 100).toFixed(0)}%`,
                                background:
                                  t.confidence > 0.8 ? "var(--accent-green)" :
                                  t.confidence > 0.6 ? "var(--accent-yellow)" : "var(--accent-red)",
                              }}
                            />
                          </div>
                          <span className="mono" style={{ fontSize: "0.75rem" }}>{(t.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 200, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {t.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
