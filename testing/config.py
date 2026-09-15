"""Central place for env-driven settings, so nothing in the suite hardcodes a URL or secret."""
import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def _clean(url: str) -> str:
    return url.rstrip("/")


BASE_URL = _clean(os.getenv("MUNAFA_BASE_URL", "https://munafa-io.vercel.app"))
REQUEST_TIMEOUT = float(os.getenv("MUNAFA_REQUEST_TIMEOUT", "10"))
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5")
