# seedance25

A Python client for Higgsfield's **Seedance 2.5 Reference to Video** model
(`bytedance/seedance-2.5/reference-to-video`). It uses only the standard library.

- Checks input against the model's JSON schema before sending anything.
- Submits requests and polls `status_url` until the request finishes.
- Raises `RequestFailed` when a request ends as `failed`, `nsfw` or `canceled`.
- Estimates cost from the published token-metered pricing.
- Includes a small command-line tool.

## Setup

```bash
pip install -e .
export HF_KEY="YOUR_KEY_ID:YOUR_KEY_SECRET"   # HF_CREDENTIALS also works
```

Keep your credentials on the server. Never ship them to a browser.

## Python

```python
from seedance25 import SeedanceClient, SeedanceInput

client = SeedanceClient()  # reads HF_KEY
result = client.subscribe(SeedanceInput(
    prompt="The character walks through a neon-lit street at night",
    image_urls=["https://example.com/character.png"],
    duration=8,
    aspect_ratio="9:16",
))
print(result["video"]["url"])
```

To drive the request yourself, call `submit()`, then `status(status_url)`,
`wait(submitted)` or `cancel(cancel_url)`.

## CLI

```bash
# Print the estimated cost only
python -m seedance25 --image https://example.com/a.png --duration 10 --estimate

# Generate and wait for the result
python -m seedance25 --image https://example.com/a.png --prompt "slow dolly in" --aspect-ratio 9:16

# Video reference: pass its length so the estimate includes it
python -m seedance25 --video https://example.com/in.mp4 --input-video-seconds 6 --prompt "restyle as anime"
```

## Parameters

| Parameter | Type | Default | Constraints |
| --- | --- | --- | --- |
| `prompt` | string | — | non-empty |
| `duration` | int | `5` | 4–30 seconds |
| `image_urls` | list[URI] | — | 1–30 items |
| `video_urls` | list[URI] | — | 1–10 items |
| `audio_urls` | list[URI] | — | 1–10 items |
| `resolution` | string | `720p` | `480p`, `720p` |
| `aspect_ratio` | string | `16:9` | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` |
| `bitrate_mode` | string | `high` | `standard`, `high` |
| `generate_audio` | bool | `true` | |

You must pass at least one of `image_urls`, `video_urls` or `audio_urls`.

The docs' "Additional Documentation" section also mentions `output_format`
(`mp4`/`mov`). The JSON schema does not include it and sets
`additionalProperties: false`, so this client follows the schema and sends
`bitrate_mode` instead. If the API later accepts `output_format`, pass it with
`SeedanceInput(..., extra={"output_format": "mov"})`.

## Pricing

```
tokens = ceil((input_video_s + generated_s) × width × height × 24 / 1024)
cost   = tokens / 1000 × $0.0214            (no video input)
       = tokens / 1000 × $0.01284           (with video input, 0.6×)
```

Image and audio references are not billed. The docs don't publish the exact
output size for each aspect ratio. `seedance25.pricing.DIMENSIONS` uses
Seedance's standard sizes (for example, 720p 16:9 is 1280×720), so treat the
estimates as approximate. Prices are before any customer discount.

## Tests

```bash
python -m unittest discover -s tests -v
```
