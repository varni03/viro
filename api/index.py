# Vercel serverless entrypoint — serves the FastAPI app from main.py.
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app as viro_app  # noqa: E402

# Vercel's rewrite can hand us "/api/index/<path>" instead of "/<path>" —
# strip that prefix so FastAPI sees the real route.
_PREFIXES = ("/api/index.py", "/api/index")


async def app(scope, receive, send):
    if scope["type"] in ("http", "websocket"):
        original_path = scope.get("path", "")
        path = original_path
        for prefix in _PREFIXES:
            if path == prefix or path.startswith(prefix + "/"):
                path = path[len(prefix):] or "/"
                break

        # ?__debug=1 on any URL echoes what Vercel passed in (no secrets).
        if scope["type"] == "http" and b"__debug=1" in scope.get("query_string", b""):
            body = json.dumps({
                "path_received": original_path,
                "path_routed": path,
                "root_path": scope.get("root_path", ""),
                "raw_path": (scope.get("raw_path") or b"").decode("latin-1"),
                "headers": sorted(k.decode() for k, _ in scope.get("headers", [])),
            }).encode()
            await send({"type": "http.response.start", "status": 200,
                        "headers": [(b"content-type", b"application/json")]})
            await send({"type": "http.response.body", "body": body})
            return

        scope = dict(scope, path=path, raw_path=path.encode(), root_path="")
    await viro_app(scope, receive, send)
