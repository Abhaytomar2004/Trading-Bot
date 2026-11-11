import React, { useEffect, useState } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { fetchChartData } from "../lib/api";

const RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
];

function CustomDot({ cx, cy, index, dataLength, color }) {
  if (index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.15}>
        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="#0a0e17" strokeWidth={2} />
    </g>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const change = d.close - d.open;
  const changePct = ((change / d.open) * 100).toFixed(2);
  return (
    <div style={{
      background: "rgba(26, 31, 46, 0.95)",
      border: "1px solid #2d3a4f",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: "0.78rem",
      backdropFilter: "blur(8px)",
      minWidth: 160,
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px" }}>
        <span style={{ color: "#64748b" }}>Open</span>
        <span style={{ color: "#f1f5f9", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>${d.open.toFixed(2)}</span>
        <span style={{ color: "#64748b" }}>High</span>
        <span style={{ color: "#10b981", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>${d.high.toFixed(2)}</span>
        <span style={{ color: "#64748b" }}>Low</span>
        <span style={{ color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>${d.low.toFixed(2)}</span>
        <span style={{ color: "#64748b" }}>Close</span>
        <span style={{ color: "#f1f5f9", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, textAlign: "right" }}>${d.close.toFixed(2)}</span>
      </div>
      <div style={{
        marginTop: 6,
        paddingTop: 6,
        borderTop: "1px solid #2d3a4f",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span style={{ color: "#64748b" }}>Change</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          color: change >= 0 ? "#10b981" : "#ef4444",
        }}>
          {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct}%)
        </span>
      </div>
      {d.volume && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ color: "#64748b" }}>Volume</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
            {d.volume >= 1e6 ? `${(d.volume / 1e6).toFixed(1)}M` : d.volume.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

export default function PriceChart({ symbol }) {
  const [data, setData] = useState([]);
  const [range, setRange] = useState("1M");

  useEffect(() => {
    const days = RANGES.find((r) => r.label === range)?.days || 30;
    fetchChartData(symbol, days)
      .then((bars) =>
        setData(
          bars.map((b) => ({
            date: new Date(b.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            close: b.close,
            open: b.open,
            high: b.high,
            low: b.low,
            volume: b.volume,
          }))
        )
      )
      .catch(() => {});
  }, [symbol, range]);

  const latest = data.length > 0 ? data[data.length - 1] : null;
  const first = data.length > 1 ? data[0] : null;
  const change = latest && first ? latest.close - first.close : 0;
  const changePct = first ? ((change / first.close) * 100).toFixed(2) : "0.00";
  const lineColor = change >= 0 ? "#10b981" : "#ef4444";
  const gradId = `priceGrad-${symbol}`;

  return (
    <>
      <div className="symbol-header">
        <span className="sym">{symbol}</span>
        {latest && (
          <>
            <span className="price-big">${latest.close.toFixed(2)}</span>
            <span className={`change-badge ${change >= 0 ? "up" : "down"}`}>
              {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct}%)
            </span>
          </>
        )}
      </div>
      <div style={{ padding: "8px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
          {latest && `O ${latest.open.toFixed(2)}  H ${latest.high.toFixed(2)}  L ${latest.low.toFixed(2)}  C ${latest.close.toFixed(2)}`}
        </span>
        <div className="chart-toolbar">
          {RANGES.map((r) => (
            <button
              key={r.label}
              className={r.label === range ? "active" : ""}
              onClick={() => setRange(r.label)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "8px 8px 16px" }}>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="40%" stopColor={lineColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.4)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              domain={["auto", "auto"]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={70}
            />
            <YAxis yAxisId="vol" orientation="right" hide />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Bar yAxisId="vol" dataKey="volume" fill="#1e293b" radius={[2, 2, 0, 0]} />
            {first && (
              <ReferenceLine
                yAxisId="price"
                y={first.close}
                stroke="#475569"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `$${first.close.toFixed(2)}`,
                  position: "right",
                  fill: "#475569",
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            )}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              filter="url(#glow)"
              dot={(props) => (
                <CustomDot
                  {...props}
                  dataLength={data.length}
                  color={lineColor}
                />
              )}
              activeDot={{
                r: 5,
                fill: lineColor,
                stroke: "#0a0e17",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
