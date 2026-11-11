import httpx
from trading.config import JEV_API_KEY, JEV_BASE_URL


def ask_ai(symbol: str, state: dict) -> dict:
    sma10 = f"${state['sma_10']:.2f}" if state['sma_10'] else "N/A"
    sma20 = f"${state['sma_20']:.2f}" if state['sma_20'] else "N/A"
    rsi = f"{state['rsi_14']:.1f}" if state['rsi_14'] else "N/A"
    volr = f"{state['volume_ratio']:.2f}" if state['volume_ratio'] else "N/A"

    state_text = (
        f"Stock: {symbol}\n"
        f"Current Price: ${state['price']:.2f}\n"
        f"Open: ${state['open']:.2f}, High: ${state['high']:.2f}, Low: ${state['low']:.2f}\n"
        f"SMA(10): {sma10}\n"
        f"SMA(20): {sma20}\n"
        f"RSI(14): {rsi}\n"
        f"Volume Ratio: {volr}\n"
        f"Price vs SMA10: {'above' if state['sma_10'] and state['price'] > state['sma_10'] else 'below'}\n"
        f"Price vs SMA20: {'above' if state['sma_20'] and state['price'] > state['sma_20'] else 'below'}"
    )

    payload = {
        "state": state_text,
        "model": "jev-1.14.0",
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
                "criteria": [
                    "Very weak signal, mostly noise",
                    "Weak signal, some indicators align",
                    "Moderate signal, most indicators align",
                    "Strong signal, clear trend with volume confirmation"
                ]
            },
            "bullish": {
                "type": "noul",
                "instructions": "Is the overall trend bullish based on the indicators?"
            }
        }
    }

    resp = httpx.post(
        f"{JEV_BASE_URL}/systemone",
        headers={
            "Authorization": f"Bearer {JEV_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    result = resp.json()
    answers = result.get("answers", {})

    action_data = answers.get("action", {})
    action = action_data.get("choice", "hold").lower()
    if action not in ("buy", "sell", "hold"):
        action = "hold"

    confidence_data = answers.get("confidence", {})
    raw_score = confidence_data.get("score", 0)
    confidence = raw_score / 3.0

    action_confidence = action_data.get("confidence", 0.5)
    combined_confidence = (confidence + action_confidence) / 2.0

    bullish_data = answers.get("bullish", {})
    bullish = bullish_data.get("choice", False)

    probs = action_data.get("probabilities", {})
    reason = f"{action} ({probs.get(action, 0)*100:.0f}% prob), signal strength {raw_score:.1f}/3"

    return {
        "action": action,
        "confidence": round(min(max(combined_confidence, 0), 1), 2),
        "reason": reason,
        "bullish": bullish,
    }
