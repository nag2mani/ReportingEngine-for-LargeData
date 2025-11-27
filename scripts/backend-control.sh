#!/bin/bash

# Backend Control Script for Reporting Engine
# This script automatically detects the project root directory

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is one level up from scripts directory
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

case "$1" in
  start)
    echo "Starting backend..."
    cd "$PROJECT_ROOT"
    NODE_ENV=development npm run start:dev > /tmp/backend.log 2>&1 &
    echo "Backend started. PID: $!"
    echo "Logs: tail -f /tmp/backend.log"
    ;;
  stop)
    echo "Stopping backend..."
    pkill -f "nest start" || echo "No backend process found"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 is free"
    echo "Backend stopped"
    ;;
  restart)
    echo "Restarting backend..."
    $0 stop
    sleep 2
    $0 start
    ;;
  status)
    if lsof -ti:3000 > /dev/null 2>&1; then
      echo "✅ Backend is running on port 3000"
      curl -s http://localhost:3000/api/v1/health | head -1
    else
      echo "❌ Backend is not running"
    fi
    ;;
  logs)
    tail -f /tmp/backend.log
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
