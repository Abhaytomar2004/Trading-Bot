from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings


class AlpacaRepository:
    def _headers(self) -> dict:
        return {
            "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY,
        }

    def fetch_bars(self, symbol: str, timeframe: str = "1Day", limit: int = 50) -> list[dict]:
        url = f"{settings.ALPACA_DATA_URL}/v2/stocks/{symbol}/bars"
        start = (datetime.now(timezone.utc) - timedelta(days=limit * 2)).strftime("%Y-%m-%dT00:00:00Z")
        resp = httpx.get(url, headers=self._headers(), params={"timeframe": timeframe, "limit": limit, "start": start})
        resp.raise_for_status()
        return [
            {"timestamp": b["t"], "open": b["o"], "high": b["h"], "low": b["l"], "close": b["c"], "volume": b["v"]}
            for b in resp.json().get("bars", [])
        ]

    def fetch_latest_price(self, symbol: str) -> float:
        url = f"{settings.ALPACA_DATA_URL}/v2/stocks/{symbol}/trades/latest"
        resp = httpx.get(url, headers=self._headers())
        resp.raise_for_status()
        return resp.json()["trade"]["p"]

    def place_order(self, symbol: str, side: str, qty: int) -> dict:
        resp = httpx.post(
            f"{settings.ALPACA_BASE_URL}/v2/orders",
            headers=self._headers(),
            json={"symbol": symbol, "qty": str(qty), "side": side, "type": "market", "time_in_force": "day"},
        )
        resp.raise_for_status()
        return resp.json()


alpaca_repo = AlpacaRepository()
