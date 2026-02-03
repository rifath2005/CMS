# QR Scanner Camera Troubleshooting Guide

## Issue: "Unable to access camera" Error

### Common Causes & Solutions

## 1. HTTPS Requirement ⚠️

**Problem:** Camera access requires HTTPS (secure connection)

**Solution:**
- **Development:** Use `https://localhost:3000` instead of `http://localhost:3000`
- **Production:** Ensure your domain has SSL certificate installed
- **Quick Test:** `http://localhost` usually works without HTTPS

**Check:**
```bash
# Your current URL should start with https://
# Look for the lock icon 🔒 in the address bar
```

## 2. Camera Permission Denied 🚫

**Problem:** Browser blocked camera access or user denied permission

**Solution for Chrome:**
1. Click the lock icon (🔒) or info icon (ℹ️) in address bar
2. Find "Camera" in the permissions list
3. Change from "Block" to "Allow"
4. Refresh the page (F5 or Cmd+R)
5. Try clicking "Use Camera" again

**Solution for Firefox:**
1. Click the lock icon in address bar
2. Click "Connection secure" → "More information"
3. Go to "Permissions" tab
4. Find "Use the Camera" and click "Allow"
5. Refresh and try again

**Solution for Safari:**
1. Safari → Settings → Websites → Camera
2. Find your website in the list
3. Change to "Allow"
4. Refresh and try again

**Reset All Permissions:**
- Chrome: `chrome://settings/content/camera`
- Firefox: `about:preferences#privacy` → Permissions → Camera
- Safari: Safari → Settings → Websites → Camera

## 3. Camera Already in Use 📹

**Problem:** Another application is using the camera

**Solution:**
1. Close other apps that might use camera:
   - Video conferencing apps (Zoom, Teams, Meet)
   - Other browser tabs with camera access
   - Camera app
   - Skype, Discord, etc.
2. Try again

**Check on Windows:**
- Task Manager → Check for apps using camera

**Check on Mac:**
- Activity Monitor → Search for camera-related processes

## 4. No Camera Found 📷

**Problem:** Device doesn't have a camera or it's not detected

**Solution:**
1. Check if your device has a camera
2. Check if camera is enabled in BIOS/System Settings
3. Update camera drivers (Windows)
4. Try external webcam if available
5. Use "Manual Entry" as fallback

## 5. Browser Compatibility 🌐

**Problem:** Browser doesn't support camera access

**Supported Browsers:**
✅ Chrome 53+
✅ Firefox 36+
✅ Safari 11+
✅ Edge 79+
✅ Opera 40+
✅ Samsung Internet 6.2+

**Solution:**
- Update your browser to the latest version
- Try a different browser
- Use "Manual Entry" if browser not supported

## 6. Mobile-Specific Issues 📱

### Android:
1. Settings → Apps → Browser → Permissions → Camera → Allow
2. Ensure you're on HTTPS (required for mobile)
3. Try Chrome or Firefox browser

### iOS (iPhone/iPad):
1. Settings → Safari → Camera → Ask or Allow
2. Settings → Privacy → Camera → Enable for Safari
3. Must use Safari browser (Chrome on iOS uses Safari engine)
4. Ensure you're on HTTPS

## 7. Console Debugging 🔍

**Check Browser Console:**
1. Press F12 (or Cmd+Option+I on Mac)
2. Go to "Console" tab
3. Look for error messages when clicking "Use Camera"

**Common Error Messages:**

### `NotAllowedError` or `PermissionDeniedError`
- **Cause:** User denied permission or browser blocked
- **Fix:** Grant camera permission in browser settings

### `NotFoundError` or `DevicesNotFoundError`
- **Cause:** No camera detected
- **Fix:** Check camera connection, enable in system settings

### `NotReadableError` or `TrackStartError`
- **Cause:** Camera in use by another app
- **Fix:** Close other apps using camera

### `NotSupportedError`
- **Cause:** Not on HTTPS or browser doesn't support
- **Fix:** Use HTTPS or update browser

### `OverconstrainedError`
- **Cause:** Camera doesn't support requested settings
- **Fix:** Try different camera or adjust settings

## 8. Testing Camera Access

**Quick Test:**
1. Open browser console (F12)
2. Run this code:
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera access works!', stream)
    stream.getTracks().forEach(track => track.stop())
  })
  .catch(err => {
    console.error('❌ Camera error:', err.name, err.message)
  })
```

**Check Available Cameras:**
```javascript
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const cameras = devices.filter(d => d.kind === 'videoinput')
    console.log('Available cameras:', cameras)
  })
```

## 9. Development Environment Setup

### For Local Development (HTTPS):

**Option 1: Use localhost (usually works without HTTPS)**
```bash
npm run dev
# Access at http://localhost:3000
```

**Option 2: Use HTTPS with self-signed certificate**
```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update vite.config.ts
server: {
  https: {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  }
}
```

**Option 3: Use ngrok for HTTPS tunnel**
```bash
npm install -g ngrok
npm run dev
# In another terminal:
ngrok http 3000
# Use the https:// URL provided by ngrok
```

## 10. Fallback: Manual Entry

**If camera still doesn't work:**
1. Click "Manual Entry" button
2. Customer shows QR code
3. Customer reads the validation code below QR
4. Vendor types code manually
5. Click "Verify Order"

## Verification Checklist

Before reporting an issue, verify:

- [ ] Using HTTPS (or localhost)
- [ ] Camera permission granted in browser
- [ ] No other apps using camera
- [ ] Browser is up to date
- [ ] Camera works in other apps
- [ ] Tried different browser
- [ ] Checked browser console for errors
- [ ] Tried manual entry as fallback

## Still Not Working?

### Check Server Logs:
```bash
# Look for camera-related errors
npm run dev
# Check console output when clicking "Use Camera"
```

### Check Browser DevTools:
1. F12 → Console tab
2. Look for red error messages
3. Copy error message for debugging

### Test on Different Device:
- Try on mobile phone
- Try on different computer
- Try with external webcam

### Contact Support:
Provide this information:
- Browser name and version
- Operating system
- Error message from console
- Screenshot of the issue
- Whether manual entry works

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Permission denied | Browser settings → Camera → Allow |
| Not HTTPS | Use https:// or localhost |
| Camera in use | Close other apps |
| No camera found | Check device/drivers |
| Browser not supported | Update or switch browser |
| Mobile not working | Check app permissions |

## Success Indicators

✅ Camera permission prompt appears
✅ Video feed shows in scanner
✅ Scanning box visible
✅ QR codes detected automatically
✅ Orders verified successfully

If you see all of these, the scanner is working correctly!
