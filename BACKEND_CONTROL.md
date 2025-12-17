# Backend Control Commands

## Quick Commands

### Start Backend
```bash
./scripts/backend-control.sh start
```

### Stop Backend
```bash
./scripts/backend-control.sh stop
```

### Restart Backend
```bash
./scripts/backend-control.sh restart
```

### Check Status
```bash
./scripts/backend-control.sh status
```

### View Logs
```bash
./scripts/backend-control.sh logs
# Or
tail -f /tmp/backend.log
```

## Manual Commands

### Start (Development Mode)
```bash
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

## See Also

- [FRONTEND_CONTROL.md](FRONTEND_CONTROL.md) - Frontend control guide
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Complete development guide
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick command reference
