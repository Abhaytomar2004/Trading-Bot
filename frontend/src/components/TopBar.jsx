import React, { useState, useEffect } from "react";

export default function TopBar({ status, market, onMenuToggle }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtET = time.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "America/New_York",
  });

  const fmtIST = time.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "Asia/Kolkata",
  });

  const fmtUTC = time.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "UTC",
  });

  const hourET = time.getUTCHours() - 5;
  const isUSOpen = time.getDay() > 0 && time.getDay() < 6 && hourET >= 9.5 && hourET < 16;

  const istHours = Number(fmtIST.split(":")[0]);
  const istMins = Number(fmtIST.split(":")[1]);
  const istTime = istHours + istMins / 60;
  const isINOpen = time.getDay() > 0 && time.getDay() < 6 && istTime >= 9.25 && istTime < 15.5;

  const isOpen = market === "CRYPTO" ? true : market === "IN" ? isINOpen : isUSOpen;

  const badgeLabel = market === "US" ? "PAPER" : market === "IN" ? "NSE" : "TESTNET";
  const clockLabel = market === "US" ? `ET ${fmtET}` : market === "IN" ? `IST ${fmtIST}` : `UTC ${fmtUTC}`;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle}>☰</button>
        <span className="logo">DhanBot</span>
        <span className="logo-dot"></span>
        <span className="badge badge-paper">{badgeLabel}</span>
        <span className={`badge ${isOpen ? "badge-live" : ""}`} style={!isOpen ? { background: "var(--accent-red-dim)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.3)" } : {}}>
          {market === "CRYPTO" ? "● 24/7 Open" : isOpen ? "● Market Open" : "○ Market Closed"}
        </span>
      </div>
      <div className="topbar-right">
        <span className="last-cycle-text" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
          Last cycle: {status.last_run ? new Date(status.last_run).toLocaleString() : "Never"}
        </span>
        <span className="clock">{clockLabel}</span>
      </div>
    </div>
  );
}
