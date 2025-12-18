#!/bin/bash

# Frontend Control Script - manages Vite frontend process (stop/status) and port cleanup

case "$1" in
  stop)
    echo "Stopping frontend..."
    # Kill vite process
    pkill -f "vite" 2>/dev/null || echo "No vite process found"
    # Kill node process running on port 5173
    lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "Port 5173 is free"
    echo "Frontend stopped"
    ;;
  status)
    if lsof -ti:5173 > /dev/null 2>&1; then
      echo "✅ Frontend is running on port 5173"
      curl -s http://localhost:5173 | head -1
    else
      echo "❌ Frontend is not running"
    fi
    ;;
  *)
    echo "Usage: $0 {stop|status}"
    echo ""
    echo "To start frontend, run:"
    echo "  cd frontend && npm run dev"
    exit 1
    ;;
esac
