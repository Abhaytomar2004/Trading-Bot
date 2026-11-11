import React, { useState } from "react";
import { runBotCycle } from "../lib/api";

export default function BotCycleButton({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function handleRun() {
    setLoading(true);
    setResult(null);
    try {
      const res = await runBotCycle();
      setResult(res);
      setExpanded(true);
      if (onComplete) onComplete();
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Bot Auto-Trade</span>
        <button
          onClick={handleRun}
          disabled={loading}
          style={{
            padding: "6px 16px",
            border: "none",
            borderRadius: 6,
            background: loading ? "var(--border)" : "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
            color: "#fff",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {loading && (
            <span style={{
              display: "inline-block", width: 12, height: 12,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          )}
          {loading ? "Running Cycle..." : "Run Bot Cycle"}
        </button>
      </div>

      {result && (
        <div className="card-body" style={{ padding: "12px 20px" }}>
          {result.error ? (
            <div style={{ color: "var(--accent-red)", fontSize: "0.82rem" }}>Error: {result.error}</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Analyzed {result.results?.length || 0} stocks
                </span>
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{
                    background: "none", border: "none", color: "var(--accent-blue)",
                    fontSize: "0.75rem", cursor: "pointer",
                  }}
                >
                  {expanded ? "Hide Details" : "Show Details"}
                </button>
              </div>

              {/* Summary chips */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: expanded ? 12 : 0 }}>
                {result.results?.map((r, i) => {
                  const color =
                    r.status === "executed" ? "var(--accent-green)" :
                    r.status === "hold" ? "var(--accent-yellow)" :
                    r.status === "blocked" ? "var(--accent-red)" :
                    r.status === "error" ? "var(--accent-red)" : "var(--text-muted)";
                  const bg =
                    r.status === "executed" ? "var(--accent-green-dim)" :
                    r.status === "hold" ? "rgba(245,158,11,0.12)" :
                    "var(--accent-red-dim)";
                  return (
                    <span key={i} style={{
                      padding: "3px 10px", borderRadius: 4,
                      fontSize: "0.72rem", fontWeight: 600,
                      background: bg, color: color,
                      border: `1px solid ${color}33`,
                    }}>
                      {r.symbol} — {r.status === "executed" ? r.action?.toUpperCase() : r.status.toUpperCase()}
                    </span>
                  );
                })}
              </div>

              {/* Detailed results */}
              {expanded && result.results?.map((r, i) => (
                <div key={i} style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "var(--bg-input)",
                  marginBottom: 6,
                  fontSize: "0.78rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", marginRight: 8 }}>{r.symbol}</span>
                    <span style={{
                      fontSize: "0.7rem", padding: "1px 6px", borderRadius: 3,
                      background: r.status === "executed" ? "var(--accent-green-dim)" :
                                  r.status === "hold" ? "rgba(245,158,11,0.12)" : "var(--accent-red-dim)",
                      color: r.status === "executed" ? "var(--accent-green)" :
                             r.status === "hold" ? "var(--accent-yellow)" : "var(--accent-red)",
                    }}>
                      {r.action ? `${r.action.toUpperCase()} → ${r.status}` : r.status}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textAlign: "right", maxWidth: "50%" }}>
                    {r.reason || (r.confidence ? `${(r.confidence * 100).toFixed(0)}% confidence` : "")}
                  </div>
                </div>
              ))}

              {result.equity && (
                <div style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Portfolio equity: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)" }}>
                    ${result.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
