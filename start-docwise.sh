#!/bin/bash

ROOT="$HOME/Projects/docwise-ai"
mkdir -p "$ROOT/logs"

# Start backend only if it is not responding.
if ! curl -fsS http://127.0.0.1:8000/docs >/dev/null 2>&1; then
  echo "Starting DocWise AI backend..."
  cd "$ROOT/backend"
  nohup "$ROOT/backend/.venv/bin/python" -m uvicorn main:app \
    --host 127.0.0.1 --port 8000 \
    > "$ROOT/logs/backend.log" 2>&1 < /dev/null &
fi

# Start frontend only if it is not responding.
if ! curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; then
  echo "Starting DocWise AI frontend..."
  cd "$ROOT/frontend"
  nohup npm run dev -- --host 127.0.0.1 \
    > "$ROOT/logs/frontend.log" 2>&1 < /dev/null &
fi

# Wait for both services to respond.
for i in {1..30}; do
  BACKEND=0
  FRONTEND=0

  curl -fsS http://127.0.0.1:8000/docs >/dev/null 2>&1 && BACKEND=1
  curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1 && FRONTEND=1

  if [ "$BACKEND" = 1 ] && [ "$FRONTEND" = 1 ]; then
    echo ""
    echo "DocWise AI is running!"
    echo "Frontend: http://localhost:5173/"
    echo "Backend:  http://127.0.0.1:8000/docs"
    exit 0
  fi

  sleep 2
done

echo "A service did not start. Check these logs:"
echo "$ROOT/logs/backend.log"
echo "$ROOT/logs/frontend.log"
exit 1
