import React, { useState } from "react";
import { manualTrade, analyzeStock } from "../lib/api";

const SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];

export default function TradePanel({ positions, onTradeComplete }) {
  const [symbol, setSymbol] = useState("AAPL");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [result, setResult] = useState(null);
  const [pendingSide, setPendingSide] = useState(null);

  const isHeld = symbol in positions;

  async function handleAnalyze(side) {
    setAnalyzing(true);
    setAnalysis(null);
    setResult(null);
    setPendingSide(side);
    try {
      const res = await analyzeStock(symbol);
      setAnalysis(res);
    } catch (e) {
      setAnalysis({ error: e.message });
    }
    setAnalyzing(false);
  }

  async function handleConfirm() {
    if (!pendingSide) return;
    setLoading(true);
    try {
      const res = await manualTrade(symbol, pendingSide, qty ? parseInt(qty) : null);
      setResult(res);
      setAnalysis(null);
      setPendingSide(null);
      if (res.status === "executed" && onTradeComplete) onTradeComplete();
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  }

  function handleCancel() {
    setAnalysis(null);
    setPendingSide(null);
  }

  const ai = analysis?.ai;
  const aiAgrees = ai && (
    (pendingSide === "buy" && ai.action === "buy") ||
    (pendingSide === "sell" && ai.action === "sell")
  );
  const aiDisagrees = ai && !aiAgrees && ai.action !== pendingSide;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Trade</span>
        <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 10, background: "var(--accent-purple)", color: "#fff", fontWeight: 600 }}>
          AI Powered
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Symbol Select */}
          <div>
            <label className="trade-label">Symbol</label>
            <div style={{ display: "flex", gap: 6 }}>
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSymbol(s); setAnalysis(null); setPendingSide(null); setResult(null); }}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    border: s === symbol ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
                    borderRadius: 6,
                    background: s === symbol ? "var(--accent-blue-dim)" : "transparent",
                    color: s === symbol ? "var(--accent-blue)" : "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {s}
                  {s in positions && <span style={{ display: "block", fontSize: "0.55rem", color: "var(--accent-green)" }}>HELD</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="trade-label">
              Quantity <span style={{ color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>(empty = auto 20%)</span>
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Auto"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
              }}
            />
          </div>

          {/* Buy / Sell Buttons */}
          {!analysis && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleAnalyze("buy")}
                disabled={analyzing || isHeld}
                style={{
                  flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                  background: isHeld ? "var(--border)" : "linear-gradient(135deg, #059669, #10b981)",
                  color: isHeld ? "var(--text-muted)" : "#fff",
                  fontSize: "0.85rem", fontWeight: 700,
                  cursor: isHeld ? "not-allowed" : "pointer",
                  opacity: analyzing ? 0.6 : 1,
                }}
              >
                {analyzing && pendingSide === "buy" ? "Asking Jev AI..." : "BUY"}
              </button>
              <button
                onClick={() => handleAnalyze("sell")}
                disabled={analyzing || !isHeld}
                style={{
                  flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                  background: !isHeld ? "var(--border)" : "linear-gradient(135deg, #dc2626, #ef4444)",
                  color: !isHeld ? "var(--text-muted)" : "#fff",
                  fontSize: "0.85rem", fontWeight: 700,
                  cursor: !isHeld ? "not-allowed" : "pointer",
                  opacity: analyzing ? 0.6 : 1,
                }}
              >
                {analyzing && pendingSide === "sell" ? "Asking Jev AI..." : "SELL"}
              </button>
            </div>
          )}

          {/* AI Analysis Result */}
          {analysis && !analysis.error && (
            <div style={{
              padding: 14,
              borderRadius: 10,
              background: "var(--bg-input)",
              border: `1px solid ${aiAgrees ? "rgba(16,185,129,0.4)" : aiDisagrees ? "rgba(239,68,68,0.4)" : "var(--border-light)"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent-purple)" }}>
                  Jev AI Analysis
                </span>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                  background: ai.action === "buy" ? "var(--accent-green-dim)" : ai.action === "sell" ? "var(--accent-red-dim)" : "rgba(245,158,11,0.12)",
                  color: ai.action === "buy" ? "var(--accent-green)" : ai.action === "sell" ? "var(--accent-red)" : "var(--accent-yellow)",
                }}>
                  {ai.action.toUpperCase()}
                </span>
              </div>

              {/* Confidence bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Confidence</span>
                  <span style={{ fontSize: "0.72rem", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                    {(ai.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: `${(ai.confidence * 100).toFixed(0)}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: ai.confidence > 0.7 ? "var(--accent-green)" : ai.confidence > 0.5 ? "var(--accent-yellow)" : "var(--accent-red)",
                    transition: "width 0.5s",
                  }} />
                </div>
              </div>

              {/* Reason */}
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                {ai.reason}
              </div>

              {/* Agreement/Disagreement banner */}
              {aiDisagrees && (
                <div style={{
                  padding: "8px 10px", borderRadius: 6, marginBottom: 12,
                  background: "var(--accent-red-dim)", border: "1px solid rgba(239,68,68,0.3)",
                  fontSize: "0.75rem", color: "var(--accent-red)",
                }}>
                  ⚠ AI recommends <strong>{ai.action.toUpperCase()}</strong> but you want to <strong>{pendingSide.toUpperCase()}</strong>. Proceed with caution.
                </div>
              )}
              {aiAgrees && (
                <div style={{
                  padding: "8px 10px", borderRadius: 6, marginBottom: 12,
                  background: "var(--accent-green-dim)", border: "1px solid rgba(16,185,129,0.3)",
                  fontSize: "0.75rem", color: "var(--accent-green)",
                }}>
                  ✓ AI agrees with your {pendingSide.toUpperCase()} decision
                </div>
              )}

              {/* Confirm / Cancel */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "9px 0", border: "none", borderRadius: 8,
                    background: pendingSide === "buy" ? "var(--accent-green)" : "var(--accent-red)",
                    color: "#fff", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Placing Order..." : `Confirm ${pendingSide.toUpperCase()}`}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  style={{
                    padding: "9px 16px", border: "1px solid var(--border)", borderRadius: 8,
                    background: "transparent", color: "var(--text-muted)",
                    fontSize: "0.82rem", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {analysis?.error && (
            <div style={{
              padding: "10px 12px", borderRadius: 8, fontSize: "0.8rem",
              background: "var(--accent-red-dim)", color: "var(--accent-red)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}>
              AI Error: {analysis.error}
            </div>
          )}

          {/* Trade Result */}
          {result && (
            <div style={{
              padding: "10px 12px", borderRadius: 8, fontSize: "0.8rem",
              fontFamily: "'JetBrains Mono', monospace",
              background: result.error ? "var(--accent-red-dim)" : "var(--accent-green-dim)",
              color: result.error ? "var(--accent-red)" : "var(--accent-green)",
              border: `1px solid ${result.error ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            }}>
              {result.error ? result.error : (
                <>
                  ✓ {result.side.toUpperCase()} {result.qty} {result.symbol} @ ${result.price?.toFixed(2)}
                  {result.pnl !== undefined && (
                    <span style={{ marginLeft: 8 }}>
                      P&L: {result.pnl >= 0 ? "+" : ""}${result.pnl.toFixed(2)}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
