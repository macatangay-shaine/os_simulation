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
    
    # Path to uvicorn in venv
    uvicorn_path = os.path.join(backend_dir, "venv", "Scripts", "uvicorn.exe")
    
    print("🚀 Starting JezOS Kernel...")
    print(f"📁 Working directory: {backend_dir}")
    print(f"🔧 Using uvicorn: {uvicorn_path}\n")
    
    # Start uvicorn
    subprocess.run([uvicorn_path, "main:app", "--reload"])
