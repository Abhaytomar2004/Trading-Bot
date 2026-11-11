import React from "react";

export default function PositionsTable({ positions }) {
  const entries = Object.entries(positions);

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◈</div>
        <p>No open positions</p>
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Qty</th>
          <th>Avg Price</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([symbol, pos]) => (
          <tr key={symbol}>
            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{symbol}</td>
            <td><span className="mono">{pos.qty}</span></td>
            <td><span className="mono">${Number(pos.avg_price).toFixed(2)}</span></td>
            <td><span className="mono">${(Number(pos.qty) * Number(pos.avg_price)).toFixed(2)}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
