import React, { useEffect, useState } from "react";
import { fetchTrades } from "../lib/api";

export default function TradeHistory() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetchTrades(20).then(setTrades).catch(() => {});
  }, []);

  if (trades.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◇</div>
        <p>No trades yet — waiting for first cycle</p>
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t, i) => (
          <tr key={i}>
            <td>
              <span className="mono">
                {new Date(t.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </td>
            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.symbol}</td>
            <td>
              <span className={`side-tag ${t.side}`}>{t.side}</span>
            </td>
            <td><span className="mono">{t.qty}</span></td>
            <td><span className="mono">${Number(t.price).toFixed(2)}</span></td>
            <td>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${(t.confidence * 100).toFixed(0)}%`,
                    background:
                      t.confidence > 0.8
                        ? "var(--accent-green)"
                        : t.confidence > 0.6
                        ? "var(--accent-yellow)"
                        : "var(--accent-red)",
                  }}
                />
              </div>
              <span className="mono" style={{ fontSize: "0.75rem" }}>
                {(t.confidence * 100).toFixed(0)}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
