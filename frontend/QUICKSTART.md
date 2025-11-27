# Frontend Quick Start

Get the frontend running in 3 minutes!

## Prerequisites

- Backend API running on `http://localhost:3000`
- Node.js 18+ installed

## Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment (Optional)

```bash
cp .env.example .env
# Edit .env if your API is on a different URL
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Open in Browser

```
http://localhost:5173
```

### 5. Login

Use the default credentials:
- **Platform Admin**: `admin@platform.com` / `password123`
- **School Admin**: `admin@school<id>.com` / `password123`
- **Accountant**: `accountant@school<id>.com` / `password123`

## Features to Try

1. **Dashboard**: View key metrics and payment summaries
2. **Transactions Table**: 
   - Sort by clicking column headers
   - Filter by status and payment method
   - Search by student name or transaction ID
   - Click any row to view details
3. **Transaction Details**: See complete transaction information
4. **Field-Level Permissions**: 
   - Login as accountant to see masked email/phone
   - Login as teacher to see limited fields

## Troubleshooting

**API Connection Error?**
- Make sure backend is running on port 3000
- Check browser console for errors
- Verify CORS is enabled on backend

**Login Not Working?**
- Check backend is running and seeded
- Verify credentials match database
- Check browser console for errors

**Build Errors?**
```bash
rm -rf node_modules
npm install
npm run dev
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the code structure
- Customize styles in `tailwind.config.js`
- Add new features!

Happy coding! 🚀
