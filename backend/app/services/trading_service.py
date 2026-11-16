import math
from datetime import datetime, timezone

from app.config import settings
from app.repositories.alpaca_repository import alpaca_repo
from app.repositories.redis_repository import redis_repo
from app.services.ai_service import ai_service
from app.services.indicator_service import indicator_service
from app.services.risk_service import risk_service


class TradingService:
    def calculate_qty(self, price: float) -> int:
        return max(math.floor(settings.STARTING_CAPITAL * settings.MAX_POSITION_PCT / price), 1)

    def run_cycle(self) -> dict:
        results = []
        positions = redis_repo.get_positions()
        bot_state = redis_repo.get_bot_state()
        redis_repo.set_bot_state("last_run", datetime.now(timezone.utc).isoformat())
        redis_repo.set_bot_state("daily_loss", "0")

        for symbol in settings.WATCHLIST:
            try:
                result = self._process_symbol(symbol, positions, bot_state)
                results.append(result)
            except Exception as e:
                results.append({"symbol": symbol, "status": "error", "reason": str(e)})

        equity = self._calculate_equity(positions)
        redis_repo.save_equity_snapshot({"total_equity": equity, "positions_count": len(positions)})
        return {"cycle": "complete", "results": results, "equity": equity}

    def _process_symbol(self, symbol: str, positions: dict, bot_state: dict) -> dict:
        bars = alpaca_repo.fetch_bars(symbol, timeframe="1Day", limit=50)
        if len(bars) < 21:
            return {"symbol": symbol, "status": "skipped", "reason": "Not enough data"}

        state = indicator_service.build_state(bars)
        ai_resp = ai_service.analyze(symbol, state)
        action = ai_resp["action"]
        confidence = ai_resp["confidence"]
        reason = ai_resp["reason"]

        if action == "hold":
            return {"symbol": symbol, "status": "hold", "confidence": confidence, "reason": reason}

        approved, risk_msg = risk_service.check(action, confidence, symbol, positions, bot_state)
        if not approved:
            return {"symbol": symbol, "status": "blocked", "action": action, "reason": risk_msg}

        qty = self._execute_action(action, symbol, state["price"], positions, bot_state)
        redis_repo.save_trade({
            "symbol": symbol, "side": action, "qty": qty,
            "price": state["price"], "confidence": confidence, "reason": reason,
        })
        return {"symbol": symbol, "status": "executed", "action": action, "confidence": confidence}

    def _execute_action(self, action: str, symbol: str, price: float, positions: dict, bot_state: dict) -> int:
        if action == "buy":
            qty = self.calculate_qty(price)
            alpaca_repo.place_order(symbol, "buy", qty)
            redis_repo.save_position(symbol, {"qty": qty, "avg_price": price})
            positions[symbol] = {"qty": qty, "avg_price": price}
            return qty

        pos = positions[symbol]
        qty = int(pos["qty"])
        alpaca_repo.place_order(symbol, "sell", qty)
        pnl = (price - float(pos["avg_price"])) * qty
        redis_repo.remove_position(symbol)
        del positions[symbol]
        daily_loss = float(bot_state.get("daily_loss", "0")) + pnl
        redis_repo.set_bot_state("daily_loss", str(daily_loss))
        bot_state["daily_loss"] = str(daily_loss)
        return qty

    def manual_trade(self, symbol: str, side: str, qty: int | None = None) -> dict:
        symbol = symbol.upper()
        side = side.lower()
        if side not in ("buy", "sell"):
            return {"error": "Side must be 'buy' or 'sell'"}

        price = alpaca_repo.fetch_latest_price(symbol)
        positions = redis_repo.get_positions()

        if side == "buy":
            if symbol in positions:
                return {"error": f"Already holding {symbol}"}
            if len(positions) >= settings.MAX_OPEN_POSITIONS:
                return {"error": f"Max {settings.MAX_OPEN_POSITIONS} positions reached"}
            qty = qty or self.calculate_qty(price)
            alpaca_repo.place_order(symbol, "buy", qty)
            redis_repo.save_position(symbol, {"qty": qty, "avg_price": price})
            redis_repo.save_trade({"symbol": symbol, "side": "buy", "qty": qty, "price": price, "confidence": 1.0, "reason": "Manual buy"})
            return {"status": "executed", "symbol": symbol, "side": "buy", "qty": qty, "price": price}

        if symbol not in positions:
            return {"error": f"No position in {symbol} to sell"}
        pos = positions[symbol]
        qty = qty or int(pos["qty"])
        alpaca_repo.place_order(symbol, "sell", qty)
        redis_repo.remove_position(symbol)
        redis_repo.save_trade({"symbol": symbol, "side": "sell", "qty": qty, "price": price, "confidence": 1.0, "reason": "Manual sell"})
        pnl = (price - float(pos["avg_price"])) * qty
        return {"status": "executed", "symbol": symbol, "side": "sell", "qty": qty, "price": price, "pnl": round(pnl, 2)}

    def analyze(self, symbol: str) -> dict:
        symbol = symbol.upper()
        bars = alpaca_repo.fetch_bars(symbol, timeframe="1Day", limit=50)
        if len(bars) < 21:
            return {"error": "Not enough market data"}
        state = indicator_service.build_state(bars)
        ai_result = ai_service.analyze(symbol, state)
        return {
            "symbol": symbol,
            "price": state["price"],
            "indicators": {
                "sma_10": state["sma_10"], "sma_20": state["sma_20"],
                "rsi_14": state["rsi_14"], "volume_ratio": state["volume_ratio"],
            },
            "ai": ai_result,
        }

    def _calculate_equity(self, positions: dict) -> float:
        total = settings.STARTING_CAPITAL
        for sym, pos in positions.items():
            try:
                current = alpaca_repo.fetch_latest_price(sym)
                total += (current - float(pos["avg_price"])) * int(pos["qty"])
            except Exception:
                pass
        return total


trading_service = TradingService()
