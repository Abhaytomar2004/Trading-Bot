from trading.config import (
    MIN_CONFIDENCE,
    MAX_DAILY_LOSS_PCT,
    MAX_POSITION_PCT,
    MAX_OPEN_POSITIONS,
    STARTING_CAPITAL,
)


def check_risk(
    action: str,
    confidence: float,
    symbol: str,
    price: float,
    positions: dict,
    bot_state: dict,
) -> tuple[bool, str]:
    if bot_state.get("kill_switch") == "true":
        return False, "Kill switch is active"

    if confidence < MIN_CONFIDENCE:
        return False, f"Confidence {confidence:.2f} below threshold {MIN_CONFIDENCE}"

    if action == "buy":
        if len(positions) >= MAX_OPEN_POSITIONS:
            return False, f"Already at max {MAX_OPEN_POSITIONS} positions"

        if symbol in positions:
            return False, f"Already holding {symbol}"

        daily_loss = float(bot_state.get("daily_loss", "0"))
        if daily_loss < -(MAX_DAILY_LOSS_PCT * STARTING_CAPITAL):
            return False, f"Daily loss limit reached: ${daily_loss:.2f}"

    if action == "sell":
        if symbol not in positions:
            return False, f"No position in {symbol} to sell"

    return True, "Approved"
