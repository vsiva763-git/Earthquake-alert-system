# 🚀 PART 2 SETUP GUIDE — Web Dashboard

Complete step-by-step guide for setting up and running the AI Earthquake Alert Dashboard.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- ✅ **Node.js 18+** installed (`node -v` to check)
- ✅ **npm** or **yarn** package manager
- ✅ **FastAPI backend** from Part 1 functional
- ✅ **XGBoost classifier model** trained (from Part 1 improvements)
- ✅ **Git** installed for cloning repository

---

## 🔧 Part 1: Backend Setup (FastAPI)

### 1. Navigate to Model Directory

```bash
cd Earthquake-alert-system/earthquake_model
```

### 2. Activate Virtual Environment

```bash
# If not already activated
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies (if not already)

```bash
pip install -r requirements.txt
```

### 4. Verify Model Files Exist

```bash
ls models/
# Should see: xgb_model.json, lstm_model.keras
```

### 5. Start FastAPI Server

```bash
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 6. Test API Health

Open browser or use curl:
```bash
curl http://localhost:8000/health
```

**Expected response**:
```json
{"status":"ok"}
```

### 7. Test Latest Alerts Endpoint

```bash
curl http://localhost:8000/latest-alerts
```

**Expected response**: `[]` (empty array initially)

---

## 🎨 Part 2: Dashboard Setup (React)

### 1. Navigate to Dashboard Directory

```bash
cd ../earthquake-dashboard
```

### 2. Install Node.js Dependencies

```bash
npm install
```

This installs:
- React 18 + React DOM
- react-leaflet + leaflet (maps)
- recharts (charts)
- zustand (state management)
- @tanstack/react-query (data fetching)
- axios (HTTP client)
- react-hot-toast (notifications)
- tailwindcss + autoprefixer + postcss
- vite (dev server)

**Expected output**: `added 200+ packages` (takes ~1-2 minutes)

### 3. Configure Environment Variables

Create or verify `.env` file:

```bash
cat .env
```

**Should contain**:
```env
VITE_API_URL=http://localhost:8000
VITE_IOT_IP=http://192.168.1.100
```

**If file doesn't exist**, create it:
```bash
echo "VITE_API_URL=http://localhost:8000" > .env
echo "VITE_IOT_IP=http://192.168.1.100" >> .env
```

### 4. Start Development Server

```bash
npm run dev
```

**Expected output**:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.xxx:5173/
```

### 5. Open Dashboard in Browser

Navigate to: **http://localhost:5173**

**You should see**:
- Header: "🔴 AI Earthquake Alert System"
- Live indicator (green pulsing dot)
- 4 stat cards (all showing 0 initially)
- Map centered on India
- Alert feed showing "No alerts yet — polling every 30s"
- IoT status showing "ESP8266 Offline" (expected if Part 3 not done)
- Two empty charts

---

## 🧪 Part 3: Testing the System

### Test 1: Manual Alert Creation

In a **new terminal**, trigger a test alert:

```bash
curl -X POST http://localhost:8000/alert \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.61,
    "longitude": 77.23,
    "depth_km": 10,
    "recent_events": []
  }'
```

**Expected Response**:
```json
{
  "status": "alert_created",
  "alert": {
    "predicted_magnitude": X.XX,
    "alert_level": "MID",
    "confidence": 0.XX,
    "location": "India",
    ...
  }
}
```

**In Dashboard** (within 30 seconds):
- ✅ Alert appears in feed
- ✅ Marker appears on map at Delhi (28.61°N, 77.23°E)
- ✅ Stat cards update (Total Alerts: 1)
- ✅ Charts populate with data point

### Test 2: High Alert (IoT Trigger)

Trigger a HIGH magnitude alert:

```bash
curl -X POST http://localhost:8000/alert \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 23.03,
    "longitude": 70.17,
    "depth_km": 5,
    "recent_events": [
      {
        "latitude": 23.0,
        "longitude": 70.0,
        "depth_km": 10,
        "magnitude": 6.5,
        "timestamp": "2026-02-17T10:00:00Z",
        "days_since_last_quake": 1,
        "seismic_zone": 5
      }
    ]
  }'
