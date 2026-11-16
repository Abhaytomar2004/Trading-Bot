import json
from datetime import datetime, timezone

import httpx

from app.config import settings


class RedisRepository:
    def _cmd(self, *args):
        resp = httpx.post(
            settings.UPSTASH_REDIS_URL,
            headers={"Authorization": f"Bearer {settings.UPSTASH_REDIS_TOKEN}"},
            json=list(args),
        )
        resp.raise_for_status()
        return resp.json().get("result")

    def ping(self) -> bool:
        return self._cmd("PING") == "PONG"

    # ── Trades ────────────────────────────────────────────────────────────

    def save_trade(self, trade: dict):
        trade["timestamp"] = datetime.now(timezone.utc).isoformat()
        self._cmd("LPUSH", "trades:log", json.dumps(trade))

    def get_trades(self, limit: int = 50) -> list[dict]:
        raw = self._cmd("LRANGE", "trades:log", "0", str(limit - 1))
        return [json.loads(r) for r in (raw or [])]

    # ── Positions ─────────────────────────────────────────────────────────

    def save_position(self, symbol: str, position: dict):
        self._cmd("HSET", "positions:current", symbol, json.dumps(position))

    def remove_position(self, symbol: str):
        self._cmd("HDEL", "positions:current", symbol)

    def get_positions(self) -> dict[str, dict]:
        raw = self._cmd("HGETALL", "positions:current")
        if not raw:
            return {}
        if isinstance(raw, dict):
            return {k: json.loads(v) for k, v in raw.items()}
        positions = {}
        for i in range(0, len(raw), 2):
            positions[raw[i]] = json.loads(raw[i + 1])
        return positions

    # ── Equity ────────────────────────────────────────────────────────────

    def save_equity_snapshot(self, snapshot: dict):
        snapshot["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self._cmd("LPUSH", "equity:history", json.dumps(snapshot))

    def get_equity_history(self, limit: int = 90) -> list[dict]:
        raw = self._cmd("LRANGE", "equity:history", "0", str(limit - 1))
        return [json.loads(r) for r in (raw or [])]

    # ── Bot State ─────────────────────────────────────────────────────────

    def get_bot_state(self) -> dict:
        raw = self._cmd("HGETALL", "bot:state")
        if not raw:
            return {}
        if isinstance(raw, dict):
            return raw
        state = {}
        for i in range(0, len(raw), 2):
            state[raw[i]] = raw[i + 1]
        return state

    def set_bot_state(self, key: str, value: str):
        self._cmd("HSET", "bot:state", key, value)


redis_repo = RedisRepository()
