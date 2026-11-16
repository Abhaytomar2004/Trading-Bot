from app.config import settings


class RiskService:
    def check(self, action: str, confidence: float, symbol: str, positions: dict, bot_state: dict) -> tuple[bool, str]:
        if bot_state.get("kill_switch") == "true":
            return False, "Kill switch is active"

        if confidence < settings.MIN_CONFIDENCE:
            return False, f"Confidence {confidence:.2f} below threshold {settings.MIN_CONFIDENCE}"

        if action == "buy":
            if len(positions) >= settings.MAX_OPEN_POSITIONS:
                return False, f"Already at max {settings.MAX_OPEN_POSITIONS} positions"
            if symbol in positions:
                return False, f"Already holding {symbol}"
            daily_loss = float(bot_state.get("daily_loss", "0"))
            if daily_loss < -(settings.MAX_DAILY_LOSS_PCT * settings.STARTING_CAPITAL):
                return False, f"Daily loss limit reached: ${daily_loss:.2f}"

        if action == "sell" and symbol not in positions:
            return False, f"No position in {symbol} to sell"

        return True, "Approved"


risk_service = RiskService()
