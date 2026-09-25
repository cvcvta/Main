import io
import json
import unittest
import urllib.error

from seedance25 import (
    RequestFailed,
    SeedanceClient,
    SeedanceError,
    SeedanceInput,
    ValidationError,
    estimate_cost,
    estimate_tokens,
)

IMG = "https://example.com/a.png"


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class FakeOpener:
    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def __call__(self, req, timeout=None):
        self.requests.append(req)
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return FakeResponse(json.dumps(item).encode())


def pending(state="queued"):
    return {
        "request_id": "11111111-1111-1111-1111-111111111111",
        "status": state,
        "status_url": "https://api.higgsfield.ai/requests/1/status",
        "cancel_url": "https://api.higgsfield.ai/requests/1/cancel",
    }


class ParamsTest(unittest.TestCase):
    def test_defaults_payload(self):
        payload = SeedanceInput(image_urls=[IMG]).to_payload()
        self.assertEqual(
            payload,
            {
                "duration": 5,
                "resolution": "720p",
                "aspect_ratio": "16:9",
                "bitrate_mode": "high",
                "generate_audio": True,
                "image_urls": [IMG],
            },
        )

    def test_requires_a_reference(self):
        with self.assertRaises(ValidationError):
            SeedanceInput(prompt="hi").validate()
        SeedanceInput(audio_urls=["https://example.com/a.mp3"]).validate()
        SeedanceInput(video_urls=["https://example.com/a.mp4"]).validate()

    def test_bounds(self):
        for kwargs in (
            {"duration": 3},
            {"duration": 31},
            {"duration": True},
            {"resolution": "1080p"},
            {"aspect_ratio": "2:1"},
            {"bitrate_mode": "low"},
            {"prompt": ""},
            {"image_urls": []},
            {"image_urls": ["not a url"]},
            {"image_urls": [IMG] * 31},
            {"video_urls": [IMG] * 11},
        ):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValidationError):
                SeedanceInput(**{"image_urls": [IMG], **kwargs}).validate()
        SeedanceInput(image_urls=[IMG] * 30, duration=30).validate()


class PricingTest(unittest.TestCase):
    def test_tokens_720p_16x9(self):
        # 5 s * 1280 * 720 * 24 / 1024 = 108000
        self.assertEqual(estimate_tokens(5), 108000)
        self.assertAlmostEqual(estimate_cost(5), 108000 / 1000 * 0.0214)

    def test_video_input_is_billed_at_discount(self):
        tokens = estimate_tokens(5, input_video_seconds=5)
        self.assertEqual(tokens, 216000)
        self.assertAlmostEqual(estimate_cost(5, input_video_seconds=5), 216 * 0.01284)

    def test_explicit_dimensions_and_ceil(self):
        self.assertEqual(estimate_tokens(1, width=10, height=10), 3)  # 2400/1024 = 2.34 -> 3


class ClientTest(unittest.TestCase):
    def client(self, responses):
        opener = FakeOpener(responses)
        return SeedanceClient("id:secret", opener=opener), opener

    def test_subscribe_polls_until_completed(self):
        done = {**pending(), "status": "completed", "video": {"url": "https://cdn/x.mp4"}}
        client, opener = self.client([pending(), pending("in_progress"), done])
        result = client.subscribe(SeedanceInput(image_urls=[IMG], prompt="a cat"), sleep=lambda _: None)
        self.assertEqual(result["video"]["url"], "https://cdn/x.mp4")

        submit = opener.requests[0]
        self.assertEqual(submit.full_url, "https://api.higgsfield.ai/bytedance/seedance-2.5/reference-to-video")
        self.assertEqual(submit.get_method(), "POST")
        self.assertEqual(submit.get_header("Authorization"), "Key id:secret")
        self.assertEqual(json.loads(submit.data)["prompt"], "a cat")
        self.assertEqual([r.get_method() for r in opener.requests[1:]], ["GET", "GET"])

    def test_terminal_errors_raise(self):
        for state in ("failed", "nsfw", "canceled"):
            client, _ = self.client([pending(), {**pending(), "status": state, "error": "boom"}])
            with self.subTest(state=state), self.assertRaises(RequestFailed):
                client.subscribe({"image_urls": [IMG]}, sleep=lambda _: None)

    def test_timeout(self):
        client, _ = self.client([pending()])
        with self.assertRaises(SeedanceError):
            client.wait(pending(), timeout=0, sleep=lambda _: None)

    def test_http_error(self):
        err = urllib.error.HTTPError("u", 401, "Unauthorized", {}, io.BytesIO(b'{"detail":"bad key"}'))
        client, _ = self.client([err])
        with self.assertRaises(SeedanceError) as ctx:
            client.submit({"image_urls": [IMG]})
        self.assertEqual(ctx.exception.status_code, 401)

    def test_invalid_input_never_sent(self):
        client, opener = self.client([])
        with self.assertRaises(ValidationError):
            client.submit({"duration": 5})
        self.assertEqual(opener.requests, [])

    def test_credentials_required(self):
        with self.assertRaises(SeedanceError):
            SeedanceClient("no-colon")


if __name__ == "__main__":
    unittest.main()
