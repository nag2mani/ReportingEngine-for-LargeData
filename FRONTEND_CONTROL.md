# Frontend Control Guide

Quick reference for controlling the frontend development server.

## Using the Control Script

### Stop Frontend

```bash
cd /Users/nagmani/nag2mani/dev/sarthak
./scripts/frontend-control.sh stop
```

### Check Status

```bash
./scripts/frontend-control.sh status
```

## Manual Methods

### Method 1: Ctrl+C (If running in terminal)

If you started the frontend with:
```bash
cd frontend
npm run dev
```

Simply press `Ctrl+C` (or `Cmd+C` on Mac) in that terminal to stop it.

### Method 2: Kill by Port

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Method 3: Kill Vite Process

```bash
# Kill all vite processes
pkill -f "vite"

# Or kill npm dev processes
pkill -f "npm.*dev"
```

## Starting Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:5173

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5173
lsof -i:5173

# Kill it
lsof -ti:5173 | xargs kill -9
```

### Frontend Won't Stop

```bash
# Force kill all node processes (⚠️ kills all node processes)
pkill -9 node

# Or more specific
pkill -9 -f "vite"
```

### Check if Frontend is Running

```bash
# Using script
./scripts/frontend-control.sh status

# Manual check
curl http://localhost:5173
lsof -i:5173
```

## Quick Commands

```bash
# Stop
./scripts/frontend-control.sh stop

# Status
./scripts/frontend-control.sh status

# Start (manual)
cd frontend && npm run dev
```

## See Also

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Complete development guide
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick command reference
- [BACKEND_CONTROL.md](BACKEND_CONTROL.md) - Backend control guide
