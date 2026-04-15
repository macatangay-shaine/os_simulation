"""Compatibility entrypoint for Uvicorn and existing scripts."""

import os

import uvicorn

from app.main import app

__all__ = ["app"]


if __name__ == "__main__":
	uvicorn.run(
		"main:app",
		host="127.0.0.1",
		port=8000,
		reload=True,
		reload_dirs=[os.path.dirname(__file__)],
	)
