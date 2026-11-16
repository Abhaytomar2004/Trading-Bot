class IndicatorService:
    @staticmethod
    def sma(closes: list[float], period: int) -> float | None:
        if len(closes) < period:
            return None
        return sum(closes[-period:]) / period

    @staticmethod
    def rsi(closes: list[float], period: int = 14) -> float | None:
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

    @staticmethod
    def volume_ratio(volumes: list[float], period: int = 20) -> float | None:
        if len(volumes) < period + 1:
            return None
        avg_vol = sum(volumes[-period - 1:-1]) / period
        return volumes[-1] / avg_vol if avg_vol else None

    @staticmethod
    def build_state(bars: list[dict]) -> dict:
        closes = [b["close"] for b in bars]
        volumes = [b["volume"] for b in bars]
        latest = bars[-1]
        return {
            "price": latest["close"],
            "open": latest["open"],
            "high": latest["high"],
            "low": latest["low"],
            "sma_10": IndicatorService.sma(closes, 10),
            "sma_20": IndicatorService.sma(closes, 20),
            "rsi_14": IndicatorService.rsi(closes, 14),
            "volume_ratio": IndicatorService.volume_ratio(volumes, 20),
        }


indicator_service = IndicatorService()
