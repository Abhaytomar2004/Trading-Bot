from app.repositories.jev_repository import jev_repo


class AIService:
    def analyze(self, symbol: str, state: dict) -> dict:
        state_text = self._build_state_text(symbol, state)
        questions = self._build_questions()
        answers = jev_repo.ask(state_text, questions)
        return self._parse_response(answers)

    def _build_state_text(self, symbol: str, state: dict) -> str:
        sma10 = f"${state['sma_10']:.2f}" if state["sma_10"] else "N/A"
        sma20 = f"${state['sma_20']:.2f}" if state["sma_20"] else "N/A"
        rsi_val = f"{state['rsi_14']:.1f}" if state["rsi_14"] else "N/A"
        volr = f"{state['volume_ratio']:.2f}" if state["volume_ratio"] else "N/A"

        return (
            f"Stock: {symbol}\nCurrent Price: ${state['price']:.2f}\n"
            f"Open: ${state['open']:.2f}, High: ${state['high']:.2f}, Low: ${state['low']:.2f}\n"
            f"SMA(10): {sma10}\nSMA(20): {sma20}\nRSI(14): {rsi_val}\nVolume Ratio: {volr}\n"
            f"Price vs SMA10: {'above' if state['sma_10'] and state['price'] > state['sma_10'] else 'below'}\n"
            f"Price vs SMA20: {'above' if state['sma_20'] and state['price'] > state['sma_20'] else 'below'}"
        )

    def _build_questions(self) -> dict:
        return {
            "action": {
                "type": "choice",
                "instructions": "Based on the technical indicators, what trading action should be taken?",
                "criteria": {
                    "buy": "Bullish signals: RSI below 40, price above SMA, strong volume, upward momentum",
                    "sell": "Bearish signals: RSI above 70, price below SMA, declining momentum, overbought",
                    "hold": "Mixed or neutral signals: no clear direction, wait for better entry/exit",
                },
            },
            "confidence": {
                "type": "score",
                "instructions": "How confident is this trading signal?",
                "criteria": [
                    "Very weak signal, mostly noise",
                    "Weak signal, some indicators align",
                    "Moderate signal, most indicators align",
                    "Strong signal, clear trend with volume confirmation",
                ],
            },
            "bullish": {"type": "noul", "instructions": "Is the overall trend bullish based on the indicators?"},
        }

    def _parse_response(self, answers: dict) -> dict:
        action_data = answers.get("action", {})
        action = action_data.get("choice", "hold").lower()
        if action not in ("buy", "sell", "hold"):
            action = "hold"

        confidence_data = answers.get("confidence", {})
        raw_score = confidence_data.get("score", 0)
        action_confidence = action_data.get("confidence", 0.5)
        combined_confidence = (raw_score / 3.0 + action_confidence) / 2.0

        probs = action_data.get("probabilities", {})
        reason = f"{action} ({probs.get(action, 0) * 100:.0f}% prob), signal strength {raw_score:.1f}/3"

        return {
            "action": action,
            "confidence": round(min(max(combined_confidence, 0), 1), 2),
            "reason": reason,
            "bullish": answers.get("bullish", {}).get("choice", False),
        }


ai_service = AIService()
