# Quick Reference Card

## 🚀 Start Everything

```bash
# 1. Start database
docker-compose up -d postgres redis

# 2. Start backend
./scripts/backend-control.sh start

# 3. Start frontend (new terminal)
cd frontend && npm run dev
```

## 🛑 Stop Everything

```bash
# Stop backend
./scripts/backend-control.sh stop

# Stop frontend
./scripts/frontend-control.sh stop
# OR Press Ctrl+C in frontend terminal

# Stop database
docker-compose stop postgres redis
```

## 📊 Add Data

```bash
# Seed database (small scale)
npm run seed -- --scale=small

# Seed database (custom)
npm run seed -- --schools=10 --students=500
```

## 🔧 Common Commands

### Backend
```bash
./scripts/backend-control.sh start      # Start
./scripts/backend-control.sh stop       # Stop
./scripts/backend-control.sh restart    # Restart
./scripts/backend-control.sh status     # Check status
./scripts/backend-control.sh logs       # View logs
```

### Frontend
```bash
./scripts/frontend-control.sh stop    # Stop
./scripts/frontend-control.sh status  # Check status
cd frontend
npm run dev          # Development
npm run build        # Build
npm run preview      # Preview build
```

### Database
```bash
docker-compose ps                    # Check status
docker-compose logs -f postgres      # View logs
docker-compose exec postgres psql -U postgres -d reporting_engine  # Connect
```

## 🔍 Check Status

```bash
# Backend health
curl http://localhost:3000/api/v1/health

# Frontend
curl http://localhost:5173

# Database
docker-compose ps
```

## 🐛 Troubleshooting

```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Clear and reinstall
rm -rf node_modules dist
npm install
cd frontend && rm -rf node_modules && npm install
```

## 📝 Default Credentials

- **Platform Admin**: `admin@platform.com` / `password123`
- **School Admin**: `admin@school<id>.com` / `password123`
- **Accountant**: `accountant@school<id>.com` / `password123`

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/api/v1/health

## 📚 Documentation

- **Full Guide**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **Backend Control**: [BACKEND_CONTROL.md](BACKEND_CONTROL.md)
- **Frontend Control**: [FRONTEND_CONTROL.md](FRONTEND_CONTROL.md)
- **Main README**: [README.md](README.md)
