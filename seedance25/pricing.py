"""Cost estimation for Seedance 2.5 reference-to-video.

Billable tokens = ceil((input video s + generated s) * width * height * 24 / 1024).
Image and audio references are not billed as video input.

The API docs do not publish exact output dimensions per aspect ratio; the table
below uses ByteDance's standard Seedance output sizes, so treat results as
estimates. Pass explicit width/height if you know the real output size.
"""

from __future__ import annotations

import math

FPS = 24
RATE_PER_1K_TOKENS = 0.0214  # USD, 480p/720p, no video input
VIDEO_INPUT_MULTIPLIER = 0.6  # 0.01284 per 1k tokens when video references are used

DIMENSIONS: dict[str, dict[str, tuple[int, int]]] = {
    "480p": {
        "16:9": (864, 480),
        "4:3": (736, 544),
        "1:1": (640, 640),
        "3:4": (544, 736),
        "9:16": (480, 864),
        "21:9": (960, 416),
    },
    "720p": {
        "16:9": (1280, 720),
        "4:3": (1112, 834),
        "1:1": (960, 960),
        "3:4": (834, 1112),
        "9:16": (720, 1280),
        "21:9": (1470, 630),
    },
}


def output_dimensions(resolution: str, aspect_ratio: str) -> tuple[int, int]:
    try:
        return DIMENSIONS[resolution][aspect_ratio]
    except KeyError:
        raise ValueError(f"unknown resolution/aspect ratio: {resolution} {aspect_ratio}") from None


def estimate_tokens(
    duration: float,
    resolution: str = "720p",
    aspect_ratio: str = "16:9",
    input_video_seconds: float = 0.0,
    width: int | None = None,
    height: int | None = None,
) -> int:
    if width is None or height is None:
        width, height = output_dimensions(resolution, aspect_ratio)
    return math.ceil((input_video_seconds + duration) * width * height * FPS / 1024)


def estimate_cost(
    duration: float,
    resolution: str = "720p",
    aspect_ratio: str = "16:9",
    input_video_seconds: float = 0.0,
    has_video_input: bool | None = None,
    width: int | None = None,
    height: int | None = None,
) -> float:
    """Return the estimated USD cost before any customer discount."""
    if has_video_input is None:
        has_video_input = input_video_seconds > 0
    tokens = estimate_tokens(duration, resolution, aspect_ratio, input_video_seconds, width, height)
    rate = RATE_PER_1K_TOKENS * (VIDEO_INPUT_MULTIPLIER if has_video_input else 1.0)
    return tokens / 1000 * rate
