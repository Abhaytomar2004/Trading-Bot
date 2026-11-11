import React, { useState, useEffect } from "react";

export default function TopBar({ status }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });

  const hour = time.getUTCHours() - 5;
  const isOpen = time.getDay() > 0 && time.getDay() < 6 && hour >= 9.5 && hour < 16;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="logo">DhanBot</span>
        <span className="logo-dot"></span>
        <span className="badge badge-paper">PAPER</span>
        <span className={`badge ${isOpen ? "badge-live" : ""}`} style={!isOpen ? { background: "var(--accent-red-dim)", color: "var(--accent-red)", border: "1px solid rgba(239,68,68,0.3)" } : {}}>
          {isOpen ? "● Market Open" : "○ Market Closed"}
        </span>
      </div>
      <div className="topbar-right">
        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
          Last cycle: {status.last_run ? new Date(status.last_run).toLocaleString() : "Never"}
        </span>
        <span className="clock">ET {fmt}</span>
      </div>
    </div>
  );
}
