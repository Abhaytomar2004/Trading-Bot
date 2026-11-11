import React from "react";

export default function StatsRow({ equity, pnl, pnlPct, positions, status }) {
  const posCount = Object.keys(positions).length;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="label">Portfolio Value</div>
        <div className="value">
          ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="sub">Starting $100,000.00</div>
      </div>
      <div className="stat-card">
        <div className="label">Total P&L</div>
        <div className="value" style={{ color: pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
          {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="sub" style={{ color: pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
          {pnl >= 0 ? "+" : ""}{pnlPct}%
        </div>
      </div>
      <div className="stat-card">
        <div className="label">Open Positions</div>
        <div className="value">{posCount}</div>
        <div className="sub">Max 5 allowed</div>
      </div>
      <div className="stat-card">
        <div className="label">Today's Trades</div>
        <div className="value">0</div>
        <div className="sub">Daily cycle: 1x</div>
      </div>
    </div>
  );
}
