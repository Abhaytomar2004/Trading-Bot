def sma(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    return sum(closes[-period:]) / period


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
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def volume_ratio(volumes: list[float], period: int = 20) -> float | None:
    if len(volumes) < period + 1:
        return None
    avg_vol = sum(volumes[-period - 1 : -1]) / period
    if avg_vol == 0:
        return None
    return volumes[-1] / avg_vol


def build_state(bars: list[dict]) -> dict:
    closes = [b["close"] for b in bars]
    volumes = [b["volume"] for b in bars]
    latest = bars[-1]
    return {
        "price": latest["close"],
        "sma_10": sma(closes, 10),
        "sma_20": sma(closes, 20),
        "rsi_14": rsi(closes, 14),
        "volume_ratio": volume_ratio(volumes, 20),
        "high": latest["high"],
        "low": latest["low"],
        "open": latest["open"],
    }
