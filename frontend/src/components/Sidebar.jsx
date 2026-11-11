import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchChartData } from "../lib/api";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "◉" },
  { path: "/positions", label: "Positions", icon: "◈" },
  { path: "/tradelog", label: "Trade Log", icon: "◇" },
  { path: "/analytics", label: "Analytics", icon: "◆" },
];

export default function Sidebar({ symbols, activeSymbol, onSymbolChange, positions }) {
  const [prices, setPrices] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    symbols.forEach((sym) => {
      fetchChartData(sym, 2).then((bars) => {
        if (bars.length >= 2) {
          const prev = bars[bars.length - 2].close;
          const curr = bars[bars.length - 1].close;
          setPrices((p) => ({ ...p, [sym]: { price: curr, change: ((curr - prev) / prev) * 100 } }));
        } else if (bars.length === 1) {
          setPrices((p) => ({ ...p, [sym]: { price: bars[0].close, change: 0 } }));
        }
      }).catch(() => {});
    });
  }, [symbols]);

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">Navigation</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span> {item.label}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Watchlist</div>
        {symbols.map((sym) => {
          const data = prices[sym];
          const isHeld = sym in positions;
          return (
            <div
              key={sym}
              className={`watchlist-item ${sym === activeSymbol ? "active" : ""}`}
              onClick={() => { onSymbolChange(sym); navigate("/"); }}
            >
              <div>
                <div className="wl-symbol">
                  {sym}
                  {isHeld && (
                    <span style={{ fontSize: "0.6rem", color: "var(--accent-blue)", marginLeft: 6 }}>HELD</span>
                  )}
                </div>
                {data && (
                  <div className={`wl-change ${data.change >= 0 ? "positive" : "negative"}`}>
                    {data.change >= 0 ? "+" : ""}{data.change.toFixed(2)}%
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                {data && <div className="wl-price">${data.price.toFixed(2)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Bot Status</div>
        <div style={{ padding: "0 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Kill Switch</span>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-green)" }}>OFF</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mode</span>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)" }}>Auto</span>
          </div>
        </div>
      </div>
    </div>
  );
}
