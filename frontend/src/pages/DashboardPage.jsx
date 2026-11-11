import React from "react";
import StatsRow from "../components/StatsRow";
import PriceChart from "../components/PriceChart";
import MarketInfo from "../components/MarketInfo";
import PositionsTable from "../components/PositionsTable";
import TradeHistory from "../components/TradeHistory";
import EquityChart from "../components/EquityChart";
import TradePanel from "../components/TradePanel";
import BotCycleButton from "../components/BotCycleButton";

export default function DashboardPage({ activeSymbol, positions, equity, status, latestEquity, pnl, pnlPct, onRefresh }) {
  return (
    <>
      <StatsRow
        equity={latestEquity}
        pnl={pnl}
        pnlPct={pnlPct}
        positions={positions}
        status={status}
      />
      <div className="chart-section">
        <div className="card">
          <PriceChart symbol={activeSymbol} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TradePanel positions={positions} onTradeComplete={onRefresh} />
          <div className="card">
            <div className="card-header">
              <span className="card-title">Market Details</span>
            </div>
            <MarketInfo symbol={activeSymbol} />
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <BotCycleButton onComplete={onRefresh} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Portfolio Performance</span>
        </div>
        <div className="card-body">
          <EquityChart data={equity} />
        </div>
      </div>
      <div className="bottom-section">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Open Positions</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {Object.keys(positions).length} active
            </span>
          </div>
          <div className="card-body-flush">
            <PositionsTable positions={positions} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Trades</span>
          </div>
          <div className="card-body-flush">
            <TradeHistory />
          </div>
        </div>
      </div>
    </>
  );
}
