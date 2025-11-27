# Folder Rename Guide

## Can I Rename the Root Folder?

**Yes, you can rename the folder `sarthak` to any name you want!** The application is designed to work with relative paths, so renaming the folder won't break anything.

## What Will Be Affected?

### ✅ **Won't Be Affected** (Safe to Rename)

1. **Application Code** - All code uses relative paths
2. **Docker Compose** - Uses relative paths (`./src`, `./scripts`)
3. **Database** - Uses environment variables, not folder paths
4. **Frontend** - Uses relative paths and environment variables
5. **Configuration Files** - All use relative paths
6. **TypeScript/Node Config** - All relative paths

### ⚠️ **Will Need Updates** (Documentation Only)

1. **Documentation Files** - Examples in docs use absolute paths
2. **Scripts** - The `backend-control.sh` script now auto-detects the project root (fixed!)

## How to Rename

### Step 1: Stop All Services

```bash
# Stop backend
./scripts/backend-control.sh stop

# Stop frontend (Ctrl+C in terminal)

# Stop database
docker-compose stop
```

### Step 2: Rename the Folder

```bash
# From parent directory
cd /Users/nagmani/nag2mani/dev
mv sarthak new-folder-name
cd new-folder-name
```

### Step 3: Verify Everything Works

```bash
# Check backend control script
./scripts/backend-control.sh status

# Start services
docker-compose up -d postgres redis
./scripts/backend-control.sh start
cd frontend && npm run dev
```

## What's Already Fixed

The `backend-control.sh` script has been updated to automatically detect the project root directory, so it will work regardless of the folder name or location.

**Before (hardcoded):**
```bash
cd /Users/nagmani/nag2mani/dev/sarthak
```

**After (auto-detected):**
```bash
# Automatically detects project root from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
```

## Documentation Updates

The documentation files (`DEVELOPER_GUIDE.md`, `BACKEND_CONTROL.md`) contain example paths with `/Users/nagmani/nag2mani/dev/sarthak`. These are just examples - you can:

1. **Ignore them** - They're just documentation examples
2. **Update them** - Replace with your new folder name if you want
3. **Use relative paths** - Use `cd ..` or `cd project-root` instead

## Quick Test After Rename

```bash
# 1. Navigate to new folder
cd /path/to/new-folder-name

# 2. Test backend script
./scripts/backend-control.sh status

# 3. Test database connection
docker-compose ps

# 4. Start everything
docker-compose up -d postgres redis
./scripts/backend-control.sh start
cd frontend && npm run dev
```

## Summary

✅ **Safe to rename** - The application code doesn't depend on the folder name
✅ **Scripts fixed** - Backend control script auto-detects project root
⚠️ **Docs only** - Only documentation examples need updating (optional)

**You can rename the folder to anything you want without breaking the application!**
