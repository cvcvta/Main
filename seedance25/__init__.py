"""Minimal client for Higgsfield's Seedance 2.5 reference-to-video API."""

from .client import SeedanceClient, SeedanceError, RequestFailed
from .params import SeedanceInput, ValidationError
from .pricing import estimate_cost, estimate_tokens, output_dimensions

__all__ = [
    "SeedanceClient",
    "SeedanceError",
    "RequestFailed",
    "SeedanceInput",
    "ValidationError",
    "estimate_cost",
    "estimate_tokens",
    "output_dimensions",
]
