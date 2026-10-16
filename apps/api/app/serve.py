"""Run the local processing stack: Cloudflare quick tunnel + API (+ worker).

    python -m app.serve                     # Cloudflare quick tunnel + API + worker
    python -m app.serve --tunnel tailscale  # Tailscale Funnel (stable URL, port 443 only)
    python -m app.serve --tunnel none

A quick tunnel is free and needs no account, but its URL changes on every start. The API heartbeats
the new URL to Supabase (`backend_endpoints`), so the deployed frontend finds it without a redeploy.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import threading
from pathlib import Path

URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
CANDIDATES = [
    shutil.which("cloudflared"),
    r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
    r"C:\Program Files\cloudflared\cloudflared.exe",
]


def find_cloudflared() -> str:
    for c in CANDIDATES:
        if c and Path(c).exists():
            return c
    sys.exit("cloudflared not found. Install it: winget install Cloudflare.cloudflared")


def start_tunnel(port: int) -> tuple[subprocess.Popen, str]:
    proc = subprocess.Popen(
        [
            find_cloudflared(),
            "tunnel",
            "--no-autoupdate",
            "--protocol",
            "http2",
            "--url",
            f"http://127.0.0.1:{port}",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    assert proc.stdout
    for line in proc.stdout:
        if m := URL_RE.search(line):
            # keep draining output so the pipe never blocks the tunnel
            threading.Thread(target=lambda: [None for _ in proc.stdout], daemon=True).start()
            return proc, m.group(0)
    sys.exit("cloudflared exited before printing a tunnel URL")


def start_funnel(port: int) -> tuple[subprocess.Popen, str]:
    """Tailscale Funnel: free, works where only outbound 443 is allowed, stable *.ts.net URL."""
    ts = shutil.which("tailscale") or r"C:\Program Files\Tailscale\tailscale.exe"
    if not Path(ts).exists():
        sys.exit("tailscale not found. Install from https://tailscale.com/download and run `tailscale up`.")
    status = json.loads(
        subprocess.run([ts, "status", "--json"], capture_output=True, text=True, check=True).stdout
    )
    url = "https://" + status["Self"]["DNSName"].rstrip(".")
    return subprocess.Popen([ts, "funnel", str(port)]), url


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--tunnel", choices=["cloudflare", "tailscale", "none"], default="cloudflare")
    ap.add_argument("--no-worker", action="store_true")
    args = ap.parse_args()

    procs: list[subprocess.Popen] = []
    if args.tunnel != "none":
        tunnel, url = (start_tunnel if args.tunnel == "cloudflare" else start_funnel)(args.port)
        procs.append(tunnel)
        os.environ["PUBLIC_API_URL"] = url
        print(f"Tunnel: {url}", flush=True)
    if not args.no_worker and Path(__file__).with_name("workers").joinpath("run.py").exists():
        procs.append(
            subprocess.Popen([sys.executable, "-m", "app.workers.run"], cwd=Path(__file__).parents[1])
        )

    import uvicorn

    try:
        uvicorn.run("app.main:app", host="127.0.0.1", port=args.port, app_dir=str(Path(__file__).parents[1]))
    finally:
        for p in procs:
            p.terminate()


if __name__ == "__main__":
    main()
