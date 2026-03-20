#!/usr/bin/env python3
"""
launch_server.py — Chronos Tutorial launcher
Starts the Flask statistical server (server.py) using the project venv.
"""
import os, sys, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.join(BASE, 'venv', 'bin', 'python3')

# Use venv Python if available, else fall back to system Python
python = venv_python if os.path.exists(venv_python) else sys.executable

print("Starting Chronos Tutorial server…")
os.execv(python, [python, os.path.join(BASE, 'server.py')])
