"""Thin HTTP client for Munafa's one real network dependency.

Munafa has no backend of its own -- no Express server, no database, no auth.
The frontend calls the Yahoo Finance "unofficial" chart API directly from the
browser, routed through a same-origin rewrite (see vercel.json /
vite.config.js: `/api/yahoo/*` -> `https://query1.finance.yahoo.com/*`) purely
to dodge CORS. That rewrite is the one piece of "backend" surface the app
actually has, so it's what this client talks to.

`base_url` defaults to the live Vercel deployment but is fully overridable via
MUNAFA_BASE_URL, so the same tests can run against a preview deployment or a
local `vite preview` instance.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import requests

from config import BASE_URL, REQUEST_TIMEOUT


@dataclass
class APIClient:
    base_url: str = BASE_URL
    timeout: float = REQUEST_TIMEOUT
    auth_token: str | None = None
    session: requests.Session = field(default_factory=requests.Session)

    def _headers(self, extra: dict | None = None) -> dict:
        headers = {"Accept": "application/json"}
        # Munafa doesn't have auth today, but requests can carry a bearer
        # token so the client doesn't need to change shape if that lands.
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        if extra:
            headers.update(extra)
        return headers

    def get_raw(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        timeout: float | None = None,
        headers: dict | None = None,
    ) -> requests.Response:
        """GET an arbitrary path under base_url. Raises requests exceptions
        (Timeout, ConnectionError, ...) rather than swallowing them -- callers
        decide whether that counts as a failure or an expected condition."""
        url = f"{self.base_url}{path}"
        return self.session.get(
            url,
            params=params,
            timeout=timeout or self.timeout,
            headers=self._headers(headers),
        )

    def get_yahoo_chart(
        self,
        symbol: str,
        interval: str = "1d",
        range_: str = "1mo",
        timeout: float | None = None,
    ) -> requests.Response:
        """Hit the proxied Yahoo Finance chart endpoint the app itself uses
        (see src/services/stockService.js:fetchYahooChart)."""
        path = f"/api/yahoo/v8/finance/chart/{symbol}"
        return self.get_raw(path, params={"interval": interval, "range": range_}, timeout=timeout)

    def close(self) -> None:
        self.session.close()
