import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from trading.cycle import run_cycle
from trading.market_data import fetch_bars, fetch_latest_price
from trading.orders import place_order, calculate_qty
from trading.redis_store import (
    get_trades, get_positions, get_equity_history, get_bot_state,
    save_trade, save_position, remove_position, get_positions,
)
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="DhanBot Trading")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/run-cycle")
def api_run_cycle():
    try:
        return run_cycle()
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}


class ManualOrder(BaseModel):
    symbol: str
    side: str  # "buy" or "sell"
    qty: Optional[int] = None  # None = auto-calculate for buy, sell all for sell


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
            result = place_order(symbol, "buy", qty)
            save_position(symbol, {"qty": qty, "avg_price": price})
            save_trade({
                "symbol": symbol,
                "side": "buy",
                "qty": qty,
                "price": price,
                "confidence": 1.0,
                "reason": "Manual buy",
            })
            return {"status": "executed", "symbol": symbol, "side": "buy", "qty": qty, "price": price}

        elif side == "sell":
            if symbol not in positions:
                return {"error": f"No position in {symbol} to sell"}
            pos = positions[symbol]
            qty = order.qty or int(pos["qty"])
            result = place_order(symbol, "sell", qty)
            remove_position(symbol)
            save_trade({
                "symbol": symbol,
                "side": "sell",
                "qty": qty,
                "price": price,
                "confidence": 1.0,
                "reason": "Manual sell",
            })
            pnl = (price - float(pos["avg_price"])) * qty
            return {"status": "executed", "symbol": symbol, "side": "sell", "qty": qty, "price": price, "pnl": round(pnl, 2)}

    except Exception as e:
        return {"error": str(e)}


class AnalyzeRequest(BaseModel):
    symbol: str


@app.post("/api/analyze")
def api_analyze(req: AnalyzeRequest):
    try:
        from trading.market_data import fetch_bars as _fetch_bars
        from trading.indicators import build_state
        from trading.ai_engine import ask_ai

        symbol = req.symbol.upper()
        bars = _fetch_bars(symbol, timeframe="1Day", limit=50)
        if len(bars) < 21:
            return {"error": "Not enough market data"}
        state = build_state(bars)
        ai_result = ask_ai(symbol, state)
        return {
            "symbol": symbol,
            "price": state["price"],
            "indicators": {
                "sma_10": state["sma_10"],
                "sma_20": state["sma_20"],
                "rsi_14": state["rsi_14"],
                "volume_ratio": state["volume_ratio"],
            },
            "ai": ai_result,
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/trades")
def api_trades(limit: int = Query(50, ge=1, le=500)):
    return get_trades(limit)


@app.get("/api/positions")
def api_positions():
    return get_positions()


@app.get("/api/chart-data")
def api_chart_data(symbol: str = Query(...), limit: int = Query(50, ge=1, le=200)):
    return fetch_bars(symbol, timeframe="1Day", limit=limit)


@app.get("/api/equity")
def api_equity(limit: int = Query(90, ge=1, le=365)):
    return get_equity_history(limit)


@app.get("/api/status")
def api_status():
    return get_bot_state()
