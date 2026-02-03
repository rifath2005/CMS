# Port Configuration - Complete Setup

## Current Port Assignments

### Backend (Express API)
- **Port**: `3000`
- **URL**: `http://localhost:3000`
- **Config**: `CMS/.env` → `PORT=3000`
- **Start**: `cd CMS && npm run dev`

### Frontend (CMS React App)
- **Port**: `3001`
- **URL**: `http://localhost:3001`
- **Config**: `CMS/client/vite.config.ts` → `port: 3001`
- **Start**: `cd CMS/client && npm run dev`
- **Routes**:
  - `/login` - Login/Signup page
  - `/dashboard` - User dashboard
  - `/admin/dashboard` - Admin dashboard
  - `/vendor/dashboard` - Vendor dashboard

### Landing Page (Separate App)
- **Port**: `5173`
- **URL**: `http://localhost:5173`
- **Config**: `LandingPage-CMS/vite.config.ts` → `port: 5173`
- **Start**: `cd LandingPage-CMS && npm run dev`

## Navigation Flow

```
Landing Page (5173)
    ↓ Click "Login" button
Login Page (3001/login)
    ↓ Click "Back to Home" button
Landing Page (5173)
    ↓ After successful login
Dashboard (3001/dashboard)
```

## Back Button Added

**Location**: Login page (top-left corner)

**Features**:
- ✅ Arrow icon with hover animation
- ✅ "Back to Home" text (hidden on mobile)
- ✅ Glass-morphism background
- ✅ Smooth transitions
- ✅ Links to landing page at `http://localhost:5173`

**Code**:
```tsx
<a 
  href="http://localhost:5173" 
  className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-2 text-slate-600 hover:text-[#ff7a00] transition-colors font-semibold text-sm group bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm"
>
  <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
  <span className="hidden sm:inline">Back to Home</span>
</a>
```

## How to Start Everything

### 1. Start Backend
```bash
cd CMS
npm run dev
```
✅ Backend running on `http://localhost:3000`

### 2. Start CMS Frontend
```bash
cd CMS/client
npm run dev
```
✅ CMS running on `http://localhost:3001`

### 3. Start Landing Page
```bash
cd LandingPage-CMS
npm run dev
```
✅ Landing page running on `http://localhost:5173`

## Testing the Flow

1. **Visit Landing Page**: `http://localhost:5173`
2. **Click "Login"**: Opens `http://localhost:3001/login` in new tab
3. **See Back Button**: Top-left corner of login page
4. **Click "Back to Home"**: Returns to `http://localhost:5173`
5. **Login**: Enter credentials and login
6. **Redirects to Dashboard**: `http://localhost:3001/dashboard`

## Files Modified

1. ✅ `CMS/client/src/pages/Login.tsx` - Added back button
2. ✅ `LandingPage-CMS/vite.config.ts` - Changed port from 3001 to 5173
3. ✅ `LandingPage-CMS/components/Navbar.tsx` - Updated login links to 3001/login

## Port Conflicts Resolved

**Before**:
- Landing Page: Port 3001 ❌
- CMS Frontend: Port 3001 ❌
- **Conflict!** Both trying to use same port

**After**:
- Landing Page: Port 5173 ✅
- CMS Frontend: Port 3001 ✅
- **No Conflict!** Each app has its own port

## Environment Variables

### Backend (.env)
```env
PORT=3000
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
```

### Frontend (Vite Proxy)
```ts
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## Troubleshooting

### Port Already in Use?
```bash
# Windows - Find process on port
netstat -ano | findstr :3001

# Kill process by PID
taskkill /F /PID <PID>
```

### Landing Page Won't Start?
- Make sure port 5173 is free
- Check if another Vite app is running
- Restart the terminal

### Login Button Not Working?
- Verify CMS frontend is running on 3001
- Check browser console for errors
- Ensure backend is running on 3000

## Quick Reference

| App | Port | URL | Purpose |
|-----|------|-----|---------|
| Backend | 3000 | http://localhost:3000 | API Server |
| CMS Frontend | 3001 | http://localhost:3001 | Main App |
| Landing Page | 5173 | http://localhost:5173 | Marketing Site |

---

**Status**: COMPLETE ✅  
**Date**: February 3, 2026  
**All ports configured and tested**
