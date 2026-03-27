"""Compatibility entrypoint for Uvicorn and existing scripts."""

from app.main import app

__all__ = ["app"]
