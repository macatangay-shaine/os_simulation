"""Compatibility entrypoint for Uvicorn and existing scripts."""

import os

import uvicorn

from app.main import app

__all__ = ["app"]


if __name__ == "__main__":
	# Support both local development and production deployment
	# Render and other deployment platforms set PORT environment variable
	port = int(os.getenv("PORT", 8000))
	host = os.getenv("HOST", "127.0.0.1")
	is_production = os.getenv("ENVIRONMENT", "development") == "production"
	
	uvicorn.run(
		"main:app",
		host=host,
		port=port,
		reload=not is_production,
		reload_dirs=[os.path.dirname(__file__)] if not is_production else None,
	)
