# How to Update Queal Changes 🔄

## The Issue
Changes were made to the code but they're not showing up in the browser.

## Why This Happens
- **Backend changes** need server restart
- **Frontend changes** need either:
  - Dev server to be running (auto-reloads)
  - Hard refresh in browser
  - Sometimes rebuild

## Solution: Step-by-Step

### Step 1: Restart Backend Server
```bash
# Navigate to CMS folder
cd CMS

# Stop the server if running (Ctrl+C)
# Then start it again
npm run dev
```

**Wait for:** `Server running on port 3000` or similar message

### Step 2: Check Frontend Dev Server

#### Option A: If Frontend Server is Running
```bash
# In a NEW terminal window
cd CMS/client

# Check if dev server is running
# If not, start it:
npm run dev
```

**Wait for:** `Local: http://localhost:5173` or similar message

#### Option B: If You're Not Sure
1. Open a new terminal
2. Navigate to `CMS/client`
3. Run `npm run dev`
4. If it says "port already in use", it's already running ✅

### Step 3: Hard Refresh Browser
This is the most important step!

**Windows/Linux:**
- Press `Ctrl + Shift + R`
- Or `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`

**Alternative:**
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 4: Verify Changes

#### Check Backend Changes:
1. Look at the terminal where backend is running
2. You should see console.log messages when you use Queal
3. Example: `AI Process Order - User: ...`

#### Check Frontend Changes:
1. Click the Queal button
2. Check if header/footer are smaller
3. Try ordering from different canteens
4. Should show error message

## Quick Checklist

- [ ] Backend server restarted (`cd CMS && npm run dev`)
- [ ] Frontend server running (`cd CMS/client && npm run dev`)
- [ ] Hard refresh browser (`Ctrl + Shift + R`)
- [ ] Clear browser cache if needed
- [ ] Check both terminals for errors

## Common Issues

### Issue 1: Changes Still Not Showing
**Solution:**
1. Stop both servers (Ctrl+C in both terminals)
2. Clear browser cache completely
3. Restart backend: `cd CMS && npm run dev`
4. Restart frontend: `cd CMS/client && npm run dev`
5. Hard refresh browser

### Issue 2: Port Already in Use
**Solution:**
```bash
# Windows - Kill process on port 3000 (backend)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

### Issue 3: TypeScript Errors
**Solution:**
```bash
# In CMS folder
npm run build

# In CMS/client folder
npm run build
```

## Files That Were Changed

### Backend Files (Need Server Restart):
1. `CMS/src/services/ai/AIOrderService.ts`
   - Added "need" intent detection
   - Show canteens with product
   - Wallet balance check
   - Better error messages

2. `CMS/src/routes/ai.routes.ts`
   - Fixed userId access
   - Added cart items parameter

### Frontend Files (Need Hard Refresh):
1. `CMS/client/src/components/AIAssistant.tsx`
   - Smaller header/footer
   - Cart validation
   - Simplified welcome message

## Verification Steps

### Test 1: Smaller UI
1. Open Queal
2. Header should be smaller (less padding)
3. Footer should be smaller

### Test 2: "I need" Intent
1. Type: `I need 2 coffee`
2. Should recognize as order
3. Should show canteens with coffee

### Test 3: Cart Validation
1. Add tea from Main Canteen
2. Try to add coffee from Cafeteria
3. Should show error: "You already have items from Main Canteen..."

### Test 4: Wallet Balance
1. Try to order more than wallet balance
2. Should show: "You have ₹X but need ₹Y. Add ₹Z"

## Still Not Working?

### Nuclear Option (Complete Reset):
```bash
# 1. Stop all servers (Ctrl+C in all terminals)

# 2. Kill all node processes
taskkill /F /IM node.exe

# 3. Clear npm cache
cd CMS
npm cache clean --force
cd client
npm cache clean --force

# 4. Reinstall dependencies (if needed)
cd ..
npm install
cd client
npm install

# 5. Start fresh
cd ..
npm run dev

# In new terminal:
cd client
npm run dev

# 6. Hard refresh browser (Ctrl+Shift+R)
```

## Quick Commands

### Start Everything:
```bash
# Terminal 1 - Backend
cd CMS
npm run dev

# Terminal 2 - Frontend
cd CMS/client
npm run dev
```

### Check if Running:
```bash
# Check backend (port 3000)
netstat -ano | findstr :3000

# Check frontend (port 5173)
netstat -ano | findstr :5173
```

## Expected Output

### Backend Terminal:
```
Server running on http://localhost:3000
Database connected successfully
WebSocket server initialized
```

### Frontend Terminal:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Browser Console (F12):
- No errors in red
- Should see API calls to `/api/ai/process-order`

---

## TL;DR (Too Long; Didn't Read)

**Just do this:**
1. `cd CMS && npm run dev` (Terminal 1)
2. `cd CMS/client && npm run dev` (Terminal 2)
3. Press `Ctrl + Shift + R` in browser
4. Test Queal

**If still not working:**
- Kill all node processes: `taskkill /F /IM node.exe`
- Start again from step 1
- Clear browser cache completely

---

**Need Help?**
Check the terminal outputs for error messages and share them.
