# Admin Panel - Canteen Management System

Admin panel for Main Admins and Institution Admins to manage institutions, canteens, and vendors.

## Features

### Main Admin
- Create and manage institutions
- Assign Institution Admin credentials
- View platform-level statistics

### Institution Admin
- Register canteens
- Approve/deactivate vendors
- Manage vendor accounts

## Development

```bash
# Install dependencies
npm install

# Start development server (port 3003)
npm run dev

# Build for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket server URL
