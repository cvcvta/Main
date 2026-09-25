"""Command line entry point: python -m seedance25 --image URL --prompt "..." """

from __future__ import annotations

import argparse
import json
import sys

from .client import SeedanceClient, SeedanceError
from .params import ASPECT_RATIOS, BITRATE_MODES, RESOLUTIONS, SeedanceInput, ValidationError
from .pricing import estimate_cost, estimate_tokens


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="seedance25", description="Seedance 2.5 reference-to-video")
    p.add_argument("--prompt")
    p.add_argument("--image", dest="image_urls", action="append", help="image reference URL (repeatable)")
    p.add_argument("--video", dest="video_urls", action="append", help="video reference URL (repeatable)")
    p.add_argument("--audio", dest="audio_urls", action="append", help="audio reference URL (repeatable)")
    p.add_argument("--duration", type=int, default=5)
    p.add_argument("--resolution", choices=RESOLUTIONS, default="720p")
    p.add_argument("--aspect-ratio", choices=ASPECT_RATIOS, default="16:9")
    p.add_argument("--bitrate-mode", choices=BITRATE_MODES, default="high")
    p.add_argument("--no-audio", dest="generate_audio", action="store_false")
    p.add_argument("--input-video-seconds", type=float, default=0.0,
                   help="total length of video references, for the cost estimate")
    p.add_argument("--estimate", action="store_true", help="print the cost estimate and exit")
    p.add_argument("--no-wait", action="store_true", help="submit and print the request status without polling")
    p.add_argument("--poll-interval", type=float, default=5.0)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    params = SeedanceInput(
        prompt=args.prompt,
        duration=args.duration,
        image_urls=args.image_urls,
        video_urls=args.video_urls,
        audio_urls=args.audio_urls,
        resolution=args.resolution,
        aspect_ratio=args.aspect_ratio,
        bitrate_mode=args.bitrate_mode,
        generate_audio=args.generate_audio,
    )
    try:
        params.validate()
    except ValidationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    has_video = bool(args.video_urls)
    tokens = estimate_tokens(args.duration, args.resolution, args.aspect_ratio, args.input_video_seconds)
    cost = estimate_cost(args.duration, args.resolution, args.aspect_ratio, args.input_video_seconds, has_video)
    print(f"estimated: {tokens:,} tokens, ${cost:.4f}", file=sys.stderr)
    if args.estimate:
        return 0

    try:
        client = SeedanceClient()
        submitted = client.submit(params)
        if args.no_wait:
            print(json.dumps(submitted, indent=2))
            return 0
        result = client.wait(
            submitted,
            poll_interval=args.poll_interval,
            on_update=lambda s: print(f"status: {s.get('status')}", file=sys.stderr),
        )
    except SeedanceError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
