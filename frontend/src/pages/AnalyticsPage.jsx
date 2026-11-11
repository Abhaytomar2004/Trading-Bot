import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie,
  AreaChart, Area,
} from "recharts";

export default function AnalyticsPage({ trades, equity, positions }) {
  const stats = useMemo(() => {
    if (trades.length === 0) return null;

    const sells = trades.filter((t) => t.side === "sell");
    const buys = trades.filter((t) => t.side === "buy");

    const symbolMap = {};
    trades.forEach((t) => {
      if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { buys: 0, sells: 0, volume: 0 };
      symbolMap[t.symbol][t.side === "buy" ? "buys" : "sells"]++;
      symbolMap[t.symbol].volume += Number(t.qty) * Number(t.price);
    });

    const bySymbol = Object.entries(symbolMap).map(([symbol, data]) => ({
      symbol,
      ...data,
      total: data.buys + data.sells,
    })).sort((a, b) => b.total - a.total);

    const confidences = trades.map((t) => Number(t.confidence));
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const highConf = confidences.filter((c) => c >= 0.8).length;
    const midConf = confidences.filter((c) => c >= 0.6 && c < 0.8).length;
    const lowConf = confidences.filter((c) => c < 0.6).length;

    const confDist = [
      { name: "High (80%+)", value: highConf, color: "#10b981" },
      { name: "Medium (60-80%)", value: midConf, color: "#f59e0b" },
      { name: "Low (<60%)", value: lowConf, color: "#ef4444" },
    ].filter((d) => d.value > 0);

    const dailyMap = {};
    trades.forEach((t) => {
      const day = new Date(t.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dailyMap[day]) dailyMap[day] = 0;
      dailyMap[day]++;
    });
    const dailyActivity = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    return {
      totalTrades: trades.length,
      totalBuys: buys.length,
      totalSells: sells.length,
      avgConfidence,
      bySymbol,
      confDist,
      dailyActivity,
    };
  }, [trades]);

  const equitySorted = useMemo(() => {
    if (!equity || equity.length === 0) return [];
    return [...equity].reverse();
  }, [equity]);

  const equityReturn = equitySorted.length >= 2
    ? ((equitySorted[equitySorted.length - 1].total_equity - equitySorted[0].total_equity) / equitySorted[0].total_equity * 100).toFixed(2)
    : "0.00";

  if (!stats) {
    return (
      <>
        <div className="page-header">
          <h2 className="page-title">Analytics</h2>
          <p className="page-subtitle">Performance metrics and insights</p>
        </div>
        <div className="card">
          <div className="empty-state" style={{ padding: "80px 20px" }}>
            <div className="empty-icon">◆</div>
            <p>No data to analyze yet — run trading cycles to see analytics</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Analytics</h2>
        <p className="page-subtitle">Performance metrics and insights</p>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat-card">
          <div className="label">Total Trades</div>
          <div className="value">{stats.totalTrades}</div>
          <div className="sub">{stats.totalBuys} buys / {stats.totalSells} sells</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Confidence</div>
          <div className="value" style={{
            color: stats.avgConfidence >= 0.8 ? "var(--accent-green)" :
                   stats.avgConfidence >= 0.6 ? "var(--accent-yellow)" : "var(--accent-red)"
          }}>
            {(stats.avgConfidence * 100).toFixed(1)}%
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Active Positions</div>
          <div className="value">{Object.keys(positions).length}</div>
          <div className="sub">of 5 max</div>
        </div>
        <div className="stat-card">
          <div className="label">Portfolio Return</div>
          <div className="value" style={{ color: Number(equityReturn) >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
            {Number(equityReturn) >= 0 ? "+" : ""}{equityReturn}%
          </div>
        </div>
      </div>

      <div className="bottom-section" style={{ marginBottom: 20 }}>
        {/* Trades by Symbol */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Trades by Symbol</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.bySymbol} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.4)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="symbol"
                  tick={{ fill: "#f1f5f9", fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3a4f", borderRadius: 8, fontSize: "0.8rem" }}
                />
                <Bar dataKey="buys" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Buys" />
                <Bar dataKey="sells" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} name="Sells" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Confidence Distribution</span>
          </div>
          <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.confDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.confDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3a4f", borderRadius: 8, fontSize: "0.8rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Trading Activity */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Daily Trading Activity</span>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.4)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3a4f", borderRadius: 8, fontSize: "0.8rem" }} />
              <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]}>
                {stats.dailyActivity.map((_, i) => (
                  <Cell key={i} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equity Curve */}
      {equitySorted.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Equity Curve</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={equitySorted}>
                <defs>
                  <linearGradient id="eqGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.4)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3a4f", borderRadius: 8, fontSize: "0.8rem" }}
                  formatter={(val) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Equity"]}
                />
                <Area type="monotone" dataKey="total_equity" stroke="#8b5cf6" fill="url(#eqGradAnalytics)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Symbol Breakdown Table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Symbol Breakdown</span>
        </div>
        <div className="card-body-flush">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Total Trades</th>
                <th>Buys</th>
                <th>Sells</th>
                <th>Volume</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {stats.bySymbol.map((s) => {
                const maxTrades = Math.max(...stats.bySymbol.map((x) => x.total));
                const pct = maxTrades > 0 ? (s.total / maxTrades) * 100 : 0;
                return (
                  <tr key={s.symbol}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.symbol}</td>
                    <td><span className="mono">{s.total}</span></td>
                    <td><span className="mono positive">{s.buys}</span></td>
                    <td><span className="mono negative">{s.sells}</span></td>
                    <td><span className="mono">${s.volume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--bg-input)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: 3 }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
