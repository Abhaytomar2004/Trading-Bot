from datetime import datetime, timezone
from trading.config import WATCHLIST
from trading.market_data import fetch_bars, fetch_latest_price
from trading.indicators import build_state
from trading.ai_engine import ask_ai
from trading.risk import check_risk
from trading.orders import place_order, calculate_qty
from trading.redis_store import (
    get_positions,
    save_position,
    remove_position,
    save_trade,
    save_equity_snapshot,
    get_bot_state,
    set_bot_state,
)


def run_cycle() -> dict:
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
                order = place_order(symbol, "buy", qty)
                save_position(symbol, {"qty": qty, "avg_price": state["price"]})
                positions[symbol] = {"qty": qty, "avg_price": state["price"]}
            elif action == "sell":
                pos = positions[symbol]
                order = place_order(symbol, "sell", int(pos["qty"]))
                pnl = (state["price"] - float(pos["avg_price"])) * int(pos["qty"])
                remove_position(symbol)
                del positions[symbol]
                daily_loss = float(bot_state.get("daily_loss", "0")) + pnl
                set_bot_state("daily_loss", str(daily_loss))
                bot_state["daily_loss"] = str(daily_loss)

            save_trade({
                "symbol": symbol,
                "side": action,
                "qty": qty if action == "buy" else int(pos["qty"]),
                "price": state["price"],
                "confidence": confidence,
                "reason": reason,
            })

            results.append({"symbol": symbol, "status": "executed", "action": action, "confidence": confidence})

        except Exception as e:
            results.append({"symbol": symbol, "status": "error", "reason": str(e)})

    total_equity = _calculate_equity(positions)
    save_equity_snapshot({"total_equity": total_equity, "positions_count": len(positions)})

    return {"cycle": "complete", "results": results, "equity": total_equity}


def _calculate_equity(positions: dict) -> float:
    from trading.config import STARTING_CAPITAL
    equity = STARTING_CAPITAL
    for symbol, pos in positions.items():
        try:
            current = fetch_latest_price(symbol)
            equity += (current - float(pos["avg_price"])) * int(pos["qty"])
        except Exception:
            pass
    return equity
