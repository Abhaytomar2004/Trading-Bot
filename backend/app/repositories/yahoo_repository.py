import httpx
from datetime import datetime, timedelta, timezone


class YahooRepository:
    _BASE = "https://query1.finance.yahoo.com/v8/finance/chart"

    def _yahoo_symbol(self, symbol: str, exchange: str = "NSE") -> str:
        if exchange == "BSE":
            return f"{symbol}.BO"
        return f"{symbol}.NS"

    def fetch_bars(self, symbol: str, exchange: str = "NSE", limit: int = 50) -> list[dict]:
        ysym = self._yahoo_symbol(symbol, exchange)
        if limit <= 7:
            range_str, interval = "7d", "1d"
        elif limit <= 30:
            range_str, interval = "1mo", "1d"
        elif limit <= 90:
            range_str, interval = "3mo", "1d"
        else:
            range_str, interval = "6mo", "1d"

        resp = httpx.get(
            f"{self._BASE}/{ysym}",
            params={"interval": interval, "range": range_str},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        resp.raise_for_status()
        data = resp.json()

        result = data.get("chart", {}).get("result", [])
        if not result:
            return []

        quote = result[0]
        timestamps = quote.get("timestamp", [])
        ohlcv = quote.get("indicators", {}).get("quote", [{}])[0]

        bars = []
        for i in range(len(timestamps)):
            o = ohlcv.get("open", [None])[i]
            h = ohlcv.get("high", [None])[i]
            l = ohlcv.get("low", [None])[i]
            c = ohlcv.get("close", [None])[i]
            v = ohlcv.get("volume", [None])[i]
            if o is None or c is None:
                continue
            bars.append({
                "timestamp": datetime.fromtimestamp(timestamps[i], tz=timezone.utc).isoformat(),
                "open": round(float(o), 2),
                "high": round(float(h), 2),
                "low": round(float(l), 2),
                "close": round(float(c), 2),
                "volume": int(v) if v else 0,
            })

        return bars[-limit:]

    def search(self, query: str) -> list[dict]:
        resp = httpx.get(
            "https://query2.finance.yahoo.com/v1/finance/search",
            params={"q": query, "quotesCount": 20, "newsCount": 0},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for q in data.get("quotes", []):
            sym = q.get("symbol", "")
            if sym.endswith(".NS") or sym.endswith(".BO"):
                results.append({
                    "symbol": sym.replace(".NS", "").replace(".BO", ""),
                    "name": q.get("shortname", q.get("longname", "")),
                    "exchange": "NSE" if sym.endswith(".NS") else "BSE",
                    "yahoo_symbol": sym,
                })
        return results[:20]

    def fetch_latest_price(self, symbol: str, exchange: str = "NSE") -> dict:
        ysym = self._yahoo_symbol(symbol, exchange)
        resp = httpx.get(
            f"{self._BASE}/{ysym}",
            params={"interval": "1d", "range": "2d"},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        resp.raise_for_status()
        data = resp.json()
        result = data.get("chart", {}).get("result", [])
        if not result:
            return {"symbol": symbol, "price": 0, "change": 0}

        meta = result[0].get("meta", {})
        price = meta.get("regularMarketPrice", 0)
        prev = meta.get("previousClose", price)
        change_pct = ((price - prev) / prev * 100) if prev else 0

        return {
            "symbol": symbol,
            "price": round(float(price), 2),
            "prev_close": round(float(prev), 2),
            "change_pct": round(change_pct, 2),
        }


yahoo_repo = YahooRepository()
