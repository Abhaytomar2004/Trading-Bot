import React, { useEffect, useState } from "react";
import { fetchChartData } from "../lib/api";

export default function PositionsPage({ positions, latestEquity }) {
  const [livePrices, setLivePrices] = useState({});
  const entries = Object.entries(positions);

  useEffect(() => {
    entries.forEach(([symbol]) => {
      fetchChartData(symbol, 2).then((bars) => {
        if (bars.length > 0) {
          setLivePrices((p) => ({ ...p, [symbol]: bars[bars.length - 1].close }));
        }
      }).catch(() => {});
    });
  }, [positions]);

  const totalInvested = entries.reduce((sum, [, pos]) => sum + Number(pos.qty) * Number(pos.avg_price), 0);
  const totalCurrent = entries.reduce((sum, [sym, pos]) => {
    const live = livePrices[sym] || Number(pos.avg_price);
    return sum + Number(pos.qty) * live;
  }, 0);
  const totalPnl = totalCurrent - totalInvested;
  const cash = latestEquity - totalCurrent;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Positions</h2>
        <p className="page-subtitle">Detailed view of all open holdings</p>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat-card">
          <div className="label">Invested Value</div>
          <div className="value">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card">
          <div className="label">Current Value</div>
          <div className="value">${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card">
          <div className="label">Unrealized P&L</div>
          <div className="value" style={{ color: totalPnl >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
            {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Cash Available</div>
          <div className="value">${cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: "60px 20px" }}>
            <div className="empty-icon">◈</div>
            <p>No open positions — the bot hasn't made any trades yet</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body-flush">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg Price</th>
                  <th>Current Price</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>P&L ($)</th>
                  <th>P&L (%)</th>
                  <th>% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([symbol, pos]) => {
                  const qty = Number(pos.qty);
                  const avg = Number(pos.avg_price);
                  const live = livePrices[symbol] || avg;
                  const invested = qty * avg;
                  const current = qty * live;
                  const pnl = current - invested;
                  const pnlPct = avg > 0 ? ((live - avg) / avg) * 100 : 0;
                  const portfolioPct = latestEquity > 0 ? (current / latestEquity) * 100 : 0;

                  return (
                    <tr key={symbol}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        <div>{symbol}</div>
                      </td>
                      <td><span className="mono">{qty}</span></td>
                      <td><span className="mono">${avg.toFixed(2)}</span></td>
                      <td><span className="mono">${live.toFixed(2)}</span></td>
                      <td><span className="mono">${invested.toFixed(2)}</span></td>
                      <td><span className="mono">${current.toFixed(2)}</span></td>
                      <td>
                        <span className="mono" style={{ color: pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 600 }}>
                          {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`side-tag ${pnlPct >= 0 ? "buy" : "sell"}`}>
                          {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "var(--bg-input)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(portfolioPct, 100)}%`, height: "100%", background: "var(--accent-blue)", borderRadius: 2 }} />
                          </div>
                          <span className="mono" style={{ fontSize: "0.75rem", minWidth: 40 }}>{portfolioPct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
