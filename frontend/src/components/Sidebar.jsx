import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchChartData, fetchINChartData, fetchCryptoChartData, searchINStocks, searchCryptoStocks } from "../lib/api";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "◉" },
  { path: "/positions", label: "Positions", icon: "◈" },
  { path: "/tradelog", label: "Trade Log", icon: "◇" },
  { path: "/analytics", label: "Analytics", icon: "◆" },
];

const MARKET_TABS = [
  { key: "US", label: "🇺🇸 US" },
  { key: "IN", label: "🇮🇳 India" },
  { key: "CRYPTO", label: "₿ Crypto" },
];

const CURRENCY = { US: "$", IN: "₹", CRYPTO: "$" };
const EXCHANGE_LABEL = { US: "NYSE/NASDAQ", IN: "NSE", CRYPTO: "Binance" };
const MODE_LABEL = { US: "Paper Trading", IN: "View Only", CRYPTO: "Paper Trading" };

export default function Sidebar({
  symbols, activeSymbol, onSymbolChange, positions, isOpen,
  market, onMarketChange, onAddSymbol, onRemoveSymbol, defaultSymbols,
}) {
  const [prices, setPrices] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const currency = CURRENCY[market];

  useEffect(() => {
    setPrices({});
    symbols.forEach((sym) => {
      let fetcher;
      if (market === "US") fetcher = fetchChartData;
      else if (market === "IN") fetcher = fetchINChartData;
      else fetcher = fetchCryptoChartData;

      fetcher(sym, 2).then((bars) => {
        if (!Array.isArray(bars)) return;
        if (bars.length >= 2) {
          const prev = bars[bars.length - 2].close;
          const curr = bars[bars.length - 1].close;
          setPrices((p) => ({ ...p, [sym]: { price: curr, change: ((curr - prev) / prev) * 100 } }));
        } else if (bars.length === 1) {
          setPrices((p) => ({ ...p, [sym]: { price: bars[0].close, change: 0 } }));
        }
      }).catch(() => {});
    });
  }, [symbols, market]);

  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, [market]);

  function handleSearch(q) {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(() => {
      setSearching(true);
      const searcher = market === "IN" ? searchINStocks : searchCryptoStocks;
      searcher(q).then((results) => {
        if (market === "IN") {
          setSearchResults(results.slice(0, 8));
        } else {
          setSearchResults(results.map((r) => ({
            symbol: r.symbol,
            name: `${r.base}/${r.quote}`,
          })).slice(0, 8));
        }
      }).catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
  }

  function handleSelectSearch(sym) {
    onAddSymbol(sym);
    setSearchQuery("");
    setSearchResults([]);
    navigate("/");
  }

  function formatPrice(price) {
    if (market === "CRYPTO" && price >= 1000) return `${currency}${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (market === "CRYPTO") return `${currency}${price.toFixed(2)}`;
    return `${currency}${price.toFixed(2)}`;
  }

  function formatSymbol(sym) {
    if (market === "CRYPTO") return sym.replace("USDT", "");
    return sym;
  }

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Market Tabs */}
      <div className="sidebar-section">
        <div style={{ display: "flex", gap: 4, padding: "0 8px", marginBottom: 12 }}>
          {MARKET_TABS.map((m) => (
            <button
              key={m.key}
              onClick={() => onMarketChange(m.key)}
              style={{
                flex: 1,
                padding: "8px 0",
                border: market === m.key ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
                borderRadius: 8,
                background: market === m.key ? "var(--accent-blue-dim)" : "transparent",
                color: market === m.key ? "var(--accent-blue)" : "var(--text-muted)",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

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
        <div className="sidebar-title">
          Watchlist — {EXCHANGE_LABEL[market]}
        </div>

        {/* Search (India + Crypto) */}
        {market !== "US" && (
          <div style={{ padding: "0 8px", marginBottom: 8, position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={market === "IN" ? "Search NSE stocks..." : "Search crypto pairs..."}
              style={{
                width: "100%",
                padding: "7px 10px",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--text-primary)",
                fontSize: "0.78rem",
                outline: "none",
              }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 8, right: 8,
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: 8,
                zIndex: 50,
                maxHeight: 240,
                overflowY: "auto",
                boxShadow: "var(--shadow)",
              }}>
                {searchResults.map((r) => (
                  <div
                    key={r.symbol}
                    onClick={() => handleSelectSearch(r.symbol)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      color: "var(--text-primary)",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontWeight: 600 }}>{market === "CRYPTO" ? r.symbol.replace("USDT", "") : r.symbol}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{r.name || r.exchange || ""}</span>
                  </div>
                ))}
              </div>
            )}
            {searching && (
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "4px 2px" }}>Searching...</div>
            )}
          </div>
        )}

        {symbols.map((sym) => {
          const data = prices[sym];
          const isHeld = sym in positions;
          const isCustom = market !== "US" && defaultSymbols && !defaultSymbols.includes(sym);
          return (
            <div
              key={sym}
              className={`watchlist-item ${sym === activeSymbol ? "active" : ""}`}
              onClick={() => { onSymbolChange(sym); navigate("/"); }}
            >
              <div>
                <div className="wl-symbol">
                  {formatSymbol(sym)}
                  {isHeld && (
                    <span style={{ fontSize: "0.6rem", color: "var(--accent-blue)", marginLeft: 6 }}>HELD</span>
                  )}
                  {isCustom && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onRemoveSymbol(sym); }}
                      style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: 6, cursor: "pointer", opacity: 0.6 }}
                      title="Remove from watchlist"
                    >
                      ✕
                    </span>
                  )}
                </div>
                {data && (
                  <div className={`wl-change ${data.change >= 0 ? "positive" : "negative"}`}>
                    {data.change >= 0 ? "+" : ""}{data.change.toFixed(2)}%
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                {data && <div className="wl-price">{formatPrice(data.price)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Market Info</div>
        <div style={{ padding: "0 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Exchange</span>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)" }}>{EXCHANGE_LABEL[market]}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mode</span>
            <span style={{ fontSize: "0.75rem", color: market === "IN" ? "var(--accent-yellow)" : "var(--accent-green)" }}>
              {MODE_LABEL[market]}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Currency</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {market === "US" ? "USD ($)" : market === "IN" ? "INR (₹)" : "USDT ($)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
