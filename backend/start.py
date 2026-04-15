"""
Quick start script for JezOS backend server.
Run this from the backend directory: python start.py
"""

import subprocess
import sys
import os

if __name__ == "__main__":
    # Ensure we're in the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    print("🚀 Starting JezOS Kernel...")
    print(f"📁 Working directory: {backend_dir}")
    print(f"🔧 Using Python: {sys.executable}\n")

    # Start uvicorn using the current Python environment.
    subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--reload"], cwd=backend_dir)
