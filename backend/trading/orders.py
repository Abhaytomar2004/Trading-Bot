import httpx
import math


def _headers():
    from trading.config import ALPACA_API_KEY, ALPACA_SECRET_KEY
    return {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
    }


def calculate_qty(price: float) -> int:
    from trading.config import MAX_POSITION_PCT, STARTING_CAPITAL
    max_spend = STARTING_CAPITAL * MAX_POSITION_PCT
    qty = math.floor(max_spend / price)
    return max(qty, 1)


def place_order(symbol: str, side: str, qty: int) -> dict:
    from trading.config import ALPACA_BASE_URL
    url = f"{ALPACA_BASE_URL}/v2/orders"
    payload = {
        "symbol": symbol,
        "qty": str(qty),
        "side": side,
        "type": "market",
        "time_in_force": "day",
    }
    resp = httpx.post(url, headers=_headers(), json=payload)
    resp.raise_for_status()
    return resp.json()
