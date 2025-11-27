# Reporting Engine Frontend

A modern, responsive frontend for the Reporting Engine built with React, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Authentication**: JWT-based login with token management
- 📊 **Dashboard**: Key metrics and payment summaries
- 📋 **Transactions Table**: Sortable, filterable table with field-level permissions
- 🔍 **Transaction Details**: Detailed view of individual transactions
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 🔒 **Field-Level Permissions**: UI respects user role permissions
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if your API is on a different URL
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── TransactionsTable.tsx
│   ├── context/          # React context providers
│   │   └── AuthContext.tsx
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   └── TransactionDetail.tsx
│   ├── services/         # API service layer
│   │   └── api.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── format.ts
│   │   └── permissions.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Features in Detail

### Authentication

- Login page with email/password
- JWT token storage in localStorage
- Automatic token refresh on 401 errors
- Protected routes that redirect to login if not authenticated

### Dashboard

- **Key Metrics Cards**:
  - Total Due
  - Total Collected
  - Outstanding
  - Collection Rate
- **Payment Methods Breakdown**: Visual breakdown by payment method
- **Recent Transactions**: Quick view of latest transactions

### Transactions Table

- **Sorting**: Click column headers to sort
- **Filtering**: Filter by status and payment method
- **Search**: Search by student name or transaction ID
- **Pagination**: Navigate through pages
- **Field-Level Permissions**: Only shows fields accessible to user role
- **Row Click**: Click any row to view transaction details

### Transaction Detail Page

- Complete transaction information
- Student details (if accessible)
- Fee bill information (if linked)
- Transaction status history
- Additional metadata

### Field-Level Permissions

The UI respects backend field-level permissions:

- **Platform Admin / School Admin**: Can see all fields
- **Accountant**: Cannot see student email/phone (masked)
- **Teacher / Readonly**: Limited fields only

## Default Credentials

After seeding the backend database:

- **Platform Admin**: `admin@platform.com` / `password123`
- **School Admin**: `admin@school<id>.com` / `password123`
- **Accountant**: `accountant@school<id>.com` / `password123`

## API Integration

The frontend communicates with the backend API through the `apiService` in `src/services/api.ts`. All API calls include:

- Automatic JWT token injection
- Token refresh on 401 errors
- Error handling and toast notifications

## Styling

The app uses Tailwind CSS with a custom color scheme:

- **Primary Color**: Blue (`primary-600`)
- **Status Colors**: Green (success), Red (failed), Yellow (initiated)
- **Method Colors**: Different colors for each payment method

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Wrap with `ProtectedRoute` if authentication required

### Adding New API Endpoints

1. Add method to `src/services/api.ts`
2. Add types to `src/types/index.ts`
3. Use in components

### Customizing Styles

Edit `tailwind.config.js` to customize:
- Colors
- Spacing
- Typography
- Breakpoints

## Troubleshooting

### API Connection Issues

- Ensure backend is running on `http://localhost:3000`
- Check `.env` file has correct `VITE_API_URL`
- Check browser console for CORS errors

### Authentication Issues

- Clear localStorage and try logging in again
- Check that tokens are being stored correctly
- Verify backend JWT secret matches

### Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
