# Backend Control Commands

## Quick Commands

### Start Backend
```bash
cd /Users/nagmani/nag2mani/dev/sarthak
./scripts/backend-control.sh start
```

### Stop Backend
```bash
cd /Users/nagmani/nag2mani/dev/sarthak
./scripts/backend-control.sh stop
```

### Restart Backend
```bash
cd /Users/nagmani/nag2mani/dev/sarthak
./scripts/backend-control.sh restart
```

### Check Status
```bash
cd /Users/nagmani/nag2mani/dev/sarthak
./scripts/backend-control.sh status
```

### View Logs
```bash
cd /Users/nagmani/nag2mani/dev/sarthak
./scripts/backend-control.sh logs
# Or
tail -f /tmp/backend.log
```

## Manual Commands

### Start (Development Mode)
```bash
cd /Users/nagmani/nag2mani/dev/sarthak
NODE_ENV=development npm run start:dev
```

### Stop (Kill Process)
```bash
pkill -f "nest start"
# Or kill by port
lsof -ti:3000 | xargs kill -9
```

### Check if Running
```bash
curl http://localhost:3000/api/v1/health
```

## What Was Fixed

1. **Infinite Loop Issue**: Fixed `TransactionsTable` useEffect dependencies that were causing repeated API calls
2. **Error Flooding**: Added retry limits and better error handling to prevent toast message spam
3. **Network Errors**: Now properly handles network errors without showing unnecessary error messages

## Troubleshooting

If you see "Failed to load" messages:
1. Check if backend is running: `./scripts/backend-control.sh status`
2. Check backend logs: `./scripts/backend-control.sh logs`
3. Restart backend: `./scripts/backend-control.sh restart`
4. Check database: `docker-compose ps`

## See Also

- [FRONTEND_CONTROL.md](FRONTEND_CONTROL.md) - Frontend control guide
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Complete development guide
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick command reference
