import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import DashboardPage from "./pages/DashboardPage";
import PositionsPage from "./pages/PositionsPage";
import TradeLogPage from "./pages/TradeLogPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { fetchPositions, fetchEquity, fetchStatus, fetchTrades } from "./lib/api";

const SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];

export default function App() {
  const [activeSymbol, setActiveSymbol] = useState("AAPL");
  const [positions, setPositions] = useState({});
  const [equity, setEquity] = useState([]);
  const [status, setStatus] = useState({});
  const [trades, setTrades] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function refreshData() {
    fetchPositions().then(setPositions).catch(() => {});
    fetchEquity().then(setEquity).catch(() => {});
    fetchStatus().then(setStatus).catch(() => {});
    fetchTrades(200).then(setTrades).catch(() => {});
  }

  useEffect(() => { refreshData(); }, []);

  const latestEquity = equity.length > 0 ? equity[0].total_equity : 100000;
  const pnl = latestEquity - 100000;
  const pnlPct = ((pnl / 100000) * 100).toFixed(2);

  return (
    <BrowserRouter>
      <div className="app">
        <TopBar status={status} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
        <Sidebar
          symbols={SYMBOLS}
          activeSymbol={activeSymbol}
          onSymbolChange={(sym) => { setActiveSymbol(sym); setSidebarOpen(false); }}
          positions={positions}
          isOpen={sidebarOpen}
        />
        <main className="main">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  activeSymbol={activeSymbol}
                  positions={positions}
                  equity={equity}
                  status={status}
                  latestEquity={latestEquity}
                  pnl={pnl}
                  pnlPct={pnlPct}
                  onRefresh={refreshData}
                />
              }
            />
            <Route
              path="/positions"
              element={<PositionsPage positions={positions} latestEquity={latestEquity} />}
            />
            <Route
              path="/tradelog"
              element={<TradeLogPage trades={trades} />}
            />
            <Route
              path="/analytics"
              element={<AnalyticsPage trades={trades} equity={equity} positions={positions} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
