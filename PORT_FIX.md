# Port 3001 Error - Quick Fix

## Problem
You're getting `502 Bad Gateway` because you're accessing port **3001** but the app is running on port **3000**.

## Solution
Change your browser URL from:
```
https://vigilant-acorn-pj5jvp5q9r65f7grq-3001.app.github.dev/
```

To:
```
https://vigilant-acorn-pj5jvp5q9r65f7grq-3000.app.github.dev/
```

## Current Running Servers ✅
- **Frontend (Vite)**: Port 3000
- **Backend (Flask)**: Port 5001

Both servers are running correctly!

## If Still Having Issues

1. **Clear browser cache**: Ctrl+Shift+R (hard refresh)
2. **Close and reopen browser tab**
3. **Restart dev servers**:
   ```bash
   # Stop current servers (Ctrl+C)
   npm run dev
   ```

## Verify Servers Are Running
```bash
# Check running processes
ps aux | grep -E "(node|python)" | grep -v grep

# Check ports
lsof -i :3000 -i :5001 | grep LISTEN
```

You should see:
- node listening on port 3000 (Vite)
- python listening on port 5001 (Flask)

---

**TL;DR:** Just change 3001 to 3000 in your browser URL! 🚀
