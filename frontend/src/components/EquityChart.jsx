import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function EquityChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◇</div>
        <p>No equity data yet — run your first trading cycle</p>
      </div>
    );
  }

  const sorted = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={sorted}>
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={{ stroke: "#1e293b" }}
          tickLine={false}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={60}
        />
        <Tooltip
          contentStyle={{
            background: "#1a1f2e",
            border: "1px solid #2d3a4f",
            borderRadius: 8,
            fontSize: "0.8rem",
          }}
          formatter={(val) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Equity"]}
        />
        <Area
          type="monotone"
          dataKey="total_equity"
          stroke="#3b82f6"
          fill="url(#eqGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
