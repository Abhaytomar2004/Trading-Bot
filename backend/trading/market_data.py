import httpx
from datetime import datetime, timedelta, timezone


def _headers():
    from trading.config import ALPACA_API_KEY, ALPACA_SECRET_KEY
    return {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
    }


def _data_url():
    from trading.config import ALPACA_DATA_URL
    return ALPACA_DATA_URL


def fetch_bars(symbol: str, timeframe: str = "1Day", limit: int = 50) -> list[dict]:
    url = f"{_data_url()}/v2/stocks/{symbol}/bars"
    start = (datetime.now(timezone.utc) - timedelta(days=limit * 2)).strftime("%Y-%m-%dT00:00:00Z")
    params = {"timeframe": timeframe, "limit": limit, "start": start}
    resp = httpx.get(url, headers=_headers(), params=params)
    resp.raise_for_status()
    bars = resp.json().get("bars", [])
    return [
        {
            "timestamp": b["t"],
            "open": b["o"],
            "high": b["h"],
            "low": b["l"],
            "close": b["c"],
            "volume": b["v"],
        }
        for b in bars
    ]


def fetch_latest_price(symbol: str) -> float:
    url = f"{_data_url()}/v2/stocks/{symbol}/trades/latest"
    resp = httpx.get(url, headers=_headers())
    resp.raise_for_status()
    return resp.json()["trade"]["p"]
