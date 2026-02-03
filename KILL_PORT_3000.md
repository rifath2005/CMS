# How to Kill Process on Port 3000

## Error
```
Error: listen EADDRINUSE: address already in use :::3000
```

## Solution

### Option 1: Run the batch file
Double-click on `kill-port-3000.bat` in the CMS folder

### Option 2: Manual Command (CMD)
Open Command Prompt and run:
```cmd
netstat -ano | findstr :3000
```

This will show you the PID (Process ID) in the last column. Then run:
```cmd
taskkill /F /PID <PID_NUMBER>
```

Replace `<PID_NUMBER>` with the actual number you see.

### Option 3: Manual Command (PowerShell)
Open PowerShell and run:
```powershell
$process = Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id $process.Id -Force
```

### Option 4: Restart Your Computer
If the above methods don't work, simply restart your computer to free up all ports.

## After Killing the Process

Once the port is free, restart your backend server:
```bash
cd CMS
npm run dev
```

## Prevention

To avoid this issue in the future:
1. Always stop the server properly using `Ctrl+C` in the terminal
2. Close all terminal windows when done
3. Don't run multiple instances of the backend server