```

**Expected in Dashboard**:
- 🔴 **Red toast notification**: "🚨 HIGH ALERT — India M6.X"
- 🔴 **Alert feed** updated with HIGH badge (red, pulsing)
- 🔴 **IoT Status card** shows "Last HIGH Alert: ..."
- 🔴 **HTTP POST sent to ESP8266** (check browser console)

### Test 3: Live Feed (USGS Data)

```bash
curl http://localhost:8000/live-feed
```

This fetches real earthquakes from USGS API (last 2 days in India).

**Expected Response**: Alert data from actual seismic event (if any occurred)

**In Dashboard**: New alert appears automatically in next 30-second poll cycle

---

## 🔍 Verification Checklist

### ✅ Backend (FastAPI)
- [ ] `/health` returns `{"status":"ok"}`
- [ ] `/latest-alerts` returns array
- [ ] `/predict` accepts POST with lat/lon/depth
- [ ] `/alert` creates and stores alert
- [ ] `/live-feed` fetches USGS data
- [ ] CORS allows requests from `localhost:5173`

### ✅ Frontend (React Dashboard)
- [ ] Dashboard loads without errors
- [ ] Map renders with India center
- [ ] Stat cards display
- [ ] Alert feed scrollable
- [ ] Charts render (even if empty)
- [ ] IoT status card visible
- [ ] No console errors (press F12)

### ✅ Integration
- [ ] Manual alert appears in feed within 30s
- [ ] Map marker appears at correct coordinates
- [ ] Stat cards update automatically
- [ ] Charts populate with alert data
- [ ] HIGH alert fires toast notification
- [ ] Browser console shows IoT POST attempt

---

## 🐛 Troubleshooting

### Issue 1: Dashboard shows "Unable to connect to API"

**Symptoms**: Red error banner at top of dashboard

**Diagnosis**:
```bash
# Check FastAPI is running
curl http://localhost:8000/health

# Check FastAPI logs for errors
# (terminal where uvicorn is running)
```

**Solutions**:
- Restart FastAPI: `python -m uvicorn api.main:app --reload`
- Check port 8000 not in use: `lsof -i :8000`
- Verify `.env` has correct `VITE_API_URL`

---

### Issue 2: Map Not Rendering

**Symptoms**: Blank white box where map should be

**Diagnosis**: Open browser console (F12) and check for errors

**Solutions**:
- Verify leaflet CSS imported in `EarthquakeMap.jsx`
- Clear npm cache: `npm cache clean --force && npm install`
- Check browser supports WebGL (required for map tiles)

---

### Issue 3: Alerts Not Updating

**Symptoms**: Feed stays empty after manual alert

**Diagnosis**:
```bash
# Check backend received alert
curl http://localhost:8000/latest-alerts

# Should return array with your test alert
```

**Solutions**:
- Wait full 30 seconds for next poll cycle
- Check React Query is polling: Browser dev tools → Network tab → Filter "latest-alerts"
- Restart dev server: `Ctrl+C` then `npm run dev`

---

### Issue 4: Charts Not Displaying

**Symptoms**: Empty chart containers with "No data to display"

**Cause**: No alerts in system yet

**Solution**: Trigger at least 2-3 test alerts using curl commands above

---

### Issue 5: IoT Always Offline

**Expected Behavior**: Should show "Offline" until Part 3 ESP8266 is set up

**For Part 2 Testing**: This is normal. IoT status will connect in Part 3.

**To verify IoT POST is attempted**:
1. Open browser console (F12)
2. Trigger HIGH alert
3. Check for: `POST http://192.168.1.100/alert net::ERR_CONNECTION_REFUSED`
4. This confirms dashboard is trying to trigger IoT (correct behavior)

