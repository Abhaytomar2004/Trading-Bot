import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import DashboardPage from "./pages/DashboardPage";
import PositionsPage from "./pages/PositionsPage";
import TradeLogPage from "./pages/TradeLogPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { fetchPositions, fetchEquity, fetchStatus, fetchTrades } from "./lib/api";

const US_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];
const IN_SYMBOLS = ["RELIANCE", "TCS", "INFY", "WIPRO", "HCLTECH"];
const CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

const DEFAULT_SYMBOL = { US: "AAPL", IN: "RELIANCE", CRYPTO: "BTCUSDT" };

export default function App() {
  const [market, setMarket] = useState("US");
  const [activeSymbol, setActiveSymbol] = useState("AAPL");
  const [positions, setPositions] = useState({});
  const [equity, setEquity] = useState([]);
  const [status, setStatus] = useState({});
  const [trades, setTrades] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customSymbols, setCustomSymbols] = useState({ IN: [], CRYPTO: [] });

  const getSymbols = () => {
    if (market === "US") return US_SYMBOLS;
    if (market === "IN") return [...IN_SYMBOLS, ...customSymbols.IN.filter((s) => !IN_SYMBOLS.includes(s))];
    return [...CRYPTO_SYMBOLS, ...customSymbols.CRYPTO.filter((s) => !CRYPTO_SYMBOLS.includes(s))];
  };

  const getDefaults = () => {
    if (market === "US") return US_SYMBOLS;
    if (market === "IN") return IN_SYMBOLS;
    return CRYPTO_SYMBOLS;
  };

  function refreshData() {
    fetchPositions().then(setPositions).catch(() => {});
    fetchEquity().then(setEquity).catch(() => {});
    fetchStatus().then(setStatus).catch(() => {});
    fetchTrades(200).then(setTrades).catch(() => {});
  }

  useEffect(() => { refreshData(); }, []);

  function handleMarketChange(m) {
    setMarket(m);
    setActiveSymbol(DEFAULT_SYMBOL[m]);
  }

  function handleAddSymbol(sym) {
    if (market === "US") return;
    const defaults = getDefaults();
    if (!customSymbols[market].includes(sym) && !defaults.includes(sym)) {
      setCustomSymbols((prev) => ({ ...prev, [market]: [...prev[market], sym] }));
    }
    setActiveSymbol(sym);
  }

  function handleRemoveSymbol(sym) {
    if (market === "US") return;
    const defaults = getDefaults();
    if (defaults.includes(sym)) return;
    setCustomSymbols((prev) => ({ ...prev, [market]: prev[market].filter((s) => s !== sym) }));
    if (activeSymbol === sym) setActiveSymbol(getDefaults()[0]);
  }

  const latestEquity = equity.length > 0 ? equity[0].total_equity : 100000;
  const pnl = latestEquity - 100000;
  const pnlPct = ((pnl / 100000) * 100).toFixed(2);

  return (
    <BrowserRouter>
      <div className="app">
        <TopBar status={status} market={market} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
        <Sidebar
          symbols={getSymbols()}
          activeSymbol={activeSymbol}
          onSymbolChange={(sym) => { setActiveSymbol(sym); setSidebarOpen(false); }}
          positions={positions}
          isOpen={sidebarOpen}
          market={market}
          onMarketChange={handleMarketChange}
          onAddSymbol={handleAddSymbol}
          onRemoveSymbol={handleRemoveSymbol}
          defaultSymbols={getDefaults()}
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
                  market={market}
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
