"""HTTP client for the Seedance 2.5 reference-to-video endpoint (stdlib only)."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Callable

from .params import SeedanceInput

BASE_URL = "https://api.higgsfield.ai"
MODEL_ID = "bytedance/seedance-2.5/reference-to-video"

PENDING_STATUSES = {"queued", "in_progress"}
TERMINAL_ERROR_STATUSES = {"failed", "nsfw", "canceled"}


class SeedanceError(RuntimeError):
    """Transport or API error."""

    def __init__(self, message: str, status_code: int | None = None, body: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


class RequestFailed(SeedanceError):
    """The generation ended in a failed, nsfw or canceled state."""

    def __init__(self, status: dict[str, Any]):
        state = status.get("status")
        detail = status.get("error") or state
        super().__init__(f"request {status.get('request_id')} ended with status {state!r}: {detail}", body=status)
        self.status = status


class SeedanceClient:
    def __init__(
        self,
        credentials: str | None = None,
        base_url: str = BASE_URL,
        timeout: float = 60.0,
        opener: Callable[..., Any] | None = None,
    ):
        credentials = credentials or os.environ.get("HF_KEY") or os.environ.get("HF_CREDENTIALS")
        if not credentials or ":" not in credentials:
            raise SeedanceError("credentials must be 'KEY_ID:KEY_SECRET' (set HF_KEY or pass credentials=)")
        self._auth = f"Key {credentials}"
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._open = opener or urllib.request.urlopen

    @property
    def endpoint(self) -> str:
        return f"{self.base_url}/{MODEL_ID}"

    def _request(self, method: str, url: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        data = json.dumps(payload).encode() if payload is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", self._auth)
        req.add_header("Accept", "application/json")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with self._open(req, timeout=self.timeout) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")
            raise SeedanceError(f"HTTP {exc.code} from {url}: {body}", exc.code, body) from None
        except urllib.error.URLError as exc:
            raise SeedanceError(f"could not reach {url}: {exc.reason}") from None
        return json.loads(raw) if raw else {}

    def submit(self, params: SeedanceInput | dict[str, Any]) -> dict[str, Any]:
        """Queue a generation and return the initial request status."""
        payload = params.to_payload() if isinstance(params, SeedanceInput) else SeedanceInput(**params).to_payload()
        return self._request("POST", self.endpoint, payload)

    def status(self, status_url: str) -> dict[str, Any]:
        return self._request("GET", status_url)

    def cancel(self, cancel_url: str) -> dict[str, Any]:
        return self._request("POST", cancel_url)

    def wait(
        self,
        submitted: dict[str, Any],
        poll_interval: float = 5.0,
        timeout: float | None = 30 * 60,
        on_update: Callable[[dict[str, Any]], None] | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> dict[str, Any]:
        """Poll until the request completes; raise RequestFailed on failed/nsfw/canceled."""
        status = submitted
        status_url = submitted.get("status_url")
        deadline = time.monotonic() + timeout if timeout is not None else None
        while True:
            state = status.get("status")
            if on_update:
                on_update(status)
            if state == "completed":
                return status
            if state in TERMINAL_ERROR_STATUSES:
                raise RequestFailed(status)
            if state not in PENDING_STATUSES:
                raise SeedanceError(f"unexpected status {state!r}", body=status)
            if not status_url:
                raise SeedanceError("response has no status_url to poll", body=status)
            if deadline is not None and time.monotonic() >= deadline:
                raise SeedanceError(f"timed out waiting for request {status.get('request_id')}", body=status)
            sleep(poll_interval)
            status = self.status(status_url)
            status_url = status.get("status_url") or status_url

    def subscribe(self, params: SeedanceInput | dict[str, Any], **wait_kwargs: Any) -> dict[str, Any]:
        """Submit and wait for a terminal result. Returns the completed status (with `video.url`)."""
        return self.wait(self.submit(params), **wait_kwargs)