---

## 📊 Expected Performance

### Load Times
- **Initial page load**: <2 seconds
- **Map render**: <1 second
- **Alert poll**: ~200-500ms per request
- **Chart update**: <100ms

### Resource Usage
- **Memory**: ~50-80 MB (Chrome)
- **Network**: ~2 KB per 30-second poll
- **CPU**: <5% idle, <15% when rendering charts

---

## 🎯 Success Criteria

You've successfully completed Part 2 if:

1. ✅ Dashboard loads at `localhost:5173`
2. ✅ Map displays India with zoom controls
3. ✅ Manual alert via `/alert` appears in feed within 30s
4. ✅ Stat cards show correct counts
5. ✅ Charts populate with test alerts
6. ✅ HIGH alert fires red toast notification
7. ✅ IoT POST attempt visible in console
8. ✅ No JavaScript errors in browser console

---

## 🚀 Next Steps: Part 3 (IoT Integration)

Once Part 2 is verified working:

### Hardware Required
- ESP8266 NodeMCU board
- 16x2 LCD display (I2C)
- Active buzzer module
- 3x LEDs (green, yellow, red)
- Breadboard + jumper wires

### Part 3 Will Include
- ESP8266 Arduino sketch
- `/alert` endpoint implementation on device
- LCD display driver for alert messages
- Buzzer pattern for HIGH alerts
- LED indicators for alert levels
- Wiring diagram and assembly guide

---

## 📝 Development Mode Commands

### Backend
```bash
# Start FastAPI
cd earthquake_model
python -m uvicorn api.main:app --reload

# Run with custom port
python -m uvicorn api.main:app --reload --port 8080

# View API docs
# Open: http://localhost:8000/docs
```

### Frontend
```bash
# Start dev server
cd earthquake-dashboard
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clean install (if errors)
rm -rf node_modules package-lock.json
npm install
```

---

## 🔐 Production Deployment (Optional)

### Backend (FastAPI)
```bash
# Use gunicorn for production
pip install gunicorn
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Or use Docker
docker build -t earthquake-api .
docker run -p 8000:8000 earthquake-api
```

### Frontend (React)
```bash
# Build optimized bundle
npm run build

# Deploy to Vercel
npx vercel deploy

# Deploy to Netlify
npx netlify deploy --prod

# Or serve with nginx
npm run build
cp -r dist/* /var/www/html/
```

**Update environment variables for production**:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_IOT_IP=http://your-esp8266-public-ip
```

---

## 📞 Support

### Logs to Check
- **FastAPI**: Terminal where uvicorn is running
- **React**: Browser console (F12)
- **Network**: Browser DevTools → Network tab
- **React Query**: Install devtools `npm i @tanstack/react-query-devtools`

### Common Questions

**Q: Can I change the poll interval?**  
A: Yes, edit `earthquake-dashboard/src/hooks/useLatestAlerts.js` and change `refetchInterval: 30000` (value in milliseconds)

**Q: How do I add more markers to the map?**  
A: Call `/alert` endpoint multiple times with different lat/lon coordinates

**Q: Can I use a different map provider?**  
A: Yes, edit `TileLayer` URL in `EarthquakeMap.jsx`. See [Leaflet providers demo](https://leaflet-extras.github.io/leaflet-providers/preview/)

**Q: How do I customize alert thresholds (LOW/MID/HIGH)?**  
A: Edit `earthquake_model/src/alert_classifier.py` and adjust magnitude cutoffs

---

## ✅ Part 2 Completion Confirmation

When you can successfully:
1. Load dashboard
2. See test alerts on map
3. View charts with data
4. Trigger HIGH alert + see toast

**→ You are ready for Part 3 (IoT Device)**

---

**Last Updated**: February 2026  
**Version**: Part 2.0 — Web Dashboard Complete
