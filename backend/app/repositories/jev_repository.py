import httpx

from app.config import settings


class JevRepository:
    def ask(self, state_text: str, questions: dict) -> dict:
        payload = {"state": state_text, "model": "jev-1.14.0", "questions": questions}
        resp = httpx.post(
            f"{settings.JEV_BASE_URL}/systemone",
            headers={"Authorization": f"Bearer {settings.JEV_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get("answers", {})


jev_repo = JevRepository()
