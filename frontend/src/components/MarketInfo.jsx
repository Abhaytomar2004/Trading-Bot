import React, { useEffect, useState } from "react";
import { fetchChartData } from "../lib/api";

export default function MarketInfo({ symbol }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetchChartData(symbol, 20).then((bars) => {
      if (bars.length < 2) return;
      const latest = bars[bars.length - 1];
      const prev = bars[bars.length - 2];
      const closes = bars.map((b) => b.close);
      const volumes = bars.map((b) => b.volume);
      const high52 = Math.max(...bars.map((b) => b.high));
      const low52 = Math.min(...bars.map((b) => b.low));
      const avgVol = Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length);
      const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, closes.length);

      const deltas = [];
      for (let i = 1; i < closes.length; i++) deltas.push(closes[i] - closes[i - 1]);
      const gains = deltas.filter((d) => d > 0);
      const losses = deltas.filter((d) => d < 0).map((d) => -d);
      const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
      const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / 14 : 1;
      const rsi = 100 - 100 / (1 + avgGain / avgLoss);

      setInfo({
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        volume: latest.volume,
        prevClose: prev.close,
        high20: high52,
        low20: low52,
        avgVol,
        sma10,
        rsi,
        volRatio: latest.volume / avgVol,
      });
    }).catch(() => {});
  }, [symbol]);

  if (!info) return <div className="card-body" style={{ color: "var(--text-muted)" }}>Loading...</div>;

  const items = [
    ["Open", `$${info.open.toFixed(2)}`],
    ["Prev Close", `$${info.prevClose.toFixed(2)}`],
    ["Day High", `$${info.high.toFixed(2)}`],
    ["Day Low", `$${info.low.toFixed(2)}`],
    ["Volume", info.volume.toLocaleString()],
    ["Avg Volume", info.avgVol.toLocaleString()],
    ["20D High", `$${info.high20.toFixed(2)}`],
    ["20D Low", `$${info.low20.toFixed(2)}`],
    ["SMA(10)", `$${info.sma10.toFixed(2)}`],
    ["RSI(14)", info.rsi.toFixed(1)],
    ["Vol Ratio", `${info.volRatio.toFixed(2)}x`],
    ["Spread", `$${(info.high - info.low).toFixed(2)}`],
  ];

  const rsiColor = info.rsi > 70 ? "var(--accent-red)" : info.rsi < 30 ? "var(--accent-green)" : "var(--text-secondary)";

  return (
    <div className="mini-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)" }}>
      {items.map(([label, value], i) => (
        <div key={i} className="mini-stat">
          <div className="ms-label">{label}</div>
          <div className="ms-value" style={label === "RSI(14)" ? { color: rsiColor } : {}}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
