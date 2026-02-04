# Port Configuration Update

## Changes Made

### Landing Page Port Changed
- **Old Port**: 5173
- **New Port**: 5174
- **Reason**: Port 5173 was being used by your portfolio, causing favicon conflicts

### Updated Files

1. **LandingPage-CMS/vite.config.ts**
   - Changed server port from 5173 to 5174

2. **CMS/client/src/pages/Login.tsx**
   - Updated "Back to Landing Page" button link from `http://localhost:5173` to `http://localhost:5174`

### Current Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3000 | http://localhost:3000 |
| CMS Frontend | 3001 | http://localhost:3001 |
| Landing Page | 5174 | http://localhost:5174 |

### How to Run

1. **Start Backend** (Terminal 1):
   ```bash
   cd CMS
   npm run dev
   ```

2. **Start CMS Frontend** (Terminal 2):
   ```bash
   cd CMS/client
   npm run dev
   ```

3. **Start Landing Page** (Terminal 3):
   ```bash
   cd LandingPage-CMS
   npm run dev
   ```

### Navigation Flow

1. User visits Landing Page: `http://localhost:5174`
2. Clicks "Login" → Redirects to: `http://localhost:3001/login`
3. After login → User dashboard at: `http://localhost:3001/dashboard`
4. "Back to Home" button on login page → Returns to: `http://localhost:5174`

### Notes

- The landing page will now run on port 5174, avoiding conflicts with your portfolio on port 5173
- Each service has its own favicon and branding
- All cross-references between services have been updated
