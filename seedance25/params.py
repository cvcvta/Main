"""Request parameters for bytedance/seedance-2.5/reference-to-video.

Validation mirrors the published input JSON schema (additionalProperties: false).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlparse

RESOLUTIONS = ("480p", "720p")
ASPECT_RATIOS = ("16:9", "4:3", "1:1", "3:4", "9:16", "21:9")
BITRATE_MODES = ("standard", "high")

MIN_DURATION, MAX_DURATION = 4, 30
MAX_IMAGES, MAX_VIDEOS, MAX_AUDIOS = 30, 10, 10


class ValidationError(ValueError):
    """Raised when an input does not satisfy the model's schema."""


def _check_urls(name: str, urls: list[str] | None, max_items: int) -> None:
    if urls is None:
        return
    if not isinstance(urls, list) or not urls:
        raise ValidationError(f"{name} must be a non-empty list when provided")
    if len(urls) > max_items:
        raise ValidationError(f"{name} accepts at most {max_items} items, got {len(urls)}")
    for url in urls:
        parsed = urlparse(url) if isinstance(url, str) else None
        if not parsed or not parsed.scheme or not parsed.netloc:
            raise ValidationError(f"{name} contains an invalid URI: {url!r}")


@dataclass
class SeedanceInput:
    prompt: str | None = None
    duration: int = 5
    image_urls: list[str] | None = None
    video_urls: list[str] | None = None
    audio_urls: list[str] | None = None
    resolution: str = "720p"
    aspect_ratio: str = "16:9"
    bitrate_mode: str = "high"
    generate_audio: bool = True
    extra: dict[str, Any] = field(default_factory=dict)

    def validate(self) -> None:
        if self.prompt is not None and (not isinstance(self.prompt, str) or not self.prompt):
            raise ValidationError("prompt must be a non-empty string when provided")
        if isinstance(self.duration, bool) or not isinstance(self.duration, int):
            raise ValidationError("duration must be an integer")
        if not MIN_DURATION <= self.duration <= MAX_DURATION:
            raise ValidationError(f"duration must be between {MIN_DURATION} and {MAX_DURATION}")
        if self.resolution not in RESOLUTIONS:
            raise ValidationError(f"resolution must be one of {RESOLUTIONS}")
        if self.aspect_ratio not in ASPECT_RATIOS:
            raise ValidationError(f"aspect_ratio must be one of {ASPECT_RATIOS}")
        if self.bitrate_mode not in BITRATE_MODES:
            raise ValidationError(f"bitrate_mode must be one of {BITRATE_MODES}")
        if not isinstance(self.generate_audio, bool):
            raise ValidationError("generate_audio must be a boolean")
        _check_urls("image_urls", self.image_urls, MAX_IMAGES)
        _check_urls("video_urls", self.video_urls, MAX_VIDEOS)
        _check_urls("audio_urls", self.audio_urls, MAX_AUDIOS)
        # Schema: if no image_urls, then video_urls; if neither, audio_urls is required.
        if not (self.image_urls or self.video_urls or self.audio_urls):
            raise ValidationError("at least one of image_urls, video_urls or audio_urls is required")

    def to_payload(self) -> dict[str, Any]:
        self.validate()
        payload: dict[str, Any] = {
            "duration": self.duration,
            "resolution": self.resolution,
            "aspect_ratio": self.aspect_ratio,
            "bitrate_mode": self.bitrate_mode,
            "generate_audio": self.generate_audio,
        }
        for key in ("prompt", "image_urls", "video_urls", "audio_urls"):
            value = getattr(self, key)
            if value is not None:
                payload[key] = value
        payload.update(self.extra)
        return payload
