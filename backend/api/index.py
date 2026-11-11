import os
import json
import math
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Config ───────────────────────────────────────────────────────────────────

WATCHLIST = os.getenv("WATCHLIST", "AAPL,MSFT,GOOGL,AMZN,TSLA").split(",")
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY", "").strip()
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY", "").strip()
ALPACA_BASE_URL = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets").strip()
ALPACA_DATA_URL = os.getenv("ALPACA_DATA_URL", "https://data.alpaca.markets").strip()
JEV_API_KEY = os.getenv("JEV_API_KEY", "").strip()
JEV_BASE_URL = os.getenv("JEV_BASE_URL", "https://jev-ai.pro/api/v1").strip()
UPSTASH_REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL", "").strip()
UPSTASH_REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip()
MIN_CONFIDENCE = float(os.getenv("MIN_CONFIDENCE", "0.6"))
MAX_DAILY_LOSS_PCT = float(os.getenv("MAX_DAILY_LOSS_PCT", "0.02"))
MAX_POSITION_PCT = float(os.getenv("MAX_POSITION_PCT", "0.20"))
MAX_OPEN_POSITIONS = int(os.getenv("MAX_OPEN_POSITIONS", "5"))
STARTING_CAPITAL = float(os.getenv("STARTING_CAPITAL", "100000"))

# ─── Redis ────────────────────────────────────────────────────────────────────

def _redis_cmd(*args):
    url = UPSTASH_REDIS_URL.strip()
    token = UPSTASH_REDIS_TOKEN.strip()
    resp = httpx.post(url, headers={"Authorization": f"Bearer {token}"}, json=list(args))
    resp.raise_for_status()
    return resp.json().get("result")

def save_trade(trade):
    trade["timestamp"] = datetime.now(timezone.utc).isoformat()
    _redis_cmd("LPUSH", "trades:log", json.dumps(trade))

def get_trades(limit=50):
    raw = _redis_cmd("LRANGE", "trades:log", "0", str(limit - 1))
    return [json.loads(r) for r in (raw or [])]

def save_position(symbol, position):
    _redis_cmd("HSET", "positions:current", symbol, json.dumps(position))

def remove_position(symbol):
    _redis_cmd("HDEL", "positions:current", symbol)

def get_positions():
    raw = _redis_cmd("HGETALL", "positions:current")
    if not raw:
        return {}
    if isinstance(raw, dict):
        return {k: json.loads(v) for k, v in raw.items()}
    positions = {}
    for i in range(0, len(raw), 2):
        positions[raw[i]] = json.loads(raw[i + 1])
    return positions

def save_equity_snapshot(snapshot):
    snapshot["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    _redis_cmd("LPUSH", "equity:history", json.dumps(snapshot))

def get_equity_history(limit=90):
    raw = _redis_cmd("LRANGE", "equity:history", "0", str(limit - 1))
    return [json.loads(r) for r in (raw or [])]

def get_bot_state():
    raw = _redis_cmd("HGETALL", "bot:state")
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    state = {}
    for i in range(0, len(raw), 2):
        state[raw[i]] = raw[i + 1]
    return state

def set_bot_state(key, value):
    _redis_cmd("HSET", "bot:state", key, value)

# ─── Market Data ──────────────────────────────────────────────────────────────

def _alpaca_headers():
    return {"APCA-API-KEY-ID": ALPACA_API_KEY, "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY}

def fetch_bars(symbol, timeframe="1Day", limit=50):
    url = f"{ALPACA_DATA_URL}/v2/stocks/{symbol}/bars"
    start = (datetime.now(timezone.utc) - timedelta(days=limit * 2)).strftime("%Y-%m-%dT00:00:00Z")
    params = {"timeframe": timeframe, "limit": limit, "start": start}
    resp = httpx.get(url, headers=_alpaca_headers(), params=params)
    resp.raise_for_status()
    return [{"timestamp": b["t"], "open": b["o"], "high": b["h"], "low": b["l"], "close": b["c"], "volume": b["v"]} for b in resp.json().get("bars", [])]

def fetch_latest_price(symbol):
    url = f"{ALPACA_DATA_URL}/v2/stocks/{symbol}/trades/latest"
    resp = httpx.get(url, headers=_alpaca_headers())
    resp.raise_for_status()
    return resp.json()["trade"]["p"]

# ─── Indicators ───────────────────────────────────────────────────────────────

def sma(closes, period):
    if len(closes) < period:
        return None
    return sum(closes[-period:]) / period

def rsi(closes, period=14):
    if len(closes) < period + 1:
        return None
    deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    recent = deltas[-period:]
    gains = [d for d in recent if d > 0]
    losses = [-d for d in recent if d < 0]
    avg_gain = sum(gains) / period if gains else 0
    avg_loss = sum(losses) / period if losses else 0
    if avg_loss == 0:
        return 100.0
    return 100 - (100 / (1 + avg_gain / avg_loss))

def volume_ratio(volumes, period=20):
    if len(volumes) < period + 1:
        return None
    avg_vol = sum(volumes[-period - 1:-1]) / period
    return volumes[-1] / avg_vol if avg_vol else None

def build_state(bars):
    closes = [b["close"] for b in bars]
    volumes = [b["volume"] for b in bars]
    latest = bars[-1]
    return {
        "price": latest["close"], "sma_10": sma(closes, 10), "sma_20": sma(closes, 20),
        "rsi_14": rsi(closes, 14), "volume_ratio": volume_ratio(volumes, 20),
        "high": latest["high"], "low": latest["low"], "open": latest["open"],
    }

# ─── AI Engine ────────────────────────────────────────────────────────────────

def ask_ai(symbol, state):
    sma10 = f"${state['sma_10']:.2f}" if state['sma_10'] else "N/A"
    sma20 = f"${state['sma_20']:.2f}" if state['sma_20'] else "N/A"
    rsi_val = f"{state['rsi_14']:.1f}" if state['rsi_14'] else "N/A"
    volr = f"{state['volume_ratio']:.2f}" if state['volume_ratio'] else "N/A"

    state_text = (
        f"Stock: {symbol}\nCurrent Price: ${state['price']:.2f}\n"
        f"Open: ${state['open']:.2f}, High: ${state['high']:.2f}, Low: ${state['low']:.2f}\n"
        f"SMA(10): {sma10}\nSMA(20): {sma20}\nRSI(14): {rsi_val}\nVolume Ratio: {volr}\n"
        f"Price vs SMA10: {'above' if state['sma_10'] and state['price'] > state['sma_10'] else 'below'}\n"
        f"Price vs SMA20: {'above' if state['sma_20'] and state['price'] > state['sma_20'] else 'below'}"
    )

    payload = {
        "state": state_text, "model": "jev-1.14.0",
        "questions": {
            "action": {
                "type": "choice",
                "instructions": "Based on the technical indicators, what trading action should be taken?",
                "criteria": {
                    "buy": "Bullish signals: RSI below 40, price above SMA, strong volume, upward momentum",
                    "sell": "Bearish signals: RSI above 70, price below SMA, declining momentum, overbought",
                    "hold": "Mixed or neutral signals: no clear direction, wait for better entry/exit"
                }
            },
            "confidence": {
                "type": "score",
                "instructions": "How confident is this trading signal?",
                "criteria": ["Very weak signal, mostly noise", "Weak signal, some indicators align",
                             "Moderate signal, most indicators align", "Strong signal, clear trend with volume confirmation"]
            },
            "bullish": {"type": "noul", "instructions": "Is the overall trend bullish based on the indicators?"}
        }
    }

    resp = httpx.post(f"{JEV_BASE_URL}/systemone",
        headers={"Authorization": f"Bearer {JEV_API_KEY}", "Content-Type": "application/json"},
        json=payload, timeout=30)
    resp.raise_for_status()
    answers = resp.json().get("answers", {})

    action_data = answers.get("action", {})
    action = action_data.get("choice", "hold").lower()
    if action not in ("buy", "sell", "hold"):
        action = "hold"

    confidence_data = answers.get("confidence", {})
    raw_score = confidence_data.get("score", 0)
    action_confidence = action_data.get("confidence", 0.5)
    combined_confidence = (raw_score / 3.0 + action_confidence) / 2.0

    probs = action_data.get("probabilities", {})
    reason = f"{action} ({probs.get(action, 0)*100:.0f}% prob), signal strength {raw_score:.1f}/3"

    return {"action": action, "confidence": round(min(max(combined_confidence, 0), 1), 2), "reason": reason,
            "bullish": answers.get("bullish", {}).get("choice", False)}

# ─── Risk ─────────────────────────────────────────────────────────────────────

def check_risk(action, confidence, symbol, price, positions, bot_state):
    if bot_state.get("kill_switch") == "true":
        return False, "Kill switch is active"
    if confidence < MIN_CONFIDENCE:
        return False, f"Confidence {confidence:.2f} below threshold {MIN_CONFIDENCE}"
    if action == "buy":
        if len(positions) >= MAX_OPEN_POSITIONS:
            return False, f"Already at max {MAX_OPEN_POSITIONS} positions"
        if symbol in positions:
            return False, f"Already holding {symbol}"
        daily_loss = float(bot_state.get("daily_loss", "0"))
        if daily_loss < -(MAX_DAILY_LOSS_PCT * STARTING_CAPITAL):
            return False, f"Daily loss limit reached: ${daily_loss:.2f}"
    if action == "sell" and symbol not in positions:
        return False, f"No position in {symbol} to sell"
    return True, "Approved"

# ─── Orders ───────────────────────────────────────────────────────────────────

def calculate_qty(price):
    return max(math.floor(STARTING_CAPITAL * MAX_POSITION_PCT / price), 1)

def place_order(symbol, side, qty):
    resp = httpx.post(f"{ALPACA_BASE_URL}/v2/orders", headers=_alpaca_headers(),
        json={"symbol": symbol, "qty": str(qty), "side": side, "type": "market", "time_in_force": "day"})
    resp.raise_for_status()
    return resp.json()

# ─── Cycle ────────────────────────────────────────────────────────────────────

def run_cycle():
    results = []
    positions = get_positions()
    bot_state = get_bot_state()
    set_bot_state("last_run", datetime.now(timezone.utc).isoformat())
    set_bot_state("daily_loss", "0")

    for symbol in WATCHLIST:
        try:
            bars = fetch_bars(symbol, timeframe="1Day", limit=50)
            if len(bars) < 21:
                results.append({"symbol": symbol, "status": "skipped", "reason": "Not enough data"})
                continue
            state = build_state(bars)
            ai_resp = ask_ai(symbol, state)
            action = ai_resp.get("action", "hold")
            confidence = float(ai_resp.get("confidence", 0))
            reason = ai_resp.get("reason", "")

            if action == "hold":
                results.append({"symbol": symbol, "status": "hold", "confidence": confidence, "reason": reason})
                continue

            approved, risk_msg = check_risk(action, confidence, symbol, state["price"], positions, bot_state)
            if not approved:
                results.append({"symbol": symbol, "status": "blocked", "action": action, "reason": risk_msg})
                continue

            if action == "buy":
                qty = calculate_qty(state["price"])
                place_order(symbol, "buy", qty)
                save_position(symbol, {"qty": qty, "avg_price": state["price"]})
                positions[symbol] = {"qty": qty, "avg_price": state["price"]}
            elif action == "sell":
                pos = positions[symbol]
                qty = int(pos["qty"])
                place_order(symbol, "sell", qty)
                pnl = (state["price"] - float(pos["avg_price"])) * qty
                remove_position(symbol)
                del positions[symbol]
                daily_loss = float(bot_state.get("daily_loss", "0")) + pnl
                set_bot_state("daily_loss", str(daily_loss))
                bot_state["daily_loss"] = str(daily_loss)

            save_trade({"symbol": symbol, "side": action, "qty": qty, "price": state["price"], "confidence": confidence, "reason": reason})
            results.append({"symbol": symbol, "status": "executed", "action": action, "confidence": confidence})
        except Exception as e:
            results.append({"symbol": symbol, "status": "error", "reason": str(e)})

    total_equity = STARTING_CAPITAL
    for sym, pos in positions.items():
        try:
            current = fetch_latest_price(sym)
            total_equity += (current - float(pos["avg_price"])) * int(pos["qty"])
        except Exception:
            pass
    save_equity_snapshot({"total_equity": total_equity, "positions_count": len(positions)})
    return {"cycle": "complete", "results": results, "equity": total_equity}

# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(title="DhanBot Trading")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def api_health():
    try:
        r = _redis_cmd("PING")
        redis_ok = r == "PONG"
    except Exception as e:
        redis_ok = str(e)
    return {"ok": True, "redis_url": bool(UPSTASH_REDIS_URL), "alpaca_key": bool(ALPACA_API_KEY), "redis": redis_ok}


class ManualOrder(BaseModel):
    symbol: str
    side: str
    qty: Optional[int] = None

class AnalyzeRequest(BaseModel):
    symbol: str


@app.post("/api/run-cycle")
def api_run_cycle():
    try:
        return run_cycle()
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}

@app.post("/api/manual-trade")
def api_manual_trade(order: ManualOrder):
    try:
        symbol = order.symbol.upper()
        side = order.side.lower()
        if side not in ("buy", "sell"):
            return {"error": "Side must be 'buy' or 'sell'"}
        price = fetch_latest_price(symbol)
        positions = get_positions()
        if side == "buy":
            if symbol in positions:
                return {"error": f"Already holding {symbol}"}
            if len(positions) >= 5:
                return {"error": "Max 5 positions reached"}
            qty = order.qty or calculate_qty(price)
            place_order(symbol, "buy", qty)
            save_position(symbol, {"qty": qty, "avg_price": price})
            save_trade({"symbol": symbol, "side": "buy", "qty": qty, "price": price, "confidence": 1.0, "reason": "Manual buy"})
            return {"status": "executed", "symbol": symbol, "side": "buy", "qty": qty, "price": price}
        elif side == "sell":
            if symbol not in positions:
                return {"error": f"No position in {symbol} to sell"}
            pos = positions[symbol]
            qty = order.qty or int(pos["qty"])
            place_order(symbol, "sell", qty)
            remove_position(symbol)
            save_trade({"symbol": symbol, "side": "sell", "qty": qty, "price": price, "confidence": 1.0, "reason": "Manual sell"})
            pnl = (price - float(pos["avg_price"])) * qty
            return {"status": "executed", "symbol": symbol, "side": "sell", "qty": qty, "price": price, "pnl": round(pnl, 2)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/analyze")
def api_analyze(req: AnalyzeRequest):
    try:
        symbol = req.symbol.upper()
        bars = fetch_bars(symbol, timeframe="1Day", limit=50)
        if len(bars) < 21:
            return {"error": "Not enough market data"}
        state = build_state(bars)
        ai_result = ask_ai(symbol, state)
        return {"symbol": symbol, "price": state["price"],
                "indicators": {"sma_10": state["sma_10"], "sma_20": state["sma_20"], "rsi_14": state["rsi_14"], "volume_ratio": state["volume_ratio"]},
                "ai": ai_result}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/trades")
def api_trades(limit: int = Query(50, ge=1, le=500)):
    try:
        return get_trades(limit)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/positions")
def api_positions():
    try:
        return get_positions()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/chart-data")
def api_chart_data(symbol: str = Query(...), limit: int = Query(50, ge=1, le=200)):
    try:
        return fetch_bars(symbol, timeframe="1Day", limit=limit)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/equity")
def api_equity(limit: int = Query(90, ge=1, le=365)):
    try:
        return get_equity_history(limit)
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/status")
def api_status():
    try:
        return get_bot_state()
    except Exception as e:
        return {"error": str(e)}
